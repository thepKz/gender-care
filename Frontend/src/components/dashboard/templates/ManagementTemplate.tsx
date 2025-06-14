import React from 'react';
import { Row, Col, Typography } from 'antd';
import StatsCard from '../widgets/StatsCard';
import ActivityFeed from '../widgets/ActivityFeed';
import TableWidget from '../widgets/TableWidget';
import { 
  managementStats, 
  recentActivities, 
  todayAppointments 
} from '../../../data/mockdata/dashboardStats';

const { Title, Text } = Typography;

interface ManagementTemplateProps {
  userRole: 'admin' | 'manager';
  userName?: string;
  welcomeMessage?: string;
}

const ManagementTemplate: React.FC<ManagementTemplateProps> = ({
  userRole,
  userName = 'Admin',
  welcomeMessage
}) => {
  // Customize stats based on role
  const roleStats = userRole === 'admin' 
    ? managementStats 
    : managementStats.slice(0, 3); // Manager có ít stats hơn

  const defaultWelcomeMessage = userRole === 'admin'
    ? `Chào mừng trở lại, ${userName}! Bạn có toàn quyền quản lý hệ thống.`
    : `Chào mừng trở lại, ${userName}! Hôm nay có ${todayAppointments.length} lịch hẹn cần theo dõi.`;

  return (
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
};

export default ManagementTemplate;