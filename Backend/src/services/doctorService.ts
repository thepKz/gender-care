import { Doctor } from '../models/Doctor';
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
    console.log(`✅ Đã tạo bác sĩ mới: ${doctorInfo.fullName}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password mặc định: ${defaultPassword}`);
    
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

// getDoctorContactInfo đã được merge vào getDoctorById vì logic nghiệp vụ đã thay đổi
// Chỉ staff/admin mới có thể access GET /doctors/:id nên luôn trả full info
