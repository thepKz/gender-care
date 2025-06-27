import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
import mongoose from 'mongoose';
import * as meetingService from '../services/meetingService';

// Validate ObjectId helper
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// POST /api/meetings/create-meet-link - Tạo Google Meet link cho consultation
export const createMeetLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qaId, doctorId, scheduledTime, duration = 60 } = req.body;

    if (!qaId || !doctorId || !scheduledTime) {
      res.status(400).json({ 
        message: 'Vui lòng cung cấp đầy đủ: qaId, doctorId, scheduledTime' 
      });
      return;
    }

    if (!isValidObjectId(qaId) || !isValidObjectId(doctorId)) {
      res.status(400).json({ 
        message: 'QA ID hoặc Doctor ID không hợp lệ' 
      });
      return;
    }

    // Parse scheduled time
    const scheduledDateTime = new Date(scheduledTime);

    if (isNaN(scheduledDateTime.getTime())) {
      res.status(400).json({ 
        message: 'Thời gian lên lịch không hợp lệ' 
      });
      return;
    }

    // Lấy userId từ DoctorQA
    const doctorQA = await require('../models/DoctorQA').default.findById(qaId).populate('userId');
    if (!doctorQA) {
      res.status(404).json({ 
        message: 'Không tìm thấy yêu cầu tư vấn' 
      });
      return;
    }

    const userId = doctorQA.userId;

    const meeting = await meetingService.createMeeting({
      qaId,
      doctorId,
      userId: userId._id || userId,
      scheduledTime: scheduledDateTime,
      duration,
      preferredProvider: 'google'
    });

    res.status(201).json({
      message: 'Tạo meeting thành công! Link Google Meet đã được tạo.',
      data: {
        meetingId: meeting._id,
        meetLink: meeting.meetingLink,
        provider: meeting.provider,
        scheduledTime: meeting.scheduledTime,
        status: meeting.status
      }
    });

  } catch (error: any) {
    console.error('Error creating meet link:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi tạo meeting' 
    });
  }
};

// GET /api/meetings/:qaId - Lấy thông tin meeting theo qaId
export const getMeetingByQaId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qaId } = req.params;

    if (!isValidObjectId(qaId)) {
      res.status(400).json({ 
        message: 'QA ID không hợp lệ' 
      });
      return;
    }

    const meeting = await meetingService.getMeetingByQaId(qaId);

    res.status(200).json({
      message: 'Lấy thông tin meeting thành công',
      data: {
        meetingId: meeting._id,
        meetLink: meeting.meetingLink,
        meetingPassword: meeting.meetingPassword,    // ➕ ADD: Return password field
        provider: meeting.provider,
        scheduledTime: meeting.scheduledTime,
        actualStartTime: meeting.actualStartTime,
        status: meeting.status,
        participantCount: meeting.participantCount,
        maxParticipants: meeting.maxParticipants,
        notes: meeting.notes,
        doctor: meeting.doctorId,
        user: meeting.userId,
        qa: meeting.qaId
      }
    });

  } catch (error: any) {
    console.error('Error getting meeting:', error);
    res.status(404).json({ 
      message: error.message || 'Không tìm thấy meeting' 
    });
  }
};

// PUT /api/meetings/:qaId/update-link - Update meeting link
export const updateMeetingLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qaId } = req.params;
    const { newMeetLink } = req.body;

    if (!isValidObjectId(qaId)) {
      res.status(400).json({ 
        message: 'QA ID không hợp lệ' 
      });
      return;
    }

    if (!newMeetLink) {
      res.status(400).json({ 
        message: 'Vui lòng cung cấp newMeetLink' 
      });
      return;
    }

    const updatedMeeting = await meetingService.updateMeetingLink(qaId, newMeetLink);

    res.status(200).json({
      message: 'Cập nhật meeting link thành công',
      data: {
        meetingId: updatedMeeting._id,
        meetLink: updatedMeeting.meetingLink,
        updatedAt: updatedMeeting.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Error updating meeting link:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi cập nhật meeting link' 
    });
  }
};

// POST /api/meetings/:qaId/join-notification - Notify khi participant join meeting
export const joinMeetingNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qaId } = req.params;
    const { participantType } = req.body;

    if (!isValidObjectId(qaId)) {
      res.status(400).json({ 
        message: 'QA ID không hợp lệ' 
      });
      return;
    }

    if (!participantType || !['doctor', 'user'].includes(participantType)) {
      res.status(400).json({ 
        message: 'Vui lòng cung cấp participantType: doctor hoặc user' 
      });
      return;
    }

    // ✅ Get participantId from meeting data
    const meeting = await meetingService.getMeetingByQaId(qaId);
    const participantId = participantType === 'doctor' ? meeting.doctorId : meeting.userId;

    const updatedMeeting = await meetingService.participantJoinMeeting(
      qaId, 
      participantId.toString(), 
      participantType
    );

    res.status(200).json({
      message: `${participantType} đã tham gia meeting thành công`,
      data: {
        meetingId: updatedMeeting._id,
        status: updatedMeeting.status,
        actualStartTime: updatedMeeting.actualStartTime,
        participantCount: updatedMeeting.participantCount
      }
    });

  } catch (error: any) {
    console.error('Error participant joining meeting:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi join meeting' 
    });
  }
};

// PUT /api/meetings/:qaId/complete - Hoàn thành meeting (Doctor only)
export const completeMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qaId } = req.params;
    const { doctorNotes } = req.body;

    if (!isValidObjectId(qaId)) {
      res.status(400).json({ 
        message: 'QA ID không hợp lệ' 
      });
      return;
    }

    const completedMeeting = await meetingService.completeMeeting(qaId, doctorNotes);

    res.status(200).json({
      message: 'Hoàn thành consultation thành công',
      data: {
        meetingId: completedMeeting._id,
        status: completedMeeting.status,
        notes: completedMeeting.notes,
        participantCount: completedMeeting.participantCount
      }
    });

  } catch (error: any) {
    console.error('Error completing meeting:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi hoàn thành meeting' 
    });
  }
};

// GET /api/meetings/doctor/my-meetings - Lấy meetings của doctor hiện tại (từ token)
export const getMyMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      res.status(401).json({ 
        message: 'Vui lòng đăng nhập để thực hiện thao tác này' 
      });
      return;
    }

    // ✅ SECURITY: Tự động lấy doctor từ user hiện tại
    const Doctor = require('../models/Doctor').default;
    const currentDoctor = await Doctor.findOne({ userId: currentUser._id });
    
    if (!currentDoctor) {
      res.status(403).json({ 
        message: 'Không tìm thấy thông tin bác sĩ của bạn trong hệ thống' 
      });
      return;
    }

    console.log(`✅ [SECURITY] Doctor ${currentUser.email} getting their own meetings (doctorId: ${currentDoctor._id})`);

    const meetings = await meetingService.getMeetingsByDoctorId(currentDoctor._id.toString());

    res.status(200).json({
      message: `Lấy danh sách meetings của bạn thành công (${meetings.length} meetings)`,
      data: meetings
    });

  } catch (error: any) {
    console.error('Error getting my meetings:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi lấy meetings của doctor' 
    });
  }
};

// GET /api/meetings/doctor/:doctorId - Lấy meetings của doctor (Doctor chỉ xem của mình) - LEGACY
export const getMeetingsByDoctorId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const currentUser = req.user;

    if (!isValidObjectId(doctorId)) {
      res.status(400).json({ 
        message: 'Doctor ID không hợp lệ' 
      });
      return;
    }

    if (!currentUser) {
      res.status(401).json({ 
        message: 'Vui lòng đăng nhập để thực hiện thao tác này' 
      });
      return;
    }

    // ✅ SECURITY CHECK: Doctor chỉ được xem meetings của chính mình
    const Doctor = require('../models/Doctor').default;
    const currentDoctor = await Doctor.findOne({ userId: currentUser._id });
    
    if (!currentDoctor) {
      res.status(403).json({ 
        message: 'Không tìm thấy thông tin bác sĩ của bạn trong hệ thống' 
      });
      return;
    }

    if (currentDoctor._id.toString() !== doctorId) {
      console.log(`🔒 [SECURITY] Doctor ${currentUser.email} attempted to access meetings of doctorId: ${doctorId}, but their doctorId is: ${currentDoctor._id}`);
      res.status(403).json({ 
        message: 'Bạn chỉ có thể xem lịch sử meeting của chính mình' 
      });
      return;
    }

    console.log(`✅ [SECURITY] Doctor ${currentUser.email} authorized to view their own meetings (doctorId: ${doctorId})`);

    const meetings = await meetingService.getMeetingsByDoctorId(doctorId);

    res.status(200).json({
      message: `Lấy danh sách meetings của bạn thành công (${meetings.length} meetings)`,
      data: meetings
    });

  } catch (error: any) {
    console.error('Error getting meetings by doctorId:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi lấy meetings của doctor' 
    });
  }
};

// GET /api/meetings/user/:userId - Lấy meetings của user (User)
export const getMeetingsByUserId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?._id;

    if (!isValidObjectId(userId)) {
      res.status(400).json({ 
        message: 'User ID không hợp lệ' 
      });
      return;
    }

    // Check authorization - user chỉ được xem meetings của mình
    if (userId !== currentUserId?.toString()) {
      res.status(403).json({ 
        message: 'Bạn chỉ có thể xem meetings của chính mình' 
      });
      return;
    }

    const meetings = await meetingService.getMeetingsByUserId(userId);

    res.status(200).json({
      message: `Lấy danh sách meetings của bạn thành công (${meetings.length} meetings)`,
      data: meetings
    });

  } catch (error: any) {
    console.error('Error getting meetings by userId:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi lấy meetings của user' 
    });
  }
};

// ➕ ADD: POST /api/meetings/:qaId/doctor-join - Update status khi doctor join
export const updateDoctorJoinStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { qaId } = req.params;
    const doctorUserId = req.user?._id;

    console.log(`🎯 [API-DOCTOR-JOIN] === REQUEST RECEIVED ===`);
    console.log(`🎯 [API-DOCTOR-JOIN] qaId: ${qaId}`);
    console.log(`🎯 [API-DOCTOR-JOIN] doctorUserId: ${doctorUserId}`);
    console.log(`🎯 [API-DOCTOR-JOIN] URL Path: ${req.originalUrl}`);
    console.log(`🎯 [API-DOCTOR-JOIN] Method: ${req.method}`);

    if (!isValidObjectId(qaId)) {
      console.log(`❌ [API-DOCTOR-JOIN] Invalid qaId: ${qaId}`);
      res.status(400).json({ 
        message: 'QA ID không hợp lệ' 
      });
      return;
    }

    if (!doctorUserId) {
      console.log(`❌ [API-DOCTOR-JOIN] Missing doctorUserId from token`);
      res.status(401).json({ 
        message: 'Vui lòng đăng nhập để thực hiện thao tác này' 
      });
      return;
    }

    console.log(`🎯 [API-DOCTOR-JOIN] Updating meeting status for QA: ${qaId}, Doctor: ${doctorUserId}`);

    // Gọi service để update status
    const result = await meetingService.updateMeetingStatusToDoctorJoined(qaId, doctorUserId.toString());

    console.log(`✅ [API-DOCTOR-JOIN] Service result:`, result);

    res.status(200).json({
      message: result.message,
      data: {
        success: result.success,
        meetingId: result.meetingId,
        oldStatus: result.oldStatus,
        newStatus: result.newStatus,
        participantCount: result.participantCount
      }
    });

  } catch (error: any) {
    console.error('❌ [API-DOCTOR-JOIN] Error updating doctor join status:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi update trạng thái meeting' 
    });
  }
};

// ➕ ADD: POST /api/meetings/:qaId/send-customer-invite - Gửi thư mời cho customer
export const sendCustomerInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { qaId } = req.params;
    const doctorId = req.user?._id; // Lấy doctorId từ auth token

    if (!isValidObjectId(qaId)) {
      res.status(400).json({ 
        message: 'QA ID không hợp lệ' 
      });
      return;
    }

    if (!doctorId) {
      res.status(401).json({ 
        message: 'Vui lòng đăng nhập để thực hiện thao tác này' 
      });
      return;
    }

    // Gọi service để gửi invite
    const result = await meetingService.sendCustomerInvite(qaId, doctorId.toString());

    res.status(200).json({
      message: '📧 Đã gửi thư mời tham gia meeting cho customer thành công!',
      data: {
        success: result.success,
        meetingId: result.meetingId,
        customerEmail: result.customerEmail,
        customerName: result.customerName,
        doctorName: result.doctorName,
        sentAt: result.sentAt,
        // Password hiển thị cho doctor xem (debug purpose)
        meetingPassword: result.meetingPassword
      }
    });

  } catch (error: any) {
    console.error('Error sending customer invite:', error);
    res.status(400).json({ 
      message: error.message || 'Lỗi server khi gửi thư mời cho customer' 
    });
  }
}; 