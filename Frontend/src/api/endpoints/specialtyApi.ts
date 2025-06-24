import axiosInstance from '../axiosConfig';

// Types for Specialty Management
export interface Specialty {
  _id: string;
  name: string;
  description: string;
  doctorCount: number;
  totalConsultations: number;
  monthlyRevenue: number;
  averageRating: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpecialtyRequest {
  name: string;
  description: string;
  status?: 'active' | 'inactive';
}

export interface UpdateSpecialtyRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface SpecialtyStatistics {
  totalSpecialties: number;
  totalDoctors: number;
  totalRevenue: number;
  totalConsultations: number;
  topSpecialties: Array<{
    name: string;
    doctorCount: number;
    revenue: number;
  }>;
}

// API Functions for Specialty Management
export const specialtyApi = {
  // Lấy tất cả chuyên khoa (Public & Staff)
  getAllSpecialties: async (): Promise<Specialty[]> => {
    const response = await axiosInstance.get('/specialties');
    return response.data.data || response.data;
  },

  // Lấy chuyên khoa theo ID
  getSpecialtyById: async (id: string): Promise<Specialty> => {
    const response = await axiosInstance.get(`/specialties/${id}`);
    return response.data.data || response.data;
  },

  // Tạo chuyên khoa mới (Staff/Manager/Admin only)
  createSpecialty: async (data: CreateSpecialtyRequest): Promise<Specialty> => {
    const response = await axiosInstance.post('/specialties', data);
    return response.data.data || response.data;
  },

  // Cập nhật chuyên khoa (Staff/Manager/Admin only)
  updateSpecialty: async (id: string, data: UpdateSpecialtyRequest): Promise<Specialty> => {
    const response = await axiosInstance.put(`/specialties/${id}`, data);
    return response.data.data || response.data;
  },

  // Xóa chuyên khoa (Manager/Admin only)
  deleteSpecialty: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/specialties/${id}`);
  },

  // Lấy bác sĩ theo chuyên khoa
  getDoctorsBySpecialty: async (specialtyId: string): Promise<any[]> => {
    const response = await axiosInstance.get(`/specialties/${specialtyId}/doctors`);
    return response.data.data || response.data;
  },

  // Lấy thống kê chuyên khoa (Staff/Manager/Admin only)
  getSpecialtyStatistics: async (): Promise<SpecialtyStatistics> => {
    const response = await axiosInstance.get('/specialties/statistics');
    return response.data.data || response.data;
  },

  // Lấy doanh thu theo chuyên khoa (Manager/Admin only)
  getSpecialtyRevenue: async (specialtyId: string, startDate?: string, endDate?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const endpoint = `/specialties/${specialtyId}/revenue${params.toString() ? '?' + params.toString() : ''}`;
    const response = await axiosInstance.get(endpoint);
    return response.data.data || response.data;
  },

  // Toggle trạng thái chuyên khoa (Manager/Admin only)
  toggleSpecialtyStatus: async (id: string): Promise<Specialty> => {
    const response = await axiosInstance.patch(`/specialties/${id}/toggle-status`);
    return response.data.data || response.data;
  }
};

export default specialtyApi; 