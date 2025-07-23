import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Typography, DatePicker, Select, Button, Table, message, Tag, Progress, Statistic, Space, Divider, Modal } from 'antd';
import { DownloadOutlined, RiseOutlined, FallOutlined, CalendarOutlined, DollarOutlined, ClockCircleOutlined, CheckCircleOutlined, FileExcelOutlined } from '@ant-design/icons';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, ComposedChart, RadialBarChart, RadialBar,
  FunnelChart, Funnel, LabelList, ScatterChart, Scatter, Treemap, ReferenceArea, ReferenceLine
} from 'recharts';
import { fetchManagementReports, ReportsResponse, fetchDetailedReport, exportDetailedReport, ReportFilters, DetailedAppointment } from '../../../api/endpoints/reports';
import { doctorApi, Doctor } from '../../../api/endpoints/doctorApi';
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

  // Fetch initial overview data, analytics data, and doctors list
  useEffect(() => {
    (async () => {
      setLoadingOverview(true);
      setLoadingAnalytics(true);
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
      } catch (err) {
        console.error('Failed to fetch initial page data', err);
        message.error('Không thể tải dữ liệu tổng quan hoặc analytics.');
      } finally {
        setLoadingOverview(false);
        setLoadingAnalytics(false);
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
  
  // Handler for exporting detailed report to Excel
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

  // Handler for exporting overview report to Excel
  const handleExportOverview = async () => {
    if (!overviewData) {
      message.warning('Không có dữ liệu tổng quan để xuất.');
      return;
    }

    // Hiển thị modal xác nhận
    Modal.confirm({
      title: 'Xuất Báo Cáo Tổng Quan',
      content: (
        <div>
          <p>Bạn có muốn xuất báo cáo tổng quan ra file Excel không?</p>
          <p><strong>Báo cáo sẽ bao gồm:</strong></p>
          <ul>
            <li>📊 Doanh thu theo tháng (12 tháng gần nhất)</li>
            <li>👥 Phân bố người dùng theo vai trò</li>
            <li>📅 Trạng thái cuộc hẹn</li>
            <li>📈 Cuộc hẹn 7 ngày gần nhất</li>
            <li>🎯 Tóm tắt các chỉ số KPI</li>
          </ul>
        </div>
      ),
      okText: 'Xuất Excel',
      cancelText: 'Hủy',
      icon: <FileExcelOutlined style={{ color: '#52c41a' }} />,
      onOk: async () => {
        await performExportOverview();
      }
    });
  };

  const performExportOverview = async () => {
    setLoadingOverview(true);
    try {
      // Tạo workbook Excel
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();

      // Sheet 1: Doanh thu theo tháng
      const revenueSheet = workbook.addWorksheet('Doanh Thu Theo Tháng');
      revenueSheet.addRow(['Tháng', 'Doanh Thu (VND)']);
      revenueData.forEach(item => {
        revenueSheet.addRow([item.month, item.total]);
      });

      // Sheet 2: Phân bố người dùng
      const userSheet = workbook.addWorksheet('Phân Bố Người Dùng');
      userSheet.addRow(['Vai Trò', 'Số Lượng']);
      roleDistribution.forEach(item => {
        userSheet.addRow([item.name, item.value]);
      });

      // Sheet 3: Trạng thái cuộc hẹn
      const statusSheet = workbook.addWorksheet('Trạng Thái Cuộc Hẹn');
      statusSheet.addRow(['Trạng Thái', 'Số Lượng']);
      statusCounts.forEach(item => {
        statusSheet.addRow([item.name, item.value]);
      });

      // Sheet 4: Cuộc hẹn 7 ngày
      const appointmentSheet = workbook.addWorksheet('Cuộc Hẹn 7 Ngày');
      appointmentSheet.addRow(['Ngày', 'Số Cuộc Hẹn']);
      appointments7d.forEach(item => {
        appointmentSheet.addRow([item.date, item.count]);
      });

      // Sheet 5: Tóm tắt KPI
      const kpiSheet = workbook.addWorksheet('Tóm Tắt KPI');
      kpiSheet.addRow(['Chỉ Số', 'Giá Trị']);
      kpiSheet.addRow(['Tổng Doanh Thu (VND)', totalRevenue]);
      kpiSheet.addRow(['Tổng Cuộc Hẹn (7 ngày)', totalAppointments]);
      kpiSheet.addRow(['Tỷ Lệ Hoàn Thành (%)', completionRate.toFixed(2)]);
      kpiSheet.addRow(['Tỷ Lệ Hủy Bỏ (%)', cancellationRate.toFixed(2)]);
      kpiSheet.addRow(['Trung Bình Doanh Thu/Tháng (VND)', avgRevenuePerMonth.toFixed(0)]);
      kpiSheet.addRow(['Trung Bình Cuộc Hẹn/Ngày', avgAppointmentsPerDay.toFixed(1)]);

      // Định dạng header cho tất cả sheets
      [revenueSheet, userSheet, statusSheet, appointmentSheet, kpiSheet].forEach(sheet => {
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1890FF' }
        };
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Auto-fit columns
        sheet.columns.forEach(column => {
          column.width = 20;
        });
      });

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bao-Cao-Tong-Quan-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('Xuất báo cáo tổng quan thành công!');
    } catch (err) {
      console.error('Failed to export overview report', err);
      message.error('Lỗi khi xuất báo cáo tổng quan.');
    } finally {
      setLoadingOverview(false);
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
      <div className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <Title level={2} className="dashboard-title" style={{ margin: 0 }}>
              📊 Analytics Dashboard - Hệ thống Y tế
            </Title>
            <Text className="dashboard-subtitle">Báo cáo tổng quan và phân tích chi tiết hiệu suất hệ thống</Text>
          </div>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            size="large"
            onClick={handleExportOverview}
            loading={loadingOverview}
            className="enhanced-button"
          >
            Xuất Báo Cáo Tổng Quan
          </Button>
        </div>
      </div>
      
      {/* KPI Cards Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card fade-in-up">
            <Statistic
              title="Tổng Doanh Thu (12 tháng)"
              value={totalRevenue}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="VND"
              formatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
            />
            <div style={{ marginTop: '12px' }}>
              <Button
                type="link"
                size="small"
                icon={<FileExcelOutlined />}
                onClick={handleExportOverview}
                loading={loadingOverview}
              >
                Xuất Excel
              </Button>
            </div>
          </Card>
        </Col>
        
                 <Col xs={24} sm={12} lg={6}>
           <Card className="kpi-card fade-in-up">
             <Statistic
               title="Lịch Hẹn (7 ngày)"
               value={totalAppointments}
               valueStyle={{ color: '#1890ff' }}
               prefix={<CalendarOutlined />}
               suffix="cuộc hẹn"
             />
           </Card>
         </Col>
         
         <Col xs={24} sm={12} lg={6}>
           <Card className="kpi-card fade-in-up">
             <Statistic
               title="Tỷ Lệ Hoàn Thành"
               value={completionRate}
               precision={1}
               valueStyle={{ color: '#722ed1' }}
               prefix={<CheckCircleOutlined />}
               suffix="%"
             />
             
           </Card>
         </Col>
         
         <Col xs={24} sm={12} lg={6}>
           <Card className="kpi-card fade-in-up">
             <Statistic
               title="Trung Bình/Ngày"
               value={avgAppointmentsPerDay}
               precision={0}
               valueStyle={{ color: '#fa8c16' }}
               prefix={<ClockCircleOutlined />}
               suffix="cuộc hẹn"
             />
            
           </Card>
         </Col>
      </Row>

      {/* Main Analytics Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {/* Revenue Trend with Growth */}
                 <Col xs={24} lg={16}>
           <Card className="chart-card fade-in-up" title="📈 Phân Tích Doanh Thu & Tăng Trưởng" 
                 extra={<Text type="secondary">12 tháng gần nhất</Text>}>
             <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={revenueWithGrowth} margin={CHART_CONFIG.margin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={CHART_CONFIG.fontSize} />
                <YAxis yAxisId="left" orientation="left" fontSize={CHART_CONFIG.fontSize} />
                <YAxis yAxisId="right" orientation="right" fontSize={CHART_CONFIG.fontSize} />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'Doanh thu') {
                      return [`${Number(value).toLocaleString('vi-VN')} VND`, name];
                    }
                    return [`${Number(value).toFixed(1)}%`, name];
                  }}
                />
                <Legend />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <Area yAxisId="left" type="monotone" dataKey="total" stroke="#1890ff" 
                      fill="url(#revenueGradient)" name="Doanh thu" />
                <Bar yAxisId="right" dataKey="growth" fill="#52c41a" name="Tăng trưởng (%)" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Performance Metrics */}
                 <Col xs={24} lg={8}>
           <Card className="performance-card fade-in-up" title="🎯 Chỉ Số Hiệu Suất" style={{ height: '471px' }}>
             <div className="performance-content">
                             <div className="performance-item">
                 <Text strong>Tỷ lệ hoàn thành</Text>
                 <Progress 
                   className="enhanced-progress"
                   percent={isFinite(completionRate) ? completionRate : 0} 
                   strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                   format={() => formatSafePercentage(completionRate)}
                 />
               </div>
               
               <div className="performance-item">
                 <Text strong>Tỷ lệ hủy bỏ</Text>
                 <Progress 
                   className="enhanced-progress"
                   percent={isFinite(cancellationRate) ? cancellationRate : 0} 
                   strokeColor="#ff4d4f"
                   format={() => formatSafePercentage(cancellationRate)}
                 />
               </div>
               
               <div className="performance-item">
                 <Text strong>Hiệu suất tổng thể</Text>
                 <Progress 
                   className="enhanced-progress"
                   percent={isFinite(100 - cancellationRate) ? (100 - cancellationRate) : 0} 
                   strokeColor="#722ed1"
                   format={() => formatSafePercentage(100 - cancellationRate)}
                 />
               </div>
               
               <Divider />
               
               <div className="performance-stats">
                 <div className="stat-row">
                   <span className="stat-label">Doanh thu TB/tháng:</span>
                   <span className="stat-value">{isFinite(avgRevenuePerMonth) ? avgRevenuePerMonth.toLocaleString('vi-VN') : '0'} VND</span>
                 </div>
                 <div className="stat-row">
                   <span className="stat-label">Lịch hẹn TB/ngày:</span>
                   <span className="stat-value">{isFinite(avgAppointmentsPerDay) ? avgAppointmentsPerDay.toFixed(1) : '0.0'}</span>
                 </div>
                 <div className="stat-row">
                   <span className="stat-label">Tổng người dùng:</span>
                   <span className="stat-value">{roleDistribution.reduce((sum, role) => sum + role.value, 0)}</span>
                 </div>
               </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Advanced Analytics Row */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {/* Appointment Trends with Moving Average */}
                 <Col xs={24} lg={12}>
           <Card className="chart-card fade-in-up" title="📅 Xu Hướng Lịch Hẹn" extra={<Text type="secondary">Với đường trung bình động</Text>}>
             <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={appointmentTrends} margin={CHART_CONFIG.margin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dateLabel" fontSize={CHART_CONFIG.fontSize} />
                <YAxis fontSize={CHART_CONFIG.fontSize} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#1890ff" name="Lịch hẹn thực tế" />
                <Line type="monotone" dataKey="moving_avg" stroke="#ff7300" 
                      strokeWidth={3} name="Trung bình động (3 ngày)" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Status Distribution with Enhanced Styling */}
                 <Col xs={24} lg={12}>
           <Card className="chart-card fade-in-up" title="📊 Phân Bố Trạng Thái Lịch Hẹn">
             <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  dataKey="value" 
                  data={statusCounts} 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100}
                  innerRadius={40}
                  paddingAngle={5}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} cuộc hẹn`, 'Số lượng']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* User Analytics & Revenue Distribution */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {/* User Role Distribution */}
                 <Col xs={24} lg={8}>
           <Card className="chart-card fade-in-up" title="👥 Phân Bố Người Dùng">
             <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  dataKey="value" 
                  data={roleDistribution} 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80}
                  innerRadius={30}
                  paddingAngle={3}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} người dùng`, 'Số lượng']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Revenue Cumulative */}
                 <Col xs={24} lg={16}>
           <Card className="chart-card fade-in-up" title="💰 Doanh Thu Tích Lũy" extra={<Text type="secondary">Xu hướng tăng trưởng tích lũy</Text>}>
             <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueWithGrowth} margin={CHART_CONFIG.margin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={CHART_CONFIG.fontSize} />
                <YAxis fontSize={CHART_CONFIG.fontSize} />
                <Tooltip 
                  formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} VND`, 'Doanh thu tích lũy']}
                />
                <defs>
                  <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#722ed1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#722ed1" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="cumulative" stroke="#722ed1" 
                      fill="url(#cumulativeGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Advanced Business Intelligence */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {/* Monthly Revenue Heatmap */}
        <Col xs={24}>
          <Card className="chart-card fade-in-up" title="🗓️ Doanh Thu Theo Tháng (Heatmap)" extra={<Text type="secondary">12 tháng gần nhất</Text>}>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={revenueWithGrowth} margin={CHART_CONFIG.margin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={CHART_CONFIG.fontSize} />
                <YAxis fontSize={CHART_CONFIG.fontSize} />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'Doanh thu') return [formatCurrency(Number(value)), name];
                    if (name === 'Mục tiêu') return [formatCurrency(Number(value)), name];
                    return [`${Number(value).toFixed(1)}%`, name];
                  }}
                />
                <Legend />
                <defs>
                  <linearGradient id="revenueHeatmap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fa8c16" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#fa8c16" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52c41a" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#52c41a" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="total" stroke="#fa8c16"
                      fill="url(#revenueHeatmap)" name="Doanh thu" />
                <Area type="monotone" dataKey={(item: any) => item.total * 1.2} stroke="#52c41a"
                      fill="url(#targetGradient)" name="Mục tiêu" strokeDasharray="5 5" />
                <ReferenceLine y={safeDivision(totalRevenue, revenueData.length)} stroke="#ff4d4f" strokeDasharray="8 4"
                               label="Trung bình" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Quick Export Section */}
      <Card className="chart-card fade-in-up" style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Space size="large">
          <div>
            <FileExcelOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
            <div>
              <Text strong>Xuất Báo Cáo Tổng Quan</Text>
              <br />
              <Text type="secondary">Tất cả dữ liệu analytics trong một file Excel</Text>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<FileExcelOutlined />}
            onClick={handleExportOverview}
            loading={loadingOverview}
            className="enhanced-button"
          >
            Tải Xuống Excel
          </Button>
        </Space>
      </Card>

      {/* Detailed Report Section */}
             <Card className="chart-card fade-in-up" title="📋 Báo Cáo Chi Tiết Cuộc Hẹn" 
             extra={<Space>
              
             </Space>}
             style={{ marginBottom: '24px' }}>
         <div className="filter-section">
         <Row gutter={[16, 16]} align="bottom" className="filter-controls">
                     <Col className="filter-item">
             <Text strong>Khoảng ngày</Text>
             <RangePicker 
               onChange={(dates, dateStrings) => setFilters(prev => ({...prev, dateFrom: dateStrings[0], dateTo: dateStrings[1]}))} 
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