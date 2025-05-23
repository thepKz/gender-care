import {
  LoginRequest,
  OtpRequest,
  OtpVerificationRequest,
  RegisterRequest,
  User
} from '../../types';
import axiosInstance from '../axiosConfig';

interface CheckEmailRequest {
  email: string;
}

interface CheckPhoneRequest {
  phone: string;
}

interface CheckResponse {
  available: boolean;
}

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
    return axiosInstance.get('/users/profile/me');
  },
  
  updateProfile: (data: Partial<User>) => {
    return axiosInstance.put('/users/profile/me', data);
  },
  
  changePassword: (oldPassword: string, newPassword: string) => {
    return axiosInstance.put('/users/profile/me/change-password', { currentPassword: oldPassword, newPassword });
  },

  // Thêm endpoints mới cho OTP
  requestOtp: (data: OtpRequest) => {
    return axiosInstance.post('/auth/request-otp', data);
  },

  sendNewVerifyEmail: (email: string) => {
    return axiosInstance.post('/auth/new-verify', { email });
  },

  verifyOtp: (data: OtpVerificationRequest) => {
    return axiosInstance.post('/auth/verify-otp', data);
  },

  // Phương thức mới để xác thực email chỉ với email và OTP, không cần userId
  verifyEmail: (email: string, otp: string) => {
    return axiosInstance.post('/auth/verify-email', { email, otp });
  },

  // Endpoint kiểm tra trạng thái email đã xác thực hay chưa
  checkEmailVerification: () => {
    return axiosInstance.get('/auth/check-email-verification');
  },

  checkEmail: (data: CheckEmailRequest) => {
    return axiosInstance.post<CheckResponse>('/auth/check-email', data);
  },

  checkPhone: (data: CheckPhoneRequest) => {
    return axiosInstance.post<CheckResponse>('/auth/check-phone', data);
  }
};

export default authApi; 