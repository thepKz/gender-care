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
  Card,
  Progress,
  message
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import StatsCard from '../widgets/StatsCard';
import ActivityFeed from '../widgets/ActivityFeed';
import TableWidget from '../widgets/TableWidget';
import AppointmentManagement from '../../../pages/dashboard/operational/AppointmentManagement';
import MedicalRecordsManagement from '../../../pages/dashboard/operational/MedicalRecordsManagement';

import {
  defaultPerformanceMetrics,
  type ActivityItem,
  type AppointmentItem,
  type DashboardStat
} from '../../../types/dashboard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { fetchOperationalDashboard } from '../../../api/endpoints/dashboard';

const { Title, Text } = Typography;
const { Header, Sider, Content } = Layout;

interface OperationalTemplateProps {
  userRole: 'staff' | 'doctor';
  userName?: string;
  welcomeMessage?: string;
}

// Xây dựng menu động theo vai trò Staff / Doctor
const getMenuItemsOperational = (role: 'staff' | 'doctor') => {
  // Mục chung
  const base = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: 'appointments',
      icon: <CalendarOutlined />,
      label: 'Quản lý lịch hẹn',
    },
    {
      key: 'schedule',
      icon: <ScheduleOutlined />,
      label: 'Lịch làm việc',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Báo cáo',
    },
  ];

  if (role === 'doctor') {
    // Bác sĩ: thêm bệnh nhân, hồ sơ; không cần lịch hẹn chi tiết
    return [
      base[0],
      {
        key: 'patients',
        icon: <UserOutlined />,
        label: 'Bệnh nhân',
      },
      {
        key: 'medical-records',
        icon: <FileTextOutlined />,
        label: 'Hồ sơ y tế',
      },
      ...base.slice(1),
    ];
  }

  // Staff: không thấy bệnh nhân & hồ sơ
  return base;
};

const OperationalTemplate: React.FC<OperationalTemplateProps> = ({
  userRole,
  userName = 'User',
  welcomeMessage
}) => {
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { handleLogout } = useAuth();

  const [statsCards, setStatsCards] = useState<DashboardStat[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultWelcomeMessage = userRole === 'doctor'
    ? `Chào mừng Dr. ${userName}! Hôm nay bạn có ${appointments.length} lịch hẹn và 4 công việc cần hoàn thành.`
    : `Chào mừng ${userName}! Hôm nay có ${appointments.length} lịch hẹn cần xử lý và 5 nhiệm vụ đang chờ.`;

  const metrics = defaultPerformanceMetrics;

  const menuItems = getMenuItemsOperational(userRole);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching operational dashboard data...');
        
        const data = await fetchOperationalDashboard();
        console.log('📊 Operational dashboard data received:', data);
        
        if (data?.stats) {
          console.log('📈 Operational stats data:', data.stats);
          
          // ✅ Map từ API data thành DashboardStat format
          const mapped: DashboardStat[] = [
            {
              title: 'Lịch hẹn hôm nay',
              value: data.stats.todayAppointments || 0,
              icon: 'CalendarOutlined',
              color: '#3b82f6',
              change: '15% tăng so với hôm qua',
              trend: 'up'
            },
            {
              title: 'Bệnh nhân chờ',
              value: data.stats.pendingAppointments || 0,
              icon: 'UserOutlined',
              color: '#f59e0b',
              change: '2 bệnh nhân giảm',
              trend: 'down'
            },
            {
              title: 'Đã hoàn thành',
              value: data.stats.completedToday || 0,
              icon: 'CheckCircleOutlined',
              color: '#10b981',
              change: `${data.stats.efficiency || 0}% tỷ lệ hoàn thành`,
              trend: 'up'
            },
            {
              title: 'Hiệu suất',
              value: data.stats.efficiency || 0,
              suffix: '%',
              icon: 'TrophyOutlined',
              color: '#8b5cf6',
              change: '1% tăng',
              trend: 'up'
            }
          ];
          
          console.log('📋 Mapped operational stats:', mapped);
          setStatsCards(mapped);
        }
        
        // ✅ Load appointments list từ API
        if (data?.appointments) {
          console.log('📅 Operational appointments:', data.appointments);
          setAppointments(data.appointments);
        }
        
        // ✅ Load recent activities nếu có
        if (data?.recentActivities) {
          console.log('📝 Operational activities:', data.recentActivities);
          setActivities(data.recentActivities);
        }
        
      } catch (err) {
        console.error('❌ fetchOperationalDashboard error:', err);
        // ✅ Fallback với stats rỗng thay vì mockdata
        setStatsCards([
          {
            title: 'Lịch hẹn hôm nay',
            value: 0,
            icon: 'CalendarOutlined',
            color: '#3b82f6',
            change: 'Không có dữ liệu',
            trend: 'up'
          },
          {
            title: 'Bệnh nhân chờ',
            value: 0,
            icon: 'UserOutlined',
            color: '#f59e0b',
            change: 'Không có dữ liệu',
            trend: 'down'
          },
          {
            title: 'Đã hoàn thành',
            value: 0,
            icon: 'CheckCircleOutlined',
            color: '#10b981',
            change: 'Không có dữ liệu',
            trend: 'up'
          },
          {
            title: 'Hiệu suất',
            value: 0,
            suffix: '%',
            icon: 'TrophyOutlined',
            color: '#8b5cf6',
            change: 'Không có dữ liệu',
            trend: 'up'
          }
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onLogout = async () => {
    const result = await handleLogout();
    if (result.success) navigate('/');
  };

  // ✅ Helper để render icon components từ string
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'UserOutlined': <UserOutlined />,
      'CalendarOutlined': <CalendarOutlined />,
      'CheckCircleOutlined': <CheckCircleOutlined />,
      'TrophyOutlined': <TrophyOutlined />,
      'ClockCircleOutlined': <ClockCircleOutlined />,
      'MedicineBoxOutlined': <MedicineBoxOutlined />
    };
    return icons[iconName] || <CalendarOutlined />;
  };

  const renderDashboard = () => (
    <div style={{ padding: '0' }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
          {userRole === 'doctor' ? 'Bảng điều khiển Bác sĩ' : 'Bảng điều khiển Nhân viên'}
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          {welcomeMessage || defaultWelcomeMessage}
        </Text>
      </div>

      {/* ✅ Stats Cards với loading state */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {loading ? (
          // Loading skeleton cho stats cards
          Array.from({ length: 4 }).map((_, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card loading style={{ borderRadius: '12px' }} />
            </Col>
          ))
        ) : (
          statsCards.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <StatsCard stat={{
                ...stat,
                icon: getIconComponent(stat.icon)
              }} />
            </Col>
          ))
        )}
      </Row>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Today's Appointments */}
        <Col xs={24} lg={16}>
          <TableWidget 
            data={appointments}
            title={userRole === 'doctor' ? 'Lịch khám hôm nay' : 'Lịch hẹn cần xử lý'}
            pagination={false}
            loading={loading}
          />
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={8}>
          <Row gutter={[0, 24]}>
            {/* Daily Progress */}
            <Col xs={24}>
              <Card 
                title={userRole === 'doctor' ? 'Tiến độ khám bệnh' : 'Tiến độ công việc'}
                style={{ 
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  border: '1px solid #e5e7eb'
                }}
                loading={loading}
              >
                {!loading && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <Progress
                        type="circle"
                        percent={metrics.appointmentCompletion}
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
                          {Math.round(appointments.length * metrics.appointmentCompletion / 100)}/{appointments.length}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Hoàn thành
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <Text type="secondary">
                        {userRole === 'doctor' ? 'Bệnh nhân đã khám' : 'Công việc đã xong'}
                      </Text>
                    </div>
                  </div>
                )}
              </Card>
            </Col>

            {/* Performance Metrics */}
            <Col xs={24}>
              <Card 
                title="Hiệu suất làm việc"
                style={{ 
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  border: '1px solid #e5e7eb'
                }}
                loading={loading}
              >
                {!loading && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Text style={{ fontSize: '13px' }}>
                          {userRole === 'doctor' ? 'Mức độ hài lòng' : 'Hiệu quả xử lý'}
                        </Text>
                        <Text strong style={{ fontSize: '13px' }}>
                          {metrics.patientSatisfaction}%
                        </Text>
                      </div>
                      <Progress percent={metrics.patientSatisfaction} size="small" strokeColor="#52c41a" />
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Text style={{ fontSize: '13px' }}>Quản lý thời gian</Text>
                        <Text strong style={{ fontSize: '13px' }}>
                          {metrics.efficiency}%
                        </Text>
                      </div>
                      <Progress percent={metrics.efficiency} size="small" strokeColor="#faad14" />
                    </div>
                    
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Text style={{ fontSize: '13px' }}>Thời gian phản hồi</Text>
                        <Text strong style={{ fontSize: '13px' }}>
                          {metrics.responseTime}%
                        </Text>
                      </div>
                      <Progress percent={metrics.responseTime} size="small" strokeColor="#3b82f6" />
                    </div>
                  </>
                )}
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <ActivityFeed 
            activities={activities}
            title="Hoạt động gần đây"
            loading={loading}
          />
        </Col>
      </Row>

      {/* Role-specific Note */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <div style={{
            padding: '16px',
            background: userRole === 'doctor' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '12px',
            color: 'white',
            textAlign: 'center'
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
              {userRole === 'doctor' 
                ? '👩‍⚕️ Cảm ơn bạn đã tận tâm chăm sóc sức khỏe bệnh nhân!'
                : '👨‍💼 Cảm ơn bạn đã hỗ trợ tích cực trong vận hành phòng khám!'
              }
            </Text>
          </div>
        </Col>
      </Row>
    </div>
  );

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard':
        return renderDashboard();
      case 'appointments':
        if (userRole === 'staff') return <AppointmentManagement />;
        // Doctor cũng có thể xem nhưng không quản lý chi tiết -> hiển thị read-only
        return <AppointmentManagement />;
      case 'medical-records':
        if (userRole === 'doctor') return <MedicalRecordsManagement />;
        return <div style={{ padding: '24px' }}><Title level={3}>403 - Bạn không có quyền truy cập chức năng này</Title></div>;
      case 'patients':
        if (userRole === 'doctor') {
          return (
            <div style={{ padding: '24px' }}>
              <Title level={2}>Bệnh nhân</Title>
              <p>Trang quản lý bệnh nhân đang được phát triển...</p>
            </div>
          );
        }
        return <div style={{ padding: '24px' }}><Title level={3}>403 - Bạn không có quyền truy cập chức năng này</Title></div>;
      case 'schedule':
        return (
          <div style={{ padding: '24px' }}>
            <Title level={2}>Lịch làm việc</Title>
            <p>Trang lịch làm việc đang được phát triển...</p>
          </div>
        );
      case 'reports':
        return (
          <div style={{ padding: '24px' }}>
            <Title level={2}>Báo cáo</Title>
            <p>Trang báo cáo đang được phát triển...</p>
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
              {userRole === 'doctor' ? 'Bác sĩ' : 'Nhân viên'}
            </Text>
          )}
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => {
            const allowed = menuItems.map(item => item.key);
            if (allowed.includes(key)) {
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

export default OperationalTemplate;