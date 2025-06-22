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
  Popconfirm,
  message,
  Avatar
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { userApi, User as ApiUser } from '../../../api/endpoints';
import { CreateUserRequest } from '../../../types';
import { 
  canCreateUser, 
  canUpdateUser, 
  canDeleteUser, 
  getCurrentUserRole 
} from '../../../utils/permissions';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface User {
  key: string;
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: 'admin' | 'manager' | 'doctor' | 'staff' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
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
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  
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
          username: user.email.split('@')[0], // Generate username from email
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phone || '',
          role: user.role,
          status: (user.isActive ? 'active' : 'inactive') as 'active' | 'inactive',
          lastLogin: user.updatedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }));
        setUsers(convertedUsers);
      }
    } catch (err: any) {
      message.error(err?.message || 'Không thể tải danh sách người dùng');
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
                         user.username.toLowerCase().includes(searchText.toLowerCase());
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

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleDelete = async (userId: string) => {
    try {
      await userApi.deleteUser(userId, {
        reason: 'Xóa từ quản lý',
        hardDelete: false
      });
      message.success('Xóa người dùng thành công');
      loadData();
    } catch (err: any) {
      message.error(err?.message || 'Không thể xóa người dùng');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        // Update user logic here
        message.success('Cập nhật người dùng thành công');
      } else {
        // Filter out 'guest' role if it exists and cast to API-compatible type
        const role = values.role === 'guest' ? 'customer' : values.role;
        
        const createData: import('../../../api/endpoints/userApi').CreateUserRequest = {
          email: values.email,
          password: values.password,
          fullName: values.fullName,
          phone: values.phone,
          role: role,
          gender: values.gender,
          address: values.address
        };
        await userApi.createUser(createData);
        message.success('Tạo người dùng thành công');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingUser(null);
      loadData();
    } catch (err: any) {
      message.error(err?.message || 'Có lỗi xảy ra');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingUser(null);
  };

  const showUserDetails = (user: User) => {
    Modal.info({
      title: 'Chi tiết người dùng',
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Tên đăng nhập:</strong> {user.username}</p>
          <p><strong>Họ tên:</strong> {user.fullName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Số điện thoại:</strong> {user.phoneNumber}</p>
          <p><strong>Vai trò:</strong> {getRoleText(user.role)}</p>
          <p><strong>Trạng thái:</strong> {getStatusText(user.status)}</p>
          <p><strong>Đăng nhập cuối:</strong> {new Date(user.lastLogin).toLocaleString('vi-VN')}</p>
          <p><strong>Ngày tạo:</strong> {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
          <p><strong>Cập nhật:</strong> {new Date(user.updatedAt).toLocaleDateString('vi-VN')}</p>
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
      render: (text: string, record: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar icon={<UserOutlined />} />
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              @{record.username}
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
      render: (email: string, record: User) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <MailOutlined style={{ color: '#1890ff' }} />
            <Text style={{ fontSize: '12px' }}>{email}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PhoneOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: '12px' }}>{record.phoneNumber}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 120,
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
      render: (status: User['status']) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150,
      render: (date: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          <Text style={{ fontSize: '12px' }}>
            {new Date(date).toLocaleDateString('vi-VN')}
          </Text>
        </div>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record: User) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => showUserDetails(record)}
            />
          </Tooltip>
          {canUpdateUser(userRole) && (
            <Tooltip title="Chỉnh sửa">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {canDeleteUser(userRole) && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa người dùng này?"
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
            <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Quản lý người dùng
          </Title>
          {canCreateUser(userRole) && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              Thêm người dùng mới
            </Button>
          )}
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Search
            placeholder="Tìm kiếm theo tên, email hoặc username..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          
          <Select
            placeholder="Vai trò"
            style={{ width: 150 }}
            value={selectedRole}
            onChange={setSelectedRole}
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
          dataSource={filteredUsers}
          loading={loading}
          pagination={{
            total: filteredUsers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} người dùng`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText={editingUser ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input placeholder="Nhập tên đăng nhập" />
          </Form.Item>

          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input placeholder="Nhập họ tên đầy đủ" />
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
            name="phoneNumber"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select placeholder="Chọn vai trò">
              <Option value="admin">Quản trị viên</Option>
              <Option value="manager">Quản lý</Option>
              <Option value="doctor">Bác sĩ</Option>
              <Option value="staff">Nhân viên</Option>
              <Option value="customer">Khách hàng</Option>
            </Select>
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

export default UserManagement;