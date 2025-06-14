import React, { useState } from 'react';
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

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

// NOTE: MOCKDATA - Dữ liệu giả cho development
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

const mockServices: Service[] = [
  {
    key: '1',
    id: 'SRV001',
    serviceName: 'Tư vấn sức khỏe sinh sản',
    serviceType: 'consultation',
    description: 'Tư vấn chuyên sâu về sức khỏe sinh sản, kế hoạch hóa gia đình và các vấn đề liên quan.',
    price: 300000,
    duration: 45,
    availableAt: 'Online',
    status: 'active',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  },
  {
    key: '2',
    id: 'SRV002',
    serviceName: 'Xét nghiệm STI cơ bản',
    serviceType: 'test',
    description: 'Gói xét nghiệm cơ bản cho các bệnh lây truyền qua đường tình dục phổ biến.',
    price: 800000,
    duration: 30,
    availableAt: 'Center',
    status: 'active',
    createdAt: '2024-01-16',
    updatedAt: '2024-01-22'
  },
  {
    key: '3',
    id: 'SRV003',
    serviceName: 'Tư vấn tâm lý tình dục',
    serviceType: 'consultation',
    description: 'Tư vấn tâm lý về các vấn đề tình dục, mối quan hệ và sức khỏe tâm thần.',
    price: 400000,
    duration: 60,
    availableAt: 'Online',
    status: 'active',
    createdAt: '2024-01-17',
    updatedAt: '2024-01-23'
  },
  {
    key: '4',
    id: 'SRV004',
    serviceName: 'Khám sức khỏe tổng quát',
    serviceType: 'treatment',
    description: 'Khám sức khỏe tổng quát định kỳ với focus vào sức khỏe sinh sản.',
    price: 1200000,
    duration: 90,
    availableAt: 'Center',
    status: 'active',
    createdAt: '2024-01-18',
    updatedAt: '2024-01-24'
  },
  {
    key: '5',
    id: 'SRV005',
    serviceName: 'Tư vấn dinh dưỡng thai kỳ',
    serviceType: 'consultation',
    description: 'Tư vấn chế độ dinh dưỡng và chăm sóc sức khỏe trong thai kỳ.',
    price: 350000,
    duration: 45,
    availableAt: 'Athome',
    status: 'inactive',
    createdAt: '2024-01-19',
    updatedAt: '2024-01-25'
  }
];

const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form] = Form.useForm();

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
      inactive: 'Không hoạt động',
      suspended: 'Tạm khóa'
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

  const handleDelete = (serviceId: string) => {
    setServices(services.filter(service => service.id !== serviceId));
    message.success('Xóa dịch vụ thành công!');
  };

  const handleStatusToggle = (serviceId: string) => {
    setServices(services.map(service => 
      service.id === serviceId 
        ? { ...service, status: service.status === 'active' ? 'inactive' : 'active' }
        : service
    ));
    message.success('Cập nhật trạng thái thành công!');
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      if (editingService) {
        // Update existing service
        setServices(services.map(service => 
          service.id === editingService.id 
            ? { ...service, ...values, updatedAt: new Date().toISOString().split('T')[0] }
            : service
        ));
        message.success('Cập nhật dịch vụ thành công!');
      } else {
        // Add new service
        const newService: Service = {
          key: Date.now().toString(),
          id: `SRV${Date.now()}`,
          ...values,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0]
        };
        setServices([...services, newService]);
        message.success('Thêm dịch vụ mới thành công!');
      }
      setIsModalVisible(false);
      setEditingService(null);
      form.resetFields();
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingService(null);
    form.resetFields();
  };

  const showServiceDetails = (service: Service) => {
    Modal.info({
      title: 'Chi tiết dịch vụ',
      width: 600,
      content: (
        <div style={{ marginTop: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <Text strong>Tên dịch vụ:</Text><br />
            <Text>{service.serviceName}</Text>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <Text strong>Loại dịch vụ:</Text><br />
            <Tag color={getServiceTypeColor(service.serviceType)}>
              {getServiceTypeText(service.serviceType)}
            </Tag>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <Text strong>Mô tả:</Text><br />
            <Text>{service.description}</Text>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <Text strong>Giá dịch vụ:</Text><br />
            <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
              {formatPrice(service.price)}
            </Text>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <Text strong>Thời gian:</Text><br />
            <Text>{service.duration} phút</Text>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <Text strong>Địa điểm thực hiện:</Text><br />
            <Tag color={getLocationColor(service.availableAt)}>
              {getLocationText(service.availableAt)}
            </Tag>
          </div>
          <div>
            <Text strong>Trạng thái:</Text><br />
            <Tag color={getStatusColor(service.status)}>
              {getStatusText(service.status)}
            </Tag>
          </div>
        </div>
      ),
    });
  };

  const columns: ColumnsType<Service> = [
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: 250,
      render: (name: string, record: Service) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
            {name}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            ID: {record.id}
          </div>
          <Tag 
            color={getServiceTypeColor(record.serviceType)} 
            style={{ marginTop: '4px' }}
          >
            {getServiceTypeText(record.serviceType)}
          </Tag>
        </div>
      )
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => (
        <Tooltip title={description}>
          <Text style={{ fontSize: '13px' }}>{description}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => (
        <div style={{ textAlign: 'right' }}>
          <Text strong style={{ color: '#52c41a', fontSize: '14px' }}>
            {formatPrice(price)}
          </Text>
        </div>
      ),
      sorter: (a, b) => {
        const aPrice = parseFloat(a.price.toString()) || 0;
        const bPrice = parseFloat(b.price.toString()) || 0;
        return aPrice - bPrice;
      }
    },
    {
      title: 'Thời gian',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ClockCircleOutlined style={{ color: '#1890ff' }} />
          <Text style={{ fontSize: '13px' }}>{duration}p</Text>
        </div>
      ),
      sorter: (a, b) => a.duration - b.duration
    },
    {
      title: 'Địa điểm',
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
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date: string) => (
        <span style={{ fontSize: '13px' }}>{date}</span>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record: Service) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => showServiceDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}>
            <Popconfirm
              title={`Bạn có chắc muốn ${record.status === 'active' ? 'tạm dừng' : 'kích hoạt'} dịch vụ này?`}
              onConfirm={() => handleStatusToggle(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button 
                type="text" 
                icon={<CustomerServiceOutlined />} 
                size="small"
                danger={record.status === 'active'}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa dịch vụ này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Quản lý dịch vụ
        </Title>
        <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
          NOTE: MOCKDATA - Quản lý các dịch vụ chăm sóc sức khỏe sinh sản
        </p>
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
              placeholder="Tìm kiếm dịch vụ..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: 150 }}
            >
              <Option value="all">Tất cả loại</Option>
              <Option value="consultation">Tư vấn</Option>
              <Option value="test">Xét nghiệm</Option>
              <Option value="treatment">Điều trị</Option>
              <Option value="other">Khác</Option>
            </Select>
            <Select
              value={selectedLocation}
              onChange={setSelectedLocation}
              style={{ width: 150 }}
            >
              <Option value="all">Tất cả địa điểm</Option>
              <Option value="Athome">Tại nhà</Option>
              <Option value="Online">Trực tuyến</Option>
              <Option value="Center">Tại trung tâm</Option>
            </Select>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 150 }}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Không hoạt động</Option>
              <Option value="suspended">Tạm khóa</Option>
            </Select>
          </Space>
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Thêm dịch vụ
          </Button>
        </div>

        {/* Table */}
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

      {/* Add/Edit Modal */}
      <Modal
        title={editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={700}
        okText={editingService ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'active' }}
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
            label="Mô tả dịch vụ"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <TextArea rows={3} placeholder="Nhập mô tả chi tiết về dịch vụ" />
          </Form.Item>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="price"
              label="Giá dịch vụ (VNĐ)"
              rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                placeholder="Nhập giá dịch vụ"
                style={{ width: '100%' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                min={0}
              />
            </Form.Item>
            
            <Form.Item
              name="duration"
              label="Thời gian (phút)"
              rules={[{ required: true, message: 'Vui lòng nhập thời gian!' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                placeholder="Nhập thời gian"
                style={{ width: '100%' }}
                min={15}
                max={300}
              />
            </Form.Item>
          </div>
          
          <Form.Item
            name="availableAt"
            label="Địa điểm thực hiện"
            rules={[{ required: true, message: 'Vui lòng chọn địa điểm!' }]}
          >
            <Select placeholder="Chọn địa điểm thực hiện">
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
            <Select>
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Không hoạt động</Option>
              <Option value="suspended">Tạm khóa</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ServiceManagement;