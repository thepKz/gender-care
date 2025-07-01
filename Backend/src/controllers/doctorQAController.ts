import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
import mongoose from 'mongoose';
import * as doctorQAService from '../services/doctorQAService';
import * as meetingService from '../services/meetingService';
import { releaseSlot } from '../services/doctorScheduleService';
import { DoctorQA } from '../models';

// Validate ObjectId helper
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// GET /api/doctor-qa/best-assignment - Tìm assignment tốt nhất cho slot gần nhất (STAFF ONLY)
export const getBestAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const bestAssignment = await doctorQAService.findBestDoctorForNextSlot();
    
    res.status(200).json({
      message: 'Tìm assignment tốt nhất thành công',
      data: bestAssignment
    });

  } catch (error: any) {
    console.error('Error getting best assignment:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi tìm assignment' 
    });
  }
};

// Legacy endpoint để backward compatibility
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

// POST /api/doctor-qa - Tạo yêu cầu tư vấn mới (USER) - ✏️ UPDATED: No auto-assign
export const createDoctorQA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, phone, age, gender, question, notes } = req.body;
    const userId = req.user?._id;  // Từ middleware auth

    // 🔧 Enhanced validation
    if (!userId) {
      res.status(401).json({ 
        message: 'Không tìm thấy thông tin user từ token. Vui lòng đăng nhập lại.' 
      });
      return;
    }

    if (!fullName?.trim() || !phone?.trim() || !question?.trim()) {
      res.status(400).json({ 
        message: 'Vui lòng cung cấp đầy đủ: fullName, phone, question' 
      });
      return;
    }

    // ➕ NEW: Validate age and gender
    if (!age || age < 1 || age > 120) {
      res.status(400).json({ 
        message: 'Tuổi phải từ 1 đến 120' 
      });
      return;
    }

    if (!gender || !['male', 'female'].includes(gender)) {
      res.status(400).json({ 
        message: 'Giới tính phải là "male" hoặc "female"' 
      });
      return;
    }

    console.log('🚀 [CREATE-QA-CONTROLLER] Starting QA creation...', {
      userId,
      fullName: fullName?.trim(),
      age,
      gender
    });

    // 🎯 Call service để tạo QA cơ bản (no auto-assign)
    const newQA = await doctorQAService.createDoctorQA({
      userId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      age: parseInt(age),
      gender,
      question: question.trim(),
      notes: notes?.trim()
    });

    // 🎉 Success response
    if (!newQA) {
      throw new Error('Không thể tạo yêu cầu tư vấn. Vui lòng thử lại.');
    }

    res.status(201).json({
      message: 'Tạo yêu cầu tư vấn thành công! Hãy chọn lịch hẹn để tiếp tục.',
      data: newQA,
      nextStep: 'SLOT_SELECTION'
    });

  } catch (error: any) {
    console.error('❌ [ERROR] Creating DoctorQA failed:', error);
    
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi tạo yêu cầu tư vấn',
      error: 'CREATE_QA_ERROR'
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

// GET /api/doctor-qa/my - Lấy yêu cầu tư vấn của bác sĩ hiện tại hoặc tất cả consultations cho staff
export const getMyDoctorQAAsDoctor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        message: 'Không tìm thấy thông tin user từ token' 
      });
      return;
    }

    // Kiểm tra user có phải doctor hoặc staff không
    if (!['doctor', 'staff'].includes(req.user?.role || '')) {
      res.status(403).json({ 
        message: 'Chỉ bác sĩ hoặc nhân viên mới có thể truy cập endpoint này' 
      });
      return;
    }

    // Nếu là staff, trả về tất cả consultations
    if (req.user?.role === 'staff') {
      try {
        // Lấy tất cả consultations cho staff (không cần filter theo doctor)
        const allQAs = await doctorQAService.getAllDoctorQAs({});
        
        res.status(200).json({
          message: `Lấy danh sách tất cả yêu cầu tư vấn thành công (${allQAs.length} yêu cầu)`,
          data: allQAs
        });
        return;
      } catch (error: any) {
        console.error('Error getting all consultations for staff:', error);
        res.status(500).json({ 
          message: error.message || 'Lỗi server khi lấy danh sách tư vấn cho staff',
          data: []
        });
        return;
      }
    }

    // Logic cho Doctor: Import Doctor model dynamically để tránh circular dependency
    const { Doctor } = await import('../models');
    
    // Tìm doctor record dựa trên userId từ token
    const doctor = await Doctor.findOne({ userId: userId });
    
    if (!doctor) {
      // Nếu chưa có doctor record, trả về empty list với format consistent
      res.status(200).json({
        message: 'Chưa có thông tin bác sĩ trong hệ thống. Vui lòng liên hệ admin để thiết lập hồ sơ.',
        data: []
      });
      return;
    }
    
    // Lấy yêu cầu tư vấn của bác sĩ này
    const qas = await doctorQAService.getDoctorQAByDoctorId(doctor._id.toString());
    
    // Trả về format consistent với getAllDoctorQAs - chỉ data array
    res.status(200).json({
      message: `Lấy danh sách yêu cầu tư vấn của bạn thành công (${qas.length} yêu cầu)`,
      data: qas
    });

  } catch (error: any) {
    console.error('Error getting my DoctorQAs as doctor:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi lấy yêu cầu tư vấn của bác sĩ',
      data: []
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
    
    if (!updatedQA) {
      res.status(500).json({ 
        message: 'Lỗi khi cập nhật trạng thái thanh toán' 
      });
      return;
    }

    let message;
    let extraInfo = {};
    
    if (paymentSuccess) {
      // Check if smart auto-scheduling worked
      if (updatedQA.status === 'scheduled') {
        message = '🎉 Thanh toán thành công! Đã tự động tìm slot gần nhất và phân công bác sĩ phù hợp. Link tư vấn sẽ được gửi trước 30 phút.';
        extraInfo = {
          smartScheduled: true,
          doctorAssigned: !!updatedQA.doctorId,
          doctorName: (updatedQA.doctorId as any)?.userId?.fullName || 'Bác sĩ',
          appointmentDate: updatedQA.appointmentDate,
          appointmentSlot: updatedQA.appointmentSlot,
          nextStep: 'Chờ link Google Meet được gửi trước giờ khám',
          note: 'Hệ thống đã tự động chọn slot sớm nhất và bác sĩ ít bận nhất'
        };
      } else if (updatedQA.status === 'pending_payment') {
        message = '⚠️ Thanh toán đang được xử lý. Vui lòng chờ xác nhận.';
        extraInfo = {
          smartScheduled: false,
          doctorAssigned: !!updatedQA.doctorId,
          doctorName: (updatedQA.doctorId as any)?.userId?.fullName || 'Bác sĩ',
          needManualSchedule: false,
          nextStep: 'Hệ thống đang xử lý thanh toán'
        };
      } else {
        message = '✅ Thanh toán thành công! Yêu cầu tư vấn đã được tiếp nhận.';
      }
    } else {
      message = '❌ Thanh toán thất bại. Yêu cầu tư vấn đã bị hủy.';
    }

    res.status(200).json({
      message,
      data: updatedQA,
      ...extraInfo
    });

  } catch (error: any) {
    console.error('Error updating payment status:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi cập nhật trạng thái thanh toán' 
    });
  }
};

// PUT /api/doctor-qa/:id/confirm-consultation - Xác nhận cuộc tư vấn đã thanh toán (chuyển từ paid sang confirmed) (DOCTOR/STAFF)
export const confirmConsultation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    const qa = await doctorQAService.getDoctorQAById(id);

    // Chỉ cho phép xác nhận nếu trạng thái hiện tại là scheduled
    if (qa.status !== 'scheduled') {
      res.status(400).json({ 
        message: 'Chỉ có thể xác nhận cuộc tư vấn đã được lên lịch' 
      });
      return;
    }

    const updatedQA = await doctorQAService.updateQAStatus(id, 'confirmed');

    res.status(200).json({
      message: 'Xác nhận cuộc tư vấn thành công',
      data: updatedQA
    });

  } catch (error: any) {
    console.error('Error confirming consultation:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi xác nhận cuộc tư vấn' 
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
// ⚠️ DEPRECATED ENDPOINT - Không còn cần thiết vì auto assignment được thực hiện khi tạo QA mới.
export const scheduleQA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    // Trả về error vì function đã deprecated
    res.status(400).json({
      message: '⚠️ Endpoint này đã deprecated. Lịch hẹn được tự động tạo khi tạo QA mới.',
      deprecated: true,
      suggestion: 'Sử dụng POST /api/doctor-qa để tạo QA với auto assignment'
    });

  } catch (error: any) {
    console.error('Error in deprecated scheduleQA:', error);
    res.status(400).json({ 
      message: error.message || 'Endpoint đã deprecated' 
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

    const validStatuses = ["pending_payment", "scheduled", "consulting", "completed", "cancelled"];
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

// =============== MEETING INTEGRATION APIs ===============

// GET /api/doctor-qa/:id/meeting - Lấy meeting info của QA (USER/DOCTOR/STAFF)
export const getQAMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    const meeting = await meetingService.getMeetingByQaId(id);

    res.status(200).json({
      message: 'Lấy thông tin meeting thành công',
      data: {
        meetLink: meeting.meetingLink,
        provider: meeting.provider,
        scheduledTime: meeting.scheduledTime,
        actualStartTime: meeting.actualStartTime,
        status: meeting.status,
        participantCount: meeting.participantCount,
        maxParticipants: meeting.maxParticipants,
        notes: meeting.notes,
        googleEventId: meeting.googleEventId
      }
    });

  } catch (error: any) {
    console.error('Error getting QA meeting:', error);
    res.status(404).json({ 
      message: error.message || 'Không tìm thấy meeting cho yêu cầu tư vấn này' 
    });
  }
};

// POST /api/doctor-qa/:id/join-meeting - Join meeting (USER/DOCTOR)
export const joinQAMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { participantType } = req.body;
    const currentUserId = req.user?._id;

    if (!isValidObjectId(id) || !currentUserId) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ hoặc user chưa đăng nhập' 
      });
      return;
    }

    if (!participantType || !['doctor', 'user'].includes(participantType)) {
      res.status(400).json({ 
        message: 'Vui lòng cung cấp participantType: doctor hoặc user' 
      });
      return;
    }

    const updatedMeeting = await meetingService.participantJoinMeeting(
      id, 
      currentUserId.toString(), 
      participantType
    );

    res.status(200).json({
      message: `Bạn đã tham gia meeting thành công với vai trò ${participantType}`,
      data: {
        meetingStatus: updatedMeeting.status,
        actualStartTime: updatedMeeting.actualStartTime,
        participantCount: updatedMeeting.participantCount
      }
    });

  } catch (error: any) {
    console.error('Error joining QA meeting:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi tham gia meeting' 
    });
  }
};

// PUT /api/doctor-qa/:id/complete-meeting - Hoàn thành meeting và QA (DOCTOR only)
export const completeQAMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { doctorNotes } = req.body;

    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    const completedMeeting = await meetingService.completeMeeting(id, doctorNotes);

    res.status(200).json({
      message: 'Hoàn thành tư vấn và meeting thành công!',
      data: {
        meetingStatus: completedMeeting.status,
        notes: completedMeeting.notes,
        participantCount: completedMeeting.participantCount
      }
    });

  } catch (error: any) {
    console.error('Error completing QA meeting:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi hoàn thành meeting' 
    });
  }
};

// PUT /api/doctor-qa/:id/manual-schedule - Manually trigger auto-scheduling cho QA đã paid (STAFF ONLY)
export const manualTriggerScheduling = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    // Gọi lại logic updatePaymentStatus với paymentSuccess=true
    const updatedQA = await doctorQAService.updatePaymentStatus(id, true);
    
    if (!updatedQA) {
      res.status(500).json({ 
        message: 'Lỗi khi trigger auto-scheduling' 
      });
      return;
    }

    let message;
    let extraInfo = {};
    
    // Check if smart auto-scheduling worked
    if (updatedQA.status === 'scheduled') {
      message = '🎉 Auto-scheduling thành công! Đã tự động tìm slot gần nhất và phân công bác sĩ.';
      extraInfo = {
        smartScheduled: true,
        doctorAssigned: !!updatedQA.doctorId,
        doctorName: (updatedQA.doctorId as any)?.userId?.fullName || 'Bác sĩ',
        appointmentDate: updatedQA.appointmentDate,
        appointmentSlot: updatedQA.appointmentSlot,
        nextStep: 'Đã book slot thành công',
        note: 'Hệ thống đã tự động chọn slot sớm nhất và bác sĩ ít bận nhất'
      };
            } else if (updatedQA.status === 'pending_payment') {
      message = '⚠️ Chưa hoàn tất auto-scheduling. QA vẫn đang chờ xử lý.';
      extraInfo = {
        smartScheduled: false,
        doctorAssigned: !!updatedQA.doctorId,
        doctorName: (updatedQA.doctorId as any)?.userId?.fullName || 'Bác sĩ',
        needManualSchedule: true,
        nextStep: 'Gọi lại API để trigger scheduling'
      };
    } else {
      message = '✅ Đã process QA thành công.';
    }

    res.status(200).json({
      message,
      data: updatedQA,
      ...extraInfo
    });

  } catch (error: any) {
    console.error('Error manually triggering scheduling:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi trigger auto-scheduling' 
    });
  }
};

// PUT /api/doctor-qa/:id/cancel-by-doctor - Hủy cuộc tư vấn bởi bác sĩ với lý do (DOCTOR ONLY)
export const cancelConsultationByDoctor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    // Kiểm tra user có phải doctor không
    if (req.user?.role !== 'doctor') {
      res.status(403).json({ 
        message: 'Chỉ bác sĩ mới có thể hủy cuộc tư vấn' 
      });
      return;
    }

    // Kiểm tra lý do hủy
    if (!reason || reason.trim().length === 0) {
      res.status(400).json({ 
        message: 'Vui lòng nhập lý do hủy cuộc tư vấn' 
      });
      return;
    }

    const qa = await doctorQAService.getDoctorQAById(id);

    // Kiểm tra cuộc tư vấn đã bị hủy chưa
    if (qa.status === 'cancelled') {
      res.status(400).json({ 
        message: 'Cuộc tư vấn đã được hủy trước đó' 
      });
      return;
    }

    // Kiểm tra cuộc tư vấn đã hoàn thành chưa
    if (qa.status === 'completed') {
      res.status(400).json({ 
        message: 'Không thể hủy cuộc tư vấn đã hoàn thành' 
      });
      return;
    }

    // Gọi service để hủy consultation với lý do
    const updatedQA = await doctorQAService.cancelConsultationByDoctor(id, reason.trim());

    res.status(200).json({
      message: 'Hủy cuộc tư vấn thành công',
      data: updatedQA
    });

  } catch (error: any) {
    console.error('Error cancelling consultation by doctor:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi hủy cuộc tư vấn' 
    });
  }
};

// POST /api/doctor-qa/batch-process-paid - Batch process tất cả QA có status "paid" (STAFF ONLY)
export const batchProcessPaidQAs = async (req: Request, res: Response): Promise<void> => {
  try {
    // Tìm tất cả QA có status "paid" nhưng chưa scheduled
    const { DoctorQA } = await import('../models');
    
    const paidQAs = await DoctorQA.find({ 
      status: 'paid'
    }).select('_id fullName phone question');

    if (paidQAs.length === 0) {
      res.status(200).json({
        message: 'Không có QA nào cần process',
        processed: 0,
        total: 0
      });
      return;
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const qa of paidQAs) {
      try {
        console.log(`🔄 Processing QA ${qa._id} - ${qa.fullName}`);
        
        const updatedQA = await doctorQAService.updatePaymentStatus(qa._id.toString(), true);
        
        results.push({
          qaId: qa._id,
          fullName: qa.fullName,
          status: updatedQA?.status || 'unknown',
          success: true,
          scheduled: updatedQA?.status === 'scheduled',
          appointmentDate: updatedQA?.appointmentDate,
          appointmentSlot: updatedQA?.appointmentSlot
        });
        
        successCount++;
        
      } catch (error: any) {
        console.error(`❌ Error processing QA ${qa._id}:`, error.message);
        
        results.push({
          qaId: qa._id,
          fullName: qa.fullName,
          success: false,
          error: error.message
        });
        
        errorCount++;
      }
    }

    const scheduledCount = results.filter(r => r.scheduled).length;
    
    res.status(200).json({
      message: `Batch process hoàn tất: ${successCount}/${paidQAs.length} thành công, ${scheduledCount} được schedule tự động`,
      summary: {
        total: paidQAs.length,
        successful: successCount,
        errors: errorCount,
        autoScheduled: scheduledCount,
        needManualSchedule: successCount - scheduledCount
      },
      results
    });

  } catch (error: any) {
    console.error('Error batch processing paid QAs:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi batch process QAs' 
    });
  }
};

// =============== NEW: CONSULTATION MANAGEMENT APIs ===============

// GET /api/doctor-qa/live - Lấy consultation đang LIVE hiện tại (DOCTOR ONLY)
export const getLiveConsultations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;
    
    if (!userId) {
      res.status(401).json({ 
        message: 'Không tìm thấy thông tin user từ token' 
      });
      return;
    }

    let doctorId: string | undefined;
    
    // Nếu là doctor, chỉ lấy consultation của mình
    if (userRole === 'doctor') {
      const { Doctor } = await import('../models');
      const doctor = await Doctor.findOne({ userId: userId });
      
      if (!doctor) {
        res.status(200).json({
          message: 'Chưa có thông tin bác sĩ trong hệ thống',
          data: []
        });
        return;
      }
      
      doctorId = doctor._id.toString();
    }
    // Nếu là staff/admin, có thể lấy tất cả hoặc theo query
    else if (['staff', 'manager', 'admin'].includes(userRole || '')) {
      const { doctorId: queryDoctorId } = req.query;
      if (queryDoctorId && typeof queryDoctorId === 'string') {
        doctorId = queryDoctorId;
      }
    }
    // Các role khác không có quyền
    else {
      res.status(403).json({ 
        message: 'Không có quyền truy cập' 
      });
      return;
    }
    
    const liveConsultations = await doctorQAService.getLiveConsultations(doctorId);
    
    res.status(200).json({
      message: `Lấy danh sách consultation đang diễn ra thành công (${liveConsultations.length} cuộc)`,
      data: liveConsultations
    });

  } catch (error: any) {
    console.error('Error getting live consultations:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi lấy consultation đang diễn ra',
      data: []
    });
  }
};

// GET /api/doctor-qa/today - Lấy tất cả consultation HÔM NAY (DOCTOR/STAFF)
export const getTodayConsultations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;
    
    if (!userId) {
      res.status(401).json({ 
        message: 'Không tìm thấy thông tin user từ token' 
      });
      return;
    }

    let doctorId: string | undefined;
    
    // Nếu là doctor, chỉ lấy consultation của mình  
    if (userRole === 'doctor') {
      const { Doctor } = await import('../models');
      const doctor = await Doctor.findOne({ userId: userId });
      
      if (!doctor) {
        res.status(200).json({
          message: 'Chưa có thông tin bác sĩ trong hệ thống',
          data: []
        });
        return;
      }
      
      doctorId = doctor._id.toString();
    }
    // Nếu là staff/admin, có thể lấy tất cả hoặc theo query
    else if (['staff', 'manager', 'admin'].includes(userRole || '')) {
      const { doctorId: queryDoctorId } = req.query;
      if (queryDoctorId && typeof queryDoctorId === 'string') {
        doctorId = queryDoctorId;
      }
    }
    // Các role khác không có quyền
    else {
      res.status(403).json({ 
        message: 'Không có quyền truy cập' 
      });
      return;
    }
    
    const todayConsultations = await doctorQAService.getTodayConsultations(doctorId);
    
    res.status(200).json({
      message: `Lấy danh sách consultation hôm nay thành công (${todayConsultations.length} cuộc)`,
      data: todayConsultations
    });

  } catch (error: any) {
    console.error('Error getting today consultations:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi lấy consultation hôm nay',
      data: []
    });
  }
};

// =============== NEW: MEETING WORKFLOW APIs ===============

// GET /api/doctor-qa/:id/check-meeting - Kiểm tra consultation đã có Meeting record chưa (DOCTOR/STAFF)
export const checkMeetingExistence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    const result = await doctorQAService.checkMeetingExistence(id);

    res.status(200).json({
      message: 'Kiểm tra meeting thành công',
      data: result
    });

  } catch (error: any) {
    console.error('Error checking meeting existence:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi kiểm tra meeting' 
    });
  }
};

// POST /api/doctor-qa/:id/create-meeting - Tạo hồ sơ Meeting cho consultation (DOCTOR ONLY)
export const createMeetingRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    // Chỉ doctor có thể tạo meeting record
    if (userRole !== 'doctor') {
      res.status(403).json({ 
        message: 'Chỉ bác sĩ mới có thể tạo hồ sơ meeting' 
      });
      return;
    }

    const result = await doctorQAService.createMeetingRecord(id);

    res.status(201).json({
      message: 'Tạo hồ sơ meeting thành công',
      data: {
        meeting: result.meeting,
        consultation: result.updatedQA
      }
    });

  } catch (error: any) {
    console.error('Error creating meeting record:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi tạo hồ sơ meeting' 
    });
  }
};

// PUT /api/doctor-qa/:id/complete-consultation - Hoàn thành consultation và meeting (DOCTOR ONLY)
export const completeConsultationWithMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { doctorNotes } = req.body;
    const userRole = req.user?.role;

    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    // Chỉ doctor có thể hoàn thành consultation
    if (userRole !== 'doctor') {
      res.status(403).json({ 
        message: 'Chỉ bác sĩ mới có thể hoàn thành tư vấn' 
      });
      return;
    }

    const result = await doctorQAService.completeConsultationWithMeeting(id, doctorNotes);

    res.status(200).json({
      message: 'Hoàn thành tư vấn thành công',
      data: {
        consultation: result.updatedQA,
        meeting: result.updatedMeeting
      }
    });

  } catch (error: any) {
    console.error('Error completing consultation:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi hoàn thành tư vấn' 
    });
  }
};

// PUT /api/doctor-qa/:id/update-meeting - Cập nhật meeting notes và thông tin (DOCTOR ONLY)
export const updateMeetingNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes, maxParticipants, actualStartTime } = req.body;
    const userRole = req.user?.role;

    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    // Chỉ doctor có thể update meeting notes
    if (userRole !== 'doctor') {
      res.status(403).json({ 
        message: 'Chỉ bác sĩ mới có thể cập nhật thông tin meeting' 
      });
      return;
    }

    const meetingData = {
      notes,
      maxParticipants,
      actualStartTime: actualStartTime ? new Date(actualStartTime) : undefined
    };

    const updatedMeeting = await doctorQAService.updateMeetingNotes(id, meetingData);

    res.status(200).json({
      message: 'Cập nhật thông tin meeting thành công',
      data: updatedMeeting
    });

  } catch (error: any) {
    console.error('Error updating meeting notes:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi cập nhật meeting' 
    });
  }
};

// GET /api/doctor-qa/:id/meeting-details - Lấy chi tiết meeting của consultation (DOCTOR/STAFF)
export const getMeetingDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        message: 'ID yêu cầu tư vấn không hợp lệ' 
      });
      return;
    }

    const meetingDetails = await doctorQAService.getMeetingDetails(id);

    res.status(200).json({
      message: 'Lấy chi tiết meeting thành công',
      data: meetingDetails
    });

  } catch (error: any) {
    console.error('Error getting meeting details:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi lấy thông tin meeting' 
    });
  }
};

// ➕ NEW: Check slot availability
export const checkSlotAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, slotTime } = req.params;

    if (!date || !slotTime) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngày và slot thời gian'
      });
      return;
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD'
      });
      return;
    }

    const result = await doctorQAService.checkSlotAvailability(date, slotTime);

    res.status(200).json({
      success: true,
      data: result,
      message: result.available ? 'Slot khả dụng' : 'Slot không khả dụng'
    });

  } catch (error: any) {
    console.error('❌ [ERROR] Check slot availability failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi kiểm tra slot',
      error: 'CHECK_SLOT_ERROR'
    });
  }
};

// ➕ NEW: Get available slots for date
export const getAvailableSlotsForDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.params;

    if (!date) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngày'
      });
      return;
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD'
      });
      return;
    }

    // Check not past date
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (targetDate < today) {
      res.status(400).json({
        success: false,
        message: 'Không thể chọn ngày trong quá khứ'
      });
      return;
    }

    const result = await doctorQAService.getAvailableSlotsForDate(date);

    res.status(200).json({
      success: true,
      data: result,
      message: `Tìm thấy ${result.slots.filter(s => s.available).length} slot khả dụng cho ngày ${date}`
    });

  } catch (error: any) {
    console.error('❌ [ERROR] Get available slots failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách slot',
      error: 'GET_SLOTS_ERROR'
    });
  }
};

// ➕ NEW: Get doctors workload statistics
export const getDoctorsWorkloadStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await doctorQAService.getDoctorsWorkloadStatistics();

    res.status(200).json({
      success: true,
      data: stats,
      message: `Thống kê workload cho ${stats.length} bác sĩ`
    });

  } catch (error: any) {
    console.error('❌ [ERROR] Get doctors workload stats failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thống kê workload',
      error: 'GET_WORKLOAD_ERROR'
    });
  }
};

// ➕ NEW: Create QA with selected slot
export const createQAWithSelectedSlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, phone, age, gender, question, notes, selectedDate, selectedSlot } = req.body;
    const userId = req.user?._id;

    // Basic validation
    if (!userId) {
      res.status(401).json({ 
        message: 'Không tìm thấy thông tin user từ token. Vui lòng đăng nhập lại.' 
      });
      return;
    }

    if (!fullName?.trim() || !phone?.trim() || !question?.trim() || !selectedDate || !selectedSlot) {
      res.status(400).json({ 
        message: 'Vui lòng cung cấp đầy đủ thông tin bao gồm ngày và slot đã chọn' 
      });
      return;
    }

    // Age and gender validation
    if (!age || age < 1 || age > 100) {
      res.status(400).json({ 
        message: 'Tuổi phải từ 1 đến 100' 
      });
      return;
    }

    if (!gender || !['male', 'female'].includes(gender)) {
      res.status(400).json({ 
        message: 'Giới tính phải là "male" hoặc "female"' 
      });
      return;
    }

    console.log('🎯 [CREATE-QA-WITH-SLOT] Starting assignment...', {
      userId,
      selectedDate,
      selectedSlot
    });

    // Call service to assign doctor to selected slot
    const result = await doctorQAService.assignDoctorToSelectedSlot({
      userId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      age: parseInt(age),
      gender,
      question: question.trim(),
      notes: notes?.trim()
    }, selectedDate, selectedSlot);

    res.status(201).json({
      success: true,
      data: {
        qaId: result.qa._id,
        assignedDoctor: result.assignedDoctor,
        appointmentDetails: {
          date: selectedDate,
          slot: selectedSlot,
          status: result.qa.status
        },
        serviceInfo: {
          serviceName: result.service.serviceName,
          price: result.service.price
        },
        consultationInfo: result.qa
      },
      message: 'Đặt lịch tư vấn thành công! Vui lòng thanh toán để hoàn tất.'
    });

  } catch (error: any) {
    console.error('❌ [ERROR] Create QA with selected slot failed:', error);
    
    if (error.message.includes('Không có bác sĩ nào khả dụng')) {
      res.status(409).json({
        success: false,
        message: 'Slot đã chọn không còn khả dụng. Vui lòng chọn slot khác.',
        error: 'SLOT_NOT_AVAILABLE'
      });
    } else if (error.message.includes('Không thể phân công bác sĩ')) {
      res.status(409).json({
        success: false,
        message: 'Không thể phân công bác sĩ cho slot này. Vui lòng thử lại.',
        error: 'ASSIGNMENT_FAILED'
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi đặt lịch tư vấn',
        error: 'CREATE_WITH_SLOT_ERROR'
      });
    }
  }
};

// ➕ NEW: Cancel consultation by user (release slot)
export const cancelConsultationByUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: qaId } = req.params;
    const userId = req.user?._id;
    const { reason } = req.body;

    // Basic validation
    if (!userId) {
      res.status(401).json({ 
        message: 'Không tìm thấy thông tin user từ token. Vui lòng đăng nhập lại.' 
      });
      return;
    }

    if (!qaId) {
      res.status(400).json({ 
        message: 'ID tư vấn không hợp lệ' 
      });
      return;
    }

    console.log('🚫 [CANCEL-CONSULTATION] Starting cancellation...', {
      qaId,
      userId,
      reason: reason || 'User cancelled'
    });

    // Tìm consultation
    const consultation = await DoctorQA.findById(qaId);
    if (!consultation) {
      res.status(404).json({
        message: 'Không tìm thấy yêu cầu tư vấn'
      });
      return;
    }

    // Kiểm tra quyền sở hữu
    if (consultation.userId.toString() !== userId.toString()) {
      res.status(403).json({
        message: 'Bạn không có quyền hủy yêu cầu tư vấn này'
      });
      return;
    }

    // Kiểm tra trạng thái có thể hủy
    if (!['pending_payment', 'scheduled'].includes(consultation.status)) {
      res.status(400).json({
        message: 'Không thể hủy tư vấn ở trạng thái này'
      });
      return;
    }

    // Release slot nếu có
    let slotReleased = false;
    if (consultation.slotId) {
      try {
        slotReleased = await releaseSlot(consultation.slotId.toString());
        console.log(`🔓 [CANCEL-CONSULTATION] Slot release result: ${slotReleased}`);
      } catch (error: any) {
        console.error('❌ [CANCEL-CONSULTATION] Error releasing slot:', error);
        // Không fail toàn bộ operation vì slot release không critical
      }
    }

    // Update consultation status
    const updatedConsultation = await DoctorQA.findByIdAndUpdate(
      qaId,
      { 
        status: 'cancelled',
        doctorNotes: reason ? `Hủy bởi user: ${reason}` : 'Hủy bởi user'
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Hủy lịch tư vấn thành công',
      data: {
        consultationId: qaId,
        status: 'cancelled',
        slotReleased,
        consultation: updatedConsultation
      }
    });

  } catch (error: any) {
    console.error('❌ [CANCEL-CONSULTATION] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi hủy lịch tư vấn'
    });
  }
};