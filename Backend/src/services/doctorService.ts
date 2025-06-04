import Doctor from '../models/Doctor';
import DoctorSchedules from '../models/DoctorSchedules';

export const getAllDoctors = () => Doctor.find().populate('userId', 'fullName email avatar');
export const getDoctorById = (id: string) => Doctor.findById(id).populate('userId', 'fullName email avatar');
export const createDoctor = (data: any) => Doctor.create(data);
export const updateDoctor = (id: string, data: any) => Doctor.findByIdAndUpdate(id, data, { new: true });
export const deleteDoctor = (id: string) => Doctor.findByIdAndDelete(id);

// 8 slots cố định cho fulltime doctor
const FIXED_TIME_SLOTS = [
  "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00",
  "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
];

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

    const workDate = new Date(date);
    
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

// Lấy thống kê về bác sĩ
export const getDoctorStatistics = async (doctorId: string) => {
  try {
    // Lấy thông tin bác sĩ với populate để có name
    const doctor = await Doctor.findById(doctorId).populate('userId', 'fullName');
    if (!doctor) {
      throw new Error('Không tìm thấy bác sĩ');
    }

    // Tìm tất cả lịch làm việc của bác sĩ
    const schedule = await DoctorSchedules.findOne({ doctorId });
    
    if (!schedule) {
      return {
        doctorId,
        name: (doctor as any).userId.fullName,
        bookedSlots: 0,
        absentSlots: 0,
        absentDays: 0
      };
    }

    let bookedSlots = 0;
    let absentSlots = 0;
    let absentDays = 0;

    // Đếm qua từng ngày trong lịch
    for (const weekDay of schedule.weekSchedule) {
      let absentSlotsInDay = 0;
      let bookedSlotsInDay = 0;
      
      // Đếm slots trong ngày
      for (const slot of weekDay.slots) {
        if (slot.status === 'Booked') {
          bookedSlotsInDay++;
        } else if (slot.status === 'Absent') {
          absentSlotsInDay++;
        }
      }
      
      // Logic sửa: Nếu đủ 8 slot absent = 1 ngày nghỉ, không tính vào absentSlots
      if (absentSlotsInDay >= 8) {
        absentDays++;
        // Không cộng 8 slot absent này vào absentSlots vì đã thành ngày nghỉ
      } else {
        // Chỉ slot absent lẻ mới tính vào absentSlots
        absentSlots += absentSlotsInDay;
      }
      
      // Booked slots luôn được đếm bình thường
      bookedSlots += bookedSlotsInDay;
    }

    return {
      doctorId,
      name: (doctor as any).userId.fullName,
      bookedSlots,
      absentSlots,
      absentDays
    };

  } catch (error) {
    console.error('Error getting doctor statistics:', error);
    throw error;
  }
};

// Lấy thống kê của tất cả bác sĩ (cho staff)
export const getAllDoctorsStatistics = async () => {
  try {
    // Lấy tất cả bác sĩ
    const allDoctors = await Doctor.find().populate('userId', 'fullName');
    
    const allStatistics = [];

    for (const doctor of allDoctors) {
      // Tìm lịch làm việc của từng bác sĩ
      const schedule = await DoctorSchedules.findOne({ doctorId: doctor._id });
      
      let bookedSlots = 0;
      let absentSlots = 0;
      let absentDays = 0;

      if (schedule) {
        // Đếm qua từng ngày trong lịch
        for (const weekDay of schedule.weekSchedule) {
          let absentSlotsInDay = 0;
          let bookedSlotsInDay = 0;
          
          // Đếm slots trong ngày
          for (const slot of weekDay.slots) {
            if (slot.status === 'Booked') {
              bookedSlotsInDay++;
            } else if (slot.status === 'Absent') {
              absentSlotsInDay++;
            }
          }
          
          // Logic sửa: Nếu đủ 8 slot absent = 1 ngày nghỉ, không tính vào absentSlots
          if (absentSlotsInDay >= 8) {
            absentDays++;
            // Không cộng 8 slot absent này vào absentSlots vì đã thành ngày nghỉ
          } else {
            // Chỉ slot absent lẻ mới tính vào absentSlots
            absentSlots += absentSlotsInDay;
          }
          
          // Booked slots luôn được đếm bình thường
          bookedSlots += bookedSlotsInDay;
        }
      }

      allStatistics.push({
        doctorId: doctor._id,
        name: (doctor as any).userId.fullName,
        bookedSlots,
        absentSlots,
        absentDays
      });
    }

    return allStatistics;

  } catch (error) {
    console.error('Error getting all doctors statistics:', error);
    throw error;
  }
};

// BULK CREATE: Tạo lịch cho nhiều ngày cụ thể
export const createBulkDoctorScheduleForDays = async (doctorId: string, dates: string[]) => {
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

    for (const dateStr of dates) {
      try {
        // Validate date format
        const workDate = new Date(dateStr);
        if (isNaN(workDate.getTime())) {
          errors.push(`Ngày không hợp lệ: ${dateStr}`);
          continue;
        }

        // Check if schedule already exists for this date
        const existingSchedule = await DoctorSchedules.findOne({ 
          doctorId,
          'weekSchedule.dayOfWeek': workDate
        });

        if (existingSchedule) {
          errors.push(`Lịch làm việc đã tồn tại cho ngày ${dateStr}`);
          continue;
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
      results,
      errors
    };

  } catch (error: any) {
    throw new Error(error.message || 'Không thể tạo lịch cho nhiều ngày');
  }
};

// BULK CREATE: Tạo lịch cho cả tháng (trừ thứ 7, CN)
export const createBulkDoctorScheduleForMonth = async (doctorId: string, month: number, year: number) => {
  try {
    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new Error('Không tìm thấy bác sĩ');
    }

    // Validate month and year
    if (month < 1 || month > 12) {
      throw new Error('Tháng phải từ 1-12');
    }

    if (year < 2024 || year > 2030) {
      throw new Error('Năm phải từ 2024-2030');
    }

    // Generate working days in month (exclude Saturday=6, Sunday=0)
    const workingDays = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day); // month-1 vì JS Date bắt đầu từ 0
      const dayOfWeek = date.getDay();
      
      // Exclude Saturday (6) and Sunday (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays.push(date.toISOString().split('T')[0]); // YYYY-MM-DD format
      }
    }

    console.log(`🔍 [DEBUG] Creating schedule for ${workingDays.length} working days in ${month}/${year}`);

    // Use the bulk days function
    const result = await createBulkDoctorScheduleForDays(doctorId, workingDays);

    return {
      ...result,
      month,
      year,
      totalWorkingDays: workingDays.length,
      weekendsExcluded: daysInMonth - workingDays.length
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

    // Validate format ngày
    const validDates: Date[] = [];
    const invalidDates: string[] = [];
    
    dates.forEach(dateStr => {
      const workDate = new Date(dateStr);
      if (isNaN(workDate.getTime()) || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        invalidDates.push(dateStr);
      } else {
        validDates.push(workDate);
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

    // Xử lý từng ngày
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
