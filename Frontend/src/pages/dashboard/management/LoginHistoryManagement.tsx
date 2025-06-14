import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Typography,
  Tooltip,
  DatePicker,
  Avatar,
  Modal,
  Descriptions
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  EyeOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  DesktopOutlined,
  MobileOutlined,
  TabletOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// NOTE: MOCKDATA - Dữ liệu giả dựa trên ERD LoginHistory
interface LoginHistory {
  key: string;
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  ipAddress: string;
  userAgent: string;
  loginAt: string;
  status: 'success' | 'failed';
  failReason?: string;
  location?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
}

const mockLoginHistory: LoginHistory[] = [
  {
    key: '1',
    _id: 'LH001',
    userId: 'USR001',
    userName: 'Nguyễn Văn Admin',
    userEmail: 'admin@genderhealthcare.com',
    userRole: 'admin',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    loginAt: '2024-01-27 09:30:15',
    status: 'success',
    location: 'Hồ Chí Minh, Việt Nam',
    deviceType: 'desktop',
    browser: 'Chrome 120',
    os: 'Windows 10'
  },
  {
    key: '2',
    _id: 'LH002',
    userId: 'USR002',
    userName: 'Trần Thị Manager',
    userEmail: 'manager@genderhealthcare.com',
    userRole: 'manager',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    loginAt: '2024-01-27 08:45:22',
    status: 'success',
    location: 'Hà Nội, Việt Nam',
    deviceType: 'desktop',
    browser: 'Chrome 120',
    os: 'macOS 10.15'
  },
  {
    key: '3',
    _id: 'LH003',
    userId: 'USR003',
    userName: 'Lê Thị Staff',
    userEmail: 'staff@genderhealthcare.com',
    userRole: 'staff',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    loginAt: '2024-01-27 07:20:45',
    status: 'success',
    location: 'Đà Nẵng, Việt Nam',
    deviceType: 'mobile',
    browser: 'Safari 17',
    os: 'iOS 17'
  },
  {
    key: '4',
    _id: 'LH004',
    userId: 'DOC001',
    userName: 'Dr. Nguyễn Thị Hương',
    userEmail: 'huong.nguyen@genderhealthcare.com',
    userRole: 'doctor',
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    loginAt: '2024-01-27 06:15:30',
    status: 'success',
    location: 'Hồ Chí Minh, Việt Nam',
    deviceType: 'desktop',
    browser: 'Firefox 121',
    os: 'Windows 10'
  },
  {
    key: '5',
    _id: 'LH005',
    userId: 'CUS001',
    userName: 'Hoàng Thị Lan',
    userEmail: 'customer1@gmail.com',
    userRole: 'customer',
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    loginAt: '2024-01-26 20:30:12',
    status: 'failed',
    failReason: 'Sai mật khẩu',
    location: 'Cần Thơ, Việt Nam',
    deviceType: 'desktop',
    browser: 'Chrome 120',
    os: 'Linux'
  },
  {
    key: '6',
    _id: 'LH006',
    userId: 'CUS002',
    userName: 'Vũ Văn Nam',
    userEmail: 'customer2@gmail.com',
    userRole: 'customer',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    loginAt: '2024-01-26 15:45:18',
    status: 'failed',
    failReason: 'Tài khoản bị khóa',
    location: 'Hải Phòng, Việt Nam',
    deviceType: 'tablet',
    browser: 'Safari 17',
    os: 'iPadOS 17'
  },
  {
    key: '7',
    _id: 'LH007',
    userId: 'USR001',
    userName: 'Nguyễn Văn Admin',
    userEmail: 'admin@genderhealthcare.com',
    userRole: 'admin',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    loginAt: '2024-01-26 14:20:33',
    status: 'success',
    location: 'Hồ Chí Minh, Việt Nam',
    deviceType: 'desktop',
    browser: 'Chrome 120',
    os: 'Windows 10'
  }
];

const LoginHistoryManagement: React.FC = () => {
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>(mockLoginHistory);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // Filter login history based on search and filters
  const filteredHistory = loginHistory.filter(record => {
    const matchesSearch = record.userName.toLowerCase().includes(searchText.toLowerCase()) ||
                         record.userEmail.toLowerCase().includes(searchText.toLowerCase()) ||
                         record.ipAddress.includes(searchText);
    const matchesRole = selectedRole === 'all' || record.userRole === selectedRole;
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    const matchesDevice = selectedDevice === 'all' || record.deviceType === selectedDevice;
    
    let matchesDate = true;
    if (dateRange) {
      const recordDate = dayjs(record.loginAt);
      matchesDate = recordDate.isAfter(dateRange[0].startOf('day')) && 
                   recordDate.isBefore(dateRange[1].endOf('day'));
    }
    
    return matchesSearch && matchesRole && matchesStatus && matchesDevice && matchesDate;
  });

  const getStatusColor = (status: LoginHistory['status']) => {
    return status === 'success' ? 'success' : 'error';
  };

  const getStatusText = (status: LoginHistory['status']) => {
    return status === 'success' ? 'Thành công' : 'Thất bại';
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'red',
      manager: 'orange',
      staff: 'blue',
      doctor: 'green',
      customer: 'default'
    };
    return colors[role as keyof typeof colors] || 'default';
  };

  const getRoleText = (role: string) => {
    const texts = {
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      staff: 'Nhân viên',
      doctor: 'Bác sĩ',
      customer: 'Khách hàng'
    };
    return texts[role as keyof typeof texts] || role;
  };

  const getDeviceIcon = (deviceType: LoginHistory['deviceType']) => {
    switch (deviceType) {
      case 'desktop':
        return <DesktopOutlined />;
      case 'mobile':
        return <MobileOutlined />;
      case 'tablet':
        return <TabletOutlined />;
      default:
        return <DesktopOutlined />;
    }
  };

  const getDeviceColor = (deviceType: LoginHistory['deviceType']) => {
    const colors = {
      desktop: 'blue',
      mobile: 'green',
      tablet: 'orange'
    };
    return colors[deviceType];
  };

  const showLoginDetails = (record: LoginHistory) => {
    Modal.info({
      title: 'Chi tiết đăng nhập',
      width: 700,
      content: (
        <div style={{ marginTop: '16px' }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="ID" span={2}>
              <Text code>{record._id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Người dùng">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar icon={<UserOutlined />} size="small" />
                {record.userName}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {record.userEmail}
            </Descriptions.Item>
            <Descriptions.Item label="Vai trò" span={2}>
              <Tag color={getRoleColor(record.userRole)}>
                {getRoleText(record.userRole)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian đăng nhập" span={2}>
              <HistoryOutlined style={{ marginRight: '4px' }} />
              {record.loginAt}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag 
                color={getStatusColor(record.status)}
                icon={record.status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              >
                {getStatusText(record.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Lý do thất bại">
              {record.failReason || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ IP">
              <Text code>{record.ipAddress}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Vị trí">
              <EnvironmentOutlined style={{ marginRight: '4px' }} />
              {record.location || 'Không xác định'}
            </Descriptions.Item>
            <Descriptions.Item label="Thiết bị" span={2}>
              <Tag color={getDeviceColor(record.deviceType)} icon={getDeviceIcon(record.deviceType)}>
                {record.deviceType.charAt(0).toUpperCase() + record.deviceType.slice(1)}
              </Tag>
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                {record.browser} trên {record.os}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="User Agent" span={2}>
              <Text style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                {record.userAgent}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </div>
      ),
    });
  };

  const columns: ColumnsType<LoginHistory> = [
    {
      title: 'Người dùng',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Avatar icon={<UserOutlined />} size="small" />
            <Text strong style={{ fontSize: '14px' }}>{record.userName}</Text>
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {record.userEmail}
          </div>
          <Tag color={getRoleColor(record.userRole)} size="small" style={{ marginTop: '2px' }}>
            {getRoleText(record.userRole)}
          </Tag>
        </div>
      )
    },
    {
      title: 'Thời gian',
      dataIndex: 'loginAt',
      key: 'loginAt',
      width: 150,
      render: (loginAt: string) => (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
            {dayjs(loginAt).format('DD/MM/YYYY')}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {dayjs(loginAt).format('HH:mm:ss')}
          </div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.loginAt).unix() - dayjs(b.loginAt).unix(),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: LoginHistory['status'], record) => (
        <div>
          <Tag 
            color={getStatusColor(status)}
            icon={status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          >
            {getStatusText(status)}
          </Tag>
          {record.failReason && (
            <div style={{ fontSize: '11px', color: '#ff4d4f', marginTop: '2px' }}>
              {record.failReason}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Thiết bị',
      key: 'device',
      width: 150,
      render: (_, record) => (
        <div>
          <Tag color={getDeviceColor(record.deviceType)} icon={getDeviceIcon(record.deviceType)}>
            {record.deviceType.charAt(0).toUpperCase() + record.deviceType.slice(1)}
          </Tag>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
            {record.browser}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            {record.os}
          </div>
        </div>
      )
    },
    {
      title: 'IP & Vị trí',
      key: 'location',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '13px', fontFamily: 'monospace' }}>
            {record.ipAddress}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            <EnvironmentOutlined style={{ marginRight: '4px' }} />
            {record.location || 'Không xác định'}
          </div>
        </div>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => showLoginDetails(record)}
          />
        </Tooltip>
      )
    }
  ];

  // Statistics
  const totalLogins = loginHistory.length;
  const successfulLogins = loginHistory.filter(record => record.status === 'success').length;
  const failedLogins = loginHistory.filter(record => record.status === 'failed').length;
  const successRate = totalLogins > 0 ? ((successfulLogins / totalLogins) * 100).toFixed(1) : '0';

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Lịch sử đăng nhập
        </Title>
        <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
          NOTE: MOCKDATA - Theo dõi và quản lý lịch sử đăng nhập của người dùng
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{ marginBottom: '24px' }}>
        <Space size="large">
          <Card size="small" style={{ minWidth: '150px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {totalLogins}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Tổng lượt đăng nhập</div>
            </div>
          </Card>
          <Card size="small" style={{ minWidth: '150px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {successfulLogins}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Thành công</div>
            </div>
          </Card>
          <Card size="small" style={{ minWidth: '150px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {failedLogins}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Thất bại</div>
            </div>
          </Card>
          <Card size="small" style={{ minWidth: '150px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                {successRate}%
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Tỷ lệ thành công</div>
            </div>
          </Card>
        </Space>
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
          <Space wrap>
            <Search
              placeholder="Tìm kiếm người dùng, email, IP..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ width: 130 }}
            >
              <Option value="all">Tất cả vai trò</Option>
              <Option value="admin">Admin</Option>
              <Option value="manager">Manager</Option>
              <Option value="staff">Staff</Option>
              <Option value="doctor">Doctor</Option>
              <Option value="customer">Customer</Option>
            </Select>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 130 }}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="success">Thành công</Option>
              <Option value="failed">Thất bại</Option>
            </Select>
            <Select
              value={selectedDevice}
              onChange={setSelectedDevice}
              style={{ width: 130 }}
            >
              <Option value="all">Tất cả thiết bị</Option>
              <Option value="desktop">Desktop</Option>
              <Option value="mobile">Mobile</Option>
              <Option value="tablet">Tablet</Option>
            </Select>
            <RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: 250 }}
            />
          </Space>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredHistory}
          loading={loading}
          pagination={{
            total: filteredHistory.length,
            pageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} bản ghi`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default LoginHistoryManagement;