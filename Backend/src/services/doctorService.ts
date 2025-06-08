import  Doctor  from '../models/Doctor';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import DoctorSchedules from '../models/DoctorSchedules';

// Thêm function validation ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const getAllDoctors = () => Doctor.find().populate('userId', 'fullName email avatar phone');
export const getDoctorById = (id: string) => Doctor.findById(id).populate('userId', 'fullName email avatar phone');

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

    // Tạo password mặc định
    const defaultPassword = 'doctor123';
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

    // Populate user info để trả về
    const populatedDoctor = await Doctor.findById(doctor._id).populate('userId', 'fullName email avatar phone');
    
    // Log thông tin account mới tạo cho admin
    console.log(`✅ Đã tạo bác sĩ mới: ${doctorInfo.fullName}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password mặc định: ${defaultPassword}`);
    
    return populatedDoctor;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateDoctor = (id: string, data: any) => {
  // Loại bỏ userId khỏi data để đảm bảo không thể cập nhật
  const { userId, ...updateData } = data;
  
  // Nếu có người cố tình gửi userId, ghi log cảnh báo
  if (userId) {
    console.warn(`Cố gắng cập nhật userId cho doctor ${id}, đã bị loại bỏ`);
  }
  
  return Doctor.findByIdAndUpdate(id, updateData, { new: true }).populate('userId', 'fullName email avatar phone');
};

export const deleteDoctor = (id: string) => Doctor.findByIdAndDelete(id);

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
