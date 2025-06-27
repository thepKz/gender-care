import axiosInstance from '../axiosConfig';

// Types for Doctor Performance
export interface DoctorPerformanceData {
  doctorId: string;
  doctorName: string;
  specialty: string;
  avatar: string;
  totalConsultations: number;
  completedConsultations: number;
  revenue: number;
  averageRating: number;
  efficiency: number;
  patientSatisfaction: number;
  onTimeRate: number;
  rank: number;
}

export interface PerformanceFilter {
  period?: 'week' | 'month' | 'quarter' | 'year';
  specialty?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'revenue' | 'consultations' | 'rating' | 'efficiency';
  sortOrder?: 'asc' | 'desc';
}

export interface PerformanceStatistics {
  totalDoctors: number;
  totalRevenue: number;
  averageRating: number;
  averageEfficiency: number;
  topPerformers: DoctorPerformanceData[];
  performanceTrends: Array<{
    period: string;
    revenue: number;
    consultations: number;
    satisfaction: number;
  }>;
}

export interface DoctorDetailedPerformance {
  doctorId: string;
  personalInfo: {
    name: string;
    specialty: string;
    experience: number;
    avatar: string;
  };
  metrics: {
    totalConsultations: number;
    completedConsultations: number;
    canceledConsultations: number;
    revenue: number;
    averageRating: number;
    efficiency: number;
    patientSatisfaction: number;
    onTimeRate: number;
    responseTime: number;
  };
  trends: Array<{
    date: string;
    consultations: number;
    revenue: number;
    rating: number;
  }>;
  feedback: Array<{
    patientName: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

// API Functions for Doctor Performance
export const doctorPerformanceApi = {
  // Lấy báo cáo hiệu suất tất cả bác sĩ (Manager/Admin only)
  getAllDoctorsPerformance: async (filter?: PerformanceFilter): Promise<DoctorPerformanceData[]> => {
    const response = await axiosInstance.get('/doctors/performance', { params: filter });
    return response.data.data || response.data;
  },

  // Lấy hiệu suất chi tiết của một bác sĩ (Manager/Admin + Own data for Doctor)
  getDoctorDetailedPerformance: async (doctorId: string, filter?: PerformanceFilter): Promise<DoctorDetailedPerformance> => {
    const response = await axiosInstance.get(`/doctors/${doctorId}/performance/detailed`, { params: filter });
    return response.data.data || response.data;
  },

  // Lấy thống kê tổng quan hiệu suất (Manager/Admin only)
  getPerformanceStatistics: async (filter?: PerformanceFilter): Promise<PerformanceStatistics> => {
    const response = await axiosInstance.get('/doctors/performance/statistics', { params: filter });
    return response.data.data || response.data;
  },

  // Lấy xếp hạng bác sĩ (Manager/Admin only)
  getDoctorRankings: async (filter?: PerformanceFilter): Promise<DoctorPerformanceData[]> => {
    const response = await axiosInstance.get('/doctors/performance/rankings', { params: filter });
    return response.data.data || response.data;
  },

  // Lấy báo cáo doanh thu theo bác sĩ (Manager/Admin only)
  getDoctorRevenueReport: async (filter?: PerformanceFilter): Promise<any[]> => {
    const response = await axiosInstance.get('/doctors/performance/revenue', { params: filter });
    return response.data.data || response.data;
  },

  // So sánh hiệu suất giữa các bác sĩ (Manager/Admin only)
  compareDoctorPerformance: async (doctorIds: string[], filter?: PerformanceFilter): Promise<any> => {
    const response = await axiosInstance.post('/doctors/performance/compare', { 
      doctorIds, 
      ...filter 
    });
    return response.data.data || response.data;
  },

  // Xuất báo cáo hiệu suất (Manager/Admin only)
  exportPerformanceReport: async (filter?: PerformanceFilter, format: 'excel' | 'pdf' = 'excel'): Promise<Blob> => {
    const response = await axiosInstance.get('/doctors/performance/export', {
      params: { ...filter, format },
      responseType: 'blob'
    });
    return response.data;
  },

  // Lấy feedback chi tiết của bác sĩ (Manager/Admin + Own data for Doctor)
  getDoctorFeedback: async (doctorId: string, page: number = 1, limit: number = 10): Promise<any> => {
    const response = await axiosInstance.get(`/doctors/${doctorId}/feedback`, {
      params: { page, limit }
    });
    return response.data.data || response.data;
  },

  // Lấy lịch sử hiệu suất theo thời gian (Manager/Admin + Own data for Doctor)
  getDoctorPerformanceHistory: async (doctorId: string, startDate: string, endDate: string): Promise<any[]> => {
    const response = await axiosInstance.get(`/doctors/${doctorId}/performance/history`, {
      params: { startDate, endDate }
    });
    return response.data.data || response.data;
  },

  // Lấy mục tiêu hiệu suất của bác sĩ (Manager/Admin + Own data for Doctor)
  getDoctorPerformanceGoals: async (doctorId: string): Promise<any> => {
    const response = await axiosInstance.get(`/doctors/${doctorId}/performance/goals`);
    return response.data.data || response.data;
  },

  // Cập nhật mục tiêu hiệu suất (Manager/Admin only)
  updateDoctorPerformanceGoals: async (doctorId: string, goals: any): Promise<any> => {
    const response = await axiosInstance.put(`/doctors/${doctorId}/performance/goals`, goals);
    return response.data.data || response.data;
  }
};

export default doctorPerformanceApi; 