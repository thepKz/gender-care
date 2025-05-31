import axios from 'axios';
import { getValidTokenFromStorage } from '../utils/helpers';

// Lấy BASE_URL từ .env hoặc sử dụng giá trị mặc định
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/';

// Tạo instance của axios với cấu hình mặc định
const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000, // Tăng timeout từ 10s lên 15s cho Google OAuth
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
  '/auth/check-phone',
  '/auth/login-google' // Thêm Google OAuth endpoint
];

// Interceptor cho request
axiosInstance.interceptors.request.use(
  (config) => {
    // Tăng timeout riêng cho Google OAuth
    if (config.url?.includes('/auth/login-google')) {
      config.timeout = 30000; // 30 giây cho Google OAuth
    }
    
    // Sử dụng helper function để lấy token hợp lệ
    const token = getValidTokenFromStorage('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Debug log
      if (import.meta.env.DEV) {
        console.log('[axiosConfig] Adding valid token to request:', config.url);
        console.log('[axiosConfig] Token preview:', token.substring(0, 20) + '...');
      }
    } else if (import.meta.env.DEV) {
      console.log('[axiosConfig] No valid token found for request:', config.url);
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
    
    // Xử lý lỗi 401 - Token không hợp lệ
    if (error.response?.status === 401) {
      const token = localStorage.getItem('access_token');
      if (token) {
        console.log('401 Error detected, but NOT clearing localStorage for debugging');
        console.log('Current token in localStorage:', token.substring(0, 20) + '...');
        
        // Tạm thời comment để debug
        /*
        console.log('Token localStorage invalid, đã clear');
        // Clear token và user info
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        
        // Chỉ redirect về login nếu không phải đang ở trang public
        const currentPath = window.location.pathname;
        const publicPaths = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
        
        if (!publicPaths.includes(currentPath)) {
          window.location.href = '/login';
        }
        */
      }
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