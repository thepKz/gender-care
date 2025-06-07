import React from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Table, 
  Tag, 
  Space, 
  Button,
  Avatar,
  Typography,
  List,
  Progress
} from 'antd';
import { 
  CalendarOutlined,
  RiseOutlined,
  FallOutlined,
  EyeOutlined,
  MoreOutlined,
  HeartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

// Mock data cho Staff Dashboard
const staffStatsData = [
  {
    title: 'Today\'s Appointments',
    value: 12,
    icon: <CalendarOutlined />,
    color: '#3b82f6',
    change: '+3 from yesterday',
    trend: 'up'
  },
  {
    title: 'Completed Consultations', 
    value: 8,
    icon: <CheckCircleOutlined />,
    color: '#10b981',
    change: '+2 today',
    trend: 'up'
  },
  {
    title: 'Pending Tasks',
    value: 5,
    icon: <ClockCircleOutlined />,
    color: '#f59e0b',
    change: '2 high priority',
    trend: 'neutral'
  },
  {
    title: 'Patient Satisfaction',
    value: 98,
    suffix: '%',
    icon: <HeartOutlined />,
    color: '#8b5cf6',
    change: '+1.2% this week',
    trend: 'up'
  }
];

const todayAppointments = [
  {
    key: '1',
    time: '09:00 AM',
    patient: 'Nguyễn Thị Lan',
    service: 'Tư vấn sức khỏe sinh sản',
    status: 'confirmed',
    notes: 'Lần đầu khám'
  },
  {
    key: '2', 
    time: '10:30 AM',
    patient: 'Trần Văn Nam',
    service: 'Xét nghiệm STI',
    status: 'in-progress',
    notes: 'Tái khám'
  },
  {
    key: '3',
    time: '02:00 PM',
    patient: 'Lê Thị Mai',
    service: 'Tư vấn kế hoạch hóa gia đình',
    status: 'waiting',
    notes: 'Khách hàng VIP'
  },
  {
    key: '4',
    time: '03:30 PM',
    patient: 'Phạm Minh Tuấn',
    service: 'Kiểm tra sức khỏe tổng quát',
    status: 'confirmed',
    notes: 'Lịch hẹn mới'
  }
];

const dailyTasks = [
  {
    key: '1',
    task: 'Xem lại kết quả xét nghiệm của bệnh nhân Nguyễn Thị A',
    priority: 'high',
    time: '09:00',
    completed: false
  },
  {
    key: '2',
    task: 'Chuẩn bị báo cáo tuần cho quản lý',
    priority: 'medium',
    time: '11:00',
    completed: true
  },
  {
    key: '3',
    task: 'Gọi điện xác nhận lịch hẹn với bệnh nhân mới',
    priority: 'high',
    time: '14:00',
    completed: false
  },
  {
    key: '4',
    task: 'Cập nhật hồ sơ bệnh án điện tử',
    priority: 'low',
    time: '16:00',
    completed: true
  }
];

const StaffDashboard: React.FC = () => {
  const appointmentColumns: ColumnsType<any> = [
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      width: 100,
      render: (time) => (
        <Text strong style={{ color: '#3b82f6' }}>
          {time}
        </Text>
      )
    },
    {
      title: 'Patient',
      dataIndex: 'patient',
      key: 'patient',
      render: (name, record) => (
        <div>
          <Text strong style={{ fontSize: '14px' }}>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.notes}</Text>
        </div>
      )
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          confirmed: { color: 'green', text: 'Confirmed' },
          'in-progress': { color: 'blue', text: 'In Progress' },
          waiting: { color: 'orange', text: 'Waiting' },
          pending: { color: 'red', text: 'Pending' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config?.color}>{config?.text}</Tag>;
      }
    }
  ];

  return (
    <div style={{ padding: '0' }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
          Good morning, Dr. Sarah!
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          You have 12 appointments today and 4 pending tasks to complete.
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {staffStatsData.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                border: '1px solid #e5e7eb'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px',
                  background: `${stat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: stat.color
                }}>
                  {stat.icon}
                </div>
                <Button type="text" icon={<MoreOutlined />} size="small" />
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  {stat.title}
                </Text>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <Statistic 
                  value={stat.value}
                  suffix={stat.suffix}
                  valueStyle={{ 
                    fontSize: '28px', 
                    fontWeight: 'bold',
                    color: '#1f2937',
                    lineHeight: 1
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {stat.trend === 'up' && (
                  <RiseOutlined style={{ color: '#10b981', fontSize: '12px' }} />
                )}
                {stat.trend === 'down' && (
                  <FallOutlined style={{ color: '#ef4444', fontSize: '12px' }} />
                )}
                <Text style={{ 
                  color: stat.trend === 'up' ? '#10b981' : stat.trend === 'down' ? '#ef4444' : '#6b7280',
                  fontSize: '12px'
                }}>
                  {stat.change}
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Today's Appointments */}
        <Col xs={24} lg={16}>
          <Card 
            title="Today's Appointments"
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              border: '1px solid #e5e7eb'
            }}
            extra={
              <Space>
                <Button type="text" icon={<EyeOutlined />} size="small" />
                <Button type="text" icon={<MoreOutlined />} size="small" />
              </Space>
            }
          >
            <Table
              dataSource={todayAppointments}
              columns={appointmentColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={8}>
          <Row gutter={[0, 24]}>
            {/* Daily Progress */}
            <Col xs={24}>
              <Card 
                title="Daily Progress"
                style={{ 
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  border: '1px solid #e5e7eb'
                }}
                extra={<Button type="text" icon={<MoreOutlined />} size="small" />}
              >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <Progress
                      type="circle"
                      percent={67}
                      width={120}
                      strokeColor="#667eea"
                      strokeWidth={8}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                        8/12
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Completed
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <Text type="secondary">Tasks completed today</Text>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Daily Tasks */}
            <Col xs={24}>
              <Card 
                title="Daily Tasks"
                style={{ 
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  border: '1px solid #e5e7eb'
                }}
                extra={<Button type="text" icon={<MoreOutlined />} size="small" />}
              >
                <List
                  dataSource={dailyTasks}
                  renderItem={(task) => (
                    <List.Item style={{ padding: '12px 0', border: 'none' }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            borderRadius: '50%',
                            backgroundColor: task.completed ? '#10b981' : '#e5e7eb',
                            marginTop: '2px',
                            flexShrink: 0
                          }} />
                          <div style={{ flex: 1 }}>
                            <Text 
                              style={{ 
                                fontSize: '13px',
                                textDecoration: task.completed ? 'line-through' : 'none',
                                color: task.completed ? '#9ca3af' : '#374151'
                              }}
                            >
                              {task.task}
                            </Text>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <Text type="secondary" style={{ fontSize: '11px' }}>
                                {task.time}
                              </Text>
                              <Tag 
                                color={
                                  task.priority === 'high' ? 'red' :
                                  task.priority === 'medium' ? 'orange' : 'blue'
                                }
                              >
                                {task.priority}
                              </Tag>
                            </div>
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default StaffDashboard;
