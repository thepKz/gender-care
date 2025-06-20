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
    user?: string;
    action?: string;
    time?: string;
    status?: 'success' | 'warning' | 'error' | 'info';
    avatar?: string;
    type?: 'appointment' | 'consultation' | 'system' | 'user';
}

export interface AppointmentItem {
    id: string;
    patientName: string;
    doctorName?: string;
    time: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in-progress' | 'waiting' | 'no-show';
    service: string;
    notes?: string;
    priority?: 'high' | 'medium' | 'low';
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