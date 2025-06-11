import Meeting from '../models/Meeting';
import DoctorQA from '../models/DoctorQA';
import { google } from 'googleapis';
import mongoose from 'mongoose';

// Interface for creating meeting
interface CreateMeetingData {
  qaId: string;
  doctorId: string;
  userId: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
}

// Interface for Google Meet creation
interface GoogleMeetData {
  meetLink: string;
  meetId: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Tạo Google Meet link thông qua Google Calendar API
 */
export const createGoogleMeetLink = async (
  title: string,
  startTime: Date,
  endTime: Date,
  attendeeEmails: string[] = []
): Promise<GoogleMeetData> => {
  try {
    // Tạo OAuth2 client (cần implement Google Auth service riêng)
    // Tạm thời mock data - sẽ implement Google API sau
    const mockMeetLink = `https://meet.google.com/mock-${Date.now()}`;
    const mockMeetId = `mock_meeting_${Date.now()}`;

    console.log('🔄 [MOCK] Creating Google Meet:', {
      title,
      startTime,
      endTime,
      attendeeEmails,
      generatedLink: mockMeetLink
    });

    return {
      meetLink: mockMeetLink,
      meetId: mockMeetId,
      startTime,
      endTime
    };

    /* TODO: Implement actual Google Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: title,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Ho_Chi_Minh',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Ho_Chi_Minh',
      },
      attendees: attendeeEmails.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet_${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    };

    const result = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1
    });

    return {
      meetLink: result.data.conferenceData?.entryPoints?.[0]?.uri || '',
      meetId: result.data.id || '',
      startTime,
      endTime
    };
    */
  } catch (error: any) {
    console.error('Error creating Google Meet:', error);
    throw new Error(`Lỗi tạo Google Meet: ${error.message}`);
  }
};

/**
 * Tạo meeting mới cho consultation
 */
export const createMeeting = async (data: CreateMeetingData) => {
  try {
    const { qaId, doctorId, userId, scheduledStartTime, scheduledEndTime } = data;

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

    // Tạo Google Meet link
    const meetingTitle = `Tư vấn sức khỏe - ${qa.fullName}`;
    const googleMeetData = await createGoogleMeetLink(
      meetingTitle,
      scheduledStartTime,
      scheduledEndTime,
      [] // TODO: Add doctor and user emails
    );

    // Tạo meeting record
    const newMeeting = new Meeting({
      qaId,
      doctorId,
      userId,
      meetingLink: googleMeetData.meetLink,
      meetingId: googleMeetData.meetId,
      scheduledStartTime,
      scheduledEndTime,
      status: 'scheduled',
      participants: [
        {
          userId: doctorId,
          userType: 'doctor'
        },
        {
          userId: userId,
          userType: 'user'
        }
      ]
    });

    const savedMeeting = await newMeeting.save();

    // Cập nhật DoctorQA với meeting info
    await DoctorQA.findByIdAndUpdate(qaId, {
      meetingLink: googleMeetData.meetLink,
      meetingId: googleMeetData.meetId,
      status: 'scheduled'  // Cập nhật status thành scheduled
    });

    console.log('✅ Meeting created successfully:', savedMeeting._id);
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
 * Participant join meeting notification
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

    // Tìm participant trong array
    const participantIndex = meeting.participants.findIndex(
      p => p.userId.toString() === participantId && p.userType === participantType
    );

    if (participantIndex === -1) {
      throw new Error('Không tìm thấy participant');
    }

    // Cập nhật joinedAt
    meeting.participants[participantIndex].joinedAt = new Date();

    // Nếu có ít nhất 1 participant join và meeting chưa bắt đầu → set actualStartTime
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
 * Kết thúc meeting
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
    meeting.actualEndTime = new Date();
    if (doctorNotes) {
      meeting.notes = doctorNotes;
    }

    // Mark tất cả participants leftAt
    meeting.participants.forEach(participant => {
      if (!participant.leftAt) {
        participant.leftAt = new Date();
      }
    });

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
      .sort({ scheduledStartTime: -1 });

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