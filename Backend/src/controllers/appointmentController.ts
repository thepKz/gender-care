import { Request, Response } from "express";
import mongoose from "mongoose";
import {
    Appointment,
    UserProfile,
    Service,
    ServicePackage,
    DoctorSchedule,
    Doctor,
    User
} from "../models";
import { AuthRequest } from "../types";

// GET /appointments - Lấy danh sách cuộc hẹn
export const getAppointments = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const userRole = req.user?.role;
        const { page = 1, limit = 10, status, profileId, userId: filterUserId } = req.query;

        if (!userId) {
            return res.status(401).json({ message: "Không tìm thấy thông tin người dùng" });
        }

        // Build filter based on user role
        const filter: any = {};

        // Customer/Guest chỉ xem appointments của mình
        // Staff/Admin/Manager/Doctor có thể xem TẤT CẢ appointments
        if (userRole === "customer" || userRole === "guest") {
            filter.createdByUserId = userId;
        } else if (["staff", "admin", "manager", "doctor"].includes(userRole || "")) {
            // Staff/Admin/Manager/Doctor có thể filter theo userId cụ thể
            if (filterUserId) {
                filter.createdByUserId = filterUserId;
            }
            // Nếu không có filterUserId thì xem TẤT CẢ appointments
        } else {
            // Fallback: nếu role không xác định, chỉ xem của mình
            filter.createdByUserId = userId;
        }

        // Các filter khác
        if (status) filter.status = status;
        if (profileId) filter.profileId = profileId;

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Aggregate pipeline để lấy thông tin cơ bản cho list view
        const appointments = await Appointment.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "userprofiles",
                    localField: "profileId",
                    foreignField: "_id",
                    as: "profile"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "createdByUserId",
                    foreignField: "_id",
                    as: "createdByUser"
                }
            },
            {
                $lookup: {
                    from: "services",
                    localField: "serviceId",
                    foreignField: "_id",
                    as: "service"
                }
            },
            {
                $lookup: {
                    from: "servicepackages",
                    localField: "packageId",
                    foreignField: "_id",
                    as: "package"
                }
            },
            {
                $lookup: {
                    from: "doctorschedules",
                    let: { slotId: "$slotId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$$slotId", {
                                        $reduce: {
                                            input: "$weekSchedule",
                                            initialValue: [],
                                            in: {
                                                $concatArrays: ["$$value", {
                                                    $map: {
                                                        input: "$$this.slots",
                                                        as: "slot",
                                                        in: "$$slot._id"
                                                    }
                                                }]
                                            }
                                        }
                                    }]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "doctors",
                                localField: "doctorId",
                                foreignField: "_id",
                                as: "doctor"
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "doctor.userId",
                                foreignField: "_id",
                                as: "doctorUser"
                            }
                        }
                    ],
                    as: "doctorSchedule"
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) }
        ]);

        // Format response data - Tối giản cho list view
        const formattedAppointments = appointments.map(appointment => {
            const baseData = {
                _id: appointment._id,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                appointmentType: appointment.appointmentType,
                typeLocation: appointment.typeLocation,
                status: appointment.status,
                // Thông tin tối giản của profile
                profile: appointment.profile[0] ? {
                    _id: appointment.profile[0]._id,
                    fullName: appointment.profile[0].fullName
                } : null,
                // Thông tin tối giản của service/package
                service: appointment.service[0] ? {
                    _id: appointment.service[0]._id,
                    serviceName: appointment.service[0].serviceName,
                    price: appointment.service[0].price
                } : null,
                package: appointment.package[0] ? {
                    _id: appointment.package[0]._id,
                    name: appointment.package[0].name,
                    price: appointment.package[0].price
                } : null,
                // Thông tin tối giản của bác sĩ
                doctor: appointment.doctorSchedule[0]?.doctorUser[0] ? {
                    _id: appointment.doctorSchedule[0].doctorUser[0]._id,
                    fullName: appointment.doctorSchedule[0].doctorUser[0].fullName,
                    avatar: appointment.doctorSchedule[0].doctorUser[0].avatar
                } : null,
                createdAt: appointment.createdAt
            };

            // Admin/Staff/Manager/Doctor cần xem thêm thông tin user tạo appointment
            if (["admin", "staff", "manager", "doctor"].includes(userRole || "")) {
                return {
                    ...baseData,
                    createdByUser: appointment.createdByUser[0] ? {
                        _id: appointment.createdByUser[0]._id,
                        fullName: appointment.createdByUser[0].fullName,
                        email: appointment.createdByUser[0].email,
                        phone: appointment.createdByUser[0].phone
                    } : null
                };
            }

            return baseData;
        });

        // Get total count for pagination
        const total = await Appointment.countDocuments(filter);

        return res.status(200).json({
            data: formattedAppointments,
            pagination: {
                current: Number(page),
                pageSize: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error: any) {
        console.log("Error in getAppointments:", error);
        return res.status(500).json({
            message: "Đã xảy ra lỗi khi lấy danh sách cuộc hẹn",
        });
    }
};

// POST /appointments - Đặt lịch hẹn
export const createAppointment = async (req: AuthRequest, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user?._id;
        const {
            profileId,
            serviceId,
            packageId,
            slotId,
            appointmentDate,
            appointmentTime,
            appointmentType,
            typeLocation,
            address,
            description,
            notes
        } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "Không tìm thấy thông tin người dùng" });
        }

        // Validation: Phải có ít nhất serviceId hoặc packageId
        if (!serviceId && !packageId) {
            return res.status(400).json({
                message: "Vui lòng chọn dịch vụ hoặc gói dịch vụ"
            });
        }

        // Kiểm tra profile thuộc về user
        const profile = await UserProfile.findOne({
            _id: profileId,
            ownerId: userId
        }).session(session);

        if (!profile) {
            return res.status(404).json({
                message: "Không tìm thấy hồ sơ hoặc bạn không có quyền truy cập"
            });
        }

        // Kiểm tra service/package tồn tại
        if (serviceId) {
            const service = await Service.findOne({
                _id: serviceId,
                isDeleted: false
            }).session(session);

            if (!service) {
                return res.status(404).json({ message: "Dịch vụ không tồn tại" });
            }
        }

        if (packageId) {
            const servicePackage = await ServicePackage.findOne({
                _id: packageId,
                isActive: true
            }).session(session);

            if (!servicePackage) {
                return res.status(404).json({ message: "Gói dịch vụ không tồn tại" });
            }
        }

        // Kiểm tra slot có available không
        const schedule = await DoctorSchedule.findOne({
            "weekSchedule.slots._id": slotId
        }).session(session);

        if (!schedule) {
            return res.status(404).json({ message: "Không tìm thấy lịch làm việc" });
        }

        // Tìm slot cụ thể
        let targetSlot: any = null;
        let dayIndex = -1;
        let slotIndex = -1;

        for (let i = 0; i < schedule.weekSchedule.length; i++) {
            const day = schedule.weekSchedule[i];
            for (let j = 0; j < day.slots.length; j++) {
                if (day.slots[j]._id?.toString() === slotId) {
                    targetSlot = day.slots[j];
                    dayIndex = i;
                    slotIndex = j;
                    break;
                }
            }
            if (targetSlot) break;
        }

        if (!targetSlot) {
            return res.status(404).json({ message: "Không tìm thấy khung giờ" });
        }

        if (targetSlot.isBooked) {
            return res.status(400).json({ message: "Khung giờ này đã được đặt" });
        }

        // Kiểm tra thời gian hẹn có hợp lệ không (không được đặt trong quá khứ)
        const appointmentDateTime = new Date(appointmentDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Reset time to start of day

        if (appointmentDateTime < now) {
            return res.status(400).json({
                message: "Không thể đặt lịch hẹn trong quá khứ"
            });
        }

        // Tạo appointment
        const newAppointment = new Appointment({
            createdByUserId: userId,
            profileId,
            serviceId: serviceId || undefined,
            packageId: packageId || undefined,
            slotId,
            appointmentDate: appointmentDateTime,
            appointmentTime,
            appointmentType,
            typeLocation,
            address,
            description,
            notes,
            status: "pending"
        });

        await newAppointment.save({ session });

        // Update slot status
        await DoctorSchedule.updateOne(
            {
                _id: schedule._id,
                [`weekSchedule.${dayIndex}.slots.${slotIndex}._id`]: slotId
            },
            {
                $set: {
                    [`weekSchedule.${dayIndex}.slots.${slotIndex}.isBooked`]: true
                }
            },
            { session }
        );

        await session.commitTransaction();

        // Lấy thông tin chi tiết appointment vừa tạo
        const appointmentWithDetails = await Appointment.findById(newAppointment._id)
            .populate('profileId', 'fullName gender phone')
            .populate('serviceId', 'serviceName price serviceType')
            .populate('packageId', 'name price');

        return res.status(201).json({
            message: "Đặt lịch hẹn thành công",
            data: appointmentWithDetails
        });

    } catch (error: any) {
        await session.abortTransaction();
        console.log("Error in createAppointment:", error);
        return res.status(500).json({
            message: "Đã xảy ra lỗi khi đặt lịch hẹn",
        });
    } finally {
        session.endSession();
    }
};

// GET /appointments/:id - Lấy chi tiết cuộc hẹn
export const getAppointmentById = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ message: "Không tìm thấy thông tin người dùng" });
        }

        const appointment = await Appointment.findOne({
            _id: id,
            createdByUserId: userId
        })
            .populate('profileId', 'fullName gender phone year')
            .populate('serviceId', 'serviceName price description serviceType availableAt')
            .populate('packageId', 'name price description serviceIds');

        if (!appointment) {
            return res.status(404).json({
                message: "Không tìm thấy cuộc hẹn hoặc bạn không có quyền truy cập"
            });
        }

        // Lấy thông tin bác sĩ
        const schedule = await DoctorSchedule.findOne({
            "weekSchedule.slots._id": appointment.slotId
        }).populate({
            path: 'doctorId',
            populate: {
                path: 'userId',
                select: 'fullName avatar phone'
            }
        });

        const doctorInfo = schedule?.doctorId ? {
            _id: (schedule.doctorId as any)._id,
            bio: (schedule.doctorId as any).bio,
            experience: (schedule.doctorId as any).experience,
            rating: (schedule.doctorId as any).rating,
            specialization: (schedule.doctorId as any).specialization,
            user: (schedule.doctorId as any).userId
        } : null;

        const response = {
            ...appointment.toObject(),
            doctor: doctorInfo
        };

        return res.status(200).json({ data: response });

    } catch (error: any) {
        console.log("Error in getAppointmentById:", error);
        return res.status(500).json({
            message: "Đã xảy ra lỗi khi lấy thông tin cuộc hẹn",
        });
    }
};

// PUT /appointments/:id - Cập nhật cuộc hẹn
export const updateAppointment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const {
            appointmentDate,
            appointmentTime,
            typeLocation,
            address,
            description,
            notes
        } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "Không tìm thấy thông tin người dùng" });
        }

        // Tìm appointment
        const appointment = await Appointment.findOne({
            _id: id,
            createdByUserId: userId
        });

        if (!appointment) {
            return res.status(404).json({
                message: "Không tìm thấy cuộc hẹn hoặc bạn không có quyền truy cập"
            });
        }

        // Chỉ cho phép cập nhật nếu status là pending hoặc confirmed
        if (appointment.status === "completed" || appointment.status === "cancelled") {
            return res.status(400).json({
                message: "Không thể cập nhật cuộc hẹn đã hoàn thành hoặc đã hủy"
            });
        }

        // Update fields
        const updateData: any = {};
        if (appointmentDate) {
            const newDate = new Date(appointmentDate);
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            if (newDate < now) {
                return res.status(400).json({
                    message: "Không thể cập nhật ngày hẹn trong quá khứ"
                });
            }
            updateData.appointmentDate = newDate;
        }

        if (appointmentTime) updateData.appointmentTime = appointmentTime;
        if (typeLocation) updateData.typeLocation = typeLocation;
        if (address !== undefined) updateData.address = address;
        if (description !== undefined) updateData.description = description;
        if (notes !== undefined) updateData.notes = notes;

        const updatedAppointment = await Appointment.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
            .populate('profileId', 'fullName gender phone')
            .populate('serviceId', 'serviceName price serviceType')
            .populate('packageId', 'name price');

        return res.status(200).json({
            message: "Cập nhật cuộc hẹn thành công",
            data: updatedAppointment
        });

    } catch (error: any) {
        console.log("Error in updateAppointment:", error);
        return res.status(500).json({
            message: "Đã xảy ra lỗi khi cập nhật cuộc hẹn",
        });
    }
};

// DELETE /appointments/:id - Hủy cuộc hẹn
export const deleteAppointment = async (req: AuthRequest, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user?._id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ message: "Không tìm thấy thông tin người dùng" });
        }

        // Tìm appointment
        const appointment = await Appointment.findOne({
            _id: id,
            createdByUserId: userId
        }).session(session);

        if (!appointment) {
            return res.status(404).json({
                message: "Không tìm thấy cuộc hẹn hoặc bạn không có quyền truy cập"
            });
        }

        // Chỉ cho phép hủy nếu status là pending hoặc confirmed
        if (appointment.status === "completed" || appointment.status === "cancelled") {
            return res.status(400).json({
                message: "Không thể hủy cuộc hẹn đã hoàn thành hoặc đã hủy"
            });
        }

        // Update appointment status to cancelled
        await Appointment.findByIdAndUpdate(
            id,
            { status: "cancelled" },
            { session }
        );

        // Giải phóng slot
        const schedule = await DoctorSchedule.findOne({
            "weekSchedule.slots._id": appointment.slotId
        }).session(session);

        if (schedule) {
            // Tìm và update slot
            for (let i = 0; i < schedule.weekSchedule.length; i++) {
                const day = schedule.weekSchedule[i];
                for (let j = 0; j < day.slots.length; j++) {
                    if (day.slots[j]._id?.toString() === appointment.slotId.toString()) {
                        await DoctorSchedule.updateOne(
                            {
                                _id: schedule._id,
                                [`weekSchedule.${i}.slots.${j}._id`]: appointment.slotId
                            },
                            {
                                $set: {
                                    [`weekSchedule.${i}.slots.${j}.isBooked`]: false
                                }
                            },
                            { session }
                        );
                        break;
                    }
                }
            }
        }

        await session.commitTransaction();

        return res.status(200).json({
            message: "Hủy cuộc hẹn thành công"
        });

    } catch (error: any) {
        await session.abortTransaction();
        console.log("Error in deleteAppointment:", error);
        return res.status(500).json({
            message: "Đã xảy ra lỗi khi hủy cuộc hẹn",
        });
    } finally {
        session.endSession();
    }
};

// PUT /appointments/:id/status - Thay đổi trạng thái cuộc hẹn (dành cho staff/doctor)
export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const userRole = req.user?.role;
        const { id } = req.params;
        const { status } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "Không tìm thấy thông tin người dùng" });
        }

        // Chỉ staff, doctor, manager, admin mới được phép thay đổi status
        if (!["staff", "doctor", "manager", "admin"].includes(userRole || "")) {
            return res.status(403).json({
                message: "Bạn không có quyền thay đổi trạng thái cuộc hẹn"
            });
        }

        // Validate status
        const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Trạng thái không hợp lệ"
            });
        }

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({ message: "Không tìm thấy cuộc hẹn" });
        }

        // Validate status transition
        const currentStatus = appointment.status;

        // Logic chuyển đổi trạng thái
        const allowedTransitions: { [key: string]: string[] } = {
            "pending": ["confirmed", "cancelled"],
            "confirmed": ["completed", "cancelled"],
            "completed": [], // Không thể thay đổi từ completed
            "cancelled": [] // Không thể thay đổi từ cancelled
        };

        if (!allowedTransitions[currentStatus].includes(status)) {
            return res.status(400).json({
                message: `Không thể chuyển từ trạng thái ${currentStatus} sang ${status}`
            });
        }

        const updatedAppointment = await Appointment.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        )
            .populate('profileId', 'fullName gender phone')
            .populate('serviceId', 'serviceName price serviceType')
            .populate('packageId', 'name price');

        return res.status(200).json({
            message: "Cập nhật trạng thái cuộc hẹn thành công",
            data: updatedAppointment
        });

    } catch (error: any) {
        console.log("Error in updateAppointmentStatus:", error);
        return res.status(500).json({
            message: "Đã xảy ra lỗi khi cập nhật trạng thái cuộc hẹn",
        });
    }
}; 