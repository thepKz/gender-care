import React, { useEffect, useState } from 'react';
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
import { doctorApi } from '../../../api/endpoints';
import { 
  canCreateDoctor, 
  canUpdateDoctor, 
  canDeleteDoctor, 
  getCurrentUserRole 
} from '../../../utils/permissions';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Doctor {
  key: string;
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender?: string;
  address?: string;
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

const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [form] = Form.useForm();
  
  // Get current user role for permissions
  const userRole = getCurrentUserRole();
  console.log('Current user role:', userRole); // Debug log
  console.log('Can create doctor:', canCreateDoctor(userRole)); // Debug log
  console.log('Can update doctor:', canUpdateDoctor(userRole)); // Debug log
  console.log('Can delete doctor:', canDeleteDoctor(userRole)); // Debug log

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await doctorApi.getAllDoctors();
      console.log('Raw API data:', data); // Debug log
      
      if (Array.isArray(data)) {
        const mapped: Doctor[] = data.map((d: any, idx: number) => ({
          key: d._id || idx.toString(),
          id: d._id || d.id || `DOC${idx}`,
          fullName: d.userId?.fullName || d.fullName || 'N/A',
          email: d.userId?.email || d.email || 'N/A', 
          phone: d.userId?.phone || d.phone || '',
          gender: d.userId?.gender || d.gender || '',
          address: d.userId?.address || d.address || '',
          specialization: d.specialization || 'N/A',
          experience: d.experience || 0,
          rating: d.rating || 0,
          education: d.education || '',
          certificate: d.certificate || '',
          bio: d.bio || '',
          status: d.isDeleted ? 'inactive' : 'active',
          createdAt: d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '',
          avatar: d.userId?.avatar || d.image || '',
        }));
        console.log('Mapped doctors:', mapped); // Debug log
        setDoctors(mapped);
      }
    } catch (err: any) {
      console.error('Load data error:', err); // Debug log
      message.error(err?.response?.data?.message || 'Không thể tải danh sách bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
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
      inactive: 'Tạm dừng',
      suspended: 'Bị khóa'
    };
    return texts[status];
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    form.setFieldsValue(doctor);
    setIsModalVisible(true);
  };

  const handleDelete = async (doctorId: string) => {
    try {
      console.log('Deleting doctor with ID:', doctorId); // Debug log
      const result = await doctorApi.deleteDoctor(doctorId);
      console.log('Delete result:', result); // Debug log
      message.success('Xóa bác sĩ thành công');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err); // Debug log
      console.error('Delete error response:', err?.response); // Debug log
      message.error(err?.response?.data?.message || 'Không thể xóa bác sĩ');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form values:', values); // Debug log
      console.log('Editing doctor:', editingDoctor); // Debug log
      
      // Ensure experience is number
      if (values.experience) {
        values.experience = Number(values.experience);
      }
      
      if (editingDoctor) {
        console.log('Updating doctor with ID:', editingDoctor.id); // Debug log
        const result = await doctorApi.updateDoctor(editingDoctor.id, values);
        console.log('Update result:', result); // Debug log
        message.success('Cập nhật bác sĩ thành công');
      } else {
        console.log('Creating new doctor'); // Debug log
        const result = await doctorApi.createDoctor(values);
        console.log('Create result:', result); // Debug log
        message.success('Tạo bác sĩ thành công');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingDoctor(null);
      loadData();
    } catch (err: any) {
      console.error('Modal submit error:', err); // Debug log
      console.error('Error response:', err?.response); // Debug log
      message.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingDoctor(null);
  };

  const showDoctorDetails = (doctor: Doctor) => {
    Modal.info({
      title: 'Chi tiết bác sĩ',
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <p><strong>ID:</strong> {doctor.id}</p>
          <p><strong>Họ tên:</strong> {doctor.fullName}</p>
          <p><strong>Email:</strong> {doctor.email}</p>
          <p><strong>Số điện thoại:</strong> {doctor.phone}</p>
          <p><strong>Chuyên khoa:</strong> {doctor.specialization}</p>
          <p><strong>Kinh nghiệm:</strong> {doctor.experience} năm</p>
          <p><strong>Đánh giá:</strong> <Rate disabled value={doctor.rating} /></p>
          <p><strong>Học vấn:</strong> {doctor.education}</p>
          <p><strong>Chứng chỉ:</strong> {doctor.certificate}</p>
          <p><strong>Tiểu sử:</strong> {doctor.bio}</p>
          <p><strong>Trạng thái:</strong> {getStatusText(doctor.status)}</p>
          <p><strong>Ngày tạo:</strong> {new Date(doctor.createdAt).toLocaleDateString('vi-VN')}</p>
        </div>
      ),
    });
  };

  const columns: ColumnsType<Doctor> = [
    {
      title: 'Bác sĩ',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 200,
      render: (fullName: string, record: Doctor) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar 
            src={record.avatar} 
            icon={<UserOutlined />}
            size={40}
          />
          <div>
            <Text strong>{fullName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.certificate}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Liên hệ',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email: string, record: Doctor) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <MailOutlined style={{ color: '#1890ff' }} />
            <Text style={{ fontSize: '12px' }}>{email}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PhoneOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: '12px' }}>{record.phone}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Chuyên khoa',
      dataIndex: 'specialization',
      key: 'specialization',
      width: 150,
      render: (specialization: string) => (
        <Tag color="blue">{specialization}</Tag>
      )
    },
    {
      title: 'Kinh nghiệm',
      dataIndex: 'experience',
      key: 'experience',
      width: 100,
      render: (experience: number) => (
        <Text>{experience} năm</Text>
      ),
      sorter: (a, b) => a.experience - b.experience
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      render: (rating: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record: Doctor) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => showDoctorDetails(record)}
            />
          </Tooltip>
          {canUpdateDoctor(userRole) && (
            <Tooltip title="Chỉnh sửa">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {canDeleteDoctor(userRole) && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa bác sĩ này?"
                onConfirm={() => handleDelete(record.id)}
                okText="Có"
                cancelText="Không"
              >
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <MedicineBoxOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Quản lý bác sĩ
          </Title>
          {canCreateDoctor(userRole) && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              Thêm bác sĩ mới
            </Button>
          )}
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Search
            placeholder="Tìm kiếm theo tên, email hoặc chuyên khoa..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          
          <Select
            placeholder="Chuyên khoa"
            style={{ width: 200 }}
            value={selectedSpecialty}
            onChange={setSelectedSpecialty}
          >
            <Option value="all">Tất cả chuyên khoa</Option>
            <Option value="Phụ sản">Phụ sản</Option>
            <Option value="Nội tiết sinh sản">Nội tiết sinh sản</Option>
            <Option value="Tâm lý học lâm sàng">Tâm lý học lâm sàng</Option>
            <Option value="Dinh dưỡng & Sức khỏe sinh sản">Dinh dưỡng & Sức khỏe sinh sản</Option>
          </Select>

          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="active">Hoạt động</Option>
            <Option value="inactive">Tạm dừng</Option>
            <Option value="suspended">Bị khóa</Option>
          </Select>
        </div>

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

      <Modal
        title={editingDoctor ? 'Chỉnh sửa bác sĩ' : 'Thêm bác sĩ mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={700}
        okText={editingDoctor ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input placeholder="Nhập họ tên bác sĩ" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input placeholder="Nhập địa chỉ email" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="gender"
            label="Giới tính"
            rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
          >
            <Select placeholder="Chọn giới tính">
              <Option value="male">Nam</Option>
              <Option value="female">Nữ</Option>
              <Option value="other">Khác</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
          >
            <Input placeholder="Nhập địa chỉ" />
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

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="experience"
              label="Kinh nghiệm (năm)"
              rules={[{ required: true, message: 'Vui lòng nhập số năm kinh nghiệm!' }]}
              style={{ flex: 1 }}
            >
              <Input type="number" placeholder="Nhập số năm kinh nghiệm" />
            </Form.Item>

            <Form.Item
              name="rating"
              label="Đánh giá"
              style={{ flex: 1 }}
            >
              <Rate allowHalf />
            </Form.Item>
          </div>

          <Form.Item
            name="education"
            label="Học vấn"
            rules={[{ required: true, message: 'Vui lòng nhập thông tin học vấn!' }]}
          >
            <Input placeholder="Nhập thông tin học vấn" />
          </Form.Item>

          <Form.Item
            name="certificate"
            label="Chứng chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập mã chứng chỉ!' }]}
          >
            <Input placeholder="Nhập mã chứng chỉ hành nghề" />
          </Form.Item>

          <Form.Item
            name="bio"
            label="Tiểu sử"
          >
            <Input.TextArea rows={3} placeholder="Nhập tiểu sử và kinh nghiệm của bác sĩ" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Tạm dừng</Option>
              <Option value="suspended">Bị khóa</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorManagement;