import axiosInstance from '../axiosConfig';
import axios from 'axios';

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
  getServices: async (params?: QueryParams) => {
    try {
      console.log('Gọi API getServices với params:', params);
      console.log('Base URL hiện tại:', axiosInstance.defaults.baseURL);

      const response = await axiosInstance.get('/services', { params });
      console.log('Raw API response từ getServices:', response);
      console.log('Response data structure:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataType: typeof response.data
      });

      // Kiểm tra dữ liệu trả về
      if (!response.data) {
        console.error('API services trả về response.data null hoặc undefined');
        throw new Error('Dữ liệu API services không hợp lệ');
      }

      return response;
    } catch (error) {
      console.error('Error in getServices API call:', error);
      // Log chi tiết lỗi
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        });
      }
      throw error;
    }
  },

  // Lấy chi tiết dịch vụ
  getServiceDetail: async (id: string) => {
    try {
      const response = await axiosInstance.get(`/services/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error in getServiceDetail API call for ID ${id}:`, error);
      throw error;
    }
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