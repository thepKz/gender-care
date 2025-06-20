import {
    DollarOutlined,
    EditOutlined,
    GiftOutlined,
    PictureOutlined,
    PlusOutlined,
    DeleteOutlined,
    TeamOutlined
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Divider,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Select,
    Space,
    Typography,
    Row,
    Col
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { getServices } from '../../../api/endpoints/serviceApi';
import { CreateServicePackageRequest, Service, ServicePackage, UpdateServicePackageRequest, ServiceItem } from '../../../types';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface ServicePackageModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: CreateServicePackageRequest | UpdateServicePackageRequest) => Promise<void>;
  servicePackage?: ServicePackage | null; // null = create mode, ServicePackage = edit mode
  loading?: boolean;
}

const ServicePackageModal: React.FC<ServicePackageModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  servicePackage,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  
  const isEditMode = !!servicePackage;

  // Calculate total price of selected services with quantities
  const calculateTotalServicePrice = (services: ServiceItem[] = []) => {
    return services.reduce((total, serviceItem) => {
      const service = availableServices.find(s => s._id === serviceItem.serviceId);
      return total + (service?.price || 0) * serviceItem.quantity;
    }, 0);
  };

  // Load available services
  const loadServices = async () => {
    if (availableServices.length > 0) {
      return;
    }
    
    setServicesLoading(true);
    try {
      const response = await getServices({ limit: 100 });
      setAvailableServices(response.data.services);
    } catch (error) {
      console.error('Error loading services:', error);
      message.error('Không thể tải danh sách dịch vụ');
    } finally {
      setServicesLoading(false);
    }
  };

  // Auto-calculate price when services change
  const handleServicesChange = (services: ServiceItem[]) => {
    const totalPrice = calculateTotalServicePrice(services);
    if (totalPrice > 0) {
      setTimeout(() => {
        form.setFieldsValue({
          price: totalPrice
        });
      }, 0);
    }
  };

  // Load services when modal opens
  useEffect(() => {
    if (visible) {
      loadServices();
    }
  }, [visible]);

  // Populate form data in edit mode
  useEffect(() => {
    if (visible && availableServices.length > 0) {
      if (isEditMode && servicePackage) {
        // Convert old serviceIds to new services format
        const services: ServiceItem[] = servicePackage.services?.map(serviceItem => ({
          serviceId: typeof serviceItem.serviceId === 'object' ? serviceItem.serviceId._id : serviceItem.serviceId,
          quantity: serviceItem.quantity
        })) || [];
        
        form.setFieldsValue({
          name: servicePackage.name,
          description: servicePackage.description,
          price: servicePackage.price,
          services: services,
          durationInDays: servicePackage.durationInDays,
          isActive: servicePackage.isActive
        });
      } else {
        // Create mode - set defaults
        form.setFieldsValue({
          isActive: true,
          durationInDays: 30,
          services: []
        });
      }
    }
  }, [visible, availableServices, isEditMode, servicePackage, form]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      form.resetFields();
    }
  }, [visible, form]);

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Validate service selection
      if (!values.services || values.services.length === 0) {
        message.error('Vui lòng chọn ít nhất một dịch vụ');
        return;
      }

      const submitData: CreateServicePackageRequest | UpdateServicePackageRequest = {
        name: values.name.trim(),
        description: values.description?.trim() || '',
        price: Number(values.price),
        services: values.services,
        durationInDays: Number(values.durationInDays),
        ...(isEditMode && { isActive: values.isActive })
      };

      await onSubmit(submitData);
      form.resetFields();
    } catch (error: any) {
      if (error.errorFields) {
        console.log('Form validation failed:', error.errorFields);
        return;
      }
      
      console.error('Form submission error:', error);
      message.error('Có lỗi xảy ra khi gửi form');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          {isEditMode ? (
            <>
              <EditOutlined className="text-blue-600" />
              <span>Chỉnh sửa gói dịch vụ</span>
            </>
          ) : (
            <>
              <PlusOutlined className="text-green-600" />
              <span>Tạo gói dịch vụ mới</span>
            </>
          )}
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
        {/* Basic Information */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Tên gói dịch vụ"
              rules={[
                { required: true, message: 'Vui lòng nhập tên gói dịch vụ' },
                { min: 3, message: 'Tên gói phải có ít nhất 3 ký tự' }
              ]}
            >
              <Input 
                placeholder="Nhập tên gói dịch vụ" 
                prefix={<GiftOutlined />}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="price"
              label="Giá gói (VNĐ)"
              rules={[
                { required: true, message: 'Vui lòng nhập giá gói' },
                { type: 'number', min: 0, message: 'Giá phải lớn hơn 0' }
              ]}
            >
              <InputNumber
                placeholder="Giá sẽ tự động tính"
                min={0}
                className="w-full"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                prefix={<DollarOutlined />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Mô tả gói dịch vụ"
        >
          <TextArea
            placeholder="Nhập mô tả chi tiết về gói dịch vụ"
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>

        {/* Services with Quantities */}
        <Form.Item
          name="services"
          label="Dịch vụ và số lượng"
          rules={[
            { required: true, message: 'Vui lòng chọn ít nhất một dịch vụ' },
            {
              validator: (_, value) => {
                if (!value || value.length === 0) {
                  return Promise.reject('Vui lòng chọn ít nhất một dịch vụ');
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Form.List 
            name="services"
            initialValue={[]}
          >
            {(fields, { add, remove }, { errors }) => (
              <div>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8} className="mb-3 p-3 border border-gray-200 rounded-lg">
                    <Col span={14}>
                      <Form.Item
                        {...restField}
                        name={[name, 'serviceId']}
                        label="Dịch vụ"
                        rules={[{ required: true, message: 'Chọn dịch vụ' }]}
                      >
                        <Select
                          placeholder="Chọn dịch vụ"
                          loading={servicesLoading}
                          showSearch
                          optionFilterProp="children"
                          onChange={() => {
                            // Trigger price recalculation
                            const currentServices = form.getFieldValue('services');
                            handleServicesChange(currentServices);
                          }}
                        >
                          {availableServices.map((service) => (
                            <Option key={service._id} value={service._id}>
                              <div className="flex justify-between">
                                <span>{service.serviceName}</span>
                                <span className="text-green-600">
                                  {formatPrice(service.price)} VNĐ
                                </span>
                              </div>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label="Số lượng"
                        rules={[
                          { required: true, message: 'Nhập số lượng' },
                          { type: 'number', min: 1, message: 'Số lượng phải >= 1' }
                        ]}
                      >
                        <InputNumber
                          placeholder="Số lượng"
                          min={1}
                          className="w-full"
                          onChange={() => {
                            // Trigger price recalculation
                            setTimeout(() => {
                              const currentServices = form.getFieldValue('services');
                              handleServicesChange(currentServices);
                            }, 100);
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4} className="flex items-center justify-center">
                      <Button
                        type="link"
                        danger
                        onClick={() => {
                          remove(name);
                          // Trigger price recalculation after removal
                          setTimeout(() => {
                            const currentServices = form.getFieldValue('services');
                            handleServicesChange(currentServices);
                          }, 100);
                        }}
                        icon={<DeleteOutlined />}
                        className="mt-6"
                      />
                    </Col>
                  </Row>
                ))}
                
                <Button
                  type="dashed"
                  onClick={() => add({ serviceId: '', quantity: 1 })}
                  block
                  icon={<PlusOutlined />}
                  className="mb-2"
                >
                  Thêm dịch vụ
                </Button>
                <Form.ErrorList errors={errors} />
              </div>
            )}
          </Form.List>
        </Form.Item>

        {/* Duration */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="durationInDays"
              label="Thời hạn sử dụng (ngày)"
              rules={[
                { required: true, message: 'Vui lòng nhập thời hạn' },
                { type: 'number', min: 1, max: 365, message: 'Thời hạn từ 1-365 ngày' }
              ]}
            >
              <InputNumber
                placeholder="Ví dụ: 30"
                min={1}
                max={365}
                className="w-full"
                addonAfter="ngày"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            {isEditMode && (
              <Form.Item
                name="isActive"
                label="Trạng thái"
                valuePropName="checked"
              >
                <Select placeholder="Chọn trạng thái">
                  <Option value={true}>Hoạt động</Option>
                  <Option value={false}>Tạm dừng</Option>
                </Select>
              </Form.Item>
            )}
          </Col>
        </Row>

        {/* Submit Buttons */}
        <Form.Item className="mb-0 text-right">
          <Space>
            <Button onClick={handleCancel}>
              Hủy
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={isEditMode ? <EditOutlined /> : <PlusOutlined />}
            >
              {isEditMode ? 'Cập nhật' : 'Tạo gói'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ServicePackageModal; 