import { Request, Response } from 'express';
import Appointments from '../models/Appointments';
import PaymentTracking from '../models/PaymentTracking';
import PackagePurchases from '../models/PackagePurchases';
import '../models/Service';
import '../models/ServicePackages';
import payosService from '../services/payosService';
import { PackagePurchaseService } from '../services/packagePurchaseService';
import { AuthRequest } from '../types/auth';

export class AppointmentPaymentController {
  
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
          success: false,
          message: 'Appointment không tồn tại hoặc không thể thanh toán'
        });
      }

      const existingPayment = await PaymentTracking.findOne({
        recordId: appointmentId,
        serviceType: 'appointment'
      });

      if (existingPayment && existingPayment.status === 'success') {
        return res.status(400).json({
          success: false,
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

      console.log('💳 [AppointmentPayment] Creating payment for appointment:', {
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
        existingPayment.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
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
          expiredAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        }
      });

    } catch (error) {
      console.error('Error creating appointment payment link:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi tạo payment link',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Check payment status
  checkPaymentStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { appointmentId } = req.params;
      const userId = req.user?._id;

      console.log('🔍 [AppointmentPayment] Checking payment status for appointment:', appointmentId);

      const appointment = await Appointments.findOne({
        _id: appointmentId,
        createdByUserId: userId
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment không tồn tại'
        });
      }

      const paymentTracking = await PaymentTracking.findOne({
        recordId: appointmentId,
        serviceType: 'appointment'
      });

      if (!paymentTracking) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin thanh toán'
        });
      }

      // Check PayOS status nếu appointment vẫn pending_payment
      if (appointment.status === 'pending_payment' || paymentTracking.status === 'pending') {
        try {
          const paymentInfo = await payosService.getPaymentStatus(paymentTracking.orderCode);

          if (paymentInfo.status === 'PAID') {
            await paymentTracking.updatePaymentStatus('success', {
              reference: paymentInfo.transactions?.[0]?.reference,
              transactionDateTime: paymentInfo.transactions?.[0]?.transactionDateTime
            });

            appointment.status = 'confirmed';
            appointment.paymentStatus = 'paid';
            appointment.paidAt = new Date();
            await appointment.save();

            // Tạo PackagePurchase nếu là new_package booking
            if (appointment.bookingType === 'new_package' && appointment.packageId && !appointment.packagePurchaseId) {
              try {
                const packagePurchase = await PackagePurchaseService.purchasePackage(
                  appointment.createdByUserId.toString(),
                  appointment.packageId.toString(),
                  appointment.totalAmount || 0
                );
                
                appointment.packagePurchaseId = packagePurchase._id;
                await appointment.save();
              } catch (packageError) {
                console.error('❌ Error creating PackagePurchase:', packageError);
              }
            }
          } else if (paymentInfo.status === 'CANCELLED') {
            await paymentTracking.updatePaymentStatus('cancelled');
          }
        } catch (error) {
          console.error('Error checking PayOS status:', error);
        }
      }

      const updatedAppointment = await Appointments.findById(appointmentId);

      return res.status(200).json({
        success: true,
        message: 'Lấy trạng thái thanh toán thành công',
        data: {
          orderCode: paymentTracking.orderCode,
          status: paymentTracking.status,
          amount: paymentTracking.amount,
          appointmentStatus: updatedAppointment?.status,
          paymentStatus: updatedAppointment?.paymentStatus,
          paidAt: updatedAppointment?.paidAt,
          createdAt: paymentTracking.createdAt,
          webhookReceived: paymentTracking.webhookReceived
        }
      });

    } catch (error) {
      console.error('Error checking appointment payment status:', error);
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
          success: false,
          message: 'Appointment không tồn tại hoặc không thể hủy thanh toán'
        });
      }

      const paymentTracking = await PaymentTracking.findOne({
        recordId: appointmentId,
        serviceType: 'appointment',
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
          'Người dùng hủy thanh toán'
        );
      } catch (error) {
        console.error('Error canceling PayOS payment:', error);
      }

      await paymentTracking.updatePaymentStatus('cancelled');
      appointment.status = 'cancelled';
      await appointment.save();

      return res.status(200).json({
        success: true,
        message: 'Hủy thanh toán thành công',
        data: {
          appointmentStatus: appointment.status,
          paymentStatus: paymentTracking.status
        }
      });

    } catch (error) {
      console.error('Error canceling appointment payment:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi hủy thanh toán',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

const appointmentPaymentController = new AppointmentPaymentController();
export default appointmentPaymentController; 