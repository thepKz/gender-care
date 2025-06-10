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
  Descriptions,
  Upload
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
import type { UploadChangeParam } from 'antd/es/upload';
import { userApi, User, UserQueryParams, SystemStatistics, CreateUserRequest } from '../../../api/endpoints/userApi';

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
  personalEmail?: string; // Email cá nhân cho bác sĩ/nhân viên/quản lý
  fullName: string;
  phone: string;
  role: string;
  gender: string;
  // Doctor specific fields
  bio?: string;
  experience?: number;
  specialization?: string;
  education?: string;
  certificate?: File;
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

  // Handle role submit
  const handleRoleSubmit = async (values: RoleChangeFormValues) => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      const { newRole, reason, ...doctorData } = values;
      
      const requestData: {
        newRole: string;
        reason?: string;
        doctorProfile?: {
          bio?: string;
          experience?: number;
          specialization?: string;
          education?: string;
          certificate?: string;
        };
      } = {
        newRole,
        reason
      };

      // Nếu chuyển thành bác sĩ, thêm thông tin bác sĩ
      if (newRole === 'doctor') {
        requestData.doctorProfile = {
          bio: doctorData.bio || '',
          experience: doctorData.experience || 0,
          specialization: doctorData.specialization || '',
          education: doctorData.education || '',
          certificate: doctorData.certificate || ''
        };
      }

      const response = await userApi.updateUserRole(selectedUser._id, requestData);
      
      if (response.success) {
        message.success('Thay đổi vai trò thành công!');
        setIsRoleModalOpen(false);
        form.resetFields();
        fetchUsers();
        fetchStatistics();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      message.error('Lỗi khi thay đổi vai trò: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle create user
  const handleCreateUser = () => {
    setSelectedRole('customer');
    createForm.resetFields();
    setIsCreateModalOpen(true);
  };

  // Handle create role change
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

  // Handle create submit
  const handleCreateSubmit = async (values: CreateUserFormValues) => {
    try {
      setLoading(true);
      const { role, gender, personalEmail, ...userData } = values;

      // Create regular user request với mật khẩu tự động sinh
      const userRequestData: CreateUserRequest = {
        ...userData,
        personalEmail, // Thêm email cá nhân cho backend xử lý
        password: 'auto-generated', // Placeholder - backend sẽ tự động sinh mật khẩu
        gender: gender as 'male' | 'female' | 'other' | undefined,
        role: role as 'customer' | 'doctor' | 'staff' | 'manager' | 'admin'
      };
      
      const response = await userApi.createUser(userRequestData);
      
      if (response.success) {
        const emailTarget = role === 'customer' ? 'email đã nhập' : 'email cá nhân';
        message.success(`Tạo tài khoản thành công! Thông tin đăng nhập đã được gửi qua ${emailTarget}.`);
        setIsCreateModalOpen(false);
        createForm.resetFields();
        fetchUsers();
        fetchStatistics();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      message.error('Lỗi khi tạo tài khoản: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (user: User, reason?: string) => {
    try {
      setLoading(true);
      const response = await userApi.toggleUserStatus(user._id, { reason });
      
      if (response.success) {
        const action = user.isActive ? 'khóa' : 'kích hoạt';
        message.success(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công!`);
        fetchUsers();
        fetchStatistics();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      message.error('Lỗi khi thay đổi trạng thái: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (user: User, reason?: string, hardDelete = false) => {
    try {
      setLoading(true);
      const response = await userApi.deleteUser(user._id, { reason, hardDelete });
      
      if (response.success) {
        const action = hardDelete ? 'xóa vĩnh viễn' : 'xóa';
        message.success(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công!`);
        fetchUsers();
        fetchStatistics();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      message.error('Lỗi khi xóa tài khoản: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns: ColumnsType<User> = [
    {
      title: 'Người dùng',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text: string, record: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar 
            src={record.profilePicture} 
            icon={<UserOutlined />}
            size="default"
          />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </div>
      ),
      sorter: true,
      width: 250,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const option = roleOptions.find(opt => opt.value === role);
        return (
          <Tag color={getRoleColor(role)}>
            {option?.label || role}
          </Tag>
        );
      },
      filters: roleOptions.slice(1).map(role => ({
        text: role.label,
        value: role.value
      })),
      width: 120,
    },
    {
      title: 'Đăng ký gần đây',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => {
        const createdDate = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return (
          <div>
            <div>{createdDate.toLocaleDateString('vi-VN')}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {diffDays} ngày trước
            </Text>
          </div>
        );
      },
      sorter: true,
      width: 150,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge 
            status={isActive ? 'success' : 'error'} 
            text={isActive ? 'Hoạt động' : 'Đã khóa'} 
          />
          {record.emailVerified && (
            <Tooltip title="Email đã xác thực">
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          )}
        </div>
      ),
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Đã khóa', value: false }
      ],
      width: 150,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record: User) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewUser(record)}
            />
          </Tooltip>
          
          <Tooltip title="Thay đổi vai trò">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleRoleChange(record)}
            />
          </Tooltip>
          
          <Tooltip title={record.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}>
            <Popconfirm
              title={`Bạn có muốn ${record.isActive ? 'khóa' : 'kích hoạt'} tài khoản này?`}
              onConfirm={() => handleToggleStatus(record)}
              okText="Có"
              cancelText="Không"
            >
              <Button 
                type="text" 
                icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                size="small"
                danger={record.isActive}
              />
            </Popconfirm>
          </Tooltip>
          
          <Tooltip title="Xóa tài khoản">
            <Popconfirm
              title="Bạn có chắc muốn xóa tài khoản này?"
              description="Hành động này không thể hoàn tác."
              onConfirm={() => handleDeleteUser(record)}
              okText="Có"
              cancelText="Không"
              okType="danger"
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
      width: 180,
    },
  ];

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Quản lý người dùng
        </Title>
        <Text type="secondary">
          Quản lý tất cả người dùng trong hệ thống
        </Text>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng người dùng"
                value={statistics.totalUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Đang hoạt động"
                value={statistics.statusStatistics.active}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Đã khóa"
                value={statistics.statusStatistics.inactive}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Đăng ký gần đây"
                value={statistics.recentActivity.newUsersLast30Days || 0}
                suffix="/ 30 ngày"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Controls */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Tìm kiếm theo tên hoặc email..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Lọc theo vai trò"
              allowClear
              style={{ width: '100%' }}
              onChange={handleRoleFilter}
              defaultValue="all"
            >
              {roleOptions.map(role => (
                <Option key={role.value} value={role.value}>
                  {role.label}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={24} md={6} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={() => fetchUsers()}
                loading={loading}
              >
                Làm mới
              </Button>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateUser}
              >
                Tạo người dùng
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
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} người dùng`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* User Detail Drawer */}
      <Drawer
        title="Thông tin chi tiết người dùng"
        placement="right"
        width={500}
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
      >
        {selectedUser && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Avatar 
                src={selectedUser.profilePicture} 
                icon={<UserOutlined />}
                size={80}
                style={{ marginBottom: '8px' }}
              />
              <Title level={4} style={{ margin: 0 }}>
                {selectedUser.fullName}
              </Title>
              <Tag color={getRoleColor(selectedUser.role)}>
                {roleOptions.find(opt => opt.value === selectedUser.role)?.label || selectedUser.role}
              </Tag>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Email">
                {selectedUser.email}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedUser.phone || 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {selectedUser.gender === 'male' ? 'Nam' : 
                 selectedUser.gender === 'female' ? 'Nữ' : 'Khác'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đăng ký">
                {new Date(selectedUser.createdAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật cuối">
                {new Date(selectedUser.updatedAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Badge 
                  status={selectedUser.isActive ? 'success' : 'error'} 
                  text={selectedUser.isActive ? 'Hoạt động' : 'Đã khóa'} 
                />
              </Descriptions.Item>
              <Descriptions.Item label="Email đã xác thực">
                {selectedUser.emailVerified ? 
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                  'Chưa xác thực'
                }
              </Descriptions.Item>
            </Descriptions>

            {/* Doctor Profile (if user is doctor) */}
            {selectedUser.role === 'doctor' && selectedUser.doctorProfile && (
              <div style={{ marginTop: '24px' }}>
                <Title level={5}>Thông tin bác sĩ</Title>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Chuyên khoa">
                    {selectedUser.doctorProfile.specialization || 'Chưa cập nhật'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Kinh nghiệm">
                    {selectedUser.doctorProfile.experience} năm
                  </Descriptions.Item>
                  <Descriptions.Item label="Học vấn">
                    {selectedUser.doctorProfile.education || 'Chưa cập nhật'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Chứng chỉ">
                    {selectedUser.doctorProfile.certificate || 'Chưa cập nhật'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Giới thiệu">
                    {selectedUser.doctorProfile.bio || 'Chưa cập nhật'}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Role Change Modal */}
      <Modal
        title="Thay đổi vai trò người dùng"
        open={isRoleModalOpen}
        onCancel={() => setIsRoleModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRoleSubmit}
        >
          <Form.Item
            label="Vai trò mới"
            name="newRole"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select onChange={handleRoleChangeInModal}>
              {roleOptions.slice(1).map(role => (
                <Option key={role.value} value={role.value}>
                  {role.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Lý do thay đổi"
            name="reason"
            rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập lý do thay đổi vai trò..." />
          </Form.Item>

          {/* Doctor-specific fields */}
          {selectedRoleChange === 'doctor' && (
            <>
              <Title level={5}>Thông tin bác sĩ</Title>
              
              <Form.Item
                label="Chuyên khoa"
                name="specialization"
                rules={[{ required: true, message: 'Vui lòng nhập chuyên khoa!' }]}
              >
                <Input placeholder="Ví dụ: Sản phụ khoa, Nội tiết sinh sản..." />
              </Form.Item>

              <Form.Item
                label="Kinh nghiệm (năm)"
                name="experience"
                rules={[
                  { required: true, message: 'Vui lòng nhập số năm kinh nghiệm!' },
                  { type: 'number', min: 0, max: 50, message: 'Kinh nghiệm từ 0-50 năm!' }
                ]}
              >
                <InputNumber min={0} max={50} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                label="Học vấn"
                name="education"
                rules={[{ required: true, message: 'Vui lòng nhập học vấn!' }]}
              >
                <Input placeholder="Ví dụ: Bác sĩ Đại học Y Hà Nội..." />
              </Form.Item>

              <Form.Item
                label="Chứng chỉ"
                name="certificate"
              >
                <Input placeholder="Các chứng chỉ chuyên môn..." />
              </Form.Item>

              <Form.Item
                label="Giới thiệu"
                name="bio"
              >
                <Input.TextArea 
                  rows={3} 
                  placeholder="Giới thiệu về bác sĩ..." 
                />
              </Form.Item>
            </>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsRoleModalOpen(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Xác nhận
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create User Modal */}
      <Modal
        title={selectedRole === 'doctor' ? "Thêm bác sĩ mới" : "Tạo người dùng mới"}
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        width={700}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSubmit}
        >
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#e6f7ff', borderRadius: 6, border: '1px solid #91d5ff' }}>
            <Text type="secondary">
              <strong>Lưu ý:</strong> 
              {selectedRole === 'customer' ? (
                ' Mật khẩu sẽ được hệ thống tự động tạo và gửi qua email đã nhập.'
              ) : (
                ' Email hệ thống và mật khẩu sẽ được tự động tạo, thông tin đăng nhập sẽ được gửi về email cá nhân đã nhập.'
              )}
              {' Người dùng có thể thay đổi mật khẩu sau khi đăng nhập lần đầu.'}
            </Text>
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Họ và tên"
                name="fullName"
                rules={[
                  { required: true, message: 'Vui lòng nhập họ tên!' },
                  { min: 3, message: 'Họ tên phải có ít nhất 3 ký tự!' }
                ]}
              >
                <Input placeholder="Nhập họ và tên..." />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                label={selectedRole === 'customer' ? 'Email' : 'Email cá nhân'}
                name={selectedRole === 'customer' ? 'email' : 'personalEmail'}
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input placeholder={selectedRole === 'customer' ? 'Nhập email...' : 'Nhập email cá nhân...'} />
              </Form.Item>
            </Col>
          </Row>

          {selectedRole !== 'customer' && (
            <Row gutter={16}>
              <Col span={24}>
                <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0f2f5', borderRadius: 6, border: '1px solid #d9d9d9' }}>
                  <Text type="secondary">
                    <strong>Email hệ thống:</strong> Sẽ được tự động tạo theo định dạng {selectedRole === 'doctor' ? 'bs.' : selectedRole === 'staff' ? 'nv.' : 'ql.'}{createForm.getFieldValue('fullName') ? createForm.getFieldValue('fullName').toLowerCase().replace(/[^\w\s]/g, '').trim().split(' ').join('') : '[họtên]'}@genderhealthcare.com
                  </Text>
                </div>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Vai trò"
                name="role"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                initialValue="customer"
              >
                <Select onChange={handleCreateRoleChange}>
                  {roleOptions.slice(1).filter(role => role.value !== 'admin').map(role => (
                    <Option key={role.value} value={role.value}>
                      {role.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                label="Giới tính"
                name="gender"
                rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
              >
                <Select placeholder="Chọn giới tính">
                  <Option value="male">Nam</Option>
                  <Option value="female">Nữ</Option>
                  <Option value="other">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
                ]}
              >
                <Input placeholder="Nhập số điện thoại..." />
              </Form.Item>
            </Col>
          </Row>

          {/* Doctor-specific fields for create */}
          {selectedRole === 'doctor' && (
            <>
              <Title level={5}>Thông tin bác sĩ</Title>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Chuyên khoa"
                    name="specialization"
                    rules={[{ required: true, message: 'Vui lòng nhập chuyên khoa!' }]}
                  >
                    <Input placeholder="Ví dụ: Sản phụ khoa..." />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    label="Kinh nghiệm (năm)"
                    name="experience"
                    rules={[
                      { required: true, message: 'Vui lòng nhập kinh nghiệm!' },
                      { type: 'number', min: 0, max: 50, message: 'Kinh nghiệm từ 0-50 năm!' }
                    ]}
                  >
                    <InputNumber min={0} max={50} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Học vấn"
                name="education"
                rules={[{ required: true, message: 'Vui lòng nhập học vấn!' }]}
              >
                <Input placeholder="Ví dụ: Bác sĩ Đại học Y Hà Nội..." />
              </Form.Item>

              <Form.Item
                label="Chứng chỉ"
                name="certificate"
                rules={[{ required: true, message: 'Vui lòng tải lên chứng chỉ!' }]}
              >
                <Upload
                  name="certificate"
                  listType="picture-card"
                  className="certificate-uploader"
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={(info: UploadChangeParam) => {
                    if (info.file) {
                      createForm.setFieldsValue({ certificate: info.file });
                    }
                  }}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Tải lên chứng chỉ</div>
                  </div>
                </Upload>
              </Form.Item>

              <Form.Item
                label="Giới thiệu"
                name="bio"
              >
                <Input.TextArea 
                  rows={3} 
                  placeholder="Giới thiệu về bác sĩ..." 
                />
              </Form.Item>
            </>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsCreateModalOpen(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {selectedRole === 'doctor' ? 'Thêm bác sĩ' : 'Tạo tài khoản'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagementPage; 