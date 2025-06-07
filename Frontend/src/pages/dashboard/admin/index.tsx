import React, { useState } from 'react';
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
  Badge
} from 'antd';
import { 
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  EyeOutlined,
  PhoneOutlined,
  MailOutlined,
  MoreOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

// Mock data giống template
const statsData = [
  {
    title: 'Sales Today',
    value: 2562,
    icon: <UserOutlined />,
    color: '#3b82f6',
    change: '-2.65% Less sales than usual',
    trend: 'down'
  },
  {
    title: 'Total Earnings', 
    value: 24300,
    suffix: '$',
    icon: <DollarOutlined />,
    color: '#10b981',
    change: '8.35% More earnings than usual',
    trend: 'up'
  },
  {
    title: 'Visitors Today',
    value: 17212,
    icon: <CalendarOutlined />,
    color: '#f59e0b',
    change: '5.50% More visitors than usual',
    trend: 'up'
  },
  {
    title: 'Pending Orders',
    value: 43,
    icon: <TeamOutlined />,
    color: '#8b5cf6',
    change: '-4.25% Less orders than usual',
    trend: 'down'
  }
];

const recentActivities = [
  {
    key: '1',
    user: 'Nguyễn Văn A',
    action: 'Đặt lịch tư vấn sức khỏe sinh sản',
    time: '2 phút trước',
    status: 'success',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
  },
  {
    key: '2', 
    user: 'Trần Thị B',
    action: 'Thanh toán dịch vụ xét nghiệm STI',
    time: '5 phút trước',
    status: 'success',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b776?w=32&h=32&fit=crop&crop=face'
  },
  {
    key: '3',
    user: 'Dr. Lê Minh C',
    action: 'Hoàn thành tư vấn cho bệnh nhân',
    time: '10 phút trước', 
    status: 'completed',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=32&h=32&fit=crop&crop=face'
  },
  {
    key: '4',
    user: 'Phạm Thị D',
    action: 'Đăng ký tài khoản mới',
    time: '15 phút trước',
    status: 'new',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face'
  },
  {
    key: '5',
    user: 'Admin System',
    action: 'Cập nhật cấu hình hệ thống',
    time: '30 phút trước',
    status: 'warning',
    avatar: null
  }
];

const AdminDashboard: React.FC = () => {
  return (
    <div style={{ padding: '0' }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
          Welcome back, Linda!
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          You have 24 new messages and 5 new notifications.
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {statsData.map((stat, index) => (
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
                {stat.trend === 'up' ? (
                  <RiseOutlined style={{ color: '#10b981', fontSize: '12px' }} />
                ) : (
                  <FallOutlined style={{ color: '#ef4444', fontSize: '12px' }} />
                )}
                <Text style={{ 
                  color: stat.trend === 'up' ? '#10b981' : '#ef4444',
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
        {/* Recent Movement */}
        <Col xs={24} lg={14}>
          <Card 
            title="Recent Movement"
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
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item style={{ padding: '16px 0', border: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px' }}>
                    <Avatar 
                      src={item.avatar} 
                      size={40}
                      style={{ backgroundColor: '#667eea' }}
                    >
                      {!item.avatar && item.user.charAt(0)}
                    </Avatar>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Text strong style={{ fontSize: '14px' }}>
                          {item.user}
                        </Text>
                        <Badge 
                          status={
                            item.status === 'success' ? 'success' :
                            item.status === 'completed' ? 'processing' :
                            item.status === 'new' ? 'success' : 'warning'
                          }
                        />
                      </div>
                      <Text style={{ fontSize: '13px', color: '#6b7280' }}>
                        {item.action}
                      </Text>
                    </div>
                    
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {item.time}
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={10}>
          <Row gutter={[0, 24]}>
            {/* Current Visitors */}
            <Col xs={24}>
              <Card 
                title="Current Visitors"
                style={{ 
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  border: '1px solid #e5e7eb'
                }}
                extra={<Button type="text" icon={<MoreOutlined />} size="small" />}
              >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ 
                    width: '120px', 
                    height: '120px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}>
                    24K
                  </div>
                  <Text type="secondary">Active visitors right now</Text>
                </div>
              </Card>
            </Col>

            {/* Browser Usage */}
            <Col xs={24}>
              <Card 
                title="Browser Usage"
                style={{ 
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  border: '1px solid #e5e7eb'
                }}
                extra={<Button type="text" icon={<MoreOutlined />} size="small" />}
              >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: '120px',
                    height: '120px', 
                    borderRadius: '50%',
                    margin: '0 auto',
                    background: `conic-gradient(#3b82f6 0deg 144deg, #10b981 144deg 252deg, #f59e0b 252deg 324deg, #ef4444 324deg 360deg)`,
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'white'
                    }} />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
