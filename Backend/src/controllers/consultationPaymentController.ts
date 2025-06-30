import { Response } from 'express';
import DoctorQA from '../models/DoctorQA';
import PaymentTracking from '../models/PaymentTracking';
import payosService from '../services/payosService';
import { AuthRequest } from '../types/auth';

export class ConsultationPaymentController {
  
  // Tạo payment link cho consultation
  createPaymentLink = async (req: AuthRequest, res: Response) => {
    try {
      const { doctorQAId } = req.params;
      const userId = req.user?._id;

      const consultation = await DoctorQA.findOne({
        _id: doctorQAId,
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
        recordId: doctorQAId,
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
        recordId: doctorQAId,
        serviceType: 'consultation',
        amount,
        description,
        customerName: req.user?.fullName || consultation.fullName,
        customerEmail: req.user?.email,
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/consultation/success?qaId=${doctorQAId}`,
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
        existingPayment.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        paymentTracking = await existingPayment.save();
      } else {
        paymentTracking = await PaymentTracking.create({
          serviceType: 'consultation',
          recordId: doctorQAId,
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

  // Check consultation payment status
  checkPaymentStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { doctorQAId } = req.params;
      const userId = req.user?._id;

      console.log('🔍 [ConsultationPayment] Checking payment status for consultation:', doctorQAId);

      const consultation = await DoctorQA.findOne({
        _id: doctorQAId,
        userId: userId
      });

      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Consultation không tồn tại'
        });
      }

      const paymentTracking = await PaymentTracking.findOne({
        recordId: doctorQAId,
        serviceType: 'consultation'
      });

      if (!paymentTracking) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin thanh toán'
        });
      }

      // Check PayOS status nếu consultation vẫn pending_payment
      if (consultation.status === 'pending_payment' || paymentTracking.status === 'pending') {
        try {
          const paymentInfo = await payosService.getPaymentStatus(paymentTracking.orderCode);

          if (paymentInfo.status === 'PAID') {
            await paymentTracking.updatePaymentStatus('success', {
              reference: paymentInfo.transactions?.[0]?.reference,
              transactionDateTime: paymentInfo.transactions?.[0]?.transactionDateTime
            });

            consultation.status = 'scheduled';
            await consultation.save();
          } else if (paymentInfo.status === 'CANCELLED') {
            await paymentTracking.updatePaymentStatus('cancelled');
          }
        } catch (error) {
          console.error('Error checking PayOS status:', error);
        }
      }

      const updatedConsultation = await DoctorQA.findById(doctorQAId);

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

  // Cancel consultation payment
  cancelPayment = async (req: AuthRequest, res: Response) => {
    try {
      const { doctorQAId } = req.params;
      const userId = req.user?._id;

      const consultation = await DoctorQA.findOne({
        _id: doctorQAId,
        userId: userId,
        status: 'pending_payment'
      });

      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Consultation không tồn tại hoặc không thể hủy thanh toán'
        });
      }

      const paymentTracking = await PaymentTracking.findOne({
        recordId: doctorQAId,
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
        console.error('Error canceling PayOS payment:', error);
      }

      await paymentTracking.updatePaymentStatus('cancelled');
      consultation.status = 'cancelled';
      await consultation.save();

      return res.status(200).json({
        success: true,
        message: 'Hủy thanh toán consultation thành công',
        data: {
          consultationStatus: consultation.status,
          paymentStatus: paymentTracking.status
        }
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
}

const consultationPaymentController = new ConsultationPaymentController();
export default consultationPaymentController; 