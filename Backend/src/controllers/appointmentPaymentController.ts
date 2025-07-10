import { Response } from 'express';
import Appointments from '../models/Appointments';
import PaymentTracking from '../models/PaymentTracking';
import '../models/Service';
import '../models/ServicePackages';
import { PackagePurchaseService } from '../services/packagePurchaseService';
import payosService from '../services/payosService';
import { AuthRequest } from '../types/auth';
import mongoose from 'mongoose';

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

      // ✅ FIX: Check existing payment properly - check cả pending và success
      const existingPayment = await PaymentTracking.findOne({
        recordId: appointmentId,
        serviceType: 'appointment'
      });

      // Nếu đã thanh toán thành công rồi
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
        hasPackage: !!appointment.packageId,
        hasExistingPayment: !!existingPayment
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

      // ✅ FIX: Nếu có existing payment với status pending/failed, reuse và update
      if (existingPayment && ['pending', 'failed', 'cancelled'].includes(existingPayment.status)) {
        console.log('🔄 [AppointmentPayment] Reusing existing payment record:', existingPayment._id);
        
        existingPayment.orderCode = paymentData.orderCode;
        existingPayment.amount = amount;
        existingPayment.totalAmount = amount;
        existingPayment.description = description;
        existingPayment.status = 'pending';
        existingPayment.paymentUrl = paymentData.checkoutUrl;
        existingPayment.paymentLinkId = paymentData.paymentLinkId;
        existingPayment.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        existingPayment.customerName = req.user?.fullName || 'Khách hàng';
        existingPayment.customerEmail = req.user?.email;
        
        paymentTracking = await existingPayment.save();
        console.log('✅ [AppointmentPayment] Updated existing payment record');
        
        // ✅ FIX: Lưu paymentTrackingId vào appointment
        let paymentTrackingId: mongoose.Types.ObjectId;
        if (typeof paymentTracking._id === 'string') {
          paymentTrackingId = new mongoose.Types.ObjectId(paymentTracking._id);
        } else {
          paymentTrackingId = paymentTracking._id as mongoose.Types.ObjectId;
        }
        if (!appointment.paymentTrackingId || appointment.paymentTrackingId.toString() !== paymentTrackingId.toString()) {
          appointment.paymentTrackingId = paymentTrackingId;
          await appointment.save();
          console.log('✅ [AppointmentPayment] Updated appointment with paymentTrackingId:', paymentTrackingId);
        }
      } else {
        // ✅ FIX: Tạo PaymentTracking mới chỉ khi chưa có hoặc không reuse được
        console.log('🆕 [AppointmentPayment] Creating new payment record');
        
        paymentTracking = await PaymentTracking.create({
          serviceType: 'appointment',
          recordId: appointmentId,
          appointmentId: appointmentId,
          userId: userId,
          orderCode: paymentData.orderCode,
          paymentLinkId: paymentData.paymentLinkId,
          paymentGateway: 'payos',
          amount,
          totalAmount: amount,
          billNumber: `APT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          description,
          customerName: req.user?.fullName || 'Khách hàng',
          customerEmail: req.user?.email,
          status: 'pending',
          paymentUrl: paymentData.checkoutUrl,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });
        
        console.log('✅ [AppointmentPayment] Created new payment record:', paymentTracking._id);
        
        // ✅ FIX: Lưu paymentTrackingId vào appointment với proper type
        appointment.paymentTrackingId = paymentTracking._id as mongoose.Types.ObjectId;
        await appointment.save();
        console.log('✅ [AppointmentPayment] Updated appointment with paymentTrackingId:', paymentTracking._id);
      }

      return res.status(200).json({
        success: true,
        message: 'Tạo payment link thành công',
        data: {
          paymentUrl: paymentData.checkoutUrl,
          orderCode: paymentData.orderCode,
          amount: amount,
          qrCode: paymentData.qrCode,
          expiredAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          isReusedPayment: !!existingPayment
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
                console.log(`🎯 [AppointmentPayment] Starting PackagePurchase creation for appointment ${appointment._id}`);
                console.log(`🎯 [AppointmentPayment] Pre-creation state check:`);
                console.log(`  - Appointment status: ${appointment.status}`);
                console.log(`  - Payment status: ${appointment.paymentStatus}`);
                console.log(`  - PaidAt: ${appointment.paidAt}`);
                console.log(`  - BookingType: ${appointment.bookingType}`);
                console.log(`  - PackageId exists: ${!!appointment.packageId}`);
                console.log(`  - UserId: ${appointment.createdByUserId.toString()}`);
                console.log(`  - Amount: ${appointment.totalAmount || 0}`);
                
                console.log(`🎯 [AppointmentPayment] Calling PackagePurchaseService.purchasePackage with:`);
                console.log(`  - userId: ${appointment.createdByUserId.toString()}`);
                console.log(`  - packageId: ${appointment.packageId.toString()}`);
                console.log(`  - amount: ${appointment.totalAmount || 0}`);
                
                const packagePurchase = await PackagePurchaseService.purchasePackage(
                  appointment.createdByUserId.toString(),
                  appointment.packageId.toString(),
                  appointment.totalAmount || 0,
                  String(paymentTracking._id)
                );
                
                console.log(`✅ [AppointmentPayment] PackagePurchase created successfully:`);
                console.log(`  - PackagePurchase ID: ${packagePurchase._id}`);
                console.log(`  - PackagePurchase status: ${(packagePurchase as any).status}`);
                console.log(`  - PackagePurchase userId: ${(packagePurchase as any).userId}`);
                console.log(`  - PackagePurchase packageId: ${(packagePurchase as any).packageId}`);
                console.log(`  - PackagePurchase amount: ${(packagePurchase as any).amount}`);
                
                // Update appointment với packagePurchaseId reference
                const oldPackagePurchaseId = appointment.packagePurchaseId;
                appointment.packagePurchaseId = packagePurchase._id;
                await appointment.save();
                
                console.log(`✅ [AppointmentPayment] Appointment updated successfully:`);
                console.log(`  - Old packagePurchaseId: ${oldPackagePurchaseId}`);
                console.log(`  - New packagePurchaseId: ${packagePurchase._id}`);
                console.log(`  - Appointment status: ${appointment.status}`);
              } catch (packageError) {
                console.error('❌ [AppointmentPayment] Error creating PackagePurchase:', packageError);
                console.error(`❌ [AppointmentPayment] Error type: ${typeof packageError}`);
                console.error(`❌ [AppointmentPayment] Error name: ${packageError instanceof Error ? packageError.name : 'Unknown'}`);
                console.error(`❌ [AppointmentPayment] Error message: ${packageError instanceof Error ? packageError.message : 'Unknown error'}`);
                console.error(`❌ [AppointmentPayment] Error details:`, packageError);
                console.error(`❌ [AppointmentPayment] Error stack:`, packageError instanceof Error ? packageError.stack : 'No stack trace');
                
                // Log appointment state khi có lỗi
                console.error(`❌ [AppointmentPayment] Appointment state when error occurred:`);
                console.error(`  - Appointment ID: ${appointment._id}`);
                console.error(`  - BookingType: ${appointment.bookingType}`);
                console.error(`  - PackageId: ${appointment.packageId}`);
                console.error(`  - PackagePurchaseId: ${appointment.packagePurchaseId}`);
                console.error(`  - TotalAmount: ${appointment.totalAmount}`);
                console.error(`  - CreatedByUserId: ${appointment.createdByUserId}`);
                console.error(`  - Status: ${appointment.status}`);
                console.error(`  - PaymentStatus: ${appointment.paymentStatus}`);
              }
            } else {
              // Import log debug function từ paymentController
              console.log(`\n[DEBUG][AppointmentPaymentController] Lý do không tạo được packagePurchase:`);
              console.log(`  - bookingType:`, appointment.bookingType, `(type: ${typeof appointment.bookingType})`);
              console.log(`  - packageId:`, appointment.packageId, `(type: ${typeof appointment.packageId})`);
              console.log(`  - packagePurchaseId:`, appointment.packagePurchaseId, `(type: ${typeof appointment.packagePurchaseId})`);
              if (appointment.bookingType !== 'new_package') {
                console.log(`    => bookingType khác 'new_package' (giá trị: ${appointment.bookingType})`);
              }
              if (!appointment.packageId) {
                console.log(`    => packageId bị thiếu/null/undefined (giá trị: ${appointment.packageId})`);
              }
              if (appointment.packagePurchaseId) {
                console.log(`    => packagePurchaseId đã tồn tại (giá trị: ${appointment.packagePurchaseId})`);
              }
              console.log(`[DEBUG][AppointmentPaymentController] Kết thúc log lý do.\n`);
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
          paymentUrl: paymentTracking.paymentUrl, // ✅ FIX: Thêm paymentUrl để frontend có thể reuse
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