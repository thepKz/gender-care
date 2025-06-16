import React, { useState, useEffect } from 'react';
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
  message
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  HistoryOutlined,
  UserOutlined,
  DesktopOutlined,
  MobileOutlined,
  TabletOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
// Note: No specific loginHistory API endpoint available, will use userApi for related data
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface LoginHistory {
  key: string;
  id: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  loginTime: string;
  logoutTime?: string;
  ipAddress: string;
  userAgent: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  location: string;
  status: 'active' | 'logged-out' | 'expired';
  sessionDuration?: number;
}

const LoginHistoryManagement: React.FC = () => {
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Implement API when backend is ready
      // For now, use mock data
      const mockData: LoginHistory[] = [
        {
          key: '1',
          id: '1',
          userId: 'user1',
          username: 'admin',
          fullName: 'Nguyễn Văn Admin',
          email: 'admin@example.com',
          loginTime: new Date().toISOString(),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          deviceType: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
          location: 'Hà Nội, Việt Nam',
          status: 'active'
        },
        {
          key: '2',
          id: '2',
          userId: 'user2',
          username: 'manager',
          fullName: 'Trần Thị Manager',
          email: 'manager@example.com',
          loginTime: new Date(Date.now() - 3600000).toISOString(),
          logoutTime: new Date().toISOString(),
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
          deviceType: 'mobile',
          browser: 'Safari',
          os: 'iOS',
          location: 'Hồ Chí Minh, Việt Nam',
          status: 'logged-out',
          sessionDuration: 60
        }
      ];
      setLoginHistory(mockData);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể tải lịch sử đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredHistory = loginHistory.filter(record => {
    const matchesSearch = record.username.toLowerCase().includes(searchText.toLowerCase()) ||
                         record.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
                         record.email.toLowerCase().includes(searchText.toLowerCase()) ||
                         record.ipAddress.includes(searchText);
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    const matchesDevice = selectedDevice === 'all' || record.deviceType === selectedDevice;
    
    let matchesDate = true;
    if (dateRange) {
      const loginDate = dayjs(record.loginTime);
      matchesDate = loginDate.isAfter(dateRange[0]) && loginDate.isBefore(dateRange[1]);
    }
    
    return matchesSearch && matchesStatus && matchesDevice && matchesDate;
  });

  const getStatusColor = (status: LoginHistory['status']) => {
    const colors = {
      active: 'green',
      'logged-out': 'blue',
      expired: 'orange'
    };
    return colors[status];
  };

  const getStatusText = (status: LoginHistory['status']) => {
    const texts = {
      active: 'Đang hoạt động',
      'logged-out': 'Đã đăng xuất',
      expired: 'Hết hạn'
    };
    return texts[status];
  };

  const getDeviceIcon = (deviceType: LoginHistory['deviceType']) => {
    const icons = {
      desktop: <DesktopOutlined />,
      mobile: <MobileOutlined />,
      tablet: <TabletOutlined />
    };
    return icons[deviceType];
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const columns: ColumnsType<LoginHistory> = [
    {
      title: 'Người dùng',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 200,
      render: (text: string, record: LoginHistory) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ color: '#1890ff' }} />
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              @{record.username}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Thời gian đăng nhập',
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 150,
      render: (time: string) => (
        <div>
          <Text style={{ fontSize: '12px' }}>
            {new Date(time).toLocaleDateString('vi-VN')}
          </Text>
          <br />
          <Text style={{ fontSize: '12px', fontWeight: 'bold' }}>
            {new Date(time).toLocaleTimeString('vi-VN')}
          </Text>
        </div>
      ),
      sorter: (a, b) => new Date(a.loginTime).getTime() - new Date(b.loginTime).getTime()
    },
    {
      title: 'Thời gian đăng xuất',
      dataIndex: 'logoutTime',
      key: 'logoutTime',
      width: 150,
      render: (time?: string) => (
        time ? (
          <div>
            <Text style={{ fontSize: '12px' }}>
              {new Date(time).toLocaleDateString('vi-VN')}
            </Text>
            <br />
            <Text style={{ fontSize: '12px', fontWeight: 'bold' }}>
              {new Date(time).toLocaleTimeString('vi-VN')}
            </Text>
          </div>
        ) : (
          <Text type="secondary">Chưa đăng xuất</Text>
        )
      )
    },
    {
      title: 'Thiết bị & Trình duyệt',
      dataIndex: 'deviceType',
      key: 'deviceType',
      width: 180,
      render: (deviceType: LoginHistory['deviceType'], record: LoginHistory) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            {getDeviceIcon(deviceType)}
            <Text style={{ fontSize: '12px' }}>{record.browser}</Text>
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.os}
          </Text>
        </div>
      )
    },
    {
      title: 'IP & Vị trí',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 150,
      render: (ip: string, record: LoginHistory) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <GlobalOutlined style={{ color: '#52c41a' }} />
            <Text code style={{ fontSize: '12px' }}>{ip}</Text>
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.location}
          </Text>
        </div>
      )
    },
    {
      title: 'Thời lượng',
      dataIndex: 'sessionDuration',
      key: 'sessionDuration',
      width: 100,
      render: (duration?: number) => (
        <Text style={{ fontSize: '12px' }}>
          {formatDuration(duration)}
        </Text>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: LoginHistory['status']) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_, record: LoginHistory) => (
        <Tooltip title="Xem chi tiết">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => showDetails(record)}
          />
        </Tooltip>
      )
    }
  ];

  const showDetails = (record: LoginHistory) => {
    // Implementation for showing details
    message.info('Chi tiết phiên đăng nhập');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <HistoryOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Lịch sử đăng nhập
          </Title>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Search
            placeholder="Tìm kiếm theo tên, email hoặc IP..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          
          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="active">Đang hoạt động</Option>
            <Option value="logged-out">Đã đăng xuất</Option>
            <Option value="expired">Hết hạn</Option>
          </Select>

          <Select
            placeholder="Thiết bị"
            style={{ width: 150 }}
            value={selectedDevice}
            onChange={setSelectedDevice}
          >
            <Option value="all">Tất cả thiết bị</Option>
            <Option value="desktop">Desktop</Option>
            <Option value="mobile">Mobile</Option>
            <Option value="tablet">Tablet</Option>
          </Select>

          <RangePicker
            style={{ width: 250 }}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            placeholder={['Từ ngày', 'Đến ngày']}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredHistory}
          loading={loading}
          pagination={{
            total: filteredHistory.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} phiên đăng nhập`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default LoginHistoryManagement;