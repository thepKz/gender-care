import axiosInstance from '../axiosConfig';

// ===== MERGED INTERFACES FROM BOTH FILES =====

export interface IDoctorFeedback {
  totalFeedbacks: number;
  averageRating: number;
  feedbacks: Array<{
    _id: string;
    rating: number;
    feedback: string;
    comment?: string;
    appointmentId?: any;
    createdAt: string;
  }>;
  message: string;
}

export interface IDoctorStatus {
  isActive: boolean;
  statusText: string;
  message: string;
}

// Base doctor info từ user
export interface DoctorInfo {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  gender?: string;
  address?: string;
}

// Main Doctor interface - merged và standardized
export interface Doctor {
  _id: string;
  userId: DoctorInfo;
  bio?: string;
  experience?: string | number;
  rating?: number;
  image?: string;
  specialization?: string;
  education?: string;
  certificate?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  // Enhanced fields
  feedback?: IDoctorFeedback;
  status?: IDoctorStatus;
}

// Backwards compatibility - alias cho IDoctor
export interface IDoctor extends Doctor { }

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

export interface CreateDoctorRequest {
  fullName: string;
  phone?: string;
  gender?: string;
  address?: string;
  bio?: string;
  experience?: string | number;
  image?: string;
  specialization?: string;
  education?: string;
  certificate?: string;
}

export interface UpdateDoctorRequest {
  bio?: string;
  experience?: string | number;
  image?: string;
  specialization?: string;
  education?: string;
  certificate?: string;
}

// ===== CONSOLIDATED DOCTOR API =====
export const doctorApi = {
  // ===== BASIC CRUD OPERATIONS =====

  // Lấy tất cả bác sĩ (basic info)
  getAllDoctors: async (): Promise<Doctor[]> => {
    const response = await axiosInstance.get('/doctors');
    return response.data;
  },

  // Alias cho backwards compatibility
  getAll: async (): Promise<Doctor[]> => {
    return doctorApi.getAllDoctors();
  },

  // 🆕 NEW: Lấy danh sách tất cả bác sĩ với feedback và status details  
  getAllWithDetails: async (): Promise<{ message: string; data: Doctor[]; total: number }> => {
    const response = await axiosInstance.get('/doctors/details/all');
    return response.data;
  },

  // Lấy thông tin bác sĩ theo ID (public)
  getDoctorById: async (id: string): Promise<Doctor> => {
    const response = await axiosInstance.get(`/doctors/${id}/public`);
    return response.data.data; // API trả về { success, message, data }
  },

  // Lấy thông tin bác sĩ theo ID với full access (staff only)
  getDoctorByIdFull: async (id: string): Promise<Doctor> => {
    const response = await axiosInstance.get(`/doctors/${id}`);
    return response.data;
  },

  // Alias cho compatibility
  getById: async (id: string): Promise<Doctor> => {
    return doctorApi.getDoctorByIdFull(id);
  },

  // 🆕 NEW: Lấy thông tin bác sĩ theo ID với feedback và status details
  getByIdWithDetails: async (id: string): Promise<{ message: string; data: Doctor }> => {
    const response = await axiosInstance.get(`/doctors/${id}/details`);
    return response.data;
  },

  // 🆕 NEW: Lấy chỉ feedback của doctor
  getFeedbacks: async (id: string): Promise<{ message: string; data: IDoctorFeedback }> => {
    const response = await axiosInstance.get(`/doctors/${id}/feedbacks`);
    return response.data;
  },

  // 🆕 NEW: Lấy chỉ trạng thái của doctor
  getStatus: async (id: string): Promise<{ message: string; data: IDoctorStatus }> => {
    const response = await axiosInstance.get(`/doctors/${id}/status`);
    return response.data;
  },

  // 🆕 NEW: Cập nhật trạng thái active/inactive của doctor (Manager only)
  updateStatus: async (id: string, isActive: boolean): Promise<{ message: string; data: any }> => {
    const response = await axiosInstance.put(`/doctors/${id}/status`, { isActive });
    return response.data;
  },

  // Tạo bác sĩ mới (staff only)
  createDoctor: async (doctorData: CreateDoctorRequest): Promise<Doctor> => {
    const response = await axiosInstance.post('/doctors', doctorData);
    return response.data;
  },

  // Alias cho compatibility
  create: async (doctorData: CreateDoctorRequest): Promise<Doctor> => {
    return doctorApi.createDoctor(doctorData);
  },

  // Cập nhật thông tin bác sĩ (staff only)
  updateDoctor: async (id: string, doctorData: UpdateDoctorRequest): Promise<Doctor> => {
    const response = await axiosInstance.put(`/doctors/${id}`, doctorData);
    return response.data;
  },

  // Alias cho compatibility
  update: async (id: string, doctorData: UpdateDoctorRequest): Promise<Doctor> => {
    return doctorApi.updateDoctor(id, doctorData);
  },

  // Xóa bác sĩ (staff only)
  deleteDoctor: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/doctors/${id}`);
  },

  // Alias cho compatibility
  delete: async (id: string): Promise<void> => {
    return doctorApi.deleteDoctor(id);
  },

  // ===== AVAILABILITY & SCHEDULING =====

  // Lấy bác sĩ có sẵn lịch (public)
  getAvailableDoctors: async (date?: string, timeSlot?: string): Promise<AvailableDoctor[]> => {
    const params: any = {};
    if (date) params.date = date;
    if (timeSlot) params.timeSlot = timeSlot;

    const response = await axiosInstance.get('/doctors/available', { params });
    return response.data;
  },

  // Alias cho compatibility
  getAvailable: async (date?: string, timeSlot?: string): Promise<Doctor[]> => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (timeSlot) params.append('timeSlot', timeSlot);

    const endpoint = `/doctors/available${params.toString() ? '?' + params.toString() : ''}`;
    const response = await axiosInstance.get(endpoint);
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

  // ===== STAFF ONLY OPERATIONS =====

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

  // ===== ENHANCED DOCTOR IMAGE UPLOAD =====

  /**
   * Upload doctor image to Cloudinary
   * Enhanced cho medical professional photos
   */
  uploadImage: async (formData: FormData): Promise<{ success: boolean; data: { imageUrl: string; uploadedAt: string } }> => {
    const response = await axiosInstance.post('/doctors/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // ✅ Upload progress tracking
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      }
    });
    return response.data;
  },

  // 🆕 DOCTOR: Update own profile - Doctor can only update their own profile  
  updateMyProfile: async (updateData: UpdateDoctorRequest): Promise<Doctor> => {
    const response = await axiosInstance.put('/doctors/profile/me', updateData);
    return response.data;
  },

  // 🆕 DOCTOR: Get own change requests status
  getMyChangeRequests: async (): Promise<{
    success: boolean;
    message: string;
    data: Array<{
      _id: string;
      changeType: 'bio' | 'specialization' | 'education' | 'certificate' | 'image' | 'experiences';
      currentValue: any;
      proposedValue: any;
      status: 'pending' | 'approved' | 'rejected';
      submittedAt: string;
      reviewedAt?: string;
      reviewComments?: string;
      reviewedBy?: {
        fullName: string;
        email: string;
      };
    }>;
  }> => {
    const response = await axiosInstance.get('/doctors/profile/me/change-requests');
    return response.data;
  },
};

export default doctorApi; 