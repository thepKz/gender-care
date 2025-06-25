import Meeting from '../models/Meeting';
import DoctorQA from '../models/DoctorQA';
import mongoose from 'mongoose';
import googleCalendarService from './googleCalendarService';
import { sendCustomerMeetingInviteEmail } from './emails';
import { generateMeetingPassword } from '../utils/passwordGenerator';

// Interface for creating meeting - UPDATED for simplified model
interface CreateMeetingData {
  qaId: string;
  doctorId: string;
  userId: string;
  scheduledTime: Date;
  duration?: number; // minutes, default 60
  preferredProvider?: 'google' | 'jitsi';
}

// Interface for Google Meet creation
interface GoogleMeetData {
  meetLink: string;
  meetId: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Tạo meeting với Google Meet hoặc Jitsi fallback - UPDATED to use real GoogleCalendarService
 */
export const createMeetingFromQA = async (
  qaId: string,
  options: {
    preferredProvider?: 'google' | 'jitsi';
    scheduledTime: Date;
    duration?: number; // minutes
  }
): Promise<any> => {
  try {
    const qa = await DoctorQA.findById(qaId);
    if (!qa) {
      throw new Error('Không tìm thấy yêu cầu tư vấn');
    }

    const meetingTitle = `Tư vấn sức khỏe - ${qa.fullName}`;
    const duration = options.duration || 60;
    let meetingData;
    let provider: 'google' | 'jitsi' = 'jitsi'; // default

    // Try Google Meet first if preferred
    if (options.preferredProvider === 'google') {
      try {
        console.log('🔄 Attempting to create Google Meet for doctor:', qa.doctorId);
        
                 meetingData = await googleCalendarService.createGoogleMeet(
           meetingTitle,
           options.scheduledTime,
           duration,
           [], // TODO: Add attendee emails
           qa.doctorId?.toString() || ''
         );
        
        provider = 'google';
        console.log('✅ Google Meet created successfully');

      } catch (googleError: any) {
        console.log('⚠️ Google Meet failed, falling back to Jitsi:', googleError.message);
        
        // Fallback to Jitsi
        meetingData = await googleCalendarService.createJitsiMeet(
          meetingTitle,
          options.scheduledTime,
          qaId
        );
        provider = 'jitsi';
      }
    } else {
      // Use Jitsi directly
      meetingData = await googleCalendarService.createJitsiMeet(
        meetingTitle,
        options.scheduledTime,
        qaId
      );
      provider = 'jitsi';
    }

    return { meetingData, provider };

  } catch (error: any) {
    console.error('Error in createMeetingFromQA:', error);
    throw new Error(`Lỗi tạo meeting: ${error.message}`);
  }
};

/**
 * Tạo meeting mới cho consultation - UPDATED for simplified model
 */
export const createMeeting = async (data: CreateMeetingData) => {
  try {
    const { qaId, doctorId, userId, scheduledTime, duration = 60, preferredProvider = 'google' } = data;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(qaId) || 
        !mongoose.Types.ObjectId.isValid(doctorId) || 
        !mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid ObjectId provided');
    }

    // Kiểm tra QA có tồn tại không
    const qa = await DoctorQA.findById(qaId);
    if (!qa) {
      throw new Error('Không tìm thấy yêu cầu tư vấn');
    }

    // Kiểm tra meeting đã tồn tại chưa
    const existingMeeting = await Meeting.findOne({ qaId });
    if (existingMeeting) {
      throw new Error('Meeting đã tồn tại cho yêu cầu tư vấn này');
    }

    // Tạo meeting với provider strategy
    const { meetingData, provider } = await createMeetingFromQA(qaId, {
      preferredProvider,
      scheduledTime,
      duration
    });

    // ➕ ADD: Generate secure meeting password
    const meetingPassword = generateMeetingPassword();
    console.log(`🔐 [CREATE-MEETING] Generated password: ${meetingPassword} for QA: ${qaId}`);

    // Tạo meeting record với simplified model + password
    const newMeeting = new Meeting({
      qaId,
      doctorId,
      userId,
      meetingLink: meetingData.meetLink,
      meetingPassword,           // ➕ ADD password field
      provider,
      scheduledTime,
      status: 'scheduled',
      participantCount: 0,
      maxParticipants: 2,
      googleEventId: provider === 'google' ? meetingData.eventId : undefined
    });

    const savedMeeting = await newMeeting.save();

    // Cập nhật DoctorQA với meeting info
    await DoctorQA.findByIdAndUpdate(qaId, {
      meetingLink: meetingData.meetLink,
      status: 'scheduled'
    });

    console.log('✅ Meeting created successfully:', {
      id: savedMeeting._id,
      provider,
      link: meetingData.meetLink
    });
    
    return savedMeeting;

  } catch (error: any) {
    console.error('Error creating meeting:', error);
    throw new Error(`Lỗi tạo meeting: ${error.message}`);
  }
};

/**
 * Lấy meeting theo qaId
 */
export const getMeetingByQaId = async (qaId: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(qaId)) {
      throw new Error('QA ID không hợp lệ');
    }

    const meeting = await Meeting.findOne({ qaId })
      .populate('doctorId', 'fullName email specialization')
      .populate('userId', 'fullName email')
      .populate('qaId', 'fullName phone question status');

    if (!meeting) {
      throw new Error('Không tìm thấy meeting');
    }

    return meeting;
  } catch (error: any) {
    console.error('Error getting meeting by qaId:', error);
    throw new Error(`Lỗi lấy meeting: ${error.message}`);
  }
};

/**
 * Cập nhật meeting link
 */
export const updateMeetingLink = async (qaId: string, newMeetLink: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(qaId)) {
      throw new Error('QA ID không hợp lệ');
    }

    const updatedMeeting = await Meeting.findOneAndUpdate(
      { qaId },
      { meetingLink: newMeetLink },
      { new: true }
    );

    if (!updatedMeeting) {
      throw new Error('Không tìm thấy meeting để cập nhật');
    }

    // Cập nhật DoctorQA cũng
    await DoctorQA.findByIdAndUpdate(qaId, {
      meetingLink: newMeetLink
    });

    console.log('✅ Meeting link updated:', updatedMeeting._id);
    return updatedMeeting;
  } catch (error: any) {
    console.error('Error updating meeting link:', error);
    throw new Error(`Lỗi cập nhật meeting link: ${error.message}`);
  }
};

/**
 * Participant join meeting notification - UPDATED for proper status workflow
 */
export const participantJoinMeeting = async (
  qaId: string, 
  participantId: string, 
  participantType: 'doctor' | 'user'
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(qaId) || !mongoose.Types.ObjectId.isValid(participantId)) {
      throw new Error('ID không hợp lệ');
    }

    const meeting = await Meeting.findOne({ qaId });
    if (!meeting) {
      throw new Error('Không tìm thấy meeting');
    }

    console.log(`🎯 [JOIN-MEETING] ${participantType} joining meeting. Current status: ${meeting.status}, participantCount: ${meeting.participantCount}`);

    // Logic theo workflow mới
    if (participantType === 'doctor') {
      // Doctor join meeting first
      if (meeting.status === 'scheduled') {
        meeting.status = 'waiting_customer';
        meeting.participantCount = 1;
        meeting.actualStartTime = new Date();
        console.log(`🎯 [DOCTOR-JOIN] Doctor joined first → status: waiting_customer`);
      }
    } else if (participantType === 'user') {
      // Customer join meeting
      if (meeting.status === 'waiting_customer' || meeting.status === 'invite_sent') {
        meeting.status = 'in_progress';
        meeting.participantCount = 2;
        
        // Cập nhật DoctorQA status
        await DoctorQA.findByIdAndUpdate(qaId, {
          status: 'consulting'
        });
        console.log(`🎯 [CUSTOMER-JOIN] Customer joined → status: in_progress`);
      }
    }

    await meeting.save();

    console.log(`✅ [JOIN-MEETING] ${participantType} joined. New status: ${meeting.status}, participantCount: ${meeting.participantCount}`);
    return meeting;
  } catch (error: any) {
    console.error('Error participant joining meeting:', error);
    throw new Error(`Lỗi participant join meeting: ${error.message}`);
  }
};

/**
 * Kết thúc meeting - UPDATED for simplified model
 */
export const completeMeeting = async (qaId: string, doctorNotes?: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(qaId)) {
      throw new Error('QA ID không hợp lệ');
    }

    const meeting = await Meeting.findOne({ qaId });
    if (!meeting) {
      throw new Error('Không tìm thấy meeting');
    }

    // Cập nhật meeting status
    meeting.status = 'completed';
    meeting.participantCount = 0; // Reset participant count
    if (doctorNotes) {
      meeting.notes = doctorNotes;
    }

    await meeting.save();

    // Cập nhật DoctorQA status
    await DoctorQA.findByIdAndUpdate(qaId, {
      status: 'completed',
      doctorNotes: doctorNotes || ''
    });

    console.log('✅ Meeting completed:', qaId);
    return meeting;
  } catch (error: any) {
    console.error('Error completing meeting:', error);
    throw new Error(`Lỗi hoàn thành meeting: ${error.message}`);
  }
};

/**
 * Lấy meetings theo doctorId
 */
export const getMeetingsByDoctorId = async (doctorId: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new Error('Doctor ID không hợp lệ');
    }

    const meetings = await Meeting.find({ doctorId })
      .populate('userId', 'fullName email')
      .populate('qaId', 'fullName phone question status')
      .sort({ scheduledTime: -1 });

    return meetings;
  } catch (error: any) {
    console.error('Error getting meetings by doctorId:', error);
    throw new Error(`Lỗi lấy meetings của doctor: ${error.message}`);
  }
};

/**
 * Lấy meetings theo userId
 */
export const getMeetingsByUserId = async (userId: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('User ID không hợp lệ');
    }

    const meetings = await Meeting.find({ userId })
      .populate('doctorId', 'fullName email specialization')
      .populate('qaId', 'fullName phone question status')
      .sort({ scheduledStartTime: -1 });

    return meetings;
  } catch (error: any) {
    console.error('Error getting meetings by userId:', error);
    throw new Error(`Lỗi lấy meetings của user: ${error.message}`);
  }
};

/**
 * ➕ ADD: Simple API to update meeting status when doctor joins
 */
export const updateMeetingStatusToDoctorJoined = async (qaId: string, doctorUserId: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(qaId)) {
      throw new Error('QA ID không hợp lệ');
    }

    // Lấy meeting
    const meeting = await Meeting.findOne({ qaId });
    if (!meeting) {
      throw new Error('Không tìm thấy meeting');
    }

    // ✅ Validate doctor authority
    const Doctor = require('../models/Doctor').default;
    const doctorRecord = await Doctor.findOne({ userId: doctorUserId });
    
    if (!doctorRecord) {
      throw new Error('Không tìm thấy thông tin doctor');
    }

    if (meeting.doctorId.toString() !== doctorRecord._id.toString()) {
      throw new Error('Bạn không có quyền update meeting này');
    }

    console.log(`🎯 [UPDATE-STATUS] Doctor joining meeting. Current status: ${meeting.status}`);

    // ✅ Update status từ scheduled → waiting_customer
    if (meeting.status === 'scheduled') {
      meeting.status = 'waiting_customer';
      meeting.participantCount = 1;
      meeting.actualStartTime = new Date();
      
      await meeting.save();
      
      console.log(`✅ [UPDATE-STATUS] Meeting status updated: scheduled → waiting_customer`);
      console.log(`✅ [UPDATE-STATUS] ParticipantCount: 0 → 1`);
      
      return {
        success: true,
        meetingId: meeting._id,
        oldStatus: 'scheduled',
        newStatus: 'waiting_customer',
        participantCount: 1,
        message: 'Doctor đã tham gia meeting. Giờ có thể gửi thư mời cho customer!'
      };
    } else {
      console.log(`ℹ️ [UPDATE-STATUS] Meeting already in status: ${meeting.status}`);
      return {
        success: true,
        meetingId: meeting._id,
        oldStatus: meeting.status,
        newStatus: meeting.status,
        participantCount: meeting.participantCount,
        message: `Meeting đã ở status: ${meeting.status}`
      };
    }

  } catch (error: any) {
    console.error('❌ [UPDATE-STATUS] Error updating meeting status:', error);
    throw new Error(`Lỗi update meeting status: ${error.message}`);
  }
};

/**
 * ➕ ADD: Send customer meeting invite với password
 */
export const sendCustomerInvite = async (qaId: string, doctorId: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(qaId) || !mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new Error('QA ID hoặc Doctor ID không hợp lệ');
    }

    // Lấy meeting với đầy đủ thông tin populated
    const meeting = await Meeting.findOne({ qaId })
      .populate('doctorId', 'fullName email specialization')
      .populate('userId', 'fullName email phone')
      .populate('qaId', 'fullName phone question status');

    if (!meeting) {
      throw new Error('Không tìm thấy meeting');
    }

    // Kiểm tra meeting có password không
    if (!meeting.meetingPassword) {
      throw new Error('Meeting chưa có password được tạo');
    }

    // ✅ FIX: Kiểm tra doctor authorization đúng cách
    // doctorId từ frontend là userId, cần check qua Doctor.userId
    const Doctor = require('../models/Doctor').default;
    const doctorRecord = await Doctor.findOne({ userId: doctorId });
    
    if (!doctorRecord) {
      throw new Error('Không tìm thấy thông tin doctor');
    }

    if (meeting.doctorId._id.toString() !== doctorRecord._id.toString()) {
      throw new Error('Bạn không có quyền gửi invite cho meeting này');
    }
    
    console.log(`✅ [AUTH-CHECK] Doctor authorized: userId=${doctorId}, doctorId=${doctorRecord._id}`);

    // Kiểm tra status meeting - chỉ cho phép gửi khi status = waiting_customer
    if (meeting.status !== 'waiting_customer') {
      throw new Error(`⚠️ Bác sĩ cần chuẩn bị meeting trước khi gửi thư mời:\n\n✅ 1. Nhấn "Tham gia Meeting" để xác nhận tham gia\n✅ 2. Kiểm tra thiết bị (camera, micro, mạng)\n✅ 3. Chuẩn bị phần mềm ghi hình\n✅ 4. Sau đó mới có thể gửi thư mời cho khách hàng\n\n📋 `);
    }

    // Extract thông tin cần thiết
    const customerData = meeting.userId as any;
    const doctorData = meeting.doctorId as any;
    const qaData = meeting.qaId as any;

    // Gửi email invite
    await sendCustomerMeetingInviteEmail(
      customerData.email,
      customerData.fullName,
      customerData.phone || qaData.phone,
      doctorData.fullName,
      meeting.meetingLink,
      meeting.meetingPassword,
      meeting.scheduledTime,
      qaData.question
    );

    // ✅ Update meeting status để tránh spam - waiting_customer → invite_sent
    meeting.status = 'invite_sent';
    await meeting.save();

    console.log(`📧 [INVITE-SENT] Customer meeting invite sent for meeting: ${meeting._id}`);
    console.log(`   Customer: ${customerData.fullName} (${customerData.email})`);
    console.log(`   Doctor: ${doctorData.fullName}`);
    console.log(`   Password: ${meeting.meetingPassword}`);
    console.log(`✅ [STATUS-UPDATE] Meeting status updated: waiting_customer → invite_sent`);

    return {
      success: true,
      meetingId: meeting._id,
      customerEmail: customerData.email,
      customerName: customerData.fullName,
      doctorName: doctorData.fullName,
      meetingPassword: meeting.meetingPassword,
      sentAt: new Date(),
      newStatus: 'invite_sent'
    };

  } catch (error: any) {
    console.error('Error sending customer invite:', error);
    throw new Error(`${error.message}`);
  }
}; 