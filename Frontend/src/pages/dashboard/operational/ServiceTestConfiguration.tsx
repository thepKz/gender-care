import React, { useState, useEffect } from 'react';
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
  const [form] = Form.useForm();

  useEffect(() => {
    loadInitialData();
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

      // Chỉ lấy dịch vụ test
      const testServices = allServices.filter(
        (service: any) => service.serviceType === 'test'
      );

      console.log('Test services found:', testServices);
      
      setServices(testServices);
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setActiveTab('configurations');
    setBulkEditMode(false); // Reset bulk mode khi chọn service mới
  };

  const handleBulkEdit = () => {
    if (!selectedService) return;
    
    console.log('handleBulkEdit - testCategories:', testCategories);
    console.log('testCategories length:', testCategories.length);
    
    setBulkEditMode(true);
    // Chuẩn bị form với các test categories hiện có
    const initialValues: any = {};
    serviceTestCategories.forEach(stc => {
      const testCategory = getTestCategoryDetails(stc.testCategoryId);
      if (testCategory) {
        initialValues[`${stc.testCategoryId}_isRequired`] = stc.isRequired;
        initialValues[`${stc.testCategoryId}_customNormalRange`] = stc.customNormalRange;
        initialValues[`${stc.testCategoryId}_customUnit`] = stc.customUnit;
        initialValues[`${stc.testCategoryId}_targetValue`] = stc.targetValue;
        initialValues[`${stc.testCategoryId}_notes`] = stc.notes;
      }
    });
    
    // Thêm các test categories chưa có
    testCategories.forEach(tc => {
      const exists = serviceTestCategories.find(stc => stc.testCategoryId === tc._id);
      if (!exists) {
        initialValues[`${tc._id}_isRequired`] = false;
        initialValues[`${tc._id}_customNormalRange`] = tc.normalRange || '';
        initialValues[`${tc._id}_customUnit`] = tc.unit || '';
        initialValues[`${tc._id}_targetValue`] = '';
        initialValues[`${tc._id}_notes`] = '';
      }
    });
    
    bulkForm.setFieldsValue(initialValues);
  };

  const handleBulkSave = async () => {
    try {
      if (!selectedService) return;
      
      const values = await bulkForm.validateFields();
      const updates: Promise<any>[] = [];
      
      // Xử lý từng test category
      testCategories.forEach(tc => {
        const isRequired = values[`${tc._id}_isRequired`];
        const customNormalRange = values[`${tc._id}_customNormalRange`];
        const customUnit = values[`${tc._id}_customUnit`];
        const targetValue = values[`${tc._id}_targetValue`];
        const notes = values[`${tc._id}_notes`];
        
        // Chỉ tạo/cập nhật nếu có ít nhất một field được điền
        if (isRequired || customNormalRange || customUnit || targetValue || notes) {
          const existingItem = serviceTestCategories.find(stc => stc.testCategoryId === tc._id);
          
          const data: CreateServiceTestCategoryData = {
            serviceId: selectedService._id,
            testCategoryId: tc._id,
            isRequired: isRequired || false,
            customNormalRange,
            customUnit,
            targetValue,
            notes
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
    const testCategory = getTestCategoryDetails(item.testCategoryId);
    form.setFieldsValue({
      testCategoryName: testCategory?.name || '',
      description: testCategory?.description || '',
      isRequired: item.isRequired,
      customNormalRange: item.customNormalRange,
      customUnit: item.customUnit,
      targetValue: item.targetValue,
      notes: item.notes,
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
      const values = await form.validateFields();
      
      if (!selectedService) {
        message.error('Vui lòng chọn dịch vụ');
        return;
      }

      if (editingItem) {
        // Chỉnh sửa service test category hiện có
        const data: CreateServiceTestCategoryData = {
          serviceId: selectedService._id,
          testCategoryId: editingItem.testCategoryId,
          isRequired: values.isRequired || false,
          customNormalRange: values.customNormalRange,
          customUnit: values.customUnit,
          targetValue: values.targetValue,
          notes: values.notes,
          minValue: values.minValue,
          maxValue: values.maxValue
        };

        await serviceTestCategoriesApi.update(editingItem._id, data);
        message.success('Đã cập nhật cấu hình xét nghiệm thành công');
      } else {
        // Tạo mới: Tạo test category trước, sau đó tạo service test category
        
        // 1. Tạo test category mới
        const testCategoryResponse = await fetch('/api/test-categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            name: values.testCategoryName,
            description: values.description,
            unit: values.customUnit,
            normalRange: values.customNormalRange
          })
        });

        if (!testCategoryResponse.ok) {
          throw new Error('Lỗi khi tạo loại xét nghiệm');
        }

        const newTestCategory = await testCategoryResponse.json();
        
        // 2. Tạo service test category với test category vừa tạo
        const data: CreateServiceTestCategoryData = {
          serviceId: selectedService._id,
          testCategoryId: newTestCategory.data._id,
          isRequired: values.isRequired || false,
          customNormalRange: values.customNormalRange,
          customUnit: values.customUnit,
          targetValue: values.targetValue,
          notes: values.notes,
          minValue: values.minValue,
          maxValue: values.maxValue
        };

        await serviceTestCategoriesApi.create(data);
        message.success('Đã tạo chỉ số xét nghiệm mới thành công');
        
        // Reload test categories để cập nhật danh sách
        loadInitialData();
      }

      setIsModalVisible(false);
      loadServiceTestCategories(selectedService._id);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
      console.error('Modal error:', error);
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
      title: 'Tên xét nghiệm',
      key: 'testCategoryName',
      render: (_, record) => getTestCategoryName(record.testCategoryId),
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
      title: 'Khoảng giá trị chuẩn',
      dataIndex: 'customNormalRange',
      key: 'customNormalRange',
      render: (value, record) => {
        const defaultRange = getTestCategoryDetails(record.testCategoryId)?.normalRange;
        return (
          <div>
            {value ? (
              <div>
                <div><strong>Tùy chỉnh:</strong> {value}</div>
                <div className="text-sm text-gray-500">Mặc định: {defaultRange}</div>
              </div>
            ) : (
              <div className="text-gray-500">Sử dụng mặc định: {defaultRange}</div>
            )}
          </div>
        );
      },
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
      title: 'Giá trị tối ưu',
      dataIndex: 'targetValue',
      key: 'targetValue',
      render: (value) => value || <span className="text-gray-500">Chưa thiết lập</span>,
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

  const filteredServices = services.filter(service =>
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
                  Danh sách dịch vụ xét nghiệm
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
                    <Form form={bulkForm} layout="vertical">
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
                                  const response = await fetch('/api/test-categories', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                                    },
                                    body: JSON.stringify(values)
                                  });
                                  
                                  if (response.ok) {
                                    message.success('Đã tạo chỉ số xét nghiệm mới');
                                    loadInitialData(); // Reload data
                                  } else {
                                    message.error('Lỗi khi tạo chỉ số xét nghiệm');
                                  }
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
                                    name={`${tc._id}_customNormalRange`}
                                    label="Khoảng chuẩn"
                                    style={{ marginBottom: 12 }}
                                  >
                                    <Input 
                                      placeholder={tc.normalRange || "Ví dụ: 3.5-5.0"}
                                      size="small"
                                    />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item
                                    name={`${tc._id}_customUnit`}
                                    label="Đơn vị"
                                    style={{ marginBottom: 12 }}
                                  >
                                    <Input 
                                      placeholder={tc.unit || "mg/dL"}
                                      size="small"
                                    />
                                  </Form.Item>
                                </Col>
                              </Row>
                              
                              <Form.Item
                                name={`${tc._id}_targetValue`}
                                label="Giá trị tối ưu"
                                style={{ marginBottom: 12 }}
                              >
                                <Input 
                                  placeholder="Ví dụ: 4.5, <5.0"
                                  size="small"
                                />
                              </Form.Item>
                              
                              <Form.Item
                                name={`${tc._id}_notes`}
                                label="Ghi chú"
                                style={{ marginBottom: 0 }}
                              >
                                <Input.TextArea 
                                  rows={2}
                                  placeholder="Ghi chú cho chỉ số này..."
                                  size="small"
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
      >
        <Form form={form} layout="vertical">
          <Alert
            message={`Tạo chỉ số xét nghiệm cho dịch vụ: ${selectedService?.serviceName}`}
            type="info"
            showIcon
            className="mb-4"
          />
          
          <Form.Item
            name="testCategoryName"
            label="Tên chỉ số xét nghiệm"
            rules={[{ required: true, message: 'Vui lòng nhập tên chỉ số' }]}
          >
            <Input 
              placeholder="VD: Cholesterol, Glucose, HIV Test..."
              disabled={!!editingItem}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả chỉ số"
          >
            <Input 
              placeholder="VD: Đo lượng cholesterol trong máu..."
            />
          </Form.Item>

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
            <Col span={12}>
              <Form.Item
                name="customUnit"
                label="Đơn vị tùy chỉnh"
              >
                <Input placeholder="Ví dụ: mg/dL, IU/mL..." />
              </Form.Item>
            </Col>
          </Row>

          <div className="bg-blue-50 p-4 rounded mb-4">
            <Title level={5}>Giá trị dao động cho dịch vụ này</Title>
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

          <Form.Item
            name="customNormalRange"
            label="Khoảng giá trị bình thường (text)"
            help="Khoảng giá trị bình thường dạng text. VD: 3.5-5.0, <10, >200"
          >
            <Input placeholder="Ví dụ: 3.5-5.0, <10, >200..." />
          </Form.Item>

          <Form.Item
            name="targetValue"
            label="Giá trị lý tưởng"
            help="Giá trị tối ưu mà khách hàng nên đạt được"
          >
            <Input placeholder="Ví dụ: 4.5, <5.0, 80-120..." />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Ghi chú thêm về chỉ số này cho dịch vụ..."
            />
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