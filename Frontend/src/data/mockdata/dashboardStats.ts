// NOTE: MOCKDATA - Dữ liệu giả lập cho dashboard statistics

export interface DashboardStat {
  title: string;
  value: number | string;
  suffix?: string;
  icon: string;
  color: string;
  change?: string;
  trend?: 'up' | 'down';
}

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
  avatar?: string;
}

export interface AppointmentItem {
  id: string;
  patient: string;
  doctor: string;
  time: string;
  type: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
}

// Enhanced Stats cho Management Dashboard (Admin + Manager)
export const managementStats: DashboardStat[] = [
  {
    title: 'Tổng người dùng',
    value: 2568,
    icon: 'UserOutlined',
    color: '#3b82f6',
    change: '8.35% tăng so với tháng trước',
    trend: 'up'
  },
  {
    title: 'Doanh thu tháng',
    value: 156000000,
    suffix: '₫',
    icon: 'DollarOutlined', 
    color: '#10b981',
    change: '12.5% tăng so với tháng trước',
    trend: 'up'
  },
  {
    title: 'Lịch hẹn hôm nay',
    value: 48,
    icon: 'CalendarOutlined',
    color: '#f59e0b',
    change: '2.8% giảm so với hôm qua',
    trend: 'down'
  },
  {
    title: 'Tỷ lệ hài lòng',
    value: 4.8,
    suffix: '/5',
    icon: 'TrophyOutlined',
    color: '#8b5cf6',
    change: '0.3% tăng so với tháng trước',
    trend: 'up'
  }
];

// Enhanced Stats cho Operational Dashboard (Staff + Doctor)
export const operationalStats: DashboardStat[] = [
  {
    title: 'Lịch hẹn hôm nay',
    value: 24,
    icon: 'CalendarOutlined',
    color: '#3b82f6',
    change: '15% tăng so với hôm qua',
    trend: 'up'
  },
  {
    title: 'Bệnh nhân chờ',
    value: 8,
    icon: 'UserOutlined',
    color: '#f59e0b',
    change: '2 bệnh nhân giảm',
    trend: 'down'
  },
  {
    title: 'Đã hoàn thành',
    value: 16,
    icon: 'CheckCircleOutlined',
    color: '#10b981',
    change: '85% tỷ lệ hoàn thành',
    trend: 'up'
  },
  {
    title: 'Hồ sơ mới',
    value: 5,
    icon: 'FileTextOutlined',
    color: '#8b5cf6',
    change: '1 hồ sơ tăng',
    trend: 'up'
  }
];

// Enhanced Recent Activities với avatar
export const recentActivities: ActivityItem[] = [
  {
    id: '1',
    user: 'Nguyễn Văn A',
    action: 'Đặt lịch tư vấn sức khỏe sinh sản',
    time: '2 phút trước',
    status: 'success',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: '2', 
    user: 'Trần Thị B',
    action: 'Thanh toán dịch vụ xét nghiệm STI',
    time: '5 phút trước',
    status: 'success',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b776?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: '3',
    user: 'Dr. Lê Minh C',
    action: 'Hoàn thành tư vấn cho bệnh nhân',
    time: '10 phút trước', 
    status: 'info',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: '4',
    user: 'Phạm Thị D',
    action: 'Đăng ký tài khoản mới',
    time: '15 phút trước',
    status: 'success',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: '5',
    user: 'Admin System',
    action: 'Cập nhật cấu hình hệ thống',
    time: '30 phút trước',
    status: 'warning'
  }
];

// Today's appointments data
export const todayAppointments: AppointmentItem[] = [
  {
    id: '1',
    patient: 'Nguyễn Thị Lan',
    doctor: 'Dr. Hương',
    time: '08:00',
    type: 'Khám thai',
    status: 'completed'
  },
  {
    id: '2',
    patient: 'Trần Minh Anh',
    doctor: 'Dr. Đức',
    time: '09:00',
    type: 'Tư vấn dinh dưỡng',
    status: 'completed'
  },
  {
    id: '3',
    patient: 'Lê Thị Hoa',
    doctor: 'Dr. Mai',
    time: '10:00',
    type: 'Khám định kỳ',
    status: 'confirmed'
  },
  {
    id: '4',
    patient: 'Phạm Văn Nam',
    doctor: 'Dr. An',
    time: '11:00',
    type: 'Tư vấn kế hoạch hóa gia đình',
    status: 'pending'
  }
];

// Performance metrics data
export const performanceMetrics = {
  completion: 85,
  satisfaction: 92,
  efficiency: 78,
  punctuality: 88
};

// Chart data for analytics
export const chartData = {
  weekly: [
    { day: 'T2', appointments: 12, completed: 10 },
    { day: 'T3', appointments: 15, completed: 13 },
    { day: 'T4', appointments: 18, completed: 17 },
    { day: 'T5', appointments: 20, completed: 18 },
    { day: 'T6', appointments: 22, completed: 20 },
    { day: 'T7', appointments: 8, completed: 7 },
    { day: 'CN', appointments: 5, completed: 5 }
  ],
  monthly: [
    { month: 'T1', revenue: 120000000, appointments: 450 },
    { month: 'T2', revenue: 135000000, appointments: 520 },
    { month: 'T3', revenue: 148000000, appointments: 580 },
    { month: 'T4', revenue: 156000000, appointments: 620 }
  ]
}; 