import axios, { AxiosRequestHeaders } from 'axios';
import { getValidTokenFromStorage } from '../utils/helpers';

// Create axios instance with base URL from environment
const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const axiosInstance = axios.create({
  baseURL: apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Log configuration in development only
if (import.meta.env.DEV) {
  console.log('Axios Config:', {
    baseURL: axiosInstance.defaults.baseURL,
    mode: import.meta.env.MODE,
    hasViteApiUrl: !!import.meta.env.VITE_API_URL,
  });
}

// Danh sách các endpoint sẽ không hiển thị lỗi 401
const silentEndpoints = [
  '/auth/login',
];

// Interceptor cho request
axiosInstance.interceptors.request.use(
  (config) => {
    // Tăng timeout riêng cho Google OAuth
    if (config.url?.includes('/auth/login-google')) {
      config.timeout = 30000;
    }

    // Sử dụng helper function để lấy token hợp lệ
    const token = getValidTokenFromStorage('access_token');
    if (token) {
      config.headers = config.headers || {} as AxiosRequestHeaders;
      config.headers['Authorization'] = `Bearer ${token}`;
    }

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
    // Nếu request bị cancel bởi interceptor
    if (axios.isCancel(error)) {
      return Promise.reject(new Error('Request cancelled'));
    }

    // Xử lý lỗi 401 - Token không hợp lệ
    if (error.response?.status === 401) {
      const token = localStorage.getItem('access_token');
      if (token && import.meta.env.DEV) {
        console.log('401 Error detected, token exists but invalid');
      }
    }

    // Không hiển thị lỗi cho các endpoint im lặng khi có lỗi 401
    const isSilentEndpoint = error.config && silentEndpoints.some(
      endpoint => error.config.url?.includes(endpoint)
    );

    if (error.response?.status === 401 && isSilentEndpoint) {
      return Promise.reject(error);
    }

    // Log các lỗi khác trong môi trường development
    if (import.meta.env.DEV && (!isSilentEndpoint || error.response?.status !== 401)) {
      console.error('API Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: error.config?.url,
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance; 