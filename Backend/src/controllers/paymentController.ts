import { Request, Response } from 'express';
import payosService from '../services/payosService';
import PaymentTracking from '../models/PaymentTracking';
import Appointments from '../models/Appointments';
import { AuthRequest } from '../types/auth';

export class PaymentController {
  // Tạo payment link cho appointment
  createPaymentLink = async (req: AuthRequest, res: Response) => {
    try {
      const { appointmentId } = req.params;
      const userId = req.user?._id;

      const appointment = await Appointments.findOne({
        _id: appointmentId,
        createdByUserId: userId,
        status: 'pending_payment'
      }).populate('serviceId').populate('packageId');

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment không tồn tại hoặc không thể thanh toán'
        });
      }

      const existingPayment = await PaymentTracking.findOne({
        appointmentId: appointmentId
      });

      if (existingPayment && existingPayment.status === 'success') {
        return res.status(400).json({
          message: 'Appointment này đã được thanh toán'
        });
      }

      // Tính toán amount từ service hoặc package
      let amount = appointment.totalAmount || 0;

      // Nếu totalAmount = 0, tính lại từ service/package
      if (amount === 0) {
        if (appointment.serviceId) {
          const serviceData = (appointment.serviceId as any);
          amount = serviceData.price || 0;
        } else if (appointment.packageId) {
          const packageData = (appointment.packageId as any);
          amount = packageData.price || 0;
        }
      }

      // Validate amount
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Không thể tạo thanh toán với số tiền bằng 0. Vui lòng kiểm tra lại dịch vụ hoặc gói.',
          error: 'INVALID_AMOUNT'
        });
      }
      const serviceName = (appointment.serviceId as any)?.serviceName || (appointment.packageId as any)?.name || 'Dịch vụ y tế';

      // PayOS chỉ cho phép description tối đa 25 ký tự
      let description = `Thanh toán - ${serviceName}`;
      if (description.length > 25) {
        // Cắt ngắn serviceName để fit trong 25 ký tự
        const maxServiceNameLength = 25 - 'Thanh toán - '.length;
        const shortServiceName = serviceName.substring(0, maxServiceNameLength);
        description = `Thanh toán - ${shortServiceName}`;
      }

      const paymentData = await payosService.createPaymentLink({
        appointmentId: appointmentId,
        amount,
        description,
        customerName: req.user?.fullName || 'Khách hàng',
        customerEmail: req.user?.email,
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?appointmentId=${appointmentId}`,
        cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel?appointmentId=${appointmentId}`
      });

      let paymentTracking;
      if (existingPayment) {
        existingPayment.orderCode = paymentData.orderCode;
        existingPayment.amount = amount;
        existingPayment.description = description;
        existingPayment.status = 'pending';
        existingPayment.paymentUrl = paymentData.checkoutUrl;
        existingPayment.paymentLinkId = paymentData.paymentLinkId;
        existingPayment.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        paymentTracking = await existingPayment.save();
      } else {
        paymentTracking = await PaymentTracking.create({
          appointmentId: appointmentId,
          orderCode: paymentData.orderCode,
          paymentLinkId: paymentData.paymentLinkId,
          paymentGateway: 'payos',
          amount,
          description,
          customerName: req.user?.fullName || 'Khách hàng',
          customerEmail: req.user?.email,
          status: 'pending',
          paymentUrl: paymentData.checkoutUrl
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Tạo payment link thành công',
        data: {
          paymentUrl: paymentData.checkoutUrl,
          orderCode: paymentData.orderCode,
          amount: amount,
          qrCode: paymentData.qrCode,
          expiredAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        }
      });

    } catch (error) {
      console.error('Error creating payment link:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi tạo payment link',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Webhook handler cho PayOS
  payosWebhook = async (req: Request, res: Response) => {
    try {
      const webhookData = req.body;
      const { orderCode, code, desc, data } = webhookData;

      const paymentTracking = await PaymentTracking.findOne({ orderCode });
      if (!paymentTracking) {
        console.error(`Payment tracking not found for orderCode: ${orderCode}`);
        return res.status(404).json({ message: 'Payment not found' });
      }

      const appointment = await Appointments.findById(paymentTracking.appointmentId);
      if (!appointment) {
        console.error(`Appointment not found for ID: ${paymentTracking.appointmentId}`);
        return res.status(404).json({ message: 'Appointment not found' });
      }

      if (code === '00') {
        await paymentTracking.updatePaymentStatus('success', {
          reference: data?.reference,
          transactionDateTime: data?.transactionDateTime,
          counterAccountInfo: data?.counterAccountInfo,
          virtualAccount: data?.virtualAccount
        }, true);

        appointment.status = 'confirmed';
        appointment.paymentStatus = 'paid';
        appointment.paidAt = new Date();
        await appointment.save();

        console.log(`Payment successful for orderCode: ${orderCode}`);
      } else {
        await paymentTracking.updatePaymentStatus('failed', {
          code,
          desc
        }, true);

        if (appointment.status === 'pending_payment') {
          appointment.status = 'pending';
        }
        await appointment.save();

        console.log(`Payment failed for orderCode: ${orderCode}, reason: ${desc}`);
      }

      return res.status(200).json({ message: 'Webhook processed successfully' });

    } catch (error) {
      console.error('Error processing PayOS webhook:', error);
      return res.status(500).json({
        message: 'Error processing webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Check payment status
  checkPaymentStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { appointmentId } = req.params;
      const userId = req.user?._id;

      console.log('🔍 [PaymentController] Checking payment status for appointment:', appointmentId, 'user:', userId);

      const appointment = await Appointments.findOne({
        _id: appointmentId,
        createdByUserId: userId
      });

      if (!appointment) {
        console.log('❌ [PaymentController] Appointment not found');
        return res.status(404).json({
          success: false,
          message: 'Appointment không tồn tại'
        });
      }

      console.log('📋 [PaymentController] Current appointment status:', appointment.status);

      const paymentTracking = await PaymentTracking.findOne({
        appointmentId: appointmentId
      });

      if (!paymentTracking) {
        console.log('❌ [PaymentController] Payment tracking not found');
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin thanh toán'
        });
      }

      console.log('💳 [PaymentController] Payment tracking status:', paymentTracking.status);
      console.log('💳 [PaymentController] OrderCode:', paymentTracking.orderCode);

      // ALWAYS check PayOS status nếu appointment vẫn pending_payment
      if (appointment.status === 'pending_payment' || paymentTracking.status === 'pending') {
        console.log('🔄 [PaymentController] Checking with PayOS for latest status...');

        try {
          const paymentInfo = await payosService.getPaymentStatus(
            paymentTracking.orderCode
          );

          console.log('[PaymentController] PayOS status response:', paymentInfo.status);

          if (paymentInfo.status === 'PAID') {
            console.log('[PaymentController] Payment CONFIRMED by PayOS - updating appointment...');

            await paymentTracking.updatePaymentStatus('success', {
              reference: paymentInfo.transactions?.[0]?.reference,
              transactionDateTime: paymentInfo.transactions?.[0]?.transactionDateTime
            });

            appointment.status = 'confirmed';
            appointment.paymentStatus = 'paid';
            appointment.paidAt = new Date();
            await appointment.save();

            console.log('[PaymentController] Appointment status updated to confirmed');

          } else if (paymentInfo.status === 'CANCELLED') {
            console.log('PaymentController] Payment cancelled by PayOS');
            await paymentTracking.updatePaymentStatus('cancelled');
          } else {
            console.log('[PaymentController] Payment still pending in PayOS');
          }
        } catch (error) {
          console.error('[PaymentController] Error checking PayOS status:', error);
        }
      }

      // Refresh appointment data after potential update
      const updatedAppointment = await Appointments.findById(appointmentId);

      if (!updatedAppointment) {
        console.log('[PaymentController] Updated appointment not found');
        return res.status(404).json({
          success: false,
          message: 'Appointment không tồn tại sau khi cập nhật'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Lấy trạng thái thanh toán thành công',
        data: {
          orderCode: paymentTracking.orderCode,
          status: paymentTracking.status,
          amount: paymentTracking.amount,
          appointmentStatus: updatedAppointment.status,
          paymentStatus: updatedAppointment.paymentStatus,
          paidAt: updatedAppointment.paidAt,
          createdAt: paymentTracking.createdAt,
          webhookReceived: paymentTracking.webhookReceived
        }
      });

    } catch (error) {
      console.error('Error checking payment status:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra trạng thái thanh toán',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Cancel payment
  cancelPayment = async (req: AuthRequest, res: Response) => {
    try {
      const { appointmentId } = req.params;
      const userId = req.user?._id;

      const appointment = await Appointments.findOne({
        _id: appointmentId,
        createdByUserId: userId,
        status: 'pending_payment'
      });

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment không tồn tại hoặc không thể hủy thanh toán'
        });
      }

      const paymentTracking = await PaymentTracking.findOne({
        appointmentId: appointmentId,
        status: 'pending'
      });

      if (!paymentTracking) {
        return res.status(404).json({
          message: 'Không tìm thấy payment đang chờ để hủy'
        });
      }

      try {
        await payosService.cancelPaymentLink(
          paymentTracking.orderCode,
          'Người dùng hủy thanh toán'
        );
      } catch (error) {
        console.error('Error canceling PayOS payment:', error);
      }

      await paymentTracking.updatePaymentStatus('cancelled');

      appointment.status = 'pending';
      await appointment.save();

      return res.status(200).json({
        message: 'Hủy thanh toán thành công'
      });

    } catch (error) {
      console.error('Error canceling payment:', error);
      return res.status(500).json({
        message: 'Lỗi hủy thanh toán',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Fast confirm payment khi đã có status=PAID từ PayOS URL
  fastConfirmPayment = async (req: AuthRequest, res: Response) => {
    try {
      const { appointmentId, orderCode, status } = req.body;
      const userId = req.user?._id;

      console.log('🚀 [PaymentController] Fast confirm payment:', { appointmentId, orderCode, status, userId });

      // Validate required fields
      if (!appointmentId || !orderCode || !status) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin cần thiết: appointmentId, orderCode, status'
        });
      }

      // Chỉ chấp nhận status PAID
      if (status !== 'PAID') {
        return res.status(400).json({
          success: false,
          message: 'Chỉ chấp nhận thanh toán thành công (status=PAID)'
        });
      }

      // Tìm appointment
      const appointment = await Appointments.findOne({
        _id: appointmentId,
        createdByUserId: userId
      });

      if (!appointment) {
        console.log('❌ [PaymentController] Appointment not found for fast confirm');
        return res.status(404).json({
          success: false,
          message: 'Appointment không tồn tại'
        });
      }

      // Nếu đã confirmed rồi thì trả về thành công luôn
      if ((appointment.status as any) === 'confirmed') {
        console.log('✅ [PaymentController] Appointment already confirmed');
        return res.status(200).json({
          success: true,
          message: 'Cuộc hẹn đã được xác nhận trước đó',
          data: {
            appointmentStatus: appointment.status,
            paymentStatus: appointment.paymentStatus,
            paidAt: appointment.paidAt
          }
        });
      }

      // Tìm payment tracking
      const paymentTracking = await PaymentTracking.findOne({
        appointmentId: appointmentId,
        orderCode: parseInt(orderCode)
      });

      if (!paymentTracking) {
        console.log('❌ [PaymentController] Payment tracking not found for fast confirm');
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin thanh toán với orderCode này'
        });
      }

      // Nếu payment đã success rồi thì trả về luôn
      if (paymentTracking.status === 'success') {
        console.log('✅ [PaymentController] Payment already success');
        // Đảm bảo appointment cũng đã confirmed
        if ((appointment.status as any) !== 'confirmed') {
          (appointment.status as any) = 'confirmed';
          (appointment.paymentStatus as any) = 'paid';
          appointment.paidAt = new Date();
          await appointment.save();
        }

        return res.status(200).json({
          success: true,
          message: 'Thanh toán đã được xác nhận trước đó',
          data: {
            appointmentStatus: 'confirmed',
            paymentStatus: 'paid',
            paidAt: appointment.paidAt
          }
        });
      }

      // FAST UPDATE - Tin tưởng status=PAID từ PayOS URL
      console.log('⚡ [PaymentController] Fast updating payment status to success...');

      // Update payment tracking
      await paymentTracking.updatePaymentStatus('success', {
        fastConfirmTimestamp: new Date(),
        statusFromUrl: status
      });

      // Update appointment
      (appointment.status as any) = 'confirmed';
      (appointment.paymentStatus as any) = 'paid';
      appointment.paidAt = new Date();
      await appointment.save();

      console.log('✅ [PaymentController] Fast confirm completed successfully');

      return res.status(200).json({
        success: true,
        message: 'Xác nhận thanh toán nhanh thành công',
        data: {
          orderCode: paymentTracking.orderCode,
          appointmentStatus: appointment.status,
          paymentStatus: appointment.paymentStatus,
          paidAt: appointment.paidAt,
          fastConfirmed: true
        }
      });

    } catch (error) {
      console.error('❌ [PaymentController] Error in fast confirm payment:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi xác nhận thanh toán nhanh',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export default new PaymentController();