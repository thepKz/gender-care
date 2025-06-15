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
  AppstoreOutlined
} from '@ant-design/icons';
import StatsCard from '../widgets/StatsCard';
import ActivityFeed from '../widgets/ActivityFeed';
import TableWidget from '../widgets/TableWidget';
import UserManagement from '../../../pages/dashboard/management/UserManagement';
import DoctorManagement from '../../../pages/dashboard/management/DoctorManagement';
import ServiceManagement from '../../../pages/dashboard/management/ServiceManagement';
import ServicePackageManagement from '../../../pages/dashboard/management/ServicePackageManagement';
import LoginHistoryManagement from '../../../pages/dashboard/management/LoginHistoryManagement';
import { 
  defaultManagementStats, 
  defaultActivities, 
  defaultAppointments,
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
  const [stats, setStats] = useState(defaultManagementStats);
  const [activities, setActivities] = useState(defaultActivities);
  const [todayList, setTodayList] = useState(defaultAppointments);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchManagementDashboard();
        if (data?.stats) {
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
              icon: 'StarOutlined',
              color: '#ef4444',
              change: '',
              trend: 'up'
            }
          ];
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          setStats(mapped as any);
        }
        if (data.recentActivities) setActivities(data.recentActivities);
        if (data.todayAppointments) setTodayList(data.todayAppointments);
      } catch (err) {
        console.error('fetchManagementDashboard error', err);
      }
    })();
  }, []);

  const defaultWelcomeMessage = userRole === 'admin'
    ? `Chào mừng trở lại, ${userName}! Bạn có toàn quyền quản lý hệ thống.`
    : `Chào mừng trở lại, ${userName}! Hôm nay có ${todayList.length} lịch hẹn cần theo dõi.`;

  const renderDashboard = () => (
    <div style={{ padding: '0' }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
          {userRole === 'admin' ? 'Bảng điều khiển Admin' : 'Bảng điều khiển Manager'}
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          {welcomeMessage || defaultWelcomeMessage}
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <StatsCard stat={stat} />
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

        {/* Today's Appointments */}
        <Col xs={24} lg={10}>
          <TableWidget 
            data={todayList.slice(0, 5)}
            title="Lịch hẹn hôm nay"
            pagination={false}
          />
        </Col>
      </Row>

      {/* Additional Admin-only Section */}
      {userRole === 'admin' && (
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
                🔧 Quyền Admin
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                Bạn có thể truy cập tất cả chức năng quản lý hệ thống, cài đặt bảo mật và phân quyền người dùng.
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