import axiosInstance from '../axiosConfig';

interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  gender?: string;
  address?: string;
  year?: string | Date;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

const userApi = {
  /**
   * Lấy thông tin profile của người dùng hiện tại
   */
  getProfile: async () => {
    const response = await axiosInstance.get('/users/profile/me');
    return response.data;
  },

  /**
   * Cập nhật thông tin cá nhân
   */
  updateProfile: async (data: UpdateProfileData) => {
    const response = await axiosInstance.put('/users/profile/me', data);
    return response.data;
  },

  /**
   * Cập nhật ảnh đại diện
   */
  updateAvatar: async (avatarUrl: string) => {
    const response = await axiosInstance.put('/users/profile/me/avatar', {
      avatar: avatarUrl
    });
    return response.data;
  },

  /**
   * Đổi mật khẩu
   */
  changePassword: async (data: ChangePasswordData) => {
    const response = await axiosInstance.put('/users/profile/me/change-password', data);
    return response.data;
  },

  /**
   * Upload ảnh avatar lên backend
   */
  uploadAvatarImage: async (formData: FormData) => {
    const response = await axiosInstance.post('/users/profile/me/avatar/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default userApi; 