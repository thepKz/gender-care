import api from '../axiosConfig';

export interface RevenuePoint {
  month: string; // YYYY-MM
  total: number;
}

export interface ReportsResponse {
  revenueByMonth: RevenuePoint[];
  userRoleDistribution: Record<string, number>;
  appointmentStatusCounts: Record<string, number>;
  appointmentsLast7Days: { date: string; count: number }[];
}

export const fetchManagementReports = async (): Promise<ReportsResponse> => {
  const response = await api.get('/reports/management');
  return response.data.data;
};

// Types for Detailed Reports
export interface ReportFilters {
  reportType: 'APPOINTMENT_DETAIL'; // Extend with other types later
  dateFrom?: string;
  dateTo?: string;
  appointmentStatus?: string[];
  doctorId?: string;
  serviceId?: string;
}

export interface DetailedAppointment {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  paymentStatus: string;
  totalAmount: number | null | undefined; // Can be null/undefined from database
  createdAt: string;
}

/**
 * Fetches detailed report data based on filters.
 */
export const fetchDetailedReport = async (filters: ReportFilters): Promise<DetailedAppointment[]> => {
  const response = await api.post('/reports/detailed', filters);
  return response.data.data;
};

/**
 * Exports detailed report data to an Excel file.
 */
export const exportDetailedReport = async (filters: ReportFilters): Promise<void> => {
  const response = await api.post('/reports/export', filters, {
    responseType: 'blob', // Important for file download
  });

  // Create a URL for the blob
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  // Create a filename
  const date = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `report_${date}.xlsx`);
  
  // Append to html link element page
  document.body.appendChild(link);
  
  // Start download
  link.click();
  
  // Clean up and remove the link
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default {
  fetchManagementReports,
  fetchDetailedReport,
  exportDetailedReport,
};