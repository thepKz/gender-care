import axios from 'axios';

// Lấy BASE_URL từ .env hoặc sử dụng giá trị mặc định
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/';

// Tạo instance của axios với cấu hình mặc định
const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Quan trọng: cho phép gửi/nhận cookie qua các domain khác nhau
});

// Danh sách các endpoint sẽ không hiển thị lỗi 401
const silentEndpoints = [
  '/auth/login',
];

// Danh sách các endpoint không yêu cầu xác thực
const publicEndpoints = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/new-verify',
  '/auth/check-email',
  '/auth/check-phone'
];

// Interceptor cho request
axiosInstance.interceptors.request.use(
  (config) => {
    // Luôn lấy accessToken từ localStorage để gắn vào header Authorization nếu có
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Không log các request URL của các endpoint im lặng 
    const isSilentEndpoint = silentEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (import.meta.env.DEV && !isSilentEndpoint) {
      console.log('Request URL:', config.url);
      console.log('BaseURL:', config.baseURL);
    }
    
    // Kiểm tra URL có phải là public endpoint không
    const isPublicEndpoint = config.url && publicEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    // Tất cả request đều tự động gửi cookie (bao gồm token), không cần thêm Authorization header
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho response
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Nếu request bị cancel bởi interceptor, ngăn không báo lỗi vào console
    if (axios.isCancel(error)) {
      return Promise.reject(new Error('Request cancelled'));
    }
    
    // Không hiển thị lỗi cho các endpoint im lặng khi có lỗi 401
    const isSilentEndpoint = error.config && silentEndpoints.some(
      endpoint => error.config.url?.includes(endpoint)
    );
    
    if (error.response?.status === 401 && isSilentEndpoint) {
      // Không log lỗi 401 cho các endpoint im lặng
      return Promise.reject(error);
    }
    
    // Log các lỗi khác trong môi trường development
    if (import.meta.env.DEV && (!isSilentEndpoint || error.response?.status !== 401)) {
      console.error('Axios Error:', error.response?.status, error.response?.data);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 