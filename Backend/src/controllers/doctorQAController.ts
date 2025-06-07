import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
import mongoose from 'mongoose';
import * as doctorQAService from '../services/doctorQAService';

// Validate ObjectId helper
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// GET /api/doctor-qa/least-booked-doctor - Tìm bác sĩ có ít slot booked nhất (STAFF ONLY)
export const getLeastBookedDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const leastBookedDoctorId = await doctorQAService.findLeastBookedDoctor();
    
    res.status(200).json({
      message: 'Tìm bác sĩ có ít lịch đặt nhất thành công',
      data: {
        doctorId: leastBookedDoctorId
      }
    });

  } catch (error: any) {
    console.error('Error getting least booked doctor:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi tìm bác sĩ' 
    });
  }
};

// POST /api/doctor-qa - Tạo yêu cầu tư vấn mới (USER)
export const createDoctorQA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { doctorId, fullName, phone, question, notes } = req.body;
    const userId = req.user?._id;  // Từ middleware auth

    if (!fullName || !phone || !question) {
      res.status(400).json({ 
        message: 'Vui lòng cung cấp đầy đủ: fullName, phone, question' 
      });
      return;
    }

    // Validate doctorId nếu có
    if (doctorId && !isValidObjectId(doctorId)) {
      res.status(400).json({ 
        message: 'Doctor ID không hợp lệ' 
      });
      return;
    }

    const newQA = await doctorQAService.createDoctorQA({
      doctorId,
      userId,
      fullName,
      phone,
      question,
      notes
    });

    res.status(201).json({
      message: 'Tạo yêu cầu tư vấn thành công! Vui lòng thanh toán để hoàn tất.',
      data: newQA
    });

  } catch (error: any) {
    console.error('Error creating DoctorQA:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi tạo yêu cầu tư vấn' 
    });
  }
};

// GET /api/doctor-qa - Lấy tất cả yêu cầu tư vấn (STAFF ONLY)
export const getAllDoctorQAs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const qas = await doctorQAService.getAllDoctorQAs(filter);
    
    res.status(200).json({
      message: `Lấy danh sách yêu cầu tư vấn thành công (${qas.length} yêu cầu)`,
      data: qas,
      summary: {
        total: qas.length,
        filter: filter
      }
    });

  } catch (error: any) {
    console.error('Error getting all DoctorQAs:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi lấy danh sách yêu cầu tư vấn' 
    });
  }
};

// GET /api/doctor-qa/:id - Lấy yêu cầu tư vấn theo ID (USER/STAFF/DOCTOR)
export const getDoctorQAById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }
    
    const qa = await doctorQAService.getDoctorQAById(id);
    
    res.status(200).json({
      message: 'Lấy thông tin yêu cầu tư vấn thành công',
      data: qa
    });

  } catch (error: any) {
    console.error('Error getting DoctorQA by ID:', error);
    res.status(404).json({ 
      message: error.message || 'Không tìm thấy yêu cầu tư vấn' 
    });
  }
};

// GET /api/doctor-qa/my-requests - Lấy yêu cầu tư vấn của user đang đăng nhập (USER)
export const getMyDoctorQAs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('🔍 [DEBUG] User object:', req.user);
    
    const userId = req.user?._id;
    console.log('🔍 [DEBUG] Extracted userId:', userId);
    
    if (!userId) {
      res.status(401).json({ 
        message: 'Không tìm thấy thông tin user từ token' 
      });
      return;
    }
    
    const qas = await doctorQAService.getDoctorQAByUserId(userId);
    
    res.status(200).json({
      message: `Lấy danh sách yêu cầu tư vấn của bạn thành công (${qas.length} yêu cầu)`,
      data: qas
    });

  } catch (error: any) {
    console.error('Error getting my DoctorQAs:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi lấy yêu cầu tư vấn' 
    });
  }
};

// GET /api/doctor-qa/doctor/:doctorId - Lấy yêu cầu tư vấn của bác sĩ cụ thể (DOCTOR/STAFF)
export const getDoctorQAByDoctorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;
    
    if (!isValidObjectId(doctorId)) {
      res.status(400).json({ 
        message: 'Doctor ID không hợp lệ' 
      });
      return;
    }
    
    const qas = await doctorQAService.getDoctorQAByDoctorId(doctorId);
    
    res.status(200).json({
      message: `Lấy danh sách yêu cầu tư vấn của bác sĩ thành công (${qas.length} yêu cầu)`,
      data: qas
    });

  } catch (error: any) {
    console.error('Error getting DoctorQAs by doctorId:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi lấy yêu cầu tư vấn của bác sĩ' 
    });
  }
};

// PUT /api/doctor-qa/:id/payment - Cập nhật trạng thái thanh toán (PAYMENT GATEWAY CALLBACK)
export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { paymentSuccess } = req.body;

    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    if (typeof paymentSuccess !== 'boolean') {
      res.status(400).json({ 
        message: 'Vui lòng cung cấp paymentSuccess (true/false)' 
      });
      return;
    }

    const updatedQA = await doctorQAService.updatePaymentStatus(id, paymentSuccess);
    
    const message = paymentSuccess 
      ? 'Thanh toán thành công! Yêu cầu tư vấn đã được gửi đến bác sĩ.'
      : 'Thanh toán thất bại. Yêu cầu tư vấn đã bị hủy.';

    res.status(200).json({
      message,
      data: updatedQA
    });

  } catch (error: any) {
    console.error('Error updating payment status:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi cập nhật trạng thái thanh toán' 
    });
  }
};

// PUT /api/doctor-qa/:id/confirm - Bác sĩ confirm/reject yêu cầu tư vấn (DOCTOR)
export const doctorConfirmQA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    if (!action || !['confirm', 'reject'].includes(action)) {
      res.status(400).json({ 
        message: 'Vui lòng cung cấp action: confirm hoặc reject' 
      });
      return;
    }

    const updatedQA = await doctorQAService.doctorConfirmQA(id, action);
    
    const message = action === 'confirm' 
      ? 'Bác sĩ đã xác nhận nhận tư vấn. Staff sẽ sắp xếp lịch cụ thể.'
      : 'Bác sĩ đã từ chối yêu cầu tư vấn.';

    res.status(200).json({
      message,
      data: updatedQA
    });

  } catch (error: any) {
    console.error('Error doctor confirming QA:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi xác nhận yêu cầu tư vấn' 
    });
  }
};

// PUT /api/doctor-qa/:id/schedule - Staff xếp lịch tự động (STAFF ONLY)
export const scheduleQA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    // Không cần body nữa - tự động tìm slot gần nhất
    const result = await doctorQAService.scheduleQA(id);

    res.status(200).json({
      message: 'Xếp lịch tư vấn tự động thành công!',
      data: result.qa,
      autoScheduleInfo: result.autoBookedInfo
    });

  } catch (error: any) {
    console.error('Error auto-scheduling QA:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi xếp lịch tự động' 
    });
  }
};

// PUT /api/doctor-qa/:id/status - Cập nhật trạng thái tổng quát (STAFF/DOCTOR)
export const updateQAStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, doctorNotes } = req.body;

    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    if (!status) {
      res.status(400).json({ 
        message: 'Vui lòng cung cấp status mới' 
      });
      return;
    }

    const validStatuses = ["pending_payment", "paid", "doctor_confirmed", "scheduled", "consulting", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ 
        message: `Status không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}` 
      });
      return;
    }

    const updatedQA = await doctorQAService.updateQAStatus(id, status, doctorNotes);

    res.status(200).json({
      message: 'Cập nhật trạng thái yêu cầu tư vấn thành công',
      data: updatedQA
    });

  } catch (error: any) {
    console.error('Error updating QA status:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi cập nhật trạng thái' 
    });
  }
};

// DELETE /api/doctor-qa/:id - Xóa yêu cầu tư vấn (STAFF ONLY)
export const deleteDoctorQA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }
    
    const deletedQA = await doctorQAService.deleteDoctorQA(id);

    res.status(200).json({
      message: 'Xóa yêu cầu tư vấn thành công',
      data: deletedQA
    });

  } catch (error: any) {
    console.error('Error deleting DoctorQA:', error);
    res.status(404).json({ 
      message: error.message || 'Không tìm thấy yêu cầu tư vấn để xóa' 
    });
  }
}; 