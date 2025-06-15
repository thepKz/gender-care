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
  Popconfirm
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UserOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

// NOTE: MOCKDATA - Dữ liệu giả cho development
interface User {
  key: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'staff' | 'doctor' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin: string;
  avatar?: string;
}

const mockUsers: User[] = [
  {
    key: '1',
    id: 'USR001',
    name: 'Nguyễn Văn Admin',
    email: 'admin@genderhealthcare.com',
    phone: '0901234567',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-15',
    lastLogin: '2024-01-27 09:30',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
  },
  {
    key: '2',
    id: 'USR002',
    name: 'Trần Thị Manager',
    email: 'manager@genderhealthcare.com',
    phone: '0901234568',
    role: 'manager',
    status: 'active',
    createdAt: '2024-01-16',
    lastLogin: '2024-01-27 08:45',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b776?w=32&h=32&fit=crop&crop=face'
  },
  {
    key: '3',
    id: 'USR003',
    name: 'Lê Thị Staff',
    email: 'staff@genderhealthcare.com',
    phone: '0901234569',
    role: 'staff',
    status: 'active',
    createdAt: '2024-01-17',
    lastLogin: '2024-01-27 07:20',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face'
  },
  {
    key: '4',
    id: 'DOC001',
    name: 'Dr. Phạm Minh Tuấn',
    email: 'doctor1@genderhealthcare.com',
    phone: '0901234570',
    role: 'doctor',
    status: 'active',
    createdAt: '2024-01-18',
    lastLogin: '2024-01-27 06:15',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=32&h=32&fit=crop&crop=face'
  },
  {
    key: '5',
    id: 'CUS001',
    name: 'Hoàng Thị Lan',
    email: 'customer1@gmail.com',
    phone: '0901234571',
    role: 'customer',
    status: 'active',
    createdAt: '2024-01-19',
    lastLogin: '2024-01-26 20:30'
  },
  {
    key: '6',
    id: 'CUS002',
    name: 'Vũ Văn Nam',
    email: 'customer2@gmail.com',
    phone: '0901234572',
    role: 'customer',
    status: 'inactive',
    createdAt: '2024-01-20',
    lastLogin: '2024-01-25 15:45'
  }
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchText.toLowerCase()) ||
                         user.phone.includes(searchText);
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: User['role']) => {
    const colors = {
      admin: 'red',
      manager: 'orange',
      staff: 'blue',
      doctor: 'green',
      customer: 'default'
    };
    return colors[role];
  };

  const getRoleText = (role: User['role']) => {
    const texts = {
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      staff: 'Nhân viên',
      doctor: 'Bác sĩ',
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
      inactive: 'Không hoạt động',
      suspended: 'Tạm khóa'
    };
    return texts[status];
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleDelete = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      if (editingUser) {
        // Update existing user
        setUsers(users.map(user => 
          user.id === editingUser.id ? { ...user, ...values } : user
        ));
      } else {
        // Add new user
        const newUser: User = {
          key: Date.now().toString(),
          id: `USR${Date.now()}`,
          ...values,
          createdAt: new Date().toISOString().split('T')[0],
          lastLogin: 'Chưa đăng nhập'
        };
        setUsers([...users, newUser]);
      }
      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Người dùng',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar 
            src={record.avatar} 
            size={40}
            style={{ backgroundColor: '#667eea' }}
          >
            {!record.avatar && <UserOutlined />}
          </Avatar>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{record.id}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Liên hệ',
      dataIndex: 'email',
      key: 'contact',
      render: (email: string, record: User) => (
        <div>
          <div style={{ fontSize: '13px' }}>{email}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>{record.phone}</div>
        </div>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
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
      render: (status: User['status']) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <span style={{ fontSize: '13px' }}>{date}</span>
      )
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (date: string) => (
        <span style={{ fontSize: '13px' }}>{date}</span>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record: User) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button type="text" icon={<EyeOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa người dùng này?"
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

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Quản lý người dùng
        </Title>
        <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
          NOTE: MOCKDATA - Quản lý tất cả người dùng trong hệ thống
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
            <Input
              placeholder="Tìm kiếm người dùng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ width: 150 }}
            >
              <Option value="all">Tất cả vai trò</Option>
              <Option value="admin">Quản trị viên</Option>
              <Option value="manager">Quản lý</Option>
              <Option value="staff">Nhân viên</Option>
              <Option value="doctor">Bác sĩ</Option>
              <Option value="customer">Khách hàng</Option>
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
            Thêm người dùng
          </Button>
        </div>

        {/* Table */}
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

      {/* Add/Edit Modal */}
      <Modal
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
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
            <Input />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select>
              <Option value="admin">Quản trị viên</Option>
              <Option value="manager">Quản lý</Option>
              <Option value="staff">Nhân viên</Option>
              <Option value="doctor">Bác sĩ</Option>
              <Option value="customer">Khách hàng</Option>
            </Select>
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

export default UserManagement;