import { handleAPI } from './handleAPI';

// Types để match với Backend models
export interface ITimeSlot {
  _id: string;
  slotTime: string;
  status: 'Free' | 'Booked' | 'Absent';
}

export interface IWeekSchedule {
  _id: string;
  dayOfWeek: string; // Date as string
  slots: ITimeSlot[];
}

export interface IDoctorSchedule {
  _id: string;
  doctorId: string;
  weekSchedule: IWeekSchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleRequest {
  dayOfWeek: string;
  slots: {
    slotTime: string;
    status?: 'Free' | 'Booked' | 'Absent';
  }[];
}

export interface CreateBulkScheduleRequest {
  schedules: CreateScheduleRequest[];
}

export interface CreateBulkDaysRequest {
  startDate: string;
  endDate: string;
  timeSlots: string[];
  excludeWeekends?: boolean;
}

export interface CreateBulkMonthRequest {
  year: number;
  month: number;
  timeSlots: string[];
}

export interface UpdateSlotRequest {
  scheduleId: string;
  slotId: string;
  status: 'Free' | 'Booked' | 'Absent';
}

export interface BookSlotRequest {
  scheduleId: string;
  slotId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
}

export interface DoctorStatistics {
  doctorId: string;
  totalSlots: number;
  bookedSlots: number;
  freeSlots: number;
  absentSlots: number;
  workingDays: number;
  absentDays: number;
}

// API Functions
export const doctorScheduleAPI = {
  // ===== PUBLIC ROUTES =====
  
  // Lấy lịch làm việc của bác sĩ (chỉ Free status)
  getDoctorSchedules: async (doctorId: string, date?: string): Promise<IDoctorSchedule[]> => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    
    const endpoint = `/doctors/${doctorId}/schedules${params.toString() ? '?' + params.toString() : ''}`;
    const response = await handleAPI<IDoctorSchedule[]>(endpoint, undefined, 'GET');
    return response.data;
  },

  // Lấy slots trống theo ngày (chỉ Free status)
  getAvailableSlots: async (doctorId: string, date: string): Promise<ITimeSlot[]> => {
    const response = await handleAPI<ITimeSlot[]>(`/doctors/${doctorId}/available-slots?date=${date}`, undefined, 'GET');
    return response.data;
  },

  // ===== STAFF/MANAGER/ADMIN ROUTES =====

  // Lấy tất cả lịch bác sĩ (tất cả status) - cần auth
  getDoctorSchedulesForStaff: async (doctorId: string, date?: string): Promise<IDoctorSchedule[]> => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    
    const endpoint = `/doctors/${doctorId}/schedules/staff${params.toString() ? '?' + params.toString() : ''}`;
    const response = await handleAPI<IDoctorSchedule[]>(endpoint, undefined, 'GET');
    return response.data;
  },

  // Lấy tất cả slots theo ngày (tất cả status) - cần auth
  getAvailableSlotsForStaff: async (doctorId: string, date: string): Promise<ITimeSlot[]> => {
    const response = await handleAPI<ITimeSlot[]>(`/doctors/${doctorId}/available-slots/staff?date=${date}`, undefined, 'GET');
    return response.data;
  },

  // Lấy thống kê bác sĩ - cần auth
  getDoctorStatistics: async (doctorId: string): Promise<DoctorStatistics> => {
    const response = await handleAPI<DoctorStatistics>(`/doctors/${doctorId}/statistics`, undefined, 'GET');
    return response.data;
  },

  // Lấy thống kê tất cả bác sĩ - cần auth
  getAllDoctorsStatistics: async (): Promise<DoctorStatistics[]> => {
    const response = await handleAPI<DoctorStatistics[]>('/doctors/statistics/all', undefined, 'GET');
    return response.data;
  },

  // Tạo lịch cho bác sĩ - cần auth
  createDoctorSchedule: async (doctorId: string, scheduleData: CreateScheduleRequest): Promise<IDoctorSchedule> => {
    const response = await handleAPI<IDoctorSchedule>(`/doctors/${doctorId}/schedules`, scheduleData, 'POST');
    return response.data;
  },

  // Tạo lịch hàng loạt - cần auth
  createBulkDoctorSchedule: async (doctorId: string, scheduleData: CreateBulkScheduleRequest): Promise<IDoctorSchedule> => {
    const response = await handleAPI<IDoctorSchedule>(`/doctors/${doctorId}/schedules/bulk`, scheduleData, 'POST');
    return response.data;
  },

  // Tạo lịch hàng loạt cho nhiều ngày - Manager only
  createBulkDoctorScheduleForDays: async (doctorId: string, scheduleData: CreateBulkDaysRequest): Promise<IDoctorSchedule> => {
    const response = await handleAPI<IDoctorSchedule>(`/doctors/${doctorId}/schedules/bulk-days`, scheduleData, 'POST');
    return response.data;
  },

  // Tạo lịch hàng loạt cho cả tháng - Manager only
  createBulkDoctorScheduleForMonth: async (doctorId: string, scheduleData: CreateBulkMonthRequest): Promise<IDoctorSchedule> => {
    const response = await handleAPI<IDoctorSchedule>(`/doctors/${doctorId}/schedules/bulk-month`, scheduleData, 'POST');
    return response.data;
  },

  // Cập nhật booking status - cần auth
  updateDoctorSchedule: async (doctorId: string, updateData: UpdateSlotRequest): Promise<IDoctorSchedule> => {
    const response = await handleAPI<IDoctorSchedule>(`/doctors/${doctorId}/schedules`, updateData, 'PUT');
    return response.data;
  },

  // Book slot cho customer - Manager only
  bookSlotForCustomer: async (doctorId: string, bookingData: BookSlotRequest): Promise<IDoctorSchedule> => {
    const response = await handleAPI<IDoctorSchedule>(`/doctors/${doctorId}/book-slot`, bookingData, 'POST');
    return response.data;
  },

  // Xóa lịch bác sĩ - Manager only
  deleteDoctorSchedule: async (doctorId: string, scheduleId: string): Promise<void> => {
    await handleAPI(`/doctors/${doctorId}/schedules/${scheduleId}`, undefined, 'DELETE');
  }
};