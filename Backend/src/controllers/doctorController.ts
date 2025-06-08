import { Request, Response } from 'express';
import * as doctorService from '../services/doctorService';

export const getAll = async (req: Request, res: Response) => {
  try {
    const doctors = await doctorService.getAllDoctors();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách bác sĩ' });
  }
};

// NEW: Lấy tất cả doctors với feedback và status details
export const getAllWithDetails = async (req: Request, res: Response) => {
  try {
    const doctors = await doctorService.getAllDoctorsWithDetails();
    res.json({
      message: 'Lấy danh sách bác sĩ thành công (bao gồm đánh giá và trạng thái)',
      data: doctors,
      total: doctors.length
    });
  } catch (error) {
    console.error('Error in getAllWithDetails:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách bác sĩ chi tiết' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin bác sĩ' });
  }
};

// NEW: Lấy doctor by ID với feedback và status details  
export const getByIdWithDetails = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.id;
    const doctor = await doctorService.getDoctorByIdWithDetails(doctorId);
    
    res.json({
      message: 'Lấy thông tin bác sĩ thành công (bao gồm đánh giá và trạng thái)',
      data: doctor
    });
  } catch (error: any) {
    console.error('Error in getByIdWithDetails:', error);
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin bác sĩ chi tiết' });
  }
};

// NEW: Lấy chỉ feedback của doctor
export const getDoctorFeedbacks = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.id;
    const feedbacks = await doctorService.getDoctorFeedbacks(doctorId);
    
    res.json({
      message: 'Lấy đánh giá bác sĩ thành công',
      data: feedbacks
    });
  } catch (error) {
    console.error('Error in getDoctorFeedbacks:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá bác sĩ' });
  }
};

// NEW: Lấy chỉ trạng thái active của doctor
export const getDoctorStatus = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.id;
    const status = await doctorService.getDoctorActiveStatus(doctorId);
    
    res.json({
      message: 'Lấy trạng thái bác sĩ thành công',
      data: status
    });
  } catch (error) {
    console.error('Error in getDoctorStatus:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy trạng thái bác sĩ' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    // Validate request body structure - chỉ cần doctorInfo
    const doctorInfo = req.body;
    
    // Validate required fields
    if (!doctorInfo.fullName) {
      return res.status(400).json({ 
        message: 'Tên bác sĩ (fullName) là bắt buộc',
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

    const doctor = await doctorService.createDoctor(doctorInfo);
    res.status(201).json(doctor);
  } catch (error: any) {
    // Bắt các loại lỗi khác nhau
    if (error.message.includes('Email') && error.message.includes('đã tồn tại')) {
      return res.status(409).json({ message: error.message });
    }
    if (error.message.includes('bắt buộc')) {
      return res.status(400).json({ message: error.message });
    }
    // Lỗi khác
    console.error('Error creating doctor:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo bác sĩ' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const updated = await doctorService.updateDoctor(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
    res.json(updated);
  } catch (error: any) {
    // Bắt lỗi validation ObjectId từ service
    if (error.message && error.message.includes('ObjectId hợp lệ')) {
      return res.status(400).json({ message: error.message });
    }
    // Lỗi khác
    res.status(500).json({ message: 'Lỗi server khi cập nhật bác sĩ' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await doctorService.deleteDoctor(req.params.id);
    res.json({ message: 'Xóa bác sĩ thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa bác sĩ' });
  }
};

// NEW: Update trạng thái active của doctor (MANAGER ONLY)
export const updateDoctorStatus = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.id;
    const { isActive } = req.body;

    // Validate input
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ 
        message: 'isActive phải là boolean (true/false)',
        example: { isActive: true }
      });
    }

    const result = await doctorService.updateDoctorActiveStatus(doctorId, isActive);
    
    res.json({
      message: result.message,
      data: result
    });
  } catch (error: any) {
    console.error('Error in updateDoctorStatus:', error);
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái bác sĩ' });
  }
};
