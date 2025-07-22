import { Request, Response } from "express";
import mongoose from "mongoose";
import { NotFoundError } from "../errors/notFoundError";
import { UnauthorizedError } from "../errors/unauthorizedError";
import { ValidationError } from "../errors/validationError";
import {
  Appointments,
  PaymentTracking,
  Doctor,
  DoctorSchedules,
  PackagePurchases,
  Service,
  User,
} from "../models";
import { LogAction, LogLevel } from "../models/SystemLogs";
import { UserProfile } from "../models/UserProfile";
import * as paymentService from "../services/paymentService";
import systemLogService from "../services/systemLogService";
import PackageUsageService from "../services/packageUsageService";
import { releaseSlot } from "../services/doctorScheduleService";

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
      createdByUserId,
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
        $lte: new Date(endDate as string),
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
        path: "profileId",
        model: "UserProfiles",
        select: "fullName gender phone year",
        options: { strictPopulate: false },
      })
      .populate({
        path: "serviceId",
        model: "Service",
        select: "serviceName price serviceType",
        options: { strictPopulate: false },
      })
      .populate({
        path: "packageId",
        model: "ServicePackages",
        select: "name price",
        options: { strictPopulate: false },
      })
      .populate({
        path: "doctorId",
        match: { isDeleted: { $ne: true } }, // Loại trừ doctor đã bị xóa
        populate: {
          path: "userId",
          select: "fullName email avatar isActive",
          match: { isActive: { $ne: false } }, // Chỉ lấy user active
        },
        options: { strictPopulate: false },
      })
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Process appointments để handle missing doctor data
    const processedAppointments = appointments.map((apt) => {
      const appointmentObj = apt.toObject() as any; // Cast to any để add custom properties

      // Type cast để access populated fields
      const populatedDoctor = appointmentObj.doctorId as any;

      // Handle missing doctor data gracefully
      if (!populatedDoctor || !populatedDoctor.userId) {
        appointmentObj.doctorInfo = {
          fullName: "Chưa chỉ định bác sĩ",
          email: null,
          avatar: null,
          isActive: false,
          missing: true,
        };
        // Keep original doctorId for reference if exists
        if (populatedDoctor && !populatedDoctor.userId) {
          console.warn(
            `⚠️ [Appointment] Doctor ${
              populatedDoctor._id || populatedDoctor
            } has no userId or inactive user`
          );
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
          missing: false,
        };
      }

      // 🔄 Sync phone & phoneNumber for FE compatibility
      if (appointmentObj.profileId) {
        // Nếu BE chỉ có phone, bổ sung phoneNumber
        if (
          appointmentObj.profileId.phone &&
          !appointmentObj.profileId.phoneNumber
        ) {
          appointmentObj.profileId.phoneNumber = appointmentObj.profileId.phone;
        }

        // Ngược lại – nếu lỡ lưu phoneNumber nhưng thiếu phone
        if (
          appointmentObj.profileId.phoneNumber &&
          !appointmentObj.profileId.phone
        ) {
          appointmentObj.profileId.phone = appointmentObj.profileId.phoneNumber;
        }
      }

      return appointmentObj;
    });

    // Debug logging để kiểm tra dữ liệu doctor
    console.log(
      "🔍 [Debug] Sample appointment doctor data:",
      processedAppointments.slice(0, 2).map((apt) => ({
        _id: apt._id,
        doctorId: apt.doctorId?._id || apt.doctorId,
        doctorInfo: apt.doctorInfo,
        hasValidDoctor: !apt.doctorInfo.missing,
      }))
    );

    return res.status(200).json({
      success: true,
      data: {
        appointments: processedAppointments,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllAppointments:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách cuộc hẹn",
    });
  }
};

/**
 * Tạo cuộc hẹn mới
 */
export const createAppointment = async (req: AuthRequest, res: Response) => {
  console.log("--- [createAppointment] Nhận request với body:", req.body);
  const {
    profileId,
    packageId,
    serviceId,
    doctorId,
    slotId,
    appointmentDate,
    appointmentTime,
    appointmentType,
    typeLocation,
    description,
    notes,
    bookingType,
    packagePurchaseId,
  } = req.body;

  console.log("🔍 [createAppointment] BookingType received:", bookingType);

  const userId = req.user?._id;
  if (!userId) {
    console.error("[createAppointment] Không tìm thấy userId trong req.user");
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID not found." });
  }

  // Validate bookingType
  if (
    !bookingType ||
    !["service_only", "new_package", "purchased_package"].includes(bookingType)
  ) {
    console.error("[createAppointment] bookingType không hợp lệ:", bookingType);
    return res.status(400).json({
      success: false,
      message:
        "Loại đặt lịch không hợp lệ. Phải là một trong: service_only, new_package, purchased_package",
    });
  }

  try {
    console.log("[createAppointment] Tìm user:", userId);
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      console.error("[createAppointment] Không tìm thấy user:", userId);
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại." });
    }

    console.log("[createAppointment] Tìm hồ sơ bệnh nhân:", profileId);
    const patientProfile = await UserProfile.findById(profileId);
    if (
      !patientProfile ||
      patientProfile.ownerId.toString() !== userId.toString()
    ) {
      console.error(
        "[createAppointment] Hồ sơ bệnh nhân không hợp lệ:",
        profileId,
        "ownerId:",
        patientProfile?.ownerId
      );
      return res.status(404).json({
        success: false,
        message: "Hồ sơ bệnh nhân không hợp lệ hoặc không thuộc về bạn.",
      });
    }

    // Validate doctorId if provided
    if (doctorId && !mongoose.Types.ObjectId.isValid(doctorId)) {
      console.error("[createAppointment] doctorId không hợp lệ:", doctorId);
      return res.status(400).json({
        success: false,
        message: "ID bác sĩ không hợp lệ",
      });
    }

    // ✅ FIX: Validate service/package trước khi tạo appointment
    let totalAmount = 0;
    if (bookingType === "service_only" && serviceId) {
      console.log(
        "[createAppointment] Processing service booking - serviceId:",
        serviceId
      );
      const service = await Service.findById(serviceId);
      if (!service || !service.price) {
        console.error(
          "[createAppointment] Không tìm thấy service hoặc không có giá:",
          serviceId
        );
        return res.status(404).json({
          success: false,
          message: "Dịch vụ không tồn tại hoặc không có giá.",
        });
      }

      totalAmount = service.price;
      console.log(
        "[createAppointment] Service booking - totalAmount:",
        totalAmount
      );
    } else if (bookingType === "new_package" && packageId) {
      console.log(
        "[createAppointment] Processing new package booking - packageId:",
        packageId
      );
      const servicePackage =
        await require("../models/ServicePackages").default.findById(packageId);
      if (!servicePackage || !servicePackage.price) {
        console.error(
          "[createAppointment] Không tìm thấy package hoặc không có giá:",
          packageId
        );
        return res.status(404).json({
          success: false,
          message: "Gói dịch vụ không tồn tại hoặc không có giá.",
        });
      }

      totalAmount = servicePackage.price;
      console.log(
        "[createAppointment] New package booking - totalAmount:",
        totalAmount
      );
    } else if (
      bookingType === "purchased_package" &&
      packagePurchaseId &&
      serviceId
    ) {
      console.log(
        "[createAppointment] Processing purchased package booking - packagePurchaseId:",
        packagePurchaseId,
        "serviceId:",
        serviceId
      );
      // Validate package purchase exists and user owns it
      const packagePurchase = await PackagePurchases.findOne({
        _id: packagePurchaseId,
        userId: userId,
        status: "active",
      });

      if (!packagePurchase) {
        console.error(
          "[createAppointment] Không tìm thấy package purchase hoặc không thuộc về user:",
          packagePurchaseId
        );
        return res.status(404).json({
          success: false,
          message: "Gói dịch vụ đã mua không tồn tại hoặc không thuộc về bạn.",
        });
      }

      // Validate service is included in the package and has remaining usage
      const serviceUsage = packagePurchase.usedServices.find(
        (us) => us.serviceId.toString() === serviceId
      );
      if (
        !serviceUsage ||
        serviceUsage.usedQuantity >= (serviceUsage.maxQuantity || 1)
      ) {
        console.error(
          "[createAppointment] Service không có trong gói hoặc đã hết lượt sử dụng:",
          serviceId
        );
        return res.status(400).json({
          success: false,
          message: "Dịch vụ không có trong gói hoặc đã hết lượt sử dụng.",
        });
      }

      totalAmount = 0; // Free for purchased package
      console.log(
        "[createAppointment] Purchased package booking - totalAmount:",
        totalAmount,
        "(free)"
      );
    } else {
      console.error("[createAppointment] Invalid booking configuration:", {
        bookingType,
        serviceId,
        packageId,
        packagePurchaseId,
      });
      return res.status(400).json({
        success: false,
        message:
          "Cấu hình đặt lịch không hợp lệ. Vui lòng kiểm tra lại thông tin.",
      });
    }

    // 🚨 CRITICAL: Kiểm tra bệnh nhân đã có lịch hẹn cùng thời gian chưa
    console.log("[createAppointment] Checking patient double booking...");
    const existingAppointment = await Appointments.findOne({
      profileId: patientProfile._id,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      status: { $nin: ["cancelled", "completed", "expired", "payment_cancelled"] }
    });

    if (existingAppointment) {
      console.error("[createAppointment] DOUBLE BOOKING DETECTED:", {
        profileId: patientProfile._id,
        patientName: patientProfile.fullName,
        appointmentDate,
        appointmentTime,
        existingDoctorId: existingAppointment.doctorId,
        newDoctorId: doctorId
      });
      return res.status(409).json({
        success: false,
        message: `Bệnh nhân ${patientProfile.fullName} đã có lịch hẹn vào ${appointmentTime} ngày ${appointmentDate}. Một bệnh nhân không thể có 2 lịch hẹn cùng thời gian.`,
        errorCode: "PATIENT_DOUBLE_BOOKING"
      });
    }

    console.log("[createAppointment] Tạo appointment với doctorId:", doctorId);

    // ✅ FIX: Chỉ tạo appointment, KHÔNG tạo PaymentTracking (Lazy Payment Creation)
    // ✅ FIX: Khi sử dụng purchased package, lưu packageId thay vì serviceId
    const appointmentData: any = {
      createdByUserId: userId,
      profileId: patientProfile._id,
      status: totalAmount > 0 ? "pending_payment" : "confirmed",
      appointmentDate,
      appointmentTime,
      appointmentType,
      typeLocation,
      description,
      notes,
      doctorId: doctorId,
      slotId: slotId,
      totalAmount: totalAmount,
      bookingType: bookingType,
      packagePurchaseId: packagePurchaseId,
      paymentStatus:
        bookingType === "purchased_package"
          ? "paid"
          : totalAmount > 0
          ? "unpaid"
          : "paid",
    };

    // Logic để lưu serviceId hoặc packageId tùy theo bookingType
    if (bookingType === "purchased_package") {
      // Khi sử dụng purchased package, lưu packageId từ package purchase
      if (packagePurchaseId) {
        const packagePurchase = await PackagePurchases.findById(packagePurchaseId);
        if (packagePurchase) {
          appointmentData.packageId = packagePurchase.packageId;
          // Không lưu serviceId khi sử dụng purchased package
        }
      }
    } else if (bookingType === "service_only") {
      // Khi đặt service đơn lẻ, lưu serviceId
      appointmentData.serviceId = serviceId;
    } else if (bookingType === "new_package") {
      // Khi đặt package mới, lưu packageId
      appointmentData.packageId = packageId;
    }

    const newAppointment = new Appointments(appointmentData);

    console.log("🔍 [createAppointment] Creating appointment with:", {
      bookingType,
      totalAmount,
      status: totalAmount > 0 ? "pending_payment" : "confirmed",
      serviceId: appointmentData.serviceId,
      packageId: appointmentData.packageId,
      packagePurchaseId,
    });

    // 🔒 CRITICAL FIX: Lock slot TRƯỚC KHI tạo appointment để tránh race condition
    if (slotId && totalAmount > 0) {
      console.log("[createAppointment] Attempting to lock slot:", slotId);
      const lockResult = await DoctorSchedules.findOneAndUpdate(
        {
          "weekSchedule.slots._id": new mongoose.Types.ObjectId(slotId),
          "weekSchedule.slots.status": "Free",
        },
        {
          $set: { "weekSchedule.$[].slots.$[slot].status": "Booked" },
        },
        {
          arrayFilters: [{ "slot._id": new mongoose.Types.ObjectId(slotId) }],
          new: true,
        }
      );

      if (!lockResult) {
        console.error("[createAppointment] RACE CONDITION: Slot đã được đặt:", slotId);
        return res.status(409).json({
          success: false,
          message: "Slot thời gian này đã được đặt bởi người khác. Vui lòng chọn slot khác.",
          errorCode: "SLOT_ALREADY_BOOKED"
        });
      }
      console.log(`[Slot Lock] Slot ${slotId} đã được khóa TRƯỚC KHI tạo appointment.`);
    }

    // Sau khi lock slot thành công, mới tạo appointment
    try {
      const savedAppointment = await newAppointment.save();
      if (!savedAppointment || !savedAppointment._id) {
        throw new Error(
          "Lưu lịch hẹn thất bại hoặc không nhận được ID sau khi lưu."
        );
      }
      console.log(
        "[createAppointment] Đã lưu appointment:",
        savedAppointment._id
      );

      // 🔥 Trừ lượt sử dụng nếu là gói đã mua
      if (
        savedAppointment.bookingType === "purchased_package" &&
        savedAppointment.packagePurchaseId &&
        serviceId // Sử dụng serviceId từ request body thay vì từ appointment
      ) {
        await PackageUsageService.useServiceFromPackage(
          savedAppointment.packagePurchaseId.toString(),
          serviceId.toString(),
          savedAppointment._id.toString()
        );
      }

      await systemLogService.createLog({
        action: LogAction.APPOINTMENT_CREATE,
        level: LogLevel.PUBLIC,
        message: `Tạo lịch hẹn mới #${savedAppointment._id} cho user ${userId}`,
        userId: userId?.toString(),
        targetId: savedAppointment._id.toString(),
        targetType: "Appointment",
      });

      console.log(
        "[createAppointment] Thành công, PaymentTracking sẽ được tạo khi user click thanh toán"
      );
      return res.status(201).json({
        success: true,
        message: "Tạo lịch hẹn thành công! Vui lòng tiến hành thanh toán.",
        data: {
          appointment: savedAppointment,
          // ✅ FIX: Không trả paymentUrl, user sẽ click nút thanh toán riêng
          needsPayment: true,
          totalAmount: totalAmount,
        },
      });
    } catch (error: any) {
      console.error(
        "❌ [Appointment Error] Error during appointment creation:",
        error
      );

      // 🔒 CRITICAL ROLLBACK: Release slot nếu đã lock
      if (slotId && totalAmount > 0) {
        try {
          await DoctorSchedules.findOneAndUpdate(
            {
              "weekSchedule.slots._id": new mongoose.Types.ObjectId(slotId),
              "weekSchedule.slots.status": "Booked",
            },
            {
              $set: { "weekSchedule.$[].slots.$[slot].status": "Free" },
            },
            {
              arrayFilters: [{ "slot._id": new mongoose.Types.ObjectId(slotId) }],
            }
          );
          console.log(`🔓 [Rollback] Released slot ${slotId} due to appointment creation failure.`);
        } catch (releaseError) {
          console.error(`❌ [Rollback Error] Failed to release slot ${slotId}:`, releaseError);
        }
      }

      // Rollback appointment deletion
      if (newAppointment?._id) {
        await Appointments.findByIdAndDelete(newAppointment._id);
        console.log(
          `🗑️ [Rollback] Deleted appointment ${newAppointment._id} due to failure.`
        );
      }

      return res.status(500).json({
        success: false,
        message: "Đã có lỗi xảy ra trong quá trình đặt lịch",
        error: error.message,
      });
    }
  } catch (error) {
    const err = error as any;
    console.error("❌ [Appointment Error] Lỗi ngoài try chính:", err);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra trong quá trình đặt lịch",
      error: err.message,
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
      throw new ValidationError({ id: "ID cuộc hẹn không hợp lệ" });
    }

    // ✅ DEBUG: Lấy raw appointment trước khi populate
    const rawAppointment = await Appointments.findById(id);
    if (!rawAppointment) {
      throw new NotFoundError("Không tìm thấy cuộc hẹn");
    }

    console.log("🔍 [getAppointmentById] Raw appointment data:", {
      _id: rawAppointment._id,
      profileId: rawAppointment.profileId,
      serviceId: rawAppointment.serviceId,
      packageId: rawAppointment.packageId,
      doctorId: rawAppointment.doctorId,
      createdByUserId: rawAppointment.createdByUserId,
      bookingType: rawAppointment.bookingType,
    });

    // ✅ FIXED: Populate với error handling tốt hơn
    const appointment = await Appointments.findById(id)
      .populate({
        path: "profileId",
        select: "fullName gender phone year",
        options: { strictPopulate: false },
      })
      .populate({
        path: "serviceId",
        select: "serviceName price serviceType",
        options: { strictPopulate: false },
      })
      .populate({
        path: "packageId",
        select: "name price serviceIds",
        options: { strictPopulate: false },
      })
      .populate({
        path: "createdByUserId",
        select: "fullName email",
        options: { strictPopulate: false },
      })
      .populate({
        path: "doctorId",
        match: { isDeleted: { $ne: true } },
        populate: {
          path: "userId",
          select: "fullName email avatar",
        },
        options: { strictPopulate: false },
      });

    console.log("🔍 [getAppointmentById] After populate:", {
      _id: appointment?._id,
      profileId: appointment?.profileId,
      serviceId: appointment?.serviceId,
      packageId: appointment?.packageId,
      doctorId: appointment?.doctorId,
      createdByUserId: appointment?.createdByUserId,
    });

    // ✅ FALLBACK: Nếu populate thất bại, merge raw data với populated data
    if (!appointment) {
      throw new NotFoundError("Không tìm thấy cuộc hẹn sau populate");
    }

    const finalAppointment = {
      ...appointment.toObject(),
      // Preserve raw IDs if populate failed
      _rawProfileId: rawAppointment.profileId,
      _rawServiceId: rawAppointment.serviceId,
      _rawPackageId: rawAppointment.packageId,
      _rawCreatedByUserId: rawAppointment.createdByUserId,
    };

    console.log("🔍 [getAppointmentById] Final appointment with fallback:", {
      profileId: finalAppointment.profileId,
      _rawProfileId: finalAppointment._rawProfileId,
      serviceId: finalAppointment.serviceId,
      _rawServiceId: finalAppointment._rawServiceId,
    });

    return res.status(200).json({
      success: true,
      data: finalAppointment,
    });
  } catch (error) {
    console.error("Error in getAppointmentById:", error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy chi tiết cuộc hẹn",
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
      throw new ValidationError({ id: "ID cuộc hẹn không hợp lệ" });
    }

    // Tìm cuộc hẹn hiện tại
    const appointment = await Appointments.findById(id);
    if (!appointment) {
      throw new NotFoundError("Không tìm thấy cuộc hẹn");
    }

    // Chỉ cho phép cập nhật nếu trạng thái là pending hoặc confirmed
    if (!["pending", "confirmed"].includes(appointment.status)) {
      throw new ValidationError({
        status: "Không thể cập nhật cuộc hẹn đã hoàn thành hoặc đã hủy",
      });
    }

    // 🚨 CRITICAL: Nếu thay đổi thời gian, kiểm tra patient double booking
    if (
      (updateData.appointmentDate && updateData.appointmentDate !== appointment.appointmentDate?.toISOString().split('T')[0]) ||
      (updateData.appointmentTime && updateData.appointmentTime !== appointment.appointmentTime)
    ) {
      const checkDate = updateData.appointmentDate || appointment.appointmentDate?.toISOString().split('T')[0];
      const checkTime = updateData.appointmentTime || appointment.appointmentTime;

      const existingAppointment = await Appointments.findOne({
        _id: { $ne: appointment._id }, // Exclude current appointment
        profileId: appointment.profileId,
        appointmentDate: new Date(checkDate),
        appointmentTime: checkTime,
        status: { $nin: ["cancelled", "completed", "expired", "payment_cancelled"] }
      });

      if (existingAppointment) {
        throw new ValidationError({
          appointmentTime: `Bệnh nhân đã có lịch hẹn vào ${checkTime} ngày ${checkDate}. Không thể có 2 lịch hẹn cùng thời gian.`
        });
      }
    }

    // Nếu thay đổi slot, kiểm tra slot mới có trống không
    if (
      updateData.slotId &&
      updateData.slotId !== appointment.slotId?.toString()
    ) {
      // Giải phóng slot cũ
      if (appointment.slotId) {
        await DoctorSchedules.updateOne(
          { "weekSchedule.slots._id": appointment.slotId },
          { $set: { "weekSchedule.$.slots.$[slot].status": "Free" } },
          { arrayFilters: [{ "slot._id": appointment.slotId }] }
        );
      }

      // Kiểm tra và đặt slot mới
      const schedule = await DoctorSchedules.findOne({
        "weekSchedule.slots._id": new mongoose.Types.ObjectId(
          updateData.slotId
        ),
      });

      if (!schedule) {
        throw new NotFoundError("Không tìm thấy slot thời gian mới");
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
        throw new NotFoundError("Không tìm thấy slot thời gian mới");
      }

      if (slotIsBooked) {
        throw new ValidationError({ slotId: "Slot thời gian mới đã được đặt" });
      }

      // Cập nhật slot mới thành Booked
      await DoctorSchedules.updateOne(
        {
          "weekSchedule.slots._id": new mongoose.Types.ObjectId(
            updateData.slotId
          ),
        },
        { $set: { "weekSchedule.$.slots.$[slot].status": "Booked" } },
        {
          arrayFilters: [
            { "slot._id": new mongoose.Types.ObjectId(updateData.slotId) },
          ],
        }
      );
    }

    // Kiểm tra nếu thay đổi typeLocation thành "home" thì phải có address
    if (
      updateData.typeLocation === "home" &&
      !updateData.address &&
      !appointment.address
    ) {
      throw new ValidationError({
        address: 'Địa chỉ là bắt buộc khi chọn loại địa điểm là "home"',
      });
    }

    // Cập nhật cuộc hẹn
    const updatedAppointment = await Appointments.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate("profileId", "fullName gender phone year", undefined, {
        strictPopulate: false,
      })
      .populate("serviceId", "serviceName price serviceType", undefined, {
        strictPopulate: false,
      })
      .populate("packageId", "name price serviceIds", undefined, {
        strictPopulate: false,
      })
      .populate({
        path: "doctorId",
        match: { isDeleted: { $ne: true } }, // Loại trừ doctor đã bị xóa
        populate: {
          path: "userId",
          select: "fullName email avatar",
        },
        options: { strictPopulate: false },
      });

    return res.status(200).json({
      success: true,
      message: "Cập nhật cuộc hẹn thành công",
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Error in updateAppointment:", error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật cuộc hẹn",
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
      throw new ValidationError({ id: "ID cuộc hẹn không hợp lệ" });
    }

    // Tìm cuộc hẹn hiện tại
    const appointment = await Appointments.findById(id);
    if (!appointment) {
      throw new NotFoundError("Không tìm thấy cuộc hẹn");
    }

    // Kiểm tra quyền hủy lịch
    const userRole = req.user?.role || "";
    const userId = req.user?._id || "";

    // Nếu là customer, kiểm tra quyền sở hữu appointment
    if (userRole === "customer") {
      // 1. Kiểm tra xem lịch hẹn có phải của customer này không
      if (appointment.createdByUserId?.toString() !== userId.toString()) {
        console.log("❌ [Debug] User không có quyền hủy lịch người khác:", {
          appointmentUserId: appointment.createdByUserId,
          requestUserId: userId,
        });
        throw new UnauthorizedError("Không có quyền truy cập");
      }

      // ✅ REMOVED: Bỏ validation 10 phút - khách hàng có thể hủy lúc nào
      console.log("✅ [Debug] Customer có thể hủy lịch bất kỳ lúc nào:", {
        appointmentId: id,
        userId,
      });
    }

    // Chỉ cho phép hủy nếu trạng thái là pending, pending_payment, hoặc confirmed
    if (
      !["pending", "pending_payment", "confirmed"].includes(appointment.status)
    ) {
      throw new ValidationError({
        status: "Không thể hủy cuộc hẹn đã hoàn thành hoặc đã hủy",
      });
    }

    // 🎯 PACKAGE REFUND INTEGRATION: Non-transaction approach for single-node MongoDB
    let packagePurchase: any = null;
    let originalRemainingUsages = 0;
    let packageRefundPerformed = false;

    try {
      // 🔍 STEP 1: If appointment uses package, refund +1 usage back to package
      if (appointment.packageId) {
        console.log(
          "🔍 [Package Refund] Appointment uses package, processing refund...",
          {
            appointmentId: id,
            packageId: appointment.packageId,
            userId: appointment.createdByUserId,
            profileId: appointment.profileId,
          }
        );

        // Find the corresponding package purchase record
        // ✅ FIX: Chỉ tìm theo userId và packagePurchaseId/packageId, không lọc theo profileId và expiryDate
        if (appointment.packagePurchaseId) {
          packagePurchase = await PackagePurchases.findOne({
            _id: appointment.packagePurchaseId,
            userId: appointment.createdByUserId,
            // Note: Không lọc theo status để có thể hoàn lại ngay cả khi package đã used_up
          });
        } else {
          // Fallback: Tìm theo packageId và userId nếu không có packagePurchaseId
          packagePurchase = await PackagePurchases.findOne({
            userId: appointment.createdByUserId,
            packageId: appointment.packageId,
            // Note: Không lọc theo status để có thể hoàn lại ngay cả khi package đã used_up
          });
        }

        if (!packagePurchase) {
          console.log(
            "⚠️ [Package Refund] No package purchase found or package expired",
            {
              appointmentId: id,
              packageId: appointment.packageId,
              userId: appointment.createdByUserId,
              profileId: appointment.profileId,
            }
          );
          // Continue with cancellation even if package not found (maybe manual appointment)
        } else {
          // ✅ NEW: Kiểm tra xem package có hết hạn không để cảnh báo user
          const now = new Date();
          const packageExpiryDate = packagePurchase.expiryDate;
          const isPackageExpired = packageExpiryDate && new Date(packageExpiryDate) < now;
          
          if (isPackageExpired) {
            console.log(
              "⚠️ [Package Refund] Package has expired but will still refund usage",
              {
                appointmentId: id,
                packageId: appointment.packageId,
                packageExpiryDate: packageExpiryDate?.toISOString(),
                currentTime: now.toISOString(),
                packageStatus: packagePurchase.status
              }
            );
          }

          // Tìm service trong package để hoàn lại - sử dụng serviceId từ package purchase
          let serviceUsage = null;
          let serviceIdToRefund = null;

          if (appointment.serviceId) {
            // Trường hợp appointment có serviceId (service_only booking)
            serviceUsage = packagePurchase.usedServices.find(
              (service: any) => service.serviceId.toString() === appointment.serviceId?.toString()
            );
            serviceIdToRefund = appointment.serviceId;
          } else {
            // Trường hợp appointment không có serviceId (purchased_package booking)
            // Lấy service đầu tiên trong package để hoàn lại
            serviceUsage = packagePurchase.usedServices[0];
            serviceIdToRefund = serviceUsage?.serviceId;
          }

          if (!serviceUsage) {
            console.log(
              "⚠️ [Package Refund] Service not found in package, skipping refund"
            );
            // Continue with cancellation but don't refund
          } else {

            // Validate we don't refund more than max quantity
            if (serviceUsage.usedQuantity <= 0) {
              console.log(
                "⚠️ [Package Refund] Service already at minimum usage (0), skipping refund"
              );
              // Continue with cancellation but don't refund
            } else {
              // Store original value for logging and potential rollback
              originalRemainingUsages = serviceUsage.usedQuantity;

              // Calculate new values - subtract 1 usage (refund)
              const newUsedQuantity = serviceUsage.usedQuantity - 1;
              serviceUsage.usedQuantity = newUsedQuantity;

              // Update status based on new usage
              const oldStatus = packagePurchase.status;
              const newStatus = packagePurchase.checkAndUpdateStatus();

              console.log(
                "🔄 [Package Refund] Updating package with refund...",
                {
                  serviceId: serviceIdToRefund?.toString(),
                  oldUsedQuantity: originalRemainingUsages,
                  newUsedQuantity: newUsedQuantity,
                  oldStatus: oldStatus,
                  newStatus: newStatus
                }
              );

              // Save the updated package
              await packagePurchase.save();

              packageRefundPerformed = true;

              console.log(
                "✅ [Package Refund] Successfully refunded package usage"
              );
            }
          }
        }
      }

      // 🔍 STEP 2: Free up the slot if appointment had one
      if (appointment.slotId) {
        try {
          await releaseSlot(appointment.slotId.toString());

        } catch (slotError) {
          console.error(
            "❌ [Slot Liberation] Error releasing slot:",
            slotError
          );
          // Continue with cancellation even if slot release failed
        }
      }

      // 🔍 STEP 3: Update appointment status to cancelled
      const updatedAppointment = await Appointments.findByIdAndUpdate(
        id,
        { $set: { status: "cancelled" } },
        { new: true }
      )
        .populate("profileId", "fullName gender phone year", undefined, {
          strictPopulate: false,
        })
        .populate("serviceId", "serviceName", undefined, {
          strictPopulate: false,
        })
        .populate("packageId", "name", undefined, { strictPopulate: false })
        .populate("createdByUserId", "email fullName", undefined, {
          strictPopulate: false,
        });

      // ✅ NEW: Send cancellation email notification (no refund)
      try {
        const customerEmail = (updatedAppointment?.createdByUserId as any)
          ?.email;
        const customerName =
          (updatedAppointment?.profileId as any)?.fullName ||
          (updatedAppointment?.createdByUserId as any)?.fullName ||
          "Khách hàng";
        const serviceName =
          (updatedAppointment?.packageId as any)?.name ||
          (updatedAppointment?.serviceId as any)?.serviceName ||
          "Dịch vụ không xác định";

        // ✅ FIX: Lấy email từ user account thay vì profile để đảm bảo có email
        const userAccount = await User.findById(
          appointment.createdByUserId
        ).select("email fullName");
        const accountEmail = userAccount?.email;
        const accountName =
          userAccount?.fullName || customerName || "Khách hàng";

        if (accountEmail && updatedAppointment?.appointmentDate) {
          const { sendAppointmentCancelledNoRefundEmail } = await import(
            "../services/emails"
          );

          // ✅ FIX: Phân biệt lý do hủy dựa trên paymentStatus để khách hàng hiểu rõ
          let cancelReason: string;
          if (appointment.paymentStatus === "paid") {
            // Trường hợp 2: Đã thanh toán nhưng hủy muộn (<24h)
            cancelReason =
              "Hủy lịch hẹn - không đủ điều kiện hoàn tiền do hủy muộn dưới 24 giờ theo chính sách trung tâm";
          } else {
            // Trường hợp 1: Chưa thanh toán
            cancelReason =
              "Hủy lịch hẹn chưa thanh toán theo yêu cầu của khách hàng";
          }

          // ✅ NEW: Lấy thông tin profile để gửi trong email
          const profileInfo = updatedAppointment?.profileId
            ? {
                fullName: (updatedAppointment.profileId as any)?.fullName,
                phone: (updatedAppointment.profileId as any)?.phone,
                age: (updatedAppointment.profileId as any)?.year
                  ? new Date().getFullYear() -
                    (updatedAppointment.profileId as any).year
                  : undefined,
                gender: (updatedAppointment.profileId as any)?.gender,
              }
            : undefined;

          await sendAppointmentCancelledNoRefundEmail(
            accountEmail,
            accountName,
            serviceName,
            updatedAppointment.appointmentDate,
            updatedAppointment.appointmentTime || "Chưa xác định",
            cancelReason,
            profileInfo
          );
        }
      } catch (emailError) {
        // Email failure shouldn't block cancellation
        console.error(
          "❌ [Email Error] Failed to send cancellation email:",
          emailError
        );
      }

      console.log(
        "✅ [Success] Appointment cancellation completed successfully",
        {
          appointmentId: id,
          hasPackage: !!appointment.packageId,
          packageRefunded: packageRefundPerformed,
          slotFreed: !!appointment.slotId,
        }
      );

      return res.status(200).json({
        success: true,
        message: packageRefundPerformed
          ? "Hủy cuộc hẹn thành công và đã hoàn trả lượt sử dụng gói dịch vụ"
          : "Hủy cuộc hẹn thành công",
        data: {
          appointment: updatedAppointment,
          packageRefund: packageRefundPerformed ? {
            refunded: true,
            packageId: packagePurchase?._id,
            packageExpired: packagePurchase?.expiryDate && new Date(packagePurchase.expiryDate) < new Date(),
            expiryDate: packagePurchase?.expiryDate
          } : null
        },
      });
    } catch (error: any) {
      console.error(
        "❌ [Error] Error in appointment cancellation + package refund:",
        error
      );

      // Manual rollback for package refund if appointment cancellation failed
      if (
        packageRefundPerformed &&
        packagePurchase &&
        originalRemainingUsages >= 0
      ) {
        console.log("🔄 [Rollback] Attempting to rollback package refund...");
        try {
          // ✅ FIX: Rollback logic cũng cần xử lý trường hợp appointment không có serviceId
          let serviceUsage = null;
          let serviceIdToRollback = null;

          if (appointment.serviceId) {
            // Trường hợp appointment có serviceId
            serviceUsage = packagePurchase.usedServices.find(
              (service: any) => service.serviceId.toString() === appointment.serviceId?.toString()
            );
            serviceIdToRollback = appointment.serviceId;
          } else {
            // Trường hợp appointment không có serviceId (purchased_package booking)
            serviceUsage = packagePurchase.usedServices[0];
            serviceIdToRollback = serviceUsage?.serviceId;
          }

          if (serviceUsage) {
            // Rollback usedQuantity về giá trị cũ
            serviceUsage.usedQuantity = originalRemainingUsages;
            
            // Update status
            packagePurchase.checkAndUpdateStatus();
            
            await packagePurchase.save();
          } else {
            console.log("⚠️ [Rollback] Service not found for rollback");
          }
        } catch (rollbackError) {
          console.error(
            "❌ [Rollback] Failed to rollback package refund:",
            rollbackError
          );
          // Log for manual intervention
          console.error(
            "🚨 [Critical] Manual intervention required for package refund rollback:",
            {
              packagePurchaseId: packagePurchase._id?.toString(),
              serviceId: appointment.serviceId?.toString(),
              shouldBeUsedQuantity: originalRemainingUsages,
            }
          );
        }
      }

      // Re-throw the original error
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteAppointment:", error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi hủy cuộc hẹn",
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
      throw new ValidationError({ id: "ID cuộc hẹn không hợp lệ" });
    }

    // Kiểm tra status có hợp lệ không - Updated với expired và payment_cancelled
    if (
      ![
        "pending",
        "pending_payment",
        "paid",
        "scheduled",
        "confirmed",
        "consulting",
        "completed",
        "cancelled",
        "payment_cancelled",
        "expired",
        "done_testResultItem",
        "done_testResult",
      ].includes(status)
    ) {
      throw new ValidationError({ status: "Trạng thái không hợp lệ" });
    }

    // Tìm cuộc hẹn hiện tại
    const appointment = await Appointments.findById(id);
    if (!appointment) {
      throw new NotFoundError("Không tìm thấy cuộc hẹn");
    }

    // Kiểm tra logic chuyển trạng thái
    const isAlreadyTerminal =
      appointment.status === "cancelled" ||
      appointment.status === "completed" ||
      appointment.status === "expired";
    if (isAlreadyTerminal && appointment.status !== status) {
      throw new ValidationError({
        status: `Không thể thay đổi trạng thái của cuộc hẹn đã ${appointment.status}`,
      });
    }

    // ⭐️ LOGIC MỚI: Nếu chuyển sang các trạng thái hủy/hết hạn, giải phóng slot
    const shouldReleaseSlot = [
      "cancelled",
      "payment_cancelled",
      "expired",
    ].includes(status);

    if (
      shouldReleaseSlot &&
      appointment.slotId &&
      appointment.status !== status
    ) {
      try {
        const releaseResult = await DoctorSchedules.findOneAndUpdate(
          {
            "weekSchedule.slots._id": appointment.slotId,
            "weekSchedule.slots.status": "Booked",
          },
          { $set: { "weekSchedule.$[].slots.$[slot].status": "Free" } },
          {
            arrayFilters: [{ "slot._id": appointment.slotId }],
            new: true,
          }
        );
        if (releaseResult) {
          console.log(
            `✅ [Slot Release] Slot ${appointment.slotId} đã được giải phóng do trạng thái cuộc hẹn chuyển thành ${status}.`
          );
        } else {
          console.warn(
            `⚠️ [Slot Release] Không tìm thấy slot ${appointment.slotId} để giải phóng, có thể nó đã được giải phóng trước đó.`
          );
        }
      } catch (releaseError: any) {
        // Log lỗi nhưng không dừng việc cập nhật trạng thái cuộc hẹn
        console.error(
          `❌ [Slot Release Error] Lỗi khi giải phóng slot ${appointment.slotId}:`,
          releaseError
        );
        // Cân nhắc thêm log hệ thống ở đây nếu cần
      }
    }

    // Cập nhật trạng thái
    const updatedAppointment = await Appointments.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    )
      .populate("profileId", "fullName gender phone year", undefined, {
        strictPopulate: false,
      })
      .populate("serviceId", "serviceName price serviceType", undefined, {
        strictPopulate: false,
      })
      .populate("packageId", "name price serviceIds", undefined, {
        strictPopulate: false,
      });

    // Log system activity
    const profileName =
      (updatedAppointment?.profileId as any)?.fullName || "Unknown";
    const serviceName =
      (updatedAppointment?.serviceId as any)?.serviceName ||
      (updatedAppointment?.packageId as any)?.name ||
      "Unknown service";

    await systemLogService.createLog({
      action: LogAction.APPOINTMENT_UPDATE,
      level: LogLevel.PUBLIC,
      message: `Appointment status changed: ${profileName} - ${serviceName} (${appointment.status} → ${status})`,
      targetId: id,
      targetType: "appointment",
      metadata: {
        oldStatus: appointment.status,
        newStatus: status,
        appointmentDate: updatedAppointment?.appointmentDate,
        appointmentTime: updatedAppointment?.appointmentTime,
        profileName,
        serviceName,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái cuộc hẹn thành công",
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Error in updateAppointmentStatus:", error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật trạng thái cuộc hẹn",
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

    console.log("updatePaymentStatus called with:", { id, status });

    // Kiểm tra ID có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError({ id: "ID cuộc hẹn không hợp lệ" });
    }

    // Kiểm tra status có hợp lệ không (chỉ cho phép scheduled)
    if (status !== "scheduled") {
      throw new ValidationError({
        status: "Chỉ cho phép xác nhận thanh toán thành scheduled",
      });
    }

    // Tìm cuộc hẹn hiện tại
    const appointment = await Appointments.findById(id);
    if (!appointment) {
      throw new NotFoundError("Không tìm thấy cuộc hẹn");
    }

    console.log("Current appointment status:", appointment.status);

    // Nếu đã scheduled rồi thì trả về thành công luôn
    if (appointment.status === "scheduled") {
      return res.status(200).json({
        success: true,
        message: "Cuộc hẹn đã được xác nhận trước đó",
        data: appointment,
      });
    }

    // Chỉ cho phép cập nhật nếu trạng thái hiện tại là pending_payment
    if (appointment.status !== "pending_payment") {
      throw new ValidationError({
        status: `Chỉ có thể cập nhật thanh toán cho cuộc hẹn đang chờ thanh toán. Trạng thái hiện tại: ${appointment.status}`,
      });
    }

    // Nếu là bookingType purchased_package thì trừ lượt sử dụng dịch vụ
    if (
      appointment.bookingType === "purchased_package" &&
      appointment.packagePurchaseId &&
      appointment.serviceId
    ) {
      const result = await PackageUsageService.useServiceFromPackage(
        appointment.packagePurchaseId.toString(),
        appointment.serviceId.toString(),
        String(appointment._id)
      );
      if (!result.success) {
        throw new ValidationError({ package: result.message });
      }
      // Kiểm tra nếu tất cả dịch vụ đã hết lượt thì cập nhật status used_up
      const packagePurchase = await PackagePurchases.findById(
        appointment.packagePurchaseId
      );
      if (packagePurchase) {
        const allUsedUp = packagePurchase.usedServices.every(
          (s) => s.usedQuantity >= s.maxQuantity
        );
        if (allUsedUp && packagePurchase.status !== "used_up") {
          packagePurchase.status = "used_up";
          await packagePurchase.save();
        }
      }
    }

    // Cập nhật trạng thái appointment
    await Appointments.findByIdAndUpdate(id, { $set: { status: "confirmed" } });
    const updatedAppointment = await Appointments.findById(id)
      .populate("profileId", "fullName gender phone year", undefined, {
        strictPopulate: false,
      })
      .populate("serviceId", "serviceName price serviceType", undefined, {
        strictPopulate: false,
      })
      .populate("packageId", "name price serviceIds", undefined, {
        strictPopulate: false,
      });
    return res.status(200).json({
      success: true,
      message: "Xác nhận thanh toán thành công",
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Error in updatePaymentStatus:", error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật trạng thái thanh toán",
    });
  }
};

/**
 * Lấy danh sách cuộc hẹn theo doctorId từ slot schedule
 * Phân trang và lọc theo các tiêu chí khác nhau
 */
export const getAppointmentsByDoctorId = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { doctorId } = req.params;
    const {
      page = 1,
      limit = 10,
      status,
      appointmentType,
      startDate,
      endDate,
    } = req.query;

    // Kiểm tra doctorId có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new ValidationError({ doctorId: "ID bác sĩ không hợp lệ" });
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
        $lte: new Date(endDate as string),
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
          ...matchStage,
        },
      },
      // Bước 2: Lookup để join với DoctorSchedules
      {
        $lookup: {
          from: "doctorschedules",
          let: { slotId: "$slotId" },
          pipeline: [
            {
              $match: {
                doctorId: new mongoose.Types.ObjectId(doctorId),
                $expr: {
                  $in: [
                    "$$slotId",
                    {
                      $reduce: {
                        input: "$weekSchedule",
                        initialValue: [],
                        in: {
                          $concatArrays: [
                            "$$value",
                            {
                              $map: {
                                input: "$$this.slots",
                                as: "slot",
                                in: "$$slot._id",
                              },
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
          as: "doctorSchedule",
        },
      },
      // Bước 3: Chỉ lấy appointments có matching doctor schedule
      {
        $match: {
          "doctorSchedule.0": { $exists: true },
        },
      },
      // Bước 4: Lookup các thông tin liên quan
      {
        $lookup: {
          from: "userprofiles",
          localField: "profileId",
          foreignField: "_id",
          as: "profileId",
          pipeline: [
            { $project: { fullName: 1, gender: 1, phone: 1, year: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceId",
          pipeline: [
            { $project: { serviceName: 1, price: 1, serviceType: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: "servicepackages",
          localField: "packageId",
          foreignField: "_id",
          as: "packageId",
          pipeline: [{ $project: { name: 1, price: 1 } }],
        },
      },
      // Bước 5: Unwind để flatten arrays
      {
        $unwind: {
          path: "$profileId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$serviceId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$packageId",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Bước 6: Sort theo thời gian
      {
        $sort: { appointmentDate: -1, appointmentTime: -1 },
      },
    ];

    // Tính toán skip value cho phân trang
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Đếm tổng số bản ghi
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Appointments.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Lấy dữ liệu với phân trang
    const resultPipeline = [
      ...pipeline,
      { $skip: skip },
      { $limit: limitNumber },
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
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("Error in getAppointmentsByDoctorId:", error);
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách cuộc hẹn theo bác sĩ",
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
      throw new ValidationError({ id: "ID cuộc hẹn không hợp lệ" });
    }

    // Tìm cuộc hẹn hiện tại
    const appointment = await Appointments.findById(id);
    if (!appointment) {
      throw new NotFoundError("Không tìm thấy cuộc hẹn");
    }

    // Chỉ cho phép xác nhận nếu trạng thái hiện tại là scheduled
    if (appointment.status !== "scheduled") {
      throw new ValidationError({
        status: "Chỉ có thể xác nhận cuộc hẹn đã được lên lịch",
      });
    }

    // Keep status as scheduled (theo workflow mới không cần confirmed step)
    const updatedAppointment = await Appointments.findByIdAndUpdate(
      id,
      { $set: { status: "scheduled" } },
      { new: true }
    )
      .populate("profileId", "fullName gender phone year", undefined, {
        strictPopulate: false,
      })
      .populate("serviceId", "serviceName price serviceType", undefined, {
        strictPopulate: false,
      })
      .populate("packageId", "name price serviceIds", undefined, {
        strictPopulate: false,
      });

    return res.status(200).json({
      success: true,
      message: "Xác nhận cuộc hẹn thành công",
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Error in confirmAppointment:", error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xác nhận cuộc hẹn",
    });
  }
};

/**
 * Hủy cuộc hẹn bởi bác sĩ với lý do (Doctor only)
 */
export const cancelAppointmentByDoctor = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Kiểm tra ID có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError({ id: "ID cuộc hẹn không hợp lệ" });
    }

    // Kiểm tra user có phải doctor không
    if (req.user?.role !== "doctor") {
      throw new UnauthorizedError("Chỉ bác sĩ mới có thể hủy lịch hẹn");
    }

    // Kiểm tra lý do hủy
    if (!reason || reason.trim().length === 0) {
      throw new ValidationError({ reason: "Vui lòng nhập lý do hủy lịch hẹn" });
    }

    // Tìm cuộc hẹn hiện tại
    const appointment = await Appointments.findById(id);
    if (!appointment) {
      throw new NotFoundError("Không tìm thấy cuộc hẹn");
    }

    // Kiểm tra lịch hẹn đã bị hủy chưa
    if (appointment.status === "cancelled") {
      throw new ValidationError({ status: "Cuộc hẹn đã được hủy trước đó" });
    }

    // Kiểm tra lịch hẹn đã hoàn thành chưa
    if (appointment.status === "completed") {
      throw new ValidationError({
        status: "Không thể hủy cuộc hẹn đã hoàn thành",
      });
    }

    // Giải phóng slot nếu có
    if (appointment.slotId) {
      console.log(
        `🔓 [CANCEL] Releasing slot ${appointment.slotId} for appointment ${id}`
      );
      try {
        await releaseSlot(appointment.slotId.toString());
        console.log(
          `✅ [CANCEL] Successfully released slot ${appointment.slotId} for appointment ${id}`
        );
      } catch (slotError) {
        console.error(
          `❌ [CANCEL] Error releasing slot ${appointment.slotId}:`,
          slotError
        );
        // Continue with cancellation even if slot release failed
      }
    }

    // Cập nhật trạng thái thành doctor_cancel và lưu lý do vào notes
    const cancelNote = `[DOCTOR CANCELLED] ${reason.trim()}`;
    const existingNotes = appointment.notes || "";
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n${cancelNote}`
      : cancelNote;

    const updatedAppointment = await Appointments.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "doctor_cancel",
          notes: updatedNotes,
        },
      },
      { new: true }
    )
      .populate("profileId", "fullName gender phone year", undefined, {
        strictPopulate: false,
      })
      .populate("serviceId", "serviceName price serviceType", undefined, {
        strictPopulate: false,
      })
      .populate("packageId", "name price serviceIds", undefined, {
        strictPopulate: false,
      });

    // Sau khi cập nhật, set slot thành Absent
    if (appointment.doctorId && appointment.slotId && appointment.appointmentDate) {
      const { updateDoctorSchedule } = require("../services/doctorScheduleService");
      await updateDoctorSchedule(appointment.doctorId.toString(), {
        date: appointment.appointmentDate,
        slotId: appointment.slotId.toString(),
        status: "Absent"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hủy cuộc hẹn thành công",
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Error in cancelAppointmentByDoctor:", error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }
    if (error instanceof UnauthorizedError) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi hủy cuộc hẹn",
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
      endDate,
    } = req.query;

    // Kiểm tra user có trong token không
    if (!req.user?._id) {
      throw new UnauthorizedError(
        "Không tìm thấy thông tin người dùng trong token"
      );
    }

    // Kiểm tra user có phải doctor hoặc staff không
    if (!["doctor", "staff"].includes(req.user.role)) {
      throw new UnauthorizedError(
        "Chỉ bác sĩ hoặc nhân viên mới có thể truy cập endpoint này"
      );
    }

    // Nếu là staff, trả về tất cả appointments (similar to getStaffAppointments)
    if (req.user.role === "staff") {
      const matchStage: any = {
        // ✅ Fix: Lấy tất cả appointments, frontend sẽ filter
      };

      // Áp dụng các bộ lọc nếu có
      if (status) matchStage.status = status;

      // Lọc theo khoảng thời gian
      if (startDate && endDate) {
        matchStage.appointmentDate = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
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
        .populate("profileId", "fullName gender phone year", undefined, {
          strictPopulate: false,
        })
        .populate("serviceId", "serviceName price serviceType", undefined, {
          strictPopulate: false,
        })
        .populate("packageId", "name price", undefined, {
          strictPopulate: false,
        })
        .populate({
          path: "doctorId",
          match: { isDeleted: { $ne: true } },
          populate: {
            path: "userId",
            select: "fullName email avatar",
          },
          options: { strictPopulate: false },
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
            pages: Math.ceil(total / limitNumber),
          },
        },
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
            pages: 0,
          },
        },
        message:
          "Chưa có thông tin bác sĩ trong hệ thống. Vui lòng liên hệ admin để thiết lập hồ sơ.",
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
        $lte: new Date(endDate as string),
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
          ...matchStage,
        },
      },
      // Bước 2: Lookup để join với DoctorSchedules
      {
        $lookup: {
          from: "doctorschedules",
          let: { slotId: "$slotId" },
          pipeline: [
            {
              $match: {
                doctorId: new mongoose.Types.ObjectId(doctorId),
                $expr: {
                  $in: [
                    "$$slotId",
                    {
                      $reduce: {
                        input: "$weekSchedule",
                        initialValue: [],
                        in: {
                          $concatArrays: [
                            "$$value",
                            {
                              $map: {
                                input: "$$this.slots",
                                as: "slot",
                                in: "$$slot._id",
                              },
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
          as: "doctorSchedule",
        },
      },
      // Bước 3: Chỉ lấy appointments có matching doctor schedule
      {
        $match: {
          "doctorSchedule.0": { $exists: true },
        },
      },
      // Bước 4: Lookup các thông tin liên quan
      {
        $lookup: {
          from: "userprofiles",
          localField: "profileId",
          foreignField: "_id",
          as: "profileId",
          pipeline: [
            { $project: { fullName: 1, gender: 1, phone: 1, year: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceId",
          pipeline: [
            { $project: { serviceName: 1, price: 1, serviceType: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: "servicepackages",
          localField: "packageId",
          foreignField: "_id",
          as: "packageId",
          pipeline: [{ $project: { name: 1, price: 1 } }],
        },
      },
      // Bước 5: Unwind để flatten arrays
      {
        $unwind: {
          path: "$profileId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$serviceId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$packageId",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Bước 6: Sort theo thời gian
      {
        $sort: { appointmentDate: -1, appointmentTime: -1 },
      },
    ];

    // Tính toán skip value cho phân trang
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Đếm tổng số bản ghi
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Appointments.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Lấy dữ liệu với phân trang
    const resultPipeline = [
      ...pipeline,
      { $skip: skip },
      { $limit: limitNumber },
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
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("Error in getMyAppointments:", error);
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return res.status(error instanceof UnauthorizedError ? 401 : 404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách cuộc hẹn của bác sĩ",
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
      doctorId,
    } = req.query;

    // Kiểm tra user có trong token không và có phải staff không
    if (!req.user?._id) {
      throw new UnauthorizedError(
        "Không tìm thấy thông tin người dùng trong token"
      );
    }

    if (req.user.role !== "staff") {
      throw new UnauthorizedError(
        "Chỉ nhân viên mới có thể truy cập endpoint này"
      );
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
        $lte: new Date(endDate as string),
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
      .populate("profileId", "fullName gender phone year", undefined, {
        strictPopulate: false,
      })
      .populate("serviceId", "serviceName price serviceType", undefined, {
        strictPopulate: false,
      })
      .populate("packageId", "name price", undefined, { strictPopulate: false })
      .populate({
        path: "doctorId",
        match: { isDeleted: { $ne: true } },
        populate: {
          path: "userId",
          select: "fullName email avatar",
        },
        options: { strictPopulate: false },
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
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("Error in getStaffAppointments:", error);
    if (error instanceof UnauthorizedError) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách cuộc hẹn cho staff",
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
      endDate,
    } = req.query;

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin user từ token",
      });
    }

    const query: any = {
      createdByUserId: userId, // Chỉ lấy appointments của user hiện tại
    };

    // Áp dụng các bộ lọc nếu có
    if (status) query.status = status;
    if (appointmentType) query.appointmentType = appointmentType;

    // Lọc theo khoảng thời gian
    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
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
        path: "profileId",
        model: "UserProfiles",
        select: "fullName gender phone year",
        options: { strictPopulate: false },
      })
      .populate({
        path: "serviceId",
        model: "Service",
        select: "serviceName price serviceType",
        options: { strictPopulate: false },
      })
      .populate({
        path: "packageId",
        model: "ServicePackages",
        select: "name price",
        options: { strictPopulate: false },
      })
      .populate({
        path: "doctorId",
        match: { isDeleted: { $ne: true } },
        populate: {
          path: "userId",
          select: "fullName email avatar isActive",
          match: { isActive: { $ne: false } },
        },
        options: { strictPopulate: false },
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
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("Error in getUserAppointments:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách cuộc hẹn của bạn",
    });
  }
};

/**
 * Lấy toàn bộ lịch sử đặt lịch của user (kết hợp appointments + consultations)
 */
export const getUserBookingHistory = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      serviceType, // 'appointment' | 'consultation' | 'all'
    } = req.query;

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin user từ token",
      });
    }

    // Tính toán skip value cho phân trang
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    let allBookings: any[] = [];

    // 1. Lấy Appointments nếu cần
    if (
      !serviceType ||
      serviceType === "all" ||
      serviceType === "appointment"
    ) {
      try {
        const appointmentQuery: any = {
          createdByUserId: userId,
        };

        // Áp dụng filters
        if (status) appointmentQuery.status = status;
        if (startDate && endDate) {
          appointmentQuery.appointmentDate = {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string),
          };
        } else if (startDate) {
          appointmentQuery.appointmentDate = {
            $gte: new Date(startDate as string),
          };
        } else if (endDate) {
          appointmentQuery.appointmentDate = {
            $lte: new Date(endDate as string),
          };
        }

        const appointments = await Appointments.find(appointmentQuery)
          .populate({
            path: "profileId",
            model: "UserProfiles",
            select: "fullName gender phone year",
            options: { strictPopulate: false },
          })
          .populate({
            path: "serviceId",
            model: "Service",
            select: "serviceName price serviceType",
            options: { strictPopulate: false },
          })
          .populate({
            path: "packageId",
            model: "ServicePackages",
            select: "name price",
            options: { strictPopulate: false },
          })
          .populate({
            path: "doctorId",
            match: { isDeleted: { $ne: true } },
            populate: {
              path: "userId",
              select: "fullName email avatar isActive",
              match: { isActive: { $ne: false } },
            },
            options: { strictPopulate: false },
          });

        // Transform appointments thành unified format với refund info
        const transformedAppointments = await Promise.all(
          appointments.map(async (apt: any) => {
            // Lấy thông tin refund từ PaymentTracking - ✅ UPDATED LOGIC
            let refundInfo = null;
            try {
              // ✅ TÌM PaymentTracking có refund object, không phụ thuộc vào status
              const paymentTracking = await PaymentTracking.findOne({
                $or: [
                  { appointmentId: apt._id }, // Standard way
                  { recordId: apt._id, serviceType: "appointment" }, // Fallback way
                ],
                userId: userId,
                "refund.refundInfo": { $exists: true }, // Có yêu cầu hoàn tiền
              }).sort({ createdAt: -1 });

              if (paymentTracking && paymentTracking.refund) {
                // ✅ Lấy thông tin refund đầy đủ từ PaymentTracking
                refundInfo = {
                  refundReason: paymentTracking.refund.refundReason,
                  processingStatus:
                    paymentTracking.refund.processingStatus || "pending",
                  processedBy: paymentTracking.refund.processedBy,
                  processedAt: paymentTracking.refund.processedAt,
                  processingNotes: paymentTracking.refund.processingNotes,
                  refundInfo: paymentTracking.refund.refundInfo,
                };

                console.log("✅ [RefundInfo] Found refund data:", {
                  appointmentId: apt._id.toString(),
                  processingStatus: refundInfo.processingStatus,
                  processedBy: refundInfo.processedBy,
                });
              } else {
                console.log(
                  "ℹ️ [RefundInfo] No refund data found for appointment:",
                  apt._id.toString()
                );
              }
            } catch (error) {
              console.error(
                "❌ [RefundInfo] Error fetching refund info:",
                error
              );
            }

            return {
              _id: apt._id,
              type: "appointment", // Phân biệt loại
              serviceId: apt.serviceId?._id || null,
              serviceName:
                apt.packageId?.name ||
                apt.serviceId?.serviceName ||
                "Dịch vụ không xác định",
              packageName: apt.packageId?.name || null,
              packageId: apt.packageId?._id || null, // ✅ ADD: packageId
              packagePurchaseId: apt.packagePurchaseId || null, // ✅ ADD: packagePurchaseId
              doctorId: apt.doctorId?._id || null,
              doctorName:
                apt.doctorId?.userId?.fullName || "Chưa chỉ định bác sĩ",
              doctorAvatar: apt.doctorId?.userId?.avatar || null,
              patientName: apt.profileId?.fullName || "Không xác định",
              appointmentDate: apt.appointmentDate,
              appointmentTime: apt.appointmentTime,
              appointmentSlot: apt.appointmentTime, // Alias cho consistency
              typeLocation: apt.typeLocation,
              status: apt.status,
              price: apt.totalAmount || apt.packageId?.price || apt.serviceId?.price || 0,
              createdAt: apt.createdAt,
              description: apt.description,
              notes: apt.notes,
              address: apt.address,
              canCancel: ["pending", "pending_payment", "confirmed"].includes(
                apt.status
              ),
              canReschedule: ["pending", "confirmed"].includes(apt.status),
              // Appointment-specific fields
              appointmentType: apt.appointmentType,
              paymentTrackingId: apt.paymentTrackingId,
              slotId: apt.slotId,
              paymentStatus: apt.paymentStatus,
              // Include refund info nếu có
              refund: refundInfo,
            };
          })
        );

        allBookings.push(...transformedAppointments);
      } catch (error) {
        console.error(
          "❌ [getUserBookingHistory] Error fetching appointments:",
          error
        );
      }
    }

    // 2. Lấy Consultations nếu cần
    if (
      !serviceType ||
      serviceType === "all" ||
      serviceType === "consultation"
    ) {
      try {
        // Import DoctorQA dynamically để tránh circular dependency
        const { DoctorQA } = await import("../models");

        const consultationQuery: any = {
          userId: userId,
        };

        // Áp dụng filters
        if (status) consultationQuery.status = status;
        if (startDate && endDate) {
          consultationQuery.appointmentDate = {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string),
          };
        } else if (startDate) {
          consultationQuery.appointmentDate = {
            $gte: new Date(startDate as string),
          };
        } else if (endDate) {
          consultationQuery.appointmentDate = {
            $lte: new Date(endDate as string),
          };
        }

        const consultations = await DoctorQA.find(consultationQuery)
          .populate({
            path: "doctorId",
            match: { isDeleted: { $ne: true } },
            populate: {
              path: "userId",
              select: "fullName email avatar isActive",
              match: { isActive: { $ne: false } },
            },
            options: { strictPopulate: false },
          })
          .populate({
            path: "serviceId",
            model: "Service",
            select: "serviceName price serviceType",
            options: { strictPopulate: false },
          });

        // Import Meeting model để lấy notes của bác sĩ
        const Meeting = (await import("../models/Meeting")).default;

        // Transform consultations thành unified format
        const transformedConsultations = await Promise.all(consultations.map(async (consult: any) => {
          // Lấy notes của bác sĩ từ Meeting
          let doctorMeetingNotes = null;
          try {
            const meeting = await Meeting.findOne({ qaId: consult._id });
            if (meeting && meeting.notes) {
              doctorMeetingNotes = meeting.notes;
            }
          } catch (err) {
            console.error("[getUserBookingHistory] Error fetching meeting notes:", err);
          }
          return {
            _id: consult._id,
            type: "consultation", // Phân biệt loại
            serviceId: consult.serviceId?._id || null,
            serviceName:
              consult.serviceName ||
              consult.serviceId?.serviceName ||
              "Tư vấn trực tuyến",
            packageName: null, // Consultations không có package
            doctorId: consult.doctorId?._id || null,
            doctorName:
              consult.doctorId?.userId?.fullName || "Chưa chỉ định bác sĩ",
            doctorAvatar: consult.doctorId?.userId?.avatar || null,
            patientName: consult.fullName || "Không xác định",
            appointmentDate: consult.appointmentDate || null,
            appointmentTime: null, // Consultations không có appointmentTime riêng
            appointmentSlot: consult.appointmentSlot || null,
            typeLocation: "Online", // Consultations luôn là Online
            status: consult.status,
            price: consult.consultationFee || 0,
            createdAt: consult.createdAt,
            description: consult.question, // question mapping thành description
            notes: consult.notes,
            address: null, // Consultations không có address
            canCancel: ["pending_payment", "scheduled"].includes(consult.status),
            canReschedule: false, // Consultations không thể reschedule
            // Consultation-specific fields
            phone: consult.phone,
            age: consult.age,
            gender: consult.gender,
            question: consult.question,
            doctorNotes: consult.doctorNotes,
            slotId: consult.slotId,
            doctorMeetingNotes, // Ghi chú của bác sĩ từ Meeting
          };
        }));

        allBookings.push(...transformedConsultations);
      } catch (error) {
        console.error(
          "❌ [getUserBookingHistory] Error fetching consultations:",
          error
        );
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

        // ✅ IMPROVED: Thêm thông tin package expiry chính xác cho mỗi booking
    const bookingsWithExpiryInfo = await Promise.all(paginatedBookings.map(async (booking) => {
      // ✅ FIX: Kiểm tra cả packageId và packageName
      if (booking.packageId || booking.packageName) {
            try {
              // ✅ NEW: Tìm package purchase theo nhiều cách
              let packagePurchase = null;
              
              // Thử tìm theo packagePurchaseId trước (nếu có)
              if (booking.packagePurchaseId) {
                packagePurchase = await PackagePurchases.findOne({
                  _id: booking.packagePurchaseId,
                  userId: req.user?._id
                });
              }
              
              // Nếu không tìm thấy, thử theo packageId
              if (!packagePurchase && booking.packageId) {
                packagePurchase = await PackagePurchases.findOne({
                  userId: req.user?._id,
                  packageId: booking.packageId
                });
              }
              
              // ✅ IMPROVED: Nếu vẫn không tìm thấy và có packageName, tìm theo tên
              if (!packagePurchase && booking.packageName) {
                // Tìm tất cả package purchases của user và populate packageId
                const userPackages = await PackagePurchases.find({
                  userId: req.user?._id
                }).populate('packageId');
                
                packagePurchase = userPackages.find(pkg => {
                  const packageData = pkg.packageId as any;
                  return packageData?.name === booking.packageName;
                });
              }

          if (packagePurchase) {
            // ✅ NEW: Kiểm tra expiry chính xác
            const now = new Date();
            const expiryDate = packagePurchase.expiryDate;
            const isExpired = expiryDate && new Date(expiryDate) < now;
            
            const packageExpiryInfo = {
              hasPackage: true,
              packageId: booking.packageId,
              packageName: booking.packageName,
              isExpired: isExpired,
              expiryDate: expiryDate,
              packageStatus: packagePurchase.status
            };
            
            return {
              ...booking,
              packageExpiryInfo
            };
          }
        } catch (error) {
          console.error('Error checking package expiry:', error);
        }
        
        // Fallback nếu không tìm thấy package purchase
        const packageExpiryInfo = {
          hasPackage: true,
          packageId: booking.packageId,
          packageName: booking.packageName,
          isExpired: false, // Default to false if can't determine
          expiryDate: null,
          packageStatus: 'unknown'
        };
        
        return {
          ...booking,
          packageExpiryInfo
        };
      }
      return booking;
    }));

    return res.status(200).json({
      success: true,
      data: {
        bookings: bookingsWithExpiryInfo,
        summary: {
          totalAppointments: allBookings.filter((b) => b.type === "appointment")
            .length,
          totalConsultations: allBookings.filter(
            (b) => b.type === "consultation"
          ).length,
          totalBookings: total,
        },
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("❌ [getUserBookingHistory] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy lịch sử đặt lịch của bạn",
    });
  }
};

/**
 * Hủy cuộc hẹn và hoàn tiền (điều kiện 24h trước khi bắt đầu)
 * Chỉ cho phép customer hủy appointment của chính mình
 */
export const cancelAppointmentWithRefund = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { reason, refundInfo } = req.body;
    const userId = req.user?._id;

    // Kiểm tra ID có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError({ id: "ID cuộc hẹn không hợp lệ" });
    }

    if (!userId) {
      throw new UnauthorizedError("Không tìm thấy thông tin user từ token");
    }

    // Validate refund info if provided
    if (refundInfo) {
      if (
        !refundInfo.accountNumber ||
        !refundInfo.accountHolderName ||
        !refundInfo.bankName
      ) {
        throw new ValidationError({
          refundInfo:
            "Thông tin hoàn tiền không đầy đủ. Cần có: số tài khoản, tên chủ tài khoản, tên ngân hàng",
        });
      }
    }

    // Tìm cuộc hẹn
    const appointment = await Appointments.findOne({
      _id: id,
      createdByUserId: userId, // Chỉ cho phép user hủy appointment của mình
    });

    if (!appointment) {
      throw new NotFoundError(
        "Không tìm thấy cuộc hẹn hoặc bạn không có quyền hủy cuộc hẹn này"
      );
    }

    // Kiểm tra trạng thái cuộc hẹn
    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cuộc hẹn đã được hủy trước đó",
      });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy cuộc hẹn đã hoàn thành",
      });
    }

    // Kiểm tra đã thanh toán chưa
    if (appointment.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hoàn tiền cho cuộc hẹn đã thanh toán",
      });
    }

    // Kiểm tra điều kiện 24h
    if (!appointment.appointmentDate || !appointment.appointmentTime) {
      return res.status(400).json({
        success: false,
        message: "Cuộc hẹn không có thông tin ngày giờ hẹn",
      });
    }

    // Xử lý datetime an toàn
    let appointmentDateTime: Date;
    try {
      // Lấy phần thời gian bắt đầu (loại bỏ phần kết thúc nếu có dạng "07:00-08:00")
      const startTime =
        appointment.appointmentTime.split("-")[0]?.trim() ||
        appointment.appointmentTime.split(" - ")[0]?.trim() ||
        appointment.appointmentTime.trim();

      // appointmentDate từ model luôn là Date type
      const dateStr = appointment.appointmentDate.toISOString().split("T")[0];

      // Combine date and time safely với ISO format
      const combinedDateTimeStr = `${dateStr}T${startTime}:00.000Z`;
      appointmentDateTime = new Date(combinedDateTimeStr);

      // Validate parsed datetime
      if (isNaN(appointmentDateTime.getTime())) {
        throw new Error("Invalid datetime after parsing");
      }
    } catch (parseError) {
      console.error(
        "❌ [CancelWithRefund] Error parsing appointment datetime:",
        parseError,
        {
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
        }
      );
      return res.status(400).json({
        success: false,
        message: "Định dạng ngày giờ hẹn không hợp lệ",
      });
    }

    const currentTime = new Date();
    const hoursDifference =
      (appointmentDateTime.getTime() - currentTime.getTime()) /
      (1000 * 60 * 60);

    if (hoursDifference <= 24) {
      return res.status(400).json({
        success: false,
        message: `Chỉ có thể hủy lịch hẹn trước 24 giờ. Hiện tại còn ${Math.floor(
          hoursDifference
        )} giờ.`,
      });
    }

    // PACKAGE REFUND INTEGRATION: Hoàn lại usage nếu appointment sử dụng package
    let packageRefundPerformed = false;
    let packagePurchase: any = null;
    let originalRemainingUsages = 0;

    try {
      // 🔍 STEP 1: Nếu appointment sử dụng package, hoàn lại +1 usage
      if (appointment.packageId) {
        console.log(
          "🔍 [Package Refund] Appointment uses package, processing refund...",
          {
            appointmentId: id,
            packageId: appointment.packageId,
            userId: appointment.createdByUserId,
            profileId: appointment.profileId,
          }
        );

        // Tìm package purchase tương ứng
        // ✅ FIX: Chỉ tìm theo userId và packagePurchaseId/packageId, không lọc theo profileId và expiryDate
        if (appointment.packagePurchaseId) {
          packagePurchase = await PackagePurchases.findOne({
            _id: appointment.packagePurchaseId,
            userId: appointment.createdByUserId,
            // Note: Không lọc theo status để có thể hoàn lại ngay cả khi package đã used_up
          });
        } else {
          // Fallback: Tìm theo packageId và userId nếu không có packagePurchaseId
          packagePurchase = await PackagePurchases.findOne({
            userId: appointment.createdByUserId,
            packageId: appointment.packageId,
            // Note: Không lọc theo status để có thể hoàn lại ngay cả khi package đã used_up
          });
        }

        if (!packagePurchase) {
          console.log(
            "⚠️ [Package Refund] No package purchase found or package expired",
            {
              appointmentId: id,
              packageId: appointment.packageId,
              userId: appointment.createdByUserId,
              profileId: appointment.profileId,
            }
          );
          // Tiếp tục với việc hủy nhưng không hoàn package
        } else {
          // ✅ NEW: Kiểm tra xem package có hết hạn không để cảnh báo user
          const now = new Date();
          const packageExpiryDate = packagePurchase.expiryDate;
          const isPackageExpired = packageExpiryDate && new Date(packageExpiryDate) < now;
          
          if (isPackageExpired) {
            console.log(
              "⚠️ [Package Refund] Package has expired but will still refund usage",
              {
                appointmentId: id,
                packageId: appointment.packageId,
                packageExpiryDate: packageExpiryDate?.toISOString(),
                currentTime: now.toISOString(),
                packageStatus: packagePurchase.status
              }
            );
          }

          console.log(
            "✅ [Package Refund] Found package purchase, refunding usage...",
            {
              packagePurchaseId: packagePurchase._id?.toString() || "unknown",
              usedServices: packagePurchase.usedServices?.length || 0,
            }
          );

          // ✅ FIX: Khi sử dụng purchased package, appointment không có serviceId
          // Tìm service trong package để hoàn lại - sử dụng serviceId từ package purchase
          let serviceUsage = null;
          let serviceIdToRefund = null;

          if (appointment.serviceId) {
            // Trường hợp appointment có serviceId (service_only booking)
            serviceUsage = packagePurchase.usedServices.find(
              (service: any) => service.serviceId.toString() === appointment.serviceId?.toString()
            );
            serviceIdToRefund = appointment.serviceId;
          } else {
            // Trường hợp appointment không có serviceId (purchased_package booking)
            // Lấy service đầu tiên trong package để hoàn lại
            serviceUsage = packagePurchase.usedServices[0];
            serviceIdToRefund = serviceUsage?.serviceId;
          }

          if (!serviceUsage) {
            console.log(
              "⚠️ [Package Refund] Service not found in package, skipping refund"
            );
            // Tiếp tục với việc hủy nhưng không hoàn package
          } else {

            // Validate chúng ta không hoàn nhiều hơn max quantity
            if (serviceUsage.usedQuantity <= 0) {
              console.log(
                "⚠️ [Package Refund] Service already at minimum usage (0), skipping refund"
              );
              // Tiếp tục với việc hủy nhưng không hoàn package
            } else {
              // Lưu giá trị gốc để rollback nếu cần
              originalRemainingUsages = serviceUsage.usedQuantity;

              // Tính toán giá trị mới - trừ 1 usage (hoàn lại)
              const newUsedQuantity = serviceUsage.usedQuantity - 1;
              serviceUsage.usedQuantity = newUsedQuantity;

              // Cập nhật status dựa trên usage mới
              const oldStatus = packagePurchase.status;
              const newStatus = packagePurchase.checkAndUpdateStatus();

              console.log(
                "🔄 [Package Refund] Updating package with refund...",
                {
                  serviceId: serviceIdToRefund?.toString(),
                  oldUsedQuantity: originalRemainingUsages,
                  newUsedQuantity: newUsedQuantity,
                  oldStatus: oldStatus,
                  newStatus: newStatus
                }
              );

              // Lưu package đã cập nhật
              await packagePurchase.save();

              packageRefundPerformed = true;

              console.log(
                "✅ [Package Refund] Successfully refunded package usage"
              );
            }
          }
        }
      }

      // 🔍 STEP 2: Cập nhật PaymentTracking - CHỈ GHI NHẬN YÊU CẦU, CHƯA HOÀN TIỀN
      const paymentTracking = await PaymentTracking.findOne({
        $or: [
          { appointmentId: id },
          { recordId: id, serviceType: "appointment" },
        ],
        userId: userId,
        status: "success",
      }).sort({ createdAt: -1 });

      if (paymentTracking) {
        await PaymentTracking.findByIdAndUpdate(paymentTracking._id, {
          // ✅ GIỮ NGUYÊN STATUS 'success' - chỉ set 'refunded' khi manager approve
          refund: {
            refundReason:
              reason || "Hủy lịch hẹn theo yêu cầu của khách hàng (24h rule)",
            processingStatus: "pending", // Manager chưa xử lý
            refundInfo: refundInfo
              ? {
                  accountNumber: refundInfo.accountNumber,
                  accountHolderName: refundInfo.accountHolderName,
                  bankName: refundInfo.bankName,
                  submittedAt: new Date(),
                }
              : undefined,
          },
          updatedAt: new Date(),
        });
      }

      // 🔍 STEP 3: Cập nhật Appointment status thành 'cancelled'
      const updatedAppointment = await Appointments.findByIdAndUpdate(
        id,
        {
          $set: {
            status: "cancelled",
            paymentStatus: "refunded",
            notes:
              (appointment.notes || "") +
              (reason
                ? `\n[Hủy]: ${reason}`
                : "\n[Hủy]: Hủy theo yêu cầu của khách hàng với hoàn tiền"),
            updatedAt: new Date(),
          },
        },
        { new: true }
      )
        .populate("profileId", "fullName gender phone year", undefined, {
          strictPopulate: false,
        })
        .populate("serviceId", "serviceName", undefined, {
          strictPopulate: false,
        })
        .populate("packageId", "name", undefined, { strictPopulate: false })
        .populate("createdByUserId", "email fullName", undefined, {
          strictPopulate: false,
        });

      // 🔍 STEP 4: Giải phóng slot nếu có
      if (appointment.slotId) {
        try {
          await releaseSlot(appointment.slotId.toString());

        } catch (releaseError) {
          console.error(
            "❌ [Slot Release Error] Error releasing slot:",
            releaseError
          );
          // Continue with cancellation even if slot release failed
        }
      }

      // ✅ NEW: Send cancellation with refund email notification
      try {
        // ✅ FIX: Lấy email từ user account thay vì populated field
        const userAccount = await User.findById(
          appointment.createdByUserId
        ).select("email fullName");
        const customerEmail = userAccount?.email;
        const customerName =
          userAccount?.fullName ||
          (updatedAppointment?.profileId as any)?.fullName ||
          "Khách hàng";
        const serviceName =
          (updatedAppointment?.packageId as any)?.name ||
          (updatedAppointment?.serviceId as any)?.serviceName ||
          "Dịch vụ không xác định";

        if (
          customerEmail &&
          updatedAppointment?.appointmentDate &&
          refundInfo &&
          paymentTracking
        ) {
          const { sendAppointmentCancelledWithRefundEmail } = await import(
            "../services/emails"
          );

          // ✅ NEW: Lấy thông tin profile để gửi trong email
          const profileInfo = updatedAppointment?.profileId
            ? {
                fullName: (updatedAppointment.profileId as any)?.fullName,
                phone: (updatedAppointment.profileId as any)?.phone,
                age: (updatedAppointment.profileId as any)?.year
                  ? new Date().getFullYear() -
                    (updatedAppointment.profileId as any).year
                  : undefined,
                gender: (updatedAppointment.profileId as any)?.gender,
              }
            : undefined;

          await sendAppointmentCancelledWithRefundEmail(
            customerEmail,
            customerName,
            serviceName,
            updatedAppointment.appointmentDate,
            updatedAppointment.appointmentTime || "Chưa xác định",
            paymentTracking.amount || 0,
            {
              accountNumber: refundInfo.accountNumber,
              accountHolderName: refundInfo.accountHolderName,
              bankName: refundInfo.bankName,
            },
            reason,
            profileInfo
          );
        }
      } catch (emailError) {
        // Email failure shouldn't block cancellation
        console.error(
          "❌ [Email Error] Failed to send cancellation with refund email:",
          emailError
        );
      }

      return res.status(200).json({
        success: true,
        message: packageRefundPerformed
          ? "Hủy cuộc hẹn thành công. Thông tin hoàn tiền đã được ghi nhận, tiền sẽ được chuyển khoản trong 3-5 ngày làm việc và đã hoàn trả lượt sử dụng gói dịch vụ."
          : "Hủy cuộc hẹn thành công. Thông tin hoàn tiền đã được ghi nhận, tiền sẽ được chuyển khoản trong 3-5 ngày làm việc.",
        data: {
          appointment: updatedAppointment,
          refund: {
            packageRefunded: packageRefundPerformed,
            paymentRefunded: !!paymentTracking,
            refundInfoReceived: !!refundInfo,
            estimatedRefundDays: "3-5 ngày làm việc",
            refundMethod: "Chuyển khoản ngân hàng",
          },
          packageRefund: packageRefundPerformed ? {
            refunded: true,
            packageId: packagePurchase?._id,
            packageExpired: packagePurchase?.expiryDate && new Date(packagePurchase.expiryDate) < new Date(),
            expiryDate: packagePurchase?.expiryDate
          } : null
        },
      });
    } catch (error: any) {
      console.error(
        "❌ [Error] Error in appointment cancellation + refund:",
        error
      );

      // Manual rollback cho package refund nếu appointment cancellation thất bại
      if (
        packageRefundPerformed &&
        packagePurchase &&
        originalRemainingUsages >= 0
      ) {
        console.log("🔄 [Rollback] Attempting to rollback package refund...");
        try {
          // ✅ FIX: Rollback logic cũng cần xử lý trường hợp appointment không có serviceId
          let serviceUsage = null;
          let serviceIdToRollback = null;

          if (appointment.serviceId) {
            // Trường hợp appointment có serviceId
            serviceUsage = packagePurchase.usedServices.find(
              (service: any) => service.serviceId.toString() === appointment.serviceId?.toString()
            );
            serviceIdToRollback = appointment.serviceId;
          } else {
            // Trường hợp appointment không có serviceId (purchased_package booking)
            serviceUsage = packagePurchase.usedServices[0];
            serviceIdToRollback = serviceUsage?.serviceId;
          }

          if (serviceUsage) {
            // Rollback usedQuantity về giá trị cũ
            serviceUsage.usedQuantity = originalRemainingUsages;
            
            // Update status
            packagePurchase.checkAndUpdateStatus();
            
            await packagePurchase.save();
          } else {
            console.log("⚠️ [Rollback] Service not found for rollback");
          }
        } catch (rollbackError) {
          console.error(
            "❌ [Rollback] Failed to rollback package refund:",
            rollbackError
          );
          console.error(
            "🚨 [Critical] Manual intervention required for package refund rollback:",
            {
              packagePurchaseId: packagePurchase._id?.toString(),
              serviceId: appointment.serviceId?.toString(),
              shouldBeUsedQuantity: originalRemainingUsages,
            }
          );
        }
      }

      // Re-throw original error
      throw error;
    }
  } catch (error) {
    console.error("Error in cancelAppointmentWithRefund:", error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }
    if (error instanceof UnauthorizedError) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi hủy cuộc hẹn và hoàn tiền",
    });
  }
};
