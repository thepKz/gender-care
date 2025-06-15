import React, { useState, useEffect } from 'react';
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
  Descriptions
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  UndoOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { 
  getServicePackages, 
  createServicePackage, 
  updateServicePackage, 
  deleteServicePackage,
  recoverServicePackage,
  GetServicePackagesParams 
} from '../../../api/endpoints/servicePackageApi';
import { getServices } from '../../../api/endpoints/serviceApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ServicePackage {
  _id: string;
  name: string;
  description: string;
  services: Array<{
    serviceId: {
      _id: string;
      serviceName: string;
      price: number;
    };
    quantity: number;
  }>;
  totalPrice: number;
  discountPrice: number;
  discountPercentage: number;
  isActive: boolean;
  isDeleted: boolean;
  deleteNote?: string;
  createdAt: string;
  updatedAt: string;
}

interface Service {
  _id: string;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
}

const ServicePackageManagement: React.FC = () => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    loadData();
    loadServices();
  }, [showDeleted]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: GetServicePackagesParams = {
        sortBy: 'createdAt',
        sortOrder: 'desc',
        includeDeleted: showDeleted
      };
      
      if (searchText) {
        params.search = searchText;
      }

      const response = await getServicePackages(params);
      
      if (response.success && response.data?.packages) {
        // Map backend format to frontend format
        const mappedPackages = response.data.packages.map((pkg: any) => ({
          _id: pkg._id,
          name: pkg.name,
          description: pkg.description,
          services: pkg.services || [],
          totalPrice: pkg.priceBeforeDiscount || 0,
          discountPrice: pkg.price || 0,
          discountPercentage: pkg.priceBeforeDiscount > 0 ? 
            ((pkg.priceBeforeDiscount - pkg.price) / pkg.priceBeforeDiscount * 100) : 0,
          isActive: pkg.isActive === 1,
          isDeleted: pkg.isActive === 0,
          deleteNote: pkg.deleteNote,
          createdAt: pkg.createdAt,
          updatedAt: pkg.updatedAt
        }));
        setPackages(mappedPackages);
      } else {
        setPackages([]);
      }
    } catch (err: any) {
      message.error(err?.message || 'Không thể tải danh sách gói dịch vụ');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const response = await getServices({
        sortBy: 'serviceName',
        sortOrder: 'asc'
      });
      
      if (response.success && response.data?.services) {
        // Map backend service format to frontend format
        const mappedServices = response.data.services
          .filter((s: any) => !s.isDeleted)
          .map((s: any) => ({
            _id: s._id,
            name: s.serviceName,
            price: s.price,
            description: s.description,
            isActive: !s.isDeleted
          }));
        setServices(mappedServices);
      } else {
        setServices([]);
      }
    } catch (err: any) {
      console.error('Không thể tải danh sách dịch vụ:', err);
      setServices([]);
    }
  };

  const handleEdit = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    form.setFieldsValue({
      name: pkg.name,
      description: pkg.description,
      services: pkg.services.map(s => ({
        serviceId: s.serviceId._id,
        quantity: s.quantity
      })),
      discountPrice: pkg.discountPrice,
      isActive: pkg.isActive
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (packageId: string) => {
    Modal.confirm({
      title: 'Xóa gói dịch vụ',
      content: (
        <Form
          layout="vertical"
          onFinish={async (values) => {
            try {
              await deleteServicePackage(packageId, values.deleteNote);
              message.success('Xóa gói dịch vụ thành công');
              loadData();
              Modal.destroyAll();
            } catch (err: any) {
              message.error(err?.message || 'Không thể xóa gói dịch vụ');
            }
          }}
        >
          <Form.Item
            name="deleteNote"
            label="Lý do xóa"
            rules={[{ required: true, message: 'Vui lòng nhập lý do xóa' }]}
          >
            <TextArea rows={3} placeholder="Nhập lý do xóa gói dịch vụ..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" danger>
                Xác nhận xóa
              </Button>
              <Button onClick={() => Modal.destroyAll()}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      ),
      footer: null,
      width: 500
    });
  };

  const handleRecover = async (packageId: string) => {
    try {
      await recoverServicePackage(packageId);
      message.success('Khôi phục gói dịch vụ thành công');
      loadData();
    } catch (err: any) {
      message.error(err?.message || 'Không thể khôi phục gói dịch vụ');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Calculate total price
      const totalPrice = values.services.reduce((sum: number, item: any) => {
        const service = services.find(s => s._id === item.serviceId);
        return sum + (service ? service.price * item.quantity : 0);
      }, 0);

      const packageData = {
        ...values,
        totalPrice,
        discountPercentage: totalPrice > 0 ? ((totalPrice - values.discountPrice) / totalPrice * 100) : 0
      };

      if (editingPackage) {
        await updateServicePackage(editingPackage._id, packageData);
        message.success('Cập nhật gói dịch vụ thành công');
      } else {
        await createServicePackage(packageData);
        message.success('Tạo gói dịch vụ thành công');
      }
      
      setIsModalVisible(false);
      setEditingPackage(null);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err?.message || 'Có lỗi xảy ra');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingPackage(null);
    form.resetFields();
  };

  const showPackageDetails = (pkg: ServicePackage) => {
    Modal.info({
      title: 'Chi tiết gói dịch vụ',
      width: 800,
      content: (
        <div style={{ marginTop: '16px' }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Tên gói" span={2}>
              <Text strong>{pkg.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" span={2}>
              {pkg.description}
            </Descriptions.Item>
            <Descriptions.Item label="Giá gốc">
              <Text strong style={{ color: '#ff4d4f' }}>
                {pkg.totalPrice.toLocaleString('vi-VN')} VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Giá khuyến mãi">
              <Text strong style={{ color: '#52c41a' }}>
                {pkg.discountPrice.toLocaleString('vi-VN')} VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tiết kiệm">
              <Tag color="green">
                {pkg.discountPercentage.toFixed(1)}% 
                ({(pkg.totalPrice - pkg.discountPrice).toLocaleString('vi-VN')} VNĐ)
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={pkg.isActive ? 'green' : 'red'}>
                {pkg.isActive ? 'Hoạt động' : 'Tạm dừng'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ bao gồm" span={2}>
              <div style={{ marginTop: '8px' }}>
                {pkg.services.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '8px 12px',
                    backgroundColor: '#f5f5f5',
                    marginBottom: '4px',
                    borderRadius: '4px'
                  }}>
                    <span>
                      <Text strong>{item.serviceId.serviceName}</Text>
                      <Text type="secondary"> x{item.quantity}</Text>
                    </span>
                    <Text>
                      {(item.serviceId.price * item.quantity).toLocaleString('vi-VN')} VNĐ
                    </Text>
                  </div>
                ))}
              </div>
            </Descriptions.Item>
            {pkg.isDeleted && pkg.deleteNote && (
              <Descriptions.Item label="Lý do xóa" span={2}>
                <Text type="danger">{pkg.deleteNote}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>
      ),
    });
  };

  const columns = [
    {
      title: 'Tên gói dịch vụ',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (name: string, record: ServicePackage) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
            {name}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {record.services?.length || 0} dịch vụ
          </div>
          {record.isDeleted && (
            <Tag color="red">Đã xóa</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Giá',
      key: 'price',
      width: 200,
      render: (_, record: ServicePackage) => (
        <div>
          <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '12px' }}>
            {record.totalPrice?.toLocaleString('vi-VN') || '0'} VNĐ
          </div>
          <div style={{ fontWeight: 'bold', color: '#52c41a', fontSize: '14px' }}>
            {record.discountPrice?.toLocaleString('vi-VN') || '0'} VNĐ
          </div>
          <Tag color="green">
            -{record.discountPercentage?.toFixed(1) || '0'}%
          </Tag>
        </div>
      )
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'services',
      key: 'services',
      width: 300,
      render: (services: ServicePackage['services']) => (
        <div>
          {services?.slice(0, 2)?.map((item, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '2px' }}>
              • {item?.serviceId?.serviceName || 'N/A'} x{item?.quantity || 0}
            </div>
          )) || []}
          {(services?.length || 0) > 2 && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              +{(services?.length || 0) - 2} dịch vụ khác
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean, record: ServicePackage) => (
        <Tag color={record.isDeleted ? 'red' : (isActive ? 'green' : 'orange')}>
          {record.isDeleted ? 'Đã xóa' : (isActive ? 'Hoạt động' : 'Tạm dừng')}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, record: ServicePackage) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showPackageDetails(record)}
            />
          </Tooltip>
          {!record.isDeleted ? (
            <>
              <Tooltip title="Chỉnh sửa">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              <Tooltip title="Xóa">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record._id)}
                />
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Khôi phục">
              <Button
                type="text"
                icon={<UndoOutlined />}
                onClick={() => handleRecover(record._id)}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  const stats = {
    total: packages?.length || 0,
    active: packages?.filter(p => !p.isDeleted && p.isActive)?.length || 0,
    inactive: packages?.filter(p => !p.isDeleted && !p.isActive)?.length || 0,
    deleted: packages?.filter(p => p.isDeleted)?.length || 0
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <AppstoreOutlined style={{ marginRight: '8px' }} />
          Quản lý gói dịch vụ
        </Title>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng gói dịch vụ"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tạm dừng"
              value={stats.inactive}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã xóa"
              value={stats.deleted}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Controls */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input.Search
              placeholder="Tìm kiếm gói dịch vụ..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={loadData}
              style={{ width: 300 }}
            />
          </Col>
          <Col>
            <Space>
              <Switch
                checked={showDeleted}
                onChange={setShowDeleted}
                checkedChildren="Hiện đã xóa"
                unCheckedChildren="Ẩn đã xóa"
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
              >
                Thêm gói dịch vụ
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadData}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={packages}
          rowKey="_id"
          loading={loading}
          pagination={{
            total: packages?.length || 0,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} gói dịch vụ`,
          }}
        />
      </Card>

      {/* Modal */}
      <Modal
        title={editingPackage ? 'Chỉnh sửa gói dịch vụ' : 'Thêm gói dịch vụ mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        okText={editingPackage ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isActive: true,
            services: [{ serviceId: undefined, quantity: 1 }]
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên gói dịch vụ"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên gói dịch vụ' },
                  { min: 3, message: 'Tên gói dịch vụ phải có ít nhất 3 ký tự' }
                ]}
              >
                <Input placeholder="Nhập tên gói dịch vụ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discountPrice"
                label="Giá khuyến mãi (VNĐ)"
                rules={[
                  { required: true, message: 'Vui lòng nhập giá khuyến mãi' },
                  { type: 'number', min: 0, message: 'Giá phải lớn hơn 0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Nhập giá khuyến mãi"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <TextArea rows={3} placeholder="Nhập mô tả gói dịch vụ" />
          </Form.Item>

          <Form.List name="services">
            {(fields, { add, remove }) => (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <Text strong>Dịch vụ trong gói</Text>
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                    Thêm dịch vụ
                  </Button>
                </div>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} align="middle">
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'serviceId']}
                        rules={[{ required: true, message: 'Vui lòng chọn dịch vụ' }]}
                      >
                        <Select placeholder="Chọn dịch vụ">
                          {services.map(service => (
                            <Option key={service._id} value={service._id}>
                              {service.name} - {service.price.toLocaleString('vi-VN')} VNĐ
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[
                          { required: true, message: 'Vui lòng nhập số lượng' },
                          { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' }
                        ]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          placeholder="Số lượng"
                          min={1}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                        disabled={fields.length === 1}
                      />
                    </Col>
                  </Row>
                ))}
              </>
            )}
          </Form.List>

          <Form.Item
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ServicePackageManagement; 