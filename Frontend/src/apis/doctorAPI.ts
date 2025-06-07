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
  specialization?: string;
  education?: string;
  certificate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDoctorRequest {
  userId: string;
  bio?: string;
  experience?: number;
  specialization?: string;
  education?: string;
  certificate?: string;
}

export interface UpdateDoctorRequest {
  bio?: string;
  experience?: number;
  specialization?: string;
  education?: string;
  certificate?: string;
}

// API Functions
export const doctorAPI = {
  // Lấy danh sách tất cả bác sĩ
  getAll: async (): Promise<IDoctor[]> => {
    const response = await handleAPI<IDoctor[]>('/doctors', undefined, 'GET');
    return response.data;
  },

  // Lấy thông tin bác sĩ theo ID
  getById: async (id: string): Promise<IDoctor> => {
    const response = await handleAPI<IDoctor>(`/doctors/${id}`, undefined, 'GET');
    return response.data;
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