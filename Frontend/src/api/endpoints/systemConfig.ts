import axiosInstance from '../axiosConfig';

export interface SystemConfig {
  key: string;
  value: string;
}

export interface SystemConfigsResponse {
  success: boolean;
  data: { [key: string]: string | null };
}

export interface SingleConfigResponse {
  success: boolean;
  data: SystemConfig;
}

/**
 * API endpoints cho System Configs
 */
export const systemConfigApi = {
  /**
   * Lấy các configs công khai (timeout configs)
   * Không cần authentication
   */
  getPublicConfigs: (): Promise<SystemConfigsResponse> => {
    return axiosInstance.get('/system-configs/public');
  },

  /**
   * Lấy timeout cho reservation (phút)
   */
  getReservationTimeout: async (): Promise<number> => {
    try {
      const response = await axiosInstance.get('/system-configs/public');
      const timeout = response.data?.data?.reservation_timeout_minutes;
      return timeout ? parseInt(timeout, 10) : 10; // Fallback to 10 minutes
    } catch (error) {
      console.error('Error getting reservation timeout:', error);
      return 10; // Fallback to 10 minutes
    }
  },

  /**
   * Lấy timeout cho consultation (phút)
   */
  getConsultationTimeout: async (): Promise<number> => {
    try {
      const response = await axiosInstance.get('/system-configs/public');
      const timeout = response.data?.data?.consultation_timeout_minutes;
      return timeout ? parseInt(timeout, 10) : 15; // Fallback to 15 minutes
    } catch (error) {
      console.error('Error getting consultation timeout:', error);
      return 15; // Fallback to 15 minutes
    }
  },

  // Đã xóa getPaymentReminderThreshold - sử dụng getReservationTimeout thay thế

  /**
   * Lấy interval cho auto refresh (giây)
   */
  getAutoRefreshInterval: async (): Promise<number> => {
    try {
      const response = await axiosInstance.get('/system-configs/public');
      const interval = response.data?.data?.auto_refresh_interval_seconds;
      return interval ? parseInt(interval, 10) : 30; // Fallback to 30 seconds
    } catch (error) {
      console.error('Error getting auto refresh interval:', error);
      return 30; // Fallback to 30 seconds
    }
  },

  // ===== ADMIN ONLY APIs =====

  /**
   * Lấy tất cả configs (Admin only)
   */
  getAllConfigs: async (): Promise<{ success: boolean; data: SystemConfig[] }> => {
    try {
      const response = await axiosInstance.get('/system-configs');
      console.log('🔍 Raw axios response:', response);
      console.log('🔍 Response data:', response.data);
      console.log('🔍 Response status:', response.status);

      // Return the actual response data
      return response.data;
    } catch (error) {
      console.error('🔍 API Error:', error);
      throw error;
    }
  },

  /**
   * Lấy config theo key (Admin only)
   */
  getConfigByKey: (key: string): Promise<SingleConfigResponse> => {
    return axiosInstance.get(`/system-configs/${key}`);
  },

  /**
   * Tạo hoặc cập nhật config (Admin only)
   */
  setConfig: (key: string, value: string): Promise<SingleConfigResponse> => {
    return axiosInstance.post('/system-configs', { key, value });
  },

  /**
   * Xóa config (Admin only)
   */
  deleteConfig: (key: string): Promise<{ success: boolean; message: string }> => {
    return axiosInstance.delete(`/system-configs/${key}`);
  },

  /**
   * Clear config cache (Admin only)
   */
  clearCache: (): Promise<{ success: boolean; message: string }> => {
    return axiosInstance.post('/system-configs/clear-cache');
  }
};

export default systemConfigApi;
