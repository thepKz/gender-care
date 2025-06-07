import { Doctor } from '../models/Doctor';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Thêm function validation ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// API public - ẩn email và phone để bảo vệ privacy
export const getAllDoctors = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  
  // Thực hiện song song để tối ưu performance
  const [doctors, total] = await Promise.all([
    Doctor.find({ isDeleted: { $ne: true } }) // Loại bỏ doctors đã bị xóa
      .populate('userId', 'fullName avatar gender address') // Bỏ email và phone
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }), // Sắp xếp theo thời gian tạo
    Doctor.countDocuments({ isDeleted: { $ne: true } }) // Đếm chỉ doctors active
  ]);
  
  return {
    doctors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

export const getDoctorById = (id: string) => {
  // Validate ObjectId format
  if (!isValidObjectId(id)) {
    throw new Error('ID bác sĩ không hợp lệ');
  }
  
  return Doctor.findOne({ _id: id, isDeleted: { $ne: true } }).populate('userId', 'fullName avatar gender address'); // Bỏ email và phone
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
    console.log(`✅ Đã tạo bác sĩ mới: ${doctorInfo.fullName}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password mặc định: ${defaultPassword}`);
    
    return populatedDoctor;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateDoctor = async (id: string, data: any) => {
  // Validate ObjectId format
  if (!isValidObjectId(id)) {
    throw new Error('ID bác sĩ không hợp lệ');
  }

  // Loại bỏ các field không được phép cập nhật
  const { 
    userId, 
    _id, 
    createdAt, 
    updatedAt,
    ...updateData 
  } = data;
  
  // Log cảnh báo nếu có người cố tình gửi field bị cấm
  if (userId) {
    console.warn(`Cố gắng cập nhật userId cho doctor ${id}, đã bị loại bỏ`);
  }
  if (_id) {
    console.warn(`Cố gắng cập nhật _id cho doctor ${id}, đã bị loại bỏ`);
  }

  // Validate dữ liệu đầu vào
  if (updateData.experience !== undefined && (updateData.experience < 0 || updateData.experience > 50)) {
    throw new Error('Số năm kinh nghiệm phải từ 0-50 năm');
  }
  
  if (updateData.rating !== undefined && (updateData.rating < 0 || updateData.rating > 5)) {
    throw new Error('Rating phải từ 0-5');
  }

  // Kiểm tra doctor có tồn tại và chưa bị xóa
  const existingDoctor = await Doctor.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!existingDoctor) {
    throw new Error('Không tìm thấy bác sĩ hoặc bác sĩ đã bị xóa');
  }
  
  return Doctor.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    updateData,
    { new: true }
  ).populate('userId', 'fullName avatar gender address');
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
    // Kiểm tra có appointments đang hoạt động không
    // Note: Cần implement khi có Appointment model
    // const activeAppointments = await Appointment.find({
    //   doctorId: id,
    //   status: { $in: ['pending', 'confirmed'] }
    // });
    // if (activeAppointments.length > 0) {
    //   throw new Error('Không thể xóa bác sĩ có lịch hẹn đang hoạt động. Hãy hủy tất cả lịch hẹn trước.');
    // }

    // Kiểm tra có Q&A đang xử lý không
    // Note: Cần implement khi có DoctorQA model
    // const pendingQA = await DoctorQA.find({
    //   doctorId: id,
    //   status: { $in: ['pending', 'contacted'] }
    // });
    // if (pendingQA.length > 0) {
    //   throw new Error('Không thể xóa bác sĩ có câu hỏi đang xử lý. Hãy xử lý xong tất cả Q&A trước.');
    // }
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
  console.log(`🗑️ Doctor deleted by admin:`, {
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

// Service riêng để lấy contact info (chỉ cho admin/staff hoặc khi có appointment)
export const getDoctorContactInfo = (id: string) => {
  // Validate ObjectId format
  if (!isValidObjectId(id)) {
    throw new Error('ID bác sĩ không hợp lệ');
  }
  
  return Doctor.findOne({ _id: id, isDeleted: { $ne: true } }).populate('userId', 'fullName email phone avatar gender address');
};
