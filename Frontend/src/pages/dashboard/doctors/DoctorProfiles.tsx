import React, { useState } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Tag, 
  Avatar, 
  Space, 
  Input, 
  Select,
  Modal,
  Row,
  Col,
  Typography,
  Divider,
  Rate,
  Statistic
} from 'antd';
import { 
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;

interface Doctor {
  key: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  experience: number;
  rating: number;
  totalPatients: number;
  status: 'active' | 'inactive' | 'on-leave';
  joinDate: string;
  avatar?: string;
  certification: string[];
  workingHours: string;
  consultationFee: number;
}

// Mock data bác sĩ
const mockDoctors: Doctor[] = [
  {
    key: '1',
    id: 'DOC001',
    name: 'Dr. Nguyễn Minh Anh',
    email: 'minh.anh@genderhealthcare.com',
    phone: '0901234567',
    specialty: 'Sản phụ khoa',
    experience: 8,
    rating: 4.9,
    totalPatients: 156,
    status: 'active',
    joinDate: '2020-03-15',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=64&h=64&fit=crop&crop=face',
    certification: ['Chứng chỉ hành nghề bác sĩ', 'Chuyên khoa Sản phụ khoa cấp II'],
    workingHours: '8:00 - 17:00',
    consultationFee: 300000
  },
  {
    key: '2',
    id: 'DOC002',
    name: 'Dr. Trần Văn Bình',
    email: 'van.binh@genderhealthcare.com',
    phone: '0901234568',
    specialty: 'Tư vấn sức khỏe sinh sản',
    experience: 6,
    rating: 4.8,
    totalPatients: 142,
    status: 'active',
    joinDate: '2021-01-20',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=64&h=64&fit=crop&crop=face',
    certification: ['Chứng chỉ hành nghề bác sĩ', 'Chuyên khoa Nội tiết sinh sản'],
    workingHours: '9:00 - 18:00',
    consultationFee: 250000
  },
  {
    key: '3',
    id: 'DOC003',
    name: 'Dr. Lê Thị Cẩm',
    email: 'thi.cam@genderhealthcare.com',
    phone: '0901234569',
    specialty: 'Xét nghiệm & Chẩn đoán',
    experience: 10,
    rating: 4.7,
    totalPatients: 203,
    status: 'active',
    joinDate: '2019-06-10',
    avatar: 'https://images.unsplash.com/photo-1594824949093-c6c13da5e7ac?w=64&h=64&fit=crop&crop=face',
    certification: ['Chứng chỉ hành nghề bác sĩ', 'Chuyên khoa Xét nghiệm y học', 'Chứng chỉ siêu âm'],
    workingHours: '8:30 - 16:30',
    consultationFee: 200000
  },
  {
    key: '4',
    id: 'DOC004',
    name: 'Dr. Phạm Minh Tuấn',
    email: 'minh.tuan@genderhealthcare.com',
    phone: '0901234570',
    specialty: 'Tâm lý học',
    experience: 5,
    rating: 4.6,
    totalPatients: 89,
    status: 'on-leave',
    joinDate: '2022-02-15',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
    certification: ['Chứng chỉ hành nghề bác sĩ', 'Thạc sĩ Tâm lý học lâm sàng'],
    workingHours: '10:00 - 19:00',
    consultationFee: 350000
  }
];

const DoctorProfiles: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'on-leave': return 'orange';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Đang làm việc';
      case 'inactive': return 'Ngưng hoạt động';
      case 'on-leave': return 'Nghỉ phép';
      default: return status;
    }
  };

  const handleViewDetail = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDetailModalVisible(true);
  };

  const columns: ColumnsType<Doctor> = [
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
            {record.name.split(' ').pop()?.charAt(0)}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: '14px', display: 'block' }}>
              {record.name}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {record.id}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Chuyên khoa',
      dataIndex: 'specialty',
      key: 'specialty',
      render: (specialty) => (
        <Tag color="blue">{specialty}</Tag>
      ),
    },
    {
      title: 'Kinh nghiệm',
      dataIndex: 'experience',
      key: 'experience',
      render: (years) => `${years} năm`,
      sorter: (a, b) => a.experience - b.experience,
    },
    {
      title: 'Đánh giá',
      key: 'rating',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Rate disabled defaultValue={record.rating} style={{ fontSize: '12px' }} />
          <Text style={{ fontSize: '12px' }}>
            {record.rating} ({record.totalPatients})
          </Text>
        </div>
      ),
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Phí tư vấn',
      dataIndex: 'consultationFee',
      key: 'consultationFee',
      render: (fee) => `${fee.toLocaleString('vi-VN')}đ`,
      sorter: (a, b) => a.consultationFee - b.consultationFee,
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
          <Button 
            type="text" 
            icon={<EditOutlined />}
          />
          <Button 
            type="text" 
            icon={<DeleteOutlined />} 
            danger
          />
        </Space>
      ),
    },
  ];

  // Filter doctors
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         doctor.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;
    const matchesStatus = !selectedStatus || doctor.status === selectedStatus;
    
    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const specialties = Array.from(new Set(doctors.map(doctor => doctor.specialty)));

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý hồ sơ bác sĩ
        </Title>
        <Text type="secondary">
          Quản lý thông tin và hồ sơ của các bác sĩ trong hệ thống
        </Text>
      </div>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng số bác sĩ"
              value={doctors.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={doctors.filter(d => d.status === 'active').length}
              valueStyle={{ color: '#3f8600' }}
              prefix={<MedicineBoxOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Đánh giá TB"
              value={doctors.reduce((sum, d) => sum + d.rating, 0) / doctors.length}
              precision={1}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng bệnh nhân"
              value={doctors.reduce((sum, d) => sum + d.totalPatients, 0)}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Input
              placeholder="Tìm kiếm theo tên, email..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder="Chọn chuyên khoa"
              style={{ width: '100%' }}
              value={selectedSpecialty}
              onChange={setSelectedSpecialty}
              allowClear
            >
              {specialties.map(specialty => (
                <Option key={specialty} value={specialty}>
                  {specialty}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder="Chọn trạng thái"
              style={{ width: '100%' }}
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
            >
              <Option value="active">Đang làm việc</Option>
              <Option value="on-leave">Nghỉ phép</Option>
              <Option value="inactive">Ngưng hoạt động</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              style={{ width: '100%' }}
            >
              Thêm bác sĩ
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Doctors Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredDoctors}
          pagination={{
            total: filteredDoctors.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} bác sĩ`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Doctor Detail Modal */}
      <Modal
        title="Chi tiết bác sĩ"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Đóng
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />}>
            Chỉnh sửa
          </Button>,
        ]}
        width={800}
      >
        {selectedDoctor && (
          <div>
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
                <Avatar 
                  src={selectedDoctor.avatar} 
                  size={120}
                  style={{ backgroundColor: '#667eea', marginBottom: '16px' }}
                >
                  {selectedDoctor.name.split(' ').pop()?.charAt(0)}
                </Avatar>
                <Title level={4} style={{ margin: 0 }}>
                  {selectedDoctor.name}
                </Title>
                <Text type="secondary">{selectedDoctor.id}</Text>
                <div style={{ marginTop: '16px' }}>
                  <Tag color={getStatusColor(selectedDoctor.status)}>
                    {getStatusText(selectedDoctor.status)}
                  </Tag>
                </div>
              </Col>
              
              <Col xs={24} sm={16}>
                <Title level={5}>Thông tin cơ bản</Title>
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Text strong>Email:</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MailOutlined />
                      <Text>{selectedDoctor.email}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Số điện thoại:</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PhoneOutlined />
                      <Text>{selectedDoctor.phone}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Chuyên khoa:</Text>
                    <div><Tag color="blue">{selectedDoctor.specialty}</Tag></div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Kinh nghiệm:</Text>
                    <div><Text>{selectedDoctor.experience} năm</Text></div>
                  </Col>
                </Row>

                <Divider />

                <Title level={5}>Thống kê</Title>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic
                      title="Đánh giá"
                      value={selectedDoctor.rating}
                      precision={1}
                      suffix="/ 5"
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Tổng bệnh nhân"
                      value={selectedDoctor.totalPatients}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Phí tư vấn"
                      value={selectedDoctor.consultationFee}
                      suffix="đ"
                    />
                  </Col>
                </Row>

                <Divider />

                <Title level={5}>Chứng chỉ & Bằng cấp</Title>
                <div>
                  {selectedDoctor.certification.map((cert, index) => (
                    <Tag key={index} style={{ margin: '4px' }}>
                      {cert}
                    </Tag>
                  ))}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorProfiles;
