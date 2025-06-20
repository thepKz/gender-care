import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Appointments, DoctorSchedules, Services, ServicePackages, UserProfiles } from '../models';
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

        // Tạo appointment mới
        const newAppointment = await Appointments.create({
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
            status: 'pending_payment', // ✅ Set status to pending_payment để trigger payment flow
            totalAmount, // ✅ Thêm tổng tiền cần thanh toán
            paymentStatus: 'unpaid' // ✅ Set payment status mặc định
        });

        // Nếu có slotId, cập nhật trạng thái slot thành "Booked"
        if (slotId) {
            await DoctorSchedules.updateOne(
                { 'weekSchedule.slots._id': new mongoose.Types.ObjectId(slotId) },
                { $set: { 'weekSchedule.$.slots.$[slot].status': 'Booked' } },
                { arrayFilters: [{ 'slot._id': new mongoose.Types.ObjectId(slotId) }] }
            );
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

        // Giải phóng slot nếu có
        if (appointment.slotId) {
            await DoctorSchedules.updateOne(
                { 'weekSchedule.slots._id': appointment.slotId },
                { $set: { 'weekSchedule.$.slots.$[slot].status': 'Free' } },
                { arrayFilters: [{ 'slot._id': appointment.slotId }] }
            );
        }

        // Cập nhật trạng thái thành cancelled
        const updatedAppointment = await Appointments.findByIdAndUpdate(
            id,
            { $set: { status: 'cancelled' } },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Hủy cuộc hẹn thành công',
            data: updatedAppointment
        });
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
        if (!['pending', 'pending_payment', 'confirmed', 'completed', 'cancelled'].includes(status)) {
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

        // Kiểm tra status có hợp lệ không (chỉ cho phép confirmed)
        if (status !== 'confirmed') {
            throw new ValidationError({ status: 'Chỉ cho phép xác nhận thanh toán' });
        }

        // Tìm cuộc hẹn hiện tại
        const appointment = await Appointments.findById(id);
        if (!appointment) {
            throw new NotFoundError('Không tìm thấy cuộc hẹn');
        }

        console.log('Current appointment status:', appointment.status);

        // Nếu đã confirmed rồi thì trả về thành công luôn
        if (appointment.status === 'confirmed') {
            console.log('Appointment already confirmed, returning success');
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

        // Cập nhật trạng thái sang confirmed
        const updatedAppointment = await Appointments.findByIdAndUpdate(
            id,
            { $set: { status: 'confirmed' } },
            { new: true }
        ).populate('profileId', 'fullName gender phone year')
            .populate('serviceId', 'serviceName price serviceType')
            .populate('packageId', 'name price serviceIds');

        console.log('Payment status updated successfully');
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

 