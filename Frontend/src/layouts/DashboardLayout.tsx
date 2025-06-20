import {
    BarChartOutlined,
    BellOutlined,
    CalendarOutlined,
    CaretRightOutlined,
    ClockCircleOutlined,
    CustomerServiceOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    HeartOutlined,
    LogoutOutlined,
    MedicineBoxOutlined,
    MenuOutlined,
    SettingOutlined,
    TeamOutlined,
    UserOutlined,
    VideoCameraOutlined
} from '@ant-design/icons';
import { Avatar, Badge, Button, Dropdown, Layout, Menu, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'guest' | 'customer' | 'doctor' | 'staff' | 'manager' | 'admin';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userRole }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();

  // Menu items cho Admin
  const adminMenuItems = [
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
      onClick: () => navigate('/dashboard/admin'),
    },
    {
      key: 'doctors',
      icon: <MedicineBoxOutlined />,
      label: 'Quản lý bác sĩ',
      children: [
        {
          key: 'doctors-profiles',
          label: 'Quản lý hồ sơ bác sĩ',
          onClick: () => navigate('/dashboard/admin/doctors/profiles'),
        },
        {
          key: 'doctors-schedule',
          label: 'Quản lý lịch làm việc',
          onClick: () => navigate('/dashboard/admin/doctors/schedule'),
        },
        {
          key: 'doctors-performance',
          label: 'Đánh giá hiệu suất',
          onClick: () => navigate('/dashboard/admin/doctors/performance'),
        },
        {
          key: 'doctors-specialties',
          label: 'Chuyên khoa bác sĩ',
          onClick: () => navigate('/dashboard/admin/doctors/specialties'),
        },
      ],
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Báo cáo & Thống kê',
      onClick: () => navigate('/dashboard/admin/reports'),
    },
    {
      key: 'system',
      icon: <DatabaseOutlined />,
      label: 'Hệ thống',
      onClick: () => navigate('/dashboard/admin/system'),
    },
  ];

  // Menu items cho Manager
  const managerMenuItems = [
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
      onClick: () => navigate('/dashboard/manager'),
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: 'Quản lý người dùng',
      onClick: () => navigate('/dashboard/manager/users'),
    },
    {
      key: 'doctors',
      icon: <MedicineBoxOutlined />,
      label: 'Quản lý bác sĩ',
      children: [
        {
          key: 'doctors-profiles',
          label: 'Quản lý hồ sơ bác sĩ',
          onClick: () => navigate('/dashboard/manager/doctors/profiles'),
        },
        {
          key: 'doctors-schedule',
          label: 'Quản lý lịch làm việc',
          onClick: () => navigate('/dashboard/manager/doctors/schedule'),
        },
        {
          key: 'doctors-performance',
          label: 'Đánh giá hiệu suất',
          onClick: () => navigate('/dashboard/manager/doctors/performance'),
        },
        {
          key: 'doctors-specialties',
          label: 'Chuyên khoa bác sĩ',
          onClick: () => navigate('/dashboard/manager/doctors/specialties'),
        },
      ],
    },
    {
      key: 'services',
      icon: <CustomerServiceOutlined />,
      label: 'Quản lý dịch vụ',
      children: [
        {
          key: 'services-management',
          label: 'Quản lý các loại dịch vụ',
          onClick: () => navigate('/dashboard/manager/services'),
        },
        {
          key: 'service-packages-management', 
          label: 'Quản lý các gói dịch vụ',
          onClick: () => navigate('/dashboard/manager/service-packages'),
        },
      ],
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Báo cáo & Thống kê',
      onClick: () => navigate('/dashboard/manager/reports'),
    },
  ];

  // Menu items cho Staff
  const staffMenuItems = [
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
      onClick: () => navigate('/dashboard/staff'),
    },
    {
      key: 'schedule',
      icon: <CalendarOutlined />,
      label: 'Quản lý lịch bác sĩ',
      onClick: () => navigate('/dashboard/staff/schedule'),
    },
    {
      key: 'appointments',
      icon: <HeartOutlined />,
      label: 'Đặt lịch bệnh nhân',
      onClick: () => navigate('/dashboard/staff/appointments'),
    },
    {
      key: 'daily-tasks',
      icon: <ClockCircleOutlined />,
      label: 'Công việc hàng ngày',
      onClick: () => navigate('/dashboard/staff/tasks'),
    },
  ];

  // Menu items cho Doctor
  const doctorMenuItems = [
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
      onClick: () => navigate('/dashboard/doctor'),
    },
    {
      key: 'my-schedule',
      icon: <CalendarOutlined />,
      label: 'Lịch làm việc của tôi',
      onClick: () => navigate('/dashboard/doctor/my-schedule'),
    },
    {
      key: 'consultations',
      icon: <VideoCameraOutlined />,
      label: 'Tư vấn trực tuyến',
      onClick: () => navigate('/dashboard/doctor/consultations'),
    },
    {
      key: 'my-patients',
      icon: <HeartOutlined />,
      label: 'Bệnh nhân của tôi',
      onClick: () => navigate('/dashboard/doctor/patients'),
    },
    {
      key: 'prescriptions',
      icon: <MedicineBoxOutlined />,
      label: 'Đơn thuốc',
      onClick: () => navigate('/dashboard/doctor/prescriptions'),
    },
  ];

  const getMenuItems = () => {
    switch (userRole) {
      case 'admin':
        return adminMenuItems;
      case 'manager':
        return managerMenuItems;
      case 'staff':
        return staffMenuItems;
      case 'doctor':
        return doctorMenuItems;
      default:
        return staffMenuItems;
    }
  };

  const menuItems = getMenuItems();

  const onLogout = async () => {
    const result = await handleLogout();
    if (result.success) {
      navigate('/');
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: onLogout,
    },
  ];

  const getPageTitle = () => {
    switch (userRole) {
      case 'admin':
        return 'Admin Dashboard';
      case 'manager':
        return 'Manager Dashboard';
      case 'staff':
        return 'Staff Dashboard';
      case 'doctor':
        return 'Doctor Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const pageTitle = getPageTitle();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={250}
        style={{
          background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
        }}
      >
        {/* Logo */}
        <div style={{ 
          padding: '24px 24px 0',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '24px',
          paddingBottom: '24px'
        }}>
          <Title 
            level={4} 
            style={{ 
              color: 'white', 
              margin: 0,
              fontSize: collapsed ? '16px' : '18px',
              transition: 'all 0.3s'
            }}
          >
            {collapsed ? 'GH' : 'Gender Healthcare'}
          </Title>
        </div>

        {/* Menu Styles - Minimal CSS để giữ default expand/collapse behavior */}
        <style>
          {`
            /* Chỉ style màu sắc, không can thiệp vào layout behavior */
            .ant-menu-dark {
              background: transparent !important;
              border: none !important;
            }

            /* Menu item styling */
            .ant-menu-dark .ant-menu-item {
              margin: 4px 16px;
              border-radius: 8px;
              height: 48px;
              color: rgba(255,255,255,0.85);
              transition: all 0.3s ease;
              display: flex !important;
              align-items: center !important;
              padding: 12px 16px !important;
              font-size: 14px !important;
              line-height: 1.5 !important;
              overflow: visible !important;
            }
            
            .ant-menu-dark .ant-menu-item-selected {
              background-color: rgba(255,255,255,0.15) !important;
              color: white !important;
            }
            
            .ant-menu-dark .ant-menu-item:hover {
              background-color: rgba(255,255,255,0.1) !important;
              color: white !important;
            }

            /* Submenu title styling */
            .ant-menu-dark .ant-menu-submenu-title {
              margin: 4px 16px;
              border-radius: 8px;
              height: 48px;
              color: rgba(255,255,255,0.85);
              transition: all 0.3s ease;
              display: flex !important;
              align-items: center !important;
              line-height: 48px !important;
            }
            
            .ant-menu-dark .ant-menu-submenu-open > .ant-menu-submenu-title {
              background-color: rgba(255,255,255,0.1) !important;
              color: white !important;
            }
            
            .ant-menu-dark .ant-menu-submenu-title:hover {
              background-color: rgba(255,255,255,0.1) !important;
              color: white !important;
            }

            /* Submenu items styling */
            .ant-menu-dark .ant-menu-submenu .ant-menu-item {
              background-color: rgba(255,255,255,0.05) !important;
              margin: 2px 24px 2px 40px;
              border-radius: 6px;
              height: 44px;
              line-height: 44px !important;
              display: flex !important;
              align-items: center !important;
              padding: 8px 16px !important;
              font-size: 14px !important;
              overflow: visible !important;
            }
            
            .ant-menu-dark .ant-menu-submenu .ant-menu-item:hover {
              background-color: rgba(255,255,255,0.15) !important;
              color: white !important;
            }
            
            .ant-menu-dark .ant-menu-submenu .ant-menu-item-selected {
              background-color: rgba(255,255,255,0.2) !important;
              color: white !important;
            }

            /* Fix submenu icon alignment */
            .ant-menu-dark .ant-menu-submenu-title .ant-menu-submenu-arrow {
              color: rgba(255,255,255,0.85) !important;
            }

            /* Fix menu item content alignment */
            .ant-menu-dark .ant-menu-item-icon {
              font-size: 16px !important;
              width: 16px !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            
            .ant-menu-dark .ant-menu-title-content {
              margin-left: 12px !important;
              vertical-align: middle !important;
              display: inline-block !important;
              line-height: 1.5 !important;
              font-size: 14px !important;
              padding-bottom: 2px !important;
              overflow: visible !important;
              text-align: left !important;
              white-space: nowrap !important;
            }

            /* Fix Vietnamese character rendering */
            .ant-menu-dark .ant-menu-item-selected,
            .ant-menu-dark .ant-menu-submenu .ant-menu-item-selected,
            .ant-menu-dark .ant-menu-item:hover,
            .ant-menu-dark .ant-menu-submenu .ant-menu-item:hover {
              font-weight: 500 !important;
              text-rendering: optimizeLegibility !important;
              -webkit-font-smoothing: antialiased !important;
            }

            /* Ensure proper spacing for Vietnamese characters */
            .ant-menu-dark .ant-menu-submenu-title,
            .ant-menu-dark .ant-menu-item {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
              letter-spacing: 0.02em !important;
              text-rendering: optimizeLegibility !important;
            }

            /* Submenu items styling - KHÔNG can thiệp vào default layout */
            .ant-menu-dark .ant-menu-submenu .ant-menu {
              background: rgba(0,0,0,0.15);
              margin-left: 20px;
              margin-right: 16px;
              margin-top: 4px;
              margin-bottom: 8px;
              border-radius: 8px;
              border: 1px solid rgba(255,255,255,0.1);
            }
            
            .ant-menu-dark .ant-menu-submenu .ant-menu-item {
              margin: 2px 8px;
              border-radius: 6px;
              height: 36px;
              color: rgba(255,255,255,0.75);
              font-size: 13px;
            }
            
            .ant-menu-dark .ant-menu-submenu .ant-menu-item:hover {
              background-color: rgba(255,255,255,0.2) !important;
              color: white !important;
            }
            
            .ant-menu-dark .ant-menu-submenu .ant-menu-item-selected {
              background-color: #1890ff !important;
              color: white !important;
            }



            /* Icon styling */
            .ant-menu-item .anticon,
            .ant-menu-submenu-title .anticon {
              font-size: 16px;
              margin-right: 12px;
            }

            /* Collapsed mode behavior */
            .ant-layout-sider-collapsed .ant-menu-submenu .ant-menu {
              position: absolute !important;
              left: 100% !important;
              top: 0 !important;
              z-index: 1000 !important;
              background: linear-gradient(180deg, #667eea 0%, #764ba2 100%) !important;
              box-shadow: 2px 0 8px rgba(0,0,0,0.15) !important;
              min-width: 200px !important;
              margin: 0 !important;
              border-radius: 8px !important;
            }


          `}
        </style>
        <Menu
          mode="inline"
          defaultSelectedKeys={['overview']}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          inlineCollapsed={collapsed}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white'
          }}
          items={menuItems}
          theme="dark"
          inlineIndent={20}
          expandIcon={({ isOpen }) => (
            <CaretRightOutlined 
              style={{ 
                color: 'rgba(255,255,255,0.85)',
                transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                fontSize: '12px'
              }} 
            />
          )}
        />
      </Sider>

      {/* Main Layout */}
      <Layout>
        {/* Header */}
        <Header style={{ 
          padding: '0 24px', 
          background: 'white',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 40, height: 40 }}
            />
            <Title level={3} style={{ margin: '0 0 0 16px', color: '#1f2937' }}>
              {pageTitle}
            </Title>
          </div>

          <Space size="large">
            {/* Notifications */}
            <Badge count={5} size="small">
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                style={{ fontSize: '18px' }}
              />
            </Badge>

            {/* User Menu */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'background 0.3s'
              }}>
                <Avatar 
                  size={32} 
                  style={{ 
                    backgroundColor: '#667eea',
                    marginRight: '8px'
                  }}
                >
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong style={{ fontSize: '14px', lineHeight: 1.2 }}>
                    {user?.fullName || 'User'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px', lineHeight: 1.2 }}>
                    {userRole === 'admin' ? 'Quản trị viên' : 
                     userRole === 'manager' ? 'Quản lý' :
                     userRole === 'doctor' ? 'Bác sĩ' : 'Nhân viên'}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content style={{ 
          margin: '24px',
          padding: '24px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'auto'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout; 