import axiosInstance from '../axiosConfig';

// Định nghĩa types cho query parameters
interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  serviceType?: string;
  isActive?: boolean;
}

const servicesApi = {
  // Lấy danh sách dịch vụ
  getServices: (params?: QueryParams) => {
    return axiosInstance.get('/services', { params });
  },
  
  // Lấy chi tiết dịch vụ
  getServiceDetail: (id: string) => {
    return axiosInstance.get(`/services/${id}`);
  },
  
  // Lấy danh sách gói dịch vụ
  getServicePackages: (params?: QueryParams) => {
    return axiosInstance.get('/service-packages', { params });
  },
  
  // Lấy chi tiết gói dịch vụ
  getServicePackageDetail: (id: string) => {
    return axiosInstance.get(`/service-packages/${id}`);
  },
  
  // Mua gói dịch vụ
  purchasePackage: (data: {
    profileId: string;
    packageId: string;
    promotionId?: string;
  }) => {
    return axiosInstance.post('/package-purchases', data);
  },
  
  // Lấy danh sách gói đã mua
  getPurchasedPackages: (params?: QueryParams) => {
    return axiosInstance.get('/package-purchases/user', { params });
  }
};

export default servicesApi; 