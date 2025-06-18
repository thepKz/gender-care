import axiosInstance from '../axiosConfig';

// Types để match với Backend models - Enhanced với feedback và status
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
  // New fields from enhanced API
  feedback?: IDoctorFeedback;
  status?: IDoctorStatus;
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

// Doctor API using existing axios system - Enhanced với methods mới
const doctorApi = {
  // Lấy danh sách tất cả bác sĩ (basic info)
  getAll: async (): Promise<IDoctor[]> => {
    const response = await axiosInstance.get('/doctors');
    return response.data;
  },

  // 🆕 NEW: Lấy danh sách tất cả bác sĩ với feedback và status details
  getAllWithDetails: async (): Promise<{ message: string; data: IDoctor[]; total: number }> => {
    const response = await axiosInstance.get('/doctors/details/all');
    return response.data;
  },

  // Lấy thông tin bác sĩ theo ID (basic info)
  getById: async (id: string): Promise<IDoctor> => {
    const response = await axiosInstance.get(`/doctors/${id}`);
    return response.data;
  },

  // 🆕 NEW: Lấy thông tin bác sĩ theo ID với feedback và status details
  getByIdWithDetails: async (id: string): Promise<{ message: string; data: IDoctor }> => {
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

  // Tạo bác sĩ mới
  create: async (doctorData: CreateDoctorRequest): Promise<IDoctor> => {
    const response = await axiosInstance.post('/doctors', doctorData);
    return response.data;
  },

  // Cập nhật thông tin bác sĩ
  update: async (id: string, doctorData: UpdateDoctorRequest): Promise<IDoctor> => {
    const response = await axiosInstance.put(`/doctors/${id}`, doctorData);
    return response.data;
  },

  // Xóa bác sĩ (chỉ Manager/Admin)
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/doctors/${id}`);
  },

  // Lấy bác sĩ có sẵn lịch (public)
  getAvailable: async (date?: string, timeSlot?: string): Promise<IDoctor[]> => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (timeSlot) params.append('timeSlot', timeSlot);
    
    const endpoint = `/doctors/available${params.toString() ? '?' + params.toString() : ''}`;
    const response = await axiosInstance.get(endpoint);
    return response.data;
  }
};

export default doctorApi; 