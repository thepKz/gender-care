import { Request, Response } from 'express';
import Appointments from '../models/Appointments';
import DoctorQA from '../models/DoctorQA';
import PaymentTracking from '../models/PaymentTracking';
import '../models/Service';
import '../models/ServicePackages';
import { PackagePurchaseService } from '../services/packagePurchaseService';
import payosService from '../services/payosService';
import { AuthRequest } from '../types/auth';
import { sendConsultationPaymentSuccessEmail } from '../services/emails';

export class PaymentController {
  // Payment controller handles all payment-related operations
  
  // Tạo payment link cho consultation
  createConsultationPaymentLink = async (req: AuthRequest, res: Response) => {
    try {
      const { qaId } = req.params;
      const userId = req.user?._id;

      const consultation = await DoctorQA.findOne({
        _id: qaId,
        userId: userId,
        status: { $in: ['pending', 'pending_payment'] }
      });

      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Consultation không tồn tại hoặc không thể thanh toán'
        });
      }

      const existingPayment = await PaymentTracking.findOne({
        recordId: qaId,
        serviceType: 'consultation'
      });

      if (existingPayment && existingPayment.status === 'success') {
        return res.status(400).json({
          success: false,
          message: 'Consultation này đã được thanh toán'
        });
      }

      const amount = consultation.consultationFee;

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Không thể tạo thanh toán với số tiền bằng 0',
          error: 'INVALID_AMOUNT'
        });
      }

      const description = 'Tư vấn trực tuyến';

      // Update consultation status to pending_payment nếu không phải là scheduled
      if (consultation.status !== 'scheduled') {
        consultation.status = 'pending_payment';
        await consultation.save();
        console.log('📝 Updated consultation status to pending_payment');
      }

      const paymentData = await payosService.createPaymentLink({
        recordId: qaId,
        serviceType: 'consultation',
        amount,
        description,
        customerName: req.user?.fullName || consultation.fullName,
        customerEmail: req.user?.email,
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/consultation/success?qaId=${qaId}`,
        cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/online-consultation`
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
          serviceType: 'consultation',
          recordId: qaId,
          orderCode: paymentData.orderCode,
          paymentLinkId: paymentData.paymentLinkId,
          paymentGateway: 'payos',
          amount,
          description,
          customerName: req.user?.fullName || consultation.fullName,
          customerEmail: req.user?.email,
          customerPhone: consultation.phone,
          status: 'pending',
          paymentUrl: paymentData.checkoutUrl
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Tạo payment link cho consultation thành công',
        data: {
          paymentUrl: paymentData.checkoutUrl,
          orderCode: paymentData.orderCode,
          amount: amount,
          qrCode: paymentData.qrCode,
          expiredAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        }
      });

    } catch (error) {
      console.error('Error creating consultation payment link:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi tạo payment link cho consultation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

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
        recordId: appointmentId,
        serviceType: 'appointment'
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

      // Validate required fields
      if (!req.body.returnUrl || !req.body.cancelUrl) {
        return res.status(400).json({
          success: false,
          message: 'returnUrl và cancelUrl là bắt buộc'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount phải lớn hơn 0'
        });
      }

      console.log('💳 [CreatePaymentLink] Creating payment for appointment:', {
        appointmentId,
        amount,
        bookingType: appointment.bookingType,
        hasService: !!appointment.serviceId,
        hasPackage: !!appointment.packageId
      });
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
        recordId: appointmentId,
        serviceType: 'appointment',
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
        existingPayment.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        paymentTracking = await existingPayment.save();
      } else {
        paymentTracking = await PaymentTracking.create({
          serviceType: 'appointment',
          recordId: appointmentId,
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
          expiredAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
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

      console.log(`📥 Webhook received for ${paymentTracking.serviceType} service`);

      if (paymentTracking.serviceType === 'appointment') {
        const appointment = await Appointments.findById(paymentTracking.recordId);
        if (!appointment) {
          console.error(`Appointment not found for ID: ${paymentTracking.recordId}`);
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

          console.log(`✅ Appointment payment successful for orderCode: ${orderCode}`);
        } else {
          await paymentTracking.updatePaymentStatus('failed', { code, desc }, true);
          if (appointment.status === 'pending_payment') {
            appointment.status = 'pending';
          }
          await appointment.save();
          console.log(`❌ Appointment payment failed for orderCode: ${orderCode}, reason: ${desc}`);
        }

      } else if (paymentTracking.serviceType === 'consultation') {
        const consultation = await DoctorQA.findById(paymentTracking.recordId);
        if (!consultation) {
          console.error(`Consultation not found for ID: ${paymentTracking.recordId}`);
          return res.status(404).json({ message: 'Consultation not found' });
        }

        if (code === '00') {
          await paymentTracking.updatePaymentStatus('success', {
            reference: data?.reference,
            transactionDateTime: data?.transactionDateTime,
            counterAccountInfo: data?.counterAccountInfo,
            virtualAccount: data?.virtualAccount
          }, true);

          consultation.status = 'scheduled';
          await consultation.save();

          console.log(`✅ Consultation payment successful for orderCode: ${orderCode}`);
        } else {
          await paymentTracking.updatePaymentStatus('failed', { code, desc }, true);
          console.log(`❌ Consultation payment failed for orderCode: ${orderCode}, reason: ${desc}`);
        }
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
        recordId: appointmentId,
        serviceType: 'appointment'
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

            // 🔹 Xử lý payment thành công cho appointment
            appointment.status = 'confirmed';
            appointment.paymentStatus = 'paid';
            appointment.paidAt = new Date();
            await appointment.save();

            // 🔹 CRITICAL: Tạo PackagePurchase nếu là new_package booking
            if (appointment.bookingType === 'new_package' && appointment.packageId && !appointment.packagePurchaseId) {
              try {
                console.log(`🎯 [CheckPayment] Creating PackagePurchase for new_package appointment ${appointment._id}`);
                
                const packagePurchase = await PackagePurchaseService.purchasePackage(
                  appointment.createdByUserId.toString(),
                  appointment.packageId.toString(),
                  appointment.totalAmount || 0
                );

                console.log(`✅ [CheckPayment] PackagePurchase created successfully: ${packagePurchase._id}`);
                
                // Update appointment với packagePurchaseId reference
                appointment.packagePurchaseId = packagePurchase._id;
                await appointment.save();
                
              } catch (packageError) {
                console.error(`❌ [CheckPayment] Error creating PackagePurchase for appointment ${appointment._id}:`, packageError);
                // Note: Không throw error để không block appointment confirmation
              }
            }

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

  // Check consultation payment status
  checkConsultationPaymentStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { qaId } = req.params;
      const userId = req.user?._id;

      console.log('🔍 [PaymentController] Checking consultation payment status for QA:', qaId, 'user:', userId);

      const consultation = await DoctorQA.findOne({
        _id: qaId,
        userId: userId
      });

      if (!consultation) {
        console.log('❌ [PaymentController] Consultation not found');
        return res.status(404).json({
          success: false,
          message: 'Consultation không tồn tại'
        });
      }

      console.log('📋 [PaymentController] Current consultation status:', consultation.status);

      const paymentTracking = await PaymentTracking.findOne({
        recordId: qaId,
        serviceType: 'consultation'
      });

      if (!paymentTracking) {
        console.log('❌ [PaymentController] Consultation payment tracking not found');
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin thanh toán cho consultation này'
        });
      }

      // Check PayOS status if still pending
      if (consultation.status === 'pending_payment' || paymentTracking.status === 'pending') {
        console.log('🔄 [PaymentController] Checking consultation with PayOS...');

        try {
          const paymentInfo = await payosService.getPaymentStatus(paymentTracking.orderCode);

          if (paymentInfo.status === 'PAID') {
            console.log('[PaymentController] Consultation payment CONFIRMED by PayOS');

            await paymentTracking.updatePaymentStatus('success', {
              reference: paymentInfo.transactions?.[0]?.reference,
              transactionDateTime: paymentInfo.transactions?.[0]?.transactionDateTime
            });

            consultation.status = 'scheduled';
            await consultation.save();

            console.log('[PaymentController] Consultation status updated to scheduled');
          } else if (paymentInfo.status === 'CANCELLED') {
            await paymentTracking.updatePaymentStatus('cancelled');
          }
        } catch (error) {
          console.error('[PaymentController] Error checking consultation PayOS status:', error);
        }
      }

      // Refresh consultation data
      const updatedConsultation = await DoctorQA.findById(qaId);

      return res.status(200).json({
        success: true,
        message: 'Lấy trạng thái thanh toán consultation thành công',
        data: {
          orderCode: paymentTracking.orderCode,
          status: paymentTracking.status,
          amount: paymentTracking.amount,
          consultationStatus: updatedConsultation?.status,
          createdAt: paymentTracking.createdAt,
          webhookReceived: paymentTracking.webhookReceived
        }
      });

    } catch (error) {
      console.error('Error checking consultation payment status:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra trạng thái thanh toán consultation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Cancel payment
  cancelPayment = async (req: AuthRequest, res: Response) => {
    try {
      const { appointmentId } = req.params;
      const userId = req.user?._id;

      console.log('🔄 [CancelPayment] Starting cancel for appointment:', appointmentId, 'user:', userId);

      const appointment = await Appointments.findOne({
        _id: appointmentId,
        createdByUserId: userId,
        status: 'pending_payment'
      });

      if (!appointment) {
        console.log('❌ [CancelPayment] Appointment not found or cannot cancel');
        return res.status(404).json({
          success: false,
          message: 'Appointment không tồn tại hoặc không thể hủy thanh toán'
        });
      }

      console.log('✅ [CancelPayment] Appointment found, looking for payment tracking...');

      const paymentTracking = await PaymentTracking.findOne({
        recordId: appointmentId,
        serviceType: 'appointment',
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

      if (paymentTracking.status === 'pending') {
        await paymentTracking.updatePaymentStatus('cancelled');
        console.log('✅ [CancelPayment] PaymentTracking status updated to cancelled');
      } else {
        console.log('⚠️ [CancelPayment] PaymentTracking already in status:', paymentTracking.status);
      }

      appointment.status = 'payment_cancelled';
      await appointment.save();
      console.log('✅ [CancelPayment] Appointment status updated to payment_cancelled');

      return res.status(200).json({
        success: true,
        message: 'Hủy thanh toán thành công'
      });

    } catch (error) {
      console.error('❌ [CancelPayment] Error canceling payment:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi hủy thanh toán',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Cancel consultation payment
  cancelConsultationPayment = async (req: AuthRequest, res: Response) => {
    try {
      const { qaId } = req.params;
      const userId = req.user?._id;

      const consultation = await DoctorQA.findOne({
        _id: qaId,
        userId: userId,
        status: { $in: ['pending', 'pending_payment'] }
      });

      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Consultation không tồn tại hoặc không thể hủy thanh toán'
        });
      }

      const paymentTracking = await PaymentTracking.findOne({
        recordId: qaId,
        serviceType: 'consultation',
        status: 'pending'
      });

      if (!paymentTracking) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy payment đang chờ để hủy'
        });
      }

      try {
        await payosService.cancelPaymentLink(
          paymentTracking.orderCode,
          'Người dùng hủy thanh toán consultation'
        );
      } catch (error) {
        console.error('Error canceling PayOS consultation payment:', error);
      }

      await paymentTracking.updatePaymentStatus('cancelled');

      // Consultation sẽ bị hủy luôn
      consultation.status = 'cancelled';
      await consultation.save();

      return res.status(200).json({
        success: true,
        message: 'Hủy thanh toán consultation thành công'
      });

    } catch (error) {
      console.error('Error canceling consultation payment:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi hủy thanh toán consultation',
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
            amount: appointment.totalAmount || 0, // ✅ FIX: Dùng appointment.totalAmount thay vì paymentTracking
            appointmentStatus: appointment.status,
            paymentStatus: appointment.paymentStatus,
            paidAt: appointment.paidAt
          }
        });
      }

      // Tìm payment tracking
      const paymentTracking = await PaymentTracking.findOne({
        recordId: appointmentId,
        serviceType: 'appointment',
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
            amount: paymentTracking.amount, // ✅ FIX: Thêm amount vào response
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
          amount: paymentTracking.amount, // ✅ FIX: Thêm amount vào response
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

  // Fast confirm consultation payment
  fastConfirmConsultationPayment = async (req: AuthRequest, res: Response) => {
    try {
      const { qaId, orderCode, status } = req.body;
      const userId = req.user?._id;

      console.log('🚀 [PaymentController] Fast confirm consultation payment:', { qaId, orderCode, status, userId });

      // Validate required fields
      if (!qaId || !orderCode || !status) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin cần thiết: qaId, orderCode, status'
        });
      }

      // Chỉ chấp nhận status PAID
      if (status !== 'PAID') {
        return res.status(400).json({
          success: false,
          message: 'Chỉ chấp nhận thanh toán thành công (status=PAID)'
        });
      }

      // Tìm consultation
      const consultation = await DoctorQA.findOne({
        _id: qaId,
        userId: userId
      });

      if (!consultation) {
        console.log('❌ [PaymentController] Consultation not found for fast confirm');
        return res.status(404).json({
          success: false,
          message: 'Consultation không tồn tại'
        });
      }

      // Nếu đã scheduled rồi thì trả về thành công luôn
      if (consultation.status === 'scheduled') {
        console.log('✅ [PaymentController] Consultation already scheduled');
        
        // 📧 Gửi email cho trường hợp consultation đã scheduled trước đó (để đảm bảo user nhận được email)
        try {
          console.log('📧 [PaymentController] Sending confirmation email for already scheduled consultation...');
          
          const fullConsultation = await DoctorQA.findById(qaId)
            .populate({
              path: 'doctorId',
              select: 'userId bio specialization',
              populate: {
                path: 'userId',
                select: 'fullName email'
              }
            })
            .populate('userId', 'fullName email');

          if (fullConsultation) {
            const customerEmail = (fullConsultation.userId as any).email;
            const customerName = fullConsultation.fullName;
            const customerPhone = fullConsultation.phone;
            const doctorName = (fullConsultation.doctorId as any)?.userId?.fullName || 'Bác sĩ tư vấn';
            
            const appointmentDate = fullConsultation.appointmentDate 
              ? new Date(fullConsultation.appointmentDate)
              : new Date(Date.now() + 24 * 60 * 60 * 1000);
            
            const appointmentSlot = fullConsultation.appointmentSlot || 'Sẽ được thông báo sau';
            
            // Tìm amount từ payment tracking
            const paymentInfo = await PaymentTracking.findOne({
              recordId: qaId,
              serviceType: 'consultation'
            });
            
            await sendConsultationPaymentSuccessEmail(
              customerEmail,
              customerName,
              customerPhone,
              doctorName,
              appointmentDate,
              appointmentSlot,
              fullConsultation.question,
              fullConsultation.consultationFee || paymentInfo?.amount || 0,
              fullConsultation._id.toString()
            );
            
            console.log('✅ [PaymentController] Confirmation email sent for already scheduled consultation to:', customerEmail);
          }
        } catch (emailError) {
          console.error('⚠️ [PaymentController] Error sending confirmation email for scheduled consultation:', emailError);
        }
        
        return res.status(200).json({
          success: true,
          message: 'Consultation đã được xác nhận trước đó',
          data: {
            consultationStatus: consultation.status
          }
        });
      }

      // Tìm payment tracking
      const paymentTracking = await PaymentTracking.findOne({
        recordId: qaId,
        serviceType: 'consultation',
        orderCode: parseInt(orderCode)
      });

      if (!paymentTracking) {
        console.log('❌ [PaymentController] Consultation payment tracking not found for fast confirm');
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin thanh toán consultation với orderCode này'
        });
      }

      // Nếu payment đã success rồi thì trả về luôn
      if (paymentTracking.status === 'success') {
        console.log('✅ [PaymentController] Consultation payment already success');
        // Đảm bảo consultation cũng đã scheduled
        if ((consultation.status as any) !== 'scheduled') {
          (consultation.status as any) = 'scheduled';
          await consultation.save();
          
          // 📧 Gửi email cho trường hợp payment đã success nhưng consultation chưa được scheduled
          try {
            console.log('📧 [PaymentController] Sending delayed payment success email...');
            
            const fullConsultation = await DoctorQA.findById(qaId)
              .populate({
                path: 'doctorId',
                select: 'userId bio specialization',
                populate: {
                  path: 'userId',
                  select: 'fullName email'
                }
              })
              .populate('userId', 'fullName email');

            if (fullConsultation) {
              const customerEmail = (fullConsultation.userId as any).email;
              const customerName = fullConsultation.fullName;
              const customerPhone = fullConsultation.phone;
              const doctorName = (fullConsultation.doctorId as any)?.userId?.fullName || 'Bác sĩ tư vấn';
              
              const appointmentDate = fullConsultation.appointmentDate 
                ? new Date(fullConsultation.appointmentDate)
                : new Date(Date.now() + 24 * 60 * 60 * 1000);
              
              const appointmentSlot = fullConsultation.appointmentSlot || 'Sẽ được thông báo sau';
              
              await sendConsultationPaymentSuccessEmail(
                customerEmail,
                customerName,
                customerPhone,
                doctorName,
                appointmentDate,
                appointmentSlot,
                fullConsultation.question,
                fullConsultation.consultationFee || paymentTracking.amount,
                fullConsultation._id.toString()
              );
              
              console.log('✅ [PaymentController] Delayed payment success email sent to:', customerEmail);
            }
          } catch (emailError) {
            console.error('⚠️ [PaymentController] Error sending delayed payment success email:', emailError);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Thanh toán consultation đã được xác nhận trước đó',
          data: {
            consultationStatus: 'scheduled'
          }
        });
      }

      // FAST UPDATE - Tin tưởng status=PAID từ PayOS URL
      console.log('⚡ [PaymentController] Fast updating consultation payment status to success...');

      // Update payment tracking
      await paymentTracking.updatePaymentStatus('success', {
        fastConfirmTimestamp: new Date(),
        statusFromUrl: status
      });

      // Update consultation
      (consultation.status as any) = 'scheduled';
      await consultation.save();

      console.log('✅ [PaymentController] Fast confirm consultation completed successfully');

      // 📧 Gửi email thông báo thanh toán thành công
      try {
        console.log('📧 [PaymentController] Sending payment success email...');
        
        // Lấy thông tin đầy đủ consultation với doctor info
        const fullConsultation = await DoctorQA.findById(qaId)
          .populate({
            path: 'doctorId',
            select: 'userId bio specialization',
            populate: {
              path: 'userId',
              select: 'fullName email'
            }
          })
          .populate('userId', 'fullName email');

        if (fullConsultation) {
          const customerEmail = (fullConsultation.userId as any).email;
          const customerName = fullConsultation.fullName;
          const customerPhone = fullConsultation.phone;
          const doctorName = (fullConsultation.doctorId as any)?.userId?.fullName || 'Bác sĩ tư vấn';
          
          // Tạo thời gian hẹn (hiện tại + 1 ngày làm ví dụ)
          const appointmentDate = fullConsultation.appointmentDate 
            ? new Date(fullConsultation.appointmentDate)
            : new Date(Date.now() + 24 * 60 * 60 * 1000); // +1 day
          
          const appointmentSlot = fullConsultation.appointmentSlot || 'Sẽ được thông báo sau';
          
          await sendConsultationPaymentSuccessEmail(
            customerEmail,
            customerName,
            customerPhone,
            doctorName,
            appointmentDate,
            appointmentSlot,
            fullConsultation.question,
            fullConsultation.consultationFee || paymentTracking.amount,
            fullConsultation._id.toString()
          );
          
          console.log('✅ [PaymentController] Payment success email sent to:', customerEmail);
        }
      } catch (emailError) {
        console.error('⚠️ [PaymentController] Error sending payment success email:', emailError);
        // Không throw error để không ảnh hưởng payment flow chính
      }

      return res.status(200).json({
        success: true,
        message: 'Xác nhận thanh toán consultation nhanh thành công',
        data: {
          orderCode: paymentTracking.orderCode,
          amount: paymentTracking.amount, // ✅ FIX: Thêm amount vào response
          consultationStatus: consultation.status,
          fastConfirmed: true
        }
      });

    } catch (error) {
      console.error('❌ [PaymentController] Error in fast confirm consultation payment:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi xác nhận thanh toán consultation nhanh',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ✅ NEW: Force check payment and assign doctor for stuck appointments
  forceCheckPaymentAndAssignDoctor = async (req: AuthRequest, res: Response) => {
    try {
      const { appointmentId } = req.params;
      const userId = req.user?._id;

      console.log('🔧 [ForceCheck] Force checking payment and assigning doctor for appointment:', appointmentId, 'user:', userId);

      const appointment = await Appointments.findOne({
        _id: appointmentId,
        createdByUserId: userId
      });

      if (!appointment) {
        console.log('❌ [ForceCheck] Appointment not found');
        return res.status(404).json({
          success: false,
          message: 'Appointment không tồn tại'
        });
      }

      console.log('📋 [ForceCheck] Current appointment:', {
        status: appointment.status,
        paymentStatus: appointment.paymentStatus,
        doctorId: appointment.doctorId,
        paidAt: appointment.paidAt
      });

      const paymentTracking = await PaymentTracking.findOne({
        recordId: appointmentId,
        serviceType: 'appointment'
      });

      if (!paymentTracking) {
        console.log('❌ [ForceCheck] Payment tracking not found');
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin thanh toán'
        });
      }

      console.log('💳 [ForceCheck] Payment tracking:', {
        status: paymentTracking.status,
        orderCode: paymentTracking.orderCode,
        amount: paymentTracking.amount
      });

      let paymentUpdated = false;
      let doctorAssigned = false;

      // Step 1: Force check PayOS status
      try {
        console.log('🔄 [ForceCheck] Checking PayOS status...');
        const paymentInfo = await payosService.getPaymentStatus(paymentTracking.orderCode);

        console.log('💳 [ForceCheck] PayOS response:', {
          status: paymentInfo.status,
          amount: paymentInfo.amount,
          orderCode: paymentInfo.orderCode
        });

        if (paymentInfo.status === 'PAID' && (appointment.status !== 'confirmed' || appointment.paymentStatus !== 'paid')) {
          console.log('✅ [ForceCheck] Payment CONFIRMED by PayOS - updating appointment...');

          // Update payment tracking
          await paymentTracking.updatePaymentStatus('success', {
            reference: paymentInfo.transactions?.[0]?.reference,
            transactionDateTime: paymentInfo.transactions?.[0]?.transactionDateTime
          });

          // Update appointment payment status
          appointment.status = 'confirmed';
          appointment.paymentStatus = 'paid';
          appointment.paidAt = new Date();
          
          // Handle PackagePurchase for new_package bookings
          if (appointment.bookingType === 'new_package' && appointment.packageId && !appointment.packagePurchaseId) {
            try {
              console.log('🎯 [ForceCheck] Creating PackagePurchase for new_package appointment');
              
              const packagePurchase = await PackagePurchaseService.purchasePackage(
                appointment.createdByUserId.toString(),
                appointment.packageId.toString(),
                appointment.totalAmount || 0
              );

              appointment.packagePurchaseId = packagePurchase._id;
              console.log('✅ [ForceCheck] PackagePurchase created:', packagePurchase._id);
            } catch (packageError) {
              console.error('❌ [ForceCheck] Error creating PackagePurchase:', packageError);
            }
          }

          await appointment.save();
          paymentUpdated = true;
          console.log('✅ [ForceCheck] Payment status updated to confirmed/paid');
        }
      } catch (payosError) {
        console.error('❌ [ForceCheck] Error checking PayOS:', payosError);
      }

      // Step 2: Auto assign doctor if not assigned and payment is confirmed
      if ((appointment.status === 'confirmed' || paymentUpdated) && !appointment.doctorId) {
        try {
          console.log('👨‍⚕️ [ForceCheck] Auto assigning doctor...');

          // Import doctor model
          const { default: Doctors } = await import('../models/Doctor');
          
          console.log('🔍 [ForceCheck] Looking for available doctors for appointment type:', appointment.appointmentType);

          // Get all active doctors (simplified assignment)
          const allDoctors = await Doctors.find({ isDeleted: { $ne: true } })
            .populate('userId', 'fullName');
          
          if (allDoctors.length > 0) {
            // For now, assign first available doctor
            // TODO: Enhance with schedule-based selection later
            const selectedDoctor = allDoctors[0];

            // Assign doctor to appointment
            appointment.doctorId = selectedDoctor._id;
            await appointment.save();

            doctorAssigned = true;
            
            console.log('✅ [ForceCheck] Doctor assigned:', {
              doctorId: selectedDoctor._id,
              doctorName: (selectedDoctor.userId as any)?.fullName || 'Unknown Doctor',
              note: 'Simple assignment - can be enhanced with schedule checking'
            });
          } else {
            console.log('⚠️ [ForceCheck] No active doctors found for assignment');
          }
        } catch (doctorError) {
          console.error('❌ [ForceCheck] Error assigning doctor:', doctorError);
        }
      }

      // Get final appointment state
      const finalAppointment = await Appointments.findById(appointmentId)
        .populate('doctorId', 'fullName')
        .populate('packageId', 'name');

      const result = {
        appointmentId: finalAppointment?._id,
        status: finalAppointment?.status,
        paymentStatus: finalAppointment?.paymentStatus,
        paidAt: finalAppointment?.paidAt,
        doctorId: finalAppointment?.doctorId?._id,
        doctorName: (finalAppointment?.doctorId as any)?.fullName,
        paymentUpdated,
        doctorAssigned,
        orderCode: paymentTracking.orderCode,
        paymentTrackingStatus: paymentTracking.status
      };

      console.log('🎯 [ForceCheck] Final result:', result);

      return res.status(200).json({
        success: true,
        message: `Force check completed. ${paymentUpdated ? 'Payment updated. ' : ''}${doctorAssigned ? 'Doctor assigned.' : ''}`,
        data: result
      });

    } catch (error) {
      console.error('❌ [ForceCheck] Error in force check:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi force check payment và assign doctor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export default new PaymentController();