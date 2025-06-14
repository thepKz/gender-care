import React from 'react';
import { Row, Col, Typography, Progress, Card } from 'antd';
import StatsCard from '../widgets/StatsCard';
import ActivityFeed from '../widgets/ActivityFeed';
import TableWidget from '../widgets/TableWidget';
import { 
  operationalStats, 
  recentActivities, 
  todayAppointments,
  performanceMetrics
} from '../../../data/mockdata/dashboardStats';

const { Title, Text } = Typography;

interface OperationalTemplateProps {
  userRole: 'staff' | 'doctor';
  userName?: string;
  welcomeMessage?: string;
}

const OperationalTemplate: React.FC<OperationalTemplateProps> = ({
  userRole,
  userName = 'User',
  welcomeMessage
}) => {
  // Customize content based on role
  const roleSpecificActivities = userRole === 'doctor' 
    ? recentActivities.filter(activity => 
        activity.action.includes('tư vấn') || 
        activity.action.includes('khám') ||
        activity.user.startsWith('Dr.')
      )
    : recentActivities;

  const defaultWelcomeMessage = userRole === 'doctor'
    ? `Chào mừng Dr. ${userName}! Hôm nay bạn có ${todayAppointments.length} lịch hẹn và 4 công việc cần hoàn thành.`
    : `Chào mừng ${userName}! Hôm nay có ${todayAppointments.length} lịch hẹn cần xử lý và 5 nhiệm vụ đang chờ.`;

  const metrics = performanceMetrics.operational;

  return (
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

      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {operationalStats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <StatsCard stat={stat} />
          </Col>
        ))}
      </Row>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Today's Appointments */}
        <Col xs={24} lg={16}>
          <TableWidget 
            data={todayAppointments}
            title={userRole === 'doctor' ? 'Lịch khám hôm nay' : 'Lịch hẹn cần xử lý'}
            pagination={false}
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
              >
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
                        {Math.round(todayAppointments.length * metrics.appointmentCompletion / 100)}/{todayAppointments.length}
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
              >
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
                      {metrics.timeEfficiency}%
                    </Text>
                  </div>
                  <Progress percent={metrics.timeEfficiency} size="small" strokeColor="#faad14" />
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text style={{ fontSize: '13px' }}>Hoàn thành nhiệm vụ</Text>
                    <Text strong style={{ fontSize: '13px' }}>
                      {metrics.taskCompletion}%
                    </Text>
                  </div>
                  <Progress percent={metrics.taskCompletion} size="small" strokeColor="#3b82f6" />
                </div>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <ActivityFeed 
            activities={roleSpecificActivities.slice(0, 5)}
            title={userRole === 'doctor' ? 'Hoạt động khám bệnh' : 'Hoạt động gần đây'}
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
};

export default OperationalTemplate;