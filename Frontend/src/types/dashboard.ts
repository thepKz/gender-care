export interface DashboardStat {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  prefix?: string;
  suffix?: string;
  description?: string;
}

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  avatar?: string;
  type: 'appointment' | 'consultation' | 'system' | 'user';
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
}

export interface PerformanceMetric {
  appointmentCompletion: number;
  patientSatisfaction: number;
  responseTime: number;
  efficiency: number;
}

// Default data
export const defaultManagementStats: DashboardStat[] = [
  {
    title: 'Tổng bác sĩ',
    value: 0,
    icon: 'UserOutlined',
    color: '#3b82f6',
    change: '',
    trend: 'up'
  },
  {
    title: 'Tổng dịch vụ',
    value: 0,
    icon: 'StarOutlined',
    color: '#10b981',
    change: '',
    trend: 'up'
  },
  {
    title: 'Lịch hẹn hôm nay',
    value: 0,
    icon: 'CalendarOutlined',
    color: '#f59e0b',
    change: '',
    trend: 'up'
  },
  {
    title: 'Doanh thu tháng',
    value: 0,
    icon: 'DollarOutlined',
    color: '#ef4444',
    change: '',
    trend: 'up'
  }
];

export const defaultOperationalStats: DashboardStat[] = [
  {
    title: 'Lịch hẹn hôm nay',
    value: 0,
    icon: 'CalendarOutlined',
    color: '#10b981',
    change: '',
    trend: 'up'
  },
  {
    title: 'Lịch hẹn trong tuần',
    value: 0,
    icon: 'ScheduleOutlined',
    color: '#3b82f6',
    change: '',
    trend: 'up'
  },
  {
    title: 'Lịch hẹn pending',
    value: 0,
    icon: 'ClockCircleOutlined',
    color: '#f59e0b',
    change: '',
    trend: 'down'
  }
];

export const defaultActivities: ActivityItem[] = [];

export const defaultAppointments: AppointmentItem[] = [];

export const defaultPerformanceMetrics: PerformanceMetric = {
  appointmentCompletion: 0,
  patientSatisfaction: 0,
  responseTime: 0,
  efficiency: 0
}; 