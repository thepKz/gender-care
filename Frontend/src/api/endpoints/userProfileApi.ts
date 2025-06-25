import { UserProfile } from '../../types';
import axiosInstance from '../axiosConfig';

export interface CreateUserProfileRequest {
  fullName: string;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  year?: string;
}

export interface UpdateUserProfileRequest extends Partial<CreateUserProfileRequest> {
  id?: string;
}

export interface UserProfileResponse {
  message: string;
  data: UserProfile;
}

export interface UserProfileListResponse {
  message: string;
  data: UserProfile[];
  count: number;
}

class UserProfileApi {
  private baseUrl = '/user-profiles';

  // Tạo profile mới
  async createProfile(data: CreateUserProfileRequest): Promise<UserProfile> {
    try {
      const response = await axiosInstance.post<UserProfileResponse>(this.baseUrl, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo hồ sơ');
    }
  }

  // Lấy tất cả profiles của user hiện tại
  async getMyProfiles(): Promise<UserProfile[]> {
    try {
      const response = await axiosInstance.get<UserProfileListResponse>(`${this.baseUrl}/my-profiles`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải danh sách hồ sơ');
    }
  }

  // Lấy profile theo ID
  async getProfileById(id: string): Promise<UserProfile> {
    try {
      const response = await axiosInstance.get<UserProfileResponse>(`${this.baseUrl}/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải hồ sơ');
    }
  }

  // Cập nhật profile
  async updateProfile(id: string, data: UpdateUserProfileRequest): Promise<UserProfile> {
    try {
      const response = await axiosInstance.put<UserProfileResponse>(`${this.baseUrl}/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
    }
  }

  // Xóa profile
  async deleteProfile(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`${this.baseUrl}/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi khi xóa hồ sơ');
    }
  }

  // Tìm kiếm profiles (client-side filtering)
  async searchProfiles(query: string): Promise<UserProfile[]> {
    try {
      const profiles = await this.getMyProfiles();
      if (!query.trim()) return profiles;

      const lowerQuery = query.toLowerCase();
      return profiles.filter(profile =>
        profile.fullName.toLowerCase().includes(lowerQuery) ||
        profile.phone?.toLowerCase().includes(lowerQuery)
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tìm kiếm hồ sơ');
    }
  }
}

export default new UserProfileApi(); 