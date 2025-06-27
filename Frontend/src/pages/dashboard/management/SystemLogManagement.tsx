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

// Utility function để format IP address cho hiển thị
const formatIPForDisplay = (ip: string): string => {
  if (!ip || ip === 'unknown') return 'Không xác định';
  
  // Hiển thị localhost một cách thân thiện hơn
  if (ip === '127.0.0.1' || ip === '::1') {
    return `${ip} (Localhost)`;
  }
  
  // Nếu IP đã được format từ backend, giữ nguyên
  if (ip.includes('(')) {
    return ip;
  }

  // Kiểm tra nếu là private IP
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || 
      (ip.startsWith('172.') && parseInt(ip.split('.')[1]) >= 16 && parseInt(ip.split('.')[1]) <= 31)) {
    return `${ip} (Mạng nội bộ)`;
  }

  return ip;
};

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
  
  // Local pagination state for server-side pagination
  const [localPagination, setLocalPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [localFilters, setLocalFilters] = useState<Record<string, any>>({});

  // Memoized fetchData function để tránh infinite loops
  const fetchData = useCallback(async () => {
    try {
      console.log('🔄 Fetching system logs...');
      
      const params: GetLogsParams = {
        page: localPagination.current,
        limit: localPagination.pageSize
      };
      
      // Add filters only if they exist and have values
      if (localFilters.level) params.level = localFilters.level;
      if (localFilters.action) params.action = localFilters.action;
      if (localFilters.search) params.search = localFilters.search;
      
      if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
        params.startDate = selectedDateRange[0].format('YYYY-MM-DD');
        params.endDate = selectedDateRange[1].format('YYYY-MM-DD');
      }
      
      console.log('📋 System logs API params:', params);
      
      const result = await getSystemLogs(params);
      console.log('✅ System logs API response:', result);
      console.log('📊 Pagination info:', {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        logsLength: result.logs?.length
      });
      
      // Update pagination state manually cho server-side pagination
      setLocalPagination(prev => ({
        ...prev,
        total: result.total || 0,
        current: result.page || prev.current
      }));
      
      return result.logs || [];
    } catch (error) {
      console.error('❌ Error fetching system logs:', error);
      return [];
    }
  }, [localPagination.current, localPagination.pageSize, localFilters, selectedDateRange]);

  // Use our standard management hook
  const {
    items: logs,
    loading,
    refreshData
  } = useStandardManagement<SystemLog>({
    fetchData
  });

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
  }, []);

  // Separate effect for refreshing data when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('🔄 Filter changed, refreshing data...');
      refreshData();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [selectedDateRange, localFilters.level, localFilters.action, localFilters.search, refreshData]);

  // Custom filter handlers
  const handleCustomFilterChange = useCallback((key: string, value: any) => {
    console.log('🔧 Filter change:', key, value);
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
    // Reset pagination to page 1 when filtering
    setLocalPagination(prev => ({
      ...prev,
      current: 1
    }));
  }, []);

  const handleCustomSearch = useCallback((text: string) => {
    console.log('🔍 Search change:', text);
    setLocalFilters(prev => ({
      ...prev,
      search: text
    }));
    // Reset pagination to page 1 when searching
    setLocalPagination(prev => ({
      ...prev,
      current: 1
    }));
  }, []);

  // Custom table change handler for server-side pagination
  const handleCustomTableChange = useCallback((pagination: any, filters: any, sorter: any) => {
    console.log('📄 Table change:', { pagination, filters, sorter });
    
    // Update local pagination state
    setLocalPagination(prev => ({
      ...prev,
      current: pagination.current || 1,
      pageSize: pagination.pageSize || 10
    }));
  }, []);

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
      if (localFilters.level) params.level = localFilters.level;
      if (localFilters.action) params.action = localFilters.action;

      await downloadLogsCSV(params);
      message.success('Đã export logs thành công!');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Lỗi khi export logs');
    }
  }

  const handleCleanupLogs = async () => {
    try {
      const values = await cleanupForm.validateFields();
      await cleanupOldLogs(values.daysToKeep);
      message.success('Đã dọn dẹp logs cũ thành công!');
      setCleanupModalVisible(false);
      cleanupForm.resetFields();
      refreshData();
      fetchStats();
    } catch (error) {
      console.error('Cleanup error:', error);
      message.error('Lỗi khi dọn dẹp logs');
    }
  };

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
      console.error('Test log error:', error);
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
      render: (createdAt: string) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>
            {new Date(createdAt).toLocaleDateString('vi-VN')}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {new Date(createdAt).toLocaleTimeString('vi-VN')}
          </Text>
        </Space>
      ),
      sorter: true
    },
    {
      title: 'Mức Độ',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => (
        <Tag color={logLevelColors[level as keyof typeof logLevelColors] || 'default'}>
          {level?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Hành Động',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: (action: string) => (
        <Tag color={actionTypeColors[action] || 'default'}>
          {action?.replace(/_/g, ' ')?.toUpperCase()}
        </Tag>
      )
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
      width: 150,
      render: (ip: string) => {
        const formattedIP = formatIPForDisplay(ip);
        return (
          <Tooltip title={`Raw IP: ${ip || 'N/A'}`}>
            <Text code style={{ fontSize: '12px' }}>
              {formattedIP}
            </Text>
          </Tooltip>
        );
      }
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
            current: localPagination.current,
            pageSize: localPagination.pageSize,
            total: localPagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} logs`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleCustomTableChange}
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
            rules={[{ required: true, message: 'Vui lòng chọn mức độ' }]}
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
            rules={[{ required: true, message: 'Vui lòng nhập tin nhắn' }]}
          >
            <Input.TextArea
              placeholder="Nội dung log..."
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemLogManagement; 