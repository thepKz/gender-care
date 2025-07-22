import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Typography, DatePicker, Select, Button, Table, message, Tag, Progress, Statistic, Space, Divider } from 'antd';
import { DownloadOutlined, RiseOutlined, FallOutlined, CalendarOutlined, DollarOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, ComposedChart, RadialBarChart, RadialBar,
  FunnelChart, Funnel, LabelList, ScatterChart, Scatter, Treemap, ReferenceArea, ReferenceLine
} from 'recharts';
import { fetchManagementReports, ReportsResponse, fetchDetailedReport, exportDetailedReport, ReportFilters, DetailedAppointment } from '../../../api/endpoints/reports';
import { doctorApi, Doctor } from '../../../api/endpoints/doctorApi';
import {
  fetchAdminDashboardReports,
  AdminDashboardReports,
  exportAdminDashboard,
  downloadFile
} from '../../../api/endpoints/adminReports';
import '../../../styles/dashboard.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Enhanced Professional color palettes
const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa541c'];
const GRADIENT_COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
const HEALTHCARE_COLORS = ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#0F4C75', '#3282B8'];
const PERFORMANCE_COLORS = {
  excellent: '#52c41a',
  good: '#1890ff', 
  average: '#faad14',
  poor: '#f5222d',
  critical: '#722ed1'
};
const STATUS_COLORS = {
  'pending': '#faad14',
  'confirmed': '#52c41a', 
  'completed': '#1890ff',
  'cancelled': '#f5222d',
  'missed': '#8c8c8c',
  'pending_payment': '#fa8c16',
  'payment_cancelled': '#cf1322',
  'in-progress': '#13c2c2'
};

// Enhanced chart configurations
const CHART_CONFIG = {
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  fontSize: 12,
  strokeWidth: 2,
  gridOpacity: 0.1
};
const APPOINTMENT_STATUS_OPTIONS = [
    { value: 'pending', label: 'Chờ xác nhận', color: 'gold' },
    { value: 'confirmed', label: 'Đã xác nhận', color: 'green' },
    { value: 'completed', label: 'Đã hoàn thành', color: 'blue' },
    { value: 'cancelled', label: 'Đã hủy', color: 'red' },
    { value: 'missed', label: 'Đã lỡ hẹn', color: 'grey' },
    { value: 'pending_payment', label: 'Chờ thanh toán', color: 'orange' },
    { value: 'payment_cancelled', label: 'Thanh toán bị hủy', color: 'volcano' },
    { value: 'in-progress', label: 'Đang diễn ra', color: 'cyan' },
];

// Enhanced data processing utilities
const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} VND`;
const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
const getGrowthColor = (value: number) => value >= 0 ? '#52c41a' : '#f5222d';
const getPerformanceLevel = (value: number) => {
  if (value >= 90) return 'excellent';
  if (value >= 75) return 'good';
  if (value >= 60) return 'average';
  if (value >= 40) return 'poor';
  return 'critical';
};

/**
 * Safe division helper to prevent division by zero errors
 * @param numerator - The dividend
 * @param denominator - The divisor
 * @param fallback - The value to return if division is not safe (default: 0)
 * @returns The result of division or fallback value
 */
const safeDivision = (numerator: number | null | undefined, denominator: number | null | undefined, fallback: number = 0): number => {
  if (denominator === null || denominator === undefined || denominator === 0 || !isFinite(denominator)) {
    return fallback;
  }
  if (numerator === null || numerator === undefined || !isFinite(numerator)) {
    return fallback;
  }
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
};

/**
 * Format percentage value safely, handling NaN and Infinity
 * @param value - The percentage value
 * @returns Formatted percentage string or "N/A" for invalid values
 */
const formatSafePercentage = (value: number): string => {
  if (!isFinite(value)) {
    return "N/A";
  }
  return `${value.toFixed(1)}%`;
};

const ReportsPage: React.FC = () => {
  // State for overview charts
  const [overviewData, setOverviewData] = useState<ReportsResponse | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // State for analytics data (NEW)
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // State for detailed report
  const [filters, setFilters] = useState<Omit<ReportFilters, 'reportType'>>({});
  const [detailedData, setDetailedData] = useState<DetailedAppointment[]>([]);
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // State for admin reports (NEW)
  const [adminReportsData, setAdminReportsData] = useState<AdminDashboardReports | null>(null);
  const [loadingAdminReports, setLoadingAdminReports] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');

  // Helper function to get revenue data by period
  const getRevenueDataByPeriod = () => {
    if (!adminReportsData?.revenue) {
      console.log('No revenue data available');
      return [];
    }

    console.log('Current period:', revenuePeriod);
    console.log('Available revenue data:', adminReportsData.revenue);

    switch (revenuePeriod) {
      case 'weekly':
        console.log('Weekly data:', adminReportsData.revenue.weekly);
        return adminReportsData.revenue.weekly || [];
      case 'quarterly':
        console.log('Quarterly data:', adminReportsData.revenue.quarterly);
        return adminReportsData.revenue.quarterly || [];
      case 'monthly':
      default:
        console.log('Monthly data:', adminReportsData.revenue.monthly);
        return adminReportsData.revenue.monthly || [];
    }
  };

  // Fetch initial overview data, analytics data, and doctors list
  useEffect(() => {
    (async () => {
      setLoadingOverview(true);
      setLoadingAnalytics(true);
      setLoadingAdminReports(true);
      try {
        const [reportsResp, doctorsResp, analyticsResp] = await Promise.all([
          fetchManagementReports(),
          doctorApi.getAllDoctors(),
          fetch('/api/reports/analytics', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          }).then(res => res.json())
        ]);
        setOverviewData(reportsResp);
        setDoctors(doctorsResp || []);
        setAnalyticsData(analyticsResp.data || null);

        // Fetch admin reports separately with better error handling
        try {
          const adminReportsResp = await fetchAdminDashboardReports();
          console.log('Admin reports data:', adminReportsResp);
          console.log('Revenue data:', adminReportsResp?.revenue);
          console.log('Monthly data:', adminReportsResp?.revenue?.monthly);
          setAdminReportsData(adminReportsResp);
        } catch (adminErr) {
          console.error('Failed to fetch admin reports:', adminErr);
          message.error('Không thể tải dữ liệu báo cáo admin. Vui lòng kiểm tra kết nối API.');
          setAdminReportsData(null);
        }
      } catch (err) {
        console.error('Failed to fetch initial page data', err);
        message.error('Không thể tải dữ liệu tổng quan hoặc analytics.');
      } finally {
        setLoadingOverview(false);
        setLoadingAnalytics(false);
        setLoadingAdminReports(false);
      }
    })();
  }, []);
  
  // Handler for applying filters
  const handleFilter = async () => {
    setLoadingDetailed(true);
    try {
        const finalFilters: ReportFilters = {
            ...filters,
            reportType: 'APPOINTMENT_DETAIL'
        }
      const resp = await fetchDetailedReport(finalFilters);
      setDetailedData(resp);
      if(resp.length === 0) {
        message.info('Không tìm thấy dữ liệu nào phù hợp với điều kiện lọc.');
      }
    } catch (err) {
      console.error('Failed to fetch detailed report', err);
      message.error('Lỗi khi tải báo cáo chi tiết.');
    } finally {
      setLoadingDetailed(false);
    }
  };
  
  // Handler for exporting to Excel
  const handleExport = async () => {
    if (!detailedData || detailedData.length === 0) {
      message.warning('Không có dữ liệu để xuất. Vui lòng áp dụng bộ lọc trước.');
      return;
    }
    setLoadingDetailed(true); // Show loading on the table
    try {
        const finalFilters: ReportFilters = {
            ...filters,
            reportType: 'APPOINTMENT_DETAIL'
        }
      await exportDetailedReport(finalFilters);
      message.success('Xuất file Excel thành công!');
    } catch (err) {
      console.error('Failed to export report', err);
      message.error('Lỗi khi xuất file Excel.');
    } finally {
      setLoadingDetailed(false);
    }
  };

  // Handler for exporting admin dashboard
  const handleExportAdminDashboard = async (format: 'excel' | 'pdf' = 'excel') => {
    try {
      setExportLoading(true);
      message.loading('Đang chuẩn bị export báo cáo admin...', 0);

      const blob = await exportAdminDashboard(format);
      const filename = `admin-dashboard-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

      downloadFile(blob, filename);
      message.destroy();
      message.success('Export báo cáo admin thành công!');
    } catch (error) {
      console.error('Export admin dashboard error:', error);
      message.destroy();
      message.error('Lỗi khi export báo cáo admin');
    } finally {
      setExportLoading(false);
    }
  };

  const columns = [
    { title: 'Bệnh nhân', dataIndex: 'patientName', key: 'patientName' },
    { title: 'Bác sĩ', dataIndex: 'doctorName', key: 'doctorName' },
    { title: 'Ngày hẹn', dataIndex: 'appointmentDate', key: 'appointmentDate' },
    { title: 'Giờ hẹn', dataIndex: 'appointmentTime', key: 'appointmentTime' },
    { 
        title: 'Trạng thái', 
        dataIndex: 'status', 
        key: 'status',
        render: (status: string) => {
            const statusInfo = APPOINTMENT_STATUS_OPTIONS.find(s => s.value === status);
            return <Tag color={statusInfo?.color}>{statusInfo?.label || status}</Tag>;
        }
    },
    { 
      title: 'Tổng tiền', 
      dataIndex: 'totalAmount', 
      key: 'totalAmount', 
      render: (val: number | null | undefined) => {
        // Handle null/undefined values safely
        const amount = val ?? 0;
        return amount.toLocaleString('vi-VN') + ' VND';
      } 
    },
  ];

  if (loadingOverview) {
    return <div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>;
  }
  
  // Prepare data for charts with safety checks
  const revenueData = overviewData?.revenueByMonth?.map(item => ({
    ...item,
    total: typeof item.total === 'number' ? item.total : 0
  })) || [];
  
  const appointments7d = overviewData?.appointmentsLast7Days?.map((p) => ({ 
    ...p, 
    dateLabel: p.date.slice(5),
    count: typeof p.count === 'number' ? p.count : 0
  })) || [];
  
  const roleDistribution = overviewData ? Object.entries(overviewData.userRoleDistribution).map(([role, count]) => ({ 
    name: role, 
    value: typeof count === 'number' ? count : 0 
  })) : [];
  
  const statusCounts = overviewData ? Object.entries(overviewData.appointmentStatusCounts).map(([status, count]) => ({ 
    name: status, 
    value: typeof count === 'number' ? count : 0 
  })) : [];

  // Calculate additional metrics for enhanced analytics with safe division
  const totalRevenue = revenueData.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalAppointments = appointments7d.reduce((sum, item) => sum + (item.count || 0), 0);
  const avgRevenuePerMonth = revenueData.length > 0 ? safeDivision(totalRevenue, 12) : 0;
  const avgAppointmentsPerDay = appointments7d.length > 0 ? safeDivision(totalAppointments, 7) : 0;
  
  // Calculate growth trends with safe division
  const revenueGrowth = revenueData.length >= 2 ? 
    safeDivision(
      (revenueData[revenueData.length - 1]?.total || 0) - (revenueData[revenueData.length - 2]?.total || 0),
      revenueData[revenueData.length - 2]?.total || 0
    ) * 100 : 0;
  
  const appointmentGrowth = appointments7d.length >= 2 ?
    safeDivision(
      (appointments7d[appointments7d.length - 1]?.count || 0) - (appointments7d[appointments7d.length - 2]?.count || 0),
      appointments7d[appointments7d.length - 2]?.count || 0
    ) * 100 : 0;

  // Map data for charts from analyticsData
  const systemStats = analyticsData?.systemStats || {};

  // Prepare enhanced data for advanced charts with safe division
  const revenueWithGrowth = revenueData.map((item, index) => ({
    ...item,
    growth: index > 0 ? 
      safeDivision(
        (item.total || 0) - (revenueData[index - 1]?.total || 0),
        revenueData[index - 1]?.total || 0
      ) * 100 : 0,
    cumulative: revenueData.slice(0, index + 1).reduce((sum, r) => sum + (r.total || 0), 0)
  }));

  // Prepare satisfaction data with proper analytics instead of random data
  const satisfactionData = appointments7d.map((item, index) => ({
    ...item,
    // Use analytics data if available, fallback to realistic static values
    satisfactionRate: analyticsData?.patientSatisfaction?.[index]?.satisfaction || (85 + (index % 3) * 2),
    averageRating: analyticsData?.patientSatisfaction?.[index]?.rating || (4.2 + (index % 3) * 0.2)
  }));

  const appointmentTrends = appointments7d.map((item, index) => ({
    ...item,
    moving_avg: index >= 2 ? 
      safeDivision(
        appointments7d.slice(Math.max(0, index - 2), index + 1).reduce((sum, a) => sum + (a.count || 0), 0),
        3,
        item.count || 0
      ) : (item.count || 0),
    trend: index > 0 ? ((item.count || 0) > (appointments7d[index - 1]?.count || 0) ? 'up' : 'down') : 'stable'
  }));

  // Performance metrics with safe division
  const totalStatusCount = statusCounts.reduce((sum, s) => sum + (s.value || 0), 0);
  const completionRate = statusCounts.length > 0 ? 
    safeDivision(
      statusCounts.find(s => s.name === 'completed')?.value || 0,
      totalStatusCount
    ) * 100 : 0;

  const cancellationRate = statusCounts.length > 0 ?
    safeDivision(
      statusCounts.find(s => s.name === 'cancelled')?.value || 0,
      totalStatusCount
    ) * 100 : 0;

  return (
    <div className="analytics-dashboard">
      {/* Admin Reports Section - Enhanced */}
      {loadingAdminReports ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Đang tải báo cáo admin...</Text>
          </div>
        </div>
      ) : adminReportsData ? (
        <>
          <Title level={3} style={{ marginTop: '48px', marginBottom: '24px', textAlign: 'center', color: '#1f2937' }}>
            📊 Báo Cáo Admin - Tổng Quan Hệ Thống
          </Title>

          {/* Admin KPI Summary Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="kpi-card fade-in-up" style={{ backgroundColor: '#fafafa', border: '1px solid #e8e8e8' }}>
                <Statistic
                  title="Tổng Doanh Thu PayOS"
                  value={adminReportsData?.payments?.totalRevenue || 0}
                  precision={0}
                  valueStyle={{ color: '#4A90E2' }}
                  prefix={<DollarOutlined />}
                  suffix="VND"
                  formatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
                />
                <div className="kpi-trend">
                  <Text type="secondary">
                    {(adminReportsData?.payments?.totalTransactions || 0).toLocaleString('vi-VN')} giao dịch
                  </Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="kpi-card fade-in-up" style={{ backgroundColor: '#fafafa', border: '1px solid #e8e8e8' }}>
                <Statistic
                  title="Tổng Lịch Hẹn"
                  value={adminReportsData?.appointments?.totalAppointments || 0}
                  valueStyle={{ color: '#666' }}
                  prefix={<CalendarOutlined />}
                  formatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
                />
                <div className="kpi-trend">
                  <Text type="secondary">
                    Tháng này: {(adminReportsData?.appointments?.monthlyAppointments || 0).toLocaleString('vi-VN')}
                  </Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="kpi-card fade-in-up" style={{ backgroundColor: '#fafafa', border: '1px solid #e8e8e8' }}>
                <Statistic
                  title="Tỷ Lệ Hoàn Thành"
                  value={adminReportsData?.appointments?.completionRate || 0}
                  precision={1}
                  valueStyle={{ color: '#666' }}
                  prefix={<CheckCircleOutlined />}
                  suffix="%"
                />
                <div className="kpi-trend">
                  <Progress
                    percent={adminReportsData?.appointments?.completionRate || 0}
                    strokeColor="#666"
                    size="small"
                    showInfo={false}
                  />
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="kpi-card fade-in-up" style={{ backgroundColor: '#fafafa', border: '1px solid #e8e8e8' }}>
                <Statistic
                  title="Tỷ Lệ Hủy"
                  value={adminReportsData?.appointments?.cancellationRate || 0}
                  precision={1}
                  valueStyle={{ color: '#999' }}
                  prefix={<CloseCircleOutlined />}
                  suffix="%"
                />
                <div className="kpi-trend">
                  <Progress
                    percent={adminReportsData?.appointments?.cancellationRate || 0}
                    strokeColor="#999"
                    size="small"
                    showInfo={false}
                  />
                </div>
              </Card>
            </Col>
          </Row>

          {/* Patient Demographics */}
          <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
            <Col xs={24} lg={12}>
              <Card className="chart-card fade-in-up" title="👥 Phân Bố Bệnh Nhân Theo Giới Tính" style={{ backgroundColor: '#fafafa', border: '1px solid #e8e8e8' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Nam', value: 45 },
                        { name: 'Nữ', value: 55 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      <Cell fill="#4A90E2" />
                      <Cell fill="#F5A623" />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Tỷ lệ']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Space size="large">
                    <div>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#4A90E2', marginRight: '8px', borderRadius: '2px' }}></span>
                      <Text>Nam: 45%</Text>
                    </div>
                    <div>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#F5A623', marginRight: '8px', borderRadius: '2px' }}></span>
                      <Text>Nữ: 55%</Text>
                    </div>
                  </Space>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card className="chart-card fade-in-up" title="📊 Phân Bố Bệnh Nhân Theo Tuổi" style={{ backgroundColor: '#fafafa', border: '1px solid #e8e8e8' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[
                    { ageGroup: '18-25', count: 120, percentage: 25 },
                    { ageGroup: '26-35', count: 180, percentage: 37 },
                    { ageGroup: '36-45', count: 95, percentage: 20 },
                    { ageGroup: '46-55', count: 60, percentage: 12 },
                    { ageGroup: '55+', count: 30, percentage: 6 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="ageGroup" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'count' ? `${value} người` : `${value}%`,
                        name === 'count' ? 'Số lượng' : 'Tỷ lệ'
                      ]}
                    />
                    <Bar dataKey="count" fill="#6B73FF" name="Số lượng" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Revenue Analysis - Enhanced */}
          <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
            <Col xs={24}>
              <Card className="chart-card fade-in-up"
                    title="💰 Phân Tích Doanh Thu & Tăng Trưởng"
                    style={{ backgroundColor: '#fafafa', border: '1px solid #e8e8e8' }}
                    extra={
                      <Space>
                        <Select
                          value={revenuePeriod}
                          style={{ width: 120 }}
                          onChange={(value) => {
                            console.log('Period changed:', value);
                            setRevenuePeriod(value);
                          }}
                        >
                          <Select.Option value="weekly">Theo Tuần</Select.Option>
                          <Select.Option value="monthly">Theo Tháng</Select.Option>
                          <Select.Option value="quarterly">Theo Quý</Select.Option>
                        </Select>
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => handleExportAdminDashboard('excel')}
                          loading={exportLoading}
                          style={{ backgroundColor: '#f0f0f0', borderColor: '#d9d9d9' }}
                        >
                          Export
                        </Button>
                      </Space>
                    }>
                {getRevenueDataByPeriod().length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={getRevenueDataByPeriod()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                      <XAxis dataKey="period" fontSize={12} stroke="#666" />
                      <YAxis yAxisId="left" orientation="left" fontSize={12} stroke="#666" />
                      <YAxis yAxisId="right" orientation="right" fontSize={12} stroke="#666" />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === 'totalRevenue' ? `${Number(value).toLocaleString('vi-VN')} VND` : Number(value).toLocaleString('vi-VN'),
                          name === 'totalRevenue' ? 'Doanh thu' : 'Số giao dịch'
                        ]}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e8e8e8',
                          borderRadius: '6px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="totalRevenue" fill="#4A90E2" name="Doanh thu" />
                      <Line yAxisId="right" type="monotone" dataKey="totalTransactions" stroke="#666" strokeWidth={2} name="Số giao dịch" />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={[
                      { period: 'Tháng 1', totalRevenue: 0, totalTransactions: 0 },
                      { period: 'Tháng 2', totalRevenue: 0, totalTransactions: 0 },
                      { period: 'Tháng 3', totalRevenue: 0, totalTransactions: 0 },
                      { period: 'Tháng 4', totalRevenue: 0, totalTransactions: 0 },
                      { period: 'Tháng 5', totalRevenue: 0, totalTransactions: 0 },
                      { period: 'Tháng 6', totalRevenue: 0, totalTransactions: 0 }
                    ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                      <XAxis dataKey="period" fontSize={12} stroke="#666" />
                      <YAxis yAxisId="left" orientation="left" fontSize={12} stroke="#666" />
                      <YAxis yAxisId="right" orientation="right" fontSize={12} stroke="#666" />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === 'totalRevenue' ? `${Number(value).toLocaleString('vi-VN')} VND` : Number(value).toLocaleString('vi-VN'),
                          name === 'totalRevenue' ? 'Doanh thu' : 'Số giao dịch'
                        ]}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e8e8e8',
                          borderRadius: '6px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="totalRevenue" fill="#e8e8e8" name="Doanh thu" />
                      <Line yAxisId="right" type="monotone" dataKey="totalTransactions" stroke="#ccc" strokeWidth={2} name="Số giao dịch" />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}

                {/* Revenue Growth Indicators */}
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Doanh thu tháng này</Text>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4A90E2', marginTop: '4px' }}>
                          {formatCurrency(adminReportsData?.payments?.monthlyRevenue || 0)}
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Trung bình/giao dịch</Text>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#666', marginTop: '4px' }}>
                          {formatCurrency(adminReportsData?.payments?.averageTransactionAmount || 0)}
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Tổng giao dịch</Text>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#666', marginTop: '4px' }}>
                          {(adminReportsData?.payments?.totalTransactions || 0).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card>
            </Col>

            {/* Payment Statistics - Enhanced */}
            <Col xs={24}>
              <Card className="chart-card fade-in-up"
                    title="💳 Chi Tiết Thanh Toán PayOS"
                    style={{ backgroundColor: '#fafafa', border: '1px solid #e8e8e8' }}>

                {/* Main Stats Row */}
                <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                  <Col xs={24} sm={12} lg={6}>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0f8ff', borderRadius: '8px', border: '1px solid #d6e4ff' }}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>Tổng thu PayOS</Text>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#4A90E2', marginTop: '6px' }}>
                        {formatCurrency(adminReportsData?.payments?.totalRevenue || 0)}
                      </div>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {(adminReportsData?.payments?.totalTransactions || 0).toLocaleString('vi-VN')} giao dịch
                      </Text>
                    </div>
                  </Col>

                  <Col xs={24} sm={12} lg={6}>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>Doanh thu tháng này</Text>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#666', marginTop: '6px' }}>
                        {formatCurrency(adminReportsData?.payments?.monthlyRevenue || 0)}
                      </div>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {(adminReportsData?.payments?.monthlyTransactions || 0).toLocaleString('vi-VN')} giao dịch
                      </Text>
                    </div>
                  </Col>

                  <Col xs={24} sm={12} lg={6}>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>TB/Giao dịch</Text>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#666', marginTop: '6px' }}>
                        {formatCurrency(adminReportsData?.payments?.averageTransactionAmount || 0)}
                      </div>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        Trung bình mỗi lần
                      </Text>
                    </div>
                  </Col>

                  <Col xs={24} sm={12} lg={6}>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fff5f5', borderRadius: '8px', border: '1px solid #ffccc7' }}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>Tổng hoàn tiền</Text>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#999', marginTop: '6px' }}>
                        {formatCurrency(adminReportsData?.payments?.totalRefunded || 0)}
                      </div>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {(adminReportsData?.payments?.totalRefundTransactions || 0).toLocaleString('vi-VN')} lần hoàn tiền
                      </Text>
                    </div>
                  </Col>
                </Row>

                {/* Progress Bars Row */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <div style={{ padding: '12px', border: '1px solid #e8e8e8', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <Text strong style={{ fontSize: '14px' }}>Tỷ lệ hoàn tiền</Text>
                        <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#999' }}>
                          {formatPercentage(adminReportsData?.payments?.refundRate || 0)}
                        </Text>
                      </div>
                      <Progress
                        percent={adminReportsData?.payments?.refundRate || 0}
                        strokeColor="#999"
                        size="small"
                        showInfo={false}
                      />
                    </div>
                  </Col>

                  <Col xs={24} sm={12}>
                    <div style={{ padding: '12px', border: '1px solid #e8e8e8', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <Text strong style={{ fontSize: '14px' }}>Tỷ lệ thành công</Text>
                        <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#4A90E2' }}>
                          {formatPercentage(100 - (adminReportsData?.payments?.refundRate || 0))}
                        </Text>
                      </div>
                      <Progress
                        percent={100 - (adminReportsData?.payments?.refundRate || 0)}
                        strokeColor="#4A90E2"
                        size="small"
                        showInfo={false}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Top Doctors & Services */}
          <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
            <Col xs={24} lg={12}>
              <Card className="chart-card fade-in-up" title="🏆 Top 3 Bác Sĩ - Lịch Hẹn">
                <div>
                  {(adminReportsData?.doctors?.appointmentRankings || []).slice(0, 3).map((doctor, index) => (
                    <div key={doctor.doctorId} style={{
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: index === 0 ? '#fff7e6' : '#f5f5f5',
                      borderRadius: '6px',
                      border: index === 0 ? '2px solid #faad14' : '1px solid #e8e8e8'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong style={{ fontSize: '14px' }}>
                            {index === 0 && '👑 '}{doctor.doctorName}
                          </Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>{doctor.specialization}</Text>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                            {doctor.appointmentCount?.toLocaleString('vi-VN') || 0}
                          </div>
                          <Text type="secondary" style={{ fontSize: '11px' }}>lịch hẹn</Text>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card className="chart-card fade-in-up" title="🔥 Top 3 Dịch Vụ">
                <div>
                  {(adminReportsData?.services?.mostPopular || []).slice(0, 3).map((service) => (
                    <div key={service.serviceId} style={{
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong style={{ fontSize: '14px' }}>{service.serviceName}</Text>
                          <div>
                            <Tag color="blue" style={{ fontSize: '11px' }}>{service.serviceType}</Tag>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#722ed1' }}>
                            {service.bookingCount.toLocaleString('vi-VN')}
                          </div>
                          <Text type="secondary" style={{ fontSize: '11px' }}>đặt lịch</Text>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Peak Times & Consultation Rankings */}
          <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
            <Col xs={24} lg={12}>
              <Card className="chart-card fade-in-up" title="⏰ Thời Gian Cao Điểm">
                <div style={{ marginBottom: '16px' }}>
                  <Space>
                    <Tag color="blue">Giờ cao điểm: {adminReportsData?.peakTimes?.peakHour || 'N/A'}</Tag>
                    <Tag color="green">Ngày cao điểm: {adminReportsData?.peakTimes?.peakDay || 'N/A'}</Tag>
                  </Space>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={(adminReportsData?.peakTimes?.hourlyAnalysis || []).slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timeSlot" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip formatter={(value: number) => [value.toLocaleString('vi-VN'), 'Số lượng đặt']} />
                    <Bar dataKey="totalBookings" fill="#1890ff" name="Tổng đặt" />
                    <Bar dataKey="completedBookings" fill="#52c41a" name="Hoàn thành" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card className="chart-card fade-in-up" title="🏆 Top Bác Sĩ - Tư Vấn">
                <div>
                  {(adminReportsData?.doctors?.consultationRankings || []).slice(0, 5).map((doctor, index) => (
                    <div key={doctor.doctorId} style={{
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: index === 0 ? '#f6ffed' : '#f5f5f5',
                      borderRadius: '6px',
                      border: index === 0 ? '2px solid #52c41a' : '1px solid #e8e8e8'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong style={{ fontSize: '14px' }}>
                            {index === 0 && '🥇 '}{doctor.doctorName}
                          </Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>{doctor.specialization}</Text>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                            {doctor.consultationCount?.toLocaleString('vi-VN') || 0}
                          </div>
                          <Text type="secondary" style={{ fontSize: '11px' }}>tư vấn</Text>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Service Rankings & Discounted Packages */}
          <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
            <Col xs={24} lg={12}>
              <Card className="chart-card fade-in-up" title="📈 Dịch Vụ Phổ Biến / Ít Phổ Biến">
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ color: '#52c41a' }}>Nhiều nhất:</Text>
                  {(adminReportsData?.services?.mostPopular || []).slice(0, 3).map((service) => (
                    <div key={service.serviceId} style={{
                      padding: '8px',
                      marginTop: '8px',
                      backgroundColor: '#f6ffed',
                      borderRadius: '4px',
                      border: '1px solid #b7eb8f'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: '13px' }}>{service.serviceName}</Text>
                        <Text strong style={{ color: '#52c41a' }}>{service.bookingCount.toLocaleString('vi-VN')}</Text>
                      </div>
                    </div>
                  ))}
                </div>
                <Divider />
                <div>
                  <Text strong style={{ color: '#f5222d' }}>❄️ Ít nhất:</Text>
                  {(adminReportsData?.services?.leastPopular || []).slice(0, 2).map((service) => (
                    <div key={service.serviceId} style={{
                      padding: '8px',
                      marginTop: '8px',
                      backgroundColor: '#fff2f0',
                      borderRadius: '4px',
                      border: '1px solid #ffccc7'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: '13px' }}>{service.serviceName}</Text>
                        <Text strong style={{ color: '#f5222d' }}>{service.bookingCount.toLocaleString('vi-VN')}</Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card className="chart-card fade-in-up" title="📦 Gói Dịch Vụ & Giảm Giá">
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ color: '#1890ff' }}>🏆 Phổ biến nhất:</Text>
                  {(adminReportsData?.packages?.mostPopular || []).slice(0, 3).map((pkg) => (
                    <div key={pkg.packageId} style={{
                      padding: '8px',
                      marginTop: '8px',
                      backgroundColor: '#e6f7ff',
                      borderRadius: '4px',
                      border: '1px solid #91d5ff'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: '13px' }}>{pkg.packageName}</Text>
                        <Text strong style={{ color: '#1890ff' }}>{pkg.bookingCount.toLocaleString('vi-VN')}</Text>
                      </div>
                    </div>
                  ))}
                </div>

                {(adminReportsData?.packages?.discountedPackages || []).length > 0 && (
                  <>
                    <Divider />
                    <div>
                      <Text strong style={{ color: '#f5222d' }}>🏷️ Đang giảm giá ({adminReportsData?.packages?.totalDiscountedPackages || 0}):</Text>
                      {(adminReportsData?.packages?.discountedPackages || []).slice(0, 3).map((pkg) => (
                        <div key={pkg._id} style={{
                          padding: '8px',
                          marginTop: '8px',
                          backgroundColor: '#fff2f0',
                          borderRadius: '4px',
                          border: '1px solid #ffccc7'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: '13px' }}>{pkg.name}</Text>
                            <Space>
                              <Text strong style={{ color: '#f5222d' }}>{formatCurrency(pkg.price)}</Text>
                              <Tag color="red" style={{ fontSize: '11px' }}>-{pkg.discountPercentage}%</Tag>
                            </Space>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Card style={{ backgroundColor: '#fafafa', border: '1px solid #e8e8e8' }}>
            <div style={{ padding: '40px' }}>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                📊 Chưa có dữ liệu báo cáo admin
              </Text>
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Vui lòng kiểm tra kết nối API hoặc liên hệ quản trị viên
                </Text>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Detailed Report Section */}
             <Card className="chart-card fade-in-up" title="Báo Cáo Chi Tiết Cuộc Hẹn"
             extra={<Space>
               <Text type="secondary">Lọc và xuất dữ liệu chi tiết</Text>
               <Button 
                 size="small" 
                 type="dashed" 
                 onClick={async () => {
                   try {
                     const response = await fetch('/api/reports/seed-sample-data', {
                       method: 'POST',
                       headers: {
                         'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                         'Content-Type': 'application/json'
                       }
                     });
                     if (response.ok) {
                       message.success('Tạo dữ liệu mẫu thành công! Vui lòng refresh trang.');
                       window.location.reload();
                     } else {
                       message.error('Chỉ Admin mới có thể tạo dữ liệu mẫu.');
                     }
                   } catch {
                     message.error('Lỗi khi tạo dữ liệu mẫu.');
                   }
                 }}
               >
                 Tạo Dữ Liệu Mẫu
               </Button>
             </Space>}
             style={{ marginBottom: '24px' }}>
         <div className="filter-section">
         <Row gutter={[16, 16]} align="bottom" className="filter-controls">
                     <Col className="filter-item">
             <Text strong>Khoảng ngày</Text>
             <RangePicker 
               onChange={(_, dateStrings) => setFilters(prev => ({...prev, dateFrom: dateStrings[0], dateTo: dateStrings[1]}))}
               style={{ width: 200 }}
             />
           </Col>
           <Col className="filter-item">
             <Text strong>Trạng thái</Text>
             <Select
               mode="multiple"
               allowClear
               style={{ width: 250 }}
               placeholder="Chọn trạng thái"
               onChange={(value) => setFilters(prev => ({...prev, appointmentStatus: value}))}
               options={APPOINTMENT_STATUS_OPTIONS}
             />
           </Col>
           <Col className="filter-item">
             <Text strong>Bác sĩ</Text>
             <Select
               allowClear
               style={{ width: 250 }}
               placeholder="Chọn bác sĩ"
               onChange={(value) => setFilters(prev => ({...prev, doctorId: value}))}
               options={doctors.map(d => ({ label: d.userId.fullName, value: d._id }))}
               showSearch
               filterOption={(input, option) =>
                 (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
               }
             />
           </Col>
           <Col>
             <Button className="enhanced-button" type="primary" size="large" onClick={handleFilter} loading={loadingDetailed}>
               Áp dụng Bộ Lọc
             </Button>
           </Col>
           <Col>
             <Button 
               className="enhanced-button"
               icon={<DownloadOutlined />} 
               size="large"
               onClick={handleExport} 
               disabled={detailedData.length === 0}
               type="default"
             >
               Xuất Excel
             </Button>
           </Col>
                 </Row>
         </div>

         <div className="enhanced-table">
         <Table
           dataSource={detailedData}
           columns={columns}
           loading={loadingDetailed}
           rowKey="id"
           scroll={{ x: 'max-content' }}
           pagination={{
             pageSize: 20,
             showSizeChanger: true,
             showQuickJumper: true,
             showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`,
           }}
           size="middle"
         />
         </div>
      </Card>
    </div>
  );
};

export default ReportsPage;