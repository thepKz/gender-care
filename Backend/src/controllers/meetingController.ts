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
    const { participantId, participantType } = req.body;

    if (!isValidObjectId(qaId) || !isValidObjectId(participantId)) {
      res.status(400).json({ 
        message: 'QA ID hoặc Participant ID không hợp lệ' 
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
      qaId, 
      participantId, 
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

// GET /api/meetings/doctor/:doctorId - Lấy meetings của doctor (Doctor/Staff)
export const getMeetingsByDoctorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;

    if (!isValidObjectId(doctorId)) {
      res.status(400).json({ 
        message: 'Doctor ID không hợp lệ' 
      });
      return;
    }

    const meetings = await meetingService.getMeetingsByDoctorId(doctorId);

    res.status(200).json({
      message: `Lấy danh sách meetings của doctor thành công (${meetings.length} meetings)`,
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