import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { NotFoundError } from '../errors/notFoundError';
import { UnauthorizedError } from '../errors/unauthorizedError';
import { ValidationError } from '../errors/validationError';
import { Appointments, PaymentTracking, Doctor, DoctorSchedules, PackagePurchases, Service, User } from '../models';
import { LogAction, LogLevel } from '../models/SystemLogs';
import { UserProfile } from '../models/UserProfile';
import * as paymentService from '../services/paymentService';
import systemLogService from '../services/systemLogService';

interface AuthRequest extends Request {
    user?: {
        _id: string;
        email: string;
        role: string;
    };
}

/**
 * Lấy danh sách tất cả các cuộc hẹn
 * Phân trang và lọc theo các tiêu chí khác nhau
 */
export const getAllAppointments = async (req: AuthRequest, res: Response) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            appointmentType,
            startDate,
            endDate,
            profileId,
            createdByUserId
        } = req.query;

        const query: any = {};

        // Áp dụng các bộ lọc nếu có
        if (status) query.status = status;
        if (appointmentType) query.appointmentType = appointmentType;
        if (profileId) query.profileId = profileId;
        if (createdByUserId) query.createdByUserId = createdByUserId;

        // Lọc theo khoảng thời gian
        if (startDate && endDate) {
            query.appointmentDate = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        } else if (startDate) {
            query.appointmentDate = { $gte: new Date(startDate as string) };
        } else if (endDate) {
            query.appointmentDate = { $lte: new Date(endDate as string) };
        }

        // Tính toán skip value cho phân trang
        const pageNumber = parseInt(page as string, 10);
        const limitNumber = parseInt(limit as string, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Đếm tổng số bản ghi thỏa mãn điều kiện
        const total = await Appointments.countDocuments(query);

        // Lấy dữ liệu với populate các trường liên quan
        const appointments = await Appointments.find(query)
            .populate({
                path: 'profileId',
                model: 'UserProfiles',
                select: 'fullName gender phone year',
                options: { strictPopulate: false }
            })
            .populate({
                path: 'serviceId',
                model: 'Service',
                select: 'serviceName price serviceType',
                options: { strictPopulate: false }
            })
            .populate({
                path: 'packageId',
                model: 'ServicePackages',
                select: 'name price',
                options: { strictPopulate: false }
            })
            .populate({
                path: 'doctorId',
                match: { isDeleted: { $ne: true } }, // Loại trừ doctor đã bị xóa
                populate: {
                    path: 'userId',
                    select: 'fullName email avatar isActive',
                    match: { isActive: { $ne: false } } // Chỉ lấy user active
                },
                options: { strictPopulate: false }
            })
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .skip(skip)
            .limit(limitNumber);

        // Process appointments để handle missing doctor data
        const processedAppointments = appointments.map(apt => {
            const appointmentObj = apt.toObject() as any; // Cast to any để add custom properties
            
            // Type cast để access populated fields
            const populatedDoctor = appointmentObj.doctorId as any;
            
            // Handle missing doctor data gracefully
            if (!populatedDoctor || !populatedDoctor.userId) {
                appointmentObj.doctorInfo = {
                    fullName: 'Chưa chỉ định bác sĩ',
                    email: null,
                    avatar: null,
                    isActive: false,
                    missing: true
                };
                // Keep original doctorId for reference if exists
                if (populatedDoctor && !populatedDoctor.userId) {
                    console.warn(`⚠️ [Appointment] Doctor ${populatedDoctor._id || populatedDoctor} has no userId or inactive user`);
                }
            } else {
                appointmentObj.doctorInfo = {
                    doctorId: populatedDoctor._id,
                    userId: populatedDoctor.userId._id,
                    fullName: populatedDoctor.userId.fullName,
                    email: populatedDoctor.userId.email,
                    avatar: populatedDoctor.userId.avatar,
                    isActive: populatedDoctor.userId.isActive !== false,
                    specialization: populatedDoctor.specialization,
                    experience: populatedDoctor.experience,
                    rating: populatedDoctor.rating,
                    missing: false
                };
            }
            
            return appointmentObj;
        });

        // Debug logging để kiểm tra dữ liệu doctor
        console.log('🔍 [Debug] Sample appointment doctor data:', processedAppointments.slice(0, 2).map(apt => ({
            _id: apt._id,
            doctorId: apt.doctorId?._id || apt.doctorId,
            doctorInfo: apt.doctorInfo,
            hasValidDoctor: !apt.doctorInfo.missing
        })));

        return res.status(200).json({
            success: true,
            data: {
                appointments: processedAppointments,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    pages: Math.ceil(total / limitNumber)
                }
            }
        });
    } catch (error) {
        console.error('Error in getAllAppointments:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy danh sách cuộc hẹn'
        });
    }
};

/**
 * Tạo cuộc hẹn mới
 */
export const createAppointment = async (req: AuthRequest, res: Response) => {
    console.log('--- [createAppointment] Nhận request với body:', req.body);
    const { 
        profileId, packageId, serviceId, doctorId, slotId,
        appointmentDate, appointmentTime, appointmentType, typeLocation,
        description, notes,
        bookingType = 'service_only' // Default to service_only
    } = req.body;

    const userId = req.user?._id; 
    if (!userId) {
        console.error('[createAppointment] Không tìm thấy userId trong req.user');
        return res.status(401).json({ success: false, message: 'Unauthorized: User ID not found.' });
    }

    // Validate appointmentType
    if (!appointmentType || !['consultation', 'examination', 'followup'].includes(appointmentType)) {
        console.error('[createAppointment] appointmentType không hợp lệ:', appointmentType);
        return res.status(400).json({ 
            success: false, 
            message: 'Loại cuộc hẹn không hợp lệ. Phải là một trong: consultation, examination, followup' 
        });
    }

    try {
        console.log('[createAppointment] Tìm user:', userId);
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            console.error('[createAppointment] Không tìm thấy user:', userId);
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
        }

        console.log('[createAppointment] Tìm hồ sơ bệnh nhân:', profileId);
        const patientProfile = await UserProfile.findById(profileId);
        if (!patientProfile || patientProfile.ownerId.toString() !== userId.toString()) {
            console.error('[createAppointment] Hồ sơ bệnh nhân không hợp lệ:', profileId, 'ownerId:', patientProfile?.ownerId);
            return res.status(404).json({ success: false, message: 'Hồ sơ bệnh nhân không hợp lệ hoặc không thuộc về bạn.' });
        }

        let totalAmount = 0;
        let paymentUrl: string | null = null;
        let newPayment: any = null;
        
        // Validate doctorId if provided
        if (doctorId && !mongoose.Types.ObjectId.isValid(doctorId)) {
            console.error('[createAppointment] doctorId không hợp lệ:', doctorId);
            return res.status(400).json({ 
                success: false, 
                message: 'ID bác sĩ không hợp lệ' 
            });
        }

        console.log('[createAppointment] Tạo appointment với doctorId:', doctorId);

        const newAppointment = new Appointments({
            createdByUserId: userId,
            profileId: patientProfile._id,
            status: 'pending_payment',
            appointmentDate,
            appointmentTime,
            appointmentType,
            typeLocation,
            description,
            notes,
            serviceId: serviceId,
            packageId: packageId,
            doctorId: doctorId, // ✅ FIX: Add doctorId to appointment
            slotId: slotId
        });

        if (bookingType === 'service_only' && serviceId) {
            console.log('[createAppointment] Tìm service:', serviceId);
            const service = await Service.findById(serviceId);
            if (!service || !service.price) {
                console.error('[createAppointment] Không tìm thấy service hoặc không có giá:', serviceId);
                return res.status(404).json({ success: false, message: 'Dịch vụ không tồn tại hoặc không có giá.' });
            }

            // Validate appointmentType matches service type
            if (appointmentType !== service.serviceType) {
                console.error('[createAppointment] appointmentType không khớp với serviceType:', appointmentType, service.serviceType);
                return res.status(400).json({ 
                    success: false, 
                    message: `Loại cuộc hẹn không khớp với loại dịch vụ. Dịch vụ này là "${service.serviceType}".` 
                });
            }

            totalAmount = service.price;

            // ✅ CREATE PaymentTracking instead of Bills
            const billNumber = `APP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            newPayment = new PaymentTracking({
                serviceType: appointmentType === 'consultation' ? 'consultation' : 'appointment',
                recordId: newAppointment._id,
                appointmentId: newAppointment._id,
                userId,
                amount: totalAmount,
                totalAmount,
                billNumber: billNumber,
                description: billNumber, // Ngắn gọn, hợp lệ PayOS
                customerName: currentUser.fullName || 'Khách hàng',
                customerEmail: currentUser.email,
                customerPhone: currentUser.phone,
                orderCode: Date.now(),
                paymentGateway: 'payos',
                status: 'pending'
            });
            await newPayment.save();
            console.log('[createAppointment] Đã lưu PaymentTracking:', newPayment._id);
            newAppointment.paymentTrackingId = newPayment._id;

            // Gọi service để tạo payment link, không tự tạo thủ công
            const paymentUrl = await require('../services/paymentService').createPaymentLinkForPayment(newPayment, currentUser);
            console.log('[createAppointment] Nhận về paymentUrl:', paymentUrl);
            await PaymentTracking.findByIdAndUpdate(newPayment._id, { paymentUrl });
        } else if (bookingType === 'package_usage') {
            // Logic for package usage booking needs to be implemented here
            // This part is currently not handled and might be the source of future issues
            console.error('[createAppointment] bookingType package_usage chưa được hỗ trợ');
            return res.status(501).json({ success: false, message: 'Chức năng đặt lịch bằng gói khám chưa được hỗ trợ.' });
        }

        // Now, save the appointment and lock the slot
        try {
            const savedAppointment = await newAppointment.save();
            if (!savedAppointment || !savedAppointment._id) {
                throw new Error('Lưu lịch hẹn thất bại hoặc không nhận được ID sau khi lưu.');
            }
            console.log('[createAppointment] Đã lưu appointment:', savedAppointment._id);
            
            if (savedAppointment.status === 'pending_payment' && slotId) {
                const lockResult = await DoctorSchedules.findOneAndUpdate(
                    { 
                        "weekSchedule.slots._id": new mongoose.Types.ObjectId(slotId),
                        "weekSchedule.slots.status": "Free"
                    },
                    { 
                        $set: { "weekSchedule.$[].slots.$[slot].status": "Booked" }
                    },
                    {
                        arrayFilters: [{ "slot._id": new mongoose.Types.ObjectId(slotId) }],
                        new: true
                    }
                );

                if (!lockResult) {
                    console.error('[createAppointment] Không thể lock slot:', slotId);
                    throw new Error('Slot thời gian này đã được đặt hoặc không có sẵn.');
                }
                console.log(`[Slot Lock] Slot ${slotId} đã được khóa thành công.`);
            }
            
            await systemLogService.createLog({
                action: LogAction.APPOINTMENT_CREATE,
                level: LogLevel.PUBLIC,
                message: `Tạo lịch hẹn mới #${savedAppointment._id} cho user ${userId}`,
                userId: userId?.toString(),
                targetId: savedAppointment._id.toString(),
                targetType: 'Appointment',
            });

            console.log('[createAppointment] Thành công, trả response cho FE');
            return res.status(201).json({
                success: true,
                message: 'Tạo lịch hẹn thành công!',
                data: {
                    appointment: savedAppointment,
                    paymentUrl: paymentUrl
                }
            });
            
        } catch (error: any) {
             console.error('❌ [Appointment Error] Error during appointment creation or slot locking:', error);
             
             // Rollback logic using the original 'newAppointment' object's ID
             if (newAppointment?._id) {
                 await Appointments.findByIdAndDelete(newAppointment._id);
                 console.log(`🗑️ [Rollback] Deleted appointment ${newAppointment._id} due to failure.`);
             }
             
             if (newPayment?._id) {
                 await PaymentTracking.findByIdAndUpdate(newPayment._id, { status: 'cancelled' });
                 console.log(`🗑️ [Rollback] Cancelled payment ${newPayment._id}.`);
             }

             return res.status(500).json({
                 success: false,
                 message: 'Đã có lỗi xảy ra trong quá trình đặt lịch',
                 error: error.message
             });
        }
    } catch (error) {
        const err = error as any;
        console.error('❌ [Appointment Error] Lỗi ngoài try chính:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã có lỗi xảy ra trong quá trình đặt lịch',
            error: err.message
        });
    }
};

/**
 * Lấy chi tiết cuộc hẹn theo ID
 */
export const getAppointmentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Kiểm tra ID có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ValidationError({ id: 'ID cuộc hẹn không hợp lệ' });
        }

        // Tìm cuộc hẹn theo ID
        const appointment = await Appointments.findById(id)
            .populate('profileId', 'fullName gender phone year', undefined, { strictPopulate: false })
            .populate('serviceId', 'serviceName price serviceType', undefined, { strictPopulate: false })
            .populate('packageId', 'name price serviceIds', undefined, { strictPopulate: false })
            .populate('createdByUserId', 'fullName email', undefined, { strictPopulate: false })
            .populate({
                path: 'doctorId',
                match: { isDeleted: { $ne: true } }, // Loại trừ doctor đã bị xóa
                populate: {
                    path: 'userId',
                    select: 'fullName email avatar'
                },
                options: { strictPopulate: false }
            });

        if (!appointment) {
            throw new NotFoundError('Không tìm thấy cuộc hẹn');
        }

        return res.status(200).json({
            success: true,
            data: appointment
        });
    } catch (error) {
        console.error('Error in getAppointmentById:', error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy chi tiết cuộc hẹn'
        });
    }
};

/**
 * Cập nhật thông tin cuộc hẹn
 */
export const updateAppointment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Kiểm tra ID có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ValidationError({ id: 'ID cuộc hẹn không hợp lệ' });
        }

        // Tìm cuộc hẹn hiện tại
        const appointment = await Appointments.findById(id);
        if (!appointment) {
            throw new NotFoundError('Không tìm thấy cuộc hẹn');
        }

        // Chỉ cho phép cập nhật nếu trạng thái là pending hoặc confirmed
        if (!['pending', 'confirmed'].includes(appointment.status)) {
            throw new ValidationError({ status: 'Không thể cập nhật cuộc hẹn đã hoàn thành hoặc đã hủy' });
        }

        // Nếu thay đổi slot, kiểm tra slot mới có trống không
        if (updateData.slotId && updateData.slotId !== appointment.slotId?.toString()) {
            // Giải phóng slot cũ
            if (appointment.slotId) {
                await DoctorSchedules.updateOne(
                    { 'weekSchedule.slots._id': appointment.slotId },
                    { $set: { 'weekSchedule.$.slots.$[slot].status': 'Free' } },
                    { arrayFilters: [{ 'slot._id': appointment.slotId }] }
                );
            }

            // Kiểm tra và đặt slot mới
            const schedule = await DoctorSchedules.findOne({
                'weekSchedule.slots._id': new mongoose.Types.ObjectId(updateData.slotId)
            });

            if (!schedule) {
                throw new NotFoundError('Không tìm thấy slot thời gian mới');
            }

            // Tìm slot cụ thể và kiểm tra trạng thái
            let slotFound = false;
            let slotIsBooked = true;

            for (const week of schedule.weekSchedule) {
                for (const slot of week.slots) {
                    if (slot._id?.toString() === updateData.slotId) {
                        slotFound = true;
                        slotIsBooked = slot.status !== "Free";
                        break;
                    }
                }
                if (slotFound) break;
            }

            if (!slotFound) {
                throw new NotFoundError('Không tìm thấy slot thời gian mới');
            }

            if (slotIsBooked) {
                throw new ValidationError({ slotId: 'Slot thời gian mới đã được đặt' });
            }

            // Cập nhật slot mới thành Booked
            await DoctorSchedules.updateOne(
                { 'weekSchedule.slots._id': new mongoose.Types.ObjectId(updateData.slotId) },
                { $set: { 'weekSchedule.$.slots.$[slot].status': 'Booked' } },
                { arrayFilters: [{ 'slot._id': new mongoose.Types.ObjectId(updateData.slotId) }] }
            );
        }

        // Kiểm tra nếu thay đổi typeLocation thành "home" thì phải có address
        if (updateData.typeLocation === 'home' && !updateData.address && !appointment.address) {
            throw new ValidationError({ address: 'Địa chỉ là bắt buộc khi chọn loại địa điểm là "home"' });
        }

        // Cập nhật cuộc hẹn
        const updatedAppointment = await Appointments.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).populate('profileId', 'fullName gender phone year', undefined, { strictPopulate: false })
            .populate('serviceId', 'serviceName price serviceType', undefined, { strictPopulate: false })
            .populate('packageId', 'name price serviceIds', undefined, { strictPopulate: false })
            .populate({
                path: 'doctorId',
                match: { isDeleted: { $ne: true } }, // Loại trừ doctor đã bị xóa
                populate: {
                    path: 'userId',
                    select: 'fullName email avatar'
                },
                options: { strictPopulate: false }
            });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật cuộc hẹn thành công',
            data: updatedAppointment
        });
    } catch (error) {
        console.error('Error in updateAppointment:', error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi cập nhật cuộc hẹn'
        });
    }
};

/**
 * Xóa mềm cuộc hẹn (cập nhật trạng thái thành cancelled)
 * Admin và Staff có thể hủy bất kỳ lịch nào
 * Customer chỉ có thể hủy lịch do mình đặt và sau khi đã đợi ít nhất 10 phút kể từ khi đặt lịch
 */
export const deleteAppointment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Kiểm tra ID có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ValidationError({ id: 'ID cuộc hẹn không hợp lệ' });
        }

        // Tìm cuộc hẹn hiện tại
        const appointment = await Appointments.findById(id);
        if (!appointment) {
            throw new NotFoundError('Không tìm thấy cuộc hẹn');
        }

        // Kiểm tra quyền hủy lịch
        const userRole = req.user?.role || '';
        const userId = req.user?._id || '';

        // Nếu là customer, kiểm tra thêm điều kiện
        if (userRole === 'customer') {
            // 1. Kiểm tra xem lịch hẹn có phải của customer này không
            if (appointment.createdByUserId?.toString() !== userId.toString()) {
                console.log('❌ [Debug] User không có quyền hủy lịch người khác:', { appointmentUserId: appointment.createdByUserId, requestUserId: userId });
                throw new UnauthorizedError('Không có quyền truy cập');
            }

            // 2. Chỉ cho phép hủy sau khi đã đợi 10 phút kể từ khi đặt lịch
            // Kiểm tra nếu createdAt tồn tại
            if (!appointment.createdAt) {
                console.log('❌ [Debug] Không tìm thấy thời gian tạo lịch');
                throw new ValidationError({ time: 'Không thể xác định thời gian đặt lịch' });
            }

            // Đảm bảo createdAt là kiểu Date
            const createdAt = appointment.createdAt instanceof Date
                ? appointment.createdAt
                : new Date(appointment.createdAt);

            const now = new Date();
            const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

            console.log('🔍 [Debug] Thời gian từ khi tạo lịch đến giờ:', {
                createdAt,
                now,
                diffMinutes,
                appointmentId: id
            });

            if (diffMinutes < 10) {
                console.log('❌ [Debug] Không thể hủy lịch khi chưa đủ 10 phút:', { diffMinutes, appointmentId: id });
                throw new ValidationError({ time: 'Bạn phải đợi ít nhất 10 phút sau khi đặt lịch mới có thể hủy' });
            }
        }

        // Chỉ cho phép hủy nếu trạng thái là pending, pending_payment, hoặc confirmed
        if (!['pending', 'pending_payment', 'confirmed'].includes(appointment.status)) {
            throw new ValidationError({ status: 'Không thể hủy cuộc hẹn đã hoàn thành hoặc đã hủy' });
        }

        // 🎯 PACKAGE REFUND INTEGRATION: Non-transaction approach for single-node MongoDB
        let packagePurchase: any = null;
        let originalRemainingUsages = 0;
        let packageRefundPerformed = false;

        try {
            // 🔍 STEP 1: If appointment uses package, refund +1 usage back to package
            if (appointment.packageId) {
                console.log('🔍 [Package Refund] Appointment uses package, processing refund...', {
                    appointmentId: id,
                    packageId: appointment.packageId,
                    userId: appointment.createdByUserId,
                    profileId: appointment.profileId
                });

                // Find the corresponding package purchase record
                packagePurchase = await PackagePurchases.findOne({
                    userId: appointment.createdByUserId,
                    profileId: appointment.profileId,
                    packageId: appointment.packageId,
                    // Note: We don't filter by isActive here because we want to refund even expired packages
                    expiredAt: { $gt: new Date() } // Only refund if package hasn't expired yet
                });

                if (!packagePurchase) {
                    console.log('⚠️ [Package Refund] No package purchase found or package expired', {
                        appointmentId: id,
                        packageId: appointment.packageId,
                        userId: appointment.createdByUserId,
                        profileId: appointment.profileId
                    });
                    // Continue with cancellation even if package not found (maybe manual appointment)
                } else {
                    console.log('✅ [Package Refund] Found package purchase, refunding usage...', {
                        packagePurchaseId: packagePurchase._id?.toString() || 'unknown',
                        currentRemainingUsages: packagePurchase.remainingUsages,
                        totalAllowedUses: packagePurchase.totalAllowedUses
                    });

                    // Store original value for logging and potential rollback
                    originalRemainingUsages = packagePurchase.remainingUsages;

                    // Validate we don't refund more than total allowed uses
                    if (packagePurchase.remainingUsages >= packagePurchase.totalAllowedUses) {
                        console.log('⚠️ [Package Refund] Package already at maximum usage, skipping refund', {
                            packagePurchaseId: packagePurchase._id?.toString(),
                            remainingUsages: packagePurchase.remainingUsages,
                            totalAllowedUses: packagePurchase.totalAllowedUses
                        });
                        // Continue with cancellation but don't refund
                    } else {
                        // Calculate new values - add back 1 usage
                        const newRemainingUsages = packagePurchase.remainingUsages + 1;
                        const now = new Date();
                        const newIsActive = (packagePurchase.expiredAt > now && newRemainingUsages > 0);

                        // Update package purchase with optimistic approach
                        const updateResult = await PackagePurchases.findByIdAndUpdate(
                            packagePurchase._id,
                            {
                                $set: {
                                    remainingUsages: newRemainingUsages,
                                    isActive: newIsActive
                                }
                            },
                            { new: true }
                        );

                        if (!updateResult) {
                            console.log('❌ [Package Refund] Failed to update package purchase, continuing with cancellation');
                            // Continue with cancellation even if package update failed
                        } else {
                            packageRefundPerformed = true;

                            console.log('✅ [Package Refund] Successfully refunded package usage', {
                                packagePurchaseId: packagePurchase._id?.toString() || 'unknown',
                                oldRemainingUsages: originalRemainingUsages,
                                newRemainingUsages: newRemainingUsages,
                                isNowActive: newIsActive
                            });
                        }
                    }
                }
            }

            // 🔍 STEP 2: Free up the slot if appointment had one
            if (appointment.slotId) {
                await DoctorSchedules.updateOne(
                    { 'weekSchedule.slots._id': appointment.slotId },
                    { $set: { 'weekSchedule.$.slots.$[slot].status': 'Free' } },
                    { arrayFilters: [{ 'slot._id': appointment.slotId }] }
                );
                console.log('✅ [Slot Liberation] Successfully freed up appointment slot', {
                    slotId: appointment.slotId?.toString()
                });
            }

            // 🔍 STEP 3: Update appointment status to cancelled
            const updatedAppointment = await Appointments.findByIdAndUpdate(
                id,
                { $set: { status: 'cancelled' } },
                { new: true }
            );

            console.log('✅ [Success] Appointment cancellation completed successfully', {
                appointmentId: id,
                hasPackage: !!appointment.packageId,
                packageRefunded: packageRefundPerformed,
                slotFreed: !!appointment.slotId
            });

            return res.status(200).json({
                success: true,
                message: packageRefundPerformed 
                    ? 'Hủy cuộc hẹn thành công và đã hoàn trả lượt sử dụng gói dịch vụ'
                    : 'Hủy cuộc hẹn thành công',
                data: updatedAppointment
            });

        } catch (error: any) {
            console.error('❌ [Error] Error in appointment cancellation + package refund:', error);
            
            // Manual rollback for package refund if appointment cancellation failed
            if (packageRefundPerformed && packagePurchase && originalRemainingUsages >= 0) {
                console.log('🔄 [Rollback] Attempting to rollback package refund...');
                try {
                    const now = new Date();
                    const rollbackIsActive = (packagePurchase.expiredAt > now && originalRemainingUsages > 0);
                    
                    await PackagePurchases.findByIdAndUpdate(
                        packagePurchase._id,
                        {
                            $set: {
                                remainingUsages: originalRemainingUsages,
                                isActive: rollbackIsActive
                            }
                        }
                    );
                    console.log('✅ [Rollback] Package refund rolled back successfully');
                } catch (rollbackError) {
                    console.error('❌ [Rollback] Failed to rollback package refund:', rollbackError);
                    // Log for manual intervention
                    console.error('🚨 [Critical] Manual intervention required for package refund rollback:', {
                        packagePurchaseId: packagePurchase._id?.toString(),
                        shouldBeRemainingUsages: originalRemainingUsages
                    });
                }
            }
            
            // Re-throw the original error
            throw error;
        }
    } catch (error) {
        console.error('Error in deleteAppointment:', error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi hủy cuộc hẹn'
        });
    }
};

/**
 * Cập nhật trạng thái cuộc hẹn
 */
export const updateAppointmentStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Kiểm tra ID có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ValidationError({ id: 'ID cuộc hẹn không hợp lệ' });
        }

        // Kiểm tra status có hợp lệ không - Updated với consulting status
        if (!['pending', 'pending_payment', 'paid', 'scheduled', 'confirmed', 'consulting', 'completed', 'cancelled', 'done_testResultItem', 'done_testResult'].includes(status)) {
            throw new ValidationError({ status: 'Trạng thái không hợp lệ' });
        }

        // Tìm cuộc hẹn hiện tại
        const appointment = await Appointments.findById(id);
        if (!appointment) {
            throw new NotFoundError('Không tìm thấy cuộc hẹn');
        }

        // Kiểm tra logic chuyển trạng thái
        const isAlreadyTerminal = appointment.status === 'cancelled' || appointment.status === 'completed' || appointment.status === 'expired';
        if (isAlreadyTerminal && appointment.status !== status) {
            throw new ValidationError({ status: `Không thể thay đổi trạng thái của cuộc hẹn đã ${appointment.status}` });
        }

        // ⭐️ LOGIC MỚI: Nếu chuyển sang các trạng thái hủy/hết hạn, giải phóng slot
        const shouldReleaseSlot = ['cancelled', 'payment_cancelled', 'expired'].includes(status);

        if (shouldReleaseSlot && appointment.slotId && appointment.status !== status) {
            try {
                const releaseResult = await DoctorSchedules.findOneAndUpdate(
                    { "weekSchedule.slots._id": appointment.slotId, "weekSchedule.slots.status": "Booked" },
                    { $set: { "weekSchedule.$[].slots.$[slot].status": "Free" } },
                    { 
                        arrayFilters: [{ "slot._id": appointment.slotId }],
                        new: true 
                    }
                );
                if (releaseResult) {
                    console.log(`✅ [Slot Release] Slot ${appointment.slotId} đã được giải phóng do trạng thái cuộc hẹn chuyển thành ${status}.`);
                } else {
                    console.warn(`⚠️ [Slot Release] Không tìm thấy slot ${appointment.slotId} để giải phóng, có thể nó đã được giải phóng trước đó.`);
                }
            } catch (releaseError: any) {
                // Log lỗi nhưng không dừng việc cập nhật trạng thái cuộc hẹn
                console.error(`❌ [Slot Release Error] Lỗi khi giải phóng slot ${appointment.slotId}:`, releaseError);
                // Cân nhắc thêm log hệ thống ở đây nếu cần
            }
        }

        // Cập nhật trạng thái
        const updatedAppointment = await Appointments.findByIdAndUpdate(
            id,
            { $set: { status } },
            { new: true }
        ).populate('profileId', 'fullName gender phone year', undefined, { strictPopulate: false })
            .populate('serviceId', 'serviceName price serviceType', undefined, { strictPopulate: false })
            .populate('packageId', 'name price serviceIds', undefined, { strictPopulate: false });

        // Log system activity
        const profileName = (updatedAppointment?.profileId as any)?.fullName || 'Unknown';
        const serviceName = (updatedAppointment?.serviceId as any)?.serviceName || 
                           (updatedAppointment?.packageId as any)?.name || 'Unknown service';
        
        await systemLogService.createLog({
            action: LogAction.APPOINTMENT_UPDATE,
            level: LogLevel.PUBLIC,
            message: `Appointment status changed: ${profileName} - ${serviceName} (${appointment.status} → ${status})`,
            targetId: id,
            targetType: 'appointment',
            metadata: {
                oldStatus: appointment.status,
                newStatus: status,
                appointmentDate: updatedAppointment?.appointmentDate,
                appointmentTime: updatedAppointment?.appointmentTime,
                profileName,
                serviceName
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái cuộc hẹn thành công',
            data: updatedAppointment
        });
    } catch (error) {
        console.error('Error in updateAppointmentStatus:', error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi cập nhật trạng thái cuộc hẹn'
        });
    }
};

/**
 * Cập nhật trạng thái thanh toán - chuyển từ pending_payment sang confirmed
 */
export const updatePaymentStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log('updatePaymentStatus called with:', { id, status });

        // Kiểm tra ID có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ValidationError({ id: 'ID cuộc hẹn không hợp lệ' });
        }

        // Kiểm tra status có hợp lệ không (chỉ cho phép scheduled)
        if (status !== 'scheduled') {
            throw new ValidationError({ status: 'Chỉ cho phép xác nhận thanh toán thành scheduled' });
        }

        // Tìm cuộc hẹn hiện tại
        const appointment = await Appointments.findById(id);
        if (!appointment) {
            throw new NotFoundError('Không tìm thấy cuộc hẹn');
        }

        console.log('Current appointment status:', appointment.status);

        // Nếu đã scheduled rồi thì trả về thành công luôn
        if (appointment.status === 'scheduled') {
            console.log('Appointment already scheduled, returning success');
            return res.status(200).json({
                success: true,
                message: 'Cuộc hẹn đã được xác nhận trước đó',
                data: appointment
            });
        }

        // Chỉ cho phép cập nhật nếu trạng thái hiện tại là pending_payment
        if (appointment.status !== 'pending_payment') {
            throw new ValidationError({ status: `Chỉ có thể cập nhật thanh toán cho cuộc hẹn đang chờ thanh toán. Trạng thái hiện tại: ${appointment.status}` });
        }

        // �� PACKAGE USAGE INTEGRATION: Non-transaction approach for single-node MongoDB
        let packagePurchase: any = null;
        let originalRemainingUsages = 0;
        let packageUpdatePerformed = false;
        
        try {
            // 🔍 STEP 1: Check and consume package usage if appointment uses package
            if (appointment.packageId) {
                console.log('🔍 [Package Usage] Appointment uses package, checking purchased package...', {
                    appointmentId: id,
                    packageId: appointment.packageId,
                    userId: appointment.createdByUserId,
                    profileId: appointment.profileId
                });

                // Find the corresponding package purchase record
                packagePurchase = await PackagePurchases.findOne({
                    userId: appointment.createdByUserId,
                    profileId: appointment.profileId,
                    packageId: appointment.packageId,
                    isActive: true,
                    remainingUsages: { $gt: 0 },
                    expiredAt: { $gt: new Date() }
                });

                if (!packagePurchase) {
                    console.log('❌ [Package Usage] No valid package purchase found', {
                        appointmentId: id,
                        packageId: appointment.packageId,
                        userId: appointment.createdByUserId,
                        profileId: appointment.profileId
                    });
                    throw new ValidationError({ 
                        package: 'Không tìm thấy gói dịch vụ hợp lệ hoặc gói đã hết lượt sử dụng' 
                    });
                }

                console.log('✅ [Package Usage] Found valid package purchase, consuming usage...', {
                    packagePurchaseId: packagePurchase._id?.toString() || 'unknown',
                    remainingUsages: packagePurchase.remainingUsages,
                    totalAllowedUses: packagePurchase.totalAllowedUses
                });

                // Store original value for logging and potential rollback
                originalRemainingUsages = packagePurchase.remainingUsages;

                // Validate remaining usages
                if (packagePurchase.remainingUsages <= 0) {
                    throw new ValidationError({ 
                        package: 'Gói dịch vụ đã hết lượt sử dụng' 
                    });
                }

                // Calculate new values
                const newRemainingUsages = packagePurchase.remainingUsages - 1;
                const now = new Date();
                const newIsActive = (packagePurchase.expiredAt > now && newRemainingUsages > 0);

                // Update package purchase with optimistic approach
                const updateResult = await PackagePurchases.findByIdAndUpdate(
                    packagePurchase._id,
                    {
                        $set: {
                            remainingUsages: newRemainingUsages,
                            isActive: newIsActive
                        }
                    },
                    { new: true }
                );

                if (!updateResult) {
                    throw new ValidationError({ 
                        package: 'Không thể cập nhật gói dịch vụ, có thể gói đã bị xóa' 
                    });
                }

                packageUpdatePerformed = true;

                console.log('✅ [Package Usage] Successfully consumed package usage', {
                    packagePurchaseId: packagePurchase._id?.toString() || 'unknown',
                    oldRemainingUsages: originalRemainingUsages,
                    newRemainingUsages: newRemainingUsages,
                    isStillActive: newIsActive
                });
            }

            // 🔍 STEP 2: Update appointment status to confirmed
            await Appointments.findByIdAndUpdate(
                id,
                { $set: { status: 'confirmed' } }
            );

            console.log('✅ [Success] Package usage and appointment status updated successfully', {
                appointmentId: id,
                hasPackage: !!appointment.packageId,
                packageConsumed: packageUpdatePerformed
            });

        } catch (error: any) {
            console.error('❌ [Error] Error in package usage + appointment update:', error);
            
            // Manual rollback for package usage if appointment update failed
            if (packageUpdatePerformed && packagePurchase && originalRemainingUsages > 0) {
                console.log('🔄 [Rollback] Attempting to rollback package usage...');
                try {
                    const now = new Date();
                    const rollbackIsActive = (packagePurchase.expiredAt > now && originalRemainingUsages > 0);
                    
                    await PackagePurchases.findByIdAndUpdate(
                        packagePurchase._id,
                        {
                            $set: {
                                remainingUsages: originalRemainingUsages,
                                isActive: rollbackIsActive
                            }
                        }
                    );
                    console.log('✅ [Rollback] Package usage rolled back successfully');
                } catch (rollbackError) {
                    console.error('❌ [Rollback] Failed to rollback package usage:', rollbackError);
                    // Log for manual intervention
                    console.error('🚨 [Critical] Manual intervention required for package:', {
                        packagePurchaseId: packagePurchase._id?.toString(),
                        shouldBeRemainingUsages: originalRemainingUsages
                    });
                }
            }
            
            // Re-throw the original error
            if (error instanceof ValidationError || error instanceof NotFoundError) {
                throw error;
            }
            
            throw new ValidationError({ 
                package: error.message || 'Không thể xử lý thanh toán và sử dụng gói dịch vụ' 
            });
        }

        // 🔍 STEP 3: Fetch updated appointment with populated data (outside transaction)
        const updatedAppointment = await Appointments.findById(id)
            .populate('profileId', 'fullName gender phone year', undefined, { strictPopulate: false })
            .populate('serviceId', 'serviceName price serviceType', undefined, { strictPopulate: false })
            .populate('packageId', 'name price serviceIds', undefined, { strictPopulate: false });

        console.log('✅ [Payment] Payment status updated successfully', {
            appointmentId: id,
            newStatus: 'confirmed',
            hasPackage: !!appointment.packageId
        });
        
        return res.status(200).json({
            success: true,
            message: 'Xác nhận thanh toán thành công',
            data: updatedAppointment
        });
    } catch (error) {
        console.error('Error in updatePaymentStatus:', error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi cập nhật trạng thái thanh toán'
        });
    }
};

/**
 * Lấy danh sách cuộc hẹn theo doctorId từ slot schedule
 * Phân trang và lọc theo các tiêu chí khác nhau
 */
export const getAppointmentsByDoctorId = async (req: AuthRequest, res: Response) => {
    try {
        const { doctorId } = req.params;
        const {
            page = 1,
            limit = 10,
            status,
            appointmentType,
            startDate,
            endDate
        } = req.query;

        // Kiểm tra doctorId có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            throw new ValidationError({ doctorId: 'ID bác sĩ không hợp lệ' });
        }

        // Tạo aggregation pipeline để tìm appointments dựa trên doctorId từ slot
        const matchStage: any = {};

        // Áp dụng các bộ lọc nếu có
        if (status) matchStage.status = status;
        if (appointmentType) matchStage.appointmentType = appointmentType;

        // Lọc theo khoảng thời gian
        if (startDate && endDate) {
            matchStage.appointmentDate = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        } else if (startDate) {
            matchStage.appointmentDate = { $gte: new Date(startDate as string) };
        } else if (endDate) {
            matchStage.appointmentDate = { $lte: new Date(endDate as string) };
        }

        // Pipeline để tìm appointments của doctor cụ thể
        const pipeline: any[] = [
            // Bước 1: Match appointments có slotId
            {
                $match: {
                    slotId: { $exists: true, $ne: null },
                    ...matchStage
                }
            },
            // Bước 2: Lookup để join với DoctorSchedules
            {
                $lookup: {
                    from: 'doctorschedules',
                    let: { slotId: '$slotId' },
                    pipeline: [
                        {
                            $match: {
                                doctorId: new mongoose.Types.ObjectId(doctorId),
                                $expr: {
                                    $in: ['$$slotId', {
                                        $reduce: {
                                            input: '$weekSchedule',
                                            initialValue: [],
                                            in: {
                                                $concatArrays: ['$$value', {
                                                    $map: {
                                                        input: '$$this.slots',
                                                        as: 'slot',
                                                        in: '$$slot._id'
                                                    }
                                                }]
                                            }
                                        }
                                    }]
                                }
                            }
                        }
                    ],
                    as: 'doctorSchedule'
                }
            },
            // Bước 3: Chỉ lấy appointments có matching doctor schedule
            {
                $match: {
                    'doctorSchedule.0': { $exists: true }
                }
            },
            // Bước 4: Lookup các thông tin liên quan
            {
                $lookup: {
                    from: 'userprofiles',
                    localField: 'profileId',
                    foreignField: '_id',
                    as: 'profileId',
                    pipeline: [
                        { $project: { fullName: 1, gender: 1, phone: 1, year: 1 } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'serviceId',
                    foreignField: '_id',
                    as: 'serviceId',
                    pipeline: [
                        { $project: { serviceName: 1, price: 1, serviceType: 1 } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'servicepackages',
                    localField: 'packageId',
                    foreignField: '_id',
                    as: 'packageId',
                    pipeline: [
                        { $project: { name: 1, price: 1 } }
                    ]
                }
            },
            // Bước 5: Unwind để flatten arrays
            {
                $unwind: {
                    path: '$profileId',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$serviceId',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$packageId',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Bước 6: Sort theo thời gian
            {
                $sort: { appointmentDate: -1, appointmentTime: -1 }
            }
        ];

        // Tính toán skip value cho phân trang
        const pageNumber = parseInt(page as string, 10);
        const limitNumber = parseInt(limit as string, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Đếm tổng số bản ghi
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await Appointments.aggregate(countPipeline);
        const total = countResult.length > 0 ? countResult[0].total : 0;

        // Lấy dữ liệu với phân trang
        const resultPipeline = [
            ...pipeline,
            { $skip: skip },
            { $limit: limitNumber }
        ];

        const appointments = await Appointments.aggregate(resultPipeline);

        return res.status(200).json({
            success: true,
            data: {
                appointments,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    pages: Math.ceil(total / limitNumber)
                }
            }
        });
    } catch (error) {
        console.error('Error in getAppointmentsByDoctorId:', error);
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy danh sách cuộc hẹn theo bác sĩ'
        });
    }
};

/**
 * Xác nhận cuộc hẹn (chuyển từ paid sang confirmed)
 */
export const confirmAppointment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Kiểm tra ID có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ValidationError({ id: 'ID cuộc hẹn không hợp lệ' });
        }

        // Tìm cuộc hẹn hiện tại
        const appointment = await Appointments.findById(id);
        if (!appointment) {
            throw new NotFoundError('Không tìm thấy cuộc hẹn');
        }

        // Chỉ cho phép xác nhận nếu trạng thái hiện tại là scheduled
        if (appointment.status !== 'scheduled') {
            throw new ValidationError({ status: 'Chỉ có thể xác nhận cuộc hẹn đã được lên lịch' });
        }

        // Keep status as scheduled (theo workflow mới không cần confirmed step)
        const updatedAppointment = await Appointments.findByIdAndUpdate(
            id,
            { $set: { status: 'scheduled' } },
            { new: true }
        ).populate('profileId', 'fullName gender phone year', undefined, { strictPopulate: false })
            .populate('serviceId', 'serviceName price serviceType', undefined, { strictPopulate: false })
            .populate('packageId', 'name price serviceIds', undefined, { strictPopulate: false });

        return res.status(200).json({
            success: true,
            message: 'Xác nhận cuộc hẹn thành công',
            data: updatedAppointment
        });
    } catch (error) {
        console.error('Error in confirmAppointment:', error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xác nhận cuộc hẹn'
        });
    }
};

/**
 * Hủy cuộc hẹn bởi bác sĩ với lý do (Doctor only)
 */
export const cancelAppointmentByDoctor = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Kiểm tra ID có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ValidationError({ id: 'ID cuộc hẹn không hợp lệ' });
        }

        // Kiểm tra user có phải doctor không
        if (req.user?.role !== 'doctor') {
            throw new UnauthorizedError('Chỉ bác sĩ mới có thể hủy lịch hẹn');
        }

        // Kiểm tra lý do hủy
        if (!reason || reason.trim().length === 0) {
            throw new ValidationError({ reason: 'Vui lòng nhập lý do hủy lịch hẹn' });
        }

        // Tìm cuộc hẹn hiện tại
        const appointment = await Appointments.findById(id);
        if (!appointment) {
            throw new NotFoundError('Không tìm thấy cuộc hẹn');
        }

        // Kiểm tra lịch hẹn đã bị hủy chưa
        if (appointment.status === 'cancelled') {
            throw new ValidationError({ status: 'Cuộc hẹn đã được hủy trước đó' });
        }

        // Kiểm tra lịch hẹn đã hoàn thành chưa
        if (appointment.status === 'completed') {
            throw new ValidationError({ status: 'Không thể hủy cuộc hẹn đã hoàn thành' });
        }

        // Giải phóng slot nếu có
        if (appointment.slotId) {
            console.log(`🔓 [CANCEL] Releasing slot ${appointment.slotId} for appointment ${id}`);
            await DoctorSchedules.updateOne(
                { 'weekSchedule.slots._id': appointment.slotId },
                { 
                    $set: { 'weekSchedule.$.slots.$[slot].status': 'Absent' },
                    $unset: {
                        'weekSchedule.$.slots.$[slot].bookedBy': 1,
                        'weekSchedule.$.slots.$[slot].bookedAt': 1
                    }
                },
                { arrayFilters: [{ 'slot._id': appointment.slotId }] }
            );
        }

        // Cập nhật trạng thái thành cancelled và lưu lý do vào notes
        const cancelNote = `[DOCTOR CANCELLED] ${reason.trim()}`;
        const existingNotes = appointment.notes || '';
        const updatedNotes = existingNotes 
            ? `${existingNotes}\n\n${cancelNote}` 
            : cancelNote;

        const updatedAppointment = await Appointments.findByIdAndUpdate(
            id,
            { 
                $set: { 
                    status: 'cancelled',
                    notes: updatedNotes
                } 
            },
            { new: true }
        ).populate('profileId', 'fullName gender phone year', undefined, { strictPopulate: false })
            .populate('serviceId', 'serviceName price serviceType', undefined, { strictPopulate: false })
            .populate('packageId', 'name price serviceIds', undefined, { strictPopulate: false });

        return res.status(200).json({
            success: true,
            message: 'Hủy cuộc hẹn thành công',
            data: updatedAppointment
        });
    } catch (error) {
        console.error('Error in cancelAppointmentByDoctor:', error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        if (error instanceof UnauthorizedError) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi hủy cuộc hẹn'
        });
    }
};

/**
 * Lấy danh sách cuộc hẹn của bác sĩ hiện tại (từ token) hoặc tất cả appointments cho staff
 * Không cần truyền doctorId trong params
 */
export const getMyAppointments = async (req: AuthRequest, res: Response) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            appointmentType,
            startDate,
            endDate
        } = req.query;

        // Kiểm tra user có trong token không
        if (!req.user?._id) {
            throw new UnauthorizedError('Không tìm thấy thông tin người dùng trong token');
        }

        // Kiểm tra user có phải doctor hoặc staff không
        if (!['doctor', 'staff'].includes(req.user.role)) {
            throw new UnauthorizedError('Chỉ bác sĩ hoặc nhân viên mới có thể truy cập endpoint này');
        }

        // Nếu là staff, trả về tất cả appointments (similar to getStaffAppointments)
        if (req.user.role === 'staff') {
            const matchStage: any = {
                // ✅ Fix: Lấy tất cả appointments, frontend sẽ filter
            };

            // Áp dụng các bộ lọc nếu có
            if (status) matchStage.status = status;

            // Lọc theo khoảng thời gian
            if (startDate && endDate) {
                matchStage.appointmentDate = {
                    $gte: new Date(startDate as string),
                    $lte: new Date(endDate as string)
                };
            } else if (startDate) {
                matchStage.appointmentDate = { $gte: new Date(startDate as string) };
            } else if (endDate) {
                matchStage.appointmentDate = { $lte: new Date(endDate as string) };
            }

            // Tính toán skip value cho phân trang
            const pageNumber = parseInt(page as string, 10);
            const limitNumber = parseInt(limit as string, 10);
            const skip = (pageNumber - 1) * limitNumber;

            // Đếm tổng số bản ghi thỏa mãn điều kiện
            const total = await Appointments.countDocuments(matchStage);

            // Lấy dữ liệu với populate các trường liên quan
            const appointments = await Appointments.find(matchStage)
                .populate('profileId', 'fullName gender phone year', undefined, { strictPopulate: false })
                .populate('serviceId', 'serviceName price serviceType', undefined, { strictPopulate: false })
                .populate('packageId', 'name price', undefined, { strictPopulate: false })
                .populate({
                    path: 'doctorId',
                    match: { isDeleted: { $ne: true } },
                    populate: {
                        path: 'userId',
                        select: 'fullName email avatar'
                    },
                    options: { strictPopulate: false }
                })
                .sort({ appointmentDate: -1, appointmentTime: -1 })
                .skip(skip)
                .limit(limitNumber);

            return res.status(200).json({
                success: true,
                data: {
                    appointments,
                    pagination: {
                        total,
                        page: pageNumber,
                        limit: limitNumber,
                        pages: Math.ceil(total / limitNumber)
                    }
                }
            });
        }

        // Logic cho Doctor: Tìm doctor record dựa trên userId từ token
        const doctor = await Doctor.findOne({ userId: req.user._id });
        
        if (!doctor) {
            // Nếu chưa có doctor record, trả về empty list thay vì error
            return res.status(200).json({
                success: true,
                data: {
                    appointments: [],
                    pagination: {
                        total: 0,
                        page: parseInt(page as string, 10),
                        limit: parseInt(limit as string, 10),
                        pages: 0
                    }
                },
                message: 'Chưa có thông tin bác sĩ trong hệ thống. Vui lòng liên hệ admin để thiết lập hồ sơ.'
            });
        }

        // Sử dụng logic tương tự getAppointmentsByDoctorId
        const doctorId = doctor._id.toString();
        const matchStage: any = {};

        // Áp dụng các bộ lọc nếu có
        if (status) matchStage.status = status;
        if (appointmentType) matchStage.appointmentType = appointmentType;

        // Lọc theo khoảng thời gian
        if (startDate && endDate) {
            matchStage.appointmentDate = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        } else if (startDate) {
            matchStage.appointmentDate = { $gte: new Date(startDate as string) };
        } else if (endDate) {
            matchStage.appointmentDate = { $lte: new Date(endDate as string) };
        }

        // Pipeline để tìm appointments của doctor cụ thể
        const pipeline: any[] = [
            // Bước 1: Match appointments có slotId
            {
                $match: {
                    slotId: { $exists: true, $ne: null },
                    ...matchStage
                }
            },
            // Bước 2: Lookup để join với DoctorSchedules
            {
                $lookup: {
                    from: 'doctorschedules',
                    let: { slotId: '$slotId' },
                    pipeline: [
                        {
                            $match: {
                                doctorId: new mongoose.Types.ObjectId(doctorId),
                                $expr: {
                                    $in: ['$$slotId', {
                                        $reduce: {
                                            input: '$weekSchedule',
                                            initialValue: [],
                                            in: {
                                                $concatArrays: ['$$value', {
                                                    $map: {
                                                        input: '$$this.slots',
                                                        as: 'slot',
                                                        in: '$$slot._id'
                                                    }
                                                }]
                                            }
                                        }
                                    }]
                                }
                            }
                        }
                    ],
                    as: 'doctorSchedule'
                }
            },
            // Bước 3: Chỉ lấy appointments có matching doctor schedule
            {
                $match: {
                    'doctorSchedule.0': { $exists: true }
                }
            },
            // Bước 4: Lookup các thông tin liên quan
            {
                $lookup: {
                    from: 'userprofiles',
                    localField: 'profileId',
                    foreignField: '_id',
                    as: 'profileId',
                    pipeline: [
                        { $project: { fullName: 1, gender: 1, phone: 1, year: 1 } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'serviceId',
                    foreignField: '_id',
                    as: 'serviceId',
                    pipeline: [
                        { $project: { serviceName: 1, price: 1, serviceType: 1 } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'servicepackages',
                    localField: 'packageId',
                    foreignField: '_id',
                    as: 'packageId',
                    pipeline: [
                        { $project: { name: 1, price: 1 } }
                    ]
                }
            },
            // Bước 5: Unwind để flatten arrays
            {
                $unwind: {
                    path: '$profileId',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$serviceId',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$packageId',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Bước 6: Sort theo thời gian
            {
                $sort: { appointmentDate: -1, appointmentTime: -1 }
            }
        ];

        // Tính toán skip value cho phân trang
        const pageNumber = parseInt(page as string, 10);
        const limitNumber = parseInt(limit as string, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Đếm tổng số bản ghi
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await Appointments.aggregate(countPipeline);
        const total = countResult.length > 0 ? countResult[0].total : 0;

        // Lấy dữ liệu với phân trang
        const resultPipeline = [
            ...pipeline,
            { $skip: skip },
            { $limit: limitNumber }
        ];

        const appointments = await Appointments.aggregate(resultPipeline);

        return res.status(200).json({
            success: true,
            data: {
                appointments,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    pages: Math.ceil(total / limitNumber)
                }
            }
        });
    } catch (error) {
        console.error('Error in getMyAppointments:', error);
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
            return res.status(error instanceof UnauthorizedError ? 401 : 404).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy danh sách cuộc hẹn của bác sĩ'
        });
    }
};

/**
 * Lấy danh sách tất cả cuộc hẹn cho Staff (chỉ appointment, không có consultation)
 * Staff có thể xem tất cả lịch hẹn appointment của tất cả bác sĩ để hỗ trợ nhập liệu
 */
export const getStaffAppointments = async (req: AuthRequest, res: Response) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            startDate,
            endDate,
            doctorId
        } = req.query;

        // Kiểm tra user có trong token không và có phải staff không
        if (!req.user?._id) {
            throw new UnauthorizedError('Không tìm thấy thông tin người dùng trong token');
        }

        if (req.user.role !== 'staff') {
            throw new UnauthorizedError('Chỉ nhân viên mới có thể truy cập endpoint này');
        }

        const matchStage: any = {
            // ✅ Fix: Loại bỏ filter quá chặt, lấy tất cả appointments
            // Backend sẽ lấy tất cả, frontend sẽ filter hiển thị
        };

        // Áp dụng các bộ lọc nếu có
        if (status) matchStage.status = status;

        // Lọc theo bác sĩ nếu có
        if (doctorId && mongoose.Types.ObjectId.isValid(doctorId as string)) {
            matchStage.doctorId = new mongoose.Types.ObjectId(doctorId as string);
        }

        // Lọc theo khoảng thời gian
        if (startDate && endDate) {
            matchStage.appointmentDate = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        } else if (startDate) {
            matchStage.appointmentDate = { $gte: new Date(startDate as string) };
        } else if (endDate) {
            matchStage.appointmentDate = { $lte: new Date(endDate as string) };
        }

        // Tính toán skip value cho phân trang
        const pageNumber = parseInt(page as string, 10);
        const limitNumber = parseInt(limit as string, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Đếm tổng số bản ghi thỏa mãn điều kiện
        const total = await Appointments.countDocuments(matchStage);

        // Lấy dữ liệu với populate các trường liên quan
        const appointments = await Appointments.find(matchStage)
            .populate('profileId', 'fullName gender phone year', undefined, { strictPopulate: false })
            .populate('serviceId', 'serviceName price serviceType', undefined, { strictPopulate: false })
            .populate('packageId', 'name price', undefined, { strictPopulate: false })
            .populate({
                path: 'doctorId',
                match: { isDeleted: { $ne: true } },
                populate: {
                    path: 'userId',
                    select: 'fullName email avatar'
                },
                options: { strictPopulate: false }
            })
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .skip(skip)
            .limit(limitNumber);

        return res.status(200).json({
            success: true,
            data: {
                appointments,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    pages: Math.ceil(total / limitNumber)
                }
            }
        });
    } catch (error) {
        console.error('Error in getStaffAppointments:', error);
        if (error instanceof UnauthorizedError) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy danh sách cuộc hẹn cho staff'
        });
    }
};

/**
 * Lấy danh sách appointments của user hiện tại (chỉ appointments, không có consultations)
 */
export const getUserAppointments = async (req: AuthRequest, res: Response) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            appointmentType,
            startDate,
            endDate
        } = req.query;

        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy thông tin user từ token'
            });
        }

        const query: any = {
            createdByUserId: userId // Chỉ lấy appointments của user hiện tại
        };

        // Áp dụng các bộ lọc nếu có
        if (status) query.status = status;
        if (appointmentType) query.appointmentType = appointmentType;

        // Lọc theo khoảng thời gian
        if (startDate && endDate) {
            query.appointmentDate = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        } else if (startDate) {
            query.appointmentDate = { $gte: new Date(startDate as string) };
        } else if (endDate) {
            query.appointmentDate = { $lte: new Date(endDate as string) };
        }

        // Tính toán skip value cho phân trang
        const pageNumber = parseInt(page as string, 10);
        const limitNumber = parseInt(limit as string, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Đếm tổng số bản ghi thỏa mãn điều kiện
        const total = await Appointments.countDocuments(query);

        // Lấy dữ liệu với populate các trường liên quan
        const appointments = await Appointments.find(query)
            .populate({
                path: 'profileId',
                model: 'UserProfiles',
                select: 'fullName gender phone year',
                options: { strictPopulate: false }
            })
            .populate({
                path: 'serviceId',
                model: 'Service',
                select: 'serviceName price serviceType',
                options: { strictPopulate: false }
            })
            .populate({
                path: 'packageId',
                model: 'ServicePackages',
                select: 'name price',
                options: { strictPopulate: false }
            })
            .populate({
                path: 'doctorId',
                match: { isDeleted: { $ne: true } },
                populate: {
                    path: 'userId',
                    select: 'fullName email avatar isActive',
                    match: { isActive: { $ne: false } }
                },
                options: { strictPopulate: false }
            })
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .skip(skip)
            .limit(limitNumber);

        return res.status(200).json({
            success: true,
            data: {
                appointments,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    pages: Math.ceil(total / limitNumber)
                }
            }
        });
    } catch (error) {
        console.error('Error in getUserAppointments:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy danh sách cuộc hẹn của bạn'
        });
    }
};

/**
 * Lấy toàn bộ lịch sử đặt lịch của user (kết hợp appointments + consultations)
 */
export const getUserBookingHistory = async (req: AuthRequest, res: Response) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            startDate,
            endDate,
            serviceType // 'appointment' | 'consultation' | 'all'
        } = req.query;

        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy thông tin user từ token'
            });
        }

        console.log('🔍 [getUserBookingHistory] Fetching for user:', userId);

        // Tính toán skip value cho phân trang
        const pageNumber = parseInt(page as string, 10);
        const limitNumber = parseInt(limit as string, 10);
        const skip = (pageNumber - 1) * limitNumber;

        let allBookings: any[] = [];

        // 1. Lấy Appointments nếu cần
        if (!serviceType || serviceType === 'all' || serviceType === 'appointment') {
            try {
                const appointmentQuery: any = {
                    createdByUserId: userId
                };

                // Áp dụng filters
                if (status) appointmentQuery.status = status;
                if (startDate && endDate) {
                    appointmentQuery.appointmentDate = {
                        $gte: new Date(startDate as string),
                        $lte: new Date(endDate as string)
                    };
                } else if (startDate) {
                    appointmentQuery.appointmentDate = { $gte: new Date(startDate as string) };
                } else if (endDate) {
                    appointmentQuery.appointmentDate = { $lte: new Date(endDate as string) };
                }

                const appointments = await Appointments.find(appointmentQuery)
                    .populate({
                        path: 'profileId',
                        model: 'UserProfiles',
                        select: 'fullName gender phone year',
                        options: { strictPopulate: false }
                    })
                    .populate({
                        path: 'serviceId',
                        model: 'Service',
                        select: 'serviceName price serviceType',
                        options: { strictPopulate: false }
                    })
                    .populate({
                        path: 'packageId',
                        model: 'ServicePackages',
                        select: 'name price',
                        options: { strictPopulate: false }
                    })
                    .populate({
                        path: 'doctorId',
                        match: { isDeleted: { $ne: true } },
                        populate: {
                            path: 'userId',
                            select: 'fullName email avatar isActive',
                            match: { isActive: { $ne: false } }
                        },
                        options: { strictPopulate: false }
                    });

                // Transform appointments thành unified format
                const transformedAppointments = appointments.map((apt: any) => ({
                    _id: apt._id,
                    type: 'appointment', // Phân biệt loại
                    serviceId: apt.serviceId?._id || null,
                    serviceName: apt.packageId?.name || apt.serviceId?.serviceName || 'Dịch vụ không xác định',
                    packageName: apt.packageId?.name || null,
                    doctorId: apt.doctorId?._id || null,
                    doctorName: apt.doctorId?.userId?.fullName || 'Chưa chỉ định bác sĩ',
                    doctorAvatar: apt.doctorId?.userId?.avatar || null,
                    patientName: apt.profileId?.fullName || 'Không xác định',
                    appointmentDate: apt.appointmentDate,
                    appointmentTime: apt.appointmentTime,
                    appointmentSlot: apt.appointmentTime, // Alias cho consistency
                    typeLocation: apt.typeLocation,
                    status: apt.status,
                    price: apt.packageId?.price || apt.serviceId?.price || 0,
                    createdAt: apt.createdAt,
                    description: apt.description,
                    notes: apt.notes,
                    address: apt.address,
                    canCancel: ['pending', 'pending_payment', 'confirmed'].includes(apt.status),
                    canReschedule: ['pending', 'confirmed'].includes(apt.status),
                    // Appointment-specific fields
                    appointmentType: apt.appointmentType,
                    billId: apt.billId,
                    slotId: apt.slotId
                }));

                allBookings.push(...transformedAppointments);
                console.log(`✅ [getUserBookingHistory] Found ${transformedAppointments.length} appointments`);
            } catch (error) {
                console.error('❌ [getUserBookingHistory] Error fetching appointments:', error);
            }
        }

        // 2. Lấy Consultations nếu cần
        if (!serviceType || serviceType === 'all' || serviceType === 'consultation') {
            try {
                // Import DoctorQA dynamically để tránh circular dependency
                const { DoctorQA } = await import('../models');

                const consultationQuery: any = {
                    userId: userId
                };

                // Áp dụng filters
                if (status) consultationQuery.status = status;
                if (startDate && endDate) {
                    consultationQuery.appointmentDate = {
                        $gte: new Date(startDate as string),
                        $lte: new Date(endDate as string)
                    };
                } else if (startDate) {
                    consultationQuery.appointmentDate = { $gte: new Date(startDate as string) };
                } else if (endDate) {
                    consultationQuery.appointmentDate = { $lte: new Date(endDate as string) };
                }

                const consultations = await DoctorQA.find(consultationQuery)
                    .populate({
                        path: 'doctorId',
                        match: { isDeleted: { $ne: true } },
                        populate: {
                            path: 'userId',
                            select: 'fullName email avatar isActive',
                            match: { isActive: { $ne: false } }
                        },
                        options: { strictPopulate: false }
                    })
                    .populate({
                        path: 'serviceId',
                        model: 'Service',
                        select: 'serviceName price serviceType',
                        options: { strictPopulate: false }
                    });

                // Transform consultations thành unified format
                const transformedConsultations = consultations.map((consult: any) => ({
                    _id: consult._id,
                    type: 'consultation', // Phân biệt loại
                    serviceId: consult.serviceId?._id || null,
                    serviceName: consult.serviceName || consult.serviceId?.serviceName || 'Tư vấn trực tuyến',
                    packageName: null, // Consultations không có package
                    doctorId: consult.doctorId?._id || null,
                    doctorName: consult.doctorId?.userId?.fullName || 'Chưa chỉ định bác sĩ',
                    doctorAvatar: consult.doctorId?.userId?.avatar || null,
                    patientName: consult.fullName || 'Không xác định',
                    appointmentDate: consult.appointmentDate || null,
                    appointmentTime: null, // Consultations không có appointmentTime riêng
                    appointmentSlot: consult.appointmentSlot || null,
                    typeLocation: 'Online', // Consultations luôn là Online
                    status: consult.status,
                    price: consult.consultationFee || 0,
                    createdAt: consult.createdAt,
                    description: consult.question, // question mapping thành description
                    notes: consult.notes,
                    address: null, // Consultations không có address
                    canCancel: ['pending_payment', 'scheduled'].includes(consult.status),
                    canReschedule: false, // Consultations không thể reschedule
                    // Consultation-specific fields
                    phone: consult.phone,
                    age: consult.age,
                    gender: consult.gender,
                    question: consult.question,
                    doctorNotes: consult.doctorNotes,
                    slotId: consult.slotId
                }));

                allBookings.push(...transformedConsultations);
                console.log(`✅ [getUserBookingHistory] Found ${transformedConsultations.length} consultations`);
            } catch (error) {
                console.error('❌ [getUserBookingHistory] Error fetching consultations:', error);
            }
        }

        // 3. Sort theo thời gian tạo (mới nhất trước)
        allBookings.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });

        // 4. Áp dụng phân trang
        const total = allBookings.length;
        const paginatedBookings = allBookings.slice(skip, skip + limitNumber);

        console.log(`✅ [getUserBookingHistory] Total: ${total}, Page: ${pageNumber}, Returning: ${paginatedBookings.length}`);

        return res.status(200).json({
            success: true,
            data: {
                bookings: paginatedBookings,
                summary: {
                    totalAppointments: allBookings.filter(b => b.type === 'appointment').length,
                    totalConsultations: allBookings.filter(b => b.type === 'consultation').length,
                    totalBookings: total
                },
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    pages: Math.ceil(total / limitNumber)
                }
            }
        });
    } catch (error) {
        console.error('❌ [getUserBookingHistory] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy lịch sử đặt lịch của bạn'
        });
    }
}; 