import React from 'react';
import { Card, Row, Col, Statistic, Typography, Progress, List, Avatar, Tag } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  DollarOutlined, 
  TrophyOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  BarChartOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ManagerDashboard: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Manager Dashboard
        </Title>
        <Text type="secondary">
          Chào mừng trở lại! Quản lý hoạt động phòng khám hiệu quả.
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng bác sĩ"
              value={12}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Lịch hẹn hôm nay"
              value={45}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu tháng"
              value={125000000}
              prefix={<DollarOutlined />}
              suffix="₫"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đánh giá trung bình"
              value={4.8}
              prefix={<TrophyOutlined />}
              suffix="/5"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Performance Chart */}
        <Col xs={24} lg={16}>
          <Card title="Hiệu suất làm việc" extra={<a href="#">Xem chi tiết</a>}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Tỷ lệ hoàn thành công việc</Text>
              <Progress percent={85} status="active" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Mức độ hài lòng bệnh nhân</Text>
              <Progress percent={92} status="active" strokeColor="#52c41a" />
            </div>
            <div>
              <Text strong>Hiệu quả sử dụng thời gian</Text>
              <Progress percent={78} status="active" strokeColor="#faad14" />
            </div>
          </Card>
        </Col>

        {/* Top Doctors */}
        <Col xs={24} lg={8}>
          <Card title="Bác sĩ xuất sắc" extra={<a href="#">Xem tất cả</a>}>
            <List
              itemLayout="horizontal"
              dataSource={[
                {
                  name: 'Dr. Nguyễn Thị Hương',
                  specialty: 'Sản khoa',
                  rating: 4.9,
                  patients: 156
                },
                {
                  name: 'Dr. Trần Minh Đức',
                  specialty: 'Nội tiết sinh sản',
                  rating: 4.8,
                  patients: 134
                },
                {
                  name: 'Dr. Lê Thị Mai',
                  specialty: 'Tâm lý học',
                  rating: 4.7,
                  patients: 98
                }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{item.name}</span>
                        <Tag color="gold">⭐ {item.rating}</Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div>{item.specialty}</div>
                        <Text type="secondary">{item.patients} bệnh nhân</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ManagerDashboard; 