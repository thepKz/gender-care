// No icons needed - removed all icon imports
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

  // Auto-calculate priceBeforeDiscount when services change
  const handleServicesChange = (services: ServiceItem[]) => {
    const totalPrice = calculateTotalServicePrice(services);
    if (totalPrice > 0) {
      setTimeout(() => {
        form.setFieldsValue({
          priceBeforeDiscount: totalPrice
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
          priceBeforeDiscount: servicePackage.priceBeforeDiscount,
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

      // Validate price <= priceBeforeDiscount
      if (values.price > values.priceBeforeDiscount) {
        message.error('Giá gói không được lớn hơn giá gốc');
        return;
      }

      const submitData: CreateServicePackageRequest | UpdateServicePackageRequest = {
        name: values.name.trim(),
        description: values.description?.trim() || '',
        priceBeforeDiscount: values.priceBeforeDiscount ? Number(values.priceBeforeDiscount) : undefined,
        price: Number(values.price),
        services: values.services,
        durationInDays: Number(values.durationInDays),
        isActive: values.isActive
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

  // Get available services for a specific field (excluding already selected services in other fields)
  const getAvailableServicesForField = (currentFieldIndex: number) => {
    const currentServices = form.getFieldValue('services') || [];
    const selectedServiceIds = currentServices
      .map((service: any, index: number) => {
        // Exclude current field from filtering
        if (index === currentFieldIndex) return null;
        return service?.serviceId;
      })
      .filter((id: string) => id); // Remove null/undefined values

    // Filter out already selected services
    return availableServices.filter(service => 
      !selectedServiceIds.includes(service._id)
    );
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
            <span>Chỉnh sửa gói dịch vụ</span>
          ) : (
            <span>Tạo gói dịch vụ mới</span>
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
          />
        </Form.Item>

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

        {/* Duration and Status Row */}
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
            <Form.Item
              name="isActive"
              label="Trạng thái"
              rules={[
                { required: true, message: 'Vui lòng chọn trạng thái' }
              ]}
            >
              <Select placeholder="Chọn trạng thái">
                <Option value={true}>Hoạt động</Option>
                <Option value={false}>Ngưng hoạt động</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

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
                {fields.map(({ key, name, ...restField }) => {
                  const isMultipleServices = fields.length >= 2;
                  const availableServicesForField = getAvailableServicesForField(name);
                  
                  return (
                    <Row key={key} gutter={8} className="mb-3">
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
                            filterOption={(input, option) => {
                              // Find the service by option value to get serviceName
                              const service = availableServicesForField.find(s => s._id === option?.value);
                              if (!service) return false;
                              
                              // Case-insensitive search in serviceName
                              return service.serviceName.toLowerCase().includes(input.toLowerCase());
                            }}
                            onChange={() => {
                              // Set quantity to 1 if multiple services
                              if (isMultipleServices) {
                                const currentServices = form.getFieldValue('services');
                                currentServices[name].quantity = 1;
                                form.setFieldsValue({ services: currentServices });
                              }
                              
                              // Force re-render to update available services in other selects
                              setTimeout(() => {
                                const currentServices = form.getFieldValue('services');
                                form.setFieldsValue({ services: [...currentServices] });
                                handleServicesChange(currentServices);
                              }, 0);
                            }}
                          >
                            {availableServicesForField.map((service) => (
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
                          initialValue={isMultipleServices ? 1 : undefined}
                        >
                          <InputNumber
                            placeholder="Số lượng"
                            min={1}
                            className="w-full"
                            disabled={isMultipleServices}
                            value={isMultipleServices ? 1 : undefined}
                            onChange={() => {
                              // Only trigger price recalculation if not disabled
                              if (!isMultipleServices) {
                                setTimeout(() => {
                                  const currentServices = form.getFieldValue('services');
                                  handleServicesChange(currentServices);
                                }, 100);
                              }
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
                            
                            // After removal, if only 1 service left, enable quantity editing
                            setTimeout(() => {
                              const currentServices = form.getFieldValue('services');
                              
                              // Force re-render to update disabled state
                              form.setFieldsValue({ services: [...currentServices] });
                              
                              handleServicesChange(currentServices);
                            }, 100);
                          }}
                        >
                          Xóa
                        </Button>
                      </Col>
                    </Row>
                  );
                })}
                
                <Form.ErrorList errors={errors} />
                
                <Button
                  type="dashed"
                  onClick={() => {
                    add();
                    
                    // If this will be the second service, set all quantities to 1
                    setTimeout(() => {
                      const currentServices = form.getFieldValue('services');
                      if (currentServices && currentServices.length >= 2) {
                        const updatedServices = currentServices.map((service: any) => ({
                          ...service,
                          quantity: 1
                        }));
                        form.setFieldsValue({ services: updatedServices });
                        handleServicesChange(updatedServices);
                      }
                    }, 0);
                  }}
                  style={{ width: '100%' }}
                  className="mt-2"
                >
                  Thêm dịch vụ
                </Button>
              </div>
            )}
          </Form.List>
        </Form.Item>

        {/* Pricing Section - Giá gốc (readonly) và Giá gói (user input) nằm ngang */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="priceBeforeDiscount"
              label="Giá gốc (VNĐ)"
              tooltip="Giá gốc được tự động tính từ tổng giá các dịch vụ đã chọn"
            >
              <InputNumber
                placeholder="Giá gốc tự động tính"
                className="w-full"
                readOnly
                disabled
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="price"
              label="Giá gói (VNĐ)"
              rules={[
                { required: true, message: 'Vui lòng nhập giá gói' },
                { type: 'number', min: 0, message: 'Giá phải lớn hơn hoặc bằng 0' },
                {
                  validator: (_, value) => {
                    const priceBeforeDiscount = form.getFieldValue('priceBeforeDiscount');
                    if (value && priceBeforeDiscount && value > priceBeforeDiscount) {
                      return Promise.reject('Giá gói không được lớn hơn giá gốc');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                placeholder="Nhập giá gói"
                min={0}
                className="w-full"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Submit Buttons */}
        <Divider />
        <div className="flex justify-end gap-3">
          <Button onClick={handleCancel}>
            Hủy
          </Button>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={loading}
          >
            {isEditMode ? 'Cập nhật' : 'Tạo gói'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ServicePackageModal; 