// Mock Data cho Doctor Schedule
// Dựa trên interface từ DoctorMySchedulePage.tsx

// Import service types from appointment data
export type ServiceType = 
  | 'nam-khoa'           // Khám nam khoa  
  | 'phu-khoa'           // Khám phụ khoa
  | 'xet-nghiem-stis'    // Xét nghiệm STIs
  | 'xet-nghiem-stdi'    // Xét nghiệm STDi  
  | 'tu-van-online';     // Tư vấn online

export interface MockDoctorScheduleItem {
  _id: string;
  key: string;
  type: 'appointment' | 'consultation';
  patientName: string;
  patientAge: number;
  patientPhone: string;
  patientAvatar?: string;
  
  // Service information - chỉ dùng serviceName và serviceType
  serviceName?: string;
  serviceType?: ServiceType;
  servicePrice?: number;
  
  // Package information - không còn dùng
  packageName?: string;
  packagePrice?: number;
  
  // Consultation information
  consultationFee?: number;
  question?: string;
  category?: string;
  
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'consultation' | 'test';
  typeLocation: 'clinic' | 'Online';
  address?: string;
  description?: string;
  notes?: string;
  doctorNotes?: string;
  status: 'pending' | 'paid' | 'confirmed' | 'scheduled' | 'consulting' | 'completed' | 'cancelled';
  
  // Meeting info for online consultations
  meetingInfo?: {
    meetingId: string;
    meetingUrl: string;
    password?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

// Mock Data với 5 loại dịch vụ
export const mockDoctorScheduleData: MockDoctorScheduleItem[] = [
  // Khám nam khoa
  {
    _id: '674a1b23c8e9f12345678901',
    key: '674a1b23c8e9f12345678901',
    type: 'appointment',
    patientName: 'Nguyễn Văn Minh',
    patientAge: 35,
    patientPhone: '0987654321',
    patientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    serviceName: 'Khám sức khỏe định kỳ nam khoa',
    serviceType: 'nam-khoa',
    servicePrice: 500000,
    appointmentDate: '2025-01-28',
    appointmentTime: '09:00',
    appointmentType: 'consultation',
    typeLocation: 'clinic',
    status: 'confirmed',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    description: 'Khám nam khoa định kỳ, tầm soát ung thư tiền liệt tuyến',
    notes: 'Bệnh nhân có tiền sử gia đình về ung thư tiền liệt tuyến',
    createdAt: '2025-01-25T10:30:00.000Z',
    updatedAt: '2025-01-25T10:30:00.000Z'
  },
  // Khám phụ khoa  
  {
    _id: '674a1b23c8e9f12345678902',
    key: '674a1b23c8e9f12345678902',
    type: 'appointment',
    patientName: 'Trần Thị Hương Giang',
    patientAge: 36,
    patientPhone: '0976543210',
    patientAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    serviceName: 'Khám sức khỏe định kỳ phụ khoa',
    serviceType: 'phu-khoa',
    servicePrice: 450000,
    appointmentDate: '2025-01-28',
    appointmentTime: '10:30',
    appointmentType: 'consultation',
    typeLocation: 'clinic',
    status: 'paid',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    description: 'Khám phụ khoa định kỳ, tầm soát ung thư cổ tử cung',
    notes: 'Bệnh nhân có tiền sử gia đình về ung thư phụ khoa',
    createdAt: '2025-01-24T15:20:00.000Z',
    updatedAt: '2025-01-24T15:20:00.000Z'
  },
  // Xét nghiệm STIs
  {
    _id: '674a1b23c8e9f12345678903',
    key: '674a1b23c8e9f12345678903',
    type: 'appointment',
    patientName: 'Lê Thị Thanh Loan',
    patientAge: 29,
    patientPhone: '0965432109',
    patientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    serviceName: 'Xét nghiệm STIs',
    serviceType: 'xet-nghiem-stis',
    servicePrice: 800000,
    appointmentDate: '2025-01-28',
    appointmentTime: '14:00',
    appointmentType: 'test',
    typeLocation: 'clinic',
    status: 'completed',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    description: 'Xét nghiệm tầm soát các bệnh lây truyền qua đường tình dục (STIs)',
    notes: 'Kết quả sẽ có trong 3-5 ngày làm việc',
    doctorNotes: 'Kết quả bình thường, khuyên theo dõi định kỳ 6 tháng/lần',
    createdAt: '2025-01-23T09:15:00.000Z',
    updatedAt: '2025-01-26T16:30:00.000Z'
  },
  // Xét nghiệm STDi
  {
    _id: '674a1b23c8e9f12345678904',
    key: '674a1b23c8e9f12345678904',
    type: 'appointment',
    patientName: 'Phạm Thị Ngọc Anh',
    patientAge: 34,
    patientPhone: '0954321098',
    patientAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face',
    serviceName: 'Xét nghiệm STDi',
    serviceType: 'xet-nghiem-stdi',
    servicePrice: 1200000,
    appointmentDate: '2025-01-29',
    appointmentTime: '08:30',
    appointmentType: 'test',
    typeLocation: 'clinic',
    status: 'pending',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    description: 'Xét nghiệm tầm soát bệnh lây truyền qua đường tình dục nâng cao (STDi)',
    notes: 'Gói xét nghiệm mở rộng, bao gồm HIV, Hepatitis B, C',
    createdAt: '2025-01-25T14:45:00.000Z',
    updatedAt: '2025-01-25T14:45:00.000Z'
  },
  // Tư vấn online
  {
    _id: '674a1b23c8e9f12345678905',
    key: '674a1b23c8e9f12345678905',
    type: 'consultation',
    patientName: 'Võ Thị Hồng Nhung',
    patientAge: 28,
    patientPhone: '0943210987',
    patientAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face',
    serviceName: 'Tư vấn online (Google Meet)',
    serviceType: 'tu-van-online',
    consultationFee: 300000,
    question: 'Xin chào bác sĩ, em đang có triệu chứng đau bụng dưới và ra huyết bất thường. Em có thai được 6 tuần, không biết có sao không?',
    category: 'Thai kỳ',
    appointmentDate: '2025-01-28',
    appointmentTime: '15:30',
    appointmentType: 'consultation',
    typeLocation: 'Online',
    status: 'scheduled',
    description: 'Tư vấn về triệu chứng thai kỳ qua Google Meet',
    notes: 'Em có tiền sử sảy thai 1 lần',
    meetingInfo: {
      meetingId: 'meet_674a1b23c8e9f123',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      password: 'healthcare123'
    },
    createdAt: '2025-01-25T08:20:00.000Z',
    updatedAt: '2025-01-26T10:15:00.000Z'
  },
  // Thêm một số record khác để đa dạng
  {
    _id: '674a1b23c8e9f12345678906',
    key: '674a1b23c8e9f12345678906',
    type: 'appointment',
    patientName: 'Hoàng Văn Đức',
    patientAge: 42,
    patientPhone: '0921098765',
    patientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    serviceName: 'Khám sức khỏe định kỳ nam khoa',
    serviceType: 'nam-khoa',
    servicePrice: 500000,
    appointmentDate: '2025-01-30',
    appointmentTime: '09:00',
    appointmentType: 'consultation',
    typeLocation: 'clinic',
    status: 'confirmed',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    description: 'Khám nam khoa tổng quát, tầm soát các bệnh lý tiền liệt tuyến',
    notes: 'Có triệu chứng đi tiểu khó, đau vùng bụng dưới',
    createdAt: '2025-01-24T16:45:00.000Z',
    updatedAt: '2025-01-25T09:20:00.000Z'
  },
  {
    _id: '674a1b23c8e9f12345678907',
    key: '674a1b23c8e9f12345678907',
    type: 'consultation',
    patientName: 'Đỗ Thị Lan Hương',
    patientAge: 26,
    patientPhone: '0932109876',
    patientAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
    serviceName: 'Tư vấn online (Google Meet)',
    serviceType: 'tu-van-online',
    consultationFee: 250000,
    question: 'Chào bác sĩ, em muốn hỏi về việc sử dụng thuốc tránh thai. Em đang dùng viên uống nhưng thường xuyên quên, có phương pháp nào khác phù hợp không?',
    category: 'Tránh thai',
    appointmentDate: '2025-01-30',
    appointmentTime: '09:00',
    appointmentType: 'consultation',
    typeLocation: 'Online',
    status: 'pending',
    description: 'Tư vấn về phương pháp tránh thai qua Google Meet',
    notes: 'Muốn chuyển từ viên uống sang phương pháp khác',
    meetingInfo: {
      meetingId: 'meet_674a1b23c8e9f456',
      meetingUrl: 'https://meet.google.com/def-ghij-klm',
      password: 'health456'
    },
    createdAt: '2025-01-26T11:30:00.000Z',
    updatedAt: '2025-01-26T11:30:00.000Z'
  }
];

// Helper functions
export const getDoctorScheduleData = (): MockDoctorScheduleItem[] => {
  return mockDoctorScheduleData;
};

export const calculateDashboardStats = () => {
  const data = mockDoctorScheduleData;
  
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = data.filter(item => 
    item.appointmentDate === today || item.appointmentDate === '2025-01-28'
  );
  
  return {
    todayTotal: todayAppointments.length,
    completed: data.filter(item => item.status === 'completed').length,
    online: data.filter(item => item.typeLocation === 'Online').length,
    clinic: data.filter(item => item.typeLocation === 'clinic').length
  };
};

export const getStatusColor = (status: string): string => {
  const colors = {
    pending: 'orange',
    paid: 'cyan',
    confirmed: 'blue',
    scheduled: 'purple',
    consulting: 'geekblue',
    completed: 'green',
    cancelled: 'red'
  };
  return colors[status as keyof typeof colors] || 'default';
};

export const getStatusText = (status: string): string => {
  const texts = {
    pending: 'Chờ xác nhận',
    paid: 'Đã thanh toán',
    confirmed: 'Đã xác nhận',
    scheduled: 'Đã lên lịch',
    consulting: 'Đang tư vấn',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
  };
  return texts[status as keyof typeof texts] || status;
};

export const getTypeColor = (type: string, typeLocation?: string): string => {
  if (typeLocation === 'Online') return 'purple';
  return type === 'test' ? 'green' : 'blue';
};

export const getTypeText = (type: string): string => {
  const texts = {
    consultation: 'Tư vấn',
    test: 'Xét nghiệm'
  };
  return texts[type as keyof typeof texts] || type;
};

export const getLocationColor = (location: string): string => {
  const colors = {
    clinic: 'volcano',
    Online: 'geekblue'
  };
  return colors[location as keyof typeof colors] || 'default';
};

export const getLocationText = (location: string): string => {
  const texts = {
    clinic: 'Tại trung tâm',
    Online: 'Trực tuyến'
  };
  return texts[location as keyof typeof texts] || location;
}; 