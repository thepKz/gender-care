import React from 'react';
import { Card, Row, Col, Statistic, Typography, Timeline, Avatar, List, Tag, Progress, Divider } from 'antd';
import { 
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  VideoCameraOutlined,
  DollarOutlined
} from '@ant-design/icons';
import DoctorSchedulePreview from '../../../components/feature/dashboard/DoctorSchedulePreview';
import { calculateDashboardStats } from '../../../shared/mockData/doctorScheduleMockData';

const { Title, Text } = Typography;

const DoctorDashboard: React.FC = () => {
  const stats = calculateDashboardStats();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Bảng điều khiển bác sĩ
        </Title>
        <Text type="secondary">
          Chào mừng trở lại! Hôm nay bạn có {stats.todayTotal} lịch hẹn.
        </Text>
      </div>

      {/* Enhanced Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Lịch hẹn hôm nay"
              value={stats.todayTotal}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tư vấn online"
              value={stats.online}
              prefix={<VideoCameraOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu tháng"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đã hoàn thành"
              value={stats.completed}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Schedule Dashboard */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title="Lịch làm việc hôm nay" 
            extra={<a href="/dashboard/doctor/my-schedule">Xem chi tiết</a>}
            style={{ height: '100%' }}
          >
            <DoctorSchedulePreview 
              showStats={false} 
              showActions={true}
              maxItems={5}
            />
          </Card>
        </Col>

        {/* Performance & Stats */}
        <Col xs={24} lg={8}>
          <Card title="Hiệu suất công việc" style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Text>Tỷ lệ hoàn thành</Text>
              <Progress percent={Math.round((stats.completed / Math.max(stats.todayTotal, 1)) * 100)} size="small" strokeColor="#52c41a" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text>Lịch hẹn tháng này</Text>
              <Progress 
                percent={Math.round((stats.totalAppointments / 30) * 100)} 
                size="small" 
                strokeColor="#1890ff" 
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text>Tư vấn online</Text>
              <Progress 
                percent={Math.round((stats.totalConsultations / 25) * 100)} 
                size="small" 
                strokeColor="#722ed1" 
              />
            </div>
            <div>
              <Text>Tỷ lệ xác nhận</Text>
              <Progress 
                percent={Math.round((stats.confirmed / Math.max(stats.todayTotal, 1)) * 100)} 
                size="small" 
                strokeColor="#faad14" 
              />
            </div>
          </Card>

          <Card title="Thống kê chi tiết" style={{ marginBottom: '16px' }}>
            <List
              size="small"
              dataSource={[
                { label: 'Tổng lịch hẹn', value: stats.totalAppointments },
                { label: 'Đã hoàn thành', value: stats.completed },
                { label: 'Chờ xác nhận', value: stats.pending },
                { label: 'Tư vấn online', value: stats.totalConsultations },
                { label: 'Doanh thu tháng', value: `${stats.totalRevenue.toLocaleString('vi-VN')} VNĐ` }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Text type="secondary">{item.label}:</Text>
                    <Text strong>{item.value}</Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          <Card title="Thông tin cá nhân">
            <List
              size="small"
              dataSource={[
                { label: 'Chuyên khoa', value: 'Sản phụ khoa' },
                { label: 'Kinh nghiệm', value: '8 năm' },
                { label: 'Bằng cấp', value: 'Thạc sĩ Y khoa' },
                { label: 'Tỷ lệ hoàn thành', value: `${Math.round((stats.completed / Math.max(stats.todayTotal, 1)) * 100)}%` }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Text type="secondary">{item.label}:</Text>
                    <Text strong>{item.value}</Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DoctorDashboard; 