import api from '../axiosConfig';

// ===== REVENUE REPORTS INTERFACES =====
export interface RevenuePoint {
  period: string;
  totalRevenue: number;
  totalTransactions: number;
  averageAmount: number;
  periodData: {
    year: number;
    month?: number;
    week?: number;
    quarter?: number;
  };
}

export interface RevenueReports {
  monthly: RevenuePoint[];
  weekly: RevenuePoint[];
  quarterly: RevenuePoint[];
}

// ===== APPOINTMENT OVERVIEW INTERFACES =====
export interface AppointmentStatusAnalysis {
  _id: string;
  count: number;
  percentage: number;
}

export interface AppointmentOverview {
  totalAppointments: number;
  monthlyAppointments: number;
  weeklyAppointments: number;
  statusAnalysis: AppointmentStatusAnalysis[];
  completionRate: number;
  cancellationRate: number;
  successfulAppointments: number;
  cancelledAppointments: number;
}

// ===== PAYMENT STATISTICS INTERFACES =====
export interface PaymentStatistics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionAmount: number;
  monthlyRevenue: number;
  monthlyTransactions: number;
  totalRefunded: number;
  totalRefundTransactions: number;
  refundRate: number;
}

// ===== DOCTOR RANKINGS INTERFACES =====
export interface DoctorRanking {
  doctorId: string;
  doctorName: string;
  specialization: string;
  rating: number;
  appointmentCount?: number;
  consultationCount?: number;
  totalRevenue: number;
}

export interface DoctorRankings {
  appointmentRankings: DoctorRanking[];
  consultationRankings: DoctorRanking[];
}

// ===== PEAK TIME ANALYSIS INTERFACES =====
export interface TimeSlotAnalysis {
  timeSlot: string;
  totalBookings: number;
  completedBookings: number;
  completionRate: number;
}

export interface WeekdayAnalysis {
  dayOfWeek: number;
  dayName: string;
  totalBookings: number;
  completedBookings: number;
  completionRate: number;
}

export interface PeakTimeAnalysis {
  hourlyAnalysis: TimeSlotAnalysis[];
  weekdayAnalysis: WeekdayAnalysis[];
  peakHour: string;
  peakDay: string;
}

// ===== SERVICE POPULARITY INTERFACES =====
export interface ServiceStats {
  serviceId: string;
  serviceName: string;
  serviceType: string;
  price: number;
  bookingCount: number;
  completedCount: number;
  totalRevenue: number;
  completionRate: number;
}

export interface ServicePopularity {
  mostPopular: ServiceStats[];
  leastPopular: ServiceStats[];
  totalServices: number;
}

// ===== PACKAGE ANALYSIS INTERFACES =====
export interface PackageStats {
  packageId: string;
  packageName: string;
  price: number;
  priceBeforeDiscount: number;
  bookingCount: number;
  completedCount: number;
  totalRevenue: number;
  completionRate: number;
}

export interface DiscountedPackage {
  _id: string;
  name: string;
  price: number;
  priceBeforeDiscount: number;
  durationInDays: number;
  discountAmount: number;
  discountPercentage: number;
}

export interface PackageAnalysis {
  mostPopular: PackageStats[];
  leastPopular: PackageStats[];
  discountedPackages: DiscountedPackage[];
  totalPackages: number;
  totalDiscountedPackages: number;
}

// ===== COMPREHENSIVE ADMIN DASHBOARD RESPONSE =====
export interface AdminDashboardReports {
  revenue: RevenueReports;
  appointments: AppointmentOverview;
  payments: PaymentStatistics;
  doctors: DoctorRankings;
  peakTimes: PeakTimeAnalysis;
  services: ServicePopularity;
  packages: PackageAnalysis;
}

// ===== API FUNCTIONS =====

/**
 * Lấy báo cáo tổng hợp cho admin dashboard
 */
export const fetchAdminDashboardReports = async (): Promise<AdminDashboardReports> => {
  const response = await api.get('/reports/admin-dashboard');
  return response.data.data;
};

/**
 * Lấy báo cáo doanh thu theo period
 */
export const fetchRevenueReports = async (
  period: 'week' | 'month' | 'quarter' = 'month',
  limit: number = 12
): Promise<RevenuePoint[]> => {
  const response = await api.get('/reports/revenue', {
    params: { period, limit }
  });
  return response.data.data;
};

/**
 * Lấy báo cáo tổng quan appointments
 */
export const fetchAppointmentOverview = async (): Promise<AppointmentOverview> => {
  const response = await api.get('/reports/appointments-overview');
  return response.data.data;
};

/**
 * Lấy thống kê payments
 */
export const fetchPaymentStatistics = async (): Promise<PaymentStatistics> => {
  const response = await api.get('/reports/payment-statistics');
  return response.data.data;
};

/**
 * Lấy ranking bác sĩ
 */
export const fetchDoctorRankings = async (): Promise<DoctorRankings> => {
  const response = await api.get('/reports/doctor-rankings');
  return response.data.data;
};

/**
 * Lấy phân tích thời gian cao điểm
 */
export const fetchPeakTimeAnalysis = async (): Promise<PeakTimeAnalysis> => {
  const response = await api.get('/reports/peak-times');
  return response.data.data;
};

/**
 * Lấy thống kê độ phổ biến dịch vụ
 */
export const fetchServicePopularity = async (): Promise<ServicePopularity> => {
  const response = await api.get('/reports/service-popularity');
  return response.data.data;
};

/**
 * Lấy phân tích gói dịch vụ
 */
export const fetchPackageAnalysis = async (): Promise<PackageAnalysis> => {
  const response = await api.get('/reports/package-analysis');
  return response.data.data;
};

// ===== EXPORT FUNCTIONS =====

/**
 * Export admin dashboard reports
 */
export const exportAdminDashboard = async (
  format: 'excel' | 'pdf' = 'excel',
  sections: string[] = []
): Promise<Blob> => {
  const response = await api.post('/reports/export-admin-dashboard', {
    format,
    sections
  }, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Export revenue reports
 */
export const exportRevenueReport = async (
  period: 'week' | 'month' | 'quarter' = 'month',
  limit: number = 12,
  format: 'excel' | 'pdf' = 'excel'
): Promise<Blob> => {
  const response = await api.post('/reports/export-revenue', {
    period,
    limit,
    format
  }, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Download file from blob
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
