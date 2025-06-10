import axios from 'axios';
import { 
  Service, 
  CreateServiceRequest, 
  UpdateServiceRequest, 
  ServicesResponse, 
  ServiceResponse 
} from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with auth token
const serviceApi = axios.create({
  baseURL: `${API_BASE_URL}/services`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
serviceApi.interceptors.request.use((config) => {
  // Try different possible token keys
  const token = localStorage.getItem('access_token') || 
                localStorage.getItem('token') || 
                localStorage.getItem('authToken');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log('API Request:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenPrefix: token ? token.substring(0, 20) + '...' : 'no token'
  });
  
  return config;
});

// Add response interceptor for debugging
serviceApi.interceptors.response.use(
  (response) => {
    console.log('API Response success:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

export interface GetServicesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  serviceType?: 'consultation' | 'test' | 'treatment' | 'other';
  availableAt?: 'Athome' | 'Online' | 'Center';
  search?: string;
  includeDeleted?: boolean; // For manager to view deleted services
}

/**
 * Lấy danh sách services với phân trang và bộ lọc
 */
export const getServices = async (params: GetServicesParams = {}): Promise<ServicesResponse> => {
  try {
    const response = await serviceApi.get('/', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách dịch vụ');
  }
};

/**
 * Tạo service mới (Manager only)
 */
export const createService = async (data: CreateServiceRequest): Promise<ServiceResponse> => {
  try {
    const response = await serviceApi.post('/', data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      throw new Error('Tên dịch vụ đã tồn tại');
    }
    if (error.response?.status === 400) {
      const errors = error.response.data?.errors || {};
      const errorMessages = Object.values(errors).filter(Boolean).join(', ');
      throw new Error(errorMessages || 'Dữ liệu không hợp lệ');
    }
    throw new Error(error.response?.data?.message || 'Lỗi khi tạo dịch vụ');
  }
};

/**
 * Cập nhật service (Manager only)
 */
export const updateService = async (id: string, data: UpdateServiceRequest): Promise<ServiceResponse> => {
  try {
    const response = await serviceApi.put(`/${id}`, data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy dịch vụ');
    }
    if (error.response?.status === 409) {
      throw new Error('Tên dịch vụ đã tồn tại');
    }
    if (error.response?.status === 400) {
      const errors = error.response.data?.errors || {};
      const errorMessages = Object.values(errors).filter(Boolean).join(', ');
      throw new Error(errorMessages || 'Dữ liệu không hợp lệ');
    }
    throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật dịch vụ');
  }
};

/**
 * Xóa service (Soft delete với deleteNote, Manager only)
 */
export const deleteService = async (id: string, deleteNote: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await serviceApi.delete(`/${id}`, {
      data: { deleteNote }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy dịch vụ');
    }
    if (error.response?.status === 400) {
      const errors = error.response.data?.errors || {};
      if (errors.deleteNote) {
        throw new Error('Vui lòng nhập lý do xóa');
      }
      throw new Error(error.response.data?.message || 'Dữ liệu không hợp lệ');
    }
    throw new Error(error.response?.data?.message || 'Lỗi khi xóa dịch vụ');
  }
};

/**
 * Khôi phục service đã xóa (Manager only)
 */
export const recoverService = async (id: string): Promise<ServiceResponse> => {
  try {
    const response = await serviceApi.post(`/${id}/recover`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy dịch vụ hoặc dịch vụ chưa bị xóa');
    }
    if (error.response?.status === 409) {
      throw new Error('Không thể khôi phục. Đã tồn tại dịch vụ khác có cùng tên');
    }
    throw new Error(error.response?.data?.message || 'Lỗi khi khôi phục dịch vụ');
  }
}; 