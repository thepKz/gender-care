import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Typography,
  Button,
  Row,
  Col,
  Avatar,
  Dropdown,
  Space,
  message,
  Card,
  List,
  Statistic
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  SettingOutlined,
  HistoryOutlined,
  BarChartOutlined,
  SecurityScanOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  BellOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  DollarOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import EnhancedStatsCard from '../widgets/EnhancedStatsCard';
import TableWidget from '../widgets/TableWidget';
import UserManagement from '../../../pages/dashboard/management/UserManagement';
import DoctorManagement from '../../../pages/dashboard/management/DoctorManagement';
import ServiceManagement from '../../../pages/dashboard/management/ServiceManagement';
import ServicePackageManagement from '../../../pages/dashboard/management/ServicePackageManagement';
import SystemLogManagement from '../../../pages/dashboard/management/SystemLogManagement';
import LoginHistoryManagement from '../../../pages/dashboard/management/LoginHistoryManagement';
import { 
  type DashboardStat,
  type ActivityItem,
  type AppointmentItem
} from '../../../types/dashboard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { fetchManagementDashboard } from '../../../api/endpoints/dashboard';

const { Title, Text } = Typography;
const { Header, Sider, Content } = Layout;

interface ManagementTemplateProps {
  userRole: 'admin' | 'manager';
  userName?: string;
  welcomeMessage?: string;
}

// Xây dựng menu động theo vai trò
const getMenuItems = (role: 'admin' | 'manager') => {
  const baseItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: 'doctors',
      icon: <MedicineBoxOutlined />,
      label: 'Quản lý bác sĩ',
    },
    {
      key: 'services',
      icon: <SettingOutlined />,
      label: 'Quản lý dịch vụ',
    },
    {
      key: 'service-packages',
      icon: <AppstoreOutlined />,
      label: 'Quản lý gói dịch vụ',
    },
    {
      key: 'login-history',
      icon: <HistoryOutlined />,
      label: 'Lịch sử đăng nhập',
    },
    {
      key: 'system-logs',
      icon: <SecurityScanOutlined />,
      label: 'System Logs',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Báo cáo',
    },
  ];

  // Admin có toàn quyền, Manager bị ẩn một số mục
  if (role === 'admin') {
    return [
      baseItems[0],
      {
        key: 'users',
        icon: <UserOutlined />,
        label: 'Quản lý người dùng',
      },
      ...baseItems.slice(1),
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Cài đặt',
      },
    ];
  }

  // Manager chỉ thấy baseItems, không có Users, Settings
  return baseItems;
};

const ManagementTemplate: React.FC<ManagementTemplateProps> = ({
  userRole,
  userName = 'Admin',
  welcomeMessage
}) => {
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { handleLogout } = useAuth();

  // Customize stats based on role
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [todayList, setTodayList] = useState<AppointmentItem[]>([]);

  // Scroll to top when component mounts or page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedKey]);

  useEffect(() => {
    (async () => {
      try {
        console.log('🔄 Fetching dashboard data...');
        const data = await fetchManagementDashboard();
        console.log('📊 Dashboard data received:', data);
        
        if (data?.stats) {
          console.log('📈 Stats data:', data.stats);
          // map stats -> managementStats format
          const mapped = [
            {
              title: 'Tổng bác sĩ',
              value: data.stats.totalDoctors,
              icon: 'UserOutlined',
              color: '#3b82f6',
              change: '',
              trend: 'up'
            },
            {
              title: 'Tổng dịch vụ',
              value: data.stats.totalServices,
              icon: 'StarOutlined',
              color: '#10b981',
              change: '',
              trend: 'up'
            },
            {
              title: 'Lịch hẹn hôm nay',
              value: data.stats.todayAppointments,
              icon: 'CalendarOutlined',
              color: '#f59e0b',
              change: '',
              trend: 'up'
            },
            {
              title: 'Doanh thu tháng',
              value: data.stats.monthlyRevenue,
              icon: 'DollarOutlined',
              color: '#ef4444',
              change: '',
              trend: 'up'
            }
          ];
          console.log('📋 Mapped stats:', mapped);
          setStats(mapped as any);
        } else {
          console.warn('⚠️ No stats data in response');
        }
        
        if (data?.recentActivities) {
          console.log('📝 Activities:', data.recentActivities);
          // Transform API data to match local ActivityItem interface
          const transformedActivities = data.recentActivities.map((activity: any) => ({
            id: activity.id,
            user: activity.title || activity.user,
            action: activity.description || activity.action,
            time: typeof activity.time === 'string' ? activity.time : new Date(activity.time).toISOString(),
            status: activity.status || 'info',
            avatar: activity.avatar,
            type: activity.type || 'system'
          }));
          setActivities(transformedActivities);
        }
        
        if (data?.todayAppointments) {
          console.log('📅 Today appointments:', data.todayAppointments);
          // Transform API data to match local AppointmentItem interface  
          const transformedAppointments = data.todayAppointments.map((appointment: any) => ({
            id: appointment.id,
            patientName: appointment.patientName,
            doctorName: appointment.doctorName,
            time: appointment.time,
            status: appointment.status,
            service: appointment.service || 'Dịch vụ chưa xác định',
            notes: appointment.notes,
            priority: appointment.priority || 'medium',
            phone: appointment.phone
          }));
          setTodayList(transformedAppointments);
        }
      } catch (err) {
        console.error('❌ fetchManagementDashboard error', err);
      }
    })();
  }, []);

  const defaultWelcomeMessage = userRole === 'admin'
    ? `Chào mừng trở lại, ${userName}! Bạn có toàn quyền quản lý hệ thống.`
    : `Chào mừng trở lại, ${userName}! Hôm nay có ${todayList.length} lịch hẹn cần theo dõi.`;

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'UserOutlined': <UserOutlined />,
      'DollarOutlined': <DollarOutlined />,
      'CalendarOutlined': <CalendarOutlined />,
      'TrophyOutlined': <TrophyOutlined />,
      'CheckCircleOutlined': <CheckCircleOutlined />,
      'FileTextOutlined': <FileTextOutlined />,
      'MedicineBoxOutlined': <MedicineBoxOutlined />
    };
    return icons[iconName] || <UserOutlined />;
  };

  const renderDashboard = () => (
    <div style={{ padding: '0' }}>
      {/* Enhanced Welcome Section */}
      <div style={{ 
        marginBottom: '32px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)'
      }}>
        <Row align="middle" justify="space-between">
          <Col flex="auto">
            <Title level={2} style={{ margin: 0, color: 'white' }}>
              {userRole === 'admin' ? '🔧 Bảng điều khiển Admin' : '📊 Bảng điều khiển Manager'}
            </Title>
            <Text style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)' }}>
              {welcomeMessage || defaultWelcomeMessage}
            </Text>
            <div style={{ marginTop: '8px' }}>
              <Text style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                📅 {new Date().toLocaleDateString('vi-VN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </div>
          </Col>
          <Col>
            <div style={{ 
              textAlign: 'center', 
              padding: '16px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <Title level={4} style={{ margin: 0, color: 'white' }}>
                {todayList.length}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                Lịch hẹn hôm nay
              </Text>
            </div>
          </Col>
        </Row>
      </div>

      {/* Enhanced Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <EnhancedStatsCard
              title={stat.title}
              value={stat.value}
              suffix={stat.suffix}
              icon={getIconComponent(typeof stat.icon === 'string' ? stat.icon : 'UserOutlined')}
              color={stat.color}
              change={stat.change || ''}
              trend={stat.trend || 'up'}
              onClick={() => console.log('Navigate to:', stat.title)}
            />
          </Col>
        ))}
      </Row>

      {/* Main Content - Simplified Layout */}
      <Row gutter={[24, 24]}>
        {/* Left Column - Today's Schedule & Quick Actions */}
        <Col xs={24} lg={16}>
          <Row gutter={[0, 24]}>
            {/* Today's Appointments */}
            <Col xs={24}>
              <TableWidget 
                data={todayList.slice(0, 8)}
                title="📅 Lịch hẹn hôm nay"
                pagination={false}
              />
            </Col>

            {/* Recent Activities - Compact Version */}
            {activities.length > 0 && (
              <Col xs={24}>
                <Card
                  title="🔄 Hoạt động gần đây"
                  size="small"
                  style={{ 
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                  }}
                >
                  <List
                    dataSource={activities.slice(0, 3)}
                    renderItem={(item: any) => (
                      <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <List.Item.Meta
                          avatar={<Avatar size="small" icon={<UserOutlined />} />}
                          title={<Text style={{ fontSize: '14px' }}>{item.title}</Text>}
                          description={
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {item.description}
                            </Text>
                          }
                        />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {item.time ? new Date(item.time).toLocaleTimeString('vi-VN') : ''}
                        </Text>
                      </List.Item>
                    )}
                  />
                  {activities.length > 3 && (
                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                      <Button type="link" size="small">
                        Xem thêm {activities.length - 3} hoạt động
                      </Button>
                    </div>
                  )}
                </Card>
              </Col>
            )}
          </Row>
        </Col>

        {/* Right Column - Quick Actions & System Info */}
        <Col xs={24} lg={8}>
          <Row gutter={[0, 24]}>
            {/* Quick Actions Card */}
            <Col xs={24}>
              <Card
                title="⚡ Thao tác nhanh"
                size="small"
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <Row gutter={[8, 8]}>
                  <Col span={24}>
                    <Button 
                      type="primary" 
                      icon={<UserOutlined />} 
                      size="middle"
                      block
                      onClick={() => setSelectedKey('doctors')}
                    >
                      Quản lý bác sĩ
                    </Button>
                  </Col>
                  <Col span={24}>
                    <Button 
                      icon={<MedicineBoxOutlined />} 
                      size="middle"
                      block
                      onClick={() => setSelectedKey('services')}
                    >
                      Quản lý dịch vụ
                    </Button>
                  </Col>
                  {userRole === 'admin' && (
                    <>
                      <Col span={12}>
                        <Button 
                          icon={<SettingOutlined />} 
                          size="small"
                          block
                          onClick={() => setSelectedKey('users')}
                        >
                          Người dùng
                        </Button>
                      </Col>
                      <Col span={12}>
                        <Button 
                          icon={<BarChartOutlined />} 
                          size="small"
                          block
                          onClick={() => setSelectedKey('reports')}
                        >
                          Báo cáo
                        </Button>
                      </Col>
                    </>
                  )}
                </Row>
              </Card>
            </Col>

            {/* System Status - Compact */}
            <Col xs={24}>
              <Card
                title="📊 Tình trạng hệ thống"
                size="small"
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <Row gutter={[8, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Bác sĩ hoạt động"
                      value={stats.find(s => s.title === 'Tổng bác sĩ')?.value || 0}
                      prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                      valueStyle={{ fontSize: '18px', color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Dịch vụ"
                      value={stats.find(s => s.title === 'Tổng dịch vụ')?.value || 0}
                      prefix={<MedicineBoxOutlined style={{ color: '#1890ff' }} />}
                      valueStyle={{ fontSize: '18px', color: '#1890ff' }}
                    />
                  </Col>
                  <Col span={24}>
                    <div style={{ 
                      padding: '12px', 
                      background: '#f6ffed', 
                      borderRadius: '8px',
                      border: '1px solid #b7eb8f',
                      textAlign: 'center'
                    }}>
                      <Text style={{ color: '#52c41a', fontWeight: 500 }}>
                        ✅ Hệ thống hoạt động bình thường
                      </Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>



      {/* Optional: Admin-only advanced features */}
      {userRole === 'admin' && (
        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24}>
            <Card
              title="🔧 Quản trị nâng cao"
              size="small"
              style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Button 
                    icon={<SettingOutlined />} 
                    block
                    onClick={() => setSelectedKey('users')}
                  >
                    Quản lý người dùng
                  </Button>
                </Col>
                <Col span={6}>
                  <Button 
                    icon={<BarChartOutlined />} 
                    block
                    onClick={() => setSelectedKey('reports')}
                  >
                    Báo cáo & Thống kê
                  </Button>
                </Col>
                <Col span={6}>
                  <Button 
                    icon={<SettingOutlined />} 
                    block
                    onClick={() => setSelectedKey('settings')}
                  >
                    Cấu hình hệ thống
                  </Button>
                </Col>
                <Col span={6}>
                  <Button 
                    icon={<FileTextOutlined />} 
                    block
                    onClick={() => setSelectedKey('logs')}
                  >
                    Nhật ký hệ thống
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        if (userRole === 'admin') return <UserManagement />;
        return <div style={{ padding: '24px' }}><Title level={3}>403 - Bạn không có quyền truy cập chức năng này</Title></div>;
      case 'doctors':
        return <DoctorManagement />;
      case 'services':
        return <ServiceManagement />;
      case 'service-packages':
        return <ServicePackageManagement />;
      case 'login-history':
        return <LoginHistoryManagement />;
      case 'system-logs':
        if (userRole === 'admin' || userRole === 'manager') return <SystemLogManagement />;
        return <div style={{ padding: '24px' }}><Title level={3}>403 - Bạn không có quyền truy cập chức năng này</Title></div>;
      case 'reports':
        return (
          <div style={{ padding: '24px' }}>
            <Title level={2}>Báo cáo</Title>
            <p>Trang báo cáo đang được phát triển...</p>
          </div>
        );
      case 'settings':
        if (userRole === 'admin') {
          return (
            <div style={{ padding: '24px' }}>
              <Title level={2}>Cài đặt hệ thống</Title>
              <p>Trang cài đặt đang được phát triển...</p>
            </div>
          );
        }
        return <div style={{ padding: '24px' }}><Title level={3}>403 - Bạn không có quyền truy cập chức năng này</Title></div>;
      default:
        return renderDashboard();
    }
  };

  const menuItems = getMenuItems(userRole);

  const onLogout = async () => {
    const result = await handleLogout();
    if (result.success) navigate('/');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={250}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ 
          padding: '16px', 
          textAlign: 'center',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '8px'
        }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            {collapsed ? 'GHC' : 'Gender Healthcare'}
          </Title>
          {!collapsed && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {userRole === 'admin' ? 'Quản trị viên' : 'Quản lý'}
            </Text>
          )}
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => {
            // Nếu manager chọn mục không có quyền (phòng trường hợp hard reload)
            const allowedKeys = menuItems.map(item => item.key);
            if (allowedKeys.includes(key)) {
              setSelectedKey(key);
            } else {
              setSelectedKey('dashboard');
            }
          }}
          style={{ border: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <Button type="link" icon={<DashboardOutlined />} onClick={() => navigate('/')}>Trang chủ</Button>
          <Button type="link" icon={<LogoutOutlined />} onClick={onLogout}>Đăng xuất</Button>
        </Header>
        <Content style={{ 
          padding: '24px',
          background: '#f5f5f5',
          overflow: 'auto'
        }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default ManagementTemplate;