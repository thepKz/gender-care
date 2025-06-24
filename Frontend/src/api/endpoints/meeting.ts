import axiosConfig from '../axiosConfig';

export interface MeetingData {
  meetingId: string;
  meetLink: string;
  provider: 'google' | 'jitsi';
  scheduledTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participantCount: number;
  maxParticipants: number;
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