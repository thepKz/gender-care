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
  Descriptions,
  Badge
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
  LoadingOutlined
} from '@ant-design/icons';
import { 
  getServicePackages, 
  createServicePackage, 
  updateServicePackage, 
  deleteServicePackage,
  recoverServicePackage,
  GetServicePackagesParams,
  getPackagePricing,
  getUsageProjection,
  calculateAutoPrice
} from '../../../api/endpoints/servicePackageApi';
import { getServices } from '../../../api/endpoints/serviceApi';
import { Form as AntForm } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ServicePackage {
  _id: string;
  name: string;
  description: string;
  price: number;                // Giá gốc được tính tự động từ tổng giá dịch vụ x maxUsages
  discountPrice: number;        // Giá đã giảm (nếu có) – không dùng mã
  serviceIds: string[];
  isActive: boolean;
  durationInDays: number;       // 🔹 Thời hạn sử dụng tính theo ngày (30, 90...)
  maxUsages: number;           // 🔹 Số lượt được dùng tối đa cho toàn gói
  maxProfiles: number[];       // 🔹 [1, 2, 4] - Số người tối đa có thể sử dụng gói
  isMultiProfile: boolean;     // 🔹 Gói này có hỗ trợ nhiều hồ sơ không
  pricingInfo?: {
    packageId: string;
    packageName: string;
    baseServicePrice: number;       // Tổng giá của các dịch vụ trong gói
    originalPrice: number;          // Giá gốc được tính tự động
    discountPrice: number;          // Giá đã giảm (nếu có)
    discountPercentage: number;     // % giảm giá
    durationInDays: number;         // Thời hạn sử dụng
    maxUsages: number;             // Số lượt được dùng tối đa
    maxProfiles: number[];         // Tùy chọn số profile
    isMultiProfile: boolean;       // Hỗ trợ nhiều hồ sơ
    pricePerUsage: number;         // Giá mỗi lượt sử dụng
    pricePerDay: number;           // Giá mỗi ngày sử dụng
    pricePerProfile: number;       // Giá trung bình mỗi profile (cho multi-profile)
  };
  valueMetrics?: {
    savingsAmount: number;
    savingsPercentage: number;
    valueRating: 'excellent' | 'good' | 'fair' | 'poor';
  };
  autoCalculation?: {
    totalServicePrice: number;     // Tổng giá các dịch vụ
    calculatedPrice: number;       // Giá được tính tự động
    formula: string;               // Công thức tính giá
  };
  pricingSummary?: string;
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
  const [serviceSearchId, setServiceSearchId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [autoCalculatedPrice, setAutoCalculatedPrice] = useState<number | null>(null);

  // Theo dõi realtime các trường để tính giá tự động
  const watchedServiceIds = AntForm.useWatch('serviceIds', form);
  const watchedMaxUsages = AntForm.useWatch('maxUsages', form);
  const watchedMaxProfiles = AntForm.useWatch('maxProfiles', form);

  useEffect(() => {
    loadData();
    loadServices();
  }, [showDeleted, serviceSearchId, selectedStatus]);

  useEffect(() => {
    if (watchedServiceIds?.length > 0 && watchedMaxUsages > 0) {
      // Lấy giá từng dịch vụ đã chọn
      const selectedServices = services.filter(s => watchedServiceIds.includes(s._id));
      const totalServicePrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
      const calculatedPrice = totalServicePrice * watchedMaxUsages;
      form.setFieldsValue({ price: calculatedPrice });
    } else {
      form.setFieldsValue({ price: 0 });
    }
  }, [watchedServiceIds, watchedMaxUsages, services]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: GetServicePackagesParams = {
        sortBy: 'createdAt',
        sortOrder: 'desc',
        includeDeleted: showDeleted // Khi showDeleted=true, backend sẽ trả về cả active + deleted
      };
      
      if (searchText) {
        params.search = searchText;
      }

      if (serviceSearchId) {
        params.serviceId = serviceSearchId;
      }

      const response = await getServicePackages(params);
      
      if (response.success && response.data?.packages) {
        // Map backend format to frontend format với hybrid subscription + multi-profile schema
        const mappedPackages = response.data.packages.map((pkg: any) => {
          // Chuẩn hóa isActive về boolean, xử lý cả trường hợp 0/1 và true/false
          let isActiveValue = true;
          if (pkg.isActive === 0 || pkg.isActive === false) {
            isActiveValue = false;
          }
          
          return {
            _id: pkg._id,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price || 0,                      // Giá gốc được tính tự động
            discountPrice: pkg.discountPrice || 0,      // Giá đã giảm
            serviceIds: pkg.serviceIds || [],
            isActive: isActiveValue,
            durationInDays: pkg.durationInDays || 30,   // Thời hạn sử dụng
            maxUsages: pkg.maxUsages || 1,              // Số lượt tối đa
            maxProfiles: pkg.maxProfiles || [1],        // 🔹 Số lượng profiles
            isMultiProfile: Boolean(pkg.isMultiProfile), // 🔹 Hỗ trợ multi-profile
            pricingInfo: pkg.pricingInfo,
            valueMetrics: pkg.valueMetrics,
            autoCalculation: pkg.autoCalculation,
            pricingSummary: pkg.pricingSummary,
            createdAt: pkg.createdAt,
            updatedAt: pkg.updatedAt
          };
        });
        
        console.log('📦 Loaded packages:', mappedPackages.length, 'Active:', mappedPackages.filter(p => p.isActive).length);
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

  // Filter packages based on search and filters
  const filteredPackages = packages.filter(pkg => {
    // Filter by showDeleted state first
    if (showDeleted) {
      // When showDeleted=true, show all packages (active + deleted)
      // But still apply status filter if not 'all'
      if (selectedStatus !== 'all') {
        return selectedStatus === 'active' ? pkg.isActive === true : pkg.isActive === false;
      }
      return true;
    } else {
      // When showDeleted=false, only show active packages
      return pkg.isActive === true;
    }
  }).filter(pkg => {
    // Apply search text filter
    if (searchText) {
      return pkg.name.toLowerCase().includes(searchText.toLowerCase()) ||
             pkg.description.toLowerCase().includes(searchText.toLowerCase());
    }
    return true;
  });

  const handleEdit = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    // Chuẩn hóa serviceIds về array id string
    let normalizedServiceIds: string[] = [];
    if (Array.isArray(pkg.serviceIds)) {
      if (typeof pkg.serviceIds[0] === 'object' && pkg.serviceIds[0] !== null) {
        normalizedServiceIds = (pkg.serviceIds as any[]).map(s => s._id || s.id || s);
      } else {
        normalizedServiceIds = pkg.serviceIds as string[];
      }
    }
    // Thêm các dịch vụ chưa có trong danh sách services vào option tạm thời
    const missingServiceIds = normalizedServiceIds.filter(id => !services.some(s => s._id == id));
    if (missingServiceIds.length > 0) {
      const missingOptions = missingServiceIds.map(id => ({ _id: id, name: `Dịch vụ đã xóa (${id})`, price: 0, description: '', isActive: false }));
      setServices(prev => [...prev, ...missingOptions]);
    }
    if (services.length === 0) {
      loadServices().then(() => {
        form.setFieldsValue({
          name: pkg.name,
          description: pkg.description,
          serviceIds: normalizedServiceIds,
          price: pkg.price,
          discountPrice: pkg.discountPrice,
          durationInDays: pkg.durationInDays,
          maxUsages: pkg.maxUsages,
          isActive: pkg.isActive,
          maxProfiles: pkg.maxProfiles || []
        });
      });
    } else {
      form.setFieldsValue({
        name: pkg.name,
        description: pkg.description,
        serviceIds: normalizedServiceIds,
        price: pkg.price,
        discountPrice: pkg.discountPrice,
        durationInDays: pkg.durationInDays,
        maxUsages: pkg.maxUsages,
        isActive: pkg.isActive,
        maxProfiles: pkg.maxProfiles || []
      });
    }
    setTimeout(() => {
      const serviceIds = form.getFieldValue('serviceIds');
      const maxUsages = form.getFieldValue('maxUsages');
      if (serviceIds?.length > 0 && maxUsages > 0) {
        const selectedServices = services.filter(s => serviceIds.includes(s._id));
        const totalServicePrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
        const calculatedPrice = totalServicePrice * maxUsages;
        form.setFieldsValue({ price: calculatedPrice });
      }
    }, 100);
    setIsModalVisible(true);
  };

  const handleDelete = async (packageId: string) => {
    Modal.confirm({
      title: 'Xóa gói dịch vụ',
      content: 'Bạn có chắc chắn muốn xóa gói dịch vụ này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteServicePackage(packageId);
              message.success('Xóa gói dịch vụ thành công');
              loadData();
            } catch (err: any) {
              message.error(err?.message || 'Không thể xóa gói dịch vụ');
            }
      }
    });
  };

  const handleRecover = async (packageId: string) => {
    try {
      await updateServicePackage(packageId, { isActive: true });
      message.success('Khôi phục gói dịch vụ thành công');
      loadData();
    } catch (err: any) {
      message.error(err?.message || 'Không thể khôi phục gói dịch vụ');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Kiểm tra giá khuyến mãi không được lớn hơn giá gốc
      if (values.discountPrice > values.price) {
        message.error('Giá khuyến mãi không được lớn hơn giá gốc');
        return;
      }
      
      // Kiểm tra giá không được âm
      if (values.price < 0 || values.discountPrice < 0) {
        message.error('Giá không được âm');
        return;
      }

      if (editingPackage) {
        // Update existing package
        await updateServicePackage(editingPackage._id, values);
        message.success('Cập nhật gói dịch vụ thành công');
      } else {
        // Create new package
        await createServicePackage(values);
        message.success('Tạo gói dịch vụ thành công');
      }
      
      setIsModalVisible(false);
      form.resetFields();
      setEditingPackage(null);
      loadData();
    } catch (err: any) {
      message.error(err?.message || 'Có lỗi xảy ra');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingPackage(null);
  };

  const showPackageDetails = (pkg: ServicePackage) => {
    Modal.info({
      title: 'Chi tiết gói dịch vụ',
      width: 800,
      content: (
        <div style={{ marginTop: 16 }}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Tên gói">{pkg.name}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={pkg.isActive ? 'green' : 'red'}>
                {pkg.isActive ? 'Hoạt động' : 'Đã xóa'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" span={2}>{pkg.description}</Descriptions.Item>
            <Descriptions.Item label="Giá gốc">
              {pkg.price.toLocaleString('vi-VN')}đ
            </Descriptions.Item>
            <Descriptions.Item label="Giá khuyến mãi">
              {pkg.discountPrice.toLocaleString('vi-VN')}đ
            </Descriptions.Item>
            <Descriptions.Item label="Thời hạn sử dụng">
              {pkg.durationInDays} ngày
            </Descriptions.Item>
            <Descriptions.Item label="Số lượt tối đa">
              {pkg.maxUsages} lượt
            </Descriptions.Item>
            {pkg.pricingInfo && (
              <>
                <Descriptions.Item label="Giá mỗi lượt">
                  {pkg.pricingInfo.pricePerUsage.toLocaleString('vi-VN')}đ
                </Descriptions.Item>
                <Descriptions.Item label="Giá mỗi ngày">
                  {pkg.pricingInfo.pricePerDay.toLocaleString('vi-VN')}đ
                </Descriptions.Item>
                <Descriptions.Item label="% Tiết kiệm">
                  <Tag color="green">{pkg.pricingInfo.discountPercentage}%</Tag>
            </Descriptions.Item>
              </>
            )}
            {pkg.valueMetrics && (
              <Descriptions.Item label="Đánh giá giá trị">
                <Badge 
                  status={
                    pkg.valueMetrics.valueRating === 'excellent' ? 'success' :
                    pkg.valueMetrics.valueRating === 'good' ? 'processing' :
                    pkg.valueMetrics.valueRating === 'fair' ? 'warning' : 'error'
                  }
                  text={
                    pkg.valueMetrics.valueRating === 'excellent' ? 'Xuất sắc' :
                    pkg.valueMetrics.valueRating === 'good' ? 'Tốt' :
                    pkg.valueMetrics.valueRating === 'fair' ? 'Khá' : 'Thấp'
                  }
                />
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Ngày tạo">
              {new Date(pkg.createdAt).toLocaleDateString('vi-VN')}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật">
              {new Date(pkg.updatedAt).toLocaleDateString('vi-VN')}
            </Descriptions.Item>
          </Descriptions>
          
          {pkg.pricingSummary && (
            <div style={{ marginTop: 16 }}>
              <Text strong>Tóm tắt giá: </Text>
              <Text>{pkg.pricingSummary}</Text>
            </div>
          )}
        </div>
      ),
    });
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    // Không cần gọi loadData vì đã filter client-side
  };

  const handleResetFilters = () => {
    setSearchText('');
    setServiceSearchId('');
    setSelectedStatus('all');
    loadData();
  };

  const handleCalculateAutoPrice = async (serviceIds: string[], maxUsages: number) => {
    if (!serviceIds?.length || !maxUsages) return;
    
    try {
      setCalculatingPrice(true);
      const response = await calculateAutoPrice({
        serviceIds,
        maxUsages
      });
      
      if (response.success && response.data) {
        const calculatedPrice = response.data.calculatedPrice;
        setAutoCalculatedPrice(calculatedPrice);
        form.setFieldsValue({ price: calculatedPrice });
        
        // Đảm bảo giá khuyến mãi không vượt quá giá gốc
        const currentDiscountPrice = form.getFieldValue('discountPrice');
        if (currentDiscountPrice > calculatedPrice) {
          form.setFieldsValue({ discountPrice: calculatedPrice });
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi tính giá tự động:', err);
    } finally {
      setCalculatingPrice(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <AppstoreOutlined style={{ marginRight: '8px' }} />
          Quản lý gói dịch vụ
        </Title>
      </div>

      {/* Statistics - Updated to show 3 cards in row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng gói dịch vụ"
              value={packages.length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={packages.filter(p => p.isActive === true).length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Đã xóa"
              value={packages.filter(p => p.isActive === false).length}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<DeleteOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            Danh sách gói dịch vụ
          </Title>
            <Space>
              <Switch
                checked={showDeleted}
                onChange={setShowDeleted}
                checkedChildren="Hiện tất cả"
                unCheckedChildren="Chỉ hoạt động"
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
              >
              Thêm gói dịch vụ mới
              </Button>
              <Tooltip title="Làm mới dữ liệu từ server">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    // Giữ nguyên bộ lọc nhưng tải lại dữ liệu từ server
                    loadData();
                  }}
                >
                  Làm mới
                </Button>
              </Tooltip>
            </Space>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Input.Search
            placeholder="Tìm kiếm gói dịch vụ..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
          />
          
          <Select
            placeholder="Tìm dịch vụ có chứa trong gói"
            style={{ width: 300 }}
            value={serviceSearchId || undefined}
            onChange={setServiceSearchId}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {services.map(service => (
              <Option key={service._id} value={service._id}>
                {service.name} - {service.price.toLocaleString('vi-VN')}đ
              </Option>
            ))}
          </Select>

          {showDeleted && (
            <Select
              placeholder="Trạng thái"
              style={{ width: 150 }}
              value={selectedStatus}
              onChange={setSelectedStatus}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="active">Hoạt động</Option>
              <Option value="deleted">Đã xóa</Option>
            </Select>
          )}
        </div>

        <Table
          columns={[
            {
              title: 'Mã gói',
              dataIndex: '_id',
              key: '_id',
              width: 120,
              render: (text: string) => <Text code>{text}</Text>
            },
            {
              title: 'Tên gói dịch vụ',
              dataIndex: 'name',
              key: 'name',
              width: 200,
              render: (text: string, record: ServicePackage) => (
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
              title: 'Số người dùng',
              dataIndex: 'maxProfiles',
              key: 'maxProfiles',
              width: 120,
              render: (maxProfiles: number[] = []) => (
                <Tag color="blue">{maxProfiles.join(', ') || '1'}</Tag>
              )
            },
            {
              title: 'Giá',
              key: 'pricing',
              width: 150,
              render: (_, record: ServicePackage) => (
                <div>
                  <Text delete style={{ color: '#999' }}>
                    {record.price.toLocaleString('vi-VN')}đ
                  </Text>
                  <br />
                  <Text strong style={{ color: '#1890ff' }}>
                    {record.discountPrice.toLocaleString('vi-VN')}đ
                  </Text>
                  {record.pricingInfo && record.pricingInfo.discountPercentage > 0 && (
                    <Tag color="red" style={{ marginLeft: 4, fontSize: '12px' }}>
                      -{record.pricingInfo.discountPercentage}%
                    </Tag>
                  )}
                </div>
              )
            },
            {
              title: 'Cấu hình',
              key: 'configuration',
              width: 120,
              render: (_, record: ServicePackage) => (
                <div>
                  <div>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    <Text>{record.durationInDays} ngày</Text>
                  </div>
                  <div>
                    <ThunderboltOutlined style={{ marginRight: 4 }} />
                    <Text>{record.maxUsages} lượt</Text>
                  </div>
                </div>
              )
            },
            {
              title: 'Dịch vụ',
              dataIndex: 'serviceIds',
              key: 'serviceIds',
              width: 100,
              render: (serviceIds: string[]) => (
                <Tag color="blue">
                  {serviceIds.length} dịch vụ
                </Tag>
              )
            },
            {
              title: 'Trạng thái',
              dataIndex: 'isActive',
              key: 'isActive',
              width: 100,
              render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                  {isActive ? 'Hoạt động' : 'Đã xóa'}
                </Tag>
              )
            },
            {
              title: 'Thao tác',
              key: 'action',
              width: 150,
              render: (_, record: ServicePackage) => (
                <Space size="small">
                  <Tooltip title="Xem chi tiết">
                    <Button 
                      type="text" 
                      icon={<EyeOutlined />} 
                      onClick={() => showPackageDetails(record)}
                    />
                  </Tooltip>
                  <Tooltip title="Chỉnh sửa">
                    <Button 
                      type="text" 
                      icon={<EditOutlined />} 
                      onClick={() => handleEdit(record)}
                      disabled={!record.isActive}
                    />
                  </Tooltip>
                  {record.isActive ? (
                    <Tooltip title="Xóa">
                      <Popconfirm
                        title="Bạn có chắc chắn muốn xóa gói dịch vụ này?"
                        onConfirm={() => handleDelete(record._id)}
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
          ]}
          dataSource={filteredPackages}
          loading={loading}
          rowKey="_id"
          pagination={{
            total: filteredPackages.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} gói dịch vụ`
          }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: (
              <div style={{ padding: '24px 0' }}>
                <div style={{ fontSize: 24, marginBottom: 16, textAlign: 'center' }}>
                  <AppstoreOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16, display: 'block' }} />
                  Không có gói dịch vụ nào
                </div>
                <div style={{ textAlign: 'center' }}>
                  {searchText || serviceSearchId || (showDeleted && selectedStatus !== 'all') ? 
                    'Không tìm thấy kết quả phù hợp với bộ lọc. Thử thay đổi tiêu chí tìm kiếm.' : 
                    'Chưa có gói dịch vụ nào được tạo. Nhấn "Thêm gói dịch vụ mới" để bắt đầu.'}
                </div>
              </div>
            )
          }}
        />
      </Card>

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
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Tên gói dịch vụ"
            rules={[{ required: true, message: 'Vui lòng nhập tên gói dịch vụ!' }]}
          >
            <Input placeholder="Nhập tên gói dịch vụ" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <TextArea rows={3} placeholder="Nhập mô tả chi tiết về gói dịch vụ" />
          </Form.Item>

          <Form.Item
            name="serviceIds"
            label="Dịch vụ trong gói"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một dịch vụ!' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn các dịch vụ"
              showSearch
              optionFilterProp="children"
              onChange={(values) => {
                const maxUsages = form.getFieldValue('maxUsages');
                if (values.length > 0 && maxUsages > 0) {
                  // Tính giá gốc lại
                  const selectedServices = services.filter(s => values.includes(s._id));
                  const totalServicePrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
                  const calculatedPrice = totalServicePrice * maxUsages;
                  form.setFieldsValue({ price: calculatedPrice });
                }
              }}
            >
              {services.map(service => (
                <Option key={service._id} value={service._id}>
                  {service.name} - {service.price.toLocaleString('vi-VN')}đ
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá gốc (VNĐ)"
                tooltip="Giá gốc được tính tự động dựa trên các dịch vụ đã chọn và số lượt sử dụng"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  disabled={true}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value: any) => (value || '').replace(/\$\s?|(,*)/g, '')}
                  placeholder="Được tính tự động"
                  prefix={calculatingPrice ? <LoadingOutlined /> : null}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discountPrice"
                label="Giá khuyến mãi (VNĐ)"
                rules={[
                  { required: true, message: 'Vui lòng nhập giá khuyến mãi!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const price = getFieldValue('price');
                      if (!value || !price || value <= price) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Giá khuyến mãi phải nhỏ hơn hoặc bằng giá gốc!'));
                    },
                  }),
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={form.getFieldValue('price') || 0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value: any) => (value || '').replace(/\$\s?|(,*)/g, '')}
                  placeholder="Nhập giá khuyến mãi"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="durationInDays"
                label="Thời hạn sử dụng (ngày)"
                rules={[{ required: true, message: 'Vui lòng nhập thời hạn sử dụng!' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={365}
                  placeholder="Nhập số ngày (1-365)"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxUsages"
                label="Số lượt tối đa"
                rules={[{ required: true, message: 'Vui lòng nhập số lượt tối đa!' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={1000}
                  placeholder="Nhập số lượt (1-1000)"
                  onChange={(value) => {
                    if (value && value > 0) {
                      const serviceIds = form.getFieldValue('serviceIds');
                      if (serviceIds?.length > 0) {
                        handleCalculateAutoPrice(serviceIds, value);
                      }
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="maxProfiles"
            label="Số lượng người dùng tối đa"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một số lượng người dùng!' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn số lượng người dùng tối đa cho gói (ví dụ: 1, 2, 4)"
              style={{ width: '100%' }}
              allowClear
            >
              <Option value={1}>1 người</Option>
              <Option value={2}>2 người</Option>
              <Option value={4}>4 người</Option>
            </Select>
          </Form.Item>

          {editingPackage && (
          <Form.Item
            name="isActive"
              label="Trạng thái"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default ServicePackageManagement; 