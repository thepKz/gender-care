import { handleAPI } from './handleAPI';

// Types để match với Backend models
export interface IDoctor {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatar?: string;
    isActive: boolean;
    role: string;
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

// 🆕 NEW: Enhanced types for feedback and status
export interface IDoctorFeedback {
  totalCount: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  feedbacks: Array<{
    _id: string;
    rating: number;
    comment: string;
    customerName: string;
    createdAt: string;
  }>;
  message: string;
}

export interface IDoctorStatus {
  isActive: boolean;
  statusText: string;
  message: string;
}

// Enhanced doctor with feedback and status
export interface IDoctorWithDetails extends IDoctor {
  feedback: IDoctorFeedback;
  status: IDoctorStatus;
}

export interface CreateDoctorRequest {
  userId: string;
  bio?: string;
  experience?: number;
  image?: string;
  specialization?: string;
  education?: string;
  certificate?: string;
}

export interface UpdateDoctorRequest {
  bio?: string;
  experience?: number;
  image?: string;
  specialization?: string;
  education?: string;
  certificate?: string;
}

// API Functions
export const doctorAPI = {
  // Lấy danh sách tất cả bác sĩ (basic)
  getAll: async (): Promise<IDoctor[]> => {
    const response = await handleAPI<IDoctor[]>('/doctors', undefined, 'GET');
    return response.data;
  },

  // 🆕 NEW: Lấy danh sách tất cả bác sĩ với feedback và status details
  getAllWithDetails: async (): Promise<IDoctorWithDetails[]> => {
    const response = await handleAPI<{
      message: string;
      data: IDoctorWithDetails[];
      total: number;
    }>('/doctors/details/all', undefined, 'GET');
    return response.data.data;
  },

  // Lấy thông tin bác sĩ theo ID (basic)
  getById: async (id: string): Promise<IDoctor> => {
    const response = await handleAPI<IDoctor>(`/doctors/${id}`, undefined, 'GET');
    return response.data;
  },

  // 🆕 NEW: Lấy thông tin bác sĩ theo ID với feedback và status details
  getByIdWithDetails: async (id: string): Promise<IDoctorWithDetails> => {
    const response = await handleAPI<{
      message: string;
      data: IDoctorWithDetails;
    }>(`/doctors/${id}/details`, undefined, 'GET');
    return response.data.data;
  },

  // 🆕 NEW: Lấy chỉ feedback của doctor
  getDoctorFeedbacks: async (id: string): Promise<IDoctorFeedback> => {
    const response = await handleAPI<{
      message: string;
      data: IDoctorFeedback;
    }>(`/doctors/${id}/feedbacks`, undefined, 'GET');
    return response.data.data;
  },

  // 🆕 NEW: Lấy chỉ trạng thái active của doctor
  getDoctorStatus: async (id: string): Promise<IDoctorStatus> => {
    const response = await handleAPI<{
      message: string;
      data: IDoctorStatus;
    }>(`/doctors/${id}/status`, undefined, 'GET');
    return response.data.data;
  },

  // 🆕 NEW: Cập nhật trạng thái active/inactive của doctor (MANAGER ONLY)
  updateDoctorStatus: async (id: string, isActive: boolean): Promise<IDoctorStatus> => {
    const response = await handleAPI<{
      message: string;
      data: IDoctorStatus;
    }>(`/doctors/${id}/status`, { isActive }, 'PUT');
    return response.data.data;
  },

  // Tạo bác sĩ mới
  create: async (doctorData: CreateDoctorRequest): Promise<IDoctor> => {
    const response = await handleAPI<IDoctor>('/doctors', doctorData, 'POST');
    return response.data;
  },

  // Cập nhật thông tin bác sĩ
  update: async (id: string, doctorData: UpdateDoctorRequest): Promise<IDoctor> => {
    const response = await handleAPI<IDoctor>(`/doctors/${id}`, doctorData, 'PUT');
    return response.data;
  },

  // Xóa bác sĩ (chỉ Manager/Admin)
  delete: async (id: string): Promise<void> => {
    await handleAPI(`/doctors/${id}`, undefined, 'DELETE');
  },

  // Lấy bác sĩ có sẵn lịch (public)
  getAvailable: async (date?: string, timeSlot?: string): Promise<IDoctor[]> => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (timeSlot) params.append('timeSlot', timeSlot);
    
    const endpoint = `/doctors/available${params.toString() ? '?' + params.toString() : ''}`;
    const response = await handleAPI<IDoctor[]>(endpoint, undefined, 'GET');
    return response.data;
  }
}; 