import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào request (nếu có)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface Doctor {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
    phone?: string;
  };
  bio?: string;
  experience?: number;
  rating?: number;
  image?: string;
  specialization?: string;
  education?: string;
  certificate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorSchedule {
  _id: string;
  doctorId: string;
  weekSchedule: Array<{
    _id: string;
    dayOfWeek: string;
    slots: Array<{
      _id: string;
      slotTime: string;
      status: 'Free' | 'Booked' | 'Absent';
    }>;
  }>;
}

export interface AvailableDoctor {
  doctor: Doctor;
  availableSlots: Array<{
    _id: string;
    slotTime: string;
    status: string;
  }>;
}

// API Functions
export const doctorApi = {
  // Lấy tất cả bác sĩ (public)
  getAllDoctors: async (): Promise<Doctor[]> => {
    const response = await axiosInstance.get('/doctors');
    return response.data;
  },

  // Lấy thông tin bác sĩ theo ID (public)
  getDoctorById: async (id: string): Promise<Doctor> => {
    const response = await axiosInstance.get(`/doctors/${id}`);
    return response.data;
  },

  // Lấy lịch làm việc của bác sĩ (public - chỉ hiển thị slot Free)
  getDoctorSchedules: async (id: string): Promise<DoctorSchedule> => {
    const response = await axiosInstance.get(`/doctors/${id}/schedules`);
    return response.data;
  },

  // Lấy các slot trống theo ngày (public)
  getAvailableSlots: async (id: string, date: string): Promise<any> => {
    const response = await axiosInstance.get(`/doctors/${id}/available-slots`, {
      params: { date }
    });
    return response.data;
  },

  // Tìm bác sĩ có lịch trống (public)
  getAvailableDoctors: async (date?: string, timeSlot?: string): Promise<AvailableDoctor[]> => {
    const params: any = {};
    if (date) params.date = date;
    if (timeSlot) params.timeSlot = timeSlot;
    
    const response = await axiosInstance.get('/doctors/available', { params });
    return response.data;
  },

  // === STAFF ONLY APIs ===
  
  // Tạo bác sĩ mới (staff only)
  createDoctor: async (doctorData: Partial<Doctor>): Promise<Doctor> => {
    const response = await axiosInstance.post('/doctors', doctorData);
    return response.data;
  },

  // Cập nhật thông tin bác sĩ (staff only)
  updateDoctor: async (id: string, doctorData: Partial<Doctor>): Promise<Doctor> => {
    const response = await axiosInstance.put(`/doctors/${id}`, doctorData);
    return response.data;
  },

  // Xóa bác sĩ (staff only)
  deleteDoctor: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/doctors/${id}`);
  },

  // Tạo lịch cho bác sĩ (staff only)
  createDoctorSchedule: async (id: string, scheduleData: { date: string }): Promise<DoctorSchedule> => {
    const response = await axiosInstance.post(`/doctors/${id}/schedules`, scheduleData);
    return response.data;
  },

  // Cập nhật lịch làm việc (staff only)
  updateDoctorSchedule: async (id: string, updateData: any): Promise<DoctorSchedule> => {
    const response = await axiosInstance.put(`/doctors/${id}/schedules`, updateData);
    return response.data;
  },

  // Lấy thống kê bác sĩ (staff only)
  getDoctorStatistics: async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`/doctors/${id}/statistics`);
    return response.data;
  },

  // Lấy thống kê tất cả bác sĩ (staff only)
  getAllDoctorsStatistics: async (): Promise<any> => {
    const response = await axiosInstance.get('/doctors/statistics/all');
    return response.data;
  },

  // Book slot cho customer (staff only)
  bookSlotForCustomer: async (id: string, bookingData: any): Promise<any> => {
    const response = await axiosInstance.post(`/doctors/${id}/book-slot`, bookingData);
    return response.data;
  },

  // Tạo lịch hàng loạt (staff only)
  createBulkDoctorSchedule: async (id: string, scheduleData: { dates: string[] }): Promise<DoctorSchedule> => {
    const response = await axiosInstance.post(`/doctors/${id}/schedules/bulk`, scheduleData);
    return response.data;
  },

  // Tạo lịch hàng loạt cho nhiều ngày (staff only)
  createBulkDoctorScheduleForDays: async (id: string, dates: string[]): Promise<DoctorSchedule> => {
    const response = await axiosInstance.post(`/doctors/${id}/schedules/bulk-days`, { dates });
    return response.data;
  },

  // Tạo lịch hàng loạt cho cả tháng (staff only)
  createBulkDoctorScheduleForMonth: async (id: string, month: number, year: number): Promise<DoctorSchedule> => {
    const response = await axiosInstance.post(`/doctors/${id}/schedules/bulk-month`, { month, year });
    return response.data;
  },
};

export default doctorApi; 