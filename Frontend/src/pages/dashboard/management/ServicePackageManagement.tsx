import {
    AppstoreOutlined,
    BarChartOutlined,
    DeleteOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
    PlusOutlined,
    ReloadOutlined,
    UndoOutlined
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    Input,
    message,
    Popconfirm,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { servicePackageApi } from '../../../api';
import { getServices } from '../../../api/endpoints/serviceApi';
import { recoverServicePackage } from '../../../api/endpoints/servicePackageApi';
import ServicePackageModal from '../../../components/ui/forms/ServicePackageModal';
import PackageUsageModal from '../../../components/ui/modals/PackageUsageModal';
import { useStandardManagement } from '../../../hooks/useStandardManagement';
import { CreateServicePackageRequest, Service, ServiceItem, ServicePackage, UpdateServicePackageRequest } from '../../../types';

const { Title, Text } = Typography;
const { Option } = Select;

// ✅ IMPROVED: Error Boundary Component với better error handling
class ServicePackageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: React.ErrorInfo }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🔥 ServicePackageManagement Error Boundary triggered:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔥 ServicePackageManagement Error Details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    this.setState({ error, errorInfo });
    
    // Report error to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).reportError) {
      (window as any).reportError(error, {
        context: 'ServicePackageManagement',
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card style={{ margin: '20px', textAlign: 'center' }}>
          <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
          <Title level={4} style={{ color: '#ff4d4f' }}>Có lỗi xảy ra trong quản lý gói dịch vụ</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: '20px' }}>
            {this.state.error?.message || 'Lỗi không xác định'}
          </Text>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ textAlign: 'left', marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Chi tiết lỗi (Development mode)</summary>
              <pre style={{ marginTop: '10px', fontSize: '12px', overflow: 'auto' }}>
                {this.state.error.stack}
              </pre>
            </details>
          )}
          
          <Space>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={this.handleRetry}
            >
              Thử lại
            </Button>
            <Button 
              onClick={() => window.location.reload()}
            >
              Tải lại trang
            </Button>
            <Button 
              onClick={() => window.history.back()}
            >
              Quay lại
            </Button>
          </Space>
        </Card>
      );
    }

    return this.props.children;
  }
}

// ✅ FIX: Main component với stabilized hooks
const ServicePackageManagementCore: React.FC = () => {
  // ✅ FIX: Stable state declarations
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceSearchId, setServiceSearchId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // ✅ NEW: Add new state variables for enhanced filtering and sorting
  const [serviceSearchText, setServiceSearchText] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('default');
  
  // 🆕 Analytics Modal State
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
  const [selectedPackageForAnalytics, setSelectedPackageForAnalytics] = useState<{
    id: string;
    name: string;
  } | null>(null);

  
  // ✅ FIX: Track initialization properly
  const hasInitialized = useRef(false);

  // ✅ FIX: Memoize fetchServices with stable dependencies
  const fetchServices = useCallback(async () => {
    try {
      setLoadingServices(true);
      setError(null);
      const response = await getServices();
      const data = response?.data?.services || [];
      setServices(data);
    } catch (error: any) {
      console.error('❌ Error fetching services:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tải danh sách dịch vụ';
      setError(errorMessage);
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        message.error('Không thể kết nối tới server. Vui lòng kiểm tra kết nối hoặc liên hệ quản trị viên.');
        setServices([]);
      } else {
        message.error(errorMessage);
      }
    } finally {
      setLoadingServices(false);
    }
  }, []); // Stable - no dependencies needed

  // ✅ FIX: Use custom hook with stable config và improved error handling
  const managementConfig = useCallback(() => ({
    fetchData: async () => {
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          setError(null);
          console.log(`🔄 Fetching service packages (attempt ${retryCount + 1}/${maxRetries})`);
          
          const response = await servicePackageApi.getServicePackages({
            includeDeleted: true // Always include inactive packages for management view
          });
          
          if (response?.success && response?.data?.packages) {
            console.log('✅ Service packages loaded successfully:', response.data.packages.length);
            return response.data.packages;
          }
          
          // Fallback cho response không có success flag
          return response?.data?.packages || [];
          
        } catch (error: any) {
          retryCount++;
          console.error(`❌ Error fetching service packages (attempt ${retryCount}):`, error);
          
          // Xử lý các loại lỗi khác nhau
          if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
            if (retryCount >= maxRetries) {
              setError('Không thể kết nối tới server. Vui lòng kiểm tra kết nối mạng.');
              message.error('Mất kết nối tới server. Vui lòng thử lại sau.');
              return [];
            }
            // Retry với delay
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            continue;
          }
          
          if (error?.response?.status === 500) {
            if (retryCount >= maxRetries) {
              setError('Server đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
              message.error('Server error. Vui lòng thử lại sau.');
              return [];
            }
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            continue;
          }
          
          if (error?.response?.status === 401) {
            setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            message.error('Phiên đăng nhập đã hết hạn');
            // TODO: Redirect to login
            return [];
          }
          
          if (error?.response?.status === 403) {
            setError('Bạn không có quyền truy cập tính năng này.');
            message.error('Không có quyền truy cập');
            return [];
          }
          
          // Lỗi khác - không retry
          const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tải danh sách gói dịch vụ';
          setError(errorMessage);
          message.error(errorMessage);
          return [];
        }
      }
      
      // Nếu retry hết lần thử
      setError('Không thể tải dữ liệu sau nhiều lần thử. Vui lòng tải lại trang.');
      return [];
    },
    createItem: async (data: any) => {
      try {
        const response = await servicePackageApi.createServicePackage(data as CreateServicePackageRequest);
        setError(null);
        return response.data;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tạo gói dịch vụ';
        setError(errorMessage);
        throw error;
      }
    },
    updateItem: async (id: string, data: any) => {
      try {
        const response = await servicePackageApi.updateServicePackage(id, data as UpdateServicePackageRequest);
        setError(null);
        return response.data;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Không thể cập nhật gói dịch vụ';
        setError(errorMessage);
        throw error;
      }
    },
    deleteItem: async (id: string) => {
      try {
        await servicePackageApi.deleteServicePackage(id);
        setError(null);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Không thể xóa gói dịch vụ';
        setError(errorMessage);
        throw error;
      }
    },
    searchFields: ['name', 'description'] as (keyof ServicePackage)[],
    messages: {
      fetchError: 'Không thể tải danh sách gói dịch vụ',
      createSuccess: 'Tạo gói dịch vụ thành công',
      createError: 'Không thể tạo gói dịch vụ',
      updateSuccess: 'Cập nhật gói dịch vụ thành công',
      updateError: 'Không thể cập nhật gói dịch vụ',
      deleteSuccess: 'Xóa gói dịch vụ thành công',
      deleteError: 'Không thể xóa gói dịch vụ'
    }
  }), []); // No dependency on showDeleted since we always include all packages

  const {
    items: packages,
    loading,
    modalVisible,
    editingItem: editingPackage,
    filteredItems: baseFilteredItems,
    refresh,
    handleCreate: originalHandleCreate,
    handleEdit: originalHandleEdit,
    handleDelete,
    handleModalCancel,
    handleModalSubmit: originalHandleModalSubmit,
    handleSearch,
    setFilter
  } = useStandardManagement<ServicePackage>(managementConfig());

  // ✅ NEW: Enhanced filteredItems with service search and sorting
  const filteredItems = React.useMemo(() => {
    let result = baseFilteredItems;

    // ✅ NEW: Filter by service name if serviceSearchText is provided
    if (serviceSearchText.trim()) {
      result = result.filter(pkg => {
        return pkg.services?.some(serviceItem => {
          const service = typeof serviceItem.serviceId === 'object' 
            ? serviceItem.serviceId 
            : services.find(s => s._id === serviceItem.serviceId);
          
          return service?.serviceName?.toLowerCase().includes(serviceSearchText.toLowerCase());
        });
      });
    }

    // ✅ NEW: Apply sorting based on sortOption
    switch (sortOption) {
      case 'name-asc':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'price-asc':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'duration-desc':
        result = [...result].sort((a, b) => b.durationInDays - a.durationInDays);
        break;
      case 'duration-asc':
        result = [...result].sort((a, b) => a.durationInDays - b.durationInDays);
        break;
      case 'default':
      default:
        // Keep original order (usually by creation date)
        break;
    }

    return result;
  }, [baseFilteredItems, serviceSearchText, sortOption, services]);



  // ✅ FIX: One-time initialization with error handling
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      console.log('🚀 ServicePackageManagement: Initial load started');
      
      // Initialize filter to show all packages
      setFilter('isActive', null);
      
      Promise.allSettled([
        refresh(),
        fetchServices()
      ]).then(results => {
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Failed to load ${index === 0 ? 'packages' : 'services'}:`, result.reason);
          }
        });
      });
    }
  }, [setFilter, refresh, fetchServices]); // Added dependencies

  // Calculate stats - Match ServiceManagement format
  const stats = React.useMemo(() => ({
    total: Array.isArray(packages) ? packages.length : 0,
    active: Array.isArray(packages) ? packages.filter(pkg => pkg?.isActive !== false).length : 0,
    deleted: Array.isArray(packages) ? packages.filter(pkg => pkg?.isActive === false).length : 0
  }), [packages]);

  // Status change handler - Fixed to show all by default
  const handleStatusChange = useCallback((value: string) => {
    setSelectedStatus(value);
    // Default to showing all packages, filter only when specific status selected
    if (value === 'all') {
      setFilter('isActive', null); // Show all packages
    } else if (value === 'active') {
      setFilter('isActive', true); // Show only active packages
    } else if (value === 'inactive') {
      setFilter('isActive', false); // Show only inactive packages
    }
  }, [setFilter]);

  // ✅ NEW: Handle service search
  const handleServiceSearch = useCallback((value: string) => {
    setServiceSearchText(value);
  }, []);

  // ✅ NEW: Handle sort option change
  const handleSortChange = useCallback((value: string) => {
    setSortOption(value);
  }, []);

  const handleRefresh = useCallback(() => {
    // ✅ NEW: Reset all filters and search when refresh
    setSelectedStatus('all');
    setServiceSearchText('');
    setSortOption('default');
    handleSearch(''); // Reset main search
    setFilter('isActive', null); // Reset status filter
    
    Promise.allSettled([
      refresh(),
      fetchServices()
    ]);
  }, [refresh, fetchServices, handleSearch, setFilter]);

  // Handle recover package
  const handleRecover = useCallback(async (id: string) => {
    try {
      await recoverServicePackage(id);
      message.success('Khôi phục gói dịch vụ thành công');
      await refresh();
    } catch (error: any) {
      console.error('Error recovering package:', error);
      message.error(error?.response?.data?.message || 'Không thể khôi phục gói dịch vụ');
    }
  }, [refresh]);



  // Render services column
  const renderServicesColumn = (services: ServiceItem[]) => {
    if (!services || services.length === 0) {
      return <Tag color="default">Không có dịch vụ</Tag>;
    }
    
    return (
      <Space direction="vertical" size="small">
        {services.map((serviceItem, index) => {
          // Handle both populated Service object and string serviceId
          let serviceName = 'Đang tải...';
          let serviceId = '';
          
          if (typeof serviceItem.serviceId === 'object' && serviceItem.serviceId !== null) {
            // Populated Service object
            serviceName = serviceItem.serviceId.serviceName || 'Không có tên';
            serviceId = serviceItem.serviceId._id || '';
          } else if (typeof serviceItem.serviceId === 'string') {
            // String serviceId (not populated)
            serviceName = 'Đang tải...';
            serviceId = serviceItem.serviceId;
          } else {
            // Null or undefined serviceId
            serviceName = 'Dịch vụ không xác định';
            serviceId = 'unknown';
          }
          
          return (
            <Tag key={`${serviceId}-${index}`} color="blue">
              {serviceName} x{serviceItem.quantity}
            </Tag>
          );
        })}
      </Space>
    );
  };

  // Add helper functions for status rendering like ServiceManagement
  const getStatusColor = (pkg: ServicePackage) => {
    if (pkg.isActive === false) return 'error';
    return 'success';
  };

  const getStatusText = (pkg: ServicePackage) => {
    return pkg.isActive !== false ? 'Hoạt động' : 'Ngưng hoạt động';
  };

  // Table columns
  const columns = [
    {
      title: 'Mã gói',
      dataIndex: '_id',
      key: '_id',
      width: 120,
      render: (id: string) => (
        <div>
          <Text code style={{ fontSize: '11px' }}>
            {id.substring(0, 8)}...
          </Text>
          <br />
          <Button
            type="link"
            size="small"
            onClick={() => {
              navigator.clipboard.writeText(id);
              message.success('Đã sao chép mã gói');
            }}
            style={{ padding: 0, fontSize: '10px' }}
          >
            Copy full ID
          </Button>
        </div>
      ),
    },
    {
      title: 'Tên gói',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ServicePackage) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.description.length > 50 
                  ? `${record.description.substring(0, 50)}...` 
                  : record.description}
              </Text>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Giá',
      key: 'pricing',
      render: (record: ServicePackage) => (
        <div>
          {/* ✅ NEW: Display price before discount */}
          {record.priceBeforeDiscount && record.priceBeforeDiscount > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px', textDecoration: 'line-through' }}>
                Giá gốc: {record.priceBeforeDiscount.toLocaleString('vi-VN')} VNĐ
              </Text>
            </div>
          )}
          <Text strong style={{ color: '#1890ff' }}>
            Giá gói: {record.price.toLocaleString('vi-VN')} VNĐ
          </Text>
          {/* ✅ NEW: Show discount percentage if applicable */}
          {record.priceBeforeDiscount && record.priceBeforeDiscount > record.price && (
            <div>
              <Text type="success" style={{ fontSize: '11px' }}>
                Giảm {Math.round(((record.priceBeforeDiscount - record.price) / record.priceBeforeDiscount) * 100)}%
              </Text>
            </div>
          )}
        </div>
      ),
      sorter: (a: ServicePackage, b: ServicePackage) => a.price - b.price,
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'services',
      key: 'services',
      render: renderServicesColumn,
      width: 250,
    },
    {
      title: 'Thời hạn',
      dataIndex: 'durationInDays',
      key: 'durationInDays',
      render: (days: number) => `${days} ngày`,
      sorter: (a: ServicePackage, b: ServicePackage) => a.durationInDays - b.durationInDays,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (_, record: ServicePackage) => (
        <Tag color={getStatusColor(record)}>
          {getStatusText(record)}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: ServicePackage) => (
        <Space>
          <Tooltip title="Xem Usage Analytics">
            <Button
              type="link"
              icon={<BarChartOutlined />}
              onClick={() => handleShowAnalytics(record)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditClick(record)}
            />
          </Tooltip>
          {record.isActive !== false ? (
            // Active package - show delete button
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa gói dịch vụ này?"
              onConfirm={() => handleDelete(record._id!)}
              okText="Có"
              cancelText="Không"
            >
              <Tooltip title="Xóa">
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          ) : (
            // Inactive package - show recover button
            <Popconfirm
              title="Bạn có chắc chắn muốn khôi phục gói dịch vụ này?"
              onConfirm={() => handleRecover(record._id!)}
              okText="Có"
              cancelText="Không"
            >
              <Tooltip title="Khôi phục">
                <Button
                  type="link"
                  icon={<UndoOutlined />}
                  style={{ color: '#52c41a' }}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Custom handlers that use ServicePackageModal
  const handleCreateClick = () => {
    originalHandleCreate();
  };

  const handleEditClick = (pkg: ServicePackage) => {
    originalHandleEdit(pkg);
  };

  const handleModalSubmitCustom = async (data: CreateServicePackageRequest | UpdateServicePackageRequest) => {
    return originalHandleModalSubmit(data);
  };

  // 🆕 Analytics handlers
  const handleShowAnalytics = (pkg: ServicePackage) => {
    setSelectedPackageForAnalytics({
      id: pkg._id,
      name: pkg.name
    });
    setAnalyticsModalVisible(true);
  };

  const handleCloseAnalytics = () => {
    setAnalyticsModalVisible(false);
    setSelectedPackageForAnalytics(null);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <AppstoreOutlined style={{ marginRight: '8px' }} />
          Quản lý gói dịch vụ
        </Title>
      </div>

      {/* Statistics - Match ServiceManagement format */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng gói dịch vụ"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Ngưng hoạt động"
              value={stats.deleted}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Error display */}
      {error && (
        <Alert
          message="Lỗi tải dữ liệu"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
          action={
            <Button 
              size="small" 
              type="primary" 
              onClick={() => {
                setError(null);
                refresh();
                fetchServices();
              }}
            >
              Thử lại
            </Button>
          }
        />
      )}

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            Danh sách gói dịch vụ
          </Title>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateClick}
            >
              Thêm gói dịch vụ mới
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              Làm mới
            </Button>
          </Space>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Input.Search
            placeholder="Tìm kiếm theo tên gói, mô tả..."
            allowClear
            style={{ width: 250 }}
            className="search-blue-button"
            onSearch={handleSearch}
          />
          
          <Input.Search
            placeholder="Tìm kiếm theo tên dịch vụ..."
            allowClear
            style={{ width: 250 }}
            className="search-blue-button"
            onSearch={handleServiceSearch}
            value={serviceSearchText}
          />
          
          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            value={selectedStatus}
            onChange={handleStatusChange}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="active">Hoạt động</Option>
            <Option value="inactive">Ngưng hoạt động</Option>
          </Select>

          <Select
            placeholder="Sắp xếp"
            style={{ width: 200 }}
            value={sortOption}
            onChange={handleSortChange}
          >
            <Option value="default">Mặc định</Option>
            <Option value="name-asc">Tên gói (A-Z)</Option>
            <Option value="price-desc">Giá (Cao đến thấp)</Option>
            <Option value="price-asc">Giá (Thấp đến cao)</Option>
            <Option value="duration-desc">Thời hạn (Nhiều đến ít)</Option>
            <Option value="duration-asc">Thời hạn (Ít đến nhiều)</Option>
          </Select>
        </div>

        {/* Table with improved empty states */}
        {error && !loading && filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
            <Title level={4} style={{ color: '#ff4d4f' }}>Không thể tải dữ liệu</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: '20px' }}>
              {error}
            </Text>
            <Space>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={() => {
                  setError(null);
                  refresh();
                  fetchServices();
                }}
              >
                Thử lại
              </Button>
              <Button 
                onClick={() => window.location.reload()}
              >
                Tải lại trang
              </Button>
            </Space>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredItems}
            rowKey="_id"
            loading={loading}
            locale={{
              emptyText: loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <LoadingOutlined style={{ fontSize: '24px', marginBottom: '16px' }} />
                  <div>Đang tải dữ liệu...</div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <AppstoreOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>Chưa có gói dịch vụ nào</div>
                  <Text type="secondary">Hãy tạo gói dịch vụ đầu tiên</Text>
                </div>
              )
            }}
            pagination={{
              total: filteredItems.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} gói dịch vụ`,
            }}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>

      <ServicePackageModal
        visible={modalVisible}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmitCustom}
        servicePackage={editingPackage}
        loading={loading}
      />

      {/* 🆕 Analytics Modal */}
      {selectedPackageForAnalytics && (
        <PackageUsageModal
          visible={analyticsModalVisible}
          onClose={handleCloseAnalytics}
          packageId={selectedPackageForAnalytics.id}
          packageName={selectedPackageForAnalytics.name}
        />
      )}
    </div>
  );
};

// ✅ FIX: Wrapper component with Error Boundary
const ServicePackageManagement: React.FC = () => {
  return (
    <ServicePackageErrorBoundary>
      <ServicePackageManagementCore />
    </ServicePackageErrorBoundary>
  );
};

export default ServicePackageManagement; 