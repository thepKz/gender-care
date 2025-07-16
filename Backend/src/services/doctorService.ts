import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Doctor from '../models/Doctor';
import DoctorSchedules from '../models/DoctorSchedules';
import Feedbacks from '../models/Feedbacks';
import User from '../models/User';
import { sendNewAccountEmail } from './emails';

// Thêm function validation ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Helper function: Tính số năm kinh nghiệm từ chuỗi mô tả kinh nghiệm
export const calculateYearsOfExperience = (experienceStr: string | number | undefined): number => {
  try {
    // Nếu không có giá trị, trả về 0
    if (experienceStr === undefined || experienceStr === null) return 0;

    // Nếu experienceStr là số, trả về số đó
    if (typeof experienceStr === 'number' || !isNaN(Number(experienceStr))) {
      return Number(experienceStr);
    }

    // Đến đây, experienceStr chắc chắn là string
    // Lấy các dòng kinh nghiệm từ chuỗi
    const lines = experienceStr.split('\n').filter(line => line.trim() !== '');

    let totalYears = 0;

    lines.forEach(line => {
      // Tìm định dạng năm-năm: nội dung
      const match = line.match(/(\d{4})-(\d{4}|hiện tại):/i);
      if (match) {
        const startYear = parseInt(match[1]);
        const endYear = match[2].toLowerCase() === 'hiện tại'
          ? new Date().getFullYear()
          : parseInt(match[2]);

        // Tính số năm, đảm bảo tính cả năm bắt đầu và năm kết thúc
        // Ví dụ: 2021-2025 = 5 năm (2021, 2022, 2023, 2024, 2025)
        const years = (endYear - startYear) + 1;
        totalYears += years > 0 ? years : 0;
      }
    });

    return totalYears;
  } catch (error) {
    console.error('Error calculating years of experience:', error);
    return 0;
  }
};

// Helper function: Lấy feedback của doctor (tạm thời trả về empty)
export const getDoctorFeedbacks = async (doctorId: string) => {
  try {
    // Tìm tất cả feedbacks cho doctor này
    const feedbacks = await Feedbacks.find({ doctorId })
      .populate('appointmentId', 'appointmentDate')
      .sort({ createdAt: -1 });

    // Nếu chưa có feedback, trả về structure mặc định
    if (!feedbacks || feedbacks.length === 0) {
      return {
        totalFeedbacks: 0,
        averageRating: 0,
        feedbacks: [],
        message: 'Chưa có đánh giá nào'
      };
    }

    // Tính toán thống kê
    const totalFeedbacks = feedbacks.length;
    const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    const averageRating = Math.round((totalRating / totalFeedbacks) * 10) / 10; // Round to 1 decimal

    return {
      totalFeedbacks,
      averageRating,
      feedbacks: feedbacks.map(feedback => ({
        _id: feedback._id,
        rating: feedback.rating,
        feedback: feedback.feedback,
        comment: feedback.comment,
        appointmentId: feedback.appointmentId,
        createdAt: feedback.createdAt
      })),
      message: `Có ${totalFeedbacks} đánh giá`
    };
  } catch (error) {
    console.error('Error getting doctor feedbacks:', error);
    // Trả về structure mặc định nếu có lỗi
    return {
      totalFeedbacks: 0,
      averageRating: 0,
      feedbacks: [],
      message: 'Chưa có đánh giá nào'
    };
  }
};

// Helper function: Check active status của doctor thông qua User.isActive
export const getDoctorActiveStatus = async (doctorId: string) => {
  try {
    const doctor = await Doctor.findById(doctorId).populate('userId', 'isActive');

    if (!doctor || !(doctor as any).userId) {
      return {
        isActive: false,
        statusText: 'Không xác định',
        message: 'Không tìm thấy thông tin bác sĩ'
      };
    }

    const isActive = (doctor as any).userId.isActive;

    return {
      isActive,
      statusText: isActive ? 'Hoạt động' : 'Tạm dừng',
      message: isActive ? 'Bác sĩ đang hoạt động bình thường' : 'Bác sĩ tạm thời ngưng hoạt động'
    };
  } catch (error) {
    console.error('Error getting doctor active status:', error);
    return {
      isActive: false,
      statusText: 'Lỗi hệ thống',
      message: 'Không thể kiểm tra trạng thái'
    };
  }
};

// Enhanced function: Lấy tất cả doctors với feedback và status
export const getAllDoctorsWithDetails = async () => {
  try {
    const doctors = await Doctor.find().populate('userId', 'fullName email avatar phone gender address isActive');

    const doctorsWithDetails = [];

    for (const doctor of doctors) {
      // Lấy feedback và status cho từng doctor
      const feedbackData = await getDoctorFeedbacks(doctor._id.toString());
      const statusData = await getDoctorActiveStatus(doctor._id.toString());

      // Tính số năm kinh nghiệm từ chuỗi mô tả kinh nghiệm
      const yearsOfExperience = calculateYearsOfExperience(doctor.experience);

      doctorsWithDetails.push({
        ...JSON.parse(JSON.stringify(doctor)), // Convert to plain object
        feedback: feedbackData,
        status: statusData,
        yearsOfExperience // Thêm trường mới chứa số năm kinh nghiệm đã tính toán
      });
    }

    return doctorsWithDetails;
  } catch (error) {
    console.error('Error getting all doctors with details:', error);
    throw error;
  }
};

// Enhanced function: Lấy doctor by ID với feedback và status  
export const getDoctorByIdWithDetails = async (id: string) => {
  try {
    const doctor = await Doctor.findById(id).populate('userId', 'fullName email avatar phone gender address isActive');

    if (!doctor) {
      throw new Error('Không tìm thấy bác sĩ');
    }

    // Lấy feedback và status
    const feedbackData = await getDoctorFeedbacks(id);
    const statusData = await getDoctorActiveStatus(id);

    // Tính số năm kinh nghiệm từ chuỗi mô tả kinh nghiệm
    const yearsOfExperience = calculateYearsOfExperience(doctor.experience);

    return {
      ...JSON.parse(JSON.stringify(doctor)), // Convert to plain object
      feedback: feedbackData,
      status: statusData,
      yearsOfExperience // Thêm trường mới chứa số năm kinh nghiệm đã tính toán
    };
  } catch (error) {
    console.error('Error getting doctor by ID with details:', error);
    throw error;
  }
};

// ✅ Enhanced populate để include gender và address fields
export const getAllDoctors = () => Doctor.find().populate('userId', 'fullName email avatar phone gender address isActive');

// Thêm hàm mới để lấy danh sách bác sĩ kèm theo số năm kinh nghiệm được tính toán
export const getAllDoctorsWithCalculatedExperience = async () => {
  try {
    const doctors = await Doctor.find().populate('userId', 'fullName email avatar phone gender address isActive');

    // Thêm trường yearsOfExperience cho mỗi bác sĩ
    return doctors.map(doctor => {
      const yearsOfExperience = calculateYearsOfExperience(doctor.experience);
      return {
        ...doctor.toObject(),
        yearsOfExperience
      };
    });
  } catch (error) {
    console.error('Error getting all doctors with calculated experience:', error);
    throw error;
  }
};

export const getDoctorById = (id: string) => Doctor.findById(id).populate('userId', 'fullName email avatar phone gender address isActive');

// PUBLIC: Lấy thông tin cơ bản của bác sĩ (không bao gồm thông tin nhạy cảm)
export const getDoctorPublicInfo = async (id: string) => {
  try {
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      throw new Error('ID bác sĩ không hợp lệ');
    }

    const doctor = await Doctor.findById(id).populate('userId', 'fullName avatar');

    if (!doctor) {
      return null;
    }

    // Tính số năm kinh nghiệm từ chuỗi mô tả kinh nghiệm
    const yearsOfExperience = calculateYearsOfExperience(doctor.experience);

    // Chỉ trả về thông tin công khai, không bao gồm thông tin nhạy cảm
    return {
      _id: doctor._id,
      userId: {
        _id: (doctor as any).userId._id,
        fullName: (doctor as any).userId.fullName,
        avatar: (doctor as any).userId.avatar,
      },
      bio: doctor.bio,
      experience: doctor.experience,
      yearsOfExperience, // Thêm trường mới chứa số năm kinh nghiệm đã tính toán
      rating: doctor.rating,
      image: doctor.image,
      specialization: doctor.specialization,
      education: doctor.education,
      certificate: doctor.certificate,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
    };
  } catch (error) {
    console.error('Error getting doctor public info:', error);
    throw error;
  }
};

// Sửa createDoctor để tự tạo user account từ doctorInfo
export const createDoctor = async (doctorInfo: any) => {
  try {
    // Validate required doctor fields
    if (!doctorInfo.fullName) {
      throw new Error('Tên bác sĩ (fullName) là bắt buộc');
    }

    if (!doctorInfo.email) {
      throw new Error('Email là bắt buộc');
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email: doctorInfo.email });
    if (existingUser) {
      throw new Error('Email đã tồn tại trong hệ thống');
    }

    // Tạo user account trước
    const defaultPassword = 'doctor123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const newUser = new User({
      email: doctorInfo.email,
      password: hashedPassword,
      fullName: doctorInfo.fullName,
      phone: doctorInfo.phone || '',
      gender: doctorInfo.gender || 'other',
      address: doctorInfo.address || '',
      role: 'doctor',
      isActive: true,
      emailVerified: false,
    });

    const savedUser = await newUser.save();

    // Tạo doctor profile với thông tin chi tiết
    const newDoctor = new Doctor({
      userId: savedUser._id,
      bio: doctorInfo.bio || '',
      experience: doctorInfo.experience || '', // Now stores structured experience data
      rating: 0, // Default rating
      image: doctorInfo.image || '',
      specialization: doctorInfo.specialization || '',
      education: doctorInfo.education || '', // Now stores structured education data
      certificate: doctorInfo.certificate || '', // Stores certificate file info
      approvalStatus: 'approved', // Auto-approve for admin created doctors
      lastApprovedBy: null,
      lastApprovedAt: new Date(),
    });

    const savedDoctor = await newDoctor.save();

    // Populate user info
    const populatedDoctor = await Doctor.findById(savedDoctor._id)
      .populate('userId', 'fullName email avatar phone gender address isActive');

    // Gửi email thông báo tài khoản mới
    try {
      await sendNewAccountEmail(
        doctorInfo.email,
        doctorInfo.fullName,
        doctorInfo.email,
        defaultPassword,
        'doctor'
      );
    } catch (emailError) {
      console.error('Failed to send account email:', emailError);
      // Continue without failing the doctor creation
    }

    return populatedDoctor;
  } catch (error) {
    console.error('Error creating doctor:', error);
    throw error;
  }
};

export const updateDoctor = async (id: string, data: any) => {
  try {
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      throw new Error('ID bác sĩ không hợp lệ');
    }

    // Loại bỏ userId khỏi data để đảm bảo không thể cập nhật
    const { userId, ...updateData } = data;

    // Nếu có người cố tình gửi userId, ghi log cảnh báo
    if (userId) {
      console.warn(`⚠️ Cố gắng cập nhật userId cho doctor ${id}, đã bị loại bỏ`);
    }

    // Tìm doctor để lấy userId cho sync avatar
    const existingDoctor = await Doctor.findById(id);
    if (!existingDoctor) {
      throw new Error('Không tìm thấy bác sĩ để cập nhật');
    }

    // Nếu có cập nhật image, đồng bộ với user avatar
    if (updateData.image) {
      await User.findByIdAndUpdate(existingDoctor.userId, {
        avatar: updateData.image
      });
      console.log(`🔄 Đã sync avatar user với doctor image: ${updateData.image}`);
    }

    // Validate experience nếu có
    if (updateData.experience !== undefined) {
      // Kiểm tra kiểu dữ liệu
      if (typeof updateData.experience === 'number') {
        // Vẫn giữ lại xác thực cũ cho số năm kinh nghiệm nếu người dùng nhập số
        const exp = Number(updateData.experience);
        if (isNaN(exp) || exp < 0 || exp > 50) {
          throw new Error('Kinh nghiệm phải là số từ 0 đến 50 năm hoặc chuỗi văn bản mô tả chi tiết');
        }
        updateData.experience = exp;
      } else if (typeof updateData.experience !== 'string') {
        // Nếu không phải số và không phải chuỗi thì báo lỗi
        throw new Error('Kinh nghiệm phải là chuỗi văn bản hoặc số năm kinh nghiệm');
      }
      // Nếu là chuỗi thì giữ nguyên giá trị
    }

    // Validate rating nếu có
    if (updateData.rating !== undefined) {
      const rating = Number(updateData.rating);
      if (isNaN(rating) || rating < 0 || rating > 5) {
        throw new Error('Rating phải là số từ 0 đến 5');
      }
      updateData.rating = rating;
    }

    // Validate gender nếu có
    if (updateData.gender && !['male', 'female', 'other'].includes(updateData.gender)) {
      throw new Error('Giới tính phải là male, female hoặc other');
    }

    console.log(`🔄 [UPDATE START] Doctor ID: ${id}`);
    console.log(`📝 [UPDATE DATA]:`, JSON.stringify(updateData, null, 2));

    // Populate để log current state
    const populatedDoctor = await Doctor.findById(id).populate('userId', 'fullName email');

    console.log(`👤 [BEFORE UPDATE] Doctor: ${(populatedDoctor as any)?.userId?.fullName}`);
    console.log(`📊 [BEFORE UPDATE] Current data:`, {
      bio: populatedDoctor?.bio,
      experience: populatedDoctor?.experience,
      rating: populatedDoctor?.rating,
      specialization: populatedDoctor?.specialization,
      education: populatedDoctor?.education,
      certificate: populatedDoctor?.certificate,
    });

    // Thực hiện update với options đầy đủ
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id,
      {
        $set: updateData,
        updatedAt: new Date() // Force update timestamp
      },
      {
        new: true,           // Return updated document
        runValidators: true, // Run mongoose validators
        upsert: false,       // Don't create if not exists
        setDefaultsOnInsert: false
      }
    ).populate('userId', 'fullName email avatar phone');

    if (!updatedDoctor) {
      throw new Error('Không thể cập nhật bác sĩ - doctor không tồn tại sau update');
    }

    console.log(`✅ [AFTER UPDATE] Doctor: ${(updatedDoctor as any)?.userId?.fullName}`);
    console.log(`📊 [AFTER UPDATE] Updated data:`, {
      bio: updatedDoctor.bio,
      experience: updatedDoctor.experience,
      rating: updatedDoctor.rating,
      specialization: updatedDoctor.specialization,
      education: updatedDoctor.education,
      certificate: updatedDoctor.certificate,
      updatedAt: updatedDoctor.updatedAt
    });

    // Verify update trong database bằng cách query lại
    const verifyDoctor = await Doctor.findById(id);
    console.log(`🔍 [VERIFICATION] Database state after update:`, {
      bio: verifyDoctor?.bio,
      experience: verifyDoctor?.experience,
      updatedAt: verifyDoctor?.updatedAt
    });

    console.log(`🎉 [UPDATE SUCCESS] Doctor ${id} updated successfully`);

    return updatedDoctor;
  } catch (error: any) {
    console.error(`❌ [UPDATE ERROR] Doctor ID ${id}:`, error.message);
    console.error(`❌ [UPDATE ERROR] Stack:`, error.stack);
    throw error;
  }
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

// Toggle/Update active status của doctor
export const updateDoctorActiveStatus = async (doctorId: string, isActive: boolean) => {
  try {
    // Tìm doctor để lấy userId
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new Error('Không tìm thấy bác sĩ');
    }

    // Cập nhật isActive trong User model
    const updatedUser = await User.findByIdAndUpdate(
      (doctor as any).userId,
      { isActive },
      { new: true }
    ).select('isActive fullName email');

    if (!updatedUser) {
      throw new Error('Không thể cập nhật trạng thái người dùng');
    }

    return {
      doctorId,
      userId: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      isActive: updatedUser.isActive,
      statusText: updatedUser.isActive ? 'Hoạt động' : 'Tạm ngưng',
      message: `Đã ${updatedUser.isActive ? 'kích hoạt' : 'tạm ngưng'} tài khoản bác sĩ thành công`
    };
  } catch (error) {
    console.error('Error updating doctor active status:', error);
    throw error;
  }
};
