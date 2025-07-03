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
  message,
  Tag,
  Popconfirm,
  Row,
  Col,
  Tabs,
  Alert,
  Descriptions,
  App,
  Checkbox,
  InputNumber
} from 'antd';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExperimentOutlined,
  SettingOutlined,
  SearchOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { 
  serviceTestCategoriesApi, 
  testCategoriesApi, 
  ServiceTestCategory,
  CreateServiceTestCategoryData 
} from '../../../api/endpoints/testManagementApi';
import { servicesApi } from '../../../api/endpoints';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

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
  const [newTestCategoryName, setNewTestCategoryName] = useState('');
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
      
      console.log('🔍 Restoring service from URL:', serviceFromUrl);
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

      console.log('Services API Response:', servicesResponse);
      console.log('Test Categories API Response:', testCategoriesData);

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
        console.log('ServicesData type:', typeof servicesData);
        console.log('ServicesData keys:', Object.keys(servicesData || {}));
        allServices = [];
      }

      console.log('Parsed allServices:', allServices);
      console.log('AllServices is array:', Array.isArray(allServices));

      // Đảm bảo allServices là array trước khi filter
      if (!Array.isArray(allServices)) {
        console.error('allServices is not an array:', allServices);
        allServices = [];
      }

      // Hiển thị tất cả dịch vụ (không lọc theo serviceType)
      console.log('All services found:', allServices);
      
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
      console.log('🔍 Loading service test categories for serviceId:', serviceId);
      const data = await serviceTestCategoriesApi.getByService(serviceId);
      console.log('🔍 Service test categories data:', data);
      console.log('🔍 First record structure:', data[0]);
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
            thresholdRules: values[`${tc._id}_thresholdRules`] || []
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
      maxValue: item.maxValue
    });
    setIsModalVisible(true);
  };

  const handleDeleteTestCategory = async (id: string) => {
    try {
      await serviceTestCategoriesApi.delete(id);
      message.success('Đã xóa cấu hình xét nghiệm thành công');
      if (selectedService) {
        loadServiceTestCategories(selectedService._id);
      }
    } catch (error) {
      message.error('Lỗi khi xóa cấu hình xét nghiệm');
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
          thresholdRules: values.thresholdRules || []
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
          thresholdRules: values.thresholdRules || []
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
    console.log('🔍 getTestCategoryName called with:', testCategoryId);
    console.log('🔍 Available testCategories:', testCategories);
    const testCategory = testCategories.find(tc => tc._id === testCategoryId);
    console.log('🔍 Found testCategory:', testCategory);
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
        console.log('🔍 Rendering name for record:', record);
        console.log('🔍 testCategoryId:', testCategoryId);
        console.log('🔍 record.testCategory:', record.testCategory);
        console.log('🔍 typeof testCategoryId:', typeof testCategoryId);
        
        // Nếu testCategoryId đã là object (populated)
        if (typeof testCategoryId === 'object' && testCategoryId?.name) {
          console.log('🔍 Using populated name:', testCategoryId.name);
          return testCategoryId.name;
        }
        
        // Nếu có testCategory property
        if (record.testCategory?.name) {
          console.log('🔍 Using testCategory name:', record.testCategory.name);
          return record.testCategory.name;
        }
        
        // Fallback về hàm lookup
        console.log('🔍 Using fallback lookup');
        return getTestCategoryName(testCategoryId);
      },
    },
    {
      title: 'Bắt buộc',
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
      dataIndex: 'customUnit',
      key: 'customUnit',
      render: (value, record) => {
        const defaultUnit = getTestCategoryDetails(record.testCategoryId)?.unit;
        return value || <span className="text-gray-500">{defaultUnit}</span>;
      },
    },
    {
      title: 'Giá trị dao động',
      key: 'valueRange',
      render: (_, record) => (
        <div>
          {record.minValue !== undefined && record.maxValue !== undefined ? (
            <span>{record.minValue} - {record.maxValue}</span>
          ) : (
            <span className="text-gray-500">Chưa thiết lập</span>
          )}
        </div>
      ),
    },
    {
      title: 'Giá trị bình thường',
      dataIndex: 'targetValue',
      key: 'targetValue',
      render: (value, record) => {
        // Tự động tính từ minValue và maxValue nếu có
        if (record.minValue !== undefined && record.maxValue !== undefined) {
          const calculatedValue = (record.minValue + record.maxValue) / 2;
          return <span>{calculatedValue.toFixed(1)}</span>;
        }
        return value || <span className="text-gray-500">Chưa thiết lập</span>;
      },
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
          />
          <Popconfirm
            title="Xác nhận xóa cấu hình này?"
            onConfirm={() => handleDeleteTestCategory(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

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

      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'services',
              label: (
                <span>
                  <ExperimentOutlined />
                  Danh sách dịch vụ
                </span>
              ),
              children: (
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
              ),
            },
            {
              key: 'configurations',
              label: (
                <span>
                  <SettingOutlined />
                  Cấu hình xét nghiệm
                </span>
              ),
              disabled: !selectedService,
              children: selectedService && (
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
              ),
            },
          ]}
        />
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
            // Hiển thị thông tin test category khi edit (read-only)
            <Alert
              message={`Chỉnh sửa cấu hình cho chỉ số: ${getTestCategoryDetails(editingItem.testCategoryId)?.name || 'N/A'}`}
              description="Bạn chỉ có thể thay đổi cấu hình riêng của chỉ số này cho dịch vụ hiện tại. Chỉ số gốc có thể được sử dụng bởi nhiều dịch vụ khác."
              type="info"
              showIcon
              className="mb-4"
            />
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isRequired"
                label="Loại xét nghiệm"
                valuePropName="checked"
              >
                <Checkbox>Bắt buộc</Checkbox>
              </Form.Item>
            </Col>
            {!editingItem && (
              <Col span={12}>
                <Form.Item
                  name="customUnit"
                  label="Đơn vị tùy chỉnh"
                >
                  <Input placeholder="Ví dụ: mg/dL, IU/mL..." />
                </Form.Item>
              </Col>
            )}
          </Row>

          <div className="bg-blue-50 p-4 rounded mb-4">
            <Title level={5}>Giá trị dao động cho dịch vụ này</Title>
            <Alert
              message="Giá trị bình thường sẽ được tự động tính"
              description="Hệ thống sẽ tự động tính giá trị bình thường = (giá trị thấp nhất + giá trị cao nhất) / 2"
              type="info"
              showIcon
              className="mb-4"
            />
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="minValue"
                  label="Giá trị thấp nhất"
                  rules={[{ type: 'number', message: 'Vui lòng nhập số' }]}
                >
                  <InputNumber 
                    placeholder="VD: 3.5" 
                    style={{ width: '100%' }}
                    step={0.1}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="maxValue"
                  label="Giá trị cao nhất"
                  rules={[{ type: 'number', message: 'Vui lòng nhập số' }]}
                >
                  <InputNumber 
                    placeholder="VD: 5.0" 
                    style={{ width: '100%' }}
                    step={0.1}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Form.Item label="Threshold Rules">
            <Form.List
              name="thresholdRules"
              initialValue={editingItem?.thresholdRules || [{ from: null, to: null, flag: 'normal', message: '' }]}
              rules={[{ validator: async (_, rules) => {
                if (!rules || rules.length < 1) {
                  return Promise.reject(new Error('Phải có ít nhất 1 rule!'));
                }
              }}]}
            >
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <div key={field.key} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <Form.Item
                        key={`from-${field.key}`}
                        name={[field.name, 'from']}
                        style={{ flex: 1 }}
                      >
                        <InputNumber placeholder="From" style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item
                        key={`to-${field.key}`}
                        name={[field.name, 'to']}
                        style={{ flex: 1 }}
                      >
                        <InputNumber placeholder="To" style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item
                        key={`flag-${field.key}`}
                        name={[field.name, 'flag']}
                        style={{ flex: 1 }}
                        rules={[{ required: true, message: 'Chọn flag!' }]}
                      >
                        <Select placeholder="Flag">
                          <Select.Option value="very_low">very_low</Select.Option>
                          <Select.Option value="low">low</Select.Option>
                          <Select.Option value="normal">normal</Select.Option>
                          <Select.Option value="mild_high">mild_high</Select.Option>
                          <Select.Option value="high">high</Select.Option>
                          <Select.Option value="critical">critical</Select.Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        key={`msg-${field.key}`}
                        name={[field.name, 'message']}
                        style={{ flex: 2 }}
                        rules={[{ required: true, message: 'Nhập message!' }]}
                      >
                        <Input placeholder="Message" />
                      </Form.Item>
                      {fields.length > 1 && (
                        <Button danger onClick={() => remove(field.name)}>
                          Xóa
                        </Button>
                      )}
                    </div>
                  ))}
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