// Mock data cho 4 bác sĩ và lịch làm việc
// Mỗi bác sĩ làm từ thứ 2 đến thứ 6, mỗi ngày 8 slot: 7-8, 8-9, 9-10, 10-11, 13-14, 14-15, 15-16, 16-17

export interface DoctorProfile {
  _id: string; // Changed from id to _id to match MongoDB
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatar?: string;
    role: string;
    emailVerified: boolean;
    isActive: boolean;
    gender?: string;
    address?: string;
    year?: string; // Changed from Date to string for display
  };
  bio?: string;
  experience?: number;
  rating?: number;
  specialization?: string;
  education?: string;
  certificate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  _id: string;
  slotTime: string;
  status: 'Free' | 'Booked' | 'Absent';
}

export interface WeekSchedule {
  _id: string;
  dayOfWeek: Date; // Changed to Date to match backend model
  slots: TimeSlot[];
}

export interface DoctorSchedule {
  _id: string;
  doctorId: string; // Reference to Doctor._id, not User._id
  weekSchedule: WeekSchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface DoctorStatistics {
  doctorId: string;
  name: string;
  bookedSlots: number;
  absentSlots: number;
  absentDays: number;
  totalSlots: number;
  workingDays: number;
  completedConsultations: number;
  averageRating: number;
  monthlyRevenue: number;
}

// Khung giờ làm việc cố định
export const TIME_SLOTS = [
  '07:00-08:00',
  '08:00-09:00', 
  '09:00-10:00',
  '10:00-11:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00'
];

// Hàm tạo slot cho một ngày
const generateDaySlots = (dayStatus: 'working' | 'absent' = 'working'): TimeSlot[] => {
  return TIME_SLOTS.map((timeSlot, index) => ({
    _id: `slot_${Math.random().toString(36).substr(2, 9)}`,
    slotTime: timeSlot,
    status: dayStatus === 'absent' ? 'Absent' : 
           Math.random() < 0.3 ? 'Booked' : 'Free' // 30% chance booked
  }));
};

// Hàm tạo lịch làm việc cho một tuần (thứ 2-6)
const generateWeekSchedule = (startDate: Date, doctorId: string): WeekSchedule[] => {
  const schedule: WeekSchedule[] = [];
  
  // Tạo lịch cho thứ 2-6 (5 ngày)
  for (let i = 0; i < 5; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    // Randomly có thể nghỉ 1 ngày (5% chance)
    const isAbsent = Math.random() < 0.05;
    
    schedule.push({
      _id: `week_${doctorId}_${i}`,
      dayOfWeek: date, // Now using Date object directly
      slots: generateDaySlots(isAbsent ? 'absent' : 'working')
    });
  }
  
  return schedule;
};

// Mock data cho 4 bác sĩ
export const MOCK_DOCTORS: DoctorProfile[] = [
  {
    _id: 'doctor_001',
    userId: {
      _id: 'user_doctor_001',
      fullName: 'BS. Nguyễn Thị Hoa',
      email: 'bs.hoa@genderhealthcare.com',
      phone: '0901234567',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
      role: 'doctor',
      emailVerified: true,
      isActive: true,
      gender: 'female',
      address: 'Hà Nội',
      year: '1988'
    },
    bio: 'Bác sĩ chuyên khoa Phụ sản với hơn 8 năm kinh nghiệm trong lĩnh vực chăm sóc sức khỏe sinh sản phụ nữ. Tốt nghiệp xuất sắc từ Đại học Y Hà Nội.',
    experience: 8,
    rating: 4.8,
    specialization: 'Phụ sản',
    education: 'Thạc sĩ Y học - Đại học Y Hà Nội (2016)',
    certificate: 'Chứng chỉ hành nghề số: BS-2016-HN-001234',
    createdAt: '2024-01-15T09:00:00.000Z',
    updatedAt: '2024-01-20T14:30:00.000Z'
  },
  {
    _id: 'doctor_002', 
    userId: {
      _id: 'user_doctor_002',
      fullName: 'BS. Trần Văn Minh',
      email: 'bs.minh@genderhealthcare.com',
      phone: '0902345678',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
      role: 'doctor',
      emailVerified: true,
      isActive: true,
      gender: 'male',
      address: 'TP.HCM',
      year: '1992'
    },
    bio: 'Chuyên gia tư vấn sức khỏe tình dục và sinh sản, có kinh nghiệm 6 năm điều trị các vấn đề về nội tiết tố và rối loạn kinh nguyệt.',
    experience: 6,
    rating: 4.6,
    specialization: 'Nội tiết sinh sản',
    education: 'Bác sĩ Y khoa - Đại học Y Dược TP.HCM (2018)',
    certificate: 'Chứng chỉ hành nghề số: BS-2018-HCM-002345',
    createdAt: '2024-01-10T08:15:00.000Z',
    updatedAt: '2024-01-18T16:45:00.000Z'
  },
  {
    _id: 'doctor_003',
    userId: {
      _id: 'user_doctor_003', 
      fullName: 'BS. Lê Thị Mai',
      email: 'bs.mai@genderhealthcare.com',
      phone: '0903456789',
      avatar: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=400&h=400&fit=crop&crop=face',
      role: 'doctor', 
      emailVerified: true,
      isActive: true,
      gender: 'female',
      address: 'Hà Nội',
      year: '1990'
    },
    bio: 'Bác sĩ chuyên về tâm lý học lâm sàng và tư vấn sức khỏe tình dục. Có chuyên môn sâu về liệu pháp tâm lý cho phụ nữ.',
    experience: 5,
    rating: 4.9,
    specialization: 'Tâm lý học lâm sàng',
    education: 'Tiến sĩ Tâm lý học - Đại học Quốc gia Hà Nội (2019)',
    certificate: 'Chứng chỉ hành nghề số: BS-2019-HN-003456',
    createdAt: '2024-01-12T10:30:00.000Z',
    updatedAt: '2024-01-22T11:20:00.000Z'
  },
  {
    _id: 'doctor_004',
    userId: {
      _id: 'user_doctor_004',
      fullName: 'BS. Phạm Thị Lan',
      email: 'bs.lan@genderhealthcare.com', 
      phone: '0904567890',
      avatar: 'https://images.unsplash.com/photo-1594824804732-ca8db32779a8?w=400&h=400&fit=crop&crop=face',
      role: 'doctor',
      emailVerified: true,
      isActive: true,
      gender: 'female',
      address: 'Đà Nẵng',
      year: '1995'
    },
    bio: 'Chuyên gia dinh dưỡng và sức khỏe sinh sản, tập trung vào tư vấn lối sống lành mạnh và chế độ ăn uống cho phụ nữ.',
    experience: 4,
    rating: 4.7,
    specialization: 'Dinh dưỡng & Sức khỏe sinh sản',
    education: 'Thạc sĩ Dinh dưỡng - Đại học Y tế Công cộng (2020)',
    certificate: 'Chứng chỉ hành nghề số: BS-2020-HN-004567',
    createdAt: '2024-01-08T07:45:00.000Z',
    updatedAt: '2024-01-25T09:15:00.000Z'
  }
];

// Tạo lịch làm việc cho từng bác sĩ (3 tuần gần đây)
export const MOCK_DOCTOR_SCHEDULES: DoctorSchedule[] = MOCK_DOCTORS.map((doctor, index) => {
  const schedules: WeekSchedule[] = [];
  
  // Tạo lịch cho 3 tuần (tuần trước, tuần này, tuần sau)
  for (let week = -1; week <= 1; week++) {
    const monday = new Date();
    monday.setDate(monday.getDate() - monday.getDay() + 1 + (week * 7)); // Tìm thứ 2 của tuần
    
    const weekSchedule = generateWeekSchedule(monday, doctor._id);
    schedules.push(...weekSchedule);
  }
  
  return {
    _id: `schedule_${doctor._id}`,
    doctorId: doctor._id,
    weekSchedule: schedules,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  };
});

// Tính thống kê cho từng bác sĩ
export const MOCK_DOCTOR_STATISTICS: DoctorStatistics[] = MOCK_DOCTORS.map((doctor, index) => {
  const schedule = MOCK_DOCTOR_SCHEDULES.find(s => s.doctorId === doctor._id);
  const totalSlots = schedule?.weekSchedule.reduce((sum, day) => sum + day.slots.length, 0) || 0;
  const bookedSlots = schedule?.weekSchedule.reduce((sum, day) => 
    sum + day.slots.filter(slot => slot.status === 'Booked').length, 0) || 0;
  const absentSlots = schedule?.weekSchedule.reduce((sum, day) => 
    sum + day.slots.filter(slot => slot.status === 'Absent').length, 0) || 0;
  
  // Tính số ngày nghỉ (ngày có tất cả 8 slot = Absent)
  const absentDays = schedule?.weekSchedule.filter(day => 
    day.slots.every(slot => slot.status === 'Absent')).length || 0;
  
  const workingDays = (schedule?.weekSchedule.length || 0) - absentDays;
  
  return {
    doctorId: doctor._id,
    name: doctor.userId.fullName,
    bookedSlots,
    absentSlots,
    absentDays,
    totalSlots,
    workingDays,
    completedConsultations: bookedSlots - Math.floor(Math.random() * 5), // Giả sử hầu hết đã hoàn thành
    averageRating: doctor.rating || 0,
    monthlyRevenue: bookedSlots * 200000 + Math.floor(Math.random() * 1000000) // 200k/slot + random bonus
  };
});

// Mock data cho các chuyên khoa
export const MOCK_SPECIALTIES = [
  {
    id: 'specialty_001',
    name: 'Phụ sản',
    description: 'Chuyên khoa về sức khỏe sinh sản, thai sản và phụ khoa',
    doctorCount: 1,
    isActive: true
  },
  {
    id: 'specialty_002', 
    name: 'Nội tiết sinh sản',
    description: 'Điều trị các rối loạn nội tiết tố và vấn đề sinh sản',
    doctorCount: 1,
    isActive: true
  },
  {
    id: 'specialty_003',
    name: 'Tâm lý học lâm sàng', 
    description: 'Tư vấn và điều trị các vấn đề tâm lý, sức khỏe tình dục',
    doctorCount: 1,
    isActive: true
  },
  {
    id: 'specialty_004',
    name: 'Dinh dưỡng & Sức khỏe sinh sản',
    description: 'Tư vấn dinh dưỡng và lối sống lành mạnh cho phụ nữ',
    doctorCount: 1,
    isActive: true
  }
];

// Hàm helper để lấy lịch làm việc của bác sĩ theo ngày
export const getDoctorScheduleByDate = (doctorId: string, date: string): WeekSchedule | undefined => {
  const schedule = MOCK_DOCTOR_SCHEDULES.find(s => s.doctorId === doctorId);
  return schedule?.weekSchedule.find(day => 
    day.dayOfWeek.toISOString().substring(0, 10) === date
  );
};

// Hàm helper để lấy slot trống của bác sĩ
export const getAvailableSlots = (doctorId: string, date: string): TimeSlot[] => {
  const daySchedule = getDoctorScheduleByDate(doctorId, date);
  return daySchedule?.slots.filter(slot => slot.status === 'Free') || [];
};

// Hàm helper để book slot
export const bookSlot = (doctorId: string, date: string, slotId: string): boolean => {
  const schedule = MOCK_DOCTOR_SCHEDULES.find(s => s.doctorId === doctorId);
  const daySchedule = schedule?.weekSchedule.find(day => 
    day.dayOfWeek.toISOString().substring(0, 10) === date
  );
  const slot = daySchedule?.slots.find(s => s._id === slotId);
  
  if (slot && slot.status === 'Free') {
    slot.status = 'Booked';
    return true;
  }
  return false;
};

// Backward compatibility - legacy export format
export const doctorMockData = {
  doctors: MOCK_DOCTORS.map(doctor => ({
    id: doctor._id,
    name: doctor.userId.fullName,
    specialty: doctor.specialization,
    avatar: doctor.userId.avatar,
    experience: doctor.experience,
    rating: doctor.rating,
    patients: Math.floor(Math.random() * 200) + 50,
    consultations: Math.floor(Math.random() * 300) + 100
  })),
  timeSlots: TIME_SLOTS,
  generateSchedulesForDateRange: (startDate: string, endDate: string) => {
    const schedules: any[] = [];
    MOCK_DOCTOR_SCHEDULES.forEach(doctorSchedule => {
      doctorSchedule.weekSchedule.forEach(weekDay => {
        const date = weekDay.dayOfWeek.toISOString().substring(0, 10);
        if (date >= startDate && date <= endDate) {
          schedules.push({
            date,
            doctorId: doctorSchedule.doctorId,
            slots: weekDay.slots.map(slot => ({
              id: slot._id,
              time: slot.slotTime,
              status: slot.status,
              patientName: slot.status === 'Booked' ? 'Bệnh nhân ABC' : undefined
            }))
          });
        }
      });
    });
    return schedules;
  }
};

export default {
  MOCK_DOCTORS,
  MOCK_DOCTOR_SCHEDULES, 
  MOCK_DOCTOR_STATISTICS,
  MOCK_SPECIALTIES,
  TIME_SLOTS,
  getDoctorScheduleByDate,
  getAvailableSlots,
  bookSlot
}; 