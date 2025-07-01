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

export default {
  fetchManagementReports,
};