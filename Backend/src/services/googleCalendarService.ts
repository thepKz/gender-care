import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import GoogleAuth, { IGoogleAuth } from '../models/GoogleAuth';
import Doctor from '../models/Doctor';

// Interface for Google Meet creation response
export interface GoogleMeetData {
  meetLink: string;
  eventId: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Google Calendar Service - Handles OAuth và Google Meet creation
 */
class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  
  constructor() {
    // TODO: Fix Google OAuth2Client types
    console.log('⚠️ GoogleCalendarService initialized with mock OAuth client');
    // this.oauth2Client = new google.auth.OAuth2(
    //   process.env.GOOGLE_CALENDAR_CLIENT_ID,
    //   process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    //   process.env.GOOGLE_CALENDAR_REDIRECT_URL
    // );
    this.oauth2Client = {} as OAuth2Client; // Mock for now
  }

  /**
   * Tạo OAuth URL cho doctor kết nối Google
   */
  generateAuthUrl(doctorId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: doctorId, // Pass doctorId trong state để callback biết
      prompt: 'consent' // Force consent để lấy refresh_token
    });

    console.log('🔗 Generated OAuth URL for doctor:', doctorId);
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens - TEMPORARILY DISABLED
   */
  async exchangeCodeForTokens(code: string, doctorId: string): Promise<boolean> {
    try {
      // Validate doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor không tồn tại');
      }

      // TODO: Fix Google API types
      console.log('⚠️ Google OAuth temporarily disabled due to type issues');
      console.log('Code:', code, 'DoctorId:', doctorId);
      
      // Mock success for now
      return false; // Return false to indicate Google not connected

    } catch (error: any) {
      console.error('❌ Error exchanging code for tokens:', error);
      throw new Error(`Lỗi kết nối Google: ${error.message}`);
    }
  }

  /**
   * Refresh access token if expired
   */
  async refreshTokens(googleAuth: IGoogleAuth): Promise<IGoogleAuth> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: googleAuth.credentials.refresh_token
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update tokens in database
      googleAuth.credentials.access_token = credentials.access_token!;
      if (credentials.expiry_date) {
        googleAuth.credentials.expiry_date = credentials.expiry_date;
      }
      googleAuth.lastSyncAt = new Date();

      await googleAuth.save();
      
      console.log('🔄 Refreshed Google tokens for doctor:', googleAuth.doctorId);
      return googleAuth;

    } catch (error: any) {
      console.error('❌ Error refreshing tokens:', error);
      // Mark as inactive if refresh fails
      googleAuth.isActive = false;
      await googleAuth.save();
      throw new Error(`Lỗi refresh token: ${error.message}`);
    }
  }

  /**
   * Tạo Google Meet link thông qua Calendar API - TEMPORARILY DISABLED
   */
  async createGoogleMeet(
    title: string,
    startTime: Date,
    duration: number = 60, // minutes
    attendeeEmails: string[] = [],
    doctorId: string
  ): Promise<GoogleMeetData> {
    // TODO: Fix Google API types and re-enable
    console.log('⚠️ Google Meet creation temporarily disabled');
    console.log('Params:', { title, startTime, duration, doctorId });
    
    throw new Error('Google Meet tạm thời chưa khả dụng. Hệ thống sẽ sử dụng Jitsi Meet.');

    /* 
    // COMMENTED OUT DUE TO TYPE ISSUES - TO BE FIXED
    try {
      // Get doctor's Google Auth
      const googleAuth = await GoogleAuth.findOne({ 
        doctorId, 
        isActive: true 
      });

      if (!googleAuth) {
        throw new Error('Doctor chưa kết nối Google Calendar');
      }

      // Check if token expired và refresh nếu cần
      const now = Date.now();
      let authToUse = googleAuth;
      
      if (googleAuth.credentials.expiry_date < now) {
        authToUse = await this.refreshTokens(googleAuth);
      }

      // Set credentials
      this.oauth2Client.setCredentials(authToUse.credentials);

      // Create calendar instance
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      // Calculate end time
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      // Create event với Google Meet
      const event = {
        summary: title,
        description: `Tư vấn sức khỏe trực tuyến qua Gender Healthcare System`,
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
            requestId: `meet_${Date.now()}_${doctorId}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 30 },
            { method: 'popup', minutes: 10 }
          ]
        }
      };

      // Create event
      const result = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1
      });

      const meetLink = result.data.conferenceData?.entryPoints?.[0]?.uri;
      const eventId = result.data.id;

      if (!meetLink || !eventId) {
        throw new Error('Không thể tạo Google Meet link');
      }

      console.log('✅ Created Google Meet successfully:', {
        eventId,
        meetLink,
        doctor: doctorId
      });

      return {
        meetLink,
        eventId,
        startTime,
        endTime
      };

    } catch (error: any) {
      console.error('❌ Error creating Google Meet:', error);
      throw new Error(`Lỗi tạo Google Meet: ${error.message}`);
    }
    */
  }

  /**
   * Tạo Jitsi Meet link fallback
   */
  async createJitsiMeet(
    title: string,
    startTime: Date,
    qaId: string
  ): Promise<GoogleMeetData> {
    // Generate unique room name
    const roomName = `consultation-${qaId}-${Date.now()}`;
    const meetLink = `https://meet.jit.si/${roomName}`;

    console.log('🎥 Created Jitsi Meet fallback:', {
      meetLink,
      title,
      qaId
    });

    return {
      meetLink,
      eventId: `jitsi_${qaId}`,
      startTime,
      endTime: new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour default
    };
  }

  /**
   * Check doctor's Google connection status
   */
  async checkConnectionStatus(doctorId: string): Promise<{
    isConnected: boolean;
    lastSync?: Date;
    email?: string;
  }> {
    try {
      const googleAuth = await GoogleAuth.findOne({ 
        doctorId, 
        isActive: true 
      });

      if (!googleAuth) {
        return { isConnected: false };
      }

      // Try to get profile to verify connection
      this.oauth2Client.setCredentials(googleAuth.credentials);
      
      // TODO: Fix Google OAuth2 types
      console.log('⚠️ Google profile check temporarily disabled');
      return {
        isConnected: true, // Mock as connected
        lastSync: googleAuth.lastSyncAt,
        email: 'mock@gmail.com'
      };

    } catch (error: any) {
      console.error('Error checking Google connection:', error);
      return { isConnected: false };
    }
  }

  /**
   * Disconnect Google account
   */
  async disconnectGoogle(doctorId: string): Promise<boolean> {
    try {
      const result = await GoogleAuth.findOneAndUpdate(
        { doctorId },
        { isActive: false },
        { new: true }
      );

      console.log('🔌 Disconnected Google for doctor:', doctorId);
      return !!result;

    } catch (error: any) {
      console.error('Error disconnecting Google:', error);
      throw new Error(`Lỗi ngắt kết nối Google: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new GoogleCalendarService(); 