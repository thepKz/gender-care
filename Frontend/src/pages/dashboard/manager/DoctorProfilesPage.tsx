import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Modal, 
  Form, 
  message, 
  Avatar, 
  Tag, 
  Rate,
  Switch,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  StarOutlined
} from '@ant-design/icons';
import doctorApi, { type IDoctor } from '../../../api/endpoints/doctor';
import userApi from '../../../api/endpoints/userApi';

const { Option } = Select;
const { Search } = Input;

const ManagerDoctorProfilesPage: React.FC = () => {
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<IDoctor[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<IDoctor | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [form] = Form.useForm();

  // Load real data from API
  useEffect(() => {
    loadDoctors();
    loadAvailableUsers();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await doctorApi.getAll();
      setDoctors(data);
      setFilteredDoctors(data);
    } catch (error: any) {
      message.error(error.message || 'Không thể tải danh sách bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      // TODO: Implement user listing API
      // const users = await userApi.getAll();
      // setAvailableUsers(users);
      setAvailableUsers([]); // Temporarily empty
    } catch (error: any) {
      console.error('Không thể tải danh sách users:', error);
    }
  };

  // Filter doctors based on search and specialty
  useEffect(() => {
    let filtered = doctors;

    if (searchText) {
      filtered = filtered.filter(doctor => 
        doctor.userId.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        doctor.userId.email.toLowerCase().includes(searchText.toLowerCase()) ||
        (doctor.specialization || '').toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedSpecialty) {
      filtered = filtered.filter(doctor => doctor.specialization === selectedSpecialty);
    }

    setFilteredDoctors(filtered);
  }, [doctors, searchText, selectedSpecialty]);

  const handleEdit = (doctor: IDoctor) => {
    setEditingDoctor(doctor);
    form.setFieldsValue({
      userId: doctor.userId._id,
      bio: doctor.bio,
      experience: doctor.experience,
      specialization: doctor.specialization,
      education: doctor.education,
      certificate: doctor.certificate
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (doctorId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa bác sĩ',
      content: 'Bạn có chắc chắn muốn xóa bác sĩ này không?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          await doctorApi.delete(doctorId);
          await loadDoctors(); // Reload data
          message.success('Xóa bác sĩ thành công!');
        } catch (error: any) {
          message.error(error.message || 'Không thể xóa bác sĩ');
        }
      }
    });
  };

  const handleStatusToggle = async (doctorId: string, newStatus: 'active' | 'inactive') => {
    // Note: This would need a separate API endpoint to toggle user status
    // For now, we'll just show a message
    message.info('Chức năng thay đổi trạng thái sẽ được cập nhật sau');
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      if (editingDoctor) {
        // Update existing doctor
        const updateData = {
          bio: values.bio,
          experience: values.experience,
          specialization: values.specialization,
          education: values.education,
          certificate: values.certificate
        };
        await doctorApi.update(editingDoctor._id, updateData);
        message.success('Cập nhật thông tin bác sĩ thành công!');
      } else {
        // Add new doctor
        const createData = {
          userId: values.userId,
          bio: values.bio,
          experience: values.experience,
          specialization: values.specialization,
          education: values.education,
          certificate: values.certificate
        };
        await doctorApi.create(createData);
        message.success('Thêm bác sĩ mới thành công!');
      }

      setIsModalVisible(false);
      setEditingDoctor(null);
      form.resetFields();
      await loadDoctors(); // Reload data
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const specialties = Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean)));

  const columns = [
    {
      title: 'Bác sĩ',
      key: 'doctor',
      render: (record: IDoctor) => (
        <Space>
          <Avatar size={40} src={record.userId.avatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.userId.fullName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.specialization}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      render: (record: IDoctor) => (
        <div>
          <div><MailOutlined /> {record.userId.email}</div>
          <div><PhoneOutlined /> {record.userId.phone || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Kinh nghiệm',
      dataIndex: 'experience',
      key: 'experience',
      render: (experience: number) => experience ? `${experience} năm` : 'N/A',
      sorter: (a: IDoctor, b: IDoctor) => (a.experience || 0) - (b.experience || 0),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => (
        <Space>
          <Rate disabled value={rating || 0} style={{ fontSize: '14px' }} />
          <span>({(rating || 0).toFixed(1)})</span>
        </Space>
      ),
      sorter: (a: IDoctor, b: IDoctor) => (a.rating || 0) - (b.rating || 0),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (record: IDoctor) => (
        <Space>
          <Tag color={record.userId.isActive ? 'green' : 'red'}>
            {record.userId.isActive ? 'Hoạt động' : 'Tạm dừng'}
          </Tag>
          <Switch
            size="small"
            checked={record.userId.isActive}
            onChange={(checked) => handleStatusToggle(record._id, checked ? 'active' : 'inactive')}
          />
        </Space>
      ),
    },
    {
      title: 'Thống kê',
      key: 'stats',
      render: (record: IDoctor) => (
        <div>
          <div>📅 {new Date(record.createdAt).toLocaleDateString()}</div>
          <div>⭐ {record.rating || 0}/5</div>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: IDoctor) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Tổng số bác sĩ" 
              value={doctors.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Đang hoạt động" 
              value={doctors.filter(d => d.userId.isActive).length}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Tạm dừng" 
              value={doctors.filter(d => !d.userId.isActive).length}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Đánh giá TB" 
              value={doctors.reduce((acc, d) => acc + (d.rating || 0), 0) / doctors.length || 0}
              precision={1}
              suffix="⭐"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col flex={1}>
            <Search
              placeholder="Tìm kiếm theo tên, email, chuyên khoa..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Chọn chuyên khoa"
              style={{ width: '200px' }}
              value={selectedSpecialty}
              onChange={setSelectedSpecialty}
              allowClear
            >
              {specialties.map(specialty => (
                <Option key={specialty} value={specialty}>{specialty}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingDoctor(null);
                form.resetFields();
                setIsModalVisible(true);
              }}
            >
              Thêm bác sĩ
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Doctor Table */}
      <Card title={`Danh sách bác sĩ (${filteredDoctors.length} bác sĩ)`}>
        <Table
          columns={columns}
          dataSource={filteredDoctors}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng cộng ${total} bác sĩ`,
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingDoctor ? 'Chỉnh sửa thông tin bác sĩ' : 'Thêm bác sĩ mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingDoctor(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {!editingDoctor && (
            <Form.Item
              label="Chọn User"
              name="userId"
              rules={[{ required: true, message: 'Vui lòng chọn user!' }]}
            >
              <Select 
                placeholder="Chọn user để tạo hồ sơ bác sĩ"
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                }
              >
                {availableUsers.map(user => (
                  <Option key={user._id} value={user._id}>
                    {user.fullName} - {user.email}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Chuyên khoa"
                name="specialization"
                rules={[{ required: true, message: 'Vui lòng chọn chuyên khoa!' }]}
              >
                <Select placeholder="Chọn hoặc nhập chuyên khoa" mode="tags" maxTagCount={1}>
                  {specialties.map(specialty => (
                    <Option key={specialty} value={specialty}>{specialty}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Kinh nghiệm (năm)"
                name="experience"
                rules={[{ required: true, message: 'Vui lòng nhập kinh nghiệm!' }]}
              >
                <Input type="number" placeholder="Số năm kinh nghiệm" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Chứng chỉ"
            name="certificate"
          >
            <Input placeholder="Chứng chỉ hành nghề" />
          </Form.Item>

          <Form.Item
            label="Học vấn"
            name="education"
          >
            <Input.TextArea rows={2} placeholder="Mô tả học vấn và bằng cấp" />
          </Form.Item>

          <Form.Item
            label="Giới thiệu"
            name="bio"
          >
            <Input.TextArea rows={3} placeholder="Mô tả kinh nghiệm và chuyên môn" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingDoctor ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagerDoctorProfilesPage; 