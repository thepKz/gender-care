import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
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
import authApi from '../../../api/endpoints/auth';
import CustomPagination from '../../../components/ui/CustomPagination';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// Interfaces
interface CreateUserFormValues {
  email: string;
  personalEmail?: string;
  fullName: string;
  phone: string;
  role: string;
  gender: string;
  bio?: string;
  experience?: number;
  specialization?: string;
  education?: string;
  certificate?: File;
}

// Constants
const ROLE_OPTIONS = [
  { value: 'all', label: 'Tất cả vai trò', color: 'default' },
  { value: 'customer', label: 'Khách hàng', color: 'blue' },
  { value: 'doctor', label: 'Bác sĩ', color: 'green' },
  { value: 'staff', label: 'Nhân viên', color: 'orange' },
  { value: 'manager', label: 'Quản lý', color: 'purple' }
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' }
];

// Helper functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const getRoleColor = (role: string): string => {
  const option = ROLE_OPTIONS.find(opt => opt.value === role);
  return option?.color || 'default';
};

const getRoleLabel = (role: string): string => {
  const option = ROLE_OPTIONS.find(opt => opt.value === role);
  return option?.label || role;
};

const formatErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Lỗi không xác định';
};

const UserManagementPage: React.FC = () => {
  // Core states
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<SystemStatistics['data'] | null>(null);
  
  // UI states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('customer');
  const [uploadedFile, setUploadedFile] = useState<UploadChangeParam['file'] | null>(null);
  
  // Email validation for customer only
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  
  // Form and pagination
  const [createForm] = Form.useForm();
  const [queryParams, setQueryParams] = useState<UserQueryParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: false,
    showQuickJumper: false,
    simple: false,
    size: 'default' as const
  });

  // API functions
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
      message.error('Lỗi khi tải danh sách người dùng: ' + formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

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

  const checkEmailAvailability = async (email: string) => {
    if (!email || !validateEmail(email) || selectedRole !== 'customer') {
      setEmailError('');
      return;
    }

    try {
      setCheckingEmail(true);
      const response = await authApi.checkEmail({ email });
      
      if (!response.data.available) {
        setEmailError('Email này đã được sử dụng!');
      } else {
        setEmailError('');
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra email:', error);
      setEmailError('Không thể kiểm tra email');
    } finally {
      setCheckingEmail(false);
    }
  };

  // Event handlers
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

    if (!Array.isArray(sorter) && sorter.field) {
      newParams.sortBy = sorter.field as string;
      newParams.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    setQueryParams(newParams);
  };

  const handleSearch = (value: string) => {
    setQueryParams(prev => ({
      ...prev,
      search: value || undefined,
      page: 1
    }));
  };

  const handleRoleFilter = (role: string) => {
    setQueryParams(prev => ({
      ...prev,
      role: role === 'all' ? undefined : role,
      page: 1
    }));
  };

  const handleViewUser = async (user: User) => {
    try {
      const response = await userApi.getUserById(user._id);
      if (response.success) {
        setSelectedUser(response.data.user);
        setIsDetailDrawerOpen(true);
      }
    } catch (error) {
      message.error('Lỗi khi tải thông tin người dùng: ' + formatErrorMessage(error));
    }
  };

  const handleCreateUser = () => {
    setSelectedRole('customer');
    createForm.resetFields();
    setEmailError('');
    setUploadedFile(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateRoleChange = (role: string) => {
    setSelectedRole(role);
    setEmailError(''); // Reset email error when role changes
    
    if (role !== 'doctor') {
      createForm.setFieldsValue({
        bio: undefined,
        experience: undefined,
        specialization: undefined,
        education: undefined,
        certificate: undefined
      });
      setUploadedFile(null);
    }
  };

  const handleCreateSubmit = async (values: CreateUserFormValues) => {
    try {
      setLoading(true);
      const { role, gender, personalEmail, ...userData } = values;

      const userRequestData: CreateUserRequest = {
        ...userData,
        personalEmail,
        password: 'auto-generated',
        gender: gender as 'male' | 'female' | 'other' | undefined,
        role: role as 'customer' | 'doctor' | 'staff' | 'manager' | 'admin'
      };

      if (role === 'doctor') {
        const { bio, experience, specialization, education } = values;
        Object.assign(userRequestData, {
          bio,
          experience,
          specialization,
          education
        });
      }
      
      const response = await userApi.createUser(userRequestData);
      
      if (response.success) {
        const actualSystemEmail = response.data.email;
        
        let successMessage = 'Tạo tài khoản thành công!';
        
        if (role === 'doctor') {
          successMessage = `Tạo tài khoản bác sĩ thành công!\nEmail hệ thống: ${actualSystemEmail}`;
        } else if (role !== 'customer') {
          successMessage = `Tạo tài khoản thành công!\nEmail hệ thống: ${actualSystemEmail}`;
        }
        
        message.success(successMessage, 5);
        setIsCreateModalOpen(false);
        createForm.resetFields();
        setEmailError('');
        setUploadedFile(null);
        fetchUsers();
        fetchStatistics();
      }
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        const errorMessage = axiosError.response?.data?.message || 'Lỗi không xác định';
        
        if (axiosError.response?.status === 409) {
          message.error(`Lỗi khi tạo tài khoản: ${errorMessage}`);
        } else if (axiosError.response?.status === 400) {
          message.error(`Lỗi khi tạo tài khoản: ${errorMessage}`);
        } else {
          message.error('Lỗi khi tạo tài khoản: ' + formatErrorMessage(error));
        }
      } else {
        message.error('Lỗi khi tạo tài khoản: ' + formatErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

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
      message.error('Lỗi khi thay đổi trạng thái: ' + formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Table columns configuration
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
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>
          {getRoleLabel(role)}
        </Tag>
      ),
      filters: ROLE_OPTIONS.slice(1).map(role => ({
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
        </Space>
      ),
      width: 100,
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
              {ROLE_OPTIONS.map(role => (
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
          pagination={false}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
        <CustomPagination
          current={pagination.current}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onChange={(page, pageSize) => {
            setPagination(prev => ({
              ...prev,
              current: page,
              pageSize: pageSize
            }));
            setQueryParams(prev => ({
              ...prev,
              page: page,
              limit: pageSize
            }));
          }}
          className="mt-4"
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
                {getRoleLabel(selectedUser.role)}
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

            {/* Doctor Profile */}
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

      {/* Create User Modal */}
      <Modal
        title="Tạo người dùng mới"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        width={800}
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
                  { type: 'email', message: 'Email không hợp lệ!' },
                  ...(selectedRole === 'customer' ? [{
                    validator: () => {
                      if (emailError) {
                        return Promise.reject(new Error(emailError));
                      }
                      return Promise.resolve();
                    }
                  }] : [])
                ]}
                hasFeedback={selectedRole === 'customer'}
                validateStatus={
                  selectedRole === 'customer' ? (
                    checkingEmail ? 'validating' : 
                    emailError ? 'error' : 
                    ''
                  ) : ''
                }
                help={
                  selectedRole === 'customer' ? (
                    checkingEmail ? 'Đang kiểm tra email...' :
                    emailError || undefined
                  ) : undefined
                }
              >
                <Input 
                  placeholder={selectedRole === 'customer' ? 'Nhập email...' : 'Nhập email cá nhân...'} 
                  onChange={(e) => {
                    if (selectedRole === 'customer') {
                      const value = e.target.value;
                      const timeoutId = setTimeout(() => {
                        checkEmailAvailability(value);
                      }, 800);
                      
                      return () => clearTimeout(timeoutId);
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Vai trò"
                name="role"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                initialValue="customer"
              >
                <Select onChange={handleCreateRoleChange}>
                  {ROLE_OPTIONS.slice(1).filter(role => role.value !== 'admin').map(role => (
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
                  {GENDER_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
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

          {/* Doctor-specific fields */}
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
                    label="Kinh nghiệm (Tối đa 50 năm)"
                    name="experience"
                    rules={[
                      { required: true, message: 'Vui lòng nhập kinh nghiệm!' },
                      {
                        validator: (_, value) => {
                          if (value === null || value === undefined || value === '') {
                            return Promise.resolve();
                          }
                          
                          const stringValue = String(value).trim();
                          
                          if (!/^\d+$/.test(stringValue)) {
                            return Promise.reject(new Error('Chỉ được nhập số!'));
                          }
                          
                          const numValue = Number(stringValue);
                          
                          if (numValue < 0) {
                            return Promise.reject(new Error('Kinh nghiệm không được âm!'));
                          }
                          
                          if (numValue > 50) {
                            return Promise.reject(new Error('Kinh nghiệm không được quá 50 năm!'));
                          }
                          
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input 
                      style={{ width: '100%' }} 
                      placeholder="Nhập số năm kinh nghiệm (0-50)"
                      maxLength={2}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const paste = e.clipboardData.getData('text');
                        if (!/^\d+$/.test(paste)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        e.target.value = value;
                        createForm.setFieldsValue({ experience: value ? Number(value) : undefined });
                      }}
                    />
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
                      setUploadedFile(info.file.originFileObj || info.file);
                    }
                  }}
                >
                  {uploadedFile ? (
                    <div>
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />
                      <div style={{ marginTop: 8, color: '#52c41a' }}>
                        Đã tải lên thành công
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {uploadedFile.name}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Tải lên chứng chỉ</div>
                    </div>
                  )}
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