import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    MailOutlined,
    MedicineBoxOutlined,
    PhoneOutlined,
    PlusOutlined,
    UserOutlined
} from '@ant-design/icons';
import {
    Avatar,
    Button,
    Card,
    Form,
    Input,
    Modal,
    Popconfirm,
    Rate,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
    message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useState } from 'react';

// Define DoctorProfile interface since doctorMockData is removed
interface DoctorProfile {
  id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    avatar?: string;
    role: string;
    emailVerified: boolean;
    isActive: boolean;
  };
  bio: string;
  experience: number;
  rating: number;
  specialization: string;
  education: string;
  certificate: string;
  createdAt: string;
  updatedAt: string;
}

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const DoctorProfilesPage: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorProfile | null>(null);
  const [form] = Form.useForm();

  // Lọc và tìm kiếm
  const handleSearch = (value: string) => {
    const filtered = doctors.filter(doctor => 
      doctor.userId.fullName.toLowerCase().includes(value.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(value.toLowerCase()) ||
      doctor.userId.email.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredDoctors(filtered);
  };

  const handleFilterBySpecialty = (specialty: string) => {
    if (specialty === 'all') {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter(doctor => doctor.specialization === specialty);
      setFilteredDoctors(filtered);
    }
  };

  // Xử lý modal
  const showModal = (doctor?: DoctorProfile) => {
    setEditingDoctor(doctor || null);
    setIsModalVisible(true);
    if (doctor) {
      form.setFieldsValue({
        fullName: doctor.userId.fullName,
        email: doctor.userId.email,
        phone: doctor.userId.phone,
        specialization: doctor.specialization,
        experience: doctor.experience,
        bio: doctor.bio,
        education: doctor.education,
        certificate: doctor.certificate
      });
    } else {
      form.resetFields();
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingDoctor) {
        // Cập nhật bác sĩ
        const updatedDoctors = doctors.map(doctor => 
          doctor.id === editingDoctor.id 
            ? {
                ...doctor,
                userId: { ...doctor.userId, ...values },
                specialization: values.specialization,
                experience: values.experience,
                bio: values.bio,
                education: values.education,
                certificate: values.certificate,
                updatedAt: new Date().toISOString()
              }
            : doctor
        );
        setDoctors(updatedDoctors);
        setFilteredDoctors(updatedDoctors);
        message.success('Cập nhật thông tin bác sĩ thành công!');
      } else {
        // Thêm bác sĩ mới
        const newDoctor: DoctorProfile = {
          id: `doctor_${Date.now()}`,
          userId: {
            _id: `user_${Date.now()}`,
            fullName: values.fullName,
            email: values.email,
            phone: values.phone,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(values.fullName)}&background=667eea&color=fff`,
            role: 'doctor',
            emailVerified: true,
            isActive: true
          },
          bio: values.bio,
          experience: values.experience,
          rating: 5.0,
          specialization: values.specialization,
          education: values.education,
          certificate: values.certificate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updatedDoctors = [...doctors, newDoctor];
        setDoctors(updatedDoctors);
        setFilteredDoctors(updatedDoctors);
        message.success('Thêm bác sĩ mới thành công!');
      }
      
      setIsModalVisible(false);
      setEditingDoctor(null);
      form.resetFields();
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingDoctor(null);
    form.resetFields();
  };

  // Xóa bác sĩ
  const handleDelete = (doctorId: string) => {
    const updatedDoctors = doctors.filter(doctor => doctor.id !== doctorId);
    setDoctors(updatedDoctors);
    setFilteredDoctors(updatedDoctors);
    message.success('Xóa bác sĩ thành công!');
  };

  // Bật/tắt trạng thái bác sĩ
  const toggleDoctorStatus = (doctorId: string) => {
    const updatedDoctors = doctors.map(doctor => 
      doctor.id === doctorId 
        ? { 
            ...doctor, 
            userId: { ...doctor.userId, isActive: !doctor.userId.isActive },
            updatedAt: new Date().toISOString()
          }
        : doctor
    );
    setDoctors(updatedDoctors);
    setFilteredDoctors(updatedDoctors);
    message.success('Cập nhật trạng thái thành công!');
  };

  const columns: ColumnsType<DoctorProfile> = [
    {
      title: 'Bác sĩ',
      key: 'doctor',
      fixed: 'left',
      width: 280,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar size={48} src={record.userId.avatar}>
            {record.userId.fullName.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
              {record.userId.fullName}
            </div>
            <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MailOutlined /> {record.userId.email}
            </div>
            <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <PhoneOutlined /> {record.userId.phone}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Chuyên khoa',
      dataIndex: 'specialization',
      key: 'specialization',
      width: 180,
      render: (specialization) => (
        <Tag color="blue" icon={<MedicineBoxOutlined />}>
          {specialization}
        </Tag>
      ),
    },
    {
      title: 'Kinh nghiệm',
      dataIndex: 'experience',
      key: 'experience',
      width: 120,
      render: (experience) => `${experience} năm`,
      sorter: (a, b) => a.experience - b.experience,
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      render: (rating) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Rate disabled value={rating} style={{ fontSize: '12px' }} />
          <Text style={{ fontSize: '12px' }}>({rating})</Text>
        </div>
      ),
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Tag color={record.userId.isActive ? 'green' : 'red'}>
          {record.userId.isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => {
                Modal.info({
                  title: 'Thông tin chi tiết bác sĩ',
                  width: 600,
                  content: (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong>Học vấn:</Text><br />
                        <Text>{record.education}</Text>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong>Chứng chỉ:</Text><br />
                        <Text>{record.certificate}</Text>
                      </div>
                      <div>
                        <Text strong>Tiểu sử:</Text><br />
                        <Text>{record.bio}</Text>
                      </div>
                    </div>
                  ),
                });
              }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Tooltip title={record.userId.isActive ? 'Tạm dừng' : 'Kích hoạt'}>
            <Popconfirm
              title={`Bạn có chắc muốn ${record.userId.isActive ? 'tạm dừng' : 'kích hoạt'} bác sĩ này?`}
              onConfirm={() => toggleDoctorStatus(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button 
                type="text" 
                icon={<UserOutlined />} 
                size="small"
                danger={record.userId.isActive}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc muốn xóa bác sĩ này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const specialties = [...new Set(doctors.map(doctor => doctor.specialization))];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý hồ sơ bác sĩ
        </Title>
        <Text type="secondary">
          Quản lý thông tin cá nhân và chuyên môn của các bác sĩ
        </Text>
      </div>

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <Space size="middle">
            <Search
              placeholder="Tìm kiếm theo tên, email, chuyên khoa..."
              allowClear
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
            <Select
              placeholder="Lọc theo chuyên khoa"
              style={{ width: 200 }}
              onChange={handleFilterBySpecialty}
              allowClear
            >
              <Option value="all">Tất cả chuyên khoa</Option>
              {specialties.map(specialty => (
                <Option key={specialty} value={specialty}>{specialty}</Option>
              ))}
            </Select>
          </Space>
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            Thêm bác sĩ mới
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredDoctors}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredDoctors.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bác sĩ`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Modal thêm/sửa bác sĩ */}
      <Modal
        title={editingDoctor ? 'Chỉnh sửa thông tin bác sĩ' : 'Thêm bác sĩ mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        width={600}
        okText={editingDoctor ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input placeholder="Nhập họ và tên bác sĩ" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input placeholder="Nhập email bác sĩ" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="specialization"
            label="Chuyên khoa"
            rules={[{ required: true, message: 'Vui lòng chọn chuyên khoa!' }]}
          >
            <Select placeholder="Chọn chuyên khoa">
              <Option value="Phụ sản">Phụ sản</Option>
              <Option value="Nội tiết sinh sản">Nội tiết sinh sản</Option>
              <Option value="Tâm lý học lâm sàng">Tâm lý học lâm sàng</Option>
              <Option value="Dinh dưỡng & Sức khỏe sinh sản">Dinh dưỡng & Sức khỏe sinh sản</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="experience"
            label="Số năm kinh nghiệm"
            rules={[{ required: true, message: 'Vui lòng nhập số năm kinh nghiệm!' }]}
          >
            <Input type="number" placeholder="Nhập số năm kinh nghiệm" />
          </Form.Item>

          <Form.Item
            name="education"
            label="Học vấn"
            rules={[{ required: true, message: 'Vui lòng nhập thông tin học vấn!' }]}
          >
            <Input.TextArea rows={2} placeholder="Nhập thông tin học vấn" />
          </Form.Item>

          <Form.Item
            name="certificate"
            label="Chứng chỉ hành nghề"
            rules={[{ required: true, message: 'Vui lòng nhập thông tin chứng chỉ!' }]}
          >
            <Input placeholder="Nhập số chứng chỉ hành nghề" />
          </Form.Item>

          <Form.Item
            name="bio"
            label="Tiểu sử"
            rules={[{ required: true, message: 'Vui lòng nhập tiểu sử!' }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập tiểu sử bác sĩ" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorProfilesPage; 