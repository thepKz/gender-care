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
import { ExclamationCircleOutlined } from '@ant-design/icons';

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
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingPackage, setPendingPackage] = useState<any>(null);
  
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
      // Use setTimeout to ensure form is properly mounted before reset
      setTimeout(() => {
        form.resetFields();
      }, 0);
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

      setPendingPackage(values);
      setConfirmVisible(true);
    } catch (error: any) {
      if (error.errorFields) {
        console.log('Form validation failed:', error.errorFields);
        return;
      }
      
      console.error('Form submission error:', error);
      message.error('Có lỗi xảy ra khi gửi form');
    }
  };

  const handleConfirmOk = async () => {
    if (!pendingPackage) return;
    const submitData: CreateServicePackageRequest | UpdateServicePackageRequest = {
      name: pendingPackage.name.trim(),
      description: pendingPackage.description?.trim() || '',
      priceBeforeDiscount: pendingPackage.priceBeforeDiscount ? Number(pendingPackage.priceBeforeDiscount) : undefined,
      price: Number(pendingPackage.price),
      services: pendingPackage.services,
      durationInDays: Number(pendingPackage.durationInDays),
      isActive: pendingPackage.isActive
    };
    await onSubmit(submitData);
    setConfirmVisible(false);
    setPendingPackage(null);
    form.resetFields();
  };

  const handleConfirmCancel = () => {
    setConfirmVisible(false);
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

  // Thêm useEffect ở cấp component để đồng bộ quantity khi có >=2 dịch vụ
  useEffect(() => {
    const services = form.getFieldValue('services') || [];
    if (services.length >= 2) {
      const updated = services.map((item: any) => ({ ...item, quantity: 1 }));
      // Chỉ set lại nếu có item nào quantity khác 1
      if (services.some((item: any) => item.quantity !== 1)) {
        form.setFieldsValue({ services: updated });
      }
    }
  }, [form, form.getFieldValue('services')?.length]);

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
        <Row gutter={8} style={{ marginBottom: 0, paddingBottom: 0 }}>
          <Col span={12} style={{ marginBottom: 0, paddingBottom: 0 }}>
            <Form.Item
              name="durationInDays"
              label="Thời hạn sử dụng (ngày)"
              rules={[
                { required: true, message: 'Vui lòng nhập thời hạn' },
                { type: 'number', min: 1, max: 365, message: 'Thời hạn từ 1-365 ngày' }
              ]}
              style={{ marginBottom: 0, paddingBottom: 0 }}
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
          <Col span={12} style={{ marginBottom: 0, paddingBottom: 0 }}>
            <Form.Item
              name="isActive"
              label="Trạng thái"
              rules={[
                { required: true, message: 'Vui lòng chọn trạng thái' }
              ]}
              style={{ marginBottom: 0, paddingBottom: 0 }}
            >
              <Select placeholder="Chọn trạng thái">
                <Option value={true}>Hoạt động</Option>
                <Option value={false}>Ngưng hoạt động</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Services with Quantities */}
        <Form.Item label="Dịch vụ và số lượng" required style={{ marginBottom: 0, paddingBottom: 0, marginTop: 0 }}>
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
                    <Row key={key} gutter={8} align="middle" style={{ marginBottom: 0, paddingBottom: 0 }}>
                      <Col flex="auto" style={{ marginBottom: 0, paddingBottom: 0 }}>
                        <Form.Item
                          key={`serviceId-${key}`}
                          name={[name, 'serviceId']}
                          label="Dịch vụ"
                          rules={[{ required: true, message: 'Chọn dịch vụ' }]}
                          noStyle
                          style={{ marginBottom: 0, paddingBottom: 0 }}
                        >
                          <Select
                            placeholder="Chọn dịch vụ"
                            loading={servicesLoading}
                            showSearch
                            filterOption={(input, option) => {
                              const service = availableServicesForField.find(s => s._id === option?.value);
                              if (!service) return false;
                              return service.serviceName.toLowerCase().includes(input.toLowerCase());
                            }}
                            onChange={() => {
                              const currentServices = form.getFieldValue('services');
                              handleServicesChange(currentServices);
                            }}
                          >
                            {availableServicesForField.map((service) => (
                              <Option key={service._id} value={service._id}>
                                <div className="flex justify-between">
                                  <span>{service.serviceName}</span>
                                  <span className="text-green-600">{formatPrice(service.price)} VNĐ</span>
                                </div>
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col flex="120px" style={{ marginBottom: 0, paddingBottom: 0 }}>
                        <Form.Item
                          key={`quantity-${key}`}
                          name={[name, 'quantity']}
                          label="Số lượng"
                          rules={[
                            { required: true, message: 'Nhập số lượng' },
                            { type: 'number', min: 1, message: 'Số lượng phải >= 1' }
                          ]}
                          initialValue={1}
                          noStyle
                          style={{ marginBottom: 0, paddingBottom: 0 }}
                        >
                          <InputNumber
                            placeholder="Số lượng"
                            min={1}
                            max={99}
                            className="w-full"
                            disabled={isMultipleServices}
                            onChange={() => {
                              const currentServices = form.getFieldValue('services');
                              handleServicesChange(currentServices);
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4} className="flex items-center justify-center" style={{ marginBottom: 0, paddingBottom: 0 }}>
                        <Button
                          type="link"
                          danger
                          onClick={() => {
                            remove(name);
                            setTimeout(() => {
                              const currentServices = form.getFieldValue('services');
                              handleServicesChange(currentServices);
                            }, 0);
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
                    add({ quantity: 1 }); // Add with default quantity
                    
                    // Recalculate prices after adding new service
                    setTimeout(() => {
                      const currentServices = form.getFieldValue('services');
                      handleServicesChange(currentServices);
                    }, 0);
                  }}
                  style={{ width: '100%', marginBottom: 0, paddingBottom: 0 }}
                  disabled={fields.length >= 1}
                >
                  Thêm dịch vụ
                </Button>
              </div>
            )}
          </Form.List>
        </Form.Item>

        {/* Pricing Section - Giá gốc (readonly) và Giá gói (user input) nằm ngang */}
        <Row gutter={8} style={{ marginBottom: 0, paddingBottom: 0 }}>
          <Col span={12} style={{ marginBottom: 0, paddingBottom: 0 }}>
            <Form.Item
              name="priceBeforeDiscount"
              label="Giá gốc (VNĐ)"
              tooltip="Giá gốc được tự động tính từ tổng giá các dịch vụ đã chọn"
              style={{ marginBottom: 0, paddingBottom: 0 }}
            >
              <InputNumber
                placeholder="Giá gốc tự động tính"
                className="w-full"
                readOnly
                disabled
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value?.replace(/\$\s?|,*/g, '') as any}
              />
            </Form.Item>
          </Col>
          <Col span={12} style={{ marginBottom: 0, paddingBottom: 0 }}>
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
              style={{ marginBottom: 0, paddingBottom: 0 }}
            >
              <InputNumber
                placeholder="Nhập giá gói"
                min={0}
                className="w-full"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value?.replace(/\$\s?|,*/g, '') as any}
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

      {/* Modal xác nhận thông tin gói dịch vụ */}
      <Modal
        visible={confirmVisible}
        title={<span><ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />Xác nhận thông tin gói dịch vụ</span>}
        onOk={handleConfirmOk}
        onCancel={handleConfirmCancel}
        okText="OK"
        cancelText="Cancel"
        maskClosable={false}
      >
        {pendingPackage && (
          <div>
            <p><strong>Tên gói dịch vụ:</strong> {pendingPackage.name}</p>
            <p><strong>Mô tả:</strong> {pendingPackage.description}</p>
            <p><strong>Thời hạn sử dụng:</strong> {pendingPackage.durationInDays} ngày</p>
            <p><strong>Trạng thái:</strong> {pendingPackage.isActive ? 'Hoạt động' : 'Ngưng hoạt động'}</p>
            <p><strong>Dịch vụ:</strong></p>
            <ul>
              {pendingPackage.services.map((s: any, idx: number) => {
                const service = availableServices.find(sv => sv._id === s.serviceId);
                return (
                  <li key={idx}>
                    {service ? service.serviceName : 'Không xác định'} | Số lượng: {s.quantity}
                  </li>
                );
              })}
            </ul>
            <p><strong>Giá gốc:</strong> {pendingPackage.priceBeforeDiscount?.toLocaleString('vi-VN')} VNĐ</p>
            <p>
              <strong>Giá gói:</strong>
              <span style={{ color: '#1677ff', fontWeight: 'bold', fontSize: 22, marginLeft: 8 }}>
                {pendingPackage.price?.toLocaleString('vi-VN')} VNĐ
              </span>
            </p>
          </div>
        )}
      </Modal>
    </Modal>
  );
};

export default ServicePackageModal; 