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
  Popover,
  Dropdown
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  CustomerServiceOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  FilterOutlined,
  CopyOutlined,
  UndoOutlined as RecoverOutlined
} from '@ant-design/icons';
import { 
  getServices, 
  searchServices, 
  createService, 
  updateService, 
  deleteService, 
  recoverService,
  type GetServicesParams,
  type SearchServicesParams
} from '../../../api/endpoints/serviceApi';
import type { Service, CreateServiceRequest, UpdateServiceRequest } from '../../../types';

const { Option } = Select;
const { Search } = Input;
const { Text, Title } = Typography;
const { confirm } = Modal;

const ManagerServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form] = Form.useForm();

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [selectedAvailableAt, setSelectedAvailableAt] = useState<string>('');
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
      `${range[0]}-${range[1]} của ${total} dịch vụ`,
  });

  // Load services data
  useEffect(() => {
    if (!isSearchMode) {
      loadServices();
    }
  }, [pagination.current, pagination.pageSize, includeDeleted, isSearchMode]);

  const loadServices = async () => {
    try {
      setLoading(true);
      
      const params: GetServicesParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        includeDeleted
      };

      if (selectedServiceType) {
        params.serviceType = selectedServiceType as any;
      }
      if (selectedAvailableAt) {
        params.availableAt = selectedAvailableAt as any;
      }

      const response = await getServices(params);
      
      if (response.success) {
        setServices(response.data.services);
        setFilteredServices(response.data.services);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }));
      }
    } catch (error: any) {
      console.error('Error loading services:', error);
      message.error('Không thể tải dữ liệu dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  // Handle search - chỉ chạy khi nhấn nút
  const handleSearch = async () => {
    if (!searchText.trim() && !selectedServiceType && !selectedAvailableAt) {
      // Nếu không có gì để search, quay về mode bình thường
      setIsSearchMode(false);
      setPagination(prev => ({ ...prev, current: 1 }));
      return;
    }

    try {
      setSearchLoading(true);
      setIsSearchMode(true);
      
      const params: SearchServicesParams = {
        page: 1, // Reset về trang 1 khi search
        limit: pagination.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (searchText.trim()) {
        params.search = searchText.trim();
      }
      if (selectedServiceType) {
        params.serviceType = selectedServiceType as any;
      }
      if (selectedAvailableAt) {
        params.availableAt = selectedAvailableAt as any;
      }

      const response = await searchServices(params);
      
      if (response.success) {
        setServices(response.data.services);
        setFilteredServices(response.data.services);
        setPagination(prev => ({
          ...prev,
          current: 1,
          total: response.data.pagination.total
        }));
      }
    } catch (error: any) {
      console.error('Error searching services:', error);
      message.error('Lỗi khi tìm kiếm dịch vụ');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle pagination change trong search mode
  const handleSearchPagination = async (page: number, pageSize?: number) => {
    if (!isSearchMode) return;

    try {
      setSearchLoading(true);
      
      const params: SearchServicesParams = {
        page,
        limit: pageSize || pagination.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (searchText.trim()) {
        params.search = searchText.trim();
      }
      if (selectedServiceType) {
        params.serviceType = selectedServiceType as any;
      }
      if (selectedAvailableAt) {
        params.availableAt = selectedAvailableAt as any;
      }

      const response = await searchServices(params);
      
      if (response.success) {
        setServices(response.data.services);
        setFilteredServices(response.data.services);
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
    setSelectedServiceType('');
    setSelectedAvailableAt('');
    setIsSearchMode(false);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.setFieldsValue({
      serviceName: service.serviceName,
      price: service.price,
      description: service.description,
      serviceType: service.serviceType,
      availableAt: service.availableAt
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (service: Service) => {
    confirm({
      title: 'Xác nhận xóa dịch vụ',
      content: `Bạn có chắc chắn muốn xóa dịch vụ "${service.serviceName}" không?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteService(service._id);
          message.success('Xóa dịch vụ thành công!');
          if (isSearchMode) {
            handleSearch();
          } else {
            loadServices();
          }
        } catch (error: any) {
          message.error(error.message || 'Không thể xóa dịch vụ');
        }
      }
    });
  };

  const handleRecover = async (service: Service) => {
    try {
      await recoverService(service._id);
      message.success('Khôi phục dịch vụ thành công!');
      if (isSearchMode) {
        handleSearch();
      } else {
        loadServices();
      }
    } catch (error: any) {
      message.error(error.message || 'Không thể khôi phục dịch vụ');
    }
  };

  const handleDuplicate = (service: Service) => {
    setEditingService({
      ...service,
      serviceName: `${service.serviceName} (Bản sao)`,
      _id: '' // Clear ID để tạo mới
    });
    form.setFieldsValue({
      serviceName: `${service.serviceName} (Bản sao)`,
      price: service.price,
      description: service.description,
      serviceType: service.serviceType,
      availableAt: service.availableAt
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingService && editingService._id) {
        // Update existing service
        const updateData: UpdateServiceRequest = {
          serviceName: values.serviceName,
          price: values.price,
          description: values.description,
          serviceType: values.serviceType,
          availableAt: values.availableAt
        };
        await updateService(editingService._id, updateData);
        message.success('Cập nhật dịch vụ thành công!');
      } else {
        // Create new service
        const createData: CreateServiceRequest = {
          serviceName: values.serviceName,
          price: values.price,
          description: values.description,
          serviceType: values.serviceType,
          availableAt: values.availableAt
        };
        await createService(createData);
        message.success('Tạo dịch vụ thành công!');
      }
      
      setIsModalVisible(false);
      setEditingService(null);
      form.resetFields();
      
      if (isSearchMode) {
        handleSearch();
      } else {
        loadServices();
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingService(null);
    form.resetFields();
  };

  // Table columns
  const columns = [
    {
      title: 'Tên dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: 200,
      render: (text: string, record: Service) => (
        <div>
          <Text strong>{text}</Text>
          {record.isDeleted === 1 && (
            <Tag color="red" style={{ marginLeft: 8 }}>Đã xóa</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Loại dịch vụ',
      dataIndex: 'serviceType',
      key: 'serviceType',
      width: 120,
      render: (type: string) => {
        const typeMap = {
          consultation: { text: 'Tư vấn', color: 'blue' },
          test: { text: 'Xét nghiệm', color: 'green' },
          treatment: { text: 'Điều trị', color: 'orange' },
          other: { text: 'Khác', color: 'default' }
        };
        const config = typeMap[type as keyof typeof typeMap] || typeMap.other;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Giá (VNĐ)',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {price.toLocaleString('vi-VN')}
        </Text>
      ),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'availableAt',
      key: 'availableAt',
      width: 150,
      render: (locations: string[]) => (
        <div>
          {locations.map(location => {
            const locationMap = {
              'Athome': { text: 'Tại nhà', color: 'purple' },
              'Online': { text: 'Trực tuyến', color: 'cyan' },
              'Center': { text: 'Trung tâm', color: 'geekblue' }
            };
            const config = locationMap[location as keyof typeof locationMap];
            return config ? (
              <Tag key={location} color={config.color} style={{ marginBottom: 4 }}>
                {config.text}
              </Tag>
            ) : null;
          })}
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
      render: (_, record: Service) => {
        const items = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Chỉnh sửa',
            onClick: () => handleEdit(record),
            disabled: record.isDeleted === 1
          },
          {
            key: 'duplicate',
            icon: <CopyOutlined />,
            label: 'Nhân bản',
            onClick: () => handleDuplicate(record),
            disabled: record.isDeleted === 1
          },
          {
            type: 'divider' as const
          },
          record.isDeleted === 1 ? {
            key: 'recover',
            icon: <RecoverOutlined />,
            label: 'Khôi phục',
            onClick: () => handleRecover(record)
          } : {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Xóa',
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
  const activeServices = services.filter(s => s.isDeleted === 0).length;
  const deletedServices = services.filter(s => s.isDeleted === 1).length;
  const totalRevenue = services
    .filter(s => s.isDeleted === 0)
    .reduce((sum, s) => sum + s.price, 0);

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng số dịch vụ"
              value={services.length}
              prefix={<CustomerServiceOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={activeServices}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đã tạm dừng"
              value={deletedServices}
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
              Quản lý dịch vụ ({pagination.total})
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text>Hiện đã xóa:</Text>
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
          <Col xs={24} sm={12} md={6} lg={3}>
            <Select
              placeholder="Loại dịch vụ"
              value={selectedServiceType}
              onChange={setSelectedServiceType}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="consultation">Tư vấn</Option>
              <Option value="test">Xét nghiệm</Option>
              <Option value="treatment">Điều trị</Option>
              <Option value="other">Khác</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} lg={3}>
            <Select
              placeholder="Địa điểm"
              value={selectedAvailableAt}
              onChange={setSelectedAvailableAt}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="Athome">Tại nhà</Option>
              <Option value="Online">Trực tuyến</Option>
              <Option value="Center">Trung tâm</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} lg={14}>
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
                    loadServices();
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
                Thêm dịch vụ
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
          dataSource={filteredServices}
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

      {/* Service Modal */}
      <Modal
        title={editingService?._id ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="serviceName"
            label="Tên dịch vụ"
            rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ' }]}
          >
            <Input placeholder="Nhập tên dịch vụ" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá (VNĐ)"
                rules={[
                  { required: true, message: 'Vui lòng nhập giá' },
                  { 
                    pattern: /^[0-9]*$/,
                    message: 'Giá chỉ được chứa số'
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const numValue = Number(value);
                      if (numValue < 0) {
                        return Promise.reject(new Error('Giá phải lớn hơn 0'));
                      }
                      if (numValue > 100000000) {
                        return Promise.reject(new Error('Giá không được vượt quá 100 triệu VNĐ'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input type="number" placeholder="Nhập giá dịch vụ (tối đa 100 triệu)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="serviceType"
                label="Loại dịch vụ"
                rules={[{ required: true, message: 'Vui lòng chọn loại dịch vụ' }]}
              >
                <Select placeholder="Chọn loại dịch vụ">
                  <Option value="consultation">Tư vấn</Option>
                  <Option value="test">Xét nghiệm</Option>
                  <Option value="treatment">Điều trị</Option>
                  <Option value="other">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="availableAt"
            label="Địa điểm cung cấp"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một địa điểm' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn địa điểm cung cấp dịch vụ"
            >
              <Option value="Athome">Tại nhà</Option>
              <Option value="Online">Trực tuyến</Option>
              <Option value="Center">Trung tâm</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập mô tả chi tiết về dịch vụ"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleModalClose}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingService?._id ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagerServicesPage; 