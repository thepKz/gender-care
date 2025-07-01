import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Typography, DatePicker, Select, Button, Table, message, Tag, Progress, Statistic, Space, Divider } from 'antd';
import { DownloadOutlined, RiseOutlined, FallOutlined, CalendarOutlined, DollarOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, ComposedChart
} from 'recharts';
import { fetchManagementReports, ReportsResponse, fetchDetailedReport, exportDetailedReport, ReportFilters, DetailedAppointment } from '../../../api/endpoints/reports';
import { doctorApi, Doctor } from '../../../api/endpoints/doctorApi';
import '../../../styles/dashboard.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Professional color palettes
const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa541c'];
const GRADIENT_COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
const STATUS_COLORS = {
  'pending': '#faad14',
  'confirmed': '#52c41a', 
  'completed': '#1890ff',
  'cancelled': '#f5222d',
  'missed': '#8c8c8c'
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
];

const ReportsPage: React.FC = () => {
  // State for overview charts
  const [overviewData, setOverviewData] = useState<ReportsResponse | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // State for detailed report
  const [filters, setFilters] = useState<Omit<ReportFilters, 'reportType'>>({});
  const [detailedData, setDetailedData] = useState<DetailedAppointment[]>([]);
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Fetch initial overview data and doctors list
  useEffect(() => {
    (async () => {
      setLoadingOverview(true);
      try {
        const [reportsResp, doctorsResp] = await Promise.all([
          fetchManagementReports(),
          doctorApi.getAllDoctors()
        ]);
        setOverviewData(reportsResp);
        setDoctors(doctorsResp || []);
      } catch (err) {
        console.error('Failed to fetch initial page data', err);
        message.error('Không thể tải dữ liệu tổng quan.');
      } finally {
        setLoadingOverview(false);
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
    if (detailedData.length === 0) {
      message.warn('Không có dữ liệu để xuất. Vui lòng áp dụng bộ lọc trước.');
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

  // Calculate additional metrics for enhanced analytics
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.total, 0);
  const totalAppointments = appointments7d.reduce((sum, item) => sum + item.count, 0);
  const avgRevenuePerMonth = totalRevenue / 12;
  const avgAppointmentsPerDay = totalAppointments / 7;
  
  // Calculate growth trends
  const revenueGrowth = revenueData.length >= 2 ? 
    ((revenueData[revenueData.length - 1]?.total - revenueData[revenueData.length - 2]?.total) / revenueData[revenueData.length - 2]?.total * 100) : 0;
  
  const appointmentGrowth = appointments7d.length >= 2 ?
    ((appointments7d[appointments7d.length - 1]?.count - appointments7d[appointments7d.length - 2]?.count) / appointments7d[appointments7d.length - 2]?.count * 100) : 0;

  // Prepare enhanced data for advanced charts
  const revenueWithGrowth = revenueData.map((item, index) => ({
    ...item,
    growth: index > 0 ? ((item.total - revenueData[index - 1].total) / revenueData[index - 1].total * 100) : 0,
    cumulative: revenueData.slice(0, index + 1).reduce((sum, r) => sum + r.total, 0)
  }));

  const appointmentTrends = appointments7d.map((item, index) => ({
    ...item,
    moving_avg: index >= 2 ? 
      appointments7d.slice(Math.max(0, index - 2), index + 1).reduce((sum, a) => sum + a.count, 0) / 3 : item.count,
    trend: index > 0 ? (item.count > appointments7d[index - 1].count ? 'up' : 'down') : 'stable'
  }));

  // Performance metrics
  const completionRate = statusCounts.length > 0 ? 
    ((statusCounts.find(s => s.name === 'completed')?.value || 0) / statusCounts.reduce((sum, s) => sum + s.value, 0) * 100) : 0;

  const cancellationRate = statusCounts.length > 0 ?
    ((statusCounts.find(s => s.name === 'cancelled')?.value || 0) / statusCounts.reduce((sum, s) => sum + s.value, 0) * 100) : 0;

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <Title level={2} className="dashboard-title">
          📊 Analytics Dashboard - Hệ thống Y tế
        </Title>
        <Text className="dashboard-subtitle">Báo cáo tổng quan và phân tích chi tiết hiệu suất hệ thống</Text>
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
            <div className="kpi-trend">
              {revenueGrowth >= 0 ? (
                <RiseOutlined style={{ color: '#3f8600' }} />
              ) : (
                <FallOutlined style={{ color: '#cf1322' }} />
              )}
              <Text type="secondary">
                {revenueGrowth.toFixed(1)}% so với tháng trước
              </Text>
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
                           <div className="kpi-trend">
                {appointmentGrowth >= 0 ? (
                  <RiseOutlined style={{ color: '#3f8600' }} />
                ) : (
                  <FallOutlined style={{ color: '#cf1322' }} />
                )}
                <Text type="secondary">
                  {appointmentGrowth.toFixed(1)}% so với ngày trước
                </Text>
              </div>
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
             <div className="kpi-trend">
               <Progress percent={completionRate} strokeColor="#722ed1" size="small" className="enhanced-progress" />
             </div>
           </Card>
         </Col>
         
         <Col xs={24} sm={12} lg={6}>
           <Card className="kpi-card fade-in-up">
             <Statistic
               title="Trung Bình/Ngày"
               value={avgAppointmentsPerDay}
               precision={1}
               valueStyle={{ color: '#fa8c16' }}
               prefix={<ClockCircleOutlined />}
               suffix="cuộc hẹn"
             />
             <div className="kpi-trend">
               <Text type="secondary">Hủy: {cancellationRate.toFixed(1)}%</Text>
             </div>
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
                   percent={completionRate} 
                   strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                   format={() => `${completionRate.toFixed(1)}%`}
                 />
               </div>
               
               <div className="performance-item">
                 <Text strong>Tỷ lệ hủy bỏ</Text>
                 <Progress 
                   className="enhanced-progress"
                   percent={cancellationRate} 
                   strokeColor="#ff4d4f"
                   format={() => `${cancellationRate.toFixed(1)}%`}
                 />
               </div>
               
               <div className="performance-item">
                 <Text strong>Hiệu suất tổng thể</Text>
                 <Progress 
                   className="enhanced-progress"
                   percent={100 - cancellationRate} 
                   strokeColor="#722ed1"
                   format={() => `${(100 - cancellationRate).toFixed(1)}%`}
                 />
               </div>
               
               <Divider />
               
               <div className="performance-stats">
                 <div className="stat-row">
                   <span className="stat-label">Doanh thu TB/tháng:</span>
                   <span className="stat-value">{avgRevenuePerMonth.toLocaleString('vi-VN')} VND</span>
                 </div>
                 <div className="stat-row">
                   <span className="stat-label">Lịch hẹn TB/ngày:</span>
                   <span className="stat-value">{avgAppointmentsPerDay.toFixed(1)}</span>
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

      {/* Detailed Report Section */}
             <Card className="chart-card fade-in-up" title="📋 Báo Cáo Chi Tiết Cuộc Hẹn" 
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
                   } catch (error) {
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