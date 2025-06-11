import {
  CalendarOutlined,
  DollarOutlined,
  DownloadOutlined,
  FallOutlined,
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
  Rate,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

// Define interfaces since doctorMockData is removed
interface DoctorProfile {
  id: string;
  userId: {
    fullName: string;
    avatar?: string;
  };
  specialization: string;
}

interface DoctorStatistics {
  doctorId: string;
  totalSlots: number;
  bookedSlots: number;
  absentSlots: number;
  monthlyRevenue: number;
  averageRating: number;
  completedConsultations: number;
  absentDays: number;
}

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface PerformanceData extends DoctorStatistics {
  doctor: DoctorProfile;
  efficiency: number; // Tỷ lệ slot được book / tổng slot
  attendanceRate: number; // Tỷ lệ có mặt
  patientSatisfaction: number; // Điểm hài lòng
  revenue: number; // Doanh thu
  growth: number; // Tăng trưởng so với tháng trước
}

const DoctorPerformancePage: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [statistics, setStatistics] = useState<DoctorStatistics[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [loading, setLoading] = useState(false);

  // Fetch data from API
  useEffect(() => {
    fetchDoctorPerformanceData();
  }, [dateRange]);

  const fetchDoctorPerformanceData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      // const doctorsResponse = await api.get('/doctors');
      // const statisticsResponse = await api.get('/doctor-statistics');
      // setDoctors(doctorsResponse.data);
      // setStatistics(statisticsResponse.data);
      
      // Temporary empty state until API is implemented
      setDoctors([]);
      setStatistics([]);
      
    } catch (error) {
      console.error('Error fetching doctor performance data:', error);
      message.error('Không thể tải dữ liệu hiệu suất bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  // Tạo dữ liệu hiệu suất
  const getPerformanceData = (): PerformanceData[] => {
    if (statistics.length === 0 || doctors.length === 0) return [];
    
    return statistics.map(stat => {
      const doctor = doctors.find(d => d.id === stat.doctorId);
      if (!doctor) return null;
      
      const efficiency = stat.totalSlots > 0 ? (stat.bookedSlots / stat.totalSlots) * 100 : 0;
      const attendanceRate = stat.totalSlots > 0 ? ((stat.totalSlots - stat.absentSlots) / stat.totalSlots) * 100 : 0;
      
      return {
        ...stat,
        doctor,
        efficiency,
        attendanceRate,
        patientSatisfaction: 85 + Math.random() * 15, // Mock data
        revenue: stat.monthlyRevenue,
        growth: -10 + Math.random() * 30 // Mock growth data
      };
          }).filter((item): item is PerformanceData => item !== null).sort((a, b) => b.efficiency - a.efficiency);
  };

  const performanceData = getPerformanceData();

  // Tổng quan hiệu suất
  const overallStats = {
    totalDoctors: doctors.length,
    totalRevenue: performanceData.reduce((sum, data) => sum + data.revenue, 0),
    averageRating: performanceData.reduce((sum, data) => sum + data.averageRating, 0) / performanceData.length,
    averageEfficiency: performanceData.reduce((sum, data) => sum + data.efficiency, 0) / performanceData.length,
    totalConsultations: performanceData.reduce((sum, data) => sum + data.completedConsultations, 0),
    averageAttendance: performanceData.reduce((sum, data) => sum + data.attendanceRate, 0) / performanceData.length
  };

  // Dữ liệu cho biểu đồ
  const chartData = performanceData.map(data => ({
    doctor: data.doctor.userId.fullName.split(' ').pop(),
    efficiency: data.efficiency,
    revenue: data.revenue / 1000, // Chuyển sang nghìn
    consultations: data.completedConsultations,
    rating: data.averageRating
  }));

  const columns: ColumnsType<PerformanceData> = [
    {
      title: 'Xếp hạng',
      key: 'rank',
      width: 80,
      align: 'center',
      render: (_, __, index) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {index < 3 ? (
            <TrophyOutlined style={{ 
              color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
              fontSize: '18px'
            }} />
          ) : (
            <Text strong>{index + 1}</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Bác sĩ',
      key: 'doctor',
      fixed: 'left',
      width: 250,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar size={40} src={record.doctor.userId.avatar}>
            {record.doctor.userId.fullName.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {record.doctor.userId.fullName}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.doctor.specialization}
            </div>
            <Rate disabled value={record.averageRating} style={{ fontSize: '12px' }} />
          </div>
        </div>
      ),
    },
    {
      title: 'Hiệu suất',
      key: 'efficiency',
      width: 120,
      render: (_, record) => (
        <div>
          <Progress 
            percent={record.efficiency} 
            size="small" 
            status={record.efficiency >= 70 ? 'success' : record.efficiency >= 50 ? 'active' : 'exception'}
            format={(percent) => `${percent?.toFixed(1)}%`}
          />
          <Text style={{ fontSize: '12px', color: '#666' }}>
            {record.bookedSlots}/{record.totalSlots} slots
          </Text>
        </div>
      ),
      sorter: (a, b) => a.efficiency - b.efficiency,
    },
    {
      title: 'Tỷ lệ có mặt',
      key: 'attendance',
      width: 120,
      render: (_, record) => (
        <div>
          <Progress 
            percent={record.attendanceRate} 
            size="small"
            strokeColor={record.attendanceRate >= 95 ? '#52c41a' : '#faad14'}
            format={(percent) => `${percent?.toFixed(1)}%`}
          />
          <Text style={{ fontSize: '12px', color: '#666' }}>
            {record.absentDays} ngày nghỉ
          </Text>
        </div>
      ),
      sorter: (a, b) => a.attendanceRate - b.attendanceRate,
    },
    {
      title: 'Tư vấn hoàn thành',
      dataIndex: 'completedConsultations',
      key: 'consultations',
      width: 130,
      align: 'center',
      render: (consultations) => (
        <div>
          <Text strong style={{ fontSize: '16px' }}>{consultations}</Text>
          <div style={{ fontSize: '12px', color: '#666' }}>cuộc tư vấn</div>
        </div>
      ),
      sorter: (a, b) => a.completedConsultations - b.completedConsultations,
    },
    {
      title: 'Đánh giá',
      dataIndex: 'averageRating',
      key: 'rating',
      width: 100,
      align: 'center',
      render: (rating) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{rating.toFixed(1)}</div>
          <Rate disabled value={rating} style={{ fontSize: '12px' }} />
        </div>
      ),
      sorter: (a, b) => a.averageRating - b.averageRating,
    },
    {
      title: 'Doanh thu',
      key: 'revenue',
      width: 130,
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
            {(record.revenue / 1000).toFixed(0)}K
          </Text>
          <div style={{ 
            fontSize: '12px', 
            color: record.growth >= 0 ? '#52c41a' : '#ff4d4f',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            {record.growth >= 0 ? <RiseOutlined /> : <FallOutlined />}
            {Math.abs(record.growth).toFixed(1)}%
          </div>
        </div>
      ),
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 100,
      render: (_, record) => {
        let status = 'excellent';
        let color = 'green';
        let text = 'Xuất sắc';
        
        if (record.efficiency < 50 || record.attendanceRate < 90) {
          status = 'warning';
          color = 'orange';
          text = 'Cần cải thiện';
        } else if (record.efficiency < 70 || record.attendanceRate < 95) {
          status = 'good';
          color = 'blue';
          text = 'Tốt';
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  const exportReport = () => {
    setLoading(true);
    // Simulate export
    setTimeout(() => {
      setLoading(false);
      message.success('Xuất báo cáo thành công!');
    }, 2000);
  };

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

      {/* Tổng quan */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Tổng bác sĩ"
              value={overallStats.totalDoctors}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={overallStats.totalRevenue}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
              formatter={(value) => `${(Number(value) / 1000000).toFixed(1)}M`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Đánh giá TB"
              value={overallStats.averageRating}
              prefix={<StarOutlined />}
              precision={1}
              suffix="/5.0"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Hiệu suất TB"
              value={overallStats.averageEfficiency}
              suffix="%"
              precision={1}
              valueStyle={{ color: overallStats.averageEfficiency >= 70 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Tổng tư vấn"
              value={overallStats.totalConsultations}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Tỷ lệ có mặt TB"
              value={overallStats.averageAttendance}
              suffix="%"
              precision={1}
              valueStyle={{ color: overallStats.averageAttendance >= 95 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Hiệu suất chi tiết */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Hiệu suất theo bác sĩ">
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {chartData.map((data, index) => (
                <div key={index} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <Text strong>Dr. {data.doctor}</Text>
                    <Text>{data.efficiency.toFixed(1)}%</Text>
                  </div>
                  <Progress 
                    percent={data.efficiency} 
                    strokeColor="#1890ff"
                    showInfo={false}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Doanh thu theo bác sĩ">
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {chartData.map((data, index) => (
                <div key={index} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <Text strong>Dr. {data.doctor}</Text>
                    <Text style={{ color: '#52c41a' }}>{data.revenue.toFixed(0)}K₫</Text>
                  </div>
                  <Progress 
                    percent={(data.revenue / Math.max(...chartData.map(d => d.revenue))) * 100} 
                    strokeColor="#52c41a"
                    showInfo={false}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bảng hiệu suất */}
      <Card>
        <div style={{ 
          marginBottom: '16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <Space>
            <Select
              placeholder="Chọn bác sĩ"
              style={{ width: 200 }}
              allowClear
              value={selectedDoctor}
              onChange={setSelectedDoctor}
            >
              {doctors.map(doctor => (
                <Option key={doctor.id} value={doctor.id}>
                  {doctor.userId.fullName}
                </Option>
              ))}
            </Select>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                }
              }}
            />
          </Space>
          
          <Button 
            type="primary" 
            icon={<DownloadOutlined />}
            loading={loading}
            onClick={exportReport}
          >
            Xuất báo cáo
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={selectedDoctor ? performanceData.filter(p => p.doctor.id === selectedDoctor) : performanceData}
          rowKey="doctorId"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bác sĩ`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default DoctorPerformancePage; 