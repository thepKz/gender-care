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

      const amount = appointment.totalAmount || 0;
      const serviceName = (appointment.serviceId as any)?.serviceName || (appointment.packageId as any)?.name || 'Dịch vụ y tế';
      const description = `Thanh toán lịch khám - ${serviceName}`;

      const paymentData = await payosService.createPaymentLink({
        appointmentId: appointmentId,
        amount,
        description,
        customerName: req.user?.fullName || 'Khách hàng',
        customerEmail: req.user?.email,
        returnUrl: `${process.env.FRONTEND_URL}/payment/success?appointmentId=${appointmentId}`,
        cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel?appointmentId=${appointmentId}`
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
        message: 'Tạo payment link thành công',
        data: {
          paymentUrl: paymentData.checkoutUrl,
          orderCode: paymentData.orderCode,
          amount: amount,
          qrCode: paymentData.qrCode
        }
      });

    } catch (error) {
      console.error('Error creating payment link:', error);
      return res.status(500).json({
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

      const appointment = await Appointments.findOne({ 
        _id: appointmentId,
        createdByUserId: userId
      });

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment không tồn tại'
        });
      }

      const paymentTracking = await PaymentTracking.findOne({ 
        appointmentId: appointmentId 
      });

      if (!paymentTracking) {
        return res.status(404).json({
          message: 'Không tìm thấy thông tin thanh toán'
        });
      }

      if (paymentTracking.status === 'pending') {
        try {
          const paymentInfo = await payosService.getPaymentStatus(
            paymentTracking.orderCode
          );

          if (paymentInfo.status === 'PAID') {
            await paymentTracking.updatePaymentStatus('success', {
              reference: paymentInfo.transactions?.[0]?.reference,
              transactionDateTime: paymentInfo.transactions?.[0]?.transactionDateTime
            });

            appointment.status = 'confirmed';
            appointment.paymentStatus = 'paid';
            appointment.paidAt = new Date();
            await appointment.save();
          } else if (paymentInfo.status === 'CANCELLED') {
            await paymentTracking.updatePaymentStatus('cancelled');
          }
        } catch (error) {
          console.error('Error checking PayOS status:', error);
        }
      }

      return res.status(200).json({
        message: 'Lấy trạng thái thanh toán thành công',
        data: {
          orderCode: paymentTracking.orderCode,
          status: paymentTracking.status,
          amount: paymentTracking.amount,
          appointmentStatus: appointment.status,
          paymentStatus: appointment.paymentStatus,
          paidAt: appointment.paidAt,
          createdAt: paymentTracking.createdAt,
          webhookReceived: paymentTracking.webhookReceived
        }
      });

    } catch (error) {
      console.error('Error checking payment status:', error);
      return res.status(500).json({
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
} 