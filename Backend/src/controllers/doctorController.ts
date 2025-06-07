import { Request, Response } from 'express';
import * as doctorService from '../services/doctorService';

export const getAll = async (req: Request, res: Response) => {
  try {
    const result = await doctorService.getAllDoctors();
    res.json(result);
  } catch (error) {
    console.error('Error getting doctors:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi lấy danh sách bác sĩ' 
    });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    if (!doctor) return res.status(404).json({ 
      success: false,
      message: 'Không tìm thấy bác sĩ' 
    });
    res.json(doctor);
  } catch (error: any) {
    // Xử lý lỗi validation ObjectId
    if (error.message && error.message.includes('ID bác sĩ không hợp lệ')) {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
    
    console.error('Error getting doctor by ID:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi lấy thông tin bác sĩ' 
    });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    // Validate request body structure - chỉ cần doctorInfo
    const doctorInfo = req.body;
    
    // Validate required fields
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
          certificate: 'Chứng chỉ hành nghề'
        }
      });
    }

    const result = await doctorService.createDoctor(doctorInfo);
    res.status(201).json({
      data: result.doctor,
      userCredentials: {
        email: result.email,
        defaultPassword: result.defaultPassword
      }
    });
  } catch (error: any) {
    // Bắt các loại lỗi khác nhau
    if (error.message.includes('Email') && error.message.includes('đã tồn tại')) {
      return res.status(409).json({ 
        success: false,
        message: error.message 
      });
    }
    if (error.message.includes('bắt buộc')) {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
    // Lỗi khác
    console.error('Error creating doctor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi tạo bác sĩ' 
    });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    // Kiểm tra body không rỗng
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Dữ liệu cập nhật không được để trống',
        allowedFields: ['fullName', 'phone', 'gender', 'address', 'bio', 'experience', 'rating', 'specialization', 'education', 'certificate']
      });
    }

    const updated = await doctorService.updateDoctor(req.params.id, req.body);
    if (!updated) return res.status(404).json({ 
      success: false,
      message: 'Không tìm thấy bác sĩ' 
    });
    
    res.json({
      message: 'Cập nhật thông tin bác sĩ thành công',
      data: updated
    });
  } catch (error: any) {
    // Bắt các loại lỗi validation cụ thể
    if (error.message && error.message.includes('ID bác sĩ không hợp lệ')) {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
    if (error.message && error.message.includes('Không tìm thấy bác sĩ')) {
      return res.status(404).json({ 
        success: false,
        message: error.message 
      });
    }
    if (error.message && (error.message.includes('kinh nghiệm') || error.message.includes('Rating') || error.message.includes('Giới tính'))) {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
    
    // Lỗi khác
    console.error('Error updating doctor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi cập nhật bác sĩ' 
    });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // Option để force delete bỏ qua validation
    const adminId = (req as any).user.userId; // ID của admin thực hiện xóa

    // Validate ObjectId format trước
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID bác sĩ không hợp lệ',
        received: id 
      });
    }

    const result = await doctorService.deleteDoctor(id, adminId, force === 'true');
    
    res.json({
      success: true,
      message: result.message,
      data: {
        doctor: result.doctor,
        userDeactivated: result.userDeactivated
      }
    });
  } catch (error: any) {
    console.error('Delete doctor error:', error);

    // Handle specific business logic errors
    if (error.message && error.message.includes('ID bác sĩ không hợp lệ')) {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
    
    if (error.message && error.message.includes('Không tìm thấy bác sĩ')) {
      return res.status(404).json({ 
        success: false,
        message: error.message 
      });
    }

    if (error.message && (error.message.includes('lịch hẹn đang hoạt động') || 
        error.message.includes('câu hỏi đang xử lý'))) {
      return res.status(409).json({ 
        success: false,
        message: error.message,
        suggestion: 'Sử dụng force=true để bỏ qua validation (không khuyến khích)'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi xóa bác sĩ', 
      error: error.message 
    });
  }
};