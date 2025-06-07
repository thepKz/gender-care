import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Rate,
  Progress,
  Select,
  DatePicker,
  Statistic,
  Avatar,
  Tag,
  Space,
  Button,
  Modal
} from 'antd';
import {
  TrophyOutlined,
  StarOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface DoctorPerformance {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  avatar?: string;
  totalConsultations: number;
  completedConsultations: number;
  averageRating: number;
  totalRatings: number;
  responseTime: number;
  satisfactionRate: number;
  totalRevenue: number;
  monthlyGrowth: number;
  patientRetention: number;
  punctualityScore: number;
  professionalismScore: number;
  communicationScore: number;
}

// Mock data hiệu suất bác sĩ
const mockPerformanceData: DoctorPerformance[] = [
  {
    id: '1',
    doctorId: 'DOC001',
    doctorName: 'Dr. Nguyễn Minh Anh',
    specialty: 'Sản phụ khoa',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=64&h=64&fit=crop&crop=face',
    totalConsultations: 156,
    completedConsultations: 148,
    averageRating: 4.9,
    totalRatings: 142,
    responseTime: 8,
    satisfactionRate: 96.5,
    totalRevenue: 46800000,
    monthlyGrowth: 12.5,
    patientRetention: 89.3,
    punctualityScore: 95.2,
    professionalismScore: 4.8,
    communicationScore: 4.7
  },
  {
    id: '2',
    doctorId: 'DOC002',
    doctorName: 'Dr. Trần Văn Bình',
    specialty: 'Tư vấn sức khỏe sinh sản',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=64&h=64&fit=crop&crop=face',
    totalConsultations: 142,
    completedConsultations: 138,
    averageRating: 4.8,
    totalRatings: 135,
    responseTime: 12,
    satisfactionRate: 94.2,
    totalRevenue: 35500000,
    monthlyGrowth: 8.7,
    patientRetention: 85.6,
    punctualityScore: 92.8,
    professionalismScore: 4.6,
    communicationScore: 4.8
  },
  {
    id: '3',
    doctorId: 'DOC003',
    doctorName: 'Dr. Lê Thị Cẩm',
    specialty: 'Xét nghiệm & Chẩn đoán',
    avatar: 'https://images.unsplash.com/photo-1594824949093-c6c13da5e7ac?w=64&h=64&fit=crop&crop=face',
    totalConsultations: 203,
    completedConsultations: 195,
    averageRating: 4.7,
    totalRatings: 189,
    responseTime: 15,
    satisfactionRate: 92.8,
    totalRevenue: 40600000,
    monthlyGrowth: 15.3,
    patientRetention: 82.4,
    punctualityScore: 88.9,
    professionalismScore: 4.5,
    communicationScore: 4.6
  }
];

const DoctorPerformance: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedDoctor, setSelectedDoctor] = useState<string | undefined>();
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedDoctorData, setSelectedDoctorData] = useState<DoctorPerformance | null>(null);

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#faad14';
    return '#ff4d4f';
  };

  const handleViewDetail = (doctor: DoctorPerformance) => {
    setSelectedDoctorData(doctor);
    setIsDetailModalVisible(true);
  };

  const columns: ColumnsType<DoctorPerformance> = [
    {
      title: 'Bác sĩ',
      key: 'doctor',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar 
            src={record.avatar} 
            size={48}
            style={{ backgroundColor: '#667eea' }}
          >
            {record.doctorName.split(' ').pop()?.charAt(0)}
          </Avatar>
          <div>
            <Text strong>{record.doctorName}</Text>
            <div><Text type="secondary">{record.specialty}</Text></div>
          </div>
        </div>
      ),
    },
    {
      title: 'Tổng số ca',
      dataIndex: 'totalConsultations',
      key: 'totalConsultations',
      sorter: (a, b) => a.totalConsultations - b.totalConsultations,
    },
    {
      title: 'Đánh giá TB',
      key: 'rating',
      render: (_, record) => (
        <div>
          <Rate disabled value={record.averageRating} style={{ fontSize: '12px' }} />
          <div><Text>{record.averageRating} ({record.totalRatings})</Text></div>
        </div>
      ),
      sorter: (a, b) => a.averageRating - b.averageRating,
    },
    {
      title: 'Tỷ lệ hài lòng',
      dataIndex: 'satisfactionRate',
      key: 'satisfactionRate',
      render: (rate) => (
        <Progress 
          percent={rate} 
          size="small" 
          strokeColor={getPerformanceColor(rate)}
        />
      ),
      sorter: (a, b) => a.satisfactionRate - b.satisfactionRate,
    },
    {
      title: 'Doanh thu',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      render: (revenue) => `${(revenue / 1000000).toFixed(1)}M đ`,
      sorter: (a, b) => a.totalRevenue - b.totalRevenue,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetail(record)}
          />
          <Button type="text" icon={<EditOutlined />} />
        </Space>
      ),
    },
  ];

  const totalConsultations = mockPerformanceData.reduce((sum, d) => sum + d.totalConsultations, 0);
  const averageRating = mockPerformanceData.reduce((sum, d) => sum + d.averageRating, 0) / mockPerformanceData.length;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Đánh giá hiệu suất bác sĩ
        </Title>
        <Text type="secondary">
          Theo dõi và đánh giá hiệu suất làm việc của các bác sĩ
        </Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Chọn thời gian"
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              style={{ width: '100%' }}
            >
              <Option value="current-month">Tháng hiện tại</Option>
              <Option value="last-month">Tháng trước</Option>
              <Option value="current-quarter">Quý hiện tại</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Chọn bác sĩ"
              value={selectedDoctor}
              onChange={setSelectedDoctor}
              style={{ width: '100%' }}
              allowClear
            >
              {mockPerformanceData.map(doctor => (
                <Option key={doctor.doctorId} value={doctor.doctorId}>
                  {doctor.doctorName}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <RangePicker style={{ width: '100%' }} />
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng ca tư vấn"
              value={totalConsultations}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Đánh giá TB"
              value={averageRating}
              precision={1}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Hiệu suất cao"
              value={mockPerformanceData.filter(d => d.satisfactionRate >= 90).length}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Doanh thu TB"
              value={(mockPerformanceData.reduce((sum, d) => sum + d.totalRevenue, 0) / mockPerformanceData.length / 1000000)}
              precision={1}
              suffix="M đ"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Performance Table */}
      <Card title="Bảng hiệu suất chi tiết">
        <Table
          columns={columns}
          dataSource={mockPerformanceData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} bác sĩ`,
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết hiệu suất"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedDoctorData && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8} style={{ textAlign: 'center' }}>
                <Avatar 
                  src={selectedDoctorData.avatar} 
                  size={80}
                  style={{ backgroundColor: '#667eea' }}
                >
                  {selectedDoctorData.doctorName.split(' ').pop()?.charAt(0)}
                </Avatar>
                <div style={{ marginTop: '16px' }}>
                  <Title level={4}>{selectedDoctorData.doctorName}</Title>
                  <Text type="secondary">{selectedDoctorData.specialty}</Text>
                </div>
              </Col>
              <Col span={16}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Tổng ca tư vấn"
                      value={selectedDoctorData.totalConsultations}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Đánh giá"
                      value={selectedDoctorData.averageRating}
                      precision={1}
                      suffix="/5"
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Tỷ lệ hài lòng"
                      value={selectedDoctorData.satisfactionRate}
                      precision={1}
                      suffix="%"
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Doanh thu"
                      value={selectedDoctorData.totalRevenue / 1000000}
                      precision={1}
                      suffix="M đ"
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorPerformance;
