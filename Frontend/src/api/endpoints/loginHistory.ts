import axiosInstance from '../axiosConfig';

interface LoginHistoryQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

const loginHistoryApi = {
  // Get all login history (Admin/Manager only)
  getAllLoginHistory: (params?: LoginHistoryQueryParams) => {
    return axiosInstance.get('/login-history', { params });
  },

  // Get login history by user ID
  getLoginHistoryByUser: (userId: string) => {
    return axiosInstance.get(`/login-history/${userId}`);
  },

  // Create login history record
  createLoginHistory: (data: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    status: 'success' | 'failed';
    failReason?: string;
  }) => {
    return axiosInstance.post('/login-history', data);
  }
};

export default loginHistoryApi; 