import axiosInstance from '../axiosConfig';
import { PackageAnalyticsResponse, AllPackagesAnalyticsResponse } from '../../types';

export interface PurchasePackageRequest {
  profileId: string;
  packageId: string;
  promotionId?: string;
}

export interface PackagePurchaseResponse {
  success: boolean;
  message?: string;
  data?: {
    packagePurchase: any;
    bill: any;
  };
}

export interface UserPurchasedPackagesResponse {
  success: boolean;
  data?: {
    packagePurchases: any[];
    pagination: {
      current: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

const packagePurchaseApi = {
  // Mua gói dịch vụ
  purchasePackage: (data: PurchasePackageRequest): Promise<PackagePurchaseResponse> => {
    console.log('🔍 [API] purchasePackage called with:', data);
    return axiosInstance.post('/package-purchases', data);
  },

  // Lấy danh sách gói đã mua của user
  getUserPurchasedPackages: (params?: {
    profileId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<UserPurchasedPackagesResponse> => {
    console.log('🔍 [API] getUserPurchasedPackages called with params:', params);
    console.log('🔍 [API] Making request to:', '/package-purchases/user');
    
    // ✅ Enhanced debugging for request configuration
    const requestConfig = {
      url: '/package-purchases/user',
      method: 'GET',
      params: params || {}
    };
    console.log('🔍 [API] Request config:', requestConfig);
    
    return axiosInstance.get('/package-purchases/user', { params })
      .then(response => {
        console.log('✅ [API] getUserPurchasedPackages response received:', {
          status: response.status,
          statusText: response.statusText,
          hasData: !!response.data,
          responseKeys: response.data ? Object.keys(response.data) : []
        });
        return response.data;
      })
      .catch(error => {
        console.error('❌ [API] getUserPurchasedPackages error:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          requestURL: error.config?.url
        });
        throw error;
      });
  },

  // Lấy chi tiết gói đã mua
  getPackagePurchaseDetail: (id: string) => {
    console.log('🔍 [API] getPackagePurchaseDetail called with id:', id);
    return axiosInstance.get(`/package-purchases/${id}`);
  },

  // Lấy gói đã mua cho một profile cụ thể
  getPackagePurchasesByProfile: (profileId: string, params?: {
    isActive?: boolean;
  }) => {
    console.log('🔍 [API] getPackagePurchasesByProfile called with:', { profileId, params });
    return axiosInstance.get(`/package-purchases/profile/${profileId}`, { params });
  },

  // 🆕 Lấy usage analytics cho một gói dịch vụ cụ thể
  getPackageUsageAnalytics: (packageId: string): Promise<PackageAnalyticsResponse> => {
    console.log('🔍 [API] getPackageUsageAnalytics called with packageId:', packageId);
    return axiosInstance.get(`/package-purchases/analytics/${packageId}`)
      .then(response => {
        console.log('✅ [API] getPackageUsageAnalytics response received');
        return response.data;
      })
      .catch(error => {
        console.error('❌ [API] getPackageUsageAnalytics error:', error);
        throw error;
      });
  },

  // 🆕 Lấy overview analytics cho tất cả gói dịch vụ
  getAllPackagesAnalytics: (): Promise<AllPackagesAnalyticsResponse> => {
    console.log('🔍 [API] getAllPackagesAnalytics called');
    return axiosInstance.get('/package-purchases/analytics')
      .then(response => {
        console.log('✅ [API] getAllPackagesAnalytics response received');
        return response.data;
      })
      .catch(error => {
        console.error('❌ [API] getAllPackagesAnalytics error:', error);
        throw error;
      });
  }
};

export default packagePurchaseApi; 