import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  InputNumber,
  Select,
  Tag,
  Modal,
  Form,
  message,
  Popconfirm,
  Avatar,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Badge,
  Drawer,
  Descriptions
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  PlusOutlined
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { userApi, User, UserQueryParams, SystemStatistics, CreateUserRequest, CreateDoctorRequest } from '../../../api/endpoints/userApi';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface RoleChangeFormValues {
  newRole: string;
  reason: string;
  // Doctor specific fields (khi chuyển thành bác sĩ)
  bio?: string;
  experience?: number;
  specialization?: string;
  education?: string;
  certificate?: string;
}

interface CreateUserFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone?: string;
  role: string;
  gender?: string;
  // Doctor specific fields
  bio?: string;
  experience?: number;
  specialization?: string;
  education?: string;
  certificate?: string;
}

const UserManagementPage: React.FC = () => {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<SystemStatistics['data'] | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('customer');
  const [selectedRoleChange, setSelectedRoleChange] = useState<string>('customer');
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  // Query params state
  const [queryParams, setQueryParams] = useState<UserQueryParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: false,
    showQuickJumper: false,
    simple: false,
    size: 'default' as const
  });

  // Role options (đã loại bỏ icon theo yêu cầu)
  const roleOptions = [
    { value: 'all', label: 'Tất cả vai trò', color: 'default' },
    { value: 'customer', label: 'Khách hàng', color: 'blue' },
    { value: 'doctor', label: 'Bác sĩ', color: 'green' },
    { value: 'staff', label: 'Nhân viên', color: 'orange' },
    { value: 'manager', label: 'Quản lý', color: 'purple' },
    { value: 'admin', label: 'Admin', color: 'red' }
  ];

  // Get role color
  const getRoleColor = (role: string) => {
    const option = roleOptions.find(opt => opt.value === role);
    return option?.color || 'default';
  };

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userApi.getAllUsers(queryParams);
      
      if (response.success) {
        setUsers(response.data.users);
        setPagination(prev => ({
          ...prev,
          current: response.data.pagination.currentPage,
          total: response.data.pagination.totalUsers,
          pageSize: response.data.pagination.limit
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      message.error('Lỗi khi tải danh sách người dùng: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await userApi.getSystemStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  }, []);

  // Load data on mount and query changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Handle table changes (pagination, sorting, filtering)
  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<User> | SorterResult<User>[]
  ) => {
    const newParams: UserQueryParams = {
      ...queryParams,
      page: newPagination.current || 1,
      limit: newPagination.pageSize || 10
    };

    // Handle single sorter (not array)
    if (!Array.isArray(sorter) && sorter.field) {
      newParams.sortBy = sorter.field as string;
      newParams.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    setQueryParams(newParams);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setQueryParams(prev => ({
      ...prev,
      search: value || undefined,
      page: 1
    }));
  };

  // Handle role filter
  const handleRoleFilter = (role: string) => {
    setQueryParams(prev => ({
      ...prev,
      role: role === 'all' ? undefined : role,
      page: 1
    }));
  };

  // Handle view user details
  const handleViewUser = async (user: User) => {
    try {
      const response = await userApi.getUserById(user._id);
      if (response.success) {
        setSelectedUser(response.data.user);
        setIsDetailDrawerOpen(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      message.error('Lỗi khi tải thông tin người dùng: ' + errorMessage);
    }
  };

  // Handle role change
  const handleRoleChange = (user: User) => {
    setSelectedUser(user);
    setSelectedRoleChange(user.role);
    form.setFieldsValue({ 
      newRole: user.role,
      reason: ''
    });
    setIsRoleModalOpen(true);
  };

  // Handle role change in role modal
  const handleRoleChangeInModal = (role: string) => {
    setSelectedRoleChange(role);
    if (role !== 'doctor') {
      // Clear doctor-specific fields when switching away from doctor
      form.setFieldsValue({
        bio: undefined,
        experience: undefined,
        specialization: undefined,
        education: undefined,
        certificate: undefined
      });
    }
  };

  // Submit role change
  const handleRoleSubmit = async (values: RoleChangeFormValues) => {
    if (!selectedUser) return;

    try {
      if (values.newRole === 'doctor' && selectedUser.role !== 'doctor') {
        // Chỉ tạo profile bác sĩ mới khi chuyển từ role khác THÀNH bác sĩ
        const doctorData: CreateDoctorRequest = {
          fullName: selectedUser.fullName,
          phone: selectedUser.phone,
          bio: values.bio,
          experience: values.experience,
          specialization: values.specialization,
          education: values.education,
          certificate: values.certificate
        };

        const response = await userApi.createDoctor(doctorData);
        message.success(`Đã chuyển thành bác sĩ! Email: ${response.userCredentials.email}`);
      } else {
        // Cập nhật role thông thường (bao gồm cả bác sĩ đã có chuyển sang role khác)
        const response = await userApi.updateUserRole(
          selectedUser._id, 
          values.newRole, 
          values.reason
        );
        
        if (response.success) {
          message.success(response.message);
        }
      }
      
      setIsRoleModalOpen(false);
      form.resetFields();
      setSelectedRoleChange('customer');
      fetchUsers();
      fetchStatistics();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      message.error('Lỗi khi cập nhật vai trò: ' + errorMessage);
    }
  };

  // Handle create user
  const handleCreateUser = () => {
    createForm.resetFields();
    setSelectedRole('customer');
    setIsCreateModalOpen(true);
  };

  // Handle role change in create form
  const handleCreateRoleChange = (role: string) => {
    setSelectedRole(role);
    if (role !== 'doctor') {
      // Clear doctor-specific fields when switching away from doctor
      createForm.setFieldsValue({
        bio: undefined,
        experience: undefined,
        specialization: undefined,
        education: undefined,
        certificate: undefined
      });
    }
  };

  // Submit create user
  const handleCreateSubmit = async (values: CreateUserFormValues) => {
    try {
      if (values.role === 'doctor') {
        // Create doctor using doctor API
        const doctorData: CreateDoctorRequest = {
          fullName: values.fullName,
          phone: values.phone,
          gender: values.gender as 'male' | 'female' | 'other',
          bio: values.bio,
          experience: values.experience,
          specialization: values.specialization,
          education: values.education,
          certificate: values.certificate
        };

        const response = await userApi.createDoctor(doctorData);
        
        message.success(`Tạo bác sĩ thành công! Email: ${response.userCredentials.email}, Mật khẩu: ${response.userCredentials.defaultPassword}`);
      } else {
        // Create regular user
        const createData: CreateUserRequest = {
          email: values.email,
          password: values.password,
          fullName: values.fullName,
          phone: values.phone,
          role: values.role as 'customer' | 'doctor' | 'staff' | 'manager' | 'admin',
          gender: values.gender as 'male' | 'female' | 'other'
        };

        const response = await userApi.createUser(createData);
        
        if (response.success) {
          message.success(response.message);
        }
      }
      
      setIsCreateModalOpen(false);
      createForm.resetFields();
      setSelectedRole('customer');
      fetchUsers();
      fetchStatistics();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      message.error('Lỗi khi tạo người dùng: ' + errorMessage);
    }
  };

  // Handle toggle user status
  const handleToggleStatus = async (user: User, reason?: string) => {
    try {
      const response = await userApi.toggleUserStatus(user._id, reason);
      if (response.success) {
        message.success(response.message);
        fetchUsers();
        fetchStatistics();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      message.error('Lỗi khi thay đổi trạng thái: ' + errorMessage);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (user: User, reason?: string, hardDelete = false) => {
    try {
      const response = await userApi.deleteUser(user._id, reason, hardDelete);
      if (response.success) {
        message.success(response.message);
        fetchUsers();
        fetchStatistics();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      message.error('Lỗi khi xóa người dùng: ' + errorMessage);
    }
  };

  // Table columns
  const columns: ColumnsType<User> = [
    {
      title: 'Người dùng',
      key: 'user',
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.avatar} 
            icon={<UserOutlined />}
            size="large"
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.fullName}</div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              {record.email}
            </div>
            {record.phone && (
              <div style={{ color: '#888', fontSize: '12px' }}>
                {record.phone}
              </div>
            )}
          </div>
        </Space>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => {
        const roleOption = roleOptions.find(opt => opt.value === role);
        return (
          <Tag color={getRoleColor(role)}>
            {roleOption?.label || role}
          </Tag>
        );
      },
      filters: roleOptions.slice(1).map(option => ({
        text: option.label,
        value: option.value
      })),
      filteredValue: queryParams.role ? [queryParams.role] : null
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Badge 
            status={record.isActive ? 'success' : 'error'}
            text={record.isActive ? 'Hoạt động' : 'Đã khóa'}
          />
          {record.emailVerified && (
            <Tag color="green">
              <CheckCircleOutlined /> Email đã xác thực
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      sorter: true,
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => handleViewUser(record)}
            />
          </Tooltip>
          
          {record.role !== 'admin' && (
            <>
              <Tooltip title="Thay đổi vai trò">
                <Button 
                  type="text" 
                  icon={<EditOutlined />}
                  onClick={() => handleRoleChange(record)}
                />
              </Tooltip>
              
              <Tooltip title={record.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}>
                <Popconfirm
                  title={`${record.isActive ? 'Khóa' : 'Kích hoạt'} tài khoản này?`}
                  description={`Bạn có chắc muốn ${record.isActive ? 'khóa' : 'kích hoạt'} tài khoản của ${record.fullName}?`}
                  onConfirm={() => handleToggleStatus(record)}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Button 
                    type="text"
                    danger={record.isActive}
                    icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                  />
                </Popconfirm>
              </Tooltip>
              
              <Tooltip title="Xóa người dùng">
                <Popconfirm
                  title="Xóa người dùng này?"
                  description={`Việc này sẽ vô hiệu hóa tài khoản của ${record.fullName}. Bạn có chắc chắn?`}
                  onConfirm={() => handleDeleteUser(record)}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Button 
                    type="text" 
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <UserOutlined /> Quản lý người dùng
      </Title>

      {/* Statistics Cards */}
      {statistics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tổng người dùng"
                value={statistics.totalUsers}
                valueStyle={{ color: '#1890ff' }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Đang hoạt động"
                value={statistics.statusStatistics.active}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Đã khóa"
                value={statistics.statusStatistics.inactive}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<StopOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Đăng ký gần đây"
                value={statistics.recentActivity.newUsersLast30Days}
                valueStyle={{ color: '#722ed1' }}
                suffix="/ 30 ngày"
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters and Search */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Lọc theo vai trò"
              value={queryParams.role || 'all'}
              onChange={handleRoleFilter}
            >
              {roleOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.label}</Tag>
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={10}>
            <Space style={{ float: 'right' }}>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateUser}
              >
                Tạo người dùng
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchUsers();
                  fetchStatistics();
                }}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>

      {/* User Detail Drawer */}
      <Drawer
        title="Thông tin chi tiết người dùng"
        placement="right"
        width={600}
        open={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
      >
        {selectedUser && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar 
                src={selectedUser.avatar} 
                icon={<UserOutlined />}
                size={80}
              />
              <Title level={4} style={{ marginTop: 16 }}>
                {selectedUser.fullName}
              </Title>
              <Tag color={getRoleColor(selectedUser.role)}>
                {roleOptions.find(opt => opt.value === selectedUser.role)?.label}
              </Tag>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="Email">
                {selectedUser.email}
                {selectedUser.emailVerified && (
                  <Tag color="green" style={{ marginLeft: 8 }}>
                    <CheckCircleOutlined /> Đã xác thực
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedUser.phone || 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái tài khoản">
                <Badge 
                  status={selectedUser.isActive ? 'success' : 'error'}
                  text={selectedUser.isActive ? 'Hoạt động' : 'Đã khóa'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {new Date(selectedUser.createdAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật cuối">
                {new Date(selectedUser.updatedAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              {selectedUser.deletedAt && (
                <Descriptions.Item label="Ngày xóa">
                  {new Date(selectedUser.deletedAt).toLocaleString('vi-VN')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Drawer>

      {/* Role Change Modal */}
      <Modal
        title={selectedRoleChange === 'doctor' && selectedUser?.role !== 'doctor' ? 'Chuyển thành bác sĩ' : 'Thay đổi vai trò người dùng'}
        open={isRoleModalOpen}
        onCancel={() => {
          setIsRoleModalOpen(false);
          form.resetFields();
          setSelectedRoleChange('customer');
        }}
        onOk={() => form.submit()}
        okText={selectedRoleChange === 'doctor' && selectedUser?.role !== 'doctor' ? 'Chuyển thành bác sĩ' : 'Cập nhật'}
        cancelText="Hủy"
        width={selectedRoleChange === 'doctor' && selectedUser?.role !== 'doctor' ? 800 : 600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRoleSubmit}
        >
          {selectedUser && (
            <div style={{ marginBottom: 16 }}>
              <Text strong>Người dùng: </Text>
              <Text>{selectedUser.fullName} ({selectedUser.email})</Text>
            </div>
          )}
          
          <Form.Item
            name="newRole"
            label="Vai trò mới"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select 
              placeholder="Chọn vai trò mới"
              onChange={handleRoleChangeInModal}
              size="large"
              style={{ borderRadius: '8px' }}
            >
              {roleOptions.slice(1).map(option => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Doctor-specific fields chỉ khi chuyển từ role khác THÀNH bác sĩ */}
          {selectedRoleChange === 'doctor' && selectedUser?.role !== 'doctor' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="specialization"
                    label="Chuyên khoa"
                    rules={[{ required: true, message: 'Vui lòng nhập chuyên khoa' }]}
                  >
                    <Input 
                      placeholder="Ví dụ: Nội khoa, Ngoại khoa..." 
                      size="large"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="experience"
                    label="Kinh nghiệm (năm)"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số năm kinh nghiệm' },
                      { type: 'number', min: 0, max: 50, message: 'Kinh nghiệm phải từ 0-50 năm' }
                    ]}
                  >
                    <InputNumber 
                      placeholder="Số năm kinh nghiệm" 
                      style={{ width: '100%', borderRadius: '8px' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="education"
                label="Trình độ học vấn"
                rules={[{ required: true, message: 'Vui lòng nhập trình độ học vấn' }]}
              >
                <Input 
                  placeholder="Ví dụ: Thạc sĩ Y khoa - Đại học Y Dược..." 
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>

              <Form.Item
                name="certificate"
                label="Chứng chỉ hành nghề"
                rules={[{ required: true, message: 'Vui lòng nhập chứng chỉ hành nghề' }]}
              >
                <Input 
                  placeholder="Ví dụ: Chứng chỉ chuyên khoa cấp I..." 
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>

              <Form.Item
                name="bio"
                label="Giới thiệu bác sĩ"
                rules={[{ required: true, message: 'Vui lòng nhập giới thiệu về bác sĩ' }]}
              >
                <Input.TextArea 
                  rows={3}
                  placeholder="Mô tả về kinh nghiệm, chuyên môn của bác sĩ..."
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="reason"
            label="Lý do thay đổi"
            rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
          >
            <Input.TextArea 
              rows={3}
              placeholder="Nhập lý do thay đổi vai trò..."
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create User Modal */}
      <Modal
        title={selectedRole === 'doctor' ? 'Tạo bác sĩ mới' : 'Tạo người dùng mới'}
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        okText={selectedRole === 'doctor' ? 'Tạo bác sĩ' : 'Tạo người dùng'}
        cancelText="Hủy"
        width={selectedRole === 'doctor' ? 800 : 600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSubmit}
        >
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[
              { required: true, message: 'Vui lòng nhập họ tên' },
              { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' }
            ]}
          >
            <Input 
              placeholder="Nhập họ và tên" 
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                ]}
              >
                <Input 
              placeholder="Nhập số điện thoại" 
              size="large"
              style={{ borderRadius: '8px' }}
            />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Vai trò"
                initialValue="customer"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
              >
                <Select 
                  placeholder="Chọn vai trò" 
                  onChange={handleCreateRoleChange}
                  size="large"
                  style={{ borderRadius: '8px' }}
                >
                  {roleOptions.slice(1).map(option => (
                    <Option key={option.value} value={option.value}>
                      <Tag color={option.color} style={{ margin: 0, borderRadius: '6px' }}>
                        {option.label}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="gender"
            label="Giới tính"
          >
            <Select 
              placeholder="Chọn giới tính" 
              allowClear
              size="large"
              style={{ borderRadius: '8px' }}
            >
              <Option value="male">Nam</Option>
              <Option value="female">Nữ</Option>
              <Option value="other">Khác</Option>
            </Select>
          </Form.Item>

          {/* Doctor-specific fields */}
          {selectedRole === 'doctor' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="specialization"
                    label="Chuyên khoa"
                    rules={[{ required: true, message: 'Vui lòng nhập chuyên khoa' }]}
                  >
                    <Input 
                      placeholder="Ví dụ: Nội khoa, Ngoại khoa..." 
                      size="large"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="experience"
                    label="Kinh nghiệm (năm)"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số năm kinh nghiệm' },
                      { type: 'number', min: 0, max: 50, message: 'Kinh nghiệm phải từ 0-50 năm' }
                    ]}
                  >
                    <InputNumber 
                      placeholder="Số năm kinh nghiệm" 
                      style={{ width: '100%', borderRadius: '8px' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="education"
                label="Trình độ học vấn"
                rules={[{ required: true, message: 'Vui lòng nhập trình độ học vấn' }]}
              >
                <Input 
                  placeholder="Ví dụ: Thạc sĩ Y khoa - Đại học Y Dược..." 
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>

              <Form.Item
                name="certificate"
                label="Chứng chỉ hành nghề"
                rules={[{ required: true, message: 'Vui lòng nhập chứng chỉ hành nghề' }]}
              >
                <Input 
                  placeholder="Ví dụ: Chứng chỉ chuyên khoa cấp I..." 
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>

              <Form.Item
                name="bio"
                label="Giới thiệu bác sĩ"
                rules={[{ required: true, message: 'Vui lòng nhập giới thiệu về bác sĩ' }]}
              >
                <Input.TextArea 
                  rows={3}
                  placeholder="Mô tả về kinh nghiệm, chuyên môn của bác sĩ..."
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </>
          )}

          {/* Non-doctor fields */}
          {selectedRole !== 'doctor' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email' },
                      { type: 'email', message: 'Email không hợp lệ' }
                    ]}
                  >
                    <Input 
                      placeholder="Nhập email" 
                      size="large"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu' },
                      { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                    ]}
                  >
                    <Input.Password 
                      placeholder="Nhập mật khẩu" 
                      size="large"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  placeholder="Xác nhận mật khẩu" 
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagementPage; 