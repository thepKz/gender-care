import axiosInstance from '../axiosConfig';
import { 
  Service, 
  CreateServiceRequest, 
  UpdateServiceRequest, 
  ServicesResponse, 
  ServiceResponse 
} from '../../types';

// Use shared axios instance for consistent configuration
const serviceApi = {
  get: (url: string, config?: any) => axiosInstance.get(`/services${url}`, config),
  post: (url: string, data?: any, config?: any) => axiosInstance.post(`/services${url}`, data, config),
  put: (url: string, data?: any, config?: any) => axiosInstance.put(`/services${url}`, data, config),
  delete: (url: string, config?: any) => axiosInstance.delete(`/services${url}`, config),
};

export interface GetServicesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  serviceType?: 'consultation' | 'test' | 'treatment' | 'other';
  availableAt?: 'Athome' | 'Online' | 'Center';
  includeDeleted?: boolean; // For manager to view deleted services
}

export interface SearchServicesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  serviceType?: 'consultation' | 'test' | 'treatment' | 'other';
  availableAt?: 'Athome' | 'Online' | 'Center';
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
 * Xóa service (Soft delete, Manager only) - Đã xóa deleteNote theo backend mới
 */
export const deleteService = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await serviceApi.delete(`/${id}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy dịch vụ');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Không thể xóa dịch vụ này');
    }
    throw new Error(error.response?.data?.message || 'Lỗi khi xóa dịch vụ');
  }
};

/**
 * Tìm kiếm services (POST method - chỉ chạy khi nhấn nút)
 */
export const searchServices = async (params: SearchServicesParams): Promise<ServicesResponse> => {
  try {
    const { page, limit, sortBy, sortOrder, ...searchData } = params;
    const queryParams = { page, limit, sortBy, sortOrder };
    
    const response = await serviceApi.post('/search', searchData, { params: queryParams });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Lỗi khi tìm kiếm dịch vụ');
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

/**
 * Toggle service status (active/inactive) - Manager only
 */
export const toggleServiceStatus = async (id: string): Promise<ServiceResponse> => {
  try {
    const response = await serviceApi.put(`/${id}/toggle-status`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy dịch vụ');
    }
    throw new Error(error.response?.data?.message || 'Lỗi khi thay đổi trạng thái dịch vụ');
  }
}; 

/**
 * Lấy thông tin chi tiết service theo ID
 */
export const getServiceById = async (id: string): Promise<ServiceResponse> => {
  try {
    const response = await serviceApi.get(`/${id}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy dịch vụ');
    }
    throw new Error(error.response?.data?.message || 'Lỗi khi lấy thông tin dịch vụ');
  }
}; 