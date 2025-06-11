import { handleAPI } from './handleAPI';

// Types để match với Backend models
export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'staff' | 'doctor' | 'customer';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Functions
export const userAPI = {
  // Lấy danh sách tất cả users
  getAll: async (): Promise<IUser[]> => {
    const response = await handleAPI<IUser[]>('/users', undefined, 'GET');
    return response.data;
  },

  // Lấy users theo role
  getByRole: async (role: string): Promise<IUser[]> => {
    const response = await handleAPI<IUser[]>(`/users?role=${role}`, undefined, 'GET');
    return response.data;
  },

  // Lấy users chưa có doctor profile (để tạo doctor mới)
  getUsersWithoutDoctorProfile: async (): Promise<IUser[]> => {
    const response = await handleAPI<IUser[]>('/users/without-doctor-profile', undefined, 'GET');
    return response.data;
  }
}; 