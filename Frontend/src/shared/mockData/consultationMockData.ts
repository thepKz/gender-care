// =============== CONSULTATION & MEETING MOCK DATA ===============

export interface ConsultationMockData {
  _id: string;
  fullName: string;
  phone: string;
  question: string;
  status: 'pending_payment' | 'scheduled' | 'consulting' | 'completed' | 'cancelled';
  appointmentDate: string;
  appointmentSlot: string;
  appointmentTime: string; // Alias for slot
  doctorId: string;
  userId: string;
  serviceName: string;
  patientName: string; // Alias for fullName
  patientPhone: string; // Alias for phone
  description: string; // Alias for question
  notes?: string;
  doctorNotes?: string;
  // Meeting relationship
  meetingId?: string;
  hasMeeting: boolean;
  meetingLink?: string;
}

export interface MeetingMockData {
  _id: string;
  qaId: string;
  doctorId: string;
  userId: string;
  meetingLink: string;
  provider: 'jitsi';
  scheduledTime: string;
  actualStartTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participantCount: number;
  maxParticipants: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// =============== MOCK MEETING DATA ===============
export const mockMeetingData: MeetingMockData[] = [
  {
    _id: "meeting_001",
    qaId: "qa_001", 
    doctorId: "doctor_001",
    userId: "user_001",
    meetingLink: "https://meet.jit.si/consultation-qa001-1737782400",
    provider: "jitsi",
    scheduledTime: "2025-01-24T06:00:00.000Z",  // 13:00 VN time
    actualStartTime: undefined,
    status: "scheduled",
    participantCount: 0,
    maxParticipants: 2,
    notes: "Tư vấn về stress công việc, cần tập trung nghe và hỏi về trigger factors",
    createdAt: "2025-01-24T02:30:00.000Z",
    updatedAt: "2025-01-24T02:30:00.000Z"
  },
  {
    _id: "meeting_002",
    qaId: "qa_002",
    doctorId: "doctor_001", 
    userId: "user_002",
    meetingLink: "https://meet.jit.si/consultation-qa002-1737786000",
    provider: "jitsi",
    scheduledTime: "2025-01-24T07:00:00.000Z",  // 14:00 VN time
    actualStartTime: "2025-01-24T07:02:15.000Z",
    status: "in_progress",
    participantCount: 2,
    maxParticipants: 2,
    notes: "Meeting đang diễn ra, patient có vấn đề về anxiety",
    createdAt: "2025-01-24T03:15:00.000Z",
    updatedAt: "2025-01-24T07:02:15.000Z"
  },
  {
    _id: "meeting_003",
    qaId: "qa_003",
    doctorId: "doctor_001",
    userId: "user_003", 
    meetingLink: "https://meet.jit.si/consultation-qa003-1737789600",
    provider: "jitsi",
    scheduledTime: "2025-01-24T08:00:00.000Z",  // 15:00 VN time  
    actualStartTime: "2025-01-24T08:01:30.000Z",
    status: "completed",
    participantCount: 0,
    maxParticipants: 2,
    notes: "Tư vấn hoàn thành. Patient được khuyên: 1) Thực hành meditation 15p/ngày, 2) Tránh caffeine sau 4pm, 3) Follow-up sau 2 tuần nếu cần",
    createdAt: "2025-01-24T04:00:00.000Z", 
    updatedAt: "2025-01-24T08:45:00.000Z"
  }
];

// =============== MOCK CONSULTATION DATA ===============
export const mockConsultations: ConsultationMockData[] = [
  {
    _id: "qa_001",
    fullName: "Nguyễn Thị Lan",
    phone: "0987654321", 
    question: "Stress công việc nhiều, thường xuyên lo lắng",
    status: "scheduled",
    appointmentDate: "2025-01-24T06:00:00.000Z",
    appointmentSlot: "13:00-14:00",
    appointmentTime: "13:00-14:00",
    doctorId: "doctor_001",
    userId: "user_001",
    serviceName: "Tư vấn trực tuyến",
    patientName: "Nguyễn Thị Lan",
    patientPhone: "0987654321",
    description: "Stress công việc nhiều, thường xuyên lo lắng",
    // ✅ Meeting relationship
    meetingId: "meeting_001",
    hasMeeting: true,
    meetingLink: "https://meet.jit.si/consultation-qa001-1737782400"
  },
  {
    _id: "qa_002", 
    fullName: "Trần Văn Minh",
    phone: "0912345678",
    question: "Vấn đề tình cảm, khó ngủ", 
    status: "consulting",
    appointmentDate: "2025-01-24T07:00:00.000Z",
    appointmentSlot: "14:00-15:00",
    appointmentTime: "14:00-15:00",
    doctorId: "doctor_001",
    userId: "user_002",
    serviceName: "Tư vấn trực tuyến",
    patientName: "Trần Văn Minh",
    patientPhone: "0912345678",
    description: "Vấn đề tình cảm, khó ngủ",
    // ✅ Meeting relationship
    meetingId: "meeting_002",
    hasMeeting: true,
    meetingLink: "https://meet.jit.si/consultation-qa002-1737786000"
  },
  {
    _id: "qa_003",
    fullName: "Lê Văn Hùng",
    phone: "0923456789",
    question: "Căng thẳng trong mối quan hệ, cần lời khuyên",
    status: "completed",
    appointmentDate: "2025-01-24T08:00:00.000Z",
    appointmentSlot: "15:00-16:00",
    appointmentTime: "15:00-16:00",
    doctorId: "doctor_001",
    userId: "user_003",
    serviceName: "Tư vấn trực tuyến",
    patientName: "Lê Văn Hùng",
    patientPhone: "0923456789",
    description: "Căng thẳng trong mối quan hệ, cần lời khuyên",
    meetingId: "meeting_003",
    hasMeeting: true,
    meetingLink: "https://meet.jit.si/consultation-qa003-1737789600",
    doctorNotes: "Đã tư vấn xong. Patient cần follow-up sau 2 tuần."
  },
  {
    _id: "qa_004",
    fullName: "Lê Thị Hoa", 
    phone: "0976543210",
    question: "Cần tư vấn về mối quan hệ gia đình",
    status: "scheduled",
    appointmentDate: "2025-01-24T09:00:00.000Z",
    appointmentSlot: "16:00-17:00",
    appointmentTime: "16:00-17:00",
    doctorId: "doctor_001", 
    userId: "user_004",
    serviceName: "Tư vấn trực tuyến",
    patientName: "Lê Thị Hoa",
    patientPhone: "0976543210",
    description: "Cần tư vấn về mối quan hệ gia đình",
    // ❌ No meeting yet
    meetingId: undefined,
    hasMeeting: false
  },
  {
    _id: "qa_005",
    fullName: "Phạm Văn Nam",
    phone: "0965432109", 
    question: "Stress học tập, áp lực thi cử",
    status: "cancelled",           // ❌ CANCELLED - không thể tạo meeting
    appointmentDate: "2025-01-24T10:00:00.000Z",
    appointmentSlot: "17:00-18:00",
    appointmentTime: "17:00-18:00",
    doctorId: "doctor_001",
    userId: "user_005", 
    serviceName: "Tư vấn trực tuyến",
    patientName: "Phạm Văn Nam",
    patientPhone: "0965432109",
    description: "Stress học tập, áp lực thi cử",
    meetingId: undefined,
    hasMeeting: false,
    notes: "Đã hủy do bệnh nhân không thể tham gia"
  }
];

// =============== HELPER FUNCTIONS ===============

export const getLiveConsultations = (): ConsultationMockData[] => {
  return mockConsultations.filter(c => c.status === 'consulting');
};

export const getTodayConsultations = (): ConsultationMockData[] => {
  // Filter consultations for today
  const today = new Date().toISOString().split('T')[0];
  return mockConsultations.filter(c => 
    c.appointmentDate.startsWith(today)
  );
};

export const getScheduledConsultations = (): ConsultationMockData[] => {
  return mockConsultations.filter(c => c.status === 'scheduled');
};

export const getCompletedConsultations = (): ConsultationMockData[] => {
  return mockConsultations.filter(c => c.status === 'completed');
};

export const getCancelledConsultations = (): ConsultationMockData[] => {
  return mockConsultations.filter(c => c.status === 'cancelled');
};

export const getMeetingByQAId = (qaId: string): MeetingMockData | undefined => {
  return mockMeetingData.find(m => m.qaId === qaId);
};

export const checkConsultationHasMeeting = (qaId: string): boolean => {
  return mockMeetingData.some(m => m.qaId === qaId);
};

// =============== FORM INTERFACES ===============

export interface MeetingInputForm {
  notes: string;
  maxParticipants: number;
  // Read-only fields for display
  patientName: string;
  appointmentTime: string;
  meetingLink: string;
  scheduledTime: Date;
  status: string;
  participantCount: number;
}

export interface DoctorMeetingFormData {
  notes?: string;
  maxParticipants?: number;
  actualStartTime?: Date;
} 