import axiosInstance from '../axiosConfig';

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

// Doctor API using existing axios system
const doctorApi = {
  // Lấy danh sách tất cả bác sĩ
  getAll: async (): Promise<IDoctor[]> => {
    const response = await axiosInstance.get('/doctors');
    return response.data;
  },

  // Lấy thông tin bác sĩ theo ID
  getById: async (id: string): Promise<IDoctor> => {
    const response = await axiosInstance.get(`/doctors/${id}`);
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