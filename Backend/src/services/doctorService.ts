
import DoctorSchedules from '../models/DoctorSchedules';

import  Doctor  from '../models/Doctor';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Thêm function validation ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// API public - ẩn email và phone để bảo vệ privacy
export const getAllDoctors = async () => {
  const doctors = await Doctor.find({ isDeleted: { $ne: true } }) // Loại bỏ doctors đã bị xóa
    .populate('userId', 'fullName avatar gender address') // Bỏ email và phone
    .sort({ createdAt: -1 }); // Sắp xếp theo thời gian tạo mới nhất
  
  return doctors; // Trả về trực tiếp array
};

export const getDoctorById = (id: string) => {
  // Validate ObjectId format
  if (!isValidObjectId(id)) {
    throw new Error('ID bác sĩ không hợp lệ');
  }
  
  // Trả về full info bao gồm contact (email, phone) vì chỉ staff/admin được access
  return Doctor.findOne({ _id: id, isDeleted: { $ne: true } }).populate('userId', 'fullName email phone avatar gender address');
};

// Sửa createDoctor để tự tạo user account từ doctorInfo
export const createDoctor = async (doctorInfo: any) => {
  try {
    // Validate required doctor fields
    if (!doctorInfo.fullName) {
      throw new Error('Tên bác sĩ (fullName) là bắt buộc');
    }

    // Tự động tạo email từ fullName
    const normalizedName = doctorInfo.fullName
      .toLowerCase()
      .replace(/bs\./g, '') // Bỏ tiền tố BS.
      .replace(/[^\w\s]/g, '') // Bỏ ký tự đặc biệt
      .trim()
      .split(' ')
      .join(''); // Nối các từ lại

    const email = `bs.${normalizedName}@genderhealthcare.com`;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error(`Email ${email} đã tồn tại. Vui lòng đặt tên khác cho bác sĩ.`);
    }

    // Tạo password mặc định tuân thủ quy tắc bảo mật (chữ thường, in hoa, số, ký tự đặc biệt)
    const defaultPassword = 'Doctor123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Tạo user account với thông tin từ doctorInfo
    const user = await User.create({
      email,
      password: hashedPassword,
      fullName: doctorInfo.fullName,
      phone: doctorInfo.phone || '',
      gender: doctorInfo.gender || 'other',
      address: doctorInfo.address || '',
      role: 'doctor',
      emailVerified: true,
      isActive: true
    });

    // Loại bỏ các field user khỏi doctorInfo để tránh duplicate
    const { fullName, phone, gender, address, ...pureDoctorlnfo } = doctorInfo;

    // Tạo doctor record với userId vừa tạo
    const doctor = await Doctor.create({
      userId: user._id,
      ...pureDoctorlnfo
    });

    // Populate user info để trả về (ẩn email/phone trong response)
    const populatedDoctor = await Doctor.findById(doctor._id).populate('userId', 'fullName avatar gender address');
    
    // Log thông tin account mới tạo cho admin
    console.log(`Đã tạo bác sĩ mới: ${doctorInfo.fullName}`);
    console.log(`Email: ${email}`);
    console.log(`Password mặc định: ${defaultPassword}`);
    
    return {
      doctor: populatedDoctor,
      email: email,
      defaultPassword: defaultPassword
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateDoctor = async (id: string, data: any) => {
  // Validate ObjectId format
  if (!isValidObjectId(id)) {
    throw new Error('ID bác sĩ không hợp lệ');
  }

  // Tách user fields và doctor fields
  const { 
    fullName,
    phone, 
    gender,
    address,
    // Loại bỏ các field không được phép cập nhật
    userId, 
    _id, 
    createdAt, 
    updatedAt,
    ...doctorFields 
  } = data;
  
  // Log cảnh báo nếu có người cố tình gửi field bị cấm
  if (userId) {
    console.warn(`Cố gắng cập nhật userId cho doctor ${id}, đã bị loại bỏ`);
  }
  if (_id) {
    console.warn(`Cố gắng cập nhật _id cho doctor ${id}, đã bị loại bỏ`);
  }

  // Validate dữ liệu đầu vào cho doctor fields
  if (doctorFields.experience !== undefined && (doctorFields.experience < 0 || doctorFields.experience > 50)) {
    throw new Error('Số năm kinh nghiệm phải từ 0-50 năm');
  }
  
  if (doctorFields.rating !== undefined && (doctorFields.rating < 0 || doctorFields.rating > 5)) {
    throw new Error('Rating phải từ 0-5');
  }

  // Validate gender field
  if (gender !== undefined && !['male', 'female', 'other'].includes(gender)) {
    throw new Error('Giới tính phải là male, female hoặc other');
  }

  // Kiểm tra doctor có tồn tại và chưa bị xóa
  const existingDoctor = await Doctor.findOne({ _id: id, isDeleted: { $ne: true } }).populate('userId');
  if (!existingDoctor) {
    throw new Error('Không tìm thấy bác sĩ hoặc bác sĩ đã bị xóa');
  }

  // Chuẩn bị user update data
  const userUpdateData: any = {};
  if (fullName !== undefined) userUpdateData.fullName = fullName;
  if (phone !== undefined) userUpdateData.phone = phone;
  if (gender !== undefined) userUpdateData.gender = gender;
  if (address !== undefined) userUpdateData.address = address;

  // Cập nhật User nếu có user fields
  if (Object.keys(userUpdateData).length > 0) {
    await User.findByIdAndUpdate(
      (existingDoctor.userId as any)._id,
      userUpdateData,
      { new: true }
    );
  }

  // Cập nhật Doctor nếu có doctor fields
  let updatedDoctor;
  if (Object.keys(doctorFields).length > 0) {
    updatedDoctor = await Doctor.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      doctorFields,
      { new: true }
    ).populate('userId', 'fullName email phone avatar gender address');
  } else {
    // Nếu chỉ update user fields, populate lại để có data mới
    updatedDoctor = await Doctor.findById(id).populate('userId', 'fullName email phone avatar gender address');
  }

  if (!updatedDoctor) {
    throw new Error('Lỗi khi cập nhật thông tin bác sĩ');
  }

  return updatedDoctor;
};

export const deleteDoctor = async (id: string, adminId: string, force: boolean = false) => {
  // Validate ObjectId format
  if (!isValidObjectId(id)) {
    throw new Error('ID bác sĩ không hợp lệ');
  }

  // Kiểm tra doctor có tồn tại và chưa bị xóa
  const doctor = await Doctor.findOne({ _id: id, isDeleted: { $ne: true } }).populate('userId');
  if (!doctor) {
    throw new Error('Không tìm thấy bác sĩ hoặc bác sĩ đã bị xóa');
  }

  // Business logic checks (chỉ khi không force)
  if (!force) {
    // TODO: Implement appointment and Q&A validation when models are ready
  }

  // Soft delete doctor record
  const deletedDoctor = await Doctor.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: adminId
    },
    { new: true }
  ).populate('userId', 'fullName avatar gender address');

  // Vô hiệu hóa user account liên quan
  await User.findByIdAndUpdate(doctor.userId._id, { 
    isActive: false 
  });

  // Log audit trail
  console.log(`Doctor deleted by admin:`, {
    doctorId: id,
    doctorName: (doctor.userId as any).fullName,
    adminId,
    force,
    timestamp: new Date()
  });

  return {
    message: force ? 'Đã force xóa bác sĩ' : 'Đã vô hiệu hóa bác sĩ',
    doctor: deletedDoctor,
    userDeactivated: true
  };
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

    // TIMEZONE FIX: Sử dụng local time cho Việt Nam (UTC+7)
    const [year, month, day] = date.split('-').map(Number);
    const workDate = new Date(year, month - 1, day); // Local time (UTC+7)
    
    // Method 1: getDay() với local time 
    const dayOfWeek = workDate.getDay();
    
    // Method 2: Tạo Date với timezone VN rõ ràng
    const workDateVN = new Date(date + 'T00:00:00.000+07:00');
    const dayOfWeekVN = workDateVN.getDay();
    
    // Method 3: toLocaleDateString cho VN
    const dayName = workDate.toLocaleDateString('vi-VN', { 
      weekday: 'long',
      timeZone: 'Asia/Ho_Chi_Minh' 
    });
    
    // TIMEZONE DEBUG: Log tất cả methods
    console.log(`[TIMEZONE FIX] Processing date: ${date}`);
    console.log(`[Local Time] getDay(): ${dayOfWeek} (0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7)`);
    console.log(`[VN Timezone] getDay(): ${dayOfWeekVN}`);
    console.log(`[VN Locale] dayName: ${dayName}`);
    
    // BACK TO T2-T6: Chỉ cho phép Monday-Friday (1-5)
    const isWeekend = (dayOfWeek === 0) || (dayOfWeek === 6) || (dayName.includes('Chủ nhật')) || (dayName.includes('Thứ Bảy'));
    
    console.log(`[DECISION] Is Weekend? ${isWeekend} (dayOfWeek: ${dayOfWeek})`);
    console.log(`[DECISION] Should create? ${!isWeekend} (T2-T6 only)`);
    
    if (isWeekend) {
      const dayType = dayOfWeek === 0 ? 'Chủ nhật' : 'Thứ 7';
      throw new Error(`Không thể tạo lịch cho cuối tuần: ${date} (${dayType})`);
    }
    
    // CHỈ CHO PHÉP T2-T6 (Monday-Friday)
    console.log(`[SUCCESS] Creating schedule for ${dayName} (${date}) - Working day T2-T6`);
    
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
    const weekendDates = [];

    for (const dateStr of dates) {
      try {
        // Validate date format
        const workDate = new Date(dateStr);
        if (isNaN(workDate.getTime())) {
          errors.push(`Ngày không hợp lệ: ${dateStr}`);
          continue;
        }

        // TIMEZONE FIX: Local time cho bulk days
        const [yearBulkDays, monthBulkDays, dayBulkDays] = dateStr.split('-').map(Number);
        const localDateBulkDays = new Date(yearBulkDays, monthBulkDays - 1, dayBulkDays);
        const dayOfWeekBulkDays = localDateBulkDays.getDay();
        const dayNameBulkDays = localDateBulkDays.toLocaleDateString('vi-VN', { 
          weekday: 'long',
          timeZone: 'Asia/Ho_Chi_Minh' 
        });
        const isWeekendBulkDays = (dayOfWeekBulkDays === 0) || (dayOfWeekBulkDays === 6) || (dayNameBulkDays.includes('Chủ nhật')) || (dayNameBulkDays.includes('Thứ Bảy'));
        
        console.log(`BulkDays checking ${dateStr}: dayOfWeek=${dayOfWeekBulkDays}, dayName=${dayNameBulkDays}, isWeekend=${isWeekendBulkDays}`);
        
        if (isWeekendBulkDays) {
          weekendDates.push(dateStr);
          const dayType = dayOfWeekBulkDays === 0 ? 'Chủ nhật' : 'Thứ 7';
          errors.push(`Không thể tạo lịch cho cuối tuần: ${dateStr} (${dayType})`);
          console.log(`BulkDays skipped ${dateStr} (${dayNameBulkDays}) - Weekend`);
          continue;
        }
        
        console.log(`BulkDays processing ${dateStr} (${dayNameBulkDays}) - Working day T2-T6`);

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
      weekendCount: weekendDates.length,
      results,
      errors,
      weekendDates
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
    // FIX: Để lấy đúng ngày của tháng, cần dùng month-1 cho cả daysInMonth và date creation
    const daysInMonth = new Date(year, month, 0).getDate(); // này đúng rồi: month=6 -> ngày cuối tháng 6

    for (let day = 1; day <= daysInMonth; day++) {
      // FIX: Use string-based date creation to avoid timezone issues
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      
      // TIMEZONE FIX: Sử dụng local time cho bulk month  
      const [yearLocal, monthLocal, dayLocal] = dateStr.split('-').map(Number);
      const localDate = new Date(yearLocal, monthLocal - 1, dayLocal);
      const dayOfWeekLocal = localDate.getDay();
      const dayName = localDate.toLocaleDateString('vi-VN', { 
        weekday: 'long',
        timeZone: 'Asia/Ho_Chi_Minh' 
      });
      const isWeekend = (dayOfWeekLocal === 0) || (dayOfWeekLocal === 6) || (dayName.includes('Chủ nhật')) || (dayName.includes('Thứ Bảy'));
      
      console.log(`Checking ${dateStr}: dayOfWeek=${dayOfWeekLocal}, dayName=${dayName}, isWeekend=${isWeekend}`);
      
      if (!isWeekend) {
        workingDays.push(dateStr);
        console.log(`Added ${dateStr} (${dayName}) to working days (T2-T6)`);
      } else {
        console.log(`Skipped ${dateStr} (${dayName}) - Weekend (T7/CN)`);
      }
    }

    console.log(`[DEBUG] Creating schedule for ${workingDays.length} working days in ${month}/${year}`);

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

    // Validate format ngày và loại bỏ ngày cuối tuần
    const validDates: Date[] = [];
    const invalidDates: string[] = [];
    const weekendDates: string[] = [];
    
    dates.forEach(dateStr => {
      const workDate = new Date(dateStr);
      if (isNaN(workDate.getTime()) || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        invalidDates.push(dateStr);
      } else {
        // TIMEZONE FIX: Local time cho bulk dates
        const [yearBulk, monthBulk, dayBulk] = dateStr.split('-').map(Number);
        const localDateBulk = new Date(yearBulk, monthBulk - 1, dayBulk);
        const dayOfWeekBulk = localDateBulk.getDay();
        const dayNameBulk = localDateBulk.toLocaleDateString('vi-VN', { 
          weekday: 'long',
          timeZone: 'Asia/Ho_Chi_Minh' 
        });
        const isWeekendBulk = (dayOfWeekBulk === 0) || (dayOfWeekBulk === 6) || (dayNameBulk.includes('Chủ nhật')) || (dayNameBulk.includes('Thứ Bảy'));
        
        console.log(`Bulk checking ${dateStr}: dayOfWeek=${dayOfWeekBulk}, dayName=${dayNameBulk}, isWeekend=${isWeekendBulk}`);
        
        if (isWeekendBulk) {
          weekendDates.push(dateStr); // T7 và CN
          console.log(`Bulk skipped ${dateStr} (${dayNameBulk}) - Weekend (T7/CN)`);
        } else {
          validDates.push(localDateBulk); // T2-T6 với local time
          console.log(`Bulk added ${dateStr} (${dayNameBulk}) to valid dates (T2-T6)`);
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
