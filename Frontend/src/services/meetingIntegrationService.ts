import { message } from 'antd';
import { meetingAPI, MeetingData } from '../api/endpoints/meeting';
import { UnifiedAppointment } from '../types/appointment';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Setup timezone cho dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Ho_Chi_Minh');

export interface JoinMeetingResult {
  success: boolean;
  meetingData?: MeetingData;
  meetingLink?: string;
  provider?: 'google' | 'jitsi';
  error?: string;
}

class MeetingIntegrationService {
  
  /**
   * Kiểm tra xem có thể tham gia meeting không (5 phút trước đến hết giờ hẹn)
   */
  canJoinMeeting(appointment: UnifiedAppointment): boolean {
    try {
      // Sử dụng UTC+7 offset thay vì timezone plugin để tránh lỗi
      const now = dayjs().utcOffset(7); // UTC+7 for Vietnam
      
      // Parse appointment datetime đúng cách
      let appointmentDateTime;
      
      if (appointment.appointmentDate.includes('T')) {
        // appointmentDate đã có time, chỉ cần parse
        appointmentDateTime = dayjs(appointment.appointmentDate).utcOffset(7);
      } else {
        // Extract start time từ appointmentTime range
        const startTime = appointment.appointmentTime.split('-')[0] || appointment.appointmentTime.split(' - ')[0];
        const dateTimeStr = `${appointment.appointmentDate} ${startTime}`;
        appointmentDateTime = dayjs(dateTimeStr).utcOffset(7);
      }
      
      // Validate parsed datetime
      if (!appointmentDateTime.isValid()) {
        console.error('❌ [Meeting Service] Invalid appointment datetime:', {
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          parsed: appointmentDateTime.toString()
        });
        return false;
      }
      
      const appointmentEndTime = appointmentDateTime.add(1, 'hour');
      const canJoinTime = appointmentDateTime.subtract(5, 'minute');
      
      // Debug timezone - safer logging
      console.log('🕐 [MEETING SERVICE DEBUG] Timing check:', {
        now: now.format('YYYY-MM-DD HH:mm:ss'),
        appointmentDateTime: appointmentDateTime.format('YYYY-MM-DD HH:mm:ss'),
        canJoinTime: canJoinTime.format('YYYY-MM-DD HH:mm:ss'),
        appointmentEndTime: appointmentEndTime.format('YYYY-MM-DD HH:mm:ss'),
        canJoin: now.isAfter(canJoinTime) && now.isBefore(appointmentEndTime),
        timezone: 'UTC+7 (Vietnam)'
      });
      
      return now.isAfter(canJoinTime) && now.isBefore(appointmentEndTime);
      
    } catch (error) {
      console.error('❌ Error in meetingService canJoinMeeting:', error);
      return false; // Safe fallback
    }
  }

  /**
   * Get meeting button text based on time
   */
  getMeetingButtonText(appointment: UnifiedAppointment): string {
    try {
      const now = dayjs().utcOffset(7); // UTC+7 for Vietnam
      
      // Parse appointment datetime đúng cách
      let appointmentDateTime;
      
      if (appointment.appointmentDate.includes('T')) {
        appointmentDateTime = dayjs(appointment.appointmentDate).utcOffset(7);
      } else {
        const startTime = appointment.appointmentTime.split('-')[0] || appointment.appointmentTime.split(' - ')[0];
        const dateTimeStr = `${appointment.appointmentDate} ${startTime}`;
        appointmentDateTime = dayjs(dateTimeStr).utcOffset(7);
      }
      
      if (!appointmentDateTime.isValid()) {
        return 'Lỗi thời gian';
      }
      
      const appointmentEndTime = appointmentDateTime.add(1, 'hour');
      const canJoinTime = appointmentDateTime.subtract(5, 'minute');
      
      if (now.isBefore(canJoinTime)) {
        const minutesLeft = canJoinTime.diff(now, 'minute');
        return `Còn ${minutesLeft} phút`;
      } else if (now.isAfter(appointmentEndTime)) {
        return 'Đã kết thúc';
      } else {
        return 'Tham gia Meet';
      }
      
    } catch (error) {
      console.error('❌ Error in meetingService getMeetingButtonText:', error);
      return 'Lỗi thời gian';
    }
  }

  /**
   * Extract qaId from appointment data
   */
  private getQAIdFromAppointment(appointment: UnifiedAppointment): string | null {
    if (appointment.type === 'consultation') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const consultationData = appointment.originalData as any;
      return consultationData?._id || consultationData?.id || null;
    }
    return null;
  }

  /**
   * Doctor join meeting - Main function
   */
  async doctorJoinMeeting(
    appointment: UnifiedAppointment, 
    doctorId: string
  ): Promise<JoinMeetingResult> {
    try {
      // 1. Validate timing
      if (!this.canJoinMeeting(appointment)) {
        message.warning('Chưa đến giờ tham gia meeting hoặc đã kết thúc');
        return { success: false, error: 'Invalid timing' };
      }

      // 2. Get qaId
      const qaId = this.getQAIdFromAppointment(appointment);
      if (!qaId) {
        message.error('Không tìm thấy thông tin meeting');
        return { success: false, error: 'Missing qaId' };
      }

      // 3. Check if meeting exists, create if not
      let meetingData: MeetingData;
      try {
        meetingData = await meetingAPI.getMeetingByQA(qaId);
        console.log('✅ Found existing meeting:', meetingData);
      } catch {
        console.log('⚠️ Meeting chưa tồn tại, tạo mới...');
        
        // Create new meeting
        const createMeetingData = {
          qaId,
          doctorId,
          scheduledTime: `${appointment.appointmentDate} ${appointment.appointmentTime}`,
          duration: 60,
          preferredProvider: 'google' as const
        };

        await meetingAPI.createMeeting(createMeetingData);
        console.log('✅ Created new meeting');
        
        // Get meeting data after creation
        meetingData = await meetingAPI.getMeetingByQA(qaId);
      }

      // 4. Notify join meeting (update participant count)
      await meetingAPI.joinMeeting(qaId, { participantType: 'doctor' });
      console.log('✅ Doctor joined meeting');

      // 5. Open meeting link
      if (meetingData.meetLink) {
        window.open(meetingData.meetLink, '_blank');
        message.success(`Đã mở ${meetingData.provider === 'google' ? 'Google Meet' : 'Jitsi Meet'}`);
        
        return {
          success: true,
          meetingData,
          meetingLink: meetingData.meetLink,
          provider: meetingData.provider
        };
      } else {
        message.error('Không có meeting link khả dụng');
        return { success: false, error: 'No meeting link' };
      }

    } catch (error: unknown) {
      console.error('❌ Error joining meeting:', error);
      
      // Fallback: Create temporary Jitsi Meet link
      const fallbackLink = `https://meet.jit.si/consultation-${Date.now()}`;
      window.open(fallbackLink, '_blank');
      message.warning('Không thể kết nối meeting chính, đã tạo phòng Jitsi tạm thời');
      
      return {
        success: true, // Still success with fallback
        meetingLink: fallbackLink,
        provider: 'jitsi',
        error: 'Used fallback'
      };
    }
  }

  /**
   * Complete meeting
   */
  async completeMeeting(appointment: UnifiedAppointment, doctorNotes?: string): Promise<boolean> {
    try {
      const qaId = this.getQAIdFromAppointment(appointment);
      if (!qaId) {
        message.error('Không tìm thấy thông tin meeting');
        return false;
      }

      await meetingAPI.completeMeeting(qaId, doctorNotes);
      message.success('Đã hoàn thành cuộc tư vấn');
      return true;

    } catch (error) {
      console.error('❌ Error completing meeting:', error);
      message.error('Không thể hoàn thành meeting');
      return false;
    }
  }
}

export default new MeetingIntegrationService(); 