// Mock Data for Dashboard Statistics
// NOTE: This is MOCKDATA for development purposes

export interface DashboardStat {
  title: string;
  value: number | string;
  suffix?: string;
  prefix?: string;
  icon: string;
  color: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  description?: string;
}

export interface ActivityItem {
  key: string;
  user: string;
  action: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
  avatar?: string;
}

export interface AppointmentItem {
  key: string;
  time: string;
  patient: string;
  service: string;
  doctor?: string;
  status: 'confirmed' | 'in-progress' | 'waiting' | 'completed' | 'cancelled';
  notes?: string;
  priority?: 'high' | 'medium' | 'low';
}

// MOCKDATA: Management Dashboard Stats (Admin/Manager)
export const managementStats: DashboardStat[] = [
  {
    title: 'Tổng người dùng',
    value: 2847,
    icon: 'UserOutlined',
    color: '#3b82f6',
    change: '+12.5% so với tháng trước',
    trend: 'up',
    description: 'Tổng số người dùng đã đăng ký'
  },
  {
    title: 'Doanh thu tháng',
    value: 125000000,
    suffix: '₫',
    icon: 'DollarOutlined',
    color: '#10b981',
    change: '+8.2% so với tháng trước',
    trend: 'up',
    description: 'Tổng doanh thu trong tháng'
  },
  {
    title: 'Lịch hẹn hôm nay',
    value: 156,
    icon: 'CalendarOutlined',
    color: '#f59e0b',
    change: '+5.1% so với hôm qua',
    trend: 'up',
    description: 'Số lịch hẹn được đặt hôm nay'
  },
  {
    title: 'Tỷ lệ hài lòng',
    value: 4.8,
    suffix: '/5',
    icon: 'StarOutlined',
    color: '#8b5cf6',
    change: '+0.3 điểm so với tháng trước',
    trend: 'up',
    description: 'Đánh giá trung bình từ khách hàng'
  }
];

// MOCKDATA: Operational Dashboard Stats (Staff/Doctor)
export const operationalStats: DashboardStat[] = [
  {
    title: 'Lịch hẹn hôm nay',
    value: 24,
    icon: 'CalendarOutlined',
    color: '#3b82f6',
    change: '+3 so với hôm qua',
    trend: 'up',
    description: 'Số lịch hẹn cần xử lý hôm nay'
  },
  {
    title: 'Hoàn thành',
    value: 18,
    icon: 'CheckCircleOutlined',
    color: '#10b981',
    change: '75% tỷ lệ hoàn thành',
    trend: 'up',
    description: 'Số lịch hẹn đã hoàn thành'
  },
  {
    title: 'Đang chờ',
    value: 6,
    icon: 'ClockCircleOutlined',
    color: '#f59e0b',
    change: '2 ưu tiên cao',
    trend: 'neutral',
    description: 'Số lịch hẹn đang chờ xử lý'
  },
  {
    title: 'Đánh giá',
    value: 4.9,
    suffix: '/5',
    icon: 'HeartOutlined',
    color: '#8b5cf6',
    change: '+0.1 so với tuần trước',
    trend: 'up',
    description: 'Đánh giá trung bình từ bệnh nhân'
  }
];

// MOCKDATA: Recent Activities
export const recentActivities: ActivityItem[] = [
  {
    key: '1',
    user: 'Nguyễn Thị Lan',
    action: 'Đặt lịch tư vấn sức khỏe sinh sản',
    time: '2 phút trước',
    status: 'success',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b776?w=32&h=32&fit=crop&crop=face'
  },
  {
    key: '2',
    user: 'Trần Văn Nam',
    action: 'Thanh toán dịch vụ xét nghiệm STI',
    time: '5 phút trước',
    status: 'success',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
  },
  {
    key: '3',
    user: 'Dr. Lê Minh Tuấn',
    action: 'Hoàn thành tư vấn cho bệnh nhân',
    time: '10 phút trước',
    status: 'info',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=32&h=32&fit=crop&crop=face'
  },
  {
    key: '4',
    user: 'Phạm Thị Mai',
    action: 'Cập nhật hồ sơ bệnh án',
    time: '15 phút trước',
    status: 'info',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face'
  },
  {
    key: '5',
    user: 'System Admin',
    action: 'Backup dữ liệu hệ thống',
    time: '30 phút trước',
    status: 'warning'
  }
];

// MOCKDATA: Today's Appointments
export const todayAppointments: AppointmentItem[] = [
  {
    key: '1',
    time: '08:00',
    patient: 'Nguyễn Thị Hương',
    service: 'Tư vấn sức khỏe sinh sản',
    doctor: 'Dr. Lê Minh Tuấn',
    status: 'completed',
    notes: 'Khám định kỳ',
    priority: 'medium'
  },
  {
    key: '2',
    time: '09:30',
    patient: 'Trần Văn Đức',
    service: 'Xét nghiệm STI',
    doctor: 'Dr. Nguyễn Thị Mai',
    status: 'in-progress',
    notes: 'Lần đầu khám',
    priority: 'high'
  },
  {
    key: '3',
    time: '11:00',
    patient: 'Lê Thị Lan',
    service: 'Tư vấn kế hoạch hóa gia đình',
    doctor: 'Dr. Phạm Minh Hải',
    status: 'waiting',
    notes: 'Tái khám',
    priority: 'medium'
  },
  {
    key: '4',
    time: '14:00',
    patient: 'Phạm Văn Long',
    service: 'Khám sức khỏe tổng quát',
    doctor: 'Dr. Trần Thị Hoa',
    status: 'confirmed',
    notes: 'Khách hàng VIP',
    priority: 'high'
  },
  {
    key: '5',
    time: '15:30',
    patient: 'Hoàng Thị Nga',
    service: 'Tư vấn dinh dưỡng thai kỳ',
    doctor: 'Dr. Lê Minh Tuấn',
    status: 'confirmed',
    notes: 'Lịch hẹn mới',
    priority: 'low'
  }
];

// MOCKDATA: Performance Metrics
export const performanceMetrics = {
  management: {
    userGrowth: 85,
    revenueGrowth: 92,
    customerSatisfaction: 88,
    systemUptime: 99.9
  },
  operational: {
    appointmentCompletion: 87,
    patientSatisfaction: 94,
    timeEfficiency: 78,
    taskCompletion: 91
  }
};

// MOCKDATA: Chart Data
export const chartData = {
  monthlyRevenue: [
    { month: 'T1', value: 85000000 },
    { month: 'T2', value: 92000000 },
    { month: 'T3', value: 78000000 },
    { month: 'T4', value: 105000000 },
    { month: 'T5', value: 125000000 },
    { month: 'T6', value: 118000000 }
  ],
  appointmentTrends: [
    { day: 'T2', appointments: 45 },
    { day: 'T3', appointments: 52 },
    { day: 'T4', appointments: 38 },
    { day: 'T5', appointments: 61 },
    { day: 'T6', appointments: 48 },
    { day: 'T7', appointments: 35 },
    { day: 'CN', appointments: 28 }
  ]
};