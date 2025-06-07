import axiosInstance from '../axiosConfig';

// Types matching ERD structure
export interface ITimeSlot {
  _id: string;
  slotTime: string; // "07:00-08:00", "08:00-09:00", etc.
  status: 'Free' | 'Booked' | 'Unavailable';
}

export interface IWeekScheduleObject {
  _id: string;
  dayOfWeek: string; // ISO date string "2025-01-15T00:00:00.000Z" hoac date string "2025-01-15"
  slots: ITimeSlot[];
}

export interface IDoctorSchedule {
  _id: string;
  doctorId: {
    _id: string;
    userId: {
      _id: string;
      fullName: string;
      email: string;
    };
    specialization?: string;
    bio?: string;
  };
  weekSchedule: IWeekScheduleObject[];
  createdAt: string;
  updatedAt: string;
}

// Tạo lịch theo ngày cụ thể
export interface CreateScheduleByDatesRequest {
  doctorId: string;
  dates: string[]; // ["2025-01-15", "2025-01-16", ...]
  timeSlots?: string[]; // ["07:00-08:00", "08:00-09:00", ...] - optional, sẽ dùng default nếu không có
}

// Tạo lịch theo tháng
export interface CreateScheduleByMonthRequest {
  doctorId: string;
  month: number; // 1-12
  year: number;  // 2025
  timeSlots?: string[]; // optional, sẽ dùng default nếu không có
  excludeWeekends?: boolean; // default: true
}

export interface UpdateScheduleRequest {
  dayOfWeek?: string;
  slots?: {
    slotTime: string;
    status?: 'Free' | 'Booked' | 'Unavailable';
  }[];
}

// Doctor Schedule API
const doctorScheduleApi = {
  // Lấy tất cả lịch làm việc
  getAll: async (): Promise<IDoctorSchedule[]> => {
    const response = await axiosInstance.get('/doctor-schedules');
    return response.data;
  },

  // Lấy lịch làm việc theo doctor ID
  getDoctorSchedules: async (doctorId: string): Promise<IDoctorSchedule[]> => {
    const response = await axiosInstance.get(`/doctor-schedules/doctor/${doctorId}`);
    return response.data;
  },

  // Lấy lịch làm việc theo tháng
  getSchedulesByMonth: async (month: number, year: number): Promise<IDoctorSchedule[]> => {
    const response = await axiosInstance.get(`/doctor-schedules/month/${year}/${month}`);
    return response.data;
  },

  // Lấy lịch làm việc theo ID
  getById: async (id: string): Promise<IDoctorSchedule> => {
    const response = await axiosInstance.get(`/doctor-schedules/${id}`);
    return response.data;
  },

  // Tạo lịch theo ngày cụ thể
  createScheduleByDates: async (data: CreateScheduleByDatesRequest): Promise<IDoctorSchedule> => {
    const response = await axiosInstance.post('/doctor-schedules/by-dates', data);
    return response.data;
  },

  // Tạo lịch theo tháng
  createScheduleByMonth: async (data: CreateScheduleByMonthRequest): Promise<IDoctorSchedule> => {
    const response = await axiosInstance.post('/doctor-schedules/by-month', data);
    return response.data;
  },

  // Cập nhật lịch làm việc
  updateDoctorSchedule: async (id: string, data: UpdateScheduleRequest): Promise<IDoctorSchedule> => {
    const response = await axiosInstance.put(`/doctor-schedules/${id}`, data);
    return response.data;
  },

  // Xóa lịch làm việc
  deleteDoctorSchedule: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/doctor-schedules/${id}`);
  },

  // Cập nhật trạng thái slot (book/unbook)
  updateSlotStatus: async (scheduleId: string, slotId: string, status: 'Free' | 'Booked' | 'Unavailable'): Promise<IDoctorSchedule> => {
    const response = await axiosInstance.patch(`/doctor-schedules/${scheduleId}/slots/${slotId}`, {
      status
    });
    return response.data;
  },

  // Lấy thống kê lịch làm việc của doctor
  getDoctorStatistics: async (doctorId: string, startDate?: string, endDate?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const endpoint = `/doctor-schedules/doctor/${doctorId}/statistics${params.toString() ? '?' + params.toString() : ''}`;
    const response = await axiosInstance.get(endpoint);
    return response.data;
  },

  // Lấy lịch available cho booking (public)
  getAvailableSlots: async (doctorId: string, date: string): Promise<ITimeSlot[]> => {
    const response = await axiosInstance.get(`/doctor-schedules/available/${doctorId}?date=${date}`);
    return response.data;
  }
};

export default doctorScheduleApi; 