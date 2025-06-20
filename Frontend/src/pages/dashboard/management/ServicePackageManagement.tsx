import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Popconfirm,
  message,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  Switch,
  Tooltip,
  Descriptions,
  Badge,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  UndoOutlined,
  AppstoreOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import StandardManagementPage, { 
  type ManagementStat, 
  type FilterOption, 
  type ActionButton 
} from '../../../components/ui/management/StandardManagementPage';
import { useStandardManagement } from '../../../hooks/useStandardManagement';
import { servicePackageApi } from '../../../api';
import { getServices } from '../../../api/endpoints/serviceApi';
import { Form as AntForm } from 'antd';
import { Service, ServicePackage, CreateServicePackageRequest, UpdateServicePackageRequest, ServiceItem } from '../../../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ServicePackageForm {
  name: string;
  description: string;
  price: number;
  services: ServiceItem[];
  durationInDays: number;
  isActive: boolean;
}

// ✅ ADD: Error Boundary Component
class ServicePackageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ServicePackageManagement Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          message="Có lỗi xảy ra"
          description="Vui lòng tải lại trang hoặc liên hệ quản trị viên."
          type="error"
          showIcon
          action={
            <Button 
              size="small" 
              danger 
              onClick={() => window.location.reload()}
            >
              Tải lại trang
            </Button>
          }
        />
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
  const [showDeleted, setShowDeleted] = useState(false);
  const [serviceSearchId, setServiceSearchId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // ✅ FIX: Stable form instance
  const [form] = Form.useForm<ServicePackageForm>();
  
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

  // ✅ FIX: Use custom hook with stable config
  const managementConfig = useCallback(() => ({
    fetchData: async () => {
      try {
        const response = await servicePackageApi.getServicePackages();
        setError(null);
        return response?.data?.packages || [];
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tải danh sách gói dịch vụ';
        setError(errorMessage);
        throw error;
      }
    },
    createItem: async (data: any) => {
      const response = await servicePackageApi.createServicePackage(data as CreateServicePackageRequest);
      return response.data;
    },
    updateItem: async (id: string, data: any) => {
      const response = await servicePackageApi.updateServicePackage(id, data as UpdateServicePackageRequest);
      return response.data;
    },
    deleteItem: async (id: string) => {
      await servicePackageApi.deleteServicePackage(id);
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
  }), []);

  const {
    items: packages,
    loading,
    modalVisible,
    editingItem: editingPackage,
    filteredItems,
    refresh,
    handleCreate,
    handleEdit,
    handleDelete,
    handleModalCancel,
    handleModalSubmit,
    handleSearch,
    setFilter
  } = useStandardManagement<ServicePackage>(managementConfig());

  // ✅ FIX: Defensive form watching with null checks
  const watchedServices = AntForm.useWatch('services', form) || [];
  const watchedDurationInDays = AntForm.useWatch('durationInDays', form) || 0;

  // ✅ FIX: Stabilized price calculation effect
  useEffect(() => {
    try {
      if (Array.isArray(watchedServices) && watchedServices.length > 0 && 
          watchedDurationInDays > 0 && Array.isArray(services) && services.length > 0) {
        let totalCalculatedPrice = 0;
        
        watchedServices.forEach((serviceItem: ServiceItem) => {
          if (serviceItem?.serviceId) {
            const selectedService = services.find(s => s?._id === serviceItem.serviceId);
            if (selectedService?.price && serviceItem?.quantity) {
              totalCalculatedPrice += selectedService.price * serviceItem.quantity;
            }
          }
        });
        
        if (totalCalculatedPrice > 0) {
          form.setFieldValue('price', totalCalculatedPrice);
        }
      }
    } catch (error) {
      console.error('Error in price calculation:', error);
    }
  }, [watchedServices, watchedDurationInDays, services, form]);

  // ✅ FIX: One-time initialization with error handling
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      console.log('🚀 ServicePackageManagement: Initial load started');
      
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
  }, []); // Empty dependencies - run only once

  // ✅ FIX: Stable stats calculation with null checks
  const stats: ManagementStat[] = React.useMemo(() => [
    {
      title: 'Tổng gói dịch vụ',
      value: Array.isArray(packages) ? packages.length : 0,
      icon: <AppstoreOutlined />,
      color: '#1890ff'
    },
    {
      title: 'Gói đang hoạt động',
      value: Array.isArray(packages) ? packages.filter(pkg => pkg?.isActive !== false).length : 0,
      icon: <ThunderboltOutlined />,
      color: '#52c41a'
    },
    {
      title: 'Giá trung bình',
      value: Array.isArray(packages) && packages.length > 0 
        ? packages.reduce((sum, pkg) => sum + (pkg?.price || 0), 0) / packages.length 
        : 0,
      icon: <DollarOutlined />,
      color: '#faad14',
      precision: 0,
      suffix: ' VNĐ'
    },
    {
      title: 'Thời hạn TB',
      value: Array.isArray(packages) && packages.length > 0 
        ? packages.reduce((sum, pkg) => sum + (pkg?.durationInDays || 0), 0) / packages.length 
        : 0,
      icon: <CalendarOutlined />,
      color: '#722ed1',
      precision: 0,
      suffix: ' ngày'
    }
  ], [packages]);

  // ✅ FIX: Stable filters with callback memoization
  const handleStatusChange = useCallback((value: string) => {
    setSelectedStatus(value);
    setFilter('isActive', value === 'all' ? null : value === 'active');
  }, [setFilter]);

  const handleShowDeletedChange = useCallback((checked: boolean) => {
    setShowDeleted(checked);
  }, []);

  const filters: FilterOption[] = React.useMemo(() => [
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      value: selectedStatus,
      options: [
        { label: 'Tất cả', value: 'all' },
        { label: 'Hoạt động', value: 'active' },
        { label: 'Không hoạt động', value: 'inactive' }
      ],
      onChange: handleStatusChange
    },
    {
      key: 'showDeleted',
      label: 'Hiển thị đã xóa',
      type: 'switch',
      value: showDeleted,
      onChange: handleShowDeletedChange
    }
  ], [selectedStatus, showDeleted, handleStatusChange, handleShowDeletedChange]);

  // Actions configuration
  const primaryAction: ActionButton = React.useMemo(() => ({
    key: 'create',
    label: 'Thêm gói dịch vụ',
    icon: <PlusOutlined />,
    onClick: handleCreate
  }), [handleCreate]);

  const handleRefresh = useCallback(() => {
    Promise.allSettled([
      refresh(),
      fetchServices()
    ]);
  }, [refresh, fetchServices]);

  const secondaryActions: ActionButton[] = React.useMemo(() => [
    {
      key: 'refresh',
      label: 'Làm mới',
      icon: <ReloadOutlined />,
      onClick: handleRefresh
    }
  ], [handleRefresh]);

  // Handle form submit
  const onFormSubmit = async (values: ServicePackageForm) => {
    if (!values.services || values.services.length === 0) {
      message.error('Vui lòng chọn ít nhất một dịch vụ');
      return;
    }
    await handleModalSubmit(values);
  };

  // Enhanced edit handler
  const onEdit = (pkg: ServicePackage) => {
    const normalizedServices: ServiceItem[] = pkg.services?.map(serviceItem => ({
      serviceId: typeof serviceItem.serviceId === 'object' ? serviceItem.serviceId._id : serviceItem.serviceId,
      quantity: serviceItem.quantity
    })) || [];

    // Handle missing services
    const missingServiceIds = normalizedServices
      .map(item => item.serviceId)
      .filter(id => !services.some(s => s._id === id));
      
    if (missingServiceIds.length > 0) {
      const missingOptions: Service[] = missingServiceIds.map(id => ({ 
        _id: typeof id === 'string' ? id : String(id), 
        serviceName: `Dịch vụ đã xóa (${id})`, 
        price: 0, 
        description: '', 
        isDeleted: 1,
        serviceType: 'other' as const,
        availableAt: []
      }));
      setServices(prev => [...prev, ...missingOptions]);
    }

    form.setFieldsValue({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price,
      services: normalizedServices,
      durationInDays: pkg.durationInDays,
      isActive: pkg.isActive !== false
    });

    handleEdit(pkg);
  };

  // Render services column
  const renderServicesColumn = (services: ServiceItem[]) => {
    if (!services || services.length === 0) {
      return <Tag color="default">Không có dịch vụ</Tag>;
    }
    
    return (
      <Space direction="vertical" size="small">
        {services.map((serviceItem, index) => {
          const service = typeof serviceItem.serviceId === 'object' 
            ? serviceItem.serviceId 
            : { serviceName: 'Đang tải...', _id: serviceItem.serviceId };
          
          return (
            <Tag key={index} color="blue">
              {service.serviceName} x{serviceItem.quantity}
            </Tag>
          );
        })}
      </Space>
    );
  };

  // Table columns
  const columns = [
    {
      title: 'Tên gói',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: ServicePackage, b: ServicePackage) => a.name.localeCompare(b.name),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Giá (VNĐ)',
      dataIndex: 'price',
      key: 'price',
      sorter: (a: ServicePackage, b: ServicePackage) => a.price - b.price,
      render: (price: number) => price.toLocaleString('vi-VN'),
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
      render: (isActive: boolean) => (
        <Badge 
          status={isActive !== false ? 'success' : 'default'} 
          text={isActive !== false ? 'Hoạt động' : 'Không hoạt động'} 
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: ServicePackage) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
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
        </Space>
      ),
    },
  ];

  // Modal form
  const renderModal = () => (
    <Modal
      title={editingPackage ? 'Chỉnh sửa gói dịch vụ' : 'Thêm gói dịch vụ mới'}
      open={modalVisible}
      onCancel={handleModalCancel}
      footer={[
        <Button key="cancel" onClick={handleModalCancel}>
          Hủy
        </Button>,
        <Button
          key="submit" 
          type="primary"
          onClick={() => form.submit()}
        >
          {editingPackage ? 'Cập nhật' : 'Tạo mới'}
        </Button>,
      ]}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFormSubmit}
      >
        <Form.Item
          label="Tên gói dịch vụ"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên gói dịch vụ' }]}
        >
          <Input placeholder="Nhập tên gói dịch vụ" />
        </Form.Item>

        <Form.Item
          label="Mô tả"
          name="description"
        >
          <TextArea rows={3} placeholder="Nhập mô tả gói dịch vụ" />
        </Form.Item>

        <Form.Item
          label="Dịch vụ trong gói"
          name="services"
          rules={[{ required: true, message: 'Vui lòng chọn ít nhất một dịch vụ' }]}
        >
          <Form.List name="services">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'serviceId']}
                      rules={[{ required: true, message: 'Chọn dịch vụ' }]}
                    >
                      <Select placeholder="Chọn dịch vụ" style={{ width: 300 }}>
                        {services.map(service => (
                          <Option key={service._id} value={service._id}>
                            {service.serviceName} - {service.price.toLocaleString('vi-VN')} VNĐ
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: 'Nhập số lượng' }]}
                    >
                      <InputNumber min={1} placeholder="Số lượng" />
                    </Form.Item>
                    <Button onClick={() => remove(name)} icon={<DeleteOutlined />} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                    Thêm dịch vụ
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form.Item>

        <Form.Item
          label="Thời hạn sử dụng (ngày)"
          name="durationInDays"
          rules={[{ required: true, message: 'Vui lòng nhập thời hạn' }]}
        >
          <InputNumber min={1} max={365} placeholder="Số ngày" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Giá gói (VNĐ)"
          name="price"
          rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
        >
          <InputNumber 
            min={0} 
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
            placeholder="Giá gói dịch vụ" 
            style={{ width: '100%' }} 
          />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="isActive"
          valuePropName="checked"
        >
          <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
        </Form.Item>
      </Form>
    </Modal>
  );

  return (
    <>
      {/* ✅ FIX: Add error display */}
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
      
      <StandardManagementPage
        title="Quản lý gói dịch vụ"
        subtitle="Quản lý các gói dịch vụ và pricing của hệ thống"
        stats={stats}
        filters={filters}
        onSearch={handleSearch}
        searchPlaceholder="Tìm kiếm theo tên gói, mô tả..."
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
        loading={loading}
      >
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="_id"
          loading={loading}
          pagination={{
            total: filteredItems.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} gói dịch vụ`,
          }}
        />
      </StandardManagementPage>
      
      {renderModal()}
    </>
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