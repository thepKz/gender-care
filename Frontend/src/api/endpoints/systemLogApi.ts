import apiClient from '../axiosConfig';

export interface SystemLog {
  _id: string;
  action: string;
  level: 'public' | 'manager' | 'admin';
  message: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  targetId?: string;
  targetType?: string;
  targetData?: any;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SystemLogStats {
  totalLogs: number;
  todayLogs: number;
  loginCount: number;
  errorCount: number;
  actionStats: Array<{ action: string; count: number }>;
  levelStats: Array<{ level: string; count: number }>;
}

export interface GetLogsParams {
  page?: number;
  limit?: number;
  level?: string;
  action?: string;
  userId?: string;
  userEmail?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface GetLogsResponse {
  logs: SystemLog[];
  total: number;
  page: number;
  totalPages: number;
}

// Lấy danh sách logs
export const getSystemLogs = async (params: GetLogsParams = {}): Promise<GetLogsResponse> => {
  const response = await apiClient.get('/system-logs', { params });
  return response.data.data;
};

// Lấy thống kê logs
export const getSystemLogStats = async (): Promise<SystemLogStats> => {
  const response = await apiClient.get('/system-logs/stats');
  return response.data.data;
};

// Cleanup logs cũ (admin only)
export const cleanupOldLogs = async (daysToKeep: number = 90): Promise<{ deletedCount: number }> => {
  const response = await apiClient.post('/system-logs/cleanup', { daysToKeep });
  return response.data.data;
};

// Tạo test log (admin only)
export const createTestLog = async (logData: {
  action: string;
  level: string;
  message: string;
  targetType?: string;
  metadata?: any;
}): Promise<SystemLog> => {
  const response = await apiClient.post('/system-logs/test', logData);
  return response.data.data;
};

// Export logs to CSV (admin only)
export const exportLogs = async (params: {
  startDate?: string;
  endDate?: string;
  level?: string;
  action?: string;
}): Promise<Blob> => {
  const response = await apiClient.get('/system-logs/export', { 
    params,
    responseType: 'blob'
  });
  return response.data;
};

// Helper function để download CSV
export const downloadLogsCSV = async (params: {
  startDate?: string;
  endDate?: string;
  level?: string;
  action?: string;
}): Promise<void> => {
  try {
    const blob = await exportLogs(params);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading logs CSV:', error);
    throw error;
  }
}; 