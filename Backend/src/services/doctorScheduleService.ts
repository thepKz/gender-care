import DoctorSchedules from '../models/DoctorSchedules';
import Doctor from '../models/Doctor';
import mongoose from 'mongoose';
import { 
  createVietnamDate, 
  getVietnamDayOfWeek, 
  getVietnamDayName, 
  isWorkingDay, 
  isWeekend,
  getDayInfo,
  generateWorkingDaysInMonth,
  debugMonthWorkingDays 
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

    // 🔥 TIMEZONE FIX: Sử dụng centralized timezone utils 
    const dayInfo = getDayInfo(date);
    const workDate = createVietnamDate(date);

    // 🔍 UNIFIED DEBUG: Log với format mới
    console.log(`🔥 [TIMEZONE FIX] Processing date: ${date}`);
    console.log(`🔥 [Day Info] ${JSON.stringify(dayInfo, null, 2)}`);

    // 🎯 BUSINESS RULE: CHỈ CHO PHÉP T2-T6 (Monday-Friday)
    if (!isWorkingDay(date)) {
      throw new Error(`🚫 ${dayInfo.reason}: ${date}`);
    }

    console.log(`✅ [SUCCESS] Creating schedule for ${dayInfo.dayName} (${date}) - Working day T2-T6`);

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
 * Mở khóa một slot cụ thể (đặt trạng thái thành "Free").
 * @param slotId ID của slot cần mở khóa
 * @returns {Promise<boolean>}
 */
export const releaseSlot = async (slotId: string): Promise<boolean> => {
    if (!isValidObjectId(slotId)) {
        throw new Error('Slot ID không hợp lệ');
    }

    const result = await DoctorSchedules.findOneAndUpdate(
        { "weekSchedule.slots._id": new mongoose.Types.ObjectId(slotId) },
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
        // Có thể slot không tồn tại, nhưng trong trường hợp này, việc không tìm thấy để release cũng không phải là lỗi nghiêm trọng
        console.warn(`⚠️ [Slot Release] Không tìm thấy slot ${slotId} để mở khóa.`);
        return false;
    }

    console.log(`✅ [Slot Release] Slot ${slotId} đã được mở khóa thành công.`);
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

    // Lấy tất cả bác sĩ với populate userId
    const allDoctors = await Doctor.find().populate('userId', 'fullName email avatar');

    const availableDoctors: any[] = [];

    for (const doctor of allDoctors) {
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

      // Kiểm tra theo timeSlot hoặc tìm bất kỳ slot nào
      let hasAvailableSlots = false;
      let availableSlotsInDay: any[] = [];

      if (timeSlot) {
        // Tìm slot cụ thể trong timeSlot
        const specificSlot = daySchedule.slots.find((slot: any) => {
          if (isStaff) {
            return slot.slotTime === timeSlot; // Staff: xem tất cả status
          } else {
            return slot.slotTime === timeSlot && slot.status === "Free"; // Public: chỉ Free
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
          // Public: chỉ lấy slot Free
          availableSlotsInDay = daySchedule.slots
            .filter((slot: any) => slot.status === "Free")
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
          doctorId: doctor._id,
          doctorInfo: {
            fullName: populatedDoctor.userId.fullName,
            email: populatedDoctor.userId.email,
            avatar: populatedDoctor.userId.avatar,
            specialization: doctor.specialization,
            experience: doctor.experience,
            rating: doctor.rating
          },
          availableSlots: availableSlotsInDay,
          totalAvailableSlots: availableSlotsInDay.length
        });
      }
    }

    return availableDoctors;
  } catch (error: any) {
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

// BULK CREATE: Tạo lịch cho nhiều ngày cụ thể
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
    const weekendDates = [];
    const skippedDates = [];
    const overwrittenDates = [];

    for (const dateStr of dates) {
      try {
        // Validate date format - using timezone utils for consistency
        try {
          // This will throw if invalid format or date
          createVietnamDate(dateStr);
        } catch (validateError: any) {
          errors.push(`Ngày không hợp lệ: ${dateStr} - ${validateError.message}`);
          continue;
        }

        // 🔥 TIMEZONE FIX: Use centralized timezone utils
        const dayInfo = getDayInfo(dateStr);
        const workDateBulkDays = createVietnamDate(dateStr);

        console.log(`📅 BulkDays checking ${dateStr}: ${JSON.stringify(dayInfo, null, 2)}`);

        if (!isWorkingDay(dateStr)) {
          weekendDates.push(dateStr);
          errors.push(`🚫 ${dayInfo.reason}: ${dateStr}`);
          console.log(`🚫 BulkDays skipped ${dateStr} - ${dayInfo.reason}`);
          continue;
        }

        console.log(`✅ BulkDays processing ${dateStr} - ${dayInfo.reason}`);

        // Check if schedule already exists for this date
        const existingSchedule = await DoctorSchedules.findOne({
          doctorId,
          'weekSchedule.dayOfWeek': workDateBulkDays
        });

        if (existingSchedule && !overwrite) {
          skippedDates.push(dateStr);
          errors.push(`Lịch làm việc đã tồn tại cho ngày ${dateStr}. Sử dụng overwrite=true để ghi đè.`);
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

      } catch (error: any) {
        errors.push(`Lỗi tạo lịch cho ngày ${dateStr}: ${error.message}`);
      }
    }

    return {
      success: results.length > 0,
      totalRequested: dates.length,
      successCount: results.length,
      errorCount: errors.length,
      weekendCount: weekendDates.length,
      skippedCount: skippedDates.length,
      overwrittenCount: overwrittenDates.length,
      results,
      errors,
      weekendDates,
      skippedDates,
      overwrittenDates
    };

  } catch (error: any) {
    throw new Error(error.message || 'Không thể tạo lịch cho nhiều ngày');
  }
};

// BULK CREATE: Tạo lịch cho cả tháng (trừ thứ 7, CN) - USING TIMEZONE UTILS
export const createBulkDoctorScheduleForMonth = async (doctorId: string, month: number, year: number, overwrite: boolean = false) => {
  try {
    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new Error('Không tìm thấy bác sĩ');
    }

    // 🔥 STREAMLINED: Use timezone utils for validation and generation
    const workingDays = generateWorkingDaysInMonth(month, year);
    const monthAnalysis = debugMonthWorkingDays(month, year);

    console.log(`🔍 [BULK MONTH] Creating schedule for ${workingDays.length} working days in ${month}/${year}`);
    console.log(`📊 [MONTH ANALYSIS] ${JSON.stringify(monthAnalysis.summary, null, 2)}`);

    // Use the bulk days function with overwrite parameter
    const result = await createBulkDoctorScheduleForDays(doctorId, workingDays, overwrite);

    return {
      ...result,
      month,
      year,
      totalWorkingDays: workingDays.length,
      weekendsExcluded: monthAnalysis.summary.totalWeekends,
      monthAnalysis
    };

  } catch (error: any) {
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

    // Validate format ngày và loại bỏ ngày cuối tuần
    const validDates: Date[] = [];
    const invalidDates: string[] = [];
    const weekendDates: string[] = [];

    dates.forEach(dateStr => {
      const workDate = new Date(dateStr);
      if (isNaN(workDate.getTime()) || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        invalidDates.push(dateStr);
      } else {
        // 🔥 TIMEZONE FIX: Local time cho bulk dates
        const [yearBulk, monthBulk, dayBulk] = dateStr.split('-').map(Number);
        const localDateBulk = new Date(yearBulk, monthBulk - 1, dayBulk);
        const dayOfWeekBulk = localDateBulk.getDay();
        const dayNameBulk = localDateBulk.toLocaleDateString('vi-VN', {
          weekday: 'long',
          timeZone: 'Asia/Ho_Chi_Minh'
        });
        const isWeekendBulk = (dayOfWeekBulk === 0) || (dayOfWeekBulk === 6) || (dayNameBulk.includes('Chủ nhật')) || (dayNameBulk.includes('Thứ Bảy'));

        console.log(`📅 Bulk checking ${dateStr}: dayOfWeek=${dayOfWeekBulk}, dayName=${dayNameBulk}, isWeekend=${isWeekendBulk}`);

        if (isWeekendBulk) {
          weekendDates.push(dateStr); // T7 và CN
          console.log(`🚫 Bulk skipped ${dateStr} (${dayNameBulk}) - Weekend (T7/CN)`);
        } else {
          validDates.push(localDateBulk); // T2-T6 với local time
          console.log(`✅ Bulk added ${dateStr} (${dayNameBulk}) to valid dates (T2-T6)`);
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
      weekendSkipped: weekendDates.length,
      details: {
        created: [] as string[],
        skipped: [] as string[],
        weekendDates: weekendDates,
        errors: [] as { date: string, reason: string }[]
      }
    };

    // Xử lý từng ngày (chỉ các ngày trong tuần)
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
            // Ngày đã tồn tại, skip
            results.failed++;
            results.details.skipped.push(dateStr);
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