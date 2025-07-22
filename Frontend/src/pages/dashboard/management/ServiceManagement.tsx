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
  Typography,
  Tooltip,
  Popconfirm,
  message,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CustomerServiceOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  UndoOutlined,
  CheckOutlined,
  StopOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { servicesApi } from '../../../api/endpoints';
import { 
  canCreateService, 
  canUpdateService, 
  canDeleteService, 
  getCurrentUserRole 
} from '../../../utils/permissions';
import { getServices, deleteService, GetServicesParams } from '../../../api/endpoints/serviceApi';
import { recoverService, updateService, createService, toggleServiceStatus } from '../../../api/endpoints/serviceApi';
import ServiceModal from '../../../components/ui/forms/ServiceModal';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

interface Service {
  key: string;
  id: string;
  serviceName: string;
  serviceType: 'consultation' | 'test' | 'treatment';
  description: string;
  price: number;
  availableAt: ('Athome' | 'Online' | 'Center')[];
  status: 'active' | 'inactive' | 'suspended';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('default');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Get current user role for permissions
  const userRole = getCurrentUserRole();

  // Fetch real data
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getServices({
        sortBy: 'createdAt',
        sortOrder: 'desc',
        includeDeleted: true
      });
      
      console.log('🔍 API Response:', response);
      
      // --- Extract rawServices robustly ---
      let rawServices: any[] = [];
      const resAny: any = response;
      if (Array.isArray(resAny?.data)) {
        rawServices = resAny.data;
      } else if (Array.isArray(resAny?.data?.services)) {
        rawServices = resAny.data.services;
      } else if (Array.isArray(resAny?.data?.data?.services)) {
        rawServices = resAny.data.data.services;
      } else if (Array.isArray(resAny?.services)) {
        rawServices = resAny.services;
      }
      
      console.log('📊 Raw Services length:', rawServices.length);
      
      if (rawServices.length > 0) {
        // Map to component format
        const convertedServices = rawServices.map((service: any, index: number) => {
          // Handle availableAt field - now supports multiple selections
          let availableAt: Service['availableAt'] = ['Center'];
          if (Array.isArray(service.availableAt)) {
            availableAt = service.availableAt.filter(location => 
              ['Athome', 'Online', 'Center'].includes(location)
            );
          } else if (typeof service.availableAt === 'string' && ['Athome', 'Online', 'Center'].includes(service.availableAt)) {
            availableAt = [service.availableAt as any];
          }
          
          // Ensure at least one location is selected
          if (availableAt.length === 0) {
            availableAt = ['Center'];
          }
          return {
            key: service._id || service.id || index.toString(),
            id: service._id || service.id || index.toString(),
            serviceName: service.serviceName || service.name || 'N/A',
            description: service.description || '',
            price: service.price || 0,
            serviceType: service.serviceType || 'consultation',
            availableAt,
            status: service.isDeleted === 1 ? 'inactive' : 'active' as Service['status'],
            isDeleted: service.isDeleted === 1,
            createdAt: service.createdAt || new Date().toISOString(),
            updatedAt: service.updatedAt || new Date().toISOString()
          };
        });
        
        console.log('✅ Converted Services:', convertedServices);
        setServices(convertedServices);
      } else {
        // Fallback mock data
        const mockServices: Service[] = [
          {
            key: '1',
            id: '1',
            serviceName: 'Tư vấn sức khỏe sinh sản',
            serviceType: 'consultation',
            description: 'Tư vấn về sức khỏe sinh sản và kế hoạch hóa gia đình',
            price: 500000,
            availableAt: ['Center'],
            status: 'active',
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            key: '2', 
            id: '2',
            serviceName: 'Xét nghiệm STI',
            serviceType: 'test',
            description: 'Xét nghiệm các bệnh lây truyền qua đường tình dục',
            price: 800000,
            availableAt: ['Center'],
            status: 'active',
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setServices(mockServices);
      }
    } catch (err: any) {
      message.error(err?.message || 'Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter services based on search and filters
  const filteredServices = services.filter(service => {    
    const matchesSearch = service.serviceName.toLowerCase().includes(searchText.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = selectedType === 'all' || service.serviceType === selectedType;
    const matchesLocation = selectedLocation === 'all' || service.availableAt.includes(selectedLocation as any);
    
    // Handle status filtering including deleted services
    let matchesStatus = true;
    if (selectedStatus === 'active') {
      matchesStatus = service.status === 'active' && !service.isDeleted;
    } else if (selectedStatus === 'deleted') {
      matchesStatus = service.isDeleted;
    } else {
      // selectedStatus === 'all' - show all services
      matchesStatus = true;
    }
    
    return matchesSearch && matchesType && matchesLocation && matchesStatus;
  }).sort((a, b) => {
    // ✅ NEW: Apply sorting logic
    switch (sortOption) {
      case 'name-asc':
        return a.serviceName.localeCompare(b.serviceName, 'vi', { sensitivity: 'base' });
      case 'name-desc':
        return b.serviceName.localeCompare(a.serviceName, 'vi', { sensitivity: 'base' });
      case 'price-high':
        return b.price - a.price;
      case 'price-low':
        return a.price - b.price;
      default:
        return 0; // No sorting for 'default'
    }
  });

  const getServiceTypeColor = (type: Service['serviceType']) => {
    const colors = {
      consultation: 'blue',
      test: 'green',
      treatment: 'orange'
    };
    return colors[type];
  };

  const getServiceTypeText = (type: Service['serviceType']) => {
    const texts = {
      consultation: 'Tư vấn',
      test: 'Xét nghiệm',
      treatment: 'Điều trị'
    };
    return texts[type];
  };

  const getLocationColor = (location: string) => {
    const colors: Record<string, string> = {
      Athome: 'cyan',
      Online: 'geekblue',
      Center: 'volcano'
    };
    return colors[location] || 'default';
  };

  const getLocationText = (location: string) => {
    const texts: Record<string, string> = {
      Online: 'Trực tuyến',
      Center: 'Tại trung tâm',
      Athome: 'Tại nhà'
    };
    return texts[location] || location;
  };

  const getStatusColor = (service: Service) => {
    if (service.isDeleted) return 'error'
    return service.status === 'active' ? 'success' : 'warning'
  }

  const getStatusText = (service: Service) => {
    if (service.isDeleted) return 'Ngưng hoạt động'
    return service.status === 'active' ? 'Hoạt động' : 'Không hoạt động'
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Reset all filters to initial state
  const handleResetFilters = () => {
    setSearchText('');
    setSelectedType('all');
    setSelectedLocation('all');
    setSelectedStatus('all');
    setSortOption('default');
    loadData();
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsModalVisible(true);
  };

  const handleDelete = async (serviceId: string) => {
    try {
      await deleteService(serviceId);
      message.success('Dịch vụ đã được xóa thành công');
      loadData();
    } catch (err: any) {
      message.error(err?.message || 'Không thể xóa dịch vụ');
    }
  };

  const handleRecover = async (serviceId: string) => {
    try {
      await recoverService(serviceId);
      message.success('Dịch vụ đã được khôi phục thành công');
      loadData();
    } catch (err: any) {
      message.error(err?.message || 'Không thể khôi phục dịch vụ');
    }
  };

  const handleStatusToggle = async (serviceId: string) => {
    try {
      await toggleServiceStatus(serviceId);
      const service = services.find(s => s.id === serviceId);
      const newStatus = service?.status === 'active' ? 'vô hiệu hóa' : 'kích hoạt';
      message.success(`Đã ${newStatus} dịch vụ thành công`);
      loadData();
    } catch (err: any) {
      message.error(err?.message || 'Không thể thay đổi trạng thái dịch vụ');
    }
  };

  const handleServiceSubmit = async (data: any) => {
    try {
      if (editingService) {
        // Cập nhật dịch vụ hiện có
        await updateService(editingService.id, data);
        message.success('Cập nhật dịch vụ thành công');
      } else {
        // Tạo dịch vụ mới
        await createService(data);
        message.success('Tạo dịch vụ thành công');
      }
      setIsModalVisible(false);
      setEditingService(null);
      loadData();
    } catch (err: any) {
      message.error(err?.message || 'Có lỗi xảy ra');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingService(null);
  };

  const showServiceDetails = (service: Service) => {
    Modal.info({
      title: 'Chi tiết dịch vụ',
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <p><strong>Mã dịch vụ:</strong> {service.id}</p>
          <p><strong>Tên dịch vụ:</strong> {service.serviceName}</p>
          <p><strong>Loại dịch vụ:</strong> {getServiceTypeText(service.serviceType)}</p>
          <p><strong>Mô tả:</strong> {service.description}</p>
          <p><strong>Giá:</strong> {formatPrice(service.price)}</p>
          <p><strong>Hình thức:</strong> {service.availableAt.map(loc => getLocationText(loc)).join(', ')}</p>
          <p><strong>Trạng thái:</strong> {getStatusText(service)}</p>
          <p><strong>Ngày tạo:</strong> {new Date(service.createdAt).toLocaleDateString('vi-VN')}</p>
          <p><strong>Cập nhật:</strong> {new Date(service.updatedAt).toLocaleDateString('vi-VN')}</p>
        </div>
      ),
    });
  };

  const columns: ColumnsType<Service> = [
    {
      title: 'Mã dịch vụ',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: 'Tên dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: 200,
      render: (text: string, record: Service) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description.length > 50 
              ? `${record.description.substring(0, 50)}...` 
              : record.description}
          </Text>
        </div>
      )
    },
    {
      title: 'Loại dịch vụ',
      dataIndex: 'serviceType',
      key: 'serviceType',
      width: 120,
      render: (type: Service['serviceType']) => (
        <Tag color={getServiceTypeColor(type)}>
          {getServiceTypeText(type)}
        </Tag>
      )
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {formatPrice(price)}
        </Text>
      ),
      sorter: (a, b) => a.price - b.price
    },
    {
      title: 'Hình thức',
      dataIndex: 'availableAt',
      key: 'availableAt',
      width: 120,
      render: (locations: Service['availableAt']) => (
        <div>
          {locations.map(location => (
            <Tag key={location} color={getLocationColor(location)} style={{ marginBottom: '4px' }}>
              {getLocationText(location)}
            </Tag>
          ))}
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (_, record: Service) => (
        <Tag color={getStatusColor(record)}>
          {getStatusText(record)}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record: Service) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => showServiceDetails(record)}
            />
          </Tooltip>
          {canUpdateService(userRole) && !record.isDeleted && (
            <Tooltip title="Chỉnh sửa">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {canDeleteService(userRole) && !record.isDeleted && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa dịch vụ này?"
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
          {canDeleteService(userRole) && record.isDeleted && (
            <Tooltip title="Khôi phục">
              <Popconfirm
                title="Bạn có chắc chắn muốn khôi phục dịch vụ này?"
                onConfirm={() => handleRecover(record.id)}
                okText="Có"
                cancelText="Không"
              >
                <Button 
                  type="text" 
                  icon={<UndoOutlined />} 
                  style={{ color: '#52c41a' }}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  // Calculate stats
  const stats = {
    total: services.length,
    active: services.filter(s => !s.isDeleted).length,
    deleted: services.filter(s => s.isDeleted).length
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <CustomerServiceOutlined style={{ marginRight: '8px' }} />
          Quản lý dịch vụ
        </Title>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng dịch vụ"
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

      <Card>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            Danh sách dịch vụ
          </Title>
          <Space>
            {canCreateService(userRole) && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
              >
                Thêm dịch vụ mới
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={handleResetFilters}
            >
              Làm mới
            </Button>
          </Space>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Search
            placeholder="Tìm kiếm theo tên hoặc mô tả dịch vụ..."
            allowClear
            style={{ width: 250 }}
            className="search-blue-button"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={(value) => setSearchText(value)}
          />
          
          <Select
            placeholder="Loại dịch vụ"
            style={{ width: 150 }}
            value={selectedType}
            onChange={setSelectedType}
          >
            <Option value="all">Tất cả loại</Option>
            <Option value="consultation">Tư vấn</Option>
            <Option value="test">Xét nghiệm</Option>
          </Select>

          <Select
            placeholder="Hình thức"
            style={{ width: 150 }}
            value={selectedLocation}
            onChange={setSelectedLocation}
          >
            <Option value="all">Tất cả hình thức</Option>
            <Option value="Online">Trực tuyến</Option>
            <Option value="Center">Tại trung tâm</Option>
          </Select>

          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="active">Hoạt động</Option>
            <Option value="deleted">Ngưng hoạt động</Option>
          </Select>

          {/* ✅ NEW: Sort dropdown */}
          <Select
            placeholder="Sắp xếp"
            style={{ width: 200 }}
            value={sortOption}
            onChange={setSortOption}
          >
            <Option value="default">Mặc định</Option>
            <Option value="name-asc">Tên: A → Z</Option>
            <Option value="name-desc">Tên: Z → A</Option>
            <Option value="price-high">Giá: Cao → Thấp</Option>
            <Option value="price-low">Giá: Thấp → Cao</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredServices}
          loading={loading}
          pagination={{
            total: filteredServices.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} dịch vụ`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <ServiceModal
        visible={isModalVisible}
        onCancel={handleModalCancel}
        onSubmit={handleServiceSubmit}
        service={editingService}
        loading={loading}
      />
    </div>
  );
};

export default ServiceManagement;