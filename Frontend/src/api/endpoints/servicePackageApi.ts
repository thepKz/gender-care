import axios from 'axios';
import { 
  ServicePackage, 
  CreateServicePackageRequest, 
  UpdateServicePackageRequest, 
  ServicePackagesResponse, 
  ServicePackageResponse 
} from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth token
const servicePackageApi = axios.create({
  baseURL: `${API_BASE_URL}/service-packages`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
servicePackageApi.interceptors.request.use((config) => {
  // Try different possible token keys
  const token = localStorage.getItem('access_token') || 
                localStorage.getItem('token') || 
                localStorage.getItem('authToken');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Debug only in development
  if (import.meta.env.DEV) {
    console.log('Service Package API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token
    });
  }
  
  return config;
});

// Add response interceptor for debugging
servicePackageApi.interceptors.response.use(
  (response) => {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('Service Package API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    // Always log errors
    console.error('Service Package API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

export interface GetServicePackagesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  includeDeleted?: boolean; // For manager to view deleted packages
}

/**
 * Lấy danh sách service packages với phân trang và bộ lọc
 */
export const getServicePackages = async (params: GetServicePackagesParams = {}): Promise<ServicePackagesResponse> => {
  try {
    const response = await servicePackageApi.get('/', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách gói dịch vụ');
  }
};

/**
 * Tạo service package mới (Manager only)
 */
export const createServicePackage = async (data: CreateServicePackageRequest): Promise<ServicePackageResponse> => {
  try {
    const response = await servicePackageApi.post('/', data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      throw new Error('Tên gói dịch vụ đã tồn tại');
    }
    if (error.response?.status === 400) {
      const errors = error.response.data?.errors || {};
      const errorMessages = Object.values(errors).filter(Boolean).join(', ');
      throw new Error(errorMessages || 'Dữ liệu không hợp lệ');
    }
    throw new Error(error.response?.data?.message || 'Lỗi khi tạo gói dịch vụ');
  }
};

/**
 * Cập nhật service package (Manager only)
 */
export const updateServicePackage = async (id: string, data: UpdateServicePackageRequest): Promise<ServicePackageResponse> => {
  try {
    const response = await servicePackageApi.put(`/${id}`, data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy gói dịch vụ');
    }
    if (error.response?.status === 409) {
      throw new Error('Tên gói dịch vụ đã tồn tại');
    }
    if (error.response?.status === 400) {
      const errors = error.response.data?.errors || {};
      const errorMessages = Object.values(errors).filter(Boolean).join(', ');
      throw new Error(errorMessages || 'Dữ liệu không hợp lệ');
    }
    throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật gói dịch vụ');
  }
};

/**
 * Xóa service package (Soft delete với deleteNote, Manager only)
 */
export const deleteServicePackage = async (id: string, deleteNote: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await servicePackageApi.delete(`/${id}`, {
      data: { deleteNote }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy gói dịch vụ');
    }
    if (error.response?.status === 400) {
      const errors = error.response.data?.errors || {};
      if (errors.deleteNote) {
        throw new Error('Vui lòng nhập lý do xóa');
      }
      throw new Error(error.response.data?.message || 'Dữ liệu không hợp lệ');
    }
    throw new Error(error.response?.data?.message || 'Lỗi khi xóa gói dịch vụ');
  }
};

/**
 * Khôi phục service package đã xóa (Manager only)
 */
export const recoverServicePackage = async (id: string): Promise<ServicePackageResponse> => {
  try {
    const response = await servicePackageApi.post(`/${id}/recover`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy gói dịch vụ hoặc gói dịch vụ chưa bị xóa');
    }
    if (error.response?.status === 409) {
      throw new Error('Không thể khôi phục. Đã tồn tại gói dịch vụ khác có cùng tên');
    }
    if (error.response?.status === 400) {
      throw new Error('Không thể khôi phục. Một số dịch vụ trong gói đã bị xóa');
    }
    throw new Error(error.response?.data?.message || 'Lỗi khi khôi phục gói dịch vụ');
  }
}; 