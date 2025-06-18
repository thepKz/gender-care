import React from 'react';
import { Card, Row, Col, Typography, Tag, Progress, Space } from 'antd';
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Mock data for staff schedule overview
const scheduleOverview = {
  todayStats: {
    total: 12,
    completed: 7,
    inProgress: 2,
    pending: 3,
    cancelled: 0
  },
  appointmentTypes: {
    clinic: 8,
    online: 4
  },
  upcomingAppointments: [
    {
      id: '1',
      time: '14:00',
      patientName: 'Nguyễn Văn An',
      doctorName: 'BS. Lê Thị Mai',
      type: 'clinic',
      service: 'Khám sản khoa',
      status: 'confirmed'
    },
    {
      id: '2',
      time: '14:30',
      patientName: 'Trần Thị Bích',
      doctorName: 'BS. Phạm Minh Đức',
      type: 'online',
      service: 'Tư vấn dinh dưỡng',
      status: 'pending'
    },
    {
      id: '3',
      time: '15:00',
      patientName: 'Hoàng Văn Tùng',
      doctorName: 'BS. Lê Thị Mai',
      type: 'clinic',
      service: 'Xét nghiệm STI',
      status: 'confirmed'
    }
  ]
};

const ScheduleOverview: React.FC = () => {
  const { todayStats, appointmentTypes, upcomingAppointments } = scheduleOverview;
  
  const completionRate = Math.round((todayStats.completed / todayStats.total) * 100);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'in-progress': return 'processing';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'pending': return 'Chờ xác nhận';
      case 'in-progress': return 'Đang thực hiện';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <span>Tổng quan lịch hẹn hôm nay</span>
        </div>
      }
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #e8e8e8'
      }}
    >
      <Row gutter={[16, 16]}>
        {/* Stats Overview */}
        <Col xs={24} md={12}>
          <div style={{ 
            textAlign: 'center',
            padding: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
              {todayStats.total}
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
              Tổng lịch hẹn hôm nay
            </Text>
            <div style={{ marginTop: '12px' }}>
              <Progress 
                percent={completionRate} 
                strokeColor="rgba(255,255,255,0.9)"
                trailColor="rgba(255,255,255,0.2)"
                showInfo={false}
                size="small"
              />
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                {completionRate}% hoàn thành
              </Text>
            </div>
          </div>
        </Col>

        {/* Status Breakdown */}
        <Col xs={24} md={12}>
          <div style={{ padding: '16px' }}>
            <Title level={5} style={{ marginBottom: '16px' }}>Trạng thái lịch hẹn</Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text>Đã hoàn thành</Text>
                </Space>
                <Tag color="success">{todayStats.completed}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#1890ff' }} />
                  <Text>Đang thực hiện</Text>
                </Space>
                <Tag color="processing">{todayStats.inProgress}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                  <Text>Chờ xác nhận</Text>
                </Space>
                <Tag color="warning">{todayStats.pending}</Tag>
              </div>
            </Space>
          </div>
        </Col>

        {/* Appointment Types */}
        <Col xs={24} md={12}>
          <div style={{ padding: '16px' }}>
            <Title level={5} style={{ marginBottom: '16px' }}>Loại dịch vụ</Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <EnvironmentOutlined style={{ color: '#fa8c16' }} />
                  <Text>Khám tại phòng</Text>
                </Space>
                <Tag color="orange">{appointmentTypes.clinic}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <VideoCameraOutlined style={{ color: '#1890ff' }} />
                  <Text>Tư vấn trực tuyến</Text>
                </Space>
                <Tag color="blue">{appointmentTypes.online}</Tag>
              </div>
            </Space>
          </div>
        </Col>

        {/* Upcoming Appointments */}
        <Col xs={24} md={12}>
          <div style={{ padding: '16px' }}>
            <Title level={5} style={{ marginBottom: '16px' }}>Lịch hẹn sắp tới</Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {upcomingAppointments.slice(0, 3).map((appointment) => (
                <div 
                  key={appointment.id}
                  style={{
                    padding: '8px 12px',
                    background: '#fafafa',
                    borderRadius: '8px',
                    border: '1px solid #f0f0f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <Space>
                      <ClockCircleOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
                      <Text strong style={{ fontSize: '13px' }}>{appointment.time}</Text>
                      {appointment.type === 'online' ? 
                        <VideoCameraOutlined style={{ color: '#1890ff', fontSize: '12px' }} /> :
                        <EnvironmentOutlined style={{ color: '#fa8c16', fontSize: '12px' }} />
                      }
                    </Space>
                    <Tag color={getStatusColor(appointment.status)} size="small">
                      {getStatusText(appointment.status)}
                    </Tag>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <Text style={{ fontSize: '12px' }}>{appointment.patientName}</Text>
                    <span style={{ margin: '0 4px', color: '#d9d9d9' }}>•</span>
                    <Text style={{ fontSize: '12px' }}>{appointment.doctorName}</Text>
                  </div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                    {appointment.service}
                  </div>
                </div>
              ))}
            </Space>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default ScheduleOverview; 