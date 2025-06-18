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
  message
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  SettingOutlined,
  HistoryOutlined,
  BarChartOutlined,
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
import ActivityFeed from '../widgets/ActivityFeed';
import TableWidget from '../widgets/TableWidget';
import RolePermissionTable from '../widgets/RolePermissionTable';
import TopPerformersCard from '../widgets/TopPerformersCard';
import BrowserUsageChart from '../widgets/BrowserUsageChart';
import UserManagement from '../../../pages/dashboard/management/UserManagement';
import DoctorManagement from '../../../pages/dashboard/management/DoctorManagement';
import ServiceManagement from '../../../pages/dashboard/management/ServiceManagement';
import ServicePackageManagement from '../../../pages/dashboard/management/ServicePackageManagement';
import LoginHistoryManagement from '../../../pages/dashboard/management/LoginHistoryManagement';
import { 
  type DashboardStat,
  type ActivityItem,
  type AppointmentItem
} from '../../../types/dashboard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { fetchManagementDashboard } from '../../../services/dashboard';

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
          setActivities(data.recentActivities);
        }
        
        if (data?.todayAppointments) {
          console.log('📅 Today appointments:', data.todayAppointments);
          setTodayList(data.todayAppointments);
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
              icon={getIconComponent(stat.icon)}
              color={stat.color}
              change={stat.change || ''}
              trend={stat.trend || 'up'}
              onClick={() => console.log('Navigate to:', stat.title)}
            />
          </Col>
        ))}
      </Row>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Recent Activities */}
        <Col xs={24} lg={14}>
          <ActivityFeed 
            activities={activities}
            title="Hoạt động gần đây"
          />
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={10}>
          <Row gutter={[0, 24]}>
            {/* Today's Appointments */}
            <Col xs={24}>
              <TableWidget 
                data={todayList.slice(0, 5)}
                title="Lịch hẹn hôm nay"
                pagination={false}
              />
            </Col>

            {/* Quick Actions Card */}
            <Col xs={24}>
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #f0f0f0'
              }}>
                <Title level={4} style={{ marginBottom: '16px' }}>
                  ⚡ Thao tác nhanh
                </Title>
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Button 
                      type="primary" 
                      icon={<UserOutlined />} 
                      size="small"
                      block
                      onClick={() => setSelectedKey('doctors')}
                    >
                      Quản lý bác sĩ
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button 
                      type="default" 
                      icon={<MedicineBoxOutlined />} 
                      size="small"
                      block
                      onClick={() => setSelectedKey('services')}
                    >
                      Dịch vụ
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
              </div>
            </Col>

            {/* Browser Usage Chart */}
            <Col xs={24}>
              <BrowserUsageChart 
                title="Phân tích truy cập"
                showDetails={false}
              />
            </Col>
          </Row>
        </Col>
      </Row>

      {/* System Overview Section */}
      <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
        <Col xs={24} md={12}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #f0f0f0',
            height: '200px'
          }}>
            <Title level={4} style={{ marginBottom: '16px' }}>
              📊 Tổng quan hệ thống
            </Title>
            <Row gutter={[16, 16]}>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}>
                  {stats[0]?.value || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Bác sĩ</div>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}>
                  {stats[1]?.value || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Dịch vụ</div>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ color: '#fa8c16', fontSize: '24px', fontWeight: 'bold' }}>
                  {stats[2]?.value || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Lịch hẹn</div>
              </Col>
            </Row>
            <div style={{ 
              marginTop: '20px', 
              textAlign: 'center',
              padding: '12px',
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '6px'
            }}>
              <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                💰 Doanh thu tháng: {(stats[3]?.value || 0).toLocaleString('vi-VN')} VNĐ
              </Text>
            </div>
          </div>
        </Col>

        <Col xs={24} md={12}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #f0f0f0',
            height: '200px'
          }}>
            <Title level={4} style={{ marginBottom: '16px' }}>
              🎯 Hiệu suất hôm nay
            </Title>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                {Math.round((todayList.length / Math.max(Number(stats[2]?.value) || 1, 1)) * 100)}%
              </div>
              <Text style={{ fontSize: '14px', color: '#666' }}>
                Tiến độ lịch hẹn hôm nay
              </Text>
              <div style={{ marginTop: '12px' }}>
                <Text style={{ fontSize: '12px', color: '#999' }}>
                  {todayList.length} / {Number(stats[2]?.value) || 0} lịch hẹn đã được xử lý
                </Text>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Enhanced Admin Sections */}
      {userRole === 'admin' && (
        <>
          {/* Role Permission Table */}
          <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
            <Col xs={24}>
              <RolePermissionTable />
            </Col>
          </Row>

          {/* Top Performers and Browser Usage */}
          <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
            <Col xs={24} lg={16}>
              <TopPerformersCard 
                title="Nhân viên xuất sắc tháng này"
                maxItems={3}
                showAll={() => console.log('Navigate to performance page')}
              />
            </Col>
            
            <Col xs={24} lg={8}>
              <BrowserUsageChart 
                title="Chi tiết truy cập"
                showDetails={true}
              />
            </Col>
          </Row>

          {/* Admin Badge */}
          <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
            <Col xs={24}>
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                color: 'white',
                textAlign: 'center'
              }}>
                <Title level={4} style={{ color: 'white', margin: '0 0 8px 0' }}>
                  🔧 Quyền Admin - Toàn quyền hệ thống
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Bạn có thể truy cập tất cả chức năng quản lý, phân quyền người dùng, cấu hình hệ thống và xem báo cáo chi tiết.
                </Text>
              </div>
            </Col>
          </Row>
        </>
      )}

      {/* Manager Enhanced Section */}
      {userRole === 'manager' && (
        <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
          <Col xs={24} lg={16}>
            <TopPerformersCard 
              title="Đội ngũ xuất sắc"
              maxItems={4}
              showAll={() => console.log('Navigate to team performance')}
            />
          </Col>
          
          <Col xs={24} lg={8}>
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '12px',
              color: 'white',
              textAlign: 'center'
            }}>
              <Title level={4} style={{ color: 'white', margin: '0 0 8px 0' }}>
                📊 Quản lý vận hành
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                Quản lý hiệu quả các hoạt động hàng ngày và theo dõi performance team.
              </Text>
            </div>
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