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
  Form,
  Typography,
  Tooltip,
  Popconfirm,
  InputNumber,
  message
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CustomerServiceOutlined,
  DollarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { servicesApi } from '../../../api/endpoints';
import { 
  canCreateService, 
  canUpdateService, 
  canDeleteService, 
  getCurrentUserRole 
} from '../../../utils/permissions';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

interface Service {
  key: string;
  id: string;
  serviceName: string;
  serviceType: 'consultation' | 'test' | 'treatment' | 'other';
  description: string;
  price: number;
  duration: number; // phút
  availableAt: 'Athome' | 'Online' | 'Center';
  status: 'active' | 'inactive' | 'suspended';
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form] = Form.useForm();
  
  // Get current user role for permissions
  const userRole = getCurrentUserRole();

  // Fetch real data
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await servicesApi.getServices({
        sortBy: 'createdAt',
        sortOrder: 'desc'
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
          // Handle availableAt field
          let availableAt: Service['availableAt'] = 'Center';
          if (Array.isArray(service.availableAt) && service.availableAt.length > 0) {
            const firstLocation = service.availableAt[0];
            if (['Athome', 'Online', 'Center'].includes(firstLocation)) {
              availableAt = firstLocation as Service['availableAt'];
            }
          } else if (typeof service.availableAt === 'string' && ['Athome', 'Online', 'Center'].includes(service.availableAt)) {
            availableAt = service.availableAt as Service['availableAt'];
          }
          return {
            key: service._id || service.id || index.toString(),
            id: service._id || service.id || index.toString(),
            serviceName: service.serviceName || service.name || 'N/A',
            description: service.description || '',
            price: service.price || 0,
            duration: service.duration || 30,
            serviceType: service.serviceType || 'other',
            availableAt,
            status: (service.isDeleted === 0 ? 'active' : 'inactive') as Service['status'],
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
            duration: 45,
            availableAt: 'Center',
            status: 'active',
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
            duration: 30,
            availableAt: 'Center',
            status: 'active',
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
    const matchesLocation = selectedLocation === 'all' || service.availableAt === selectedLocation;
    const matchesStatus = selectedStatus === 'all' || service.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesLocation && matchesStatus;
  });

  const getServiceTypeColor = (type: Service['serviceType']) => {
    const colors = {
      consultation: 'blue',
      test: 'green',
      treatment: 'orange',
      other: 'purple'
    };
    return colors[type];
  };

  const getServiceTypeText = (type: Service['serviceType']) => {
    const texts = {
      consultation: 'Tư vấn',
      test: 'Xét nghiệm',
      treatment: 'Điều trị',
      other: 'Khác'
    };
    return texts[type];
  };

  const getLocationColor = (location: Service['availableAt']) => {
    const colors = {
      Athome: 'cyan',
      Online: 'geekblue',
      Center: 'volcano'
    };
    return colors[location];
  };

  const getLocationText = (location: Service['availableAt']) => {
    const texts = {
      Athome: 'Tại nhà',
      Online: 'Trực tuyến',
      Center: 'Tại trung tâm'
    };
    return texts[location];
  };

  const getStatusColor = (status: Service['status']) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      suspended: 'error'
    };
    return colors[status];
  };

  const getStatusText = (status: Service['status']) => {
    const texts = {
      active: 'Hoạt động',
      inactive: 'Tạm dừng',
      suspended: 'Bị khóa'
    };
    return texts[status];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.setFieldsValue(service);
    setIsModalVisible(true);
  };

  const handleDelete = async (serviceId: string) => {
    try {
      // TODO: Implement delete API when backend is ready
      message.success('Xóa dịch vụ thành công (Mock)');
      // loadData();
    } catch (err: any) {
      message.error(err?.message || 'Không thể xóa dịch vụ');
    }
  };

  const handleStatusToggle = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const newStatus = service.status === 'active' ? 'inactive' : 'active';
      // Update status logic here
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingService) {
        // TODO: Implement update API when backend is ready
        message.success('Cập nhật dịch vụ thành công (Mock)');
      } else {
        // TODO: Implement create API when backend is ready
        message.success('Tạo dịch vụ thành công (Mock)');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingService(null);
      // loadData();
    } catch (err: any) {
      message.error(err?.message || 'Có lỗi xảy ra');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
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
          <p><strong>Thời gian:</strong> {service.duration} phút</p>
          <p><strong>Hình thức:</strong> {getLocationText(service.availableAt)}</p>
          <p><strong>Trạng thái:</strong> {getStatusText(service.status)}</p>
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
      title: 'Thời gian',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number) => (
        <Space>
          <ClockCircleOutlined />
          <Text>{duration} phút</Text>
        </Space>
      )
    },
    {
      title: 'Hình thức',
      dataIndex: 'availableAt',
      key: 'availableAt',
      width: 120,
      render: (location: Service['availableAt']) => (
        <Tag color={getLocationColor(location)}>
          {getLocationText(location)}
        </Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: Service['status']) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
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
          {canUpdateService(userRole) && (
            <Tooltip title="Chỉnh sửa">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {canDeleteService(userRole) && (
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
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <CustomerServiceOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Quản lý dịch vụ
          </Title>
          {canCreateService(userRole) && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              Thêm dịch vụ mới
            </Button>
          )}
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Search
            placeholder="Tìm kiếm theo tên hoặc mô tả dịch vụ..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
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
            <Option value="treatment">Điều trị</Option>
            <Option value="other">Khác</Option>
          </Select>

          <Select
            placeholder="Hình thức"
            style={{ width: 150 }}
            value={selectedLocation}
            onChange={setSelectedLocation}
          >
            <Option value="all">Tất cả hình thức</Option>
            <Option value="Athome">Tại nhà</Option>
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
            <Option value="inactive">Tạm dừng</Option>
            <Option value="suspended">Bị khóa</Option>
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

      <Modal
        title={editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText={editingService ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="serviceName"
            label="Tên dịch vụ"
            rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ!' }]}
          >
            <Input placeholder="Nhập tên dịch vụ" />
          </Form.Item>

          <Form.Item
            name="serviceType"
            label="Loại dịch vụ"
            rules={[{ required: true, message: 'Vui lòng chọn loại dịch vụ!' }]}
          >
            <Select placeholder="Chọn loại dịch vụ">
              <Option value="consultation">Tư vấn</Option>
              <Option value="test">Xét nghiệm</Option>
              <Option value="treatment">Điều trị</Option>
              <Option value="other">Khác</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <TextArea rows={3} placeholder="Nhập mô tả chi tiết về dịch vụ" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="price"
              label="Giá (VNĐ)"
              rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value: any) => (value || '').replace(/\$\s?|(,*)/g, '')}
                placeholder="Nhập giá dịch vụ"
              />
            </Form.Item>

            <Form.Item
              name="duration"
              label="Thời gian (phút)"
              rules={[{ required: true, message: 'Vui lòng nhập thời gian!' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                placeholder="Nhập thời gian"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="availableAt"
            label="Hình thức cung cấp"
            rules={[{ required: true, message: 'Vui lòng chọn hình thức!' }]}
          >
            <Select placeholder="Chọn hình thức cung cấp">
              <Option value="Athome">Tại nhà</Option>
              <Option value="Online">Trực tuyến</Option>
              <Option value="Center">Tại trung tâm</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Tạm dừng</Option>
              <Option value="suspended">Bị khóa</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ServiceManagement;