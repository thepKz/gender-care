import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  Typography,
  Tag,
  Popconfirm,
  Row,
  Col,
  Alert,
  App,
  Checkbox,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  SettingOutlined,
  SearchOutlined,
  RollbackOutlined // Thêm icon khôi phục
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { 
  serviceTestCategoriesApi, 
  testCategoriesApi, 
  ServiceTestCategory,
  CreateServiceTestCategoryData 
} from '../../../api/endpoints/testManagementApi';
import { servicesApi } from '../../../api/endpoints';
import { preventNonNumericDecimalInput } from '../../../utils';

const { Title, Text } = Typography;
const { Search } = Input;

interface Service {
  _id: string;
  serviceName: string;
  serviceType: string;
  description?: string;
}

interface TestCategory {
  _id: string;
  name: string;
  description?: string;
  normalRange?: string;
  unit?: string;
}

const ServiceTestConfigurationInner: React.FC = () => {
  const { message } = App.useApp();
  const [services, setServices] = useState<Service[]>([]);
  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);
  const [serviceTestCategories, setServiceTestCategories] = useState<ServiceTestCategory[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('services');
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceTestCategory | null>(null);
  const [form] = Form.useForm();
  const selectRef = useRef<any>(null); // ref cho Select
  const [customTestCategoryName, setCustomTestCategoryName] = useState<string>('');

  useEffect(() => {
    loadInitialData();
    
    // Kiểm tra URL parameters để khôi phục service đã chọn
    const urlParams = new URLSearchParams(window.location.search);
    const serviceIdFromUrl = urlParams.get('serviceId');
    const serviceNameFromUrl = urlParams.get('serviceName');
    
    if (serviceIdFromUrl && serviceNameFromUrl) {
      // Tạo service object từ URL params
      const serviceFromUrl = {
        _id: serviceIdFromUrl,
        serviceName: serviceNameFromUrl,
        serviceType: '',
        description: ''
      };
      
      setSelectedService(serviceFromUrl);
      setActiveTab('configurations');
      loadServiceTestCategories(serviceIdFromUrl);
    }
  }, []);

  useEffect(() => {
    if (selectedService) {
      loadServiceTestCategories(selectedService._id);
    }
  }, [selectedService]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [servicesResponse, testCategoriesData] = await Promise.all([
        servicesApi.getServices({ page: 1, limit: 1000 }),
        testCategoriesApi.getAll()
      ]);

      // Xử lý response structure
      const servicesData = servicesResponse.data;
      let allServices: any[] = [];
      
      if (servicesData?.data?.services && Array.isArray(servicesData.data.services)) {
        // Response structure: { success: true, data: { services: [...], pagination: {...} } }
        allServices = servicesData.data.services;
      } else if (servicesData?.services && Array.isArray(servicesData.services)) {
        // Response structure: { services: [...] }
        allServices = servicesData.services;
      } else if (servicesData?.data && Array.isArray(servicesData.data)) {
        // Response structure: { data: [...] }
        allServices = servicesData.data;
      } else if (Array.isArray(servicesData)) {
        // Response structure: [...]
        allServices = servicesData;
      } else {
        console.error('Unexpected services response structure:', servicesData);
        allServices = [];
      }

      setServices(allServices);
      setTestCategories(testCategoriesData);
    } catch (error) {
      console.error('Load initial data error:', error);
      message.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadServiceTestCategories = async (serviceId: string) => {
    try {
      setLoading(true);
      const data = await serviceTestCategoriesApi.getByService(serviceId);
      setServiceTestCategories(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách xét nghiệm của dịch vụ');
      console.error('❌ Error loading service test categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setActiveTab('configurations');
    setBulkEditMode(false); // Reset bulk mode khi chọn service mới
    loadServiceTestCategories(service._id); // Tải dữ liệu chỉ số cho service
    
    // Cập nhật URL để reflect service được chọn
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('serviceId', service._id);
    currentUrl.searchParams.set('serviceName', service.serviceName);
    window.history.pushState({}, '', currentUrl.toString());
  };

  const handleBulkEdit = () => {
    if (!selectedService) return;
    setBulkEditMode(true);
  };

  useEffect(() => {
    if (bulkEditMode && selectedService) {
      const initialValues: any = {};
      serviceTestCategories.forEach(stc => {
        initialValues[`${stc.testCategoryId}_isRequired`] = stc.isRequired;
        initialValues[`${stc.testCategoryId}_targetValue`] = stc.targetValue;
        initialValues[`${stc.testCategoryId}_minValue`] = stc.minValue;
        initialValues[`${stc.testCategoryId}_maxValue`] = stc.maxValue;
      });
      testCategories.forEach(tc => {
        const exists = serviceTestCategories.find(stc => stc.testCategoryId === tc._id);
        if (!exists) {
          initialValues[`${tc._id}_isRequired`] = false;
          initialValues[`${tc._id}_targetValue`] = '';
          initialValues[`${tc._id}_minValue`] = '';
          initialValues[`${tc._id}_maxValue`] = '';
        }
      });
      bulkForm.setFieldsValue(initialValues);
    }
    // eslint-disable-next-line
  }, [bulkEditMode, selectedService, serviceTestCategories, testCategories]);

  const handleBulkSave = async () => {
    try {
      if (!selectedService) return;
      
      const values = await bulkForm.validateFields();
      const updates: Promise<any>[] = [];
      
      // Xử lý từng test category
      testCategories.forEach(tc => {
        const isRequired = values[`${tc._id}_isRequired`];
        const targetValue = values[`${tc._id}_targetValue`];
        const minValue = values[`${tc._id}_minValue`];
        const maxValue = values[`${tc._id}_maxValue`];
        
        // Chỉ tạo/cập nhật nếu có ít nhất một field được điền
        if (isRequired || targetValue || minValue || maxValue) {
          const existingItem = serviceTestCategories.find(stc => stc.testCategoryId === tc._id);
          
          const data: CreateServiceTestCategoryData = {
            serviceId: selectedService._id,
            testCategoryId: tc._id,
            isRequired: isRequired || false,
            targetValue,
            minValue,
            maxValue,
            thresholdRules: values[`${tc._id}_thresholdRules`] || [],
            unit: values[`${tc._id}_unit`] || ''
          };
          
          if (existingItem) {
            // Cập nhật
            updates.push(serviceTestCategoriesApi.update(existingItem._id, data));
          } else {
            // Tạo mới
            updates.push(serviceTestCategoriesApi.create(data));
          }
        }
      });
      
      await Promise.all(updates);
      message.success('Đã cập nhật cấu hình chỉ số thành công');
      setBulkEditMode(false);
      loadServiceTestCategories(selectedService._id);
      
    } catch (error) {
      message.error('Lỗi khi cập nhật cấu hình chỉ số');
      console.error(error);
    }
  };

  const handleAddTestCategory = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditTestCategory = (item: ServiceTestCategory) => {
    setEditingItem(item);
    form.setFieldsValue({
      testCategoryId: item.testCategoryId, // Use ID for edit mode
      targetValue: item.targetValue,
      minValue: item.minValue,
      maxValue: item.maxValue,
      thresholdRules: item.thresholdRules && item.thresholdRules.length > 0 ? item.thresholdRules : [{ from: null, to: null, flag: 'normal', message: '' }],
      unit: item.unit || '',
      isRequired: item.isRequired || false,
    });
    setIsModalVisible(true);
  };

  const handleDeleteTestCategory = async (id: string) => {
    try {
      await serviceTestCategoriesApi.update(id, { isDeleted: true }); // Chỉ update mỗi isDeleted
      message.success('Đã xóa cấu hình xét nghiệm thành công');
      if (selectedService) {
        loadServiceTestCategories(selectedService._id);
      }
    } catch (error) {
      message.error('Lỗi khi xóa cấu hình xét nghiệm');
    }
  };

  const handleRestoreTestCategory = async (id: string) => {
    try {
      await serviceTestCategoriesApi.update(id, { isDeleted: false });
      message.success('Đã khôi phục cấu hình xét nghiệm thành công');
      if (selectedService) {
        loadServiceTestCategories(selectedService._id);
      }
    } catch (error) {
      message.error('Lỗi khi khôi phục cấu hình xét nghiệm');
    }
  };

  const handleModalOk = async () => {
    try {
      setLoading(true); // Prevent double submit
      const values = await form.validateFields();
      
      if (!selectedService) {
        message.error('Vui lòng chọn dịch vụ');
        return;
      }

      if (editingItem) {
        // CHỈ cập nhật service test category configuration
        // KHÔNG sửa test category gốc vì có thể được dùng bởi service khác
        const data: CreateServiceTestCategoryData = {
          serviceId: selectedService._id,
          testCategoryId: editingItem.testCategoryId,
          isRequired: values.isRequired || false,
          targetValue: values.targetValue,
          minValue: values.minValue,
          maxValue: values.maxValue,
          thresholdRules: values.thresholdRules || [],
          unit: values.unit || ''
        };

        await serviceTestCategoriesApi.update(editingItem._id, data);
        message.success('Đã cập nhật cấu hình chỉ số thành công');
      } else {
        let testCategoryId = values.testCategoryId;
        
        // Kiểm tra nếu user tạo test category mới
        if (testCategoryId?.startsWith('new:')) {
          const newName = testCategoryId.replace('new:', '');
          
          // Tạo test category mới
          const newTestCategoryResponse = await testCategoriesApi.create({
            name: newName,
            description: values.description,
            unit: values.customUnit,
            normalRange: values.customNormalRange
          });
          
          if (!newTestCategoryResponse?.data?._id) {
            throw new Error('Lỗi khi tạo test category mới');
          }
          
          testCategoryId = newTestCategoryResponse.data._id;
        }
        
        // Tạo service test category
        const data: CreateServiceTestCategoryData = {
          serviceId: selectedService._id,
          testCategoryId: testCategoryId,
          isRequired: values.isRequired || false,
          targetValue: values.targetValue,
          minValue: values.minValue,
          maxValue: values.maxValue,
          thresholdRules: values.thresholdRules || [],
          unit: values.unit || ''
        };

        await serviceTestCategoriesApi.create(data);
        message.success('Đã thêm chỉ số vào dịch vụ thành công');
        
        // Reload để cập nhật danh sách
        loadInitialData();
      }

      setIsModalVisible(false);
      loadServiceTestCategories(selectedService._id);
    } catch (error: any) {
      // Xử lý các loại lỗi khác nhau
      let errorMessage = 'Có lỗi xảy ra';
      
      if (error.response?.status === 400) {
        // Lỗi 400 thường là duplicate name hoặc validation error
        errorMessage = error.response?.data?.message || 'Tên chỉ số đã tồn tại hoặc dữ liệu không hợp lệ';
      } else if (error.response?.status === 401) {
        errorMessage = 'Bạn không có quyền thực hiện hành động này';
      } else if (error.response?.status === 500) {
        errorMessage = 'Lỗi server, vui lòng thử lại sau';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
      console.error('Modal error:', error);
    } finally {
      setLoading(false); // Always reset loading state
    }
  };

  const getTestCategoryName = (testCategoryId: string) => {
    const testCategory = testCategories.find(tc => tc._id === testCategoryId);
    return testCategory?.name || 'N/A';
  };

  const getTestCategoryDetails = (testCategoryId: string) => {
    return testCategories.find(tc => tc._id === testCategoryId);
  };

  // Service table columns
  const serviceColumns: ColumnsType<Service> = [
    {
      title: 'Tên dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleServiceSelect(record)}
          >
            Cấu hình xét nghiệm
          </Button>
        </Space>
      ),
    },
  ];

  // Service test categories table columns - CHỈ HIỂN THỊ
  const testCategoryColumns: ColumnsType<ServiceTestCategory> = [
    {
      title: 'Tên chỉ số',
      dataIndex: 'testCategoryId',
      key: 'testCategoryName',
      render: (testCategoryId, record) => {
        
        // Nếu testCategoryId đã là object (populated)
        if (typeof testCategoryId === 'object' && testCategoryId?.name) {
          return testCategoryId.name;
        }
        
        // Nếu có testCategory property
        if (record.testCategory?.name) {
          return record.testCategory.name;
        }
        
        // Fallback về hàm lookup
        return getTestCategoryName(testCategoryId);
      },
    },
    {
      title: 'Loại chỉ số', // Đổi từ 'Loại' thành 'Loại chỉ số'
      dataIndex: 'isRequired',
      key: 'isRequired',
      render: (isRequired) => (
        <Tag color={isRequired ? 'green' : 'orange'}>
          {isRequired ? 'Bắt buộc' : 'Tùy chọn'}
        </Tag>
      ),
    },
  
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      render: (_, record) => {
        // Ưu tiên unit của ServiceTestCategory, nếu không có thì lấy từ testCategory
        const unit = record.unit || record.testCategory?.unit;
        return unit ? <span>{unit}</span> : <span className="text-gray-500">Chưa thiết lập</span>;
      },
    },
    // Đảm bảo chỉ có một cột 'Giá trị dao động' với key 'valueRange', đã căn giữa.
    // Nếu có cột cũ trùng key, hãy xóa cột cũ, chỉ giữ lại đoạn sau:
    {
      title: 'Giá trị dao động',
      key: 'valueRange',
      align: 'center', // Căn giữa theo Ant Design Table
      render: (_, record) => (
        <div className="text-center" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          {record.minValue !== undefined && record.maxValue !== undefined ? (
            <span>{record.minValue} - {record.maxValue}</span>
          ) : (
            <span className="text-gray-500">Chưa thiết lập</span>
          )}
        </div>
      ),
    },
    // Xóa cột 'Giá trị bình thường'
    // Thêm cột 'Trạng thái'
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isDeleted ? 'red' : 'blue'}>
          {record.isDeleted ? 'Đã xóa' : 'Đang hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditTestCategory(record)}
            disabled={record.isDeleted}
          />
          {record.isDeleted ? (
            <Popconfirm
              title="Xác nhận khôi phục cấu hình này?"
              onConfirm={() => handleRestoreTestCategory(record._id)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="text" icon={<RestoreIcon />} />
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Xác nhận xóa cấu hình này?"
              onConfirm={() => handleDeleteTestCategory(record._id)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Tạo icon SVG khôi phục màu xanh lá
  const RestoreIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4a8 8 0 1 0 8 8" stroke="#22c55e" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 4h4v4" stroke="#22c55e" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // Lọc dịch vụ theo tên và loại serviceType === 'test'
  const filteredServices = services.filter(service =>
    service.serviceType === 'test' &&
    service.serviceName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="serviceTestConfiguration p-6">
      <div className="serviceTestConfiguration__header mb-6">
        <Title level={2}>Cấu hình chỉ số tiêu chuẩn cho dịch vụ</Title>
        <Text className="text-gray-600">
          Thiết lập các chỉ số xét nghiệm và khoảng giá trị chuẩn cho từng dịch vụ. 
          Chỉ số này sẽ được sử dụng để đánh giá kết quả xét nghiệm của khách hàng.
        </Text>
      </div>

      {/* Button group tab UI đẹp thay cho Tabs --- */}
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle" justify="center">
            <Col flex="auto">
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Button
                  type={activeTab === 'services' ? 'primary' : 'default'}
                  icon={<ExperimentOutlined />}
                  onClick={() => setActiveTab('services')}
                  style={{
                    borderRadius: '6px',
                    height: '40px',
                    minWidth: '180px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: 18
                  }}
                >
                  Danh sách dịch vụ
                </Button>
                <Button
                  type={activeTab === 'configurations' ? 'primary' : 'default'}
                  icon={<SettingOutlined />}
                  onClick={() => setActiveTab('configurations')}
                  disabled={!selectedService}
                  style={{
                    borderRadius: '6px',
                    height: '40px',
                    minWidth: '180px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: 18
                  }}
                >
                  Cấu hình xét nghiệm
                </Button>
              </div>
            </Col>
          </Row>
        </div>
        {/* Render children tương ứng với activeTab */}
        {activeTab === 'services' && (
          <>
            <div className="mb-4">
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8}>
                  <Search
                    placeholder="Tìm kiếm dịch vụ..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                  />
                </Col>
              </Row>
            </div>
            <Table
              columns={serviceColumns}
              dataSource={filteredServices}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} dịch vụ`,
              }}
            />
          </>
        )}
        {activeTab === 'configurations' && selectedService && (
          <>
            <Alert
              message={`Thiết lập chỉ số tiêu chuẩn cho dịch vụ: ${selectedService.serviceName}`}
              description="Các chỉ số bạn thiết lập ở đây sẽ được sử dụng để đánh giá kết quả xét nghiệm khi bác sĩ nhập kết quả cho khách hàng."
              type="info"
              className="mb-4"
              action={
                <Button
                  size="small"
                  onClick={() => setActiveTab('services')}
                >
                  Chọn dịch vụ khác
                </Button>
              }
            />
            <div className="mb-4">
              <Space>
                {!bulkEditMode ? (
                  <>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddTestCategory}
                    >
                      Thêm chỉ số xét nghiệm
                    </Button>
                    <Button
                      icon={<SettingOutlined />}
                      onClick={handleBulkEdit}
                    >
                      Cập nhật nhiều chỉ số
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="primary"
                      onClick={handleBulkSave}
                      loading={loading}
                    >
                      Lưu tất cả chỉ số
                    </Button>
                    <Button
                      onClick={() => setBulkEditMode(false)}
                    >
                      Hủy
                    </Button>
                  </>
                )}
              </Space>
            </div>
            {!bulkEditMode ? (
              <Table
                columns={testCategoryColumns}
                dataSource={serviceTestCategories}
                rowKey="_id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} xét nghiệm`,
                }}
              />
            ) : (
              <Form form={bulkForm} layout="vertical" preserve={false}>
                <Alert
                  message="Cấu hình nhiều chỉ số cùng lúc"
                  description="Điền thông tin cho các chỉ số bạn muốn cấu hình. Các chỉ số để trống sẽ không được tạo/cập nhật."
                  type="info"
                  className="mb-4"
                />
                
                {testCategories.length === 0 ? (
                  <div>
                    <Alert
                      message="Tạo chỉ số xét nghiệm cho dịch vụ"
                      description="Hiện chưa có danh sách chỉ số xét nghiệm. Bạn có thể tạo trực tiếp các chỉ số cần thiết cho dịch vụ này."
                      type="info"
                      showIcon
                      className="mb-4"
                    />
                    
                    <Card title="Tạo chỉ số xét nghiệm mới" size="small">
                      <Form
                        layout="inline"
                        onFinish={async (values) => {
                          try {
                            // Gọi API tạo test category mới
                            await testCategoriesApi.create(values);
                            message.success('Đã tạo chỉ số xét nghiệm mới');
                            loadInitialData(); // Reload data
                          } catch (error) {
                            message.error('Lỗi khi tạo chỉ số xét nghiệm');
                          }
                        }}
                      >
                        <Form.Item name="name" rules={[{ required: true, message: 'Vui lòng nhập tên chỉ số' }]}>
                          <Input placeholder="Tên chỉ số (VD: Cholesterol)" />
                        </Form.Item>
                        <Form.Item name="unit">
                          <Input placeholder="Đơn vị (VD: mg/dL)" />
                        </Form.Item>
                        <Form.Item name="normalRange">
                          <Input placeholder="Khoảng chuẩn (VD: <200)" />
                        </Form.Item>
                        <Form.Item>
                          <Button type="primary" htmlType="submit">
                            Thêm chỉ số
                          </Button>
                        </Form.Item>
                      </Form>
                    </Card>
                  </div>
                ) : (
                  <Row gutter={[16, 24]}>
                    {testCategories.map(tc => (
                    <Col xs={24} lg={12} key={tc._id}>
                      <Card
                        size="small"
                        title={
                          <Space>
                            <ExperimentOutlined />
                            <strong>{tc.name}</strong>
                          </Space>
                        }
                        extra={
                          <Form.Item
                            name={`${tc._id}_isRequired`}
                            valuePropName="checked"
                            style={{ margin: 0 }}
                          >
                            <Checkbox>Bắt buộc</Checkbox>
                          </Form.Item>
                        }
                      >
                        <Row gutter={12}>
                          <Col span={12}>
                            <Form.Item
                              name={`${tc._id}_targetValue`}
                              label="Giá trị bình thường"
                              style={{ marginBottom: 12 }}
                            >
                              <Input 
                                placeholder="Ví dụ: 4.5, <5.0"
                                size="small"
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        
                        <Form.Item
                          name={`${tc._id}_minValue`}
                          label="Giá trị thấp nhất"
                          style={{ marginBottom: 12 }}
                        >
                          <InputNumber 
                            placeholder="VD: 3.5" 
                            style={{ width: '100%' }}
                            step={0.1}
                            onKeyDown={preventNonNumericDecimalInput}
                          />
                        </Form.Item>
                        
                        <Form.Item
                          name={`${tc._id}_maxValue`}
                          label="Giá trị cao nhất"
                          style={{ marginBottom: 12 }}
                        >
                          <InputNumber 
                            placeholder="VD: 5.0" 
                            style={{ width: '100%' }}
                            step={0.1}
                            onKeyDown={preventNonNumericDecimalInput}
                          />
                        </Form.Item>
                      </Card>
                    </Col>
                  ))}
                  </Row>
                )}
              </Form>
            )}
          </>
        )}
      </Card>

      {/* Modal để tạo/chỉnh sửa chỉ số */}
      <Modal
        title={editingItem ? 'Chỉnh sửa cấu hình chỉ số' : 'Tạo chỉ số xét nghiệm mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        okText={editingItem ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Alert
            message={`Tạo chỉ số xét nghiệm cho dịch vụ: ${selectedService?.serviceName}`}
            type="info"
            showIcon
            className="mb-4"
          />
          
          {!editingItem ? (
            // CHỈ hiển thị khi tạo mới
            <>
              <Form.Item
                name="testCategoryId"
                label="Chọn chỉ số xét nghiệm"
                rules={[{ required: true, message: 'Vui lòng chọn chỉ số' }]}
              >
                <Select
                  showSearch
                  allowClear
                  disabled={!!editingItem}
                  placeholder="Chọn chỉ số có sẵn hoặc nhập tên mới..."
                  filterOption={(input, option) =>
                    String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  onSearch={value => {
                    setCustomTestCategoryName(value);
                  }}
                  onBlur={() => {
                    if (
                      customTestCategoryName &&
                      !testCategories.some(tc => tc.name.toLowerCase() === customTestCategoryName.toLowerCase())
                    ) {
                      form.setFieldValue('testCategoryId', `new:${customTestCategoryName}`);
                    }
                  }}
                  onChange={val => {
                    if (typeof val === 'string' && !val.startsWith('new:')) {
                      setCustomTestCategoryName('');
                    }
                  }}
                  value={(() => {
                    const v = form.getFieldValue('testCategoryId');
                    if (typeof v === 'string') return v;
                    return undefined;
                  })()}
                >
                  {testCategories.map(tc => (
                    <Select.Option key={tc._id} value={tc._id}>
                      {tc.name}
                    </Select.Option>
                  ))}
                  {customTestCategoryName &&
                    !testCategories.some(tc => tc.name.toLowerCase() === customTestCategoryName.toLowerCase()) && (
                      <Select.Option key={`new:${customTestCategoryName}`} value={`new:${customTestCategoryName}`}>
                        {customTestCategoryName} (Tạo mới)
                      </Select.Option>
                    )}
                </Select>
              </Form.Item>

              <Form.Item
                name="description"
                label="Mô tả chỉ số"
              >
                <Input 
                  placeholder="VD: Đo lượng cholesterol trong máu..."
                />
              </Form.Item>
            </>
          ) : (
            // Hiển thị khi edit
            <>
              <Alert
                message={`Chỉnh sửa cấu hình cho chỉ số${getTestCategoryDetails(editingItem.testCategoryId)?.name ? ': ' + getTestCategoryDetails(editingItem.testCategoryId)?.name : ''}`}
                description="Bạn chỉ có thể thay đổi cấu hình riêng của chỉ số này cho dịch vụ hiện tại. Chỉ số gốc có thể được sử dụng bởi nhiều dịch vụ khác."
                type="info"
                showIcon
                className="mb-4"
              />
            </>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <Form.Item
                name="isRequired"
                label="Loại xét nghiệm"
                valuePropName="checked"
                style={{ marginBottom: 8 }}
              >
                <Checkbox>Bắt buộc</Checkbox>
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item name="unit" label="Đơn vị" style={{ marginBottom: 8 }}>
                <Input placeholder="VD: mg/dL" />
              </Form.Item>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded mb-4">
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Form.Item
                  name="minValue"
                  label="Giá trị thấp nhất"
                  rules={[{ type: 'number', message: 'Vui lòng nhập số' }, ({ getFieldValue }) => ({
                    validator(_, value) {
                      const max = getFieldValue('maxValue');
                      if (value !== undefined && max !== undefined && value >= max) {
                        return Promise.reject(new Error('Giá trị thấp nhất phải nhỏ hơn giá trị cao nhất!'));
                      }
                      return Promise.resolve();
                    },
                  })]}
                  style={{ marginBottom: 8 }}
                >
                                            <InputNumber 
                            placeholder="VD: 3.5" 
                            style={{ width: '100%' }}
                            step={0.1}
                            onKeyDown={preventNonNumericDecimalInput}
                          />
                </Form.Item>
              </div>
              <div style={{ flex: 1 }}>
                <Form.Item
                  name="maxValue"
                  label="Giá trị cao nhất"
                  rules={[{ type: 'number', message: 'Vui lòng nhập số' }, ({ getFieldValue }) => ({
                    validator(_, value) {
                      const min = getFieldValue('minValue');
                      if (value !== undefined && min !== undefined && min >= value) {
                        return Promise.reject(new Error('Giá trị cao nhất phải lớn hơn giá trị thấp nhất!'));
                      }
                      return Promise.resolve();
                    },
                  })]}
                  style={{ marginBottom: 8 }}
                >
                                            <InputNumber 
                            placeholder="VD: 5.0" 
                            style={{ width: '100%' }}
                            step={0.1}
                            onKeyDown={preventNonNumericDecimalInput}
                          />
                </Form.Item>
              </div>
            </div>
          </div>

          <Form.Item label="Thiết lập ngưỡng">
            <Form.List
              name="thresholdRules"
              rules={[{
                validator: async (_, rules) => {
                  if (!rules || rules.length < 1) {
                    return Promise.reject(new Error('Vui lòng thiết lập ít nhất một ngưỡng đánh giá.'));
                  }
                  for (let i = 0; i < rules.length; i++) {
                    const { from, to } = rules[i] || {};
                    const isEmpty = (v) => v === null || v === undefined || v === '';
                    // Dòng đầu tiên: from có thể trống, to phải có giá trị
                    if (i === 0) {
                      if (isEmpty(to)) {
                        return Promise.reject(new Error('Ngưỡng đầu tiên phải có giá trị kết thúc (Đến).'));
                      }
                      if (!isEmpty(from) && Number(from) >= Number(to)) {
                        return Promise.reject(new Error('Giá trị bắt đầu phải nhỏ hơn giá trị kết thúc trong mỗi ngưỡng.'));
                      }
                    }
                    // Dòng cuối cùng: to có thể trống, from phải có giá trị
                    else if (i === rules.length - 1) {
                      if (isEmpty(from)) {
                        return Promise.reject(new Error('Ngưỡng cuối cùng phải có giá trị bắt đầu (Từ).'));
                      }
                      if (isEmpty(rules[i - 1].to)) {
                        return Promise.reject(new Error('Chỉ ngưỡng cuối cùng được phép để trống giá trị kết thúc (Đến).'));
                      }
                    }
                    // Các dòng giữa: from và to đều phải có giá trị, liền kề nhau (cho phép lệch nhỏ hơn hoặc bằng 0.01)
                    else {
                      if (isEmpty(from) || isEmpty(to)) {
                        return Promise.reject(new Error('Các ngưỡng ở giữa phải có cả giá trị bắt đầu (Từ) và kết thúc (Đến).'));
                      }
                      // Cho phép lệch nhỏ hơn hoặc bằng 0.01
                      if (Math.abs(Number(from) - Number(rules[i - 1].to)) > 0.01) {
                        return Promise.reject(new Error('Các ngưỡng phải liền kề nhau (chênh lệch không quá 0.01), không được bỏ trống giữa các khoảng.'));
                      }
                      if (Number(from) >= Number(to)) {
                        return Promise.reject(new Error('Giá trị bắt đầu phải nhỏ hơn giá trị kết thúc trong mỗi ngưỡng.'));
                      }
                    }
                  }
                  return Promise.resolve();
                }
              }]}
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map((field) => (
                    <div key={field.key} style={{ display: 'flex', gap: 4, marginBottom: 2, alignItems: 'center', minHeight: 40 }}>
                      <Form.Item
                        key={`from-${field.key}`}
                        name={[field.name, 'from']}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <InputNumber 
                          placeholder="From" 
                          style={{ width: '100%' }}
                          onKeyDown={preventNonNumericDecimalInput}
                        />
                      </Form.Item>
                      <Form.Item
                        key={`to-${field.key}`}
                        name={[field.name, 'to']}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <InputNumber 
                          placeholder="To" 
                          style={{ width: '100%' }}
                          onKeyDown={preventNonNumericDecimalInput}
                        />
                      </Form.Item>
                      <Form.Item
                        key={`flag-${field.key}`}
                        name={[field.name, 'flag']}
                        style={{ flex: 1, marginBottom: 0 }}
                        rules={[{ required: true, message: 'Chọn flag!' }]}
                      >
                        <Select placeholder="Chọn mức ngưỡng">
                          <Select.Option value="very_low">Rất thấp</Select.Option>
                          <Select.Option value="low">Thấp</Select.Option>
                          <Select.Option value="normal">Bình thường</Select.Option>
                          <Select.Option value="mild_high">Hơi cao</Select.Option>
                          <Select.Option value="high">Cao</Select.Option>
                          <Select.Option value="critical">Nguy kịch</Select.Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        key={`msg-${field.key}`}
                        name={[field.name, 'message']}
                        style={{ flex: 2, marginBottom: 0 }}
                        rules={[{ required: true, message: 'Nhập message!' }]}
                      >
                        <Input placeholder="Message" />
                      </Form.Item>
                      {fields.length > 1 && (
                        <Form.Item style={{ flex: 'none', marginBottom: 0 }}>
                          <Button danger size="small" onClick={() => remove(field.name)}>
                            Xóa
                          </Button>
                        </Form.Item>
                      )}
                    </div>
                  ))}
                  <Form.ErrorList errors={errors} />
                  <Button type="dashed" onClick={() => add({ from: null, to: null, flag: 'normal', message: '' })} block>
                    Thêm dòng
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

        </Form>
      </Modal>

    </div>
  );
};

const ServiceTestConfiguration: React.FC = () => (
  <App>
    <ServiceTestConfigurationInner />
  </App>
);

export default ServiceTestConfiguration;