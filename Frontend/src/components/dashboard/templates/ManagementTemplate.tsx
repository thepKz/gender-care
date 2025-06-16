import React, { useState } from 'react';
import { Layout, Menu, Row, Col, Typography } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  SettingOutlined,
  HistoryOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import StatsCard from '../widgets/StatsCard';
import ActivityFeed from '../widgets/ActivityFeed';
import TableWidget from '../widgets/TableWidget';
import UserManagement from '../../../pages/dashboard/management/UserManagement';
import DoctorManagement from '../../../pages/dashboard/management/DoctorManagement';
import ServiceManagement from '../../../pages/dashboard/management/ServiceManagement';
import LoginHistoryManagement from '../../../pages/dashboard/management/LoginHistoryManagement';
import { 
  managementStats, 
  recentActivities, 
  todayAppointments 
} from '../../../data/mockdata/dashboardStats';

const { Title, Text } = Typography;
const { Sider, Content } = Layout;

interface ManagementTemplateProps {
  userRole: 'admin' | 'manager';
  userName?: string;
  welcomeMessage?: string;
}

const menuItems = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: 'Tổng quan',
  },
  {
    key: 'users',
    icon: <UserOutlined />,
    label: 'Quản lý người dùng',
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
    key: 'login-history',
    icon: <HistoryOutlined />,
    label: 'Lịch sử đăng nhập',
  },
  {
    key: 'reports',
    icon: <BarChartOutlined />,
    label: 'Báo cáo',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Cài đặt',
  },
];

const ManagementTemplate: React.FC<ManagementTemplateProps> = ({
  userRole,
  userName = 'Admin',
  welcomeMessage
}) => {
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  // Customize stats based on role
  const roleStats = userRole === 'admin' 
    ? managementStats 
    : managementStats.slice(0, 3); // Manager có ít stats hơn

  const defaultWelcomeMessage = userRole === 'admin'
    ? `Chào mừng trở lại, ${userName}! Bạn có toàn quyền quản lý hệ thống.`
    : `Chào mừng trở lại, ${userName}! Hôm nay có ${todayAppointments.length} lịch hẹn cần theo dõi.`;

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
        {roleStats.map((stat, index) => (
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
            activities={recentActivities}
            title="Hoạt động gần đây"
          />
        </Col>

        {/* Today's Appointments */}
        <Col xs={24} lg={10}>
          <TableWidget 
            data={todayAppointments.slice(0, 5)}
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
        return <UserManagement />;
      case 'doctors':
        return <DoctorManagement />;
      case 'services':
        return <ServiceManagement />;
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
        return (
          <div style={{ padding: '24px' }}>
            <Title level={2}>Cài đặt hệ thống</Title>
            <p>Trang cài đặt đang được phát triển...</p>
          </div>
        );
      default:
        return renderDashboard();
    }
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
          onClick={({ key }) => setSelectedKey(key)}
          style={{ border: 'none' }}
        />
      </Sider>
      
      <Layout>
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