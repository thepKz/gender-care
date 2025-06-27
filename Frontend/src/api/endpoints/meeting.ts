import axiosConfig from '../axiosConfig';

export interface MeetingData {
  meetingId: string;
  meetLink: string;
  provider: 'google' | 'jitsi';
  scheduledTime: string;
  status: 'scheduled' | 'waiting_customer' | 'invite_sent' | 'in_progress' | 'completed' | 'cancelled';
  participantCount: number;
  maxParticipants: number;
  meetingPassword: string;
  googleEventId?: string;
}

export interface CreateMeetingRequest {
  qaId: string;
  doctorId: string;
  scheduledTime: string;
  duration?: number;
  preferredProvider?: 'google' | 'jitsi';
}

export interface JoinMeetingRequest {
  participantType: 'doctor' | 'user';
}

// API Endpoints cho Meeting
const meetingAPI = {
  // Tạo meeting cho consultation/appointment  
  createMeeting: async (data: CreateMeetingRequest) => {
    const response = await axiosConfig.post('/meetings/create-meet-link', data);
    return response.data;
  },

  // Lấy meeting info theo qaId
  getMeetingByQA: async (qaId: string): Promise<MeetingData> => {
    const response = await axiosConfig.get(`/meetings/${qaId}`);
    return response.data.data;
  },

  // Join meeting notification (update participant count)
  joinMeeting: async (qaId: string, data: JoinMeetingRequest) => {
    const response = await axiosConfig.post(`/meetings/${qaId}/join-notification`, data);
    return response.data;
  },

  // Complete meeting
  completeMeeting: async (qaId: string, doctorNotes?: string) => {
    const response = await axiosConfig.put(`/meetings/${qaId}/complete`, { doctorNotes });
    return response.data;
  },

  // Get meetings by doctor
  getDoctorMeetings: async (doctorId: string) => {
    const response = await axiosConfig.get(`/meetings/doctor/${doctorId}`);
    return response.data;
  },

  // Get my meetings (current doctor from token)
  getMyMeetings: async () => {
    const response = await axiosConfig.get('/meetings/doctor/my-meetings');
    return response.data;
  },

  // ➕ ADD: Update meeting status when doctor joins
  updateDoctorJoinStatus: async (qaId: string) => {
    try {
      console.log('🌐 [FRONTEND-API] === DOCTOR JOIN API CALL ===');
      console.log('🌐 [FRONTEND-API] qaId:', qaId);
      console.log('🌐 [FRONTEND-API] URL:', `/meetings/${qaId}/doctor-join`);
      console.log('🌐 [FRONTEND-API] Method: POST');
      console.log('🌐 [FRONTEND-API] BaseURL:', axiosConfig.defaults.baseURL);
      
      const response = await axiosConfig.post(`/meetings/${qaId}/doctor-join`);
      
      console.log('✅ [FRONTEND-API] Success response:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [FRONTEND-API] Error in updateDoctorJoinStatus:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number }; config?: { url?: string } };
        console.error('❌ [FRONTEND-API] Error response:', axiosError.response?.data);
        console.error('❌ [FRONTEND-API] Error status:', axiosError.response?.status);
        console.error('❌ [FRONTEND-API] Error config:', axiosError.config?.url);
      }
      throw error;
    }
  },

  // ➕ ADD: Send customer meeting invite
  sendCustomerInvite: async (qaId: string) => {
    const response = await axiosConfig.post(`/meetings/${qaId}/send-customer-invite`);
    return response.data;
  }
};

// Google Auth API cho doctor
const googleAuthAPI = {
  // Tạo OAuth URL cho doctor kết nối Google
  connectGoogle: async (doctorId: string) => {
    const response = await axiosConfig.get(`/google-auth/connect/${doctorId}`);
    return response.data;
  },

  // Check Google connection status
  getConnectionStatus: async (doctorId: string) => {
    const response = await axiosConfig.get(`/google-auth/status/${doctorId}`);
    return response.data;
  },

  // Disconnect Google account
  disconnectGoogle: async (doctorId: string) => {
    const response = await axiosConfig.post(`/google-auth/disconnect/${doctorId}`);
    return response.data;
  }
};

export { meetingAPI, googleAuthAPI }; 