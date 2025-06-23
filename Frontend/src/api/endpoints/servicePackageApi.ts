import axiosInstance from '../axiosConfig';
import {
    CreateServicePackageRequest,
    ServicePackageResponse,
    ServicePackagesResponse,
    UpdateServicePackageRequest
} from '../../types';

// Use shared axios instance for consistent configuration
const servicePackageApi = {
  get: (url: string, config?: any) => axiosInstance.get(`/service-packages${url}`, config),
  post: (url: string, data?: any, config?: any) => axiosInstance.post(`/service-packages${url}`, data, config),
  put: (url: string, data?: any, config?: any) => axiosInstance.put(`/service-packages${url}`, data, config),
  delete: (url: string, config?: any) => axiosInstance.delete(`/service-packages${url}`, config),
};

export interface AutoCalculatedPriceResponse {
  success: boolean;
  data: {
    totalServicePrice: number;     // Tổng giá các dịch vụ
    calculatedPrice: number;       // Giá được tính tự động
    formula: string;               // Công thức tính giá
  };
  message?: string;
}

export interface PackagePurchaseResponse {
  success: boolean;
  data: {
    package: any;
    pricingInfo: {
      packageId: string;
      packageName: string;
      baseServicePrice: number;
      originalPrice: number;
      price: number;
      discountPercentage: number;
      durationInDays: number;
      maxUsages: number;
      maxProfiles: number[];
      isMultiProfile: boolean;
      pricePerUsage: number;
      pricePerDay: number;
      pricePerProfile: number;
    };
    valueMetrics: {
      savingsAmount: number;
      savingsPercentage: number;
      valueRating: 'excellent' | 'good' | 'fair' | 'poor';
    };
  };
  message?: string;
}

export interface UsageProjectionResponse {
  success: boolean;
  data: {
    packageId: string;
    packageName: string;
    durationInDays: number;
    maxUsages: number;
    expectedUsagePerWeek: number;
    projection: {
      projectedTotalUsage: number;
      utilizationRate: number;
      recommendation: 'perfect' | 'over' | 'under';
    };
    recommendation: string;
  };
  message?: string;
}

export interface GetServicePackagesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  includeDeleted?: boolean; // For manager to view deleted packages
  serviceId?: string; // Filter by service ID
  search?: string; // Search keyword (optional)
}

export interface SearchServicePackagesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  serviceId?: string; // Filter by service ID
}

/**
 * Lấy danh sách service packages với phân trang và bộ lọc
 */
export const getServicePackages = async (params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  includeDeleted?: boolean;
  serviceId?: string;
  search?: string;
}): Promise<ServicePackagesResponse> => {
  const response = await servicePackageApi.get('', { params });
    return response.data;
};

/**
 * Tạo service package mới với subscription model (Manager only)
 */
export const createServicePackage = (data: CreateServicePackageRequest): Promise<ServicePackageResponse> => {
  return servicePackageApi.post('', data).then(res => res.data);
};

/**
 * Cập nhật service package với subscription fields (Manager only)
 */
export const updateServicePackage = (id: string, data: UpdateServicePackageRequest): Promise<ServicePackageResponse> => {
  return servicePackageApi.put(`/${id}`, data).then(res => res.data);
};

/**
 * Tìm kiếm service packages (POST method - chỉ chạy khi nhấn nút)
 */
export const searchServicePackages = (data: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  serviceId?: string;
}): Promise<ServicePackagesResponse> => {
  return servicePackageApi.post('/search', data).then(res => res.data);
};

/**
 * Xóa service package (Soft delete, Manager only)
 */
export const deleteServicePackage = (id: string): Promise<{ success: boolean; message: string }> => {
  return servicePackageApi.delete(`/${id}`).then(res => res.data);
};

/**
 * Khôi phục service package đã xóa (Manager only)
 */
export const recoverServicePackage = (id: string): Promise<ServicePackageResponse> => {
  return servicePackageApi.post(`/${id}/recover`).then(res => res.data);
};

/**
 * Lấy thông tin pricing cho một gói dịch vụ cụ thể với value metrics
 */
export const getPackagePurchase = (id: string): Promise<PackagePurchaseResponse> => {
  return servicePackageApi.get(`/${id}/purchase`).then(res => res.data);
};

/**
 * Tính toán usage projection cho planning (thay thế profile-based pricing)
 */
export const getUsageProjection = (id: string, expectedUsagePerWeek: number): Promise<UsageProjectionResponse> => {
  return servicePackageApi.post(`/${id}/usage-projection`, { expectedUsagePerWeek }).then(res => res.data);
};

// 🔹 NEW: Tính giá gốc tự động từ services và maxUsages
export const calculateAutoPrice = (data: {
  serviceIds: string[];
  maxUsages: number;
}): Promise<AutoCalculatedPriceResponse> => {
  return axiosInstance.post('/service-packages/calculate-price', data);
};

export const getServicePackageById = (id: string): Promise<ServicePackageResponse> => {
  return servicePackageApi.get(`/${id}`).then(res => res.data);
};

export default {
  getServicePackages,
  createServicePackage,
  updateServicePackage,
  searchServicePackages,
  deleteServicePackage,
  recoverServicePackage,
  getPackagePurchase,
  getUsageProjection,
  calculateAutoPrice,
  getServicePackageById
}; 