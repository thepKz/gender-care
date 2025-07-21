import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Typography,
  Button,
  Row,
  Col,
  Card,
  Progress
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  LogoutOutlined,
  VideoCameraOutlined,

  MedicineBoxOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import StatsCard from '../widgets/StatsCard';
import ActivityFeed from '../widgets/ActivityFeed';
import TableWidget from '../widgets/TableWidget';
import DoctorScheduleCalendar from '../widgets/DoctorScheduleCalendar';

import AppointmentManagement from '../../../pages/dashboard/operational/AppointmentManagement';
import MedicalRecordsManagement from '../../../pages/dashboard/operational/MedicalRecordsManagement';
import ConsultationManagement from '../../../pages/dashboard/operational/ConsultationManagement';
import MeetingHistoryManagement from '../../../pages/dashboard/operational/MeetingHistoryManagement';
import DoctorAppointmentSchedule from '../../../pages/dashboard/operational/DoctorAppointmentSchedule';
import ServiceTestConfiguration from '../../../pages/dashboard/operational/ServiceTestConfiguration';
import TestResultsEntryStaff from '../../../pages/dashboard/operational/TestResultsEntryStaff';
import DoctorProfileManagement from '../../../pages/dashboard/operational/DoctorProfileManagement';
import StaffAllAppointmentsManagement from '../../../pages/dashboard/operational/StaffAllAppointmentsManagement';

import { 
  type DashboardStat,
  defaultOperationalStats, 
  defaultActivities, 
  defaultAppointments,
  defaultPerformanceMetrics
} from '../../../types/dashboard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { fetchOperationalDashboard } from '../../../api/endpoints/dashboard';
import { filterMenuItemsByPermissions, type MenuItem } from '../../../utils/permissions';

const { Title, Text } = Typography;
const { Header, Sider, Content } = Layout;

interface OperationalTemplateProps {
  userRole: 'staff' | 'doctor';
  userName?: string;
  welcomeMessage?: string;
}

// Xây dựng menu động theo vai trò Staff / Doctor với permission filtering
const getMenuItemsOperational = (role: 'staff' | 'doctor', navigate: (path: string) => void): MenuItem[] => {
  let baseMenuItems: MenuItem[];

  if (role === 'doctor') {
    // Bác sĩ: thêm các chức năng đặc biệt
    baseMenuItems = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: 'Tổng quan',
      },
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Thông tin cá nhân',
      },
      {
        key: 'my-appointments',
        icon: <CalendarOutlined />,
        label: 'Lịch hẹn của tôi',
      },
      // ĐÃ XÓA mục 'Quản lý tất cả lịch hẹn' khỏi menu bác sĩ
      {
        key: 'medical-records',
        icon: <FileTextOutlined />,
        label: 'Hồ sơ bệnh án',
      },
      {
        key: 'consultations',
        icon: <VideoCameraOutlined />,
        label: 'Tư vấn trực tuyến',
      },
      {
        key: 'meeting-history',
        icon: <HistoryOutlined />,
        label: 'Lịch sử Meeting',
      },
      // Removed 'reports' for doctor - not needed for patient care focus
    ];
  } else {
    // Staff: menu cơ bản
    baseMenuItems = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: 'Tổng quan',
      },
      {
        key: 'my-appointments',
        icon: <CalendarOutlined />,
        label: 'Quản lý tất cả lịch hẹn',
      },
      // XÓA mục 'all-appointments' để tránh trùng label
      {
        key: 'test-results',
        icon: <MedicineBoxOutlined />,
        label: 'Nhập kết quả xét nghiệm',
      },
      {
        key: 'test-config',
        icon: <ScheduleOutlined />,
        label: 'Cấu hình xét nghiệm',
      },
      // Removed 'reports' for staff - focus on operational tasks, not management reports
    ];
  }

  // Apply permission filtering to only show items the user has access to
  return filterMenuItemsByPermissions(baseMenuItems, role);
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

  const [statsCards, setStatsCards] = useState(defaultOperationalStats);
  const [loading, setLoading] = useState(false);

  // Customize content based on role
  const roleSpecificActivities = userRole === 'doctor' 
    ? defaultActivities.filter(activity => 
        activity.action.includes('tư vấn') || 
        activity.action.includes('khám') ||
        activity.user.startsWith('Dr.')
      )
    : defaultActivities;

  const defaultWelcomeMessage = userRole === 'doctor'
    ? `Chào mừng Dr. ${userName}! Hôm nay bạn có ${defaultAppointments.length} lịch hẹn và 4 công việc cần hoàn thành.`
    : `Chào mừng ${userName}! Hôm nay có ${defaultAppointments.length} lịch hẹn cần xử lý và 5 nhiệm vụ đang chờ.`;

  const metrics = defaultPerformanceMetrics;
  const menuItems = getMenuItemsOperational(userRole, navigate);

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
              icon: 'CalendarOutlined' as const,
              color: '#10b981',
              change: '',
              trend: 'up' as const
            },
            {
              title: 'Lịch hẹn trong tuần',
              value: data.stats.weeklyAppointments || 0,
              icon: 'ScheduleOutlined' as const,
              color: '#3b82f6',
              change: '',
              trend: 'up' as const
            },
            {
              title: 'Lịch hẹn pending',
              value: data.stats.pendingAppointments || 0,
              icon: 'ClockCircleOutlined' as const,
              color: '#f59e0b',
              change: '',
              trend: 'down' as const
            }
          ];
          setStatsCards(mapped);
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
                icon: stat.icon as string
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
            data={defaultAppointments}
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
                  <>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <Progress
                          type="circle"
                          percent={metrics.appointmentCompletion}
                          size={120}
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
                            {Math.round(defaultAppointments.length * metrics.appointmentCompletion / 100)}/{defaultAppointments.length}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Hoàn thành
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <Text type="secondary">
                        {userRole === 'doctor' ? 'Bệnh nhân đã khám' : 'Công việc đã xong'}
                      </Text>
                    </div>
                  </>
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

      {/* Doctor Schedule Calendar - only show for doctors */}
      {userRole === 'doctor' && (
        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24}>
            <DoctorScheduleCalendar />
          </Col>
        </Row>
      )}

      {/* Recent Activities */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <ActivityFeed 
            activities={roleSpecificActivities.slice(0, 5)}
            title={userRole === 'doctor' ? 'Hoạt động khám bệnh' : 'Hoạt động gần đây'}
          />
        </Col>
      </Row>
    </div>
  );

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard':
        return renderDashboard();
      // Lịch hẹn của tôi - cho doctor, Quản lý tất cả lịch hẹn - cho staff
      case 'my-appointments':
        if (userRole === 'staff') return <StaffAllAppointmentsManagement />;
        return <DoctorAppointmentSchedule />;
        
      // Quản lý tất cả lịch hẹn - chỉ cho doctor
      case 'appointments':
        if (userRole === 'doctor') return <AppointmentManagement />;
        return <div style={{ padding: '24px' }}><Title level={3}>403 - Bạn không có quyền truy cập chức năng này</Title></div>;
        
      // Nhập kết quả xét nghiệm - cho cả doctor và staff
      case 'test-results':
        return <TestResultsEntryStaff />;
        
      // Cấu hình xét nghiệm - cho cả doctor và staff
      case 'test-config':
        return <ServiceTestConfiguration />;
        
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
        if (userRole === 'doctor') {
          return (
            <div style={{ padding: '24px' }}>
              <DoctorScheduleCalendar />
            </div>
          );
        }
        return (
          <div style={{ padding: '24px' }}>
            <Title level={3}>403 - Chỉ bác sĩ mới có quyền xem lịch làm việc cá nhân</Title>
            <p>Staff có thể xem lịch hẹn thông qua trang "Quản lý lịch hẹn".</p>
          </div>
        );
        
      case 'reports':
        return (
          <div style={{ padding: '24px' }}>
            <Title level={2}>Báo cáo</Title>
            <p>Trang báo cáo đang được phát triển...</p>
          </div>
        );

      case 'consultations':
        if (userRole === 'doctor') return <ConsultationManagement />;
        return <div style={{ padding: '24px' }}><Title level={3}>403 - Bạn không có quyền truy cập chức năng này</Title></div>;
      case 'meeting-history':
        if (userRole === 'doctor') return <MeetingHistoryManagement />;
        return <div style={{ padding: '24px' }}><Title level={3}>403 - Bạn không có quyền truy cập chức năng này</Title></div>;
      
      case 'profile':
        if (userRole === 'doctor') return <DoctorProfileManagement />;
        return <div style={{ padding: '24px' }}><Title level={3}>403 - Bạn không có quyền truy cập chức năng này</Title></div>;
        
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
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 100,
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
      
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          position: 'fixed',
          top: 0,
          right: 0,
          left: collapsed ? 80 : 250,
          zIndex: 99,
          transition: 'left 0.2s',
        }}>
          <Button type="link" icon={<DashboardOutlined />} onClick={() => navigate('/')}>Trang chủ</Button>
          <Button type="link" icon={<LogoutOutlined />} onClick={onLogout}>Đăng xuất</Button>
        </Header>
        <Content style={{ 
          padding: '24px',
          background: '#f5f5f5',
          overflow: 'auto',
          marginTop: 64, // Header height
          minHeight: 'calc(100vh - 64px)',
        }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default OperationalTemplate;