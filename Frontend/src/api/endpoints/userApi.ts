import axiosInstance from '../axiosConfig';

// Types
export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  profilePicture?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  year?: string;
  role: 'customer' | 'doctor' | 'staff' | 'manager' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  doctorProfile?: {
    bio?: string;
    experience?: number;
    specialization?: string;
    education?: string;
    certificate?: string;
  };
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  year?: string;
  role?: 'customer' | 'doctor' | 'staff' | 'manager' | 'admin';
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface CreateDoctorRequest {
  email: string;
  fullName: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  bio?: string;
  experience?: string;
  experienceDetails?: string;
  rating?: number;
  image?: string;
  specialization?: string;
  education?: string;
  certificate?: string;
  certificates?: File[];
}

export interface CreateDoctorResponse {
  data: {
    _id: string;
    userId: {
      fullName: string;
      avatar?: string;
      gender?: string;
      address?: string;
    };
    bio?: string;
    experience?: number;
    rating?: number;
    specialization?: string;
    education?: string;
    certificate?: string;
  };
  userCredentials: {
    email: string;
    defaultPassword: string;
  };
}

export interface CreateStaffRequest {
  email: string;
  fullName: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  staffType: 'Nursing' | 'Blogers' | 'Normal';
}

export interface CreateStaffResponse {
  data: {
    _id: string;
    userId: {
      fullName: string;
      avatar?: string;
      gender?: string;
      address?: string;
    };
    staffType: string;
  };
  userCredentials: {
    email: string;
    defaultPassword: string;
  };
}

export interface UserListResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    statistics: {
      totalUsers: number;
      roleStats: Record<string, number>;
      filters: {
        role?: string;
        search?: string;
        sortBy: string;
        sortOrder: string;
      };
    };
  };
}

export interface UserDetailResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    additionalInfo?: Record<string, unknown>;
  };
}

export interface SystemStatistics {
  success: boolean;
  message: string;
  data: {
    roleStatistics: Record<string, number>;
    statusStatistics: {
      active: number;
      inactive: number;
    };
    recentActivity: {
      newUsersLast30Days: number;
      dailyRegistrationsLast7Days: Array<{
        _id: string;
        count: number;
      }>;
    };
    totalUsers: number;
  };
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API Functions
export const userApi = {
  // Lấy danh sách tất cả người dùng (Admin & Manager)
  getAllUsers: async (params?: UserQueryParams): Promise<UserListResponse> => {
    const response = await axiosInstance.get('/users', { params });
    return response.data;
  },

  // Lấy thông tin chi tiết một người dùng (Admin & Manager)
  getUserById: async (userId: string): Promise<UserDetailResponse> => {
    const response = await axiosInstance.get(`/users/${userId}`);
    return response.data;
  },

  // Cập nhật role của người dùng (Admin & Manager)
  updateUserRole: async (userId: string, roleData: {
    newRole: string;
    reason?: string;
    doctorProfile?: {
      bio?: string;
      experience?: number;
      specialization?: string;
      education?: string;
      certificate?: string;
    }
  }): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.put(`/users/${userId}/role`, roleData);
    return response.data;
  },

  // Khóa/Mở khóa tài khoản (Admin & Manager)
  toggleUserStatus: async (userId: string, requestData?: { reason?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.patch(`/users/${userId}/toggle-status`, requestData);
    return response.data;
  },

  // Xóa người dùng (Admin & Manager)
  deleteUser: async (userId: string, requestData?: { reason?: string; hardDelete?: boolean }): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/users/${userId}`, {
      data: requestData
    });
    return response.data;
  },

  // Lấy thống kê hệ thống (Admin & Manager)
  getSystemStatistics: async (): Promise<SystemStatistics> => {
    const response = await axiosInstance.get('/users/statistics');
    return response.data;
  },

  // User profile functions (for authenticated users)
  getCurrentUserProfile: async (): Promise<{ success: boolean; data: User }> => {
    const response = await axiosInstance.get('/users/profile/me');
    return response.data;
  },

  updateUserProfile: async (profileData: Partial<User>): Promise<{ success: boolean; message: string; data: User }> => {
    const response = await axiosInstance.put('/users/profile/me', profileData);
    return response.data;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.put('/users/profile/me/change-password', {
      oldPassword,
      newPassword
    });
    return response.data;
  },

  updateAvatar: async (avatarUrl: string): Promise<{ success: boolean; message: string; data: User }> => {
    const response = await axiosInstance.put('/users/profile/me/avatar', {
      avatar: avatarUrl
    });
    return response.data;
  },

  uploadAvatarImage: async (file: File): Promise<{ success: boolean; message: string; data: { url: string } }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await axiosInstance.post('/users/profile/me/avatar/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // Handle different response formats from backend
    const data = response.data;
    if (data.url && !data.success) {
      // Backend returns { url: "..." } format
      return {
        success: true,
        message: 'Upload thành công',
        data: { url: data.url }
      };
    }

    // Backend returns { success: true, data: { url: "..." } } format
    return data;
  },

  createUser: async (request: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await axiosInstance.post('/users', request);
    return response.data;
  },

  createDoctor: async (request: CreateDoctorRequest): Promise<CreateDoctorResponse> => {
    const response = await axiosInstance.post('/doctors', request);
    return response.data;
  },

  createStaff: async (request: CreateStaffRequest): Promise<CreateStaffResponse> => {
    const response = await axiosInstance.post('/staff', request);
    return response.data;
  },

  // Cập nhật thông tin user (Admin & Manager)
  updateUser: async (userId: string, updateData: Partial<User>): Promise<User> => {
    const response = await axiosInstance.put(`/users/${userId}`, updateData);
    return response.data.data;
  }
};

export default userApi; 