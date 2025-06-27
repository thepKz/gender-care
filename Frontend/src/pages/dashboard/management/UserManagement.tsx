import React, { useState, useEffect } from 'react';
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
  Tooltip,
  message,
  Avatar
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { userApi, User as ApiUser, CreateUserRequest } from '../../../api/endpoints/userApi';
import { 
  canCreateUser, 
  getCurrentUserRole 
} from '../../../utils/permissions';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface User {
  key: string;
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: 'admin' | 'manager' | 'doctor' | 'staff' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  emailVerified: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditRoleModalVisible, setIsEditRoleModalVisible] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Fixed page size

  const [form] = Form.useForm();
  const [editRoleForm] = Form.useForm();
  
  // Get current user role for permissions
  const userRole = getCurrentUserRole();

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await userApi.getAllUsers({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      if (response.success) {
        // Convert API user format to component format
        const convertedUsers = response.data.users.map((user: ApiUser) => ({
          key: user._id,
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phone || '',
          role: user.role,
          status: (user.isActive ? 'active' : 'inactive') as 'active' | 'inactive',
          emailVerified: user.emailVerified || false,
          lastLogin: user.updatedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }));
        setUsers(convertedUsers);
      }
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { status?: number; data?: { message?: string } } };
      message.error(error?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchText.toLowerCase()) ||
                         user.phoneNumber.toLowerCase().includes(searchText.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: User['role']) => {
    const colors = {
      admin: 'red',
      manager: 'orange',
      doctor: 'blue',
      staff: 'green',
      customer: 'default'
    };
    return colors[role];
  };

  const getRoleText = (role: User['role']) => {
    const texts = {
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      doctor: 'Bác sĩ',
      staff: 'Nhân viên',
      customer: 'Khách hàng'
    };
    return texts[role];
  };

  const getStatusColor = (status: User['status']) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      suspended: 'error'
    };
    return colors[status];
  };

  const getStatusText = (status: User['status']) => {
    const texts = {
      active: 'Hoạt động',
      inactive: 'Tạm dừng',
      suspended: 'Bị khóa'
    };
    return texts[status];
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      const action = currentStatus === 'active' ? 'khóa' : 'mở khóa';
      await userApi.toggleUserStatus(userId, {
        reason: `${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản từ quản lý`
      });
      message.success(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công`);
      loadData();
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { status?: number; data?: { message?: string } } };
      message.error(error?.message || 'Không thể thay đổi trạng thái tài khoản');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Tạo user mới với thông tin tối thiểu, hệ thống sẽ tự tạo password và gửi email
      const createData: CreateUserRequest = {
        email: values.email,
        fullName: values.fullName,
        role: values.role,
        password: '', // Backend sẽ tự generate
        phone: '', // Không bắt buộc
        gender: 'other', // Default
        address: '' // Không bắt buộc
      };
      
      await userApi.createUser(createData);
      message.success('Tạo người dùng thành công! Thông tin tài khoản đã được gửi qua email.');
      
      setIsModalVisible(false);
      form.resetFields();
      loadData();
    } catch (err: unknown) {
      const error = err as { 
        message?: string; 
        response?: { 
          status?: number; 
          data?: { 
            message?: string;
            success?: boolean;
          } 
        } 
      };
      
      let errorMessage = 'Có lỗi xảy ra khi tạo người dùng';
      
      if (error?.response?.status === 409) {
        errorMessage = error?.response?.data?.message || 'Email này đã tồn tại trong hệ thống';
      } else if (error?.response?.status === 403) {
        errorMessage = error?.response?.data?.message || 'Bạn không có quyền tạo loại tài khoản này';
      } else if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.message || 'Thông tin không hợp lệ';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleEditRole = (user: User) => {
    setSelectedUserForEdit(user);
    editRoleForm.setFieldsValue({
      currentRole: user.role,
      newRole: user.role
    });
    setIsEditRoleModalVisible(true);
  };

  const handleUpdateRole = async () => {
    try {
      const values = await editRoleForm.validateFields();
      
      if (!selectedUserForEdit) return;
      
      if (values.newRole === values.currentRole) {
        message.warning('Vai trò mới phải khác với vai trò hiện tại');
        return;
      }
      
      await userApi.updateUserRole(selectedUserForEdit.id, {
        newRole: values.newRole,
        reason: `Thay đổi vai trò từ ${getRoleText(values.currentRole as User['role'])} thành ${getRoleText(values.newRole as User['role'])}`
      });
      
      message.success('Cập nhật vai trò thành công');
      setIsEditRoleModalVisible(false);
      editRoleForm.resetFields();
      setSelectedUserForEdit(null);
      loadData();
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { status?: number; data?: { message?: string } } };
      message.error(error?.message || 'Không thể cập nhật vai trò');
    }
  };

  const handleEditRoleModalCancel = () => {
    setIsEditRoleModalVisible(false);
    editRoleForm.resetFields();
    setSelectedUserForEdit(null);
  };



  const showUserDetails = (user: User) => {
    Modal.info({
      title: 'Chi tiết người dùng',
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <Text strong>ID người dùng: </Text>
            <Text code style={{ fontSize: '12px' }}>{user.id}</Text>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text strong>Họ tên: </Text>
            <Text>{user.fullName}</Text>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text strong>Email: </Text>
            <Text>{user.email}</Text>
            <Tag color={user.emailVerified ? 'success' : 'warning'} style={{ marginLeft: 8 }}>
              {user.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
            </Tag>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text strong>Số điện thoại: </Text>
            <Text>{user.phoneNumber}</Text>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text strong>Vai trò: </Text>
            <Tag color={getRoleColor(user.role)}>{getRoleText(user.role)}</Tag>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text strong>Trạng thái: </Text>
            <Tag color={getStatusColor(user.status)}>{getStatusText(user.status)}</Tag>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text strong>Ngày tạo: </Text>
            <Text>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</Text>
          </div>
          <div>
            <Text strong>Cập nhật: </Text>
            <Text>{new Date(user.updatedAt).toLocaleDateString('vi-VN')}</Text>
          </div>
        </div>
      ),
    });
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Người dùng',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 200,
      render: (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar icon={<UserOutlined />} />
          <div>
            <Text strong>{text}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Email & Liên hệ',
      dataIndex: 'email',
      key: 'email',
      width: 280,
      render: (email: string, record: User) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <MailOutlined style={{ color: '#1890ff' }} />
            <Text style={{ fontSize: '13px' }}>{email}</Text>
            {record.emailVerified ? (
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
            ) : (
              <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '14px' }} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PhoneOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: '13px' }}>{record.phoneNumber}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      align: 'center',
      render: (role: User['role']) => (
        <Tag color={getRoleColor(role)}>
          {getRoleText(role)}
        </Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status: User['status']) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      align: 'center',
      render: (_, record: User) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => showUserDetails(record)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa vai trò">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditRole(record)}
              style={{ color: '#fa8c16' }}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
            <Button 
              type="text" 
              icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => handleToggleStatus(record.id, record.status)}
              style={{ 
                color: record.status === 'active' ? '#ff4d4f' : '#52c41a',
                fontSize: '16px'
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Card 
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: 'none'
        }}
      >
        <div style={{ 
          marginBottom: 24, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingBottom: '16px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={3} style={{ 
            margin: 0, 
            display: 'flex', 
            alignItems: 'center',
            color: '#1890ff'
          }}>
            <UserOutlined style={{ marginRight: 12, fontSize: '24px' }} />
            Quản lý người dùng
          </Title>
          {canCreateUser(userRole) && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
              size="large"
              style={{
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)'
              }}
            >
              Thêm người dùng mới
            </Button>
          )}
        </div>

        <div style={{ 
          marginBottom: 24, 
          display: 'flex', 
          gap: 16, 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <Search
            placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
            allowClear
            style={{ width: 350 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="large"
          />
          
          <Select
            placeholder="Vai trò"
            style={{ width: 160 }}
            value={selectedRole}
            onChange={setSelectedRole}
            size="large"
          >
            <Option value="all">Tất cả vai trò</Option>
            <Option value="admin">Quản trị viên</Option>
            <Option value="manager">Quản lý</Option>
            <Option value="doctor">Bác sĩ</Option>
            <Option value="staff">Nhân viên</Option>
            <Option value="customer">Khách hàng</Option>
          </Select>

          <Select
            placeholder="Trạng thái"
            style={{ width: 160 }}
            value={selectedStatus}
            onChange={setSelectedStatus}
            size="large"
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="active">Hoạt động</Option>
            <Option value="suspended">Bị khóa</Option>
          </Select>
        </div>

        <div>
          <Table
            columns={columns}
            dataSource={filteredUsers}
            loading={loading}
            size="middle"
            pagination={false}
            scroll={{ x: 1000 }}
            bordered
            style={{
              backgroundColor: 'white',
              borderRadius: '8px'
            }}
          />
          
          {/* Custom Pagination giống hệt ảnh */}
          {filteredUsers.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '20px',
              padding: '16px 0',
              gap: '4px'
            }}>
              {/* Prev Button */}
              <span 
                onClick={() => {
                  const totalPages = Math.ceil(filteredUsers.length / pageSize);
                  if (currentPage > 1 && totalPages > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
                style={{ 
                  color: (currentPage > 1 && Math.ceil(filteredUsers.length / pageSize) > 1) ? '#999' : '#ccc',
                  fontSize: '14px',
                  cursor: (currentPage > 1 && Math.ceil(filteredUsers.length / pageSize) > 1) ? 'pointer' : 'not-allowed',
                  userSelect: 'none',
                  padding: '8px 12px'
                }}
              >
                ‹‹ Prev.
              </span>
              
              {/* Page Numbers */}
              {(() => {
                const totalPages = Math.ceil(filteredUsers.length / pageSize);
                const pages = [];
                
                // Logic để hiển thị pages như trong ảnh
                if (totalPages <= 7) {
                  // Nếu ít hơn hoặc bằng 7 trang, hiển thị tất cả
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Luôn hiển thị trang 1
                  pages.push(1);
                  
                  if (currentPage <= 4) {
                    // Hiển thị 1,2,3,4,5,6,7,...,last
                    for (let i = 2; i <= 7; i++) {
                      pages.push(i);
                    }
                    pages.push('...');
                    pages.push(totalPages);
                  } else if (currentPage >= totalPages - 3) {
                    // Hiển thị 1,...,last-6,last-5,last-4,last-3,last-2,last-1,last
                    pages.push('...');
                    for (let i = totalPages - 6; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Hiển thị 1,...,current-1,current,current+1,...,last
                    pages.push('...');
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                      pages.push(i);
                    }
                    pages.push('...');
                    pages.push(totalPages);
                  }
                }
                
                return pages.map((page, index) => {
                  if (page === '...') {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        style={{
                          padding: '8px 12px',
                          color: '#999',
                          fontSize: '14px'
                        }}
                      >
                        ...
                      </span>
                    );
                  }
                  
                  const isActive = page === currentPage;
                  const totalPages = Math.ceil(filteredUsers.length / pageSize);
                  const isClickable = totalPages > 1;
                  
                  return (
                    <span
                      key={page}
                      onClick={() => isClickable && setCurrentPage(page as number)}
                      style={{
                        display: 'inline-block',
                        minWidth: '32px',
                        height: '32px',
                        lineHeight: '30px',
                        textAlign: 'center',
                        fontSize: '14px',
                        cursor: isClickable ? 'pointer' : 'default',
                        border: '1px solid #d9d9d9',
                        borderRadius: '2px',
                        margin: '0 2px',
                        backgroundColor: isActive ? '#1890ff' : '#fff',
                        color: isActive ? '#fff' : '#262626',
                        fontWeight: isActive ? '500' : '400',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive && isClickable) {
                          e.currentTarget.style.borderColor = '#1890ff';
                          e.currentTarget.style.color = '#1890ff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive && isClickable) {
                          e.currentTarget.style.borderColor = '#d9d9d9';
                          e.currentTarget.style.color = '#262626';
                        }
                      }}
                    >
                      {page}
                    </span>
                  );
                });
              })()}
              
              {/* Next Button */}
              <span 
                onClick={() => {
                  const totalPages = Math.ceil(filteredUsers.length / pageSize);
                  if (currentPage < totalPages && totalPages > 1) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
                style={{ 
                  color: (currentPage < Math.ceil(filteredUsers.length / pageSize) && Math.ceil(filteredUsers.length / pageSize) > 1) ? '#999' : '#ccc',
                  fontSize: '14px',
                  cursor: (currentPage < Math.ceil(filteredUsers.length / pageSize) && Math.ceil(filteredUsers.length / pageSize) > 1) ? 'pointer' : 'not-allowed',
                  userSelect: 'none',
                  padding: '8px 12px'
                }}
              >
                Next ››
              </span>
            </div>
          )}
        </div>
      </Card>

      <Modal
        title="Thêm người dùng mới"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText="Tạo và gửi email"
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              placeholder="Nhập địa chỉ email" 
              prefix={<MailOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input 
              placeholder="Nhập họ tên đầy đủ" 
              prefix={<UserOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select placeholder="Chọn vai trò">
              <Option value="manager">Quản lý</Option>
              <Option value="doctor">Bác sĩ</Option>
              <Option value="staff">Nhân viên</Option>
              <Option value="customer">Khách hàng</Option>
            </Select>
          </Form.Item>
          
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            backgroundColor: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: 6 
          }}>
            <Text style={{ color: '#52c41a', fontSize: '13px' }}>
              Mật khẩu sẽ được tự động tạo và gửi qua email cho người dùng
            </Text>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Chỉnh sửa vai trò người dùng"
        open={isEditRoleModalVisible}
        onOk={handleUpdateRole}
        onCancel={handleEditRoleModalCancel}
        width={500}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <Form
          form={editRoleForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          {selectedUserForEdit && (
            <div style={{ 
              marginBottom: 16, 
              padding: 12, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 8 
            }}>
              <Text strong>Người dùng: </Text>
              <Text>{selectedUserForEdit.fullName}</Text>
              <br />
              <Text strong>Email: </Text>
              <Text>{selectedUserForEdit.email}</Text>
            </div>
          )}

          <Form.Item
            name="currentRole"
            label="Vai trò hiện tại"
          >
            <Select disabled>
              <Option value="admin">Quản trị viên</Option>
              <Option value="manager">Quản lý</Option>
              <Option value="doctor">Bác sĩ</Option>
              <Option value="staff">Nhân viên</Option>
              <Option value="customer">Khách hàng</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="newRole"
            label="Vai trò mới"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò mới!' }]}
          >
            <Select placeholder="Chọn vai trò mới">
              <Option value="manager">Quản lý</Option>
              <Option value="doctor">Bác sĩ</Option>
              <Option value="staff">Nhân viên</Option>
              <Option value="customer">Khách hàng</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;