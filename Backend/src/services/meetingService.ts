import Meeting from '../models/Meeting';
import DoctorQA from '../models/DoctorQA';
import mongoose from 'mongoose';
import googleCalendarService from './googleCalendarService';

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

    // Tạo meeting record với simplified model
    const newMeeting = new Meeting({
      qaId,
      doctorId,
      userId,
      meetingLink: meetingData.meetLink,
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
 * Participant join meeting notification - UPDATED for simplified model
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

    // Increment participant count
    meeting.participantCount = Math.min(meeting.participantCount + 1, meeting.maxParticipants);

    // Nếu có participant join và meeting chưa bắt đầu → set actualStartTime
    if (meeting.status === 'scheduled') {
      meeting.status = 'in_progress';
      meeting.actualStartTime = new Date();
      
      // Cập nhật DoctorQA status
      await DoctorQA.findByIdAndUpdate(qaId, {
        status: 'consulting'
      });
    }

    await meeting.save();

    console.log(`✅ Participant ${participantType} joined meeting:`, qaId);
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