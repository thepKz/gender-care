import {
    LoginRequest,
    OtpRequest,
    OtpVerificationRequest,
    RegisterRequest
} from '../../types';
import axiosInstance from '../axiosConfig';

const authApi = {
  login: (data: LoginRequest) => {
    return axiosInstance.post('/auth/login', data);
  },
  
  register: (data: RegisterRequest) => {
    return axiosInstance.post('/auth/register', data);
  },
  
  logout: () => {
    return axiosInstance.post('/auth/logout');
  },
  
  forgotPassword: (email: string) => {
    return axiosInstance.post('/auth/forgot-password', { email });
  },
  
  resetPassword: (token: string, password: string) => {
    return axiosInstance.post('/auth/reset-password', { token, password });
  },
  
  getProfile: () => {
    return axiosInstance.get('/auth/profile');
  },
  
  updateProfile: (data: any) => {
    return axiosInstance.put('/auth/profile', data);
  },
  
  changePassword: (oldPassword: string, newPassword: string) => {
    return axiosInstance.put('/auth/change-password', { oldPassword, newPassword });
  },

  // Thêm endpoints mới cho OTP
  requestOtp: (data: OtpRequest) => {
    return axiosInstance.post('/auth/request-otp', data);
  },

  verifyOtp: (data: OtpVerificationRequest) => {
    return axiosInstance.post('/auth/verify-otp', data);
  },

  // Endpoint kiểm tra trạng thái email đã xác thực hay chưa
  checkEmailVerification: () => {
    return axiosInstance.get('/auth/check-email-verification');
  }
};

export default authApi; 