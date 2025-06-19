import api from '../axiosConfig';

// ✅ Dashboard API endpoints - Thay thế hoàn toàn mockdata

export interface DashboardStats {
    totalDoctors?: number;
    totalServices?: number;
    todayAppointments?: number;
    monthlyRevenue?: number;
    pendingAppointments?: number;
    completedToday?: number;
    efficiency?: number;
}

export interface ActivityItem {
    id: string;
    type: string;
    title: string;
    description: string;
    time: string | Date;
    icon: string;
    color: string;
}

export interface AppointmentItem {
    id: string;
    patientName: string;
    doctorName: string;
    time: string;
    status: string;
    phone?: string;
}

export interface ManagementDashboardResponse {
    stats: DashboardStats;
    recentActivities: ActivityItem[];
    todayAppointments: AppointmentItem[];
}

export interface OperationalDashboardResponse {
    stats: DashboardStats;
    appointments: AppointmentItem[];
    recentActivities?: ActivityItem[];
}

// ✅ API functions
export const fetchManagementDashboard = async (): Promise<ManagementDashboardResponse> => {
    const response = await api.get('/dashboard/management');
    return response.data.data;
};

export const fetchOperationalDashboard = async (): Promise<OperationalDashboardResponse> => {
    const response = await api.get('/dashboard/operational');
    return response.data.data;
};

// ✅ Export API functions
export const dashboardApi = {
    getManagementDashboard: fetchManagementDashboard,
    getOperationalDashboard: fetchOperationalDashboard,
};

export default dashboardApi; 