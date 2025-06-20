import { Request, Response } from 'express';
import * as doctorService from '../services/doctorService';
import { uploadToCloudinary } from '../services/uploadService';
import fs from 'fs';

export const getAll = async (req: Request, res: Response) => {
  try {
    const result = await doctorService.getAllDoctors();
    res.json(result);
  } catch (error) {
    console.error('Error getting doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách bác sĩ',
    });
  }
};

// Lấy tất cả doctors kèm feedback + status
export const getAllWithDetails = async (req: Request, res: Response) => {
  try {
    const doctors = await doctorService.getAllDoctorsWithDetails();
    res.json({
      message: 'Lấy danh sách bác sĩ thành công (bao gồm đánh giá và trạng thái)',
      data: doctors,
      total: doctors.length,
    });
  } catch (error) {
    console.error('Error in getAllWithDetails:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách bác sĩ chi tiết' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    if (!doctor)
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ',
      });
    res.json(doctor);
  } catch (error: any) {
    if (error.message && error.message.includes('ID bác sĩ không hợp lệ')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Error getting doctor by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin bác sĩ',
    });
  }
};

// Lấy doctor by ID kèm feedback + status
export const getByIdWithDetails = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.id;
    const doctor = await doctorService.getDoctorByIdWithDetails(doctorId);

    res.json({
      message: 'Lấy thông tin bác sĩ thành công (bao gồm đánh giá và trạng thái)',
      data: doctor,
    });
  } catch (error: any) {
    console.error('Error in getByIdWithDetails:', error);
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin bác sĩ chi tiết' });
  }
};

// PUBLIC: Lấy thông tin cơ bản của bác sĩ (không cần authentication)
export const getPublicById = async (req: Request, res: Response) => {
  try {
    const doctor = await doctorService.getDoctorPublicInfo(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ',
      });
    }
    res.json({
      success: true,
      message: 'Lấy thông tin bác sĩ thành công',
      data: doctor,
    });
  } catch (error: any) {
    if (error.message && error.message.includes('ID bác sĩ không hợp lệ')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Error getting doctor public info:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin bác sĩ',
    });
  }
};

// Chỉ lấy feedback
export const getDoctorFeedbacks = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.id;
    const feedbacks = await doctorService.getDoctorFeedbacks(doctorId);

    res.json({
      message: 'Lấy đánh giá bác sĩ thành công',
      data: feedbacks,
    });
  } catch (error) {
    console.error('Error in getDoctorFeedbacks:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá bác sĩ' });
  }
};

// Chỉ lấy trạng thái active
export const getDoctorStatus = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.id;
    const status = await doctorService.getDoctorActiveStatus(doctorId);

    res.json({
      message: 'Lấy trạng thái bác sĩ thành công',
      data: status,
    });
  } catch (error) {
    console.error('Error in getDoctorStatus:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy trạng thái bác sĩ' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const doctorInfo = req.body;

    if (!doctorInfo.fullName) {
      return res.status(400).json({
        success: false,
        message: 'Tên bác sĩ là bắt buộc',
        example: {
          fullName: 'BS. Nguyễn Văn A',
          phone: '0123456789',
          gender: 'male',
          address: 'TP.HCM',
          bio: 'Mô tả về bác sĩ',
          experience: 5,
          rating: 4.5,
          specialization: 'Khoa chuyên môn',
          education: 'Trình độ học vấn',
          certificate: 'Chứng chỉ hành nghề',
        },
      });
    }

    // Service returns populated doctor, tạo credentials riêng
    const populatedDoctor = await doctorService.createDoctor(doctorInfo);
    
    // Generate email/password như trong service để consistent
    const normalizedName = doctorInfo.fullName
      .toLowerCase()
      .replace(/bs\./g, '')
      .replace(/[^\w\s]/g, '')
      .trim()
      .split(' ')
      .join('');
    const email = `bs.${normalizedName}@genderhealthcare.com`;
    const defaultPassword = 'doctor123';
    
    res.status(201).json({
      success: true,
      message: 'Tạo bác sĩ thành công',
      data: populatedDoctor,
      userCredentials: {
        email,
        defaultPassword,
      },
    });
  } catch (error: any) {
    if (error.message.includes('Email') && error.message.includes('đã tồn tại')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes('bắt buộc')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    console.error('Error creating doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo bác sĩ',
    });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu cập nhật không được để trống',
        allowedFields: [
          'fullName',
          'phone',
          'gender',
          'address',
          'bio',
          'experience',
          'rating',
          'specialization',
          'education',
          'certificate',
        ],
      });
    }

    const updated = await doctorService.updateDoctor(req.params.id, req.body);
    if (!updated)
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ',
      });

    res.json({
      success: true,
      message: 'Cập nhật thông tin bác sĩ thành công',
      data: updated,
    });
  } catch (error: any) {
    if (error.message && error.message.includes('ID bác sĩ không hợp lệ')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message && error.message.includes('Không tìm thấy bác sĩ')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (
      error.message &&
      (error.message.includes('kinh nghiệm') ||
        error.message.includes('Rating') ||
        error.message.includes('Giới tính'))
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Error updating doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật bác sĩ',
    });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Service hiện tại chỉ support simple delete
    
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ',
        received: id,
      });
    }

    const deletedDoctor = await doctorService.deleteDoctor(id);
    
    if (!deletedDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ để xóa',
      });
    }

    res.json({
      success: true,
      message: 'Xóa bác sĩ thành công',
      data: deletedDoctor,
    });
  } catch (error: any) {
    console.error('Delete doctor error:', error);

    if (error.message && error.message.includes('ID bác sĩ không hợp lệ')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message && error.message.includes('Không tìm thấy bác sĩ')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa bác sĩ',
      error: error.message,
    });
  }
};

// MANAGER ONLY
export const updateDoctorStatus = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.id;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive phải là boolean (true/false)',
        example: { isActive: true },
      });
    }

    const result = await doctorService.updateDoctorActiveStatus(doctorId, isActive);

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in updateDoctorStatus:', error);
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ 
        success: false,
        message: error.message 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái bác sĩ' 
    });
  }
};

/**
 * Upload doctor image lên cloudinary với enhanced validation
 * Enhanced cho medical professional photos
 */
export const uploadDoctorImage = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng chọn file ảnh' 
      });
    }

    // ✅ Enhanced validation cho medical photos - now includes WebP
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Xóa file tạm không hợp lệ
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Chỉ chấp nhận file ảnh định dạng JPG, JPEG, PNG, WebP'
      });
    }

    // Kiểm tra kích thước file (max 5MB cho medical photos)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Kích thước file không được vượt quá 5MB'
      });
    }

    // Upload lên cloudinary với folder riêng cho doctors
    const imageUrl = await uploadToCloudinary(req.file.path, 'doctors');
    
    // Xóa file tạm sau khi upload thành công
    fs.unlinkSync(req.file.path);

    return res.status(200).json({ 
      success: true,
      message: 'Upload ảnh bác sĩ thành công',
      data: {
        imageUrl,
        uploadedAt: new Date()
      }
    });

  } catch (error: any) {
    // Xóa file tạm nếu có lỗi
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }

    console.error('Doctor image upload error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi upload ảnh bác sĩ', 
      error: error.message 
    });
  }
};
