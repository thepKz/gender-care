import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Modal, 
  Form, 
  message, 
  Tag,
  Switch,
  Row,
  Col,
  Statistic,
  Tooltip,
  Badge,
  Typography,
  Dropdown
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  GiftOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  FilterOutlined,
  CopyOutlined,
  UndoOutlined as RecoverOutlined
} from '@ant-design/icons';
import { 
  getServicePackages, 
  searchServicePackages, 
  createServicePackage, 
  updateServicePackage, 
  deleteServicePackage, 
  recoverServicePackage,
  type GetServicePackagesParams,
  type SearchServicePackagesParams
} from '../../../api/endpoints/servicePackageApi';
import { getServices } from '../../../api/endpoints/serviceApi';
import type { ServicePackage, CreateServicePackageRequest, UpdateServicePackageRequest, Service } from '../../../types';

const { Option } = Select;
const { Search } = Input;
const { Text, Title } = Typography;
const { confirm } = Modal;

const ManagerServicePackagesPage: React.FC = () => {
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [filteredServicePackages, setFilteredServicePackages] = useState<ServicePackage[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingServicePackage, setEditingServicePackage] = useState<ServicePackage | null>(null);
  const [form] = Form.useForm();

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) =>
      `${range[0]}-${range[1]} của ${total} gói dịch vụ`,
  });

  // Load data
  useEffect(() => {
    loadAvailableServices();
    if (!isSearchMode) {
      loadServicePackages();
    }
  }, [pagination.current, pagination.pageSize, includeDeleted, isSearchMode]);

  const loadAvailableServices = async () => {
    try {
      const response = await getServices({ limit: 1000 }); // Load all services for selection
      if (response.success) {
        setAvailableServices(response.data.services.filter(s => s.isDeleted === 0));
      }
    } catch (error: any) {
      console.error('Error loading services:', error);
    }
  };

  const loadServicePackages = async () => {
    try {
      setLoading(true);
      
      const params: GetServicePackagesParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        includeDeleted
      };

      if (selectedServiceId) {
        params.serviceId = selectedServiceId;
      }

      const response = await getServicePackages(params);
      
      if (response.success) {
        setServicePackages(response.data.packages);
        setFilteredServicePackages(response.data.packages);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }));
      }
    } catch (error: any) {
      console.error('Error loading service packages:', error);
      message.error('Không thể tải dữ liệu gói dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  // Handle search - chỉ chạy khi nhấn nút
  const handleSearch = async () => {
    if (!searchText.trim() && !selectedServiceId) {
      // Nếu không có gì để search, quay về mode bình thường
      setIsSearchMode(false);
      setPagination(prev => ({ ...prev, current: 1 }));
      return;
    }

    try {
      setSearchLoading(true);
      setIsSearchMode(true);
      
      const params: SearchServicePackagesParams = {
        page: 1, // Reset về trang 1 khi search
        limit: pagination.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (searchText.trim()) {
        params.search = searchText.trim();
      }
      if (selectedServiceId) {
        params.serviceId = selectedServiceId;
      }

      const response = await searchServicePackages(params);
      
      if (response.success) {
        setServicePackages(response.data.packages);
        setFilteredServicePackages(response.data.packages);
        setPagination(prev => ({
          ...prev,
          current: 1,
          total: response.data.pagination.total
        }));
      }
    } catch (error: any) {
      console.error('Error searching service packages:', error);
      message.error('Lỗi khi tìm kiếm gói dịch vụ');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle pagination change trong search mode
  const handleSearchPagination = async (page: number, pageSize?: number) => {
    if (!isSearchMode) return;

    try {
      setSearchLoading(true);
      
      const params: SearchServicePackagesParams = {
        page,
        limit: pageSize || pagination.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (searchText.trim()) {
        params.search = searchText.trim();
      }
      if (selectedServiceId) {
        params.serviceId = selectedServiceId;
      }

      const response = await searchServicePackages(params);
      
      if (response.success) {
        setServicePackages(response.data.packages);
        setFilteredServicePackages(response.data.packages);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: pageSize || prev.pageSize,
          total: response.data.pagination.total
        }));
      }
    } catch (error: any) {
      console.error('Error in search pagination:', error);
      message.error('Lỗi khi chuyển trang');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchText('');
    setSelectedServiceId('');
    setIsSearchMode(false);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleEdit = (servicePackage: ServicePackage) => {
    setEditingServicePackage(servicePackage);
    form.setFieldsValue({
      name: servicePackage.name,
      description: servicePackage.description,
      priceBeforeDiscount: servicePackage.priceBeforeDiscount,
      price: servicePackage.price,
      serviceIds: servicePackage.serviceIds.map(s => typeof s === 'object' ? s._id : s)
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (servicePackage: ServicePackage) => {
    confirm({
      title: 'Xác nhận xóa gói dịch vụ',
      content: `Bạn có chắc chắn muốn xóa gói dịch vụ "${servicePackage.name}" không?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteServicePackage(servicePackage._id);
          message.success('Xóa gói dịch vụ thành công!');
          if (isSearchMode) {
            handleSearch();
          } else {
            loadServicePackages();
          }
        } catch (error: any) {
          message.error(error.message || 'Không thể xóa gói dịch vụ');
        }
      }
    });
  };

  const handleRecover = async (servicePackage: ServicePackage) => {
    try {
      await recoverServicePackage(servicePackage._id);
      message.success('Khôi phục gói dịch vụ thành công!');
      if (isSearchMode) {
        handleSearch();
      } else {
        loadServicePackages();
      }
    } catch (error: any) {
      message.error(error.message || 'Không thể khôi phục gói dịch vụ');
    }
  };

  const handleDuplicate = (servicePackage: ServicePackage) => {
    setEditingServicePackage({
      ...servicePackage,
      name: `${servicePackage.name} (Bản sao)`,
      _id: '' // Clear ID để tạo mới
    });
    form.setFieldsValue({
      name: `${servicePackage.name} (Bản sao)`,
      description: servicePackage.description,
      priceBeforeDiscount: servicePackage.priceBeforeDiscount,
      price: servicePackage.price,
      serviceIds: servicePackage.serviceIds.map(s => typeof s === 'object' ? s._id : s)
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingServicePackage && editingServicePackage._id) {
        // Update existing service package
        const updateData: UpdateServicePackageRequest = {
          name: values.name,
          description: values.description,
          priceBeforeDiscount: values.priceBeforeDiscount,
          price: values.price,
          serviceIds: values.serviceIds
        };
        await updateServicePackage(editingServicePackage._id, updateData);
        message.success('Cập nhật gói dịch vụ thành công!');
      } else {
        // Create new service package
        const createData: CreateServicePackageRequest = {
          name: values.name,
          description: values.description,
          priceBeforeDiscount: values.priceBeforeDiscount,
          price: values.price,
          serviceIds: values.serviceIds
        };
        await createServicePackage(createData);
        message.success('Tạo gói dịch vụ thành công!');
      }
      
      setIsModalVisible(false);
      setEditingServicePackage(null);
      form.resetFields();
      
      if (isSearchMode) {
        handleSearch();
      } else {
        loadServicePackages();
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingServicePackage(null);
    form.resetFields();
  };

  // Tính toán tự động giá gốc từ dịch vụ được chọn
  const calculateTotalPrice = (serviceIds: string[]) => {
    if (!serviceIds || serviceIds.length === 0) return 0;
    
    return serviceIds.reduce((total, serviceId) => {
      const service = availableServices.find(s => s._id === serviceId);
      return total + (service ? service.price : 0);
    }, 0);
  };

  // Watch changes trong form để cập nhật giá gốc
  const watchServiceIds = Form.useWatch('serviceIds', form);
  
  useEffect(() => {
    if (watchServiceIds && watchServiceIds.length > 0) {
      const totalPrice = calculateTotalPrice(watchServiceIds);
      form.setFieldValue('priceBeforeDiscount', totalPrice);
    } else {
      form.setFieldValue('priceBeforeDiscount', 0);
    }
  }, [watchServiceIds, availableServices, form]);

  // Table columns
  const columns = [
    {
      title: 'Tên gói',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: ServicePackage) => (
        <div>
          <Text strong>{text}</Text>
          {record.isActive === 0 && (
            <Tag color="red" style={{ marginLeft: 8 }}>Đã tạm dừng</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Giá gốc (VNĐ)',
      dataIndex: 'priceBeforeDiscount',
      key: 'priceBeforeDiscount',
      width: 120,
      render: (price: number) => (
        <Text style={{ textDecoration: 'line-through', color: '#999' }}>
          {price.toLocaleString('vi-VN')}
        </Text>
      ),
    },
    {
      title: 'Giá ưu đãi (VNĐ)',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number, record: ServicePackage) => {
        const discount = Math.round(((record.priceBeforeDiscount - price) / record.priceBeforeDiscount) * 100);
        return (
          <div>
            <Text strong style={{ color: '#1890ff' }}>
              {price.toLocaleString('vi-VN')}
            </Text>
            <Tag color="green" style={{ marginLeft: 8 }}>
              -{discount}%
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Dịch vụ bao gồm',
      dataIndex: 'serviceIds',
      key: 'serviceIds',
      width: 250,
      render: (services: any[]) => (
        <div>
          {services.slice(0, 2).map((service, index) => (
            <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
              {typeof service === 'object' ? service.serviceName : 'Dịch vụ'}
            </Tag>
          ))}
          {services.length > 2 && (
            <Tag color="default">+{services.length - 2} khác</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_, record: ServicePackage) => {
        const items = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Chỉnh sửa',
            onClick: () => handleEdit(record),
            disabled: record.isActive === 0
          },
          {
            key: 'duplicate',
            icon: <CopyOutlined />,
            label: 'Nhân bản',
            onClick: () => handleDuplicate(record),
            disabled: record.isActive === 0
          },
          {
            type: 'divider' as const
          },
          record.isActive === 0 ? {
            key: 'recover',
            icon: <RecoverOutlined />,
            label: 'Khôi phục',
            onClick: () => handleRecover(record)
          } : {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Tạm dừng',
            danger: true,
            onClick: () => handleDelete(record)
          }
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button type="text" icon={<EyeOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  // Statistics
  const activePackages = servicePackages.filter(p => p.isActive === 1).length;
  const inactivePackages = servicePackages.filter(p => p.isActive === 0).length;
  const totalSavings = servicePackages
    .filter(p => p.isActive === 1)
    .reduce((sum, p) => sum + (p.priceBeforeDiscount - p.price), 0);

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng số gói"
              value={servicePackages.length}
              prefix={<GiftOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={activePackages}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đã tạm dừng"
              value={inactivePackages}
              prefix={<StopOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>

      </Row>

      {/* Main Content */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              Quản lý gói dịch vụ ({pagination.total})
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text>Hiện đã tạm dừng:</Text>
              <Switch
                checked={includeDeleted}
                onChange={setIncludeDeleted}
                size="small"
              />
            </div>
          </div>
        }
      >
        {/* All Filters and Actions in One Row */}
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Input
              placeholder="Tìm kiếm theo tên hoặc mô tả..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Select
              placeholder="Lọc theo dịch vụ"
              value={selectedServiceId}
              onChange={setSelectedServiceId}
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {availableServices.map(service => (
                <Option key={service._id} value={service._id}>
                  {service.serviceName}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={12} lg={14}>
            <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={searchLoading}
                type="primary"
              >
                Tìm kiếm
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  if (isSearchMode) {
                    handleSearch();
                  } else {
                    loadServicePackages();
                  }
                }}
                loading={loading || searchLoading}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
              >
                Thêm gói dịch vụ
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Search Mode Indicator */}
        {isSearchMode && (
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue" closable onClose={() => {
              setIsSearchMode(false);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}>
              Đang trong chế độ tìm kiếm
              {searchText && `: "${searchText}"`}
            </Tag>
          </div>
        )}

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredServicePackages}
          rowKey="_id"
          loading={loading || searchLoading}
          pagination={{
            ...pagination,
            onChange: isSearchMode ? handleSearchPagination : (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
            },
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>

      {/* Service Package Modal */}
      <Modal
        title={editingServicePackage?._id ? 'Chỉnh sửa gói dịch vụ' : 'Thêm gói dịch vụ mới'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Tên gói dịch vụ"
            rules={[{ required: true, message: 'Vui lòng nhập tên gói dịch vụ' }]}
          >
            <Input placeholder="Nhập tên gói dịch vụ" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priceBeforeDiscount"
                label="Giá gốc (VNĐ)"
              >
                <Input 
                  disabled 
                  placeholder="Tự động tính từ tổng giá dịch vụ" 
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá ưu đãi (VNĐ)"
                rules={[
                  { required: true, message: 'Vui lòng nhập giá ưu đãi' },
                  { 
                    pattern: /^[0-9]*$/,
                    message: 'Giá chỉ được chứa số'
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const numValue = Number(value);
                      if (numValue < 0) {
                        return Promise.reject(new Error('Giá phải lớn hơn hoặc bằng 0'));
                      }
                      if (numValue > 100000000) {
                        return Promise.reject(new Error('Giá không được vượt quá 100 triệu'));
                      }
                      return Promise.resolve();
                    },
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const originalPrice = getFieldValue('priceBeforeDiscount');
                      if (!value || !originalPrice || Number(value) <= Number(originalPrice)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Giá ưu đãi phải nhỏ hơn hoặc bằng giá gốc'));
                    },
                  }),
                ]}
              >
                <Input placeholder="Nhập giá ưu đãi" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="serviceIds"
            label="Dịch vụ bao gồm"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một dịch vụ' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn các dịch vụ trong gói"
              showSearch
              optionFilterProp="children"
            >
              {availableServices.map(service => (
                <Option key={service._id} value={service._id}>
                  {service.serviceName} - {service.price.toLocaleString('vi-VN')} VNĐ
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập mô tả chi tiết về gói dịch vụ"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleModalClose}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingServicePackage?._id ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagerServicePackagesPage; 