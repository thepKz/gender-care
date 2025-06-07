import { Doctor } from '../models/Doctor';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Thêm function validation ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const getAllDoctors = () => Doctor.find().populate('userId', 'fullName email avatar phone gender address');
export const getDoctorById = (id: string) => Doctor.findById(id).populate('userId', 'fullName email avatar phone gender address');

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

    // Populate user info để trả về
    const populatedDoctor = await Doctor.findById(doctor._id).populate('userId', 'fullName email avatar phone gender address');
    
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
  
  return Doctor.findByIdAndUpdate(id, updateData, { new: true }).populate('userId', 'fullName email avatar phone gender address');
};

export const deleteDoctor = (id: string) => Doctor.findByIdAndDelete(id);
