import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Tag,
  Typography,
  Space,
  Tooltip,
  Button,
  DatePicker,
  Select,
  Input,
  Popconfirm,
  message,
  Modal,
  Form,
  InputNumber,
  Card,
  Row,
  Col,
  Badge
} from 'antd';
import {
  FileTextOutlined,
  CalendarOutlined,
  SecurityScanOutlined,
  UserOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  LockOutlined,
  BugOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import StandardManagementPage, { 
  type ManagementStat, 
  type FilterOption, 
  type ActionButton 
} from '../../../components/ui/management/StandardManagementPage';
import useStandardManagement from '../../../hooks/useStandardManagement';
import { 
  getSystemLogs,
  getSystemLogStats,
  cleanupOldLogs,
  createTestLog,
  downloadLogsCSV,
  type SystemLog,
  type SystemLogStats,
  type GetLogsParams
} from '../../../api/endpoints/systemLogApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Log level colors
const logLevelColors = {
  public: 'blue',
  manager: 'orange', 
  admin: 'red'
};

// Action type colors
const actionTypeColors: Record<string, string> = {
  login: 'green',
  logout: 'gray',
  register: 'blue',
  user_create: 'cyan',
  user_update: 'geekblue',
  user_delete: 'red',
  role_change: 'purple',
  appointment_create: 'green',
  appointment_update: 'blue',
  appointment_cancel: 'orange',
  system_config_change: 'red',
  unauthorized_access: 'red',
  suspicious_activity: 'red',
  data_export: 'purple'
};

const SystemLogManagement: React.FC = () => {
  const [stats, setStats] = useState<SystemLogStats | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<[any, any] | null>(null);
  const [cleanupModalVisible, setCleanupModalVisible] = useState(false);
  const [testLogModalVisible, setTestLogModalVisible] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [cleanupForm] = Form.useForm();
  const [testLogForm] = Form.useForm();
  
  // Local state for filters and pagination to avoid circular dependency
  const [localFilters, setLocalFilters] = useState<Record<string, any>>({});
  const [localPagination, setLocalPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Memoized fetchData function to prevent infinite loops
  const fetchData = useCallback(async () => {
    try {
      const params: GetLogsParams = {
        page: localPagination.current || 1,
        limit: localPagination.pageSize || 10
      };
      
      // Add filters only if they exist and have values
      if (localFilters.level) params.level = localFilters.level;
      if (localFilters.action) params.action = localFilters.action;
      if (localFilters.search) params.search = localFilters.search;
      
      if (selectedDateRange) {
        params.startDate = selectedDateRange[0]?.format('YYYY-MM-DD');
        params.endDate = selectedDateRange[1]?.format('YYYY-MM-DD');
      }
      
      const result = await getSystemLogs(params);
      return result.logs || [];
    } catch (error) {
      console.error('Error fetching system logs:', error);
      return [];
    }
  }, [localPagination.current, localPagination.pageSize, localFilters.level, localFilters.action, localFilters.search, selectedDateRange]);

  // Use our standard management hook
  const {
    items: logs,
    loading,
    currentFilters,
    pagination,
    handleTableChange,
    handleSearch,
    handleFilterChange,
    refreshData
  } = useStandardManagement<SystemLog>({
    fetchData
  });

  // Sync local state with hook state
  useEffect(() => {
    setLocalFilters(currentFilters || {});
  }, [currentFilters]);

  useEffect(() => {
    setLocalPagination(pagination || { current: 1, pageSize: 10, total: 0 });
  }, [pagination]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const statsData = await getSystemLogStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Get user role from localStorage/context
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
    fetchStats();
    
    // Trigger initial data load only once
    refreshData();
  }, []); // Remove refreshData dependency to prevent infinite loop

  // Separate effect for refreshing data when filters change (but not refreshData function itself)
  useEffect(() => {
    // Only refresh if there are actual filter values or date range
    const hasFilters = selectedDateRange || Object.keys(localFilters).some(key => localFilters[key] && localFilters[key] !== '');
    if (hasFilters) {
      // Use a timeout to debounce the refresh calls
      const timeoutId = setTimeout(() => {
        refreshData();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedDateRange, localFilters]); // Remove refreshData dependency to prevent infinite loops

  // Custom filter handlers that update local state
  const handleCustomFilterChange = useCallback((key: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
    // Also update the hook's filters
    handleFilterChange(key, value);
  }, [handleFilterChange]);

  const handleCustomSearch = useCallback((text: string) => {
    setLocalFilters(prev => ({
      ...prev,
      search: text
    }));
    // Also update the hook's search
    handleSearch(text);
  }, [handleSearch]);

  // Stats cards
  const managementStats: ManagementStat[] = [
    {
      title: 'Tổng Logs',
      value: stats?.totalLogs || 0,
      icon: <FileTextOutlined />,
      color: '#1890ff'
    },
    {
      title: 'Logs Hôm Nay',
      value: stats?.todayLogs || 0,
      icon: <CalendarOutlined />,
      color: '#52c41a'
    },
    {
      title: 'Lượt Đăng Nhập',
      value: stats?.loginCount || 0,
      icon: <UserOutlined />,
      color: '#722ed1'
    },
    {
      title: 'Logs Bảo Mật',
      value: stats?.errorCount || 0,
      icon: <SecurityScanOutlined />,
      color: '#f5222d'
    }
  ];

  // Filters
  const filterOptions: FilterOption[] = [
    {
      key: 'level',
      label: 'Mức Độ',
      type: 'select',
      options: [
        { label: 'Tất cả', value: '' },
        { label: 'Public', value: 'public' },
        { label: 'Manager', value: 'manager' },
        ...(userRole === 'admin' ? [{ label: 'Admin', value: 'admin' }] : [])
      ],
      value: localFilters.level,
      onChange: (value) => handleCustomFilterChange('level', value)
    },
    {
      key: 'action',
      label: 'Hành Động',
      type: 'select',
      options: [
        { label: 'Tất cả', value: '' },
        { label: 'Đăng nhập', value: 'login' },
        { label: 'Đăng xuất', value: 'logout' },
        { label: 'Tạo user', value: 'user_create' },
        { label: 'Cập nhật user', value: 'user_update' },
        { label: 'Xóa user', value: 'user_delete' },
        { label: 'Đổi role', value: 'role_change' },
        { label: 'Tạo cuộc hẹn', value: 'appointment_create' },
        { label: 'Truy cập trái phép', value: 'unauthorized_access' }
      ],
      value: localFilters.action,
      onChange: (value) => handleCustomFilterChange('action', value)
    },
    {
      key: 'search',
      label: 'Tìm Kiếm',
      type: 'search',
      placeholder: 'Email, tin nhắn, IP...',
      value: localFilters.search,
      onChange: (value) => handleCustomSearch(value)
    }
  ];

  // Action buttons for secondary actions only
  const secondaryActions: ActionButton[] = [
    {
      key: 'refresh',
      label: 'Làm Mới',
      icon: <ReloadOutlined />,
      onClick: () => {
        refreshData();
        fetchStats();
      }
    },
    {
      key: 'export',
      label: 'Export CSV',
      icon: <DownloadOutlined />,
      type: 'primary',
      disabled: userRole !== 'admin',
      onClick: handleExportLogs
    }
  ];

  // Additional admin actions (will be rendered separately)
  const adminActions = userRole === 'admin' ? [
    {
      key: 'cleanup',
      label: 'Dọn Dẹp',
      icon: <DeleteOutlined />,
      onClick: () => setCleanupModalVisible(true)
    },
    {
      key: 'test',
      label: 'Test Log',
      icon: <BugOutlined />,
      onClick: () => setTestLogModalVisible(true)
    }
  ] : [];

  // Export logs
  async function handleExportLogs() {
    try {
      const params: any = {};
      if (selectedDateRange) {
        params.startDate = selectedDateRange[0]?.format('YYYY-MM-DD');
        params.endDate = selectedDateRange[1]?.format('YYYY-MM-DD');
      }
      if (localFilters?.level) params.level = localFilters.level;
      if (localFilters?.action) params.action = localFilters.action;
      
      await downloadLogsCSV(params);
      message.success('Đã tải xuống file CSV thành công!');
    } catch (error) {
      message.error('Lỗi khi export logs');
    }
  }

  // Cleanup logs
  const handleCleanupLogs = async () => {
    try {
      const values = await cleanupForm.validateFields();
      const result = await cleanupOldLogs(values.daysToKeep);
      message.success(`Đã xóa ${result.deletedCount} logs cũ`);
      setCleanupModalVisible(false);
      cleanupForm.resetFields();
      refreshData();
      fetchStats();
    } catch (error) {
      message.error('Lỗi khi dọn dẹp logs');
    }
  };

  // Create test log
  const handleCreateTestLog = async () => {
    try {
      const values = await testLogForm.validateFields();
      await createTestLog(values);
      message.success('Đã tạo test log thành công!');
      setTestLogModalVisible(false);
      testLogForm.resetFields();
      refreshData();
      fetchStats();
    } catch (error) {
      message.error('Lỗi khi tạo test log');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Thời Gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (createdAt: string) => {
        if (!createdAt) return <Text type="secondary">N/A</Text>;
        
        return (
          <Tooltip title={new Date(createdAt).toLocaleString('vi-VN')}>
            <Text type="secondary">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: vi })}
            </Text>
          </Tooltip>
        );
      },
      sorter: true
    },
    {
      title: 'Mức Độ',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => {
        if (!level) {
          return <Tag color="default">N/A</Tag>;
        }
        
        const icons = {
          public: <InfoCircleOutlined />,
          manager: <WarningOutlined />,
          admin: <LockOutlined />
        };
        
        return (
          <Tag 
            color={logLevelColors[level as keyof typeof logLevelColors] || 'default'} 
            icon={icons[level as keyof typeof icons]}
          >
            {level.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Hành Động',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (action: string) => {
        if (!action) return <Tag color="default">N/A</Tag>;
        
        return (
          <Tag color={actionTypeColors[action] || 'default'}>
            {action.replace(/_/g, ' ').toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Người Dùng',
      dataIndex: 'userEmail',
      key: 'userEmail',
      width: 200,
      render: (userEmail: string, record: SystemLog) => (
        <Space direction="vertical" size={0}>
          <Text strong>{userEmail || 'N/A'}</Text>
          {record.userRole && (
            <Tag color="blue">{record.userRole}</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Tin Nhắn',
      dataIndex: 'message',
      key: 'message',
      ellipsis: { showTitle: false },
      render: (message: string) => (
        <Tooltip title={message}>
          <Text>{message}</Text>
        </Tooltip>
      )
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
      render: (ip: string) => ip || 'N/A'
    },
    {
      title: 'Target',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 100,
      render: (targetType: string, record: SystemLog) => {
        if (!targetType) return 'N/A';
        
        return (
          <Tooltip title={`ID: ${record.targetId || 'N/A'}`}>
            <Tag>{targetType}</Tag>
          </Tooltip>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Quản Lý System Logs
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: '16px' }}>
          Theo dõi và quản lý nhật ký hoạt động hệ thống
        </Typography.Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {managementStats.map((stat, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card>
              <Typography.Title level={3} style={{ color: stat.color, margin: 0 }}>
                {stat.icon} {stat.value}
              </Typography.Title>
              <Typography.Text type="secondary">{stat.title}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle" style={{ width: '100%' }}>
          {filterOptions.map((filter) => (
            <div key={filter.key}>
              <Typography.Text strong>{filter.label}: </Typography.Text>
              {filter.type === 'select' && (
                <Select
                  style={{ width: 150, marginLeft: 8 }}
                  value={filter.value}
                  onChange={filter.onChange}
                  allowClear
                >
                  {filter.options?.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              )}
              {filter.type === 'search' && (
                <Input.Search
                  style={{ width: 200, marginLeft: 8 }}
                  placeholder={filter.placeholder}
                  value={filter.value}
                  onChange={(e) => filter.onChange?.(e.target.value)}
                  allowClear
                />
              )}
            </div>
          ))}
          
          {/* Date Range Picker */}
          <div>
            <Typography.Text strong>Thời gian: </Typography.Text>
            <RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              value={selectedDateRange}
              onChange={setSelectedDateRange}
              format="DD/MM/YYYY"
              style={{ marginLeft: 8 }}
            />
          </div>
        </Space>
      </Card>

      {/* Action Buttons */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          {secondaryActions.map((action) => (
            <Button
              key={action.key}
              type={action.type || 'default'}
              icon={action.icon}
              onClick={action.onClick}
              disabled={action.disabled}
              loading={action.loading}
            >
              {action.label}
            </Button>
          ))}
          
          {adminActions.map((action) => (
            <Button
              key={action.key}
              danger={action.key === 'cleanup'}
              icon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={logs || []}
          loading={loading}
          rowKey="_id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} logs`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Cleanup Modal */}
      <Modal
        title={
          <Space>
            <DeleteOutlined />
            Dọn Dẹp Logs Cũ
          </Space>
        }
        open={cleanupModalVisible}
        onOk={handleCleanupLogs}
        onCancel={() => {
          setCleanupModalVisible(false);
          cleanupForm.resetFields();
        }}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <Form form={cleanupForm} layout="vertical">
          <Form.Item
            name="daysToKeep"
            label="Số ngày giữ lại"
            initialValue={90}
            rules={[
              { required: true, message: 'Vui lòng nhập số ngày' },
              { type: 'number', min: 1, max: 365, message: 'Số ngày phải từ 1-365' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Ví dụ: 90"
              addonAfter="ngày"
            />
          </Form.Item>
          <Text type="warning">
            ⚠️ Logs cũ hơn số ngày này sẽ bị xóa vĩnh viễn!
          </Text>
        </Form>
      </Modal>

      {/* Test Log Modal */}
      <Modal
        title={
          <Space>
            <BugOutlined />
            Tạo Test Log
          </Space>
        }
        open={testLogModalVisible}
        onOk={handleCreateTestLog}
        onCancel={() => {
          setTestLogModalVisible(false);
          testLogForm.resetFields();
        }}
        okText="Tạo"
        cancelText="Hủy"
      >
        <Form form={testLogForm} layout="vertical">
          <Form.Item
            name="action"
            label="Hành động"
            rules={[{ required: true, message: 'Vui lòng chọn hành động' }]}
          >
            <Select placeholder="Chọn action">
              <Option value="login">Login</Option>
              <Option value="user_create">User Create</Option>
              <Option value="system_config_change">System Config Change</Option>
              <Option value="suspicious_activity">Suspicious Activity</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="level"
            label="Mức độ"
            rules={[{ required: true, message: 'Vui lòng chọn level' }]}
          >
            <Select placeholder="Chọn level">
              <Option value="public">Public</Option>
              <Option value="manager">Manager</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="message"
            label="Tin nhắn"
            rules={[{ required: true, message: 'Vui lòng nhập message' }]}
          >
            <Input.TextArea 
              placeholder="Mô tả chi tiết hành động..." 
              rows={3}
            />
          </Form.Item>
          
          <Form.Item
            name="targetType"
            label="Target Type (tuỳ chọn)"
          >
            <Input placeholder="Ví dụ: user, appointment, system..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemLogManagement; 