import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Appointments, DoctorSchedules, Services, ServicePackages, UserProfiles, PackagePurchases, Doctor } from '../models';
import { NotFoundError } from '../errors/notFoundError';
import { ValidationError } from '../errors/validationError';
import { UnauthorizedError } from '../errors/unauthorizedError';

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
            .populate('profileId', 'fullName gender phone year')
            .populate('serviceId', 'serviceName price serviceType')
            .populate('packageId', 'name price')
            .populate({
                path: 'doctorId',
                match: { isDeleted: { $ne: true } }, // Loại trừ doctor đã bị xóa
                populate: {
                    path: 'userId',
                    select: 'fullName email avatar'
                }
            })
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .skip(skip)
            .limit(limitNumber);

        // Debug logging để kiểm tra dữ liệu doctor
        console.log('🔍 [Debug] Sample appointment doctor data:', appointments.slice(0, 2).map(apt => ({
            _id: apt._id,
            doctorId: apt.doctorId,
            doctorIdType: typeof apt.doctorId,
            hasDoctor: apt.doctorId ? true : false,
            doctorUserId: (apt.doctorId as any)?.userId,
            doctorFullName: (apt.doctorId as any)?.userId?.fullName
        })));

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
    try {
        const {
            profileId,
            packageId,
            serviceId,
            slotId,
            appointmentDate,
            appointmentTime,
            appointmentType,
            typeLocation,
            address,
            description,
            notes
        } = req.body;

        // Kiểm tra profileId có tồn tại không
        const profile = await UserProfiles.findById(profileId);
        if (!profile) {
            throw new NotFoundError('Không tìm thấy hồ sơ người dùng');
        }

        // Kiểm tra ít nhất một trong hai: packageId hoặc serviceId phải được cung cấp
        if (!packageId && !serviceId) {
            throw new ValidationError({ general: 'Phải cung cấp một trong hai: packageId hoặc serviceId' });
        }

        // Tính toán totalAmount dựa trên service/package
        let totalAmount = 0;

        // Nếu có packageId, kiểm tra nó có tồn tại không và lấy giá
        if (packageId) {
            const packageData = await ServicePackages.findById(packageId);
            if (!packageData) {
                throw new NotFoundError('Không tìm thấy gói dịch vụ');
            }
            totalAmount = packageData.price;
        }

        // Nếu có serviceId, kiểm tra nó có tồn tại không và lấy giá
        if (serviceId) {
            const serviceData = await Services.findById(serviceId);
            if (!serviceData) {
                throw new NotFoundError('Không tìm thấy dịch vụ');
            }
            totalAmount = serviceData.price;
        }

        console.log('💰 [Debug] Payment calculation:', {
            packageId,
            serviceId,
            typeLocation,
            totalAmount
        });

        // Kiểm tra slot có trống không và lấy thông tin bác sĩ (nếu slotId được cung cấp)
        let assignedDoctorId = null;
        if (slotId) {
            console.log('🔍 [Debug] Checking slot availability:', { slotId, appointmentDate, appointmentTime });

            // Logic để kiểm tra slot có trống không
            // Tìm schedule có chứa slot với _id matching slotId
            const schedule = await DoctorSchedules.findOne({
                'weekSchedule.slots._id': slotId
            });

            console.log('🔍 [Debug] Found schedule for slot:', schedule ? 'YES' : 'NO');

            if (!schedule) {
                console.log('❌ [Debug] No schedule found containing slotId:', slotId);
                throw new NotFoundError('Không tìm thấy slot thời gian');
            }

            // Lấy doctorId từ schedule để assign vào appointment
            assignedDoctorId = schedule.doctorId;
            console.log('🔍 [Debug] Assigned doctor ID:', assignedDoctorId);

            // Tìm slot cụ thể và kiểm tra trạng thái
            let slotFound = false;
            let slotIsBooked = true;

            for (const week of schedule.weekSchedule) {
                for (const slot of week.slots) {
                    if (slot._id?.toString() === slotId) {
                        slotFound = true;
                        slotIsBooked = slot.status !== "Free";
                        break;
                    }
                }
                if (slotFound) break;
            }

            if (!slotFound) {
                throw new NotFoundError('Không tìm thấy slot thời gian');
            }

            if (slotIsBooked) {
                throw new ValidationError({ slotId: 'Slot thời gian này đã được đặt' });
            }
        }

        // Kiểm tra nếu typeLocation là "home" thì phải có address
        if (typeLocation === 'home' && !address) {
            throw new ValidationError({ address: 'Địa chỉ là bắt buộc khi chọn loại địa điểm là "home"' });
        }

        // 🎯 PACKAGE USAGE INTEGRATION: Non-transaction approach for single-node MongoDB
        let newAppointment: any = null;
        let packagePurchase: any = null;
        let originalRemainingUsages = 0;
        let packageUpdatePerformed = false;

        try {
            // 🔍 STEP 1: If using packageId, validate and consume package usage first
            if (packageId) {
                console.log('🔍 [Package Creation] Appointment uses package, validating purchased package...', {
                    packageId,
                    userId: req.user?._id,
                    profileId
                });

                // Find the corresponding package purchase record
                packagePurchase = await PackagePurchases.findOne({
                    userId: req.user?._id,
                    profileId,
                    packageId,
                    isActive: true,
                    remainingUsages: { $gt: 0 },
                    expiredAt: { $gt: new Date() }
                });

                if (!packagePurchase) {
                    console.log('❌ [Package Creation] No valid package purchase found', {
                        packageId,
                        userId: req.user?._id,
                        profileId
                    });
                    throw new ValidationError({ 
                        package: 'Không tìm thấy gói dịch vụ hợp lệ hoặc gói đã hết lượt sử dụng' 
                    });
                }

                console.log('✅ [Package Creation] Found valid package purchase, consuming usage...', {
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

                console.log('✅ [Package Creation] Successfully consumed package usage', {
                    packagePurchaseId: packagePurchase._id?.toString() || 'unknown',
                    oldRemainingUsages: originalRemainingUsages,
                    newRemainingUsages: newRemainingUsages,
                    isStillActive: newIsActive
                });
            }

            // 🔍 STEP 2: Create appointment
            // For package bookings, set status to 'confirmed' directly since package is already consumed
            // For service bookings, set status to 'pending_payment' as before
            const appointmentStatus = packageId ? 'confirmed' : 'pending_payment';

            newAppointment = await Appointments.create({
                createdByUserId: req.user?._id, // Lấy từ middleware xác thực
                profileId,
                packageId: packageId || undefined,
                serviceId: serviceId || undefined,
                doctorId: assignedDoctorId || undefined, // Gán bác sĩ từ slot
                slotId: slotId || undefined,
                appointmentDate,
                appointmentTime,
                appointmentType,
                typeLocation,
                address,
                description,
                notes,
                status: appointmentStatus
            });

            // 🔍 STEP 3: Update slot status if needed
            if (slotId) {
                await DoctorSchedules.updateOne(
                    { 'weekSchedule.slots._id': new mongoose.Types.ObjectId(slotId) },
                    { $set: { 'weekSchedule.$.slots.$[slot].status': 'Booked' } },
                    { arrayFilters: [{ 'slot._id': new mongoose.Types.ObjectId(slotId) }] }
                );
            }

            console.log('✅ [Success] Appointment creation and package usage completed successfully', {
                appointmentId: newAppointment._id?.toString() || 'unknown',
                status: appointmentStatus,
                hasPackage: !!packageId,
                packageConsumed: packageUpdatePerformed
            });

        } catch (error: any) {
            console.error('❌ [Error] Error in appointment creation + package usage:', error);
            
            // Manual rollback for package usage if appointment creation failed
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
                general: error.message || 'Không thể tạo cuộc hẹn và sử dụng gói dịch vụ' 
            });
        }

        // Trả về kết quả thành công
        return res.status(201).json({
            success: true,
            message: 'Đặt lịch hẹn thành công! Vui lòng hoàn tất thanh toán.',
            data: newAppointment
        });
    } catch (error) {
        console.error('Error in createAppointment:', error);
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
            message: 'Đã xảy ra lỗi khi tạo cuộc hẹn'
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
            .populate('profileId', 'fullName gender phone year')
            .populate('serviceId', 'serviceName price serviceType')
            .populate('packageId', 'name price serviceIds')
            .populate('createdByUserId', 'fullName email')
            .populate({
                path: 'doctorId',
                match: { isDeleted: { $ne: true } }, // Loại trừ doctor đã bị xóa
                populate: {
                    path: 'userId',
                    select: 'fullName email avatar'
                }
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
        ).populate('profileId', 'fullName gender phone year')
            .populate('serviceId', 'serviceName price serviceType')
            .populate('packageId', 'name price serviceIds')
            .populate({
                path: 'doctorId',
                match: { isDeleted: { $ne: true } }, // Loại trừ doctor đã bị xóa
                populate: {
                    path: 'userId',
                    select: 'fullName email avatar'
                }
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

        // Kiểm tra status có hợp lệ không
        if (!['pending', 'pending_payment', 'paid', 'confirmed', 'completed', 'cancelled'].includes(status)) {
            throw new ValidationError({ status: 'Trạng thái không hợp lệ' });
        }

        // Tìm cuộc hẹn hiện tại
        const appointment = await Appointments.findById(id);
        if (!appointment) {
            throw new NotFoundError('Không tìm thấy cuộc hẹn');
        }

        // Kiểm tra logic chuyển trạng thái
        if (appointment.status === 'cancelled' && status !== 'cancelled') {
            throw new ValidationError({ status: 'Không thể thay đổi trạng thái của cuộc hẹn đã hủy' });
        }

        if (appointment.status === 'completed' && status !== 'completed') {
            throw new ValidationError({ status: 'Không thể thay đổi trạng thái của cuộc hẹn đã hoàn thành' });
        }

        // Nếu chuyển sang cancelled, giải phóng slot
        if (status === 'cancelled' && appointment.status !== 'cancelled' && appointment.slotId) {
            await DoctorSchedules.updateOne(
                { 'weekSchedule.slots._id': appointment.slotId },
                { $set: { 'weekSchedule.$.slots.$[slot].status': 'Free' } },
                { arrayFilters: [{ 'slot._id': appointment.slotId }] }
            );
        }

        // Cập nhật trạng thái
        const updatedAppointment = await Appointments.findByIdAndUpdate(
            id,
            { $set: { status } },
            { new: true }
        ).populate('profileId', 'fullName gender phone year')
            .populate('serviceId', 'serviceName price serviceType')
            .populate('packageId', 'name price serviceIds');

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

        // 🎯 PACKAGE USAGE INTEGRATION: Non-transaction approach for single-node MongoDB
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
            .populate('profileId', 'fullName gender phone year')
            .populate('serviceId', 'serviceName price serviceType')
            .populate('packageId', 'name price serviceIds');

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
        ).populate('profileId', 'fullName gender phone year')
            .populate('serviceId', 'serviceName price serviceType')
            .populate('packageId', 'name price serviceIds');

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
        ).populate('profileId', 'fullName gender phone year')
            .populate('serviceId', 'serviceName price serviceType')
            .populate('packageId', 'name price serviceIds');

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
 * Lấy danh sách cuộc hẹn của bác sĩ hiện tại (từ token)
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

        // Kiểm tra user có phải doctor không
        if (req.user.role !== 'doctor') {
            throw new UnauthorizedError('Chỉ bác sĩ mới có thể truy cập endpoint này');
        }

        // Tìm doctor record dựa trên userId từ token
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