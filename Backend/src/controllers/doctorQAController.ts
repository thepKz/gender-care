import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
import mongoose from 'mongoose';
import * as doctorQAService from '../services/doctorQAService';
import * as meetingService from '../services/meetingService';

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

// GET /api/doctor-qa/my - Lấy yêu cầu tư vấn của bác sĩ hiện tại (DOCTOR ONLY)
export const getMyDoctorQAAsDoctor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        message: 'Không tìm thấy thông tin user từ token' 
      });
      return;
    }

    // Kiểm tra user có phải doctor không
    if (req.user?.role !== 'doctor') {
      res.status(403).json({ 
        message: 'Chỉ bác sĩ mới có thể truy cập endpoint này' 
      });
      return;
    }

    // Import Doctor model dynamically để tránh circular dependency
    const { Doctor } = await import('../models');
    
    // Tìm doctor record dựa trên userId từ token
    const doctor = await Doctor.findOne({ userId: userId });
    
    if (!doctor) {
      // Nếu chưa có doctor record, trả về empty list thay vì error
      res.status(200).json({
        success: true,
        message: 'Chưa có thông tin bác sĩ trong hệ thống. Vui lòng liên hệ admin để thiết lập hồ sơ.',
        data: {
          consultations: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 0,
            pages: 0
          }
        }
      });
      return;
    }
    
    // Lấy yêu cầu tư vấn của bác sĩ này
    const qas = await doctorQAService.getDoctorQAByDoctorId(doctor._id.toString());
    
    res.status(200).json({
      success: true,
      message: `Lấy danh sách yêu cầu tư vấn của bạn thành công (${qas.length} yêu cầu)`,
      data: {
        consultations: qas,
        pagination: {
          total: qas.length,
          page: 1,
          limit: qas.length,
          pages: 1
        }
      }
    });

  } catch (error: any) {
    console.error('Error getting my DoctorQAs as doctor:', error);
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
      } else if (updatedQA.status === 'doctor_confirmed') {
        message = '✅ Thanh toán thành công! Đã tìm bác sĩ phù hợp nhưng chưa thể tự động đặt lịch. Staff sẽ sắp xếp thủ công.';
        extraInfo = {
          smartScheduled: false,
          doctorAssigned: !!updatedQA.doctorId,
          doctorName: (updatedQA.doctorId as any)?.userId?.fullName || 'Bác sĩ',
          needManualSchedule: true,
          nextStep: 'Staff sẽ liên hệ trong 24h để xác nhận lịch khám'
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

// =============== MEETING INTEGRATION APIS ===============

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
        meetId: meeting.meetingId,
        scheduledStartTime: meeting.scheduledStartTime,
        scheduledEndTime: meeting.scheduledEndTime,
        actualStartTime: meeting.actualStartTime,
        actualEndTime: meeting.actualEndTime,
        status: meeting.status,
        participants: meeting.participants,
        notes: meeting.notes
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
        participants: updatedMeeting.participants
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
        actualEndTime: completedMeeting.actualEndTime,
        notes: completedMeeting.notes,
        duration: completedMeeting.actualStartTime && completedMeeting.actualEndTime
          ? Math.round((completedMeeting.actualEndTime.getTime() - completedMeeting.actualStartTime.getTime()) / 60000)
          : null
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
    } else if (updatedQA.status === 'doctor_confirmed') {
      message = '⚠️ Đã assign bác sĩ nhưng chưa thể auto-schedule. Cần manual scheduling.';
      extraInfo = {
        smartScheduled: false,
        doctorAssigned: !!updatedQA.doctorId,
        doctorName: (updatedQA.doctorId as any)?.userId?.fullName || 'Bác sĩ',
        needManualSchedule: true,
        nextStep: 'Gọi API scheduleQA để xếp lịch thủ công'
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