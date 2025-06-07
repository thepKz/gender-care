import React, { useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Avatar,
  List,
  Descriptions
} from 'antd';
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  CalendarOutlined,
  TeamOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { MOCK_DOCTORS, type DoctorProfile } from '../../../share/doctorMockData';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Specialty {
  id: string;
  name: string;
  description: string;
  doctorCount: number;
  totalConsultations: number;
  monthlyRevenue: number;
  averageRating: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface SpecialtyDoctor {
  id: string;
  name: string;
  experience: number;
  consultations: number;
  rating: number;
  avatar: string;
}

const AdminDoctorSpecialtiesPage: React.FC = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([
    {
      id: '1',
      name: 'Sản khoa',
      description: 'Chăm sóc sức khỏe phụ nữ mang thai và chuyển dạ',
      doctorCount: 3,
      totalConsultations: 245,
      monthlyRevenue: 85000000,
      averageRating: 4.8,
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Nội tiết sinh sản',
      description: 'Điều trị các vấn đề về hormone và sinh sản',
      doctorCount: 2,
      totalConsultations: 189,
      monthlyRevenue: 62000000,
      averageRating: 4.6,
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      name: 'Tâm lý học lâm sàng',
      description: 'Hỗ trợ tâm lý cho phụ nữ trong quá trình mang thai và sau sinh',
      doctorCount: 1,
      totalConsultations: 156,
      monthlyRevenue: 45000000,
      averageRating: 4.9,
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: '4',
      name: 'Dinh dưỡng',
      description: 'Tư vấn dinh dưỡng cho phụ nữ mang thai và cho con bú',
      doctorCount: 1,
      totalConsultations: 98,
      monthlyRevenue: 28000000,
      averageRating: 4.7,
      status: 'active',
      createdAt: '2024-01-15'
    }
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [isDoctorModalVisible, setIsDoctorModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Get doctors by specialty
  const getDoctorsBySpecialty = (specialtyName: string): SpecialtyDoctor[] => {
    return MOCK_DOCTORS
      .filter(doctor => doctor.specialization.toLowerCase().includes(specialtyName.toLowerCase()))
      .map(doctor => ({
        id: doctor.id,
        name: doctor.userId.fullName,
        experience: doctor.experience,
        consultations: Math.floor(Math.random() * 100) + 50,
        rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
        avatar: doctor.userId.avatar || ''
      }));
  };

  const handleAddSpecialty = () => {
    setEditingSpecialty(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleEditSpecialty = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setIsModalVisible(true);
    form.setFieldsValue(specialty);
  };

  const handleDeleteSpecialty = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa chuyên khoa này?',
      onOk: () => {
        setSpecialties(prev => prev.filter(s => s.id !== id));
        message.success('Đã xóa chuyên khoa thành công!');
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      if (editingSpecialty) {
        // Update specialty
        setSpecialties(prev => prev.map(s => 
          s.id === editingSpecialty.id 
            ? { ...s, ...values }
            : s
        ));
        message.success('Cập nhật chuyên khoa thành công!');
      } else {
        // Add new specialty
        const newSpecialty: Specialty = {
          id: Date.now().toString(),
          ...values,
          doctorCount: 0,
          totalConsultations: 0,
          monthlyRevenue: 0,
          averageRating: 0,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setSpecialties(prev => [...prev, newSpecialty]);
        message.success('Thêm chuyên khoa thành công!');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDoctors = (specialty: Specialty) => {
    setSelectedSpecialty(specialty);
    setIsDoctorModalVisible(true);
  };

  const columns: ColumnsType<Specialty> = [
    {
      title: 'Tên chuyên khoa',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Số bác sĩ',
      dataIndex: 'doctorCount',
      key: 'doctorCount',
      width: 120,
      align: 'center',
      render: (count) => (
        <Tag color="blue" icon={<TeamOutlined />}>
          {count}
        </Tag>
      ),
      sorter: (a, b) => a.doctorCount - b.doctorCount,
    },
    {
      title: 'Lượt tư vấn',
      dataIndex: 'totalConsultations',
      key: 'totalConsultations',
      width: 120,
      align: 'center',
      render: (count) => <Text strong>{count}</Text>,
      sorter: (a, b) => a.totalConsultations - b.totalConsultations,
    },
    {
      title: 'Doanh thu tháng',
      dataIndex: 'monthlyRevenue',
      key: 'monthlyRevenue',
      width: 150,
      align: 'right',
      render: (revenue) => (
        <Text strong style={{ color: '#52c41a' }}>
          {revenue.toLocaleString('vi-VN')}₫
        </Text>
      ),
      sorter: (a, b) => a.monthlyRevenue - b.monthlyRevenue,
    },
    {
      title: 'Đánh giá TB',
      dataIndex: 'averageRating',
      key: 'averageRating',
      width: 120,
      align: 'center',
      render: (rating) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <Text strong>{rating}</Text>
          <span style={{ color: '#fadb14' }}>⭐</span>
        </div>
      ),
      sorter: (a, b) => a.averageRating - b.averageRating,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<UserOutlined />} 
            onClick={() => handleViewDoctors(record)}
            title="Xem bác sĩ"
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditSpecialty(record)}
            title="Chỉnh sửa"
          />
          <Button 
            type="text" 
            icon={<DeleteOutlined />} 
            danger
            onClick={() => handleDeleteSpecialty(record.id)}
            title="Xóa"
          />
        </Space>
      ),
    },
  ];

  // Calculate overall statistics
  const totalSpecialties = specialties.length;
  const totalDoctors = specialties.reduce((sum, s) => sum + s.doctorCount, 0);
  const totalRevenue = specialties.reduce((sum, s) => sum + s.monthlyRevenue, 0);
  const totalConsultations = specialties.reduce((sum, s) => sum + s.totalConsultations, 0);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý chuyên khoa bác sĩ
        </Title>
        <Text type="secondary">
          Quản lý các chuyên khoa và phân bổ bác sĩ theo từng lĩnh vực
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng chuyên khoa"
              value={totalSpecialties}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng bác sĩ"
              value={totalDoctors}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng lượt tư vấn"
              value={totalConsultations}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu tháng"
              value={totalRevenue}
              prefix={<DollarOutlined />}
              suffix="₫"
              formatter={(value) => value?.toLocaleString('vi-VN')}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Specialty Distribution */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title="Phân bổ bác sĩ theo chuyên khoa">
            {specialties.map(specialty => (
              <div key={specialty.id} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <Text strong>{specialty.name}</Text>
                  <Text>{specialty.doctorCount} bác sĩ</Text>
                </div>
                <Progress 
                  percent={totalDoctors > 0 ? (specialty.doctorCount / totalDoctors) * 100 : 0}
                  strokeColor="#1890ff"
                  showInfo={false}
                />
              </div>
            ))}
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="Doanh thu theo chuyên khoa">
            {specialties
              .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
              .map(specialty => (
                <div key={specialty.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <div>
                    <Text strong>{specialty.name}</Text>
                    <br />
                    <Text type="secondary">{specialty.totalConsultations} lượt</Text>
                  </div>
                  <Text strong style={{ color: '#52c41a' }}>
                    {(specialty.monthlyRevenue / 1000000).toFixed(1)}M₫
                  </Text>
                </div>
              ))}
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>Danh sách chuyên khoa</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddSpecialty}
          >
            Thêm chuyên khoa
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={specialties}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} chuyên khoa`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingSpecialty ? 'Chỉnh sửa chuyên khoa' : 'Thêm chuyên khoa mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Tên chuyên khoa"
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên chuyên khoa!' },
              { min: 2, message: 'Tên chuyên khoa phải có ít nhất 2 ký tự!' }
            ]}
          >
            <Input placeholder="Nhập tên chuyên khoa" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[
              { required: true, message: 'Vui lòng nhập mô tả!' },
              { min: 10, message: 'Mô tả phải có ít nhất 10 ký tự!' }
            ]}
          >
            <TextArea 
              rows={4} 
              placeholder="Nhập mô tả về chuyên khoa"
            />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Tạm dừng</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingSpecialty ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Doctors Modal */}
      <Modal
        title={`Bác sĩ chuyên khoa: ${selectedSpecialty?.name}`}
        open={isDoctorModalVisible}
        onCancel={() => setIsDoctorModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedSpecialty && (
          <div>
            <Descriptions size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="Tổng bác sĩ">{selectedSpecialty.doctorCount}</Descriptions.Item>
              <Descriptions.Item label="Lượt tư vấn">{selectedSpecialty.totalConsultations}</Descriptions.Item>
              <Descriptions.Item label="Đánh giá trung bình">{selectedSpecialty.averageRating} ⭐</Descriptions.Item>
            </Descriptions>

            <List
              dataSource={getDoctorsBySpecialty(selectedSpecialty.name)}
              renderItem={(doctor) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={doctor.avatar} icon={<UserOutlined />} />}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{doctor.name}</span>
                        <Space>
                          <Tag color="blue">{doctor.experience} năm KN</Tag>
                          <Tag color="green">{doctor.consultations} tư vấn</Tag>
                          <Tag color="gold">⭐ {doctor.rating}</Tag>
                        </Space>
                      </div>
                    }
                    description={`Kinh nghiệm: ${doctor.experience} năm | Tổng lượt tư vấn: ${doctor.consultations}`}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDoctorSpecialtiesPage; 