import mongoose from 'mongoose';
import { Appointments } from '../models';
import Doctor from '../models/Doctor';
import DoctorSchedules from '../models/DoctorSchedules';
import {
    debugMonthWorkingDays,
    generateWorkingDaysInMonth
} from '../utils/timezoneUtils';

// Thêm function validation ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// 8 slots cố định cho fulltime doctor
const FIXED_TIME_SLOTS = [
  "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00",
  "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
];

// GET /doctors/schedules/all - Lấy tất cả lịch làm việc của tất cả bác sĩ (PUBLIC - chỉ Free)
export const getAllDoctorsSchedules = async (isStaff: boolean = false) => {
  try {
    // Lấy tất cả schedules của tất cả doctors
    const allSchedules = await DoctorSchedules.find()
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'fullName email avatar'
        },
        select: 'userId bio specialization'
      });

    if (!isStaff) {
      // Public: chỉ show slots có status = "Free"
      const filteredSchedules = allSchedules.map(schedule => {
        const scheduleObj = JSON.parse(JSON.stringify(schedule));
        return {
          ...scheduleObj,
          weekSchedule: scheduleObj.weekSchedule.map((day: any) => ({
            ...day,
            slots: day.slots.filter((slot: any) => slot.status === "Free")
          }))
        };
      });
      return filteredSchedules;
    }

    return allSchedules; // Staff: show tất cả
  } catch (error: any) {
    throw new Error(error.message || 'Không thể lấy tất cả lịch làm việc');
  }
};

// GET /doctors/schedules/all/staff - Staff xem tất cả lịch làm việc của tất cả bác sĩ
export const getAllDoctorsSchedulesForStaff = async () => {
  return await getAllDoctorsSchedules(true);
};

// GET /doctors/:id/schedules - Xem lịch làm việc của bác sĩ (PUBLIC - chỉ Free)
export const getDoctorSchedules = async (doctorId: string, isStaff: boolean = false) => {
  try {
    // Kiểm tra doctor có tồn tại không
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new Error('Không tìm thấy bác sĩ');
    }

    const schedules = await DoctorSchedules.findOne({ doctorId })
      .populate('doctorId', 'userId bio specialization');

    if (!schedules || !isStaff) {
      // Public: chỉ show slots có status = "Free"
      if (schedules) {
        const schedulesObj = JSON.parse(JSON.stringify(schedules));
        const filteredSchedules = {
          ...schedulesObj,
          weekSchedule: schedulesObj.weekSchedule.map((day: any) => ({
            ...day,
            slots: day.slots.filter((slot: any) => slot.status === "Free")
          }))
        };
        return filteredSchedules;
      }
    }

    return schedules; // Staff: show tất cả
  } catch (error: any) {
    throw new Error(error.message || 'Không thể lấy lịch làm việc của bác sĩ');
  }
};

// GET /doctors/:id/schedules/staff - Staff xem tất cả lịch làm việc của bác sĩ
export const getDoctorSchedulesForStaff = async (doctorId: string) => {
  return await getDoctorSchedules(doctorId, true);
};

// POST /doctors/:id/schedules - Staff tạo lịch cho bác sĩ theo ngày (8 slots cố định)
export const createDoctorSchedule = async (doctorId: string, scheduleData: { date: string }) => {
  try {
    // Kiểm tra doctor có tồn tại không
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new Error('Không tìm thấy bác sĩ');
    }

    const { date } = scheduleData;
    if (!date) {
      throw new Error('Vui lòng cung cấp ngày làm việc');
    }

    // 🔥 VIETNAM TIMEZONE: Tạo date với timezone Việt Nam (GMT+7)
    const workDate = new Date(date);
    const dayName = workDate.toLocaleDateString('vi-VN', { weekday: 'long', timeZone: 'Asia/Ho_Chi_Minh' });

    // 🔍 DEBUG: Log processing date
    console.log(`🔥 [VIETNAM TIMEZONE] Processing date: ${date}`);
    console.log(`🔥 [Day Info] ${dayName} - ${date}`);

    // 🎯 NEW BUSINESS RULE: CHO PHÉP TẤT CẢ NGÀY (T2-T3-T4-T5-T6-T7-CN)
    console.log(`✅ [SUCCESS] Creating schedule for ${dayName} (${date}) - CHO PHÉP TẤT CẢ NGÀY 7 DAYS/WEEK`);

    // Tìm schedule hiện tại của doctor
    let doctorSchedule = await DoctorSchedules.findOne({ doctorId });

    // Tạo 8 slots cố định với status: "Free"
    const newDaySchedule = {
      dayOfWeek: workDate,
      slots: FIXED_TIME_SLOTS.map(timeSlot => ({
        slotTime: timeSlot,
        status: "Free"
      }))
    };

    if (!doctorSchedule) {
      // Tạo mới schedule cho doctor
      doctorSchedule = await DoctorSchedules.create({
        doctorId,
        weekSchedule: [newDaySchedule]
      });
    } else {
      // Kiểm tra xem ngày này đã có lịch chưa
      const existingDay = doctorSchedule.weekSchedule.find(ws => {
        const scheduleDate = new Date(ws.dayOfWeek);
        return scheduleDate.toDateString() === workDate.toDateString();
      });

      if (existingDay) {
        throw new Error('Bác sĩ đã có lịch làm việc trong ngày này');
      }

      // Thêm ngày mới vào weekSchedule
      doctorSchedule.weekSchedule.push(newDaySchedule as any);
      await doctorSchedule.save();
    }

    return await DoctorSchedules.findById(doctorSchedule._id)
      .populate('doctorId', 'userId bio specialization');
  } catch (error: any) {
    throw new Error(error.message || 'Không thể tạo lịch làm việc');
  }
};

// PUT /doctors/:id/schedules - Cập nhật lịch làm việc (ví dụ: update slots status)
export const updateDoctorSchedule = async (doctorId: string, updateData: any) => {
  try {
    const { date, slotId, status } = updateData;

    if (!date || !slotId || !status) {
      throw new Error('Vui lòng cung cấp đầy đủ thông tin: date, slotId, status');
    }

    // Validate status value
    const validStatuses = ["Free", "Booked", "Absent"];
    if (!validStatuses.includes(status)) {
      throw new Error('Status không hợp lệ. Chỉ chấp nhận: Free, Booked, Absent');
    }

    const workDate = new Date(date);

    const doctorSchedule = await DoctorSchedules.findOne({ doctorId });
    if (!doctorSchedule) {
      throw new Error('Không tìm thấy lịch làm việc của bác sĩ');
    }

    // Tìm ngày cần update
    const daySchedule = doctorSchedule.weekSchedule.find(ws => {
      const scheduleDate = new Date(ws.dayOfWeek);
      return scheduleDate.toDateString() === workDate.toDateString();
    });

    if (!daySchedule) {
      throw new Error('Không tìm thấy lịch làm việc trong ngày này');
    }

    // Update slot status
    const slot = daySchedule.slots.find((s: any) => s._id.toString() === slotId);
    if (!slot) {
      throw new Error('Không tìm thấy slot time này');
    }

    slot.status = status;
    await doctorSchedule.save();

    return doctorSchedule;
  } catch (error: any) {
    throw new Error(error.message || 'Không thể cập nhật lịch làm việc');
  }
};

// DELETE /doctors/:id/schedules/:scheduleId - Set tất cả slots trong ngày thành "Absent" thay vì xóa cứng
export const deleteDoctorSchedule = async (doctorId: string, scheduleId: string) => {
  try {
    const doctorSchedule = await DoctorSchedules.findOne({ doctorId });

    if (!doctorSchedule) {
      throw new Error('Không tìm thấy lịch làm việc của bác sĩ');
    }

    // Tìm ngày cần "xóa" (set thành Absent)
    const daySchedule = doctorSchedule.weekSchedule.find((ws: any) => ws._id?.toString() === scheduleId);

    if (!daySchedule) {
      throw new Error('Không tìm thấy lịch làm việc trong ngày này');
    }

    // Set tất cả slots trong ngày thành "Absent" thay vì xóa cứng
    daySchedule.slots.forEach((slot: any) => {
      slot.status = "Absent";
    });

    await doctorSchedule.save();

    return doctorSchedule;
  } catch (error: any) {
    throw new Error(error.message || 'Không thể xóa lịch làm việc');
  }
};

// GET /doctors/:id/available-slots?date=YYYY-MM-DD - Lấy slots trống theo ngày (PUBLIC - chỉ Free)
export const getAvailableSlots = async (doctorId: string, date: string, isStaff: boolean = false) => {
  try {
    const targetDate = new Date(date);

    const schedule = await DoctorSchedules.findOne({ doctorId });

    if (!schedule) {
      return [];
    }

    // Tìm lịch trong ngày được yêu cầu
    const daySchedule = schedule.weekSchedule.find(ws => {
      const scheduleDate = new Date(ws.dayOfWeek);
      return scheduleDate.toDateString() === targetDate.toDateString();
    });

    if (!daySchedule) {
      return [];
    }

    let availableSlots;
    if (isStaff) {
      // Staff: Lấy tất cả slots
      availableSlots = daySchedule.slots.map((slot: any) => ({
        slotId: slot._id,
        slotTime: slot.slotTime,
        status: slot.status
      }));
    } else {
      // Public: Lọc các slot trống (status: "Free")
      availableSlots = daySchedule.slots
        .filter(slot => slot.status === "Free")
        .map((slot: any) => ({
          slotId: slot._id,
          slotTime: slot.slotTime,
          status: slot.status
        }));
    }

    return availableSlots;
  } catch (error: any) {
    throw new Error(error.message || 'Không thể lấy slot trống');
  }
};

/**
 * Khóa một slot cụ thể (đặt trạng thái thành "Booked").
 * @param slotId ID của slot cần khóa
 * @returns {Promise<boolean>}
 */
export const lockSlot = async (slotId: string): Promise<boolean> => {
    if (!isValidObjectId(slotId)) {
        throw new Error('Slot ID không hợp lệ');
    }

    // Tìm và cập nhật slot trong một thao tác duy nhất để đảm bảo an toàn
    const result = await DoctorSchedules.findOneAndUpdate(
        { 
            "weekSchedule.slots._id": new mongoose.Types.ObjectId(slotId),
            "weekSchedule.slots.status": "Free" // Đảm bảo chỉ khóa slot đang "Free"
        },
        { 
            $set: { "weekSchedule.$[].slots.$[slot].status": "Booked" }
        },
        {
            arrayFilters: [
                { "slot._id": new mongoose.Types.ObjectId(slotId) }
            ],
            new: true // Trả về document sau khi update
        }
    );

    if (!result) {
        // Nếu không tìm thấy document nào được update, có thể slot không tồn tại hoặc đã được đặt
        const existingSlot = await DoctorSchedules.findOne({ "weekSchedule.slots._id": new mongoose.Types.ObjectId(slotId) });
        if (!existingSlot) {
            throw new Error('Không tìm thấy slot thời gian này.');
        }
        throw new Error('Slot thời gian này đã được đặt hoặc không có sẵn.');
    }

    console.log(`✅ [Slot Lock] Slot ${slotId} đã được khóa thành công.`);
    return true;
};

/**
 * Giải phóng một slot cụ thể (đặt trạng thái từ "Booked" về "Free").
 * @param slotId ID của slot cần giải phóng
 * @returns {Promise<boolean>}
 */
export const releaseSlot = async (slotId: string): Promise<boolean> => {
    if (!isValidObjectId(slotId)) {
        throw new Error('Slot ID không hợp lệ');
    }

    // Tìm và cập nhật slot trong một thao tác duy nhất
    const result = await DoctorSchedules.findOneAndUpdate(
        { 
            "weekSchedule.slots._id": new mongoose.Types.ObjectId(slotId),
            "weekSchedule.slots.status": "Booked" // Đảm bảo chỉ release slot đang "Booked"
        },
        { 
            $set: { "weekSchedule.$[].slots.$[slot].status": "Free" }
        },
        {
            arrayFilters: [
                { "slot._id": new mongoose.Types.ObjectId(slotId) }
            ],
            new: true
        }
    );

    if (!result) {
        // Nếu không tìm thấy document nào được update
        const existingSlot = await DoctorSchedules.findOne({ "weekSchedule.slots._id": new mongoose.Types.ObjectId(slotId) });
        if (!existingSlot) {
            console.log(`⚠️ [Slot Release] Slot ${slotId} không tồn tại.`);
            return false; // Không throw error, chỉ return false
        }
        console.log(`⚠️ [Slot Release] Slot ${slotId} không ở trạng thái "Booked".`);
        return false;
    }

    console.log(`✅ [Slot Release] Slot ${slotId} đã được giải phóng thành công.`);
    return true;
};

// GET /doctors/:id/available-slots/staff - Staff xem tất cả slots theo ngày
export const getAvailableSlotsForStaff = async (doctorId: string, date: string) => {
  return await getAvailableSlots(doctorId, date, true);
};

// GET /doctors/available?date=YYYY-MM-DD&timeSlot=07:00-08:00 - Tìm tất cả bác sĩ có lịch trống theo ngày/timeSlot (PUBLIC - chỉ Free)
export const getAvailableDoctors = async (date: string, timeSlot?: string, isStaff: boolean = false) => {
  try {
    const targetDate = new Date(date);

    // Lấy tất cả bác sĩ với populate userId, exclude soft deleted
    const allDoctors = await Doctor.find({ 
      isDeleted: { $ne: true } 
    }).populate({
      path: 'userId',
      select: 'fullName email avatar isActive',
      match: { isActive: { $ne: false } } // Chỉ lấy user active
    });

    // Lấy tất cả appointments đã confirmed/scheduled trong ngày để check slot conflicts
    const existingAppointments = await Appointments.find({
      appointmentDate: {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lte: new Date(targetDate.setHours(23, 59, 59, 999))
      },
      status: { $in: ['confirmed', 'scheduled', 'consulting', 'pending_payment'] },
      doctorId: { $exists: true, $ne: null }
    }).select('doctorId appointmentTime slotId');

    console.log(`🔍 [Available Doctors] Found ${existingAppointments.length} existing appointments for ${date}`);

    const availableDoctors: any[] = [];

    for (const doctor of allDoctors) {
      // Skip nếu doctor không có userId (corrupted data)
      if (!doctor.userId) {
        console.warn(`⚠️ [Available Doctors] Doctor ${doctor._id} has no userId, skipping`);
        continue;
      }

      // Tìm lịch làm việc của doctor trong ngày được yêu cầu
      const schedule = await DoctorSchedules.findOne({ doctorId: doctor._id });

      if (!schedule) {
        continue; // Bác sĩ chưa có lịch làm việc
      }

      // Tìm lịch trong ngày cụ thể
      const daySchedule = schedule.weekSchedule.find(ws => {
        const scheduleDate = new Date(ws.dayOfWeek);
        return scheduleDate.toDateString() === targetDate.toDateString();
      });

      if (!daySchedule) {
        continue; // Bác sĩ không làm việc trong ngày này
      }

      // Lấy danh sách appointments của doctor này trong ngày
      const doctorAppointments = existingAppointments.filter(apt => 
        apt.doctorId && apt.doctorId.toString() === doctor._id.toString()
      );

      // Kiểm tra theo timeSlot hoặc tìm bất kỳ slot nào
      let hasAvailableSlots = false;
      let availableSlotsInDay: any[] = [];

      if (timeSlot) {
        // Tìm slot cụ thể trong timeSlot
        const specificSlot = daySchedule.slots.find((slot: any) => {
          const slotTimeMatch = slot.slotTime === timeSlot;
          
          if (!slotTimeMatch) return false;
          
          if (isStaff) {
            return true; // Staff: xem tất cả status
          } else {
            // Public: chỉ Free và không bị book bởi appointment
            const isSlotFree = slot.status === "Free";
            const isSlotBooked = doctorAppointments.some(apt => 
              apt.appointmentTime === timeSlot || 
              (apt.slotId && apt.slotId.toString() === (slot as any)._id.toString())
            );
            
            return isSlotFree && !isSlotBooked;
          }
        });

        if (specificSlot) {
          hasAvailableSlots = true;
          availableSlotsInDay = [{
            slotId: (specificSlot as any)._id,
            slotTime: specificSlot.slotTime,
            status: specificSlot.status
          }];
        }
      } else {
        // Tìm tất cả slot trong ngày
        if (isStaff) {
          // Staff: lấy tất cả slots
          availableSlotsInDay = daySchedule.slots.map((slot: any) => ({
            slotId: (slot as any)._id,
            slotTime: slot.slotTime,
            status: slot.status
          }));
          hasAvailableSlots = availableSlotsInDay.length > 0;
        } else {
          // Public: chỉ lấy slot Free và không bị book
          availableSlotsInDay = daySchedule.slots
            .filter((slot: any) => {
              const isSlotFree = slot.status === "Free";
              const isSlotBooked = doctorAppointments.some(apt => 
                apt.appointmentTime === slot.slotTime ||
                (apt.slotId && apt.slotId.toString() === (slot as any)._id.toString())
              );
              
              return isSlotFree && !isSlotBooked;
            })
            .map((slot: any) => ({
              slotId: (slot as any)._id,
              slotTime: slot.slotTime,
              status: slot.status
            }));
          hasAvailableSlots = availableSlotsInDay.length > 0;
        }
      }

      if (hasAvailableSlots) {
        // Type assertion cho populated userId
        const populatedDoctor = doctor as any;

        availableDoctors.push({
          doctorId: doctor._id, // Doctor document ID
          userId: populatedDoctor.userId._id, // User ID của doctor
          doctorInfo: {
            fullName: populatedDoctor.userId.fullName,
            email: populatedDoctor.userId.email,
            avatar: populatedDoctor.userId.avatar,
            specialization: doctor.specialization,
            experience: doctor.experience,
            rating: doctor.rating,
            isActive: populatedDoctor.userId.isActive !== false
          },
          availableSlots: availableSlotsInDay,
          totalAvailableSlots: availableSlotsInDay.length
        });
      }
    }

    console.log(`✅ [Available Doctors] Found ${availableDoctors.length} available doctors for ${date}${timeSlot ? ` at ${timeSlot}` : ''}`);
    
    return availableDoctors;
  } catch (error: any) {
    console.error('❌ [Available Doctors] Error:', error);
    throw new Error(error.message || 'Không thể tìm bác sĩ có lịch trống');
  }
};

// GET /doctors/available/staff - Staff xem tất cả bác sĩ và slots theo ngày
export const getAvailableDoctorsForStaff = async (date: string, timeSlot?: string) => {
  return await getAvailableDoctors(date, timeSlot, true);
};

// PUT /doctors/:id/schedules/absent - Đánh dấu bác sĩ nghỉ toàn bộ ngày
export const setDoctorAbsentForDay = async (doctorId: string, date: string) => {
  try {
    const workDate = new Date(date);

    const doctorSchedule = await DoctorSchedules.findOne({ doctorId });
    if (!doctorSchedule) {
      throw new Error('Không tìm thấy lịch làm việc của bác sĩ');
    }

    // Tìm ngày cần update
    const daySchedule = doctorSchedule.weekSchedule.find(ws => {
      const scheduleDate = new Date(ws.dayOfWeek);
      return scheduleDate.toDateString() === workDate.toDateString();
    });

    if (!daySchedule) {
      throw new Error('Không tìm thấy lịch làm việc trong ngày này');
    }

    // Set tất cả slots trong ngày thành "Absent"
    daySchedule.slots.forEach((slot: any) => {
      slot.status = "Absent";
    });

    await doctorSchedule.save();

    return doctorSchedule;
  } catch (error: any) {
    throw new Error(error.message || 'Không thể đánh dấu bác sĩ nghỉ');
  }
};

// BULK CREATE: Tạo lịch cho nhiều ngày cụ thể (CHO PHÉP TẤT CẢ NGÀY TRONG TUẦN)
export const createBulkDoctorScheduleForDays = async (doctorId: string, dates: string[], overwrite: boolean = false) => {
  try {
    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new Error('Không tìm thấy bác sĩ');
    }

    // Validate dates
    if (!dates || dates.length === 0) {
      throw new Error('Vui lòng cung cấp ít nhất 1 ngày để tạo lịch');
    }

    const results = [];
    const errors = [];
    const skippedDates = [];
    const overwrittenDates = [];

    for (const dateStr of dates) {
      try {
        // 🔥 UPDATED: Chỉ validate format, không filter weekend
        // Validate date format và timezone VN
        let workDateBulkDays: Date;
        try {
          // Parse với timezone VN
          const [year, month, day] = dateStr.split('-').map(Number);
          workDateBulkDays = new Date(year, month - 1, day);
          
          // Validate format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(workDateBulkDays.getTime())) {
            throw new Error('Format ngày không đúng YYYY-MM-DD');
          }
        } catch (validateError: any) {
          errors.push(`Ngày không hợp lệ: ${dateStr} - ${validateError.message}`);
          continue;
        }

        const dayOfWeek = workDateBulkDays.getDay();
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        
        console.log(`📅 BulkDays processing ${dateStr} (${dayNames[dayOfWeek]}) - CHO PHÉP TẤT CẢ NGÀY`);

        // Check if schedule already exists for this date
        const existingSchedule = await DoctorSchedules.findOne({
          doctorId,
          'weekSchedule.dayOfWeek': workDateBulkDays
        });

        if (existingSchedule && !overwrite) {
          skippedDates.push(dateStr);
          const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
          const dayOfWeek = workDateBulkDays.getDay();
          errors.push(`❌ Bác sĩ đã có lịch làm việc cho ${dayNames[dayOfWeek]} ngày ${dateStr}. Vui lòng chọn ngày khác hoặc sử dụng chế độ ghi đè.`);
          continue;
        }

        if (existingSchedule && overwrite) {
          // Ghi đè: xóa lịch cũ cho ngày này
          await DoctorSchedules.updateOne(
            { doctorId },
            { $pull: { weekSchedule: { dayOfWeek: workDateBulkDays } } }
          );
          overwrittenDates.push(dateStr);
        }

        // Create schedule for this date using existing service
        const newSchedule = await createDoctorSchedule(doctorId, { date: dateStr });
        results.push({
          date: dateStr,
          success: true,
          schedule: newSchedule
        });

        console.log(`✅ BulkDays created schedule for ${dateStr} (${dayNames[dayOfWeek]})`);

      } catch (error: any) {
        errors.push(`Lỗi tạo lịch cho ngày ${dateStr}: ${error.message}`);
        console.log(`❌ BulkDays error for ${dateStr}: ${error.message}`);
      }
    }

    // 🔥 IMPROVED ERROR HANDLING: Provide clear feedback for duplicate schedules
    if (results.length === 0 && skippedDates.length > 0) {
      // Tất cả ngày đều bị trùng lịch
      const errorMessage = skippedDates.length === 1 
        ? `Bác sĩ đã có lịch làm việc cho ngày ${skippedDates[0]}. Vui lòng chọn ngày khác hoặc sử dụng chế độ ghi đè.`
        : `Bác sĩ đã có lịch làm việc cho ${skippedDates.length} ngày được chọn (${skippedDates.slice(0, 3).join(', ')}${skippedDates.length > 3 ? '...' : ''}). Vui lòng chọn những ngày khác hoặc sử dụng chế độ ghi đè.`;
      
      throw new Error(errorMessage);
    }

    return {
      success: results.length > 0,
      totalRequested: dates.length,
      successCount: results.length,
      errorCount: errors.length,
      skippedCount: skippedDates.length,
      overwrittenCount: overwrittenDates.length,
      results,
      errors,
      skippedDates,
      overwrittenDates,
      allowWeekends: true,
      note: 'Hệ thống cho phép tạo lịch cho tất cả ngày trong tuần'
    };

  } catch (error: any) {
    throw new Error(error.message || 'Không thể tạo lịch cho nhiều ngày');
  }
};

// BULK CREATE: Tạo lịch cho cả tháng (BAO GỒM TẤT CẢ NGÀY) - UPDATED FOR 7-DAY WEEK
export const createBulkDoctorScheduleForMonth = async (doctorId: string, month: number, year: number, overwrite: boolean = false) => {
  try {
    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new Error('Không tìm thấy bác sĩ');
    }

    // 🔥 UPDATED: Tạo lịch cho TẤT CẢ ngày trong tháng (bao gồm cả cuối tuần)
    const daysInMonth = new Date(year, month, 0).getDate(); // Số ngày trong tháng
    const allDaysInMonth: string[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      allDaysInMonth.push(dateStr);
    }

    console.log(`🔍 [BULK MONTH] Creating schedule for ALL ${allDaysInMonth.length} days in ${month}/${year} (including weekends)`);
    console.log(`📊 [MONTH ANALYSIS] Total days: ${allDaysInMonth.length}, Weekends included: YES`);

    // 🔥 ENHANCED ERROR HANDLING: Improved error handling for month conflicts
    // Use the bulk days function with overwrite parameter
    const result = await createBulkDoctorScheduleForDays(doctorId, allDaysInMonth, overwrite);

    // Calculate weekdays and weekends for stats
    const weekdays = [];
    const weekends = [];
    
    for (const dateStr of allDaysInMonth) {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekends.push(dateStr);
      } else {
        weekdays.push(dateStr);
      }
    }

    return {
      ...result,
      month,
      year,
      totalDays: allDaysInMonth.length,
      totalWorkingDays: allDaysInMonth.length, // Giờ tất cả ngày đều là "working days"
      weekendsIncluded: weekends.length,
      weekdaysIncluded: weekdays.length,
      weekendsExcluded: 0, // Không loại bỏ weekend nữa
      monthAnalysis: {
        month,
        year,
        totalDays: allDaysInMonth.length,
        allDays: allDaysInMonth,
        weekdays,
        weekends,
        summary: {
          totalDays: allDaysInMonth.length,
          totalWeekdays: weekdays.length,
          totalWeekends: weekends.length,
          allowWeekends: true,
          note: 'Tạo lịch cho tất cả ngày trong tháng, bao gồm cả cuối tuần'
        }
      }
    };

  } catch (error: any) {
    // 🔥 ENHANCED ERROR HANDLING for month creation conflicts
    if (error.message && error.message.includes('đã có lịch làm việc')) {
      // Convert generic error to more specific month error
      throw new Error(`❌ Tháng ${month}/${year} đã có lịch làm việc của bác sĩ. Vui lòng:
📅 Chọn tháng khác, hoặc
🔄 Sử dụng chế độ ghi đè để thay thế lịch cũ, hoặc  
📝 Tạo lịch theo ngày cụ thể cho những ngày chưa có lịch.`);
    }
    
    // Re-throw other errors with better context
    throw new Error(error.message || 'Không thể tạo lịch cho cả tháng');
  }
};

// POST /doctors/:id/schedules/bulk - Staff tạo lịch cho bác sĩ cho nhiều ngày cùng lúc
export const createBulkDoctorSchedule = async (doctorId: string, scheduleData: { dates: string[] }) => {
  try {
    // Kiểm tra doctor có tồn tại không
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new Error('Không tìm thấy bác sĩ');
    }

    const { dates } = scheduleData;
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      throw new Error('Vui lòng cung cấp danh sách ngày làm việc');
    }

    // Validate tối đa 31 ngày (1 tháng) để tránh spam
    if (dates.length > 31) {
      throw new Error('Chỉ có thể tạo tối đa 31 ngày cùng lúc');
    }

    // 🔥 UPDATED: Validate format ngày, CHO PHÉP TẤT CẢ NGÀY TRONG TUẦN
    const validDates: Date[] = [];
    const invalidDates: string[] = [];

    dates.forEach(dateStr => {
      if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        invalidDates.push(dateStr);
      } else {
        // Parse với timezone VN
        const [yearBulk, monthBulk, dayBulk] = dateStr.split('-').map(Number);
        const localDateBulk = new Date(yearBulk, monthBulk - 1, dayBulk);
        
        if (isNaN(localDateBulk.getTime())) {
          invalidDates.push(dateStr);
        } else {
          const dayOfWeekBulk = localDateBulk.getDay();
          const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

          console.log(`📅 Bulk processing ${dateStr} (${dayNames[dayOfWeekBulk]}) - CHO PHÉP TẤT CẢ NGÀY`);
          
          validDates.push(localDateBulk); // Cho phép tất cả ngày
        }
      }
    });

    if (invalidDates.length > 0) {
      throw new Error(`Ngày không hợp lệ: ${invalidDates.join(', ')}. Vui lòng sử dụng format YYYY-MM-DD`);
    }

    // Tìm schedule hiện tại của doctor
    let doctorSchedule = await DoctorSchedules.findOne({ doctorId });

    const results = {
      successful: 0,
      failed: 0,
      details: {
        created: [] as string[],
        skipped: [] as string[],
        errors: [] as { date: string, reason: string }[]
      }
    };

    // 🔥 UPDATED: Xử lý từng ngày (cho phép tất cả ngày trong tuần)
    for (const workDate of validDates) {
      const dateStr = workDate.toISOString().split('T')[0];

      try {
        // Tạo 8 slots cố định với status: "Free"
        const newDaySchedule = {
          dayOfWeek: workDate,
          slots: FIXED_TIME_SLOTS.map(timeSlot => ({
            slotTime: timeSlot,
            status: "Free"
          }))
        };

        if (!doctorSchedule) {
          // Tạo mới schedule cho doctor (lần đầu tiên)
          doctorSchedule = await DoctorSchedules.create({
            doctorId,
            weekSchedule: [newDaySchedule]
          });
          results.successful++;
          results.details.created.push(dateStr);
        } else {
          // Kiểm tra xem ngày này đã có lịch chưa
          const existingDay = doctorSchedule.weekSchedule.find(ws => {
            const scheduleDate = new Date(ws.dayOfWeek);
            return scheduleDate.toDateString() === workDate.toDateString();
          });

          if (existingDay) {
            // 🔥 IMPROVED: Provide more specific error for existing dates
            const dayOfWeek = workDate.getDay();
            const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
            results.failed++;
            results.details.skipped.push(dateStr);
            results.details.errors.push({
              date: dateStr,
              reason: `❌ Bác sĩ đã có lịch làm việc cho ${dayNames[dayOfWeek]} ngày ${dateStr}. Bỏ qua ngày này.`
            });
          } else {
            // Thêm ngày mới vào weekSchedule
            doctorSchedule.weekSchedule.push(newDaySchedule as any);
            results.successful++;
            results.details.created.push(dateStr);
          }
        }
      } catch (error: any) {
        results.failed++;
        results.details.errors.push({
          date: dateStr,
          reason: error.message || 'Lỗi không xác định'
        });
      }
    }

    // Lưu tất cả thay đổi
    if (doctorSchedule && results.successful > 0) {
      await doctorSchedule.save();
    }

    // Lấy schedule mới nhất để trả về
    const finalSchedule = await DoctorSchedules.findById(doctorSchedule?._id)
      .populate('doctorId', 'userId bio specialization');

    return {
      results,
      schedule: finalSchedule
    };

  } catch (error: any) {
    throw new Error(error.message || 'Không thể tạo lịch làm việc hàng loạt');
  }
};

// 🔥 NEW: Helper function to check schedule conflicts before creation
export const checkScheduleConflicts = async (doctorId: string, dates: string[]) => {
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new Error('Không tìm thấy bác sĩ');
    }

    const conflicts = [];
    const available = [];

    for (const dateStr of dates) {
      try {
        // Parse date with VN timezone
        const [year, month, day] = dateStr.split('-').map(Number);
        const workDate = new Date(year, month - 1, day);
        
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(workDate.getTime())) {
          conflicts.push({
            date: dateStr,
            status: 'invalid',
            reason: 'Format ngày không hợp lệ'
          });
          continue;
        }

        // Check if schedule already exists
        const existingSchedule = await DoctorSchedules.findOne({
          doctorId,
          'weekSchedule.dayOfWeek': workDate
        });

        const dayOfWeek = workDate.getDay();
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

        if (existingSchedule) {
          conflicts.push({
            date: dateStr,
            status: 'conflict',
            reason: `Bác sĩ đã có lịch làm việc cho ${dayNames[dayOfWeek]}`,
            dayName: dayNames[dayOfWeek]
          });
        } else {
          available.push({
            date: dateStr,
            status: 'available',
            reason: `Có thể tạo lịch cho ${dayNames[dayOfWeek]}`,
            dayName: dayNames[dayOfWeek]
          });
        }
      } catch (error: any) {
        conflicts.push({
          date: dateStr,
          status: 'error',
          reason: error.message || 'Lỗi kiểm tra ngày'
        });
      }
    }

    return {
      doctorId,
      totalRequested: dates.length,
      conflicts: conflicts.length,
      available: available.length,
      canProceed: available.length > 0,
      details: {
        conflicts,
        available
      },
      recommendation: conflicts.length > 0 
        ? `Có ${conflicts.length} ngày bị trùng lịch. Bạn có thể tạo lịch cho ${available.length} ngày còn lại hoặc sử dụng chế độ ghi đè.`
        : `Tất cả ${available.length} ngày đều có thể tạo lịch.`
    };

  } catch (error: any) {
    throw new Error(error.message || 'Không thể kiểm tra xung đột lịch làm việc');
  }
}; 