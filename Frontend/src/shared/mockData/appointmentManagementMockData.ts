// Mock Data cho Appointment Management
// Dựa trên interface Appointment từ AppointmentManagement.tsx

// Define service types
export type ServiceType = 
  | 'nam-khoa'           // Khám nam khoa  
  | 'phu-khoa'           // Khám phụ khoa
  | 'xet-nghiem-stis'    // Xét nghiệm STIs
  | 'xet-nghiem-stdi'    // Xét nghiệm STDi  
  | 'tu-van-online';     // Tư vấn online

export interface MockAppointment {
  key: string;
  _id: string;
  profileId: string;
  patientName: string;
  patientPhone: string;
  serviceId: string;
  serviceName: string;
  serviceType?: ServiceType;
  doctorId?: string;
  doctorName?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'consultation' | 'test';
  typeLocation: 'clinic' | 'Online';
  address?: string;
  description: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export const mockAppointmentsData: MockAppointment[] = [
  {
    key: '674a1b23c8e9f12345678901',
    _id: '674a1b23c8e9f12345678901',
    profileId: '674a1b23c8e9f12345678abc',
    patientName: 'Nguyễn Thị Minh Châu',
    patientPhone: '0987654321',
    serviceId: '674a1b23c8e9f12345678def',
    serviceName: 'Khám sức khỏe định kỳ nam khoa',
    serviceType: 'nam-khoa',
    doctorId: '674a1b23c8e9f12345678doc1',
    doctorName: 'BS. Lê Thị Hương',
    appointmentDate: '2025-01-28',
    appointmentTime: '09:00',
    appointmentType: 'consultation',
    typeLocation: 'clinic',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    description: 'Khám sức khỏe nam khoa định kỳ, tầm soát ung thư tiền liệt tuyến',
    notes: 'Bệnh nhân có tiền sử gia đình về ung thư tiền liệt tuyến',
    status: 'confirmed',
    createdAt: '2025-01-25',
    updatedAt: '2025-01-25'
  },
  {
    key: '674a1b23c8e9f12345678902',
    _id: '674a1b23c8e9f12345678902',
    profileId: '674a1b23c8e9f12345678bcd',
    patientName: 'Trần Thị Hương Giang',
    patientPhone: '0976543210',
    serviceId: '674a1b23c8e9f12345678ghi',
    serviceName: 'Khám sức khỏe định kỳ phụ khoa',
    serviceType: 'phu-khoa',
    doctorId: '674a1b23c8e9f12345678doc2',
    doctorName: 'BS. Nguyễn Văn Khoa',
    appointmentDate: '2025-01-28',
    appointmentTime: '10:30',
    appointmentType: 'consultation',
    typeLocation: 'clinic',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    description: 'Khám phụ khoa định kỳ, tầm soát ung thư cổ tử cung',
    notes: 'Bệnh nhân có tiền sử gia đình về ung thư phụ khoa',
    status: 'confirmed',
    createdAt: '2025-01-24',
    updatedAt: '2025-01-24'
  },
  {
    key: '674a1b23c8e9f12345678903',
    _id: '674a1b23c8e9f12345678903',
    profileId: '674a1b23c8e9f12345678cde',
    patientName: 'Lê Thị Thanh Loan',
    patientPhone: '0965432109',
    serviceId: '674a1b23c8e9f12345678jkl',
    serviceName: 'Xét nghiệm STIs',
    serviceType: 'xet-nghiem-stis',
    doctorId: '674a1b23c8e9f12345678doc3',
    doctorName: 'BS. Phạm Thị Mai',
    appointmentDate: '2025-01-28',
    appointmentTime: '14:00',
    appointmentType: 'test',
    typeLocation: 'clinic',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    description: 'Xét nghiệm tầm soát các bệnh lây truyền qua đường tình dục (STIs)',
    notes: 'Kết quả sẽ có trong 3-5 ngày làm việc',
    status: 'completed',
    createdAt: '2025-01-23',
    updatedAt: '2025-01-26'
  },
  {
    key: '674a1b23c8e9f12345678904',
    _id: '674a1b23c8e9f12345678904',
    profileId: '674a1b23c8e9f12345678def',
    patientName: 'Phạm Thị Ngọc Anh',
    patientPhone: '0954321098',
    serviceId: '674a1b23c8e9f12345678mno',
    serviceName: 'Xét nghiệm STDi',
    serviceType: 'xet-nghiem-stdi',
    doctorId: '674a1b23c8e9f12345678doc1',
    doctorName: 'BS. Lê Thị Hương',
    appointmentDate: '2025-01-29',
    appointmentTime: '08:30',
    appointmentType: 'test',
    typeLocation: 'clinic',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    description: 'Xét nghiệm tầm soát bệnh lây truyền qua đường tình dục nâng cao (STDi)',
    notes: 'Gói xét nghiệm mở rộng, bao gồm HIV, Hepatitis B, C',
    status: 'pending',
    createdAt: '2025-01-25',
    updatedAt: '2025-01-25'
  },
  {
    key: '674a1b23c8e9f12345678905',
    _id: '674a1b23c8e9f12345678905',
    profileId: '674a1b23c8e9f12345678efg',
    patientName: 'Vũ Thị Lan Anh',
    patientPhone: '0943210987',
    serviceId: '674a1b23c8e9f12345678pqr',
    serviceName: 'Tư vấn online (Google Meet)',
    serviceType: 'tu-van-online',
    doctorId: '674a1b23c8e9f12345678doc2',
    doctorName: 'BS. Nguyễn Văn Khoa',
    appointmentDate: '2025-01-30',
    appointmentTime: '15:00',
    appointmentType: 'consultation',
    typeLocation: 'Online',
    description: 'Tư vấn sức khỏe sinh sản và kế hoạch hóa gia đình qua Google Meet',
    notes: 'Tư vấn về các phương pháp tránh thai an toàn',
    status: 'pending',
    createdAt: '2025-01-26',
    updatedAt: '2025-01-26'
  },
  {
    key: '674a1b23c8e9f12345678906',
    _id: '674a1b23c8e9f12345678906',
    profileId: '674a1b23c8e9f12345678fgh',
    patientName: 'Đỗ Thị Bích Ngọc',
    patientPhone: '0932109876',
    serviceId: '674a1b23c8e9f12345678def',
    serviceName: 'Khám sức khỏe định kỳ nam khoa',
    serviceType: 'nam-khoa',
    doctorId: '674a1b23c8e9f12345678doc3',
    doctorName: 'BS. Phạm Thị Mai',
    appointmentDate: '2025-01-27',
    appointmentTime: '11:00',
    appointmentType: 'consultation',
    typeLocation: 'clinic',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    description: 'Khám nam khoa tổng quát, tầm soát các bệnh lý tiền liệt tuyến',
    notes: 'Có triệu chứng đi tiểu khó, đau vùng bụng dưới',
    status: 'completed',
    createdAt: '2025-01-24',
    updatedAt: '2025-01-27'
  },
  {
    key: '674a1b23c8e9f12345678907',
    _id: '674a1b23c8e9f12345678907',
    profileId: '674a1b23c8e9f12345678ghi',
    patientName: 'Hoàng Thị Thu Hà',
    patientPhone: '0921098765',
    serviceId: '674a1b23c8e9f12345678pqr',
    serviceName: 'Tư vấn online (Google Meet)',
    serviceType: 'tu-van-online',
    doctorId: '674a1b23c8e9f12345678doc4',
    doctorName: 'BS. Trần Văn Nam',
    appointmentDate: '2025-01-31',
    appointmentTime: '16:30',
    appointmentType: 'consultation',
    typeLocation: 'Online',
    description: 'Tư vấn về sức khỏe sinh sản và dinh dưỡng thai kỳ qua Google Meet',
    notes: 'Cặp vợ chồng chuẩn bị mang thai, cần tư vấn dinh dưỡng',
    status: 'pending',
    createdAt: '2025-01-27',
    updatedAt: '2025-01-27'
  },
  {
    key: '674a1b23c8e9f12345678908',
    _id: '674a1b23c8e9f12345678908',
    profileId: '674a1b23c8e9f12345678hij',
    patientName: 'Ngô Thị Minh Trang',
    patientPhone: '0910987654',
    serviceId: '674a1b23c8e9f12345678jkl',
    serviceName: 'Xét nghiệm STIs',
    serviceType: 'xet-nghiem-stis',
    doctorId: '674a1b23c8e9f12345678doc5',
    doctorName: 'BS. Lý Thị Nga',
    appointmentDate: '2025-01-29',
    appointmentTime: '13:00',
    appointmentType: 'test',
    typeLocation: 'clinic',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    description: 'Xét nghiệm tầm soát STIs để đảm bảo sức khỏe sinh sản',
    notes: 'Chuẩn bị mang thai, cần kiểm tra sức khỏe toàn diện',
    status: 'confirmed',
    createdAt: '2025-01-26',
    updatedAt: '2025-01-26'
  },
  {
    key: '674a1b23c8e9f12345678909',
    _id: '674a1b23c8e9f12345678909',
    profileId: '674a1b23c8e9f12345678ijk',
    patientName: 'Bùi Thị Thanh Hương',
    patientPhone: '0909876543',
    serviceId: '674a1b23c8e9f12345678ghi',
    serviceName: 'Khám sức khỏe định kỳ phụ khoa',
    serviceType: 'phu-khoa',
    doctorId: '674a1b23c8e9f12345678doc3',
    doctorName: 'BS. Phạm Thị Mai',
    appointmentDate: '2025-01-30',
    appointmentTime: '09:30',
    appointmentType: 'consultation',
    typeLocation: 'clinic',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    description: 'Khám phụ khoa định kỳ và điều trị viêm nhiễm phụ khoa',
    notes: 'Có triệu chứng ngứa, khí hư bất thường',
    status: 'pending',
    createdAt: '2025-01-27',
    updatedAt: '2025-01-27'
  },
  {
    key: '674a1b23c8e9f12345678910',
    _id: '674a1b23c8e9f12345678910',
    profileId: '674a1b23c8e9f12345678jkl',
    patientName: 'Lương Thị Hồng Nhung',
    patientPhone: '0898765432',
    serviceId: '674a1b23c8e9f12345678mno',
    serviceName: 'Xét nghiệm STDi',
    serviceType: 'xet-nghiem-stdi',
    doctorId: '674a1b23c8e9f12345678doc1',
    doctorName: 'BS. Lê Thị Hương',
    appointmentDate: '2025-01-28',
    appointmentTime: '17:00',
    appointmentType: 'test',
    typeLocation: 'clinic',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    description: 'Xét nghiệm STDi toàn diện cho cặp vợ chồng',
    notes: 'Cặp vợ chồng chuẩn bị mang thai, cần xét nghiệm đầy đủ',
    status: 'cancelled',
    createdAt: '2025-01-25',
    updatedAt: '2025-01-27'
  }
];

// Helper functions
export const getAppointmentStatusColor = (status: string): string => {
  const colors = {
    pending: 'orange',
    confirmed: 'blue',
    completed: 'green',
    cancelled: 'red'
  };
  return colors[status as keyof typeof colors] || 'default';
};

export const getAppointmentStatusText = (status: string): string => {
  const texts = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
  };
  return texts[status as keyof typeof texts] || status;
};

export const getAppointmentTypeColor = (type: string): string => {
  const colors = {
    consultation: 'blue',
    test: 'green',
    other: 'purple'
  };
  return colors[type as keyof typeof colors] || 'default';
};

export const getAppointmentTypeText = (type: string): string => {
  const texts = {
    consultation: 'Tư vấn',
    test: 'Xét nghiệm',
    other: 'Khác'
  };
  return texts[type as keyof typeof texts] || type;
};

export const getAppointmentLocationColor = (location: string): string => {
  const colors = {
    clinic: 'volcano',
    home: 'cyan',
    Online: 'geekblue'
  };
  return colors[location as keyof typeof colors] || 'default';
};

export const getAppointmentLocationText = (location: string): string => {
  const texts = {
    clinic: 'Tại trung tâm',
    Online: 'Trực tuyến'
  };
  return texts[location as keyof typeof texts] || location;
};

// Service type helper functions
export const getServiceTypeColor = (serviceType: ServiceType): string => {
  const colors = {
    'nam-khoa': 'blue',
    'phu-khoa': 'pink',
    'xet-nghiem-stis': 'green',
    'xet-nghiem-stdi': 'orange',
    'tu-van-online': 'purple'
  };
  return colors[serviceType] || 'default';
};

export const getServiceTypeText = (serviceType: ServiceType): string => {
  const texts = {
    'nam-khoa': 'Khám nam khoa',
    'phu-khoa': 'Khám phụ khoa', 
    'xet-nghiem-stis': 'Xét nghiệm STIs',
    'xet-nghiem-stdi': 'Xét nghiệm STDi',
    'tu-van-online': 'Tư vấn online'
  };
  return texts[serviceType] || serviceType;
};

// Get allowed locations for service type
export const getAllowedLocations = (serviceType: ServiceType): string[] => {
  const allowedLocations = {
    'nam-khoa': ['clinic'],
    'phu-khoa': ['clinic'],
    'xet-nghiem-stis': ['clinic'],
    'xet-nghiem-stdi': ['clinic'],
    'tu-van-online': ['Online']
  };
  return allowedLocations[serviceType] || ['clinic'];
}; 