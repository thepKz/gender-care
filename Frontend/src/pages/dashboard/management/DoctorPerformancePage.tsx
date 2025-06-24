import {
    DollarOutlined,
    DownloadOutlined,
    EyeOutlined,
    RiseOutlined,
    StarOutlined,
    TrophyOutlined,
    UserOutlined
} from '@ant-design/icons';
import {
    Avatar,
    Button,
    Card,
    Col,
    DatePicker,
    Progress,
    Row,
    Select,
    Statistic,
    Table,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface DoctorInfo {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

interface DoctorData {
  _id: string;
  userId: DoctorInfo;
  specialization?: string;
  experience?: number;
}

interface DoctorPerformance {
  id: string;
  doctorName: string;
  specialty: string;
  avatar: string;
  totalConsultations: number;
  completedConsultations: number;
  revenue: number;
  averageRating: number;
  efficiency: number;
  patientSatisfaction: number;
  onTimeRate: number;
  rank: number;
}

const ManagerDoctorPerformancePage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');

  // Generate mock performance data
  const generatePerformanceData = (): DoctorPerformance[] => {
    // TODO: Replace with actual API call
    const doctors: DoctorData[] = []; // Empty until API is implemented
    return doctors.map((doctor, index: number) => ({
      id: doctor._id,
      doctorName: doctor.userId.fullName,
      specialty: doctor.specialization || 'Chưa xác định',
      avatar: doctor.userId.avatar || '',
      totalConsultations: Math.floor(Math.random() * 100) + 50,
      completedConsultations: Math.floor(Math.random() * 90) + 45,
      revenue: Math.floor(Math.random() * 50000000) + 20000000,
      averageRating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
      efficiency: Math.floor(Math.random() * 30) + 70,
      patientSatisfaction: Math.floor(Math.random() * 20) + 80,
      onTimeRate: Math.floor(Math.random() * 20) + 80,
      rank: index + 1
    }));
  };

  const [performanceData] = useState<DoctorPerformance[]>(generatePerformanceData());

  // Calculate overall statistics
  const totalDoctors = performanceData.length;
  const totalRevenue = performanceData.reduce((sum, doctor) => sum + doctor.revenue, 0);
  const averageRating = performanceData.reduce((sum, doctor) => sum + doctor.averageRating, 0) / totalDoctors;
  const averageEfficiency = performanceData.reduce((sum, doctor) => sum + doctor.efficiency, 0) / totalDoctors;

  const columns: ColumnsType<DoctorPerformance> = [
    {
      title: 'Xếp hạng',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      align: 'center',
      render: (rank) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {rank <= 3 ? (
            <TrophyOutlined style={{ 
              color: rank === 1 ? '#fadb14' : rank === 2 ? '#d9d9d9' : '#d4b106',
              fontSize: '16px'
            }} />
          ) : (
            <span style={{ fontWeight: 'bold' }}>{rank}</span>
          )}
        </div>
      ),
    },
    {
      title: 'Bác sĩ',
      key: 'doctor',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.doctorName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.specialty}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Tổng lượt khám',
      dataIndex: 'totalConsultations',
      key: 'totalConsultations',
      width: 120,
      align: 'center',
      render: (total) => <Text strong>{total}</Text>,
      sorter: (a, b) => a.totalConsultations - b.totalConsultations,
    },
    {
      title: 'Hoàn thành',
      dataIndex: 'completedConsultations',
      key: 'completedConsultations',
      width: 120,
      align: 'center',
      render: (completed, record) => (
        <div>
          <Text strong>{completed}</Text>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {Math.round((completed / record.totalConsultations) * 100)}%
          </div>
        </div>
      ),
      sorter: (a, b) => a.completedConsultations - b.completedConsultations,
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 120,
      align: 'right',
      render: (revenue) => (
        <Text strong style={{ color: '#52c41a' }}>
          {revenue.toLocaleString('vi-VN')}₫
        </Text>
      ),
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: 'Đánh giá',
      dataIndex: 'averageRating',
      key: 'averageRating',
      width: 100,
      align: 'center',
      render: (rating) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <StarOutlined style={{ color: '#fadb14' }} />
          <Text strong>{rating}</Text>
        </div>
      ),
      sorter: (a, b) => a.averageRating - b.averageRating,
    },
    {
      title: 'Hiệu suất',
      dataIndex: 'efficiency',
      key: 'efficiency',
      width: 120,
      render: (efficiency) => (
        <div>
          <Progress 
            percent={efficiency} 
            size="small" 
            strokeColor={efficiency >= 90 ? '#52c41a' : efficiency >= 75 ? '#faad14' : '#ff4d4f'}
            showInfo={false}
          />
          <Text style={{ fontSize: '12px' }}>{efficiency}%</Text>
        </div>
      ),
      sorter: (a, b) => a.efficiency - b.efficiency,
    },
    {
      title: 'Hài lòng',
      dataIndex: 'patientSatisfaction',
      key: 'patientSatisfaction',
      width: 100,
      align: 'center',
      render: (satisfaction) => (
        <Tag color={satisfaction >= 90 ? 'green' : satisfaction >= 75 ? 'orange' : 'red'}>
          {satisfaction}%
        </Tag>
      ),
      sorter: (a, b) => a.patientSatisfaction - b.patientSatisfaction,
    },
    {
      title: 'Đúng giờ',
      dataIndex: 'onTimeRate',
      key: 'onTimeRate',
      width: 100,
      align: 'center',
      render: (onTime) => (
        <Tag color={onTime >= 90 ? 'green' : onTime >= 75 ? 'orange' : 'red'}>
          {onTime}%
        </Tag>
      ),
      sorter: (a, b) => a.onTimeRate - b.onTimeRate,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => {
              // Handle view details
              console.log('View details for:', record.doctorName);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Đánh giá hiệu suất bác sĩ
        </Title>
        <Text type="secondary">
          Theo dõi và đánh giá hiệu suất làm việc của đội ngũ bác sĩ
        </Text>
      </div>

      {/* Overall Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng số bác sĩ"
              value={totalDoctors}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={totalRevenue}
              prefix={<DollarOutlined />}
              suffix="₫"
              formatter={(value) => value?.toLocaleString('vi-VN')}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đánh giá trung bình"
              value={averageRating}
              prefix={<StarOutlined />}
              suffix="/5"
              precision={1}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Hiệu suất trung bình"
              value={averageEfficiency}
              prefix={<RiseOutlined />}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8} md={6}>
            <Text strong>Thời gian:</Text>
            <Select
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              style={{ width: '100%', marginTop: '4px' }}
            >
              <Option value="week">Tuần này</Option>
              <Option value="month">Tháng này</Option>
              <Option value="quarter">Quý này</Option>
              <Option value="year">Năm này</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Text strong>Chuyên khoa:</Text>
            <Select
              value={selectedSpecialty}
              onChange={setSelectedSpecialty}
              style={{ width: '100%', marginTop: '4px' }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="obstetrics">Sản khoa</Option>
              <Option value="reproductive">Nội tiết sinh sản</Option>
              <Option value="psychology">Tâm lý học</Option>
              <Option value="nutrition">Dinh dưỡng</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Text strong>Khoảng thời gian:</Text>
            <RangePicker style={{ width: '100%', marginTop: '4px' }} />
          </Col>
          <Col xs={24} sm={24} md={6}>
            <div style={{ marginTop: '24px' }}>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                style={{ width: '100%' }}
                onClick={() => {
                  // Handle export
                  console.log('Export performance data');
                }}
              >
                Xuất báo cáo
              </Button>
            </div>
          </Col>
        </Row>

        {/* Performance Table */}
        <Table
          columns={columns}
          dataSource={performanceData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bác sĩ`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default ManagerDoctorPerformancePage; 