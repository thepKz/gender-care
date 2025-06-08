import React from 'react';
import { Card, Row, Col, Statistic, Typography, Timeline, Avatar, List, Tag, Progress } from 'antd';
import { 
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const DoctorDashboard: React.FC = () => {
  const todayAppointments = [
    {
      time: '08:00',
      patient: 'Nguyễn Thị Lan',
      type: 'Khám thai',
      status: 'completed'
    },
    {
      time: '09:00',
      patient: 'Trần Minh Anh',
      type: 'Tư vấn dinh dưỡng',
      status: 'completed'
    },
    {
      time: '10:00',
      patient: 'Lê Thị Hoa',
      type: 'Khám định kỳ',
      status: 'in-progress'
    },
    {
      time: '11:00',
      patient: 'Phạm Văn Nam',
      type: 'Tư vấn kế hoạch hóa gia đình',
      status: 'pending'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Bảng điều khiển bác sĩ
        </Title>
        <Text type="secondary">
          Chào mừng trở lại! Hôm nay bạn có {todayAppointments.length} lịch hẹn.
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Lịch hẹn hôm nay"
              value={todayAppointments.length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Bệnh nhân tháng này"
              value={127}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đánh giá trung bình"
              value={4.8}
              prefix={<StarOutlined />}
              suffix="/5"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tỷ lệ hoàn thành"
              value={95}
              prefix={<CheckCircleOutlined />}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Today's Schedule */}
        <Col xs={24} lg={16}>
          <Card title="Lịch hẹn hôm nay" extra={<a href="/dashboard/doctor/my-schedule">Xem chi tiết</a>}>
            <Timeline>
              {todayAppointments.map((appointment, index) => (
                <Timeline.Item
                  key={index}
                  color={
                    appointment.status === 'completed' ? 'green' :
                    appointment.status === 'in-progress' ? 'blue' : 'orange'
                  }
                  dot={
                    appointment.status === 'completed' ? <CheckCircleOutlined style={{ color: 'green' }} /> :
                    appointment.status === 'in-progress' ? <ClockCircleOutlined style={{ color: 'blue' }} /> :
                    <ExclamationCircleOutlined style={{ color: 'orange' }} />
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>{appointment.time}</Text> - {appointment.patient}
                      <br />
                      <Text type="secondary">{appointment.type}</Text>
                    </div>
                    <Tag color={
                      appointment.status === 'completed' ? 'green' :
                      appointment.status === 'in-progress' ? 'blue' : 'orange'
                    }>
                      {appointment.status === 'completed' ? 'Hoàn thành' :
                       appointment.status === 'in-progress' ? 'Đang khám' : 'Chờ khám'}
                    </Tag>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* Performance & Stats */}
        <Col xs={24} lg={8}>
          <Card title="Hiệu suất công việc" style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Text>Tỷ lệ đúng giờ</Text>
              <Progress percent={88} size="small" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text>Thời gian khám trung bình</Text>
              <Progress percent={75} size="small" strokeColor="#faad14" />
            </div>
            <div>
              <Text>Mức độ hài lòng</Text>
              <Progress percent={92} size="small" strokeColor="#52c41a" />
            </div>
          </Card>

          <Card title="Thông tin cá nhân">
            <List
              size="small"
              dataSource={[
                { label: 'Chuyên khoa', value: 'Sản khoa & Phụ khoa' },
                { label: 'Kinh nghiệm', value: '8 năm' },
                { label: 'Bằng cấp', value: 'Thạc sĩ Y khoa' },
                { label: 'Tỷ lệ tái khám', value: '87%' }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Text type="secondary">{item.label}:</Text>
                    <Text strong>{item.value}</Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DoctorDashboard; 