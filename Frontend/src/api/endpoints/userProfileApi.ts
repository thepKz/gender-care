import axiosInstance from '../axiosConfig';

interface UserProfileData {
    fullName: string;
    gender: string;
    phone?: string;
    year?: string | Date;
}

interface UpdateUserProfileData {
    fullName?: string;
    gender?: string;
    phone?: string;
    year?: string | Date;
}

const userProfileApi = {
    /**
     * Lấy tất cả hồ sơ của người dùng hiện tại
     */
    getMyProfiles: () => {
        return axiosInstance.get('/user-profiles/me');
    },

    /**
     * Lấy thông tin chi tiết của một hồ sơ
     */
    getProfileById: (profileId: string) => {
        console.log(`Fetching profile with ID: ${profileId}`);
        return axiosInstance.get(`/user-profiles/${profileId}`);
    },

    /**
     * Tạo hồ sơ mới
     */
    createProfile: (profileData: any) => {
        return axiosInstance.post('/user-profiles', profileData);
    },

    /**
     * Cập nhật thông tin hồ sơ
     */
    updateProfile: (profileId: string, profileData: any) => {
        console.log(`Updating profile with ID: ${profileId}`, profileData);
        return axiosInstance.put(`/user-profiles/${profileId}`, profileData);
    },

    /**
     * Xóa hồ sơ
     */
    deleteProfile: (profileId: string) => {
        return axiosInstance.delete(`/user-profiles/${profileId}`);
    },
};

export default userProfileApi; 