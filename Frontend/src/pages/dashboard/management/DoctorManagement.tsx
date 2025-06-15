import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  Typography,
  Avatar,
  Tooltip,
  Popconfirm,
  Rate,
  message
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  EyeOutlined,
  MedicineBoxOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// NOTE: MOCKDATA - Dữ liệu giả cho development
interface Doctor {
  key: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: number;
  rating: number;
  education: string;
  certificate: string;
  bio: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  avatar?: string;
}

const mockDoctors: Doctor[] = [
  {
    key: '1',
    id: 'DOC001',
    name: 'Dr. Nguyễn Thị Hương',
    email: 'huong.nguyen@genderhealthcare.com',
    phone: '0901234567',
    specialization: 'Phụ sản',
    experience: 8,
    rating: 4.9,
    education: 'Thạc sĩ Y khoa - Đại học Y Hà Nội',
    certificate: 'BS001234',
    bio: 'Bác sĩ có 8 năm kinh nghiệm trong lĩnh vực phụ sản, chuyên về chăm sóc sức khỏe sinh sản phụ nữ.',
    status: 'active',
    createdAt: '2024-01-15',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=64&h=64&fit=crop&crop=face'
  },
  {
    key: '2',
    id: 'DOC002',
    name: 'Dr. Trần Minh Đức',
    email: 'duc.tran@genderhealthcare.com',
    phone: '0901234568',
    specialization: 'Nội tiết sinh sản',
    experience: 12,
    rating: 4.8,
    education: 'Tiến sĩ Y khoa - Đại học Y Thành phố Hồ Chí Minh',
    certificate: 'BS001235',
    bio: 'Chuyên gia hàng đầu về nội tiết sinh sản với 12 năm kinh nghiệm điều trị các rối loạn hormone.',
    status: 'active',
    createdAt: '2024-01-16',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=64&h=64&fit=crop&crop=face'
  },
  {
    key: '3',
    id: 'DOC003',
    name: 'Dr. Lê Thị Mai',
    email: 'mai.le@genderhealthcare.com',
    phone: '0901234569',
    specialization: 'Tâm lý học lâm sàng',
    experience: 6,
    rating: 4.7,
    education: 'Thạc sĩ Tâm lý học - Đại học Quốc gia Hà Nội',
    certificate: 'BS001236',
    bio: 'Chuyên gia tâm lý với kinh nghiệm tư vấn về sức khỏe tâm thần và tình dục học.',
    status: 'active',
    createdAt: '2024-01-17',
    avatar: 'https://images.unsplash.com/photo-1594824388853-d0c2d4e5b1b5?w=64&h=64&fit=crop&crop=face'
  },
  {
    key: '4',
    id: 'DOC004',
    name: 'Dr. Phạm Văn Hùng',
    email: 'hung.pham@genderhealthcare.com',
    phone: '0901234570',
    specialization: 'Dinh dưỡng & Sức khỏe sinh sản',
    experience: 5,
    rating: 4.6,
    education: 'Thạc sĩ Dinh dưỡng - Đại học Y Dược Thành phố Hồ Chí Minh',
    certificate: 'BS001237',
    bio: 'Chuyên gia dinh dưỡng tập trung vào sức khỏe sinh sản và kế hoạch hóa gia đình.',
    status: 'inactive',
    createdAt: '2024-01-18',
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=64&h=64&fit=crop&crop=face'
  }
];

const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [form] = Form.useForm();

  // Filter doctors based on search and filters
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         doctor.email.toLowerCase().includes(searchText.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchText.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || doctor.specialization === selectedSpecialty;
    const matchesStatus = selectedStatus === 'all' || doctor.status === selectedStatus;
    
    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const getStatusColor = (status: Doctor['status']) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      suspended: 'error'
    };
    return colors[status];
  };

  const getStatusText = (status: Doctor['status']) => {
    const texts = {
      active: 'Hoạt động',
      inactive: 'Không hoạt động',
      suspended: 'Tạm khóa'
    };
    return texts[status];
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    form.setFieldsValue(doctor);
    setIsModalVisible(true);
  };

  const handleDelete = (doctorId: string) => {
    setDoctors(doctors.filter(doctor => doctor.id !== doctorId));
    message.success('Xóa bác sĩ thành công!');
  };

  const handleStatusToggle = (doctorId: string) => {
    setDoctors(doctors.map(doctor => 
      doctor.id === doctorId 
        ? { ...doctor, status: doctor.status === 'active' ? 'inactive' : 'active' }
        : doctor
    ));
    message.success('Cập nhật trạng thái thành công!');
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      if (editingDoctor) {
        // Update existing doctor
        setDoctors(doctors.map(doctor => 
          doctor.id === editingDoctor.id ? { ...doctor, ...values } : doctor
        ));
        message.success('Cập nhật thông tin bác sĩ thành công!');
      } else {
        // Add new doctor
        const newDoctor: Doctor = {
          key: Date.now().toString(),
          id: `DOC${Date.now()}`,
          ...values,
          rating: 5.0,
          createdAt: new Date().toISOString().split('T')[0],
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(values.name)}&background=667eea&color=fff`
        };
        setDoctors([...doctors, newDoctor]);
        message.success('Thêm bác sĩ mới thành công!');
      }
      setIsModalVisible(false);
      setEditingDoctor(null);
      form.resetFields();
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingDoctor(null);
    form.resetFields();
  };

  const showDoctorDetails = (doctor: Doctor) => {
    Modal.info({
      title: 'Thông tin chi tiết bác sĩ',
      width: 600,
      content: (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <Avatar size={64} src={doctor.avatar}>
              {doctor.name.charAt(0)}
            </Avatar>
            <div>
              <Title level={4} style={{ margin: 0 }}>{doctor.name}</Title>
              <Text type="secondary">{doctor.specialization}</Text>
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <Text strong>Học vấn:</Text><br />
            <Text>{doctor.education}</Text>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <Text strong>Chứng chỉ:</Text><br />
            <Text>{doctor.certificate}</Text>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <Text strong>Kinh nghiệm:</Text><br />
            <Text>{doctor.experience} năm</Text>
          </div>
          <div>
            <Text strong>Tiểu sử:</Text><br />
            <Text>{doctor.bio}</Text>
          </div>
        </div>
      ),
    });
  };

  const columns: ColumnsType<Doctor> = [
    {
      title: 'Bác sĩ',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 280,
      render: (name: string, record: Doctor) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar 
            src={record.avatar} 
            size={48}
            style={{ backgroundColor: '#667eea' }}
          >
            {!record.avatar && name.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
              {name}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MailOutlined /> {record.email}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <PhoneOutlined /> {record.phone}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Chuyên khoa',
      dataIndex: 'specialization',
      key: 'specialization',
      width: 180,
      render: (specialization: string) => (
        <Tag color="blue" icon={<MedicineBoxOutlined />}>
          {specialization}
        </Tag>
      )
    },
    {
      title: 'Kinh nghiệm',
      dataIndex: 'experience',
      key: 'experience',
      width: 120,
      render: (experience: number) => `${experience} năm`,
      sorter: (a, b) => a.experience - b.experience
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      width: 140,
      render: (rating: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Rate disabled value={rating} style={{ fontSize: '12px' }} />
          <Text style={{ fontSize: '12px' }}>({rating})</Text>
        </div>
      ),
      sorter: (a, b) => a.rating - b.rating
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: Doctor['status']) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <span style={{ fontSize: '13px' }}>{date}</span>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record: Doctor) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => showDoctorDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}>
            <Popconfirm
              title={`Bạn có chắc muốn ${record.status === 'active' ? 'tạm dừng' : 'kích hoạt'} bác sĩ này?`}
              onConfirm={() => handleStatusToggle(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button 
                type="text" 
                icon={<UserOutlined />} 
                size="small"
                danger={record.status === 'active'}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa bác sĩ này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
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
      )
    }
  ];

  const specialties = [...new Set(doctors.map(doctor => doctor.specialization))];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Quản lý bác sĩ
        </Title>
        <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
          NOTE: MOCKDATA - Quản lý thông tin và hồ sơ của các bác sĩ trong hệ thống
        </p>
      </div>

      <Card>
        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <Space>
            <Search
              placeholder="Tìm kiếm bác sĩ..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              value={selectedSpecialty}
              onChange={setSelectedSpecialty}
              style={{ width: 200 }}
            >
              <Option value="all">Tất cả chuyên khoa</Option>
              {specialties.map(specialty => (
                <Option key={specialty} value={specialty}>{specialty}</Option>
              ))}
            </Select>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 150 }}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Không hoạt động</Option>
              <Option value="suspended">Tạm khóa</Option>
            </Select>
          </Space>
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Thêm bác sĩ
          </Button>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredDoctors}
          loading={loading}
          pagination={{
            total: filteredDoctors.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} bác sĩ`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingDoctor ? 'Chỉnh sửa thông tin bác sĩ' : 'Thêm bác sĩ mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText={editingDoctor ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'active' }}
        >
          <Form.Item
            name="name"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
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
          
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select>
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Không hoạt động</Option>
              <Option value="suspended">Tạm khóa</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorManagement;