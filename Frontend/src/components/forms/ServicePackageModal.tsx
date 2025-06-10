import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  message,
  Space,
  Divider,
  Alert,
  Typography,
  Spin
} from 'antd';
import { 
  DollarOutlined, 
  EditOutlined, 
  PlusOutlined,
  PictureOutlined,
  GiftOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { ServicePackage, CreateServicePackageRequest, UpdateServicePackageRequest, Service } from '../../types';
import { getServices } from '../../api/endpoints/serviceApi';

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
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  
  const isEditMode = !!servicePackage;

  // Calculate total price of selected services
  const calculateTotalServicePrice = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  };

  // Load available services
  const loadServices = async () => {
    // Chỉ load nếu chưa có data hoặc data rỗng
    if (availableServices.length > 0) {
      return;
    }
    
    setServicesLoading(true);
    try {
      const response = await getServices({ limit: 100 }); // Get all services
      setAvailableServices(response.data.services);
    } catch (error) {
      console.error('Error loading services:', error);
      message.error('Không thể tải danh sách dịch vụ');
    } finally {
      setServicesLoading(false);
    }
  };

  // Handle service selection change với debounce
  const handleServiceSelectionChange = useCallback((serviceIds: string[]) => {
    const selected = availableServices.filter(service => serviceIds.includes(service._id));
    setSelectedServices(selected);
    
    // Auto-calculate suggested original price
    const totalServicePrice = selected.reduce((total, service) => total + service.price, 0);
    if (totalServicePrice > 0) {
      // Sử dụng setTimeout để tránh conflict với form validation
      setTimeout(() => {
        form.setFieldsValue({
          priceBeforeDiscount: totalServicePrice
        });
      }, 0);
    }
  }, [availableServices, form]);

  // Load services chỉ khi modal mở
  useEffect(() => {
    if (visible) {
      loadServices();
    }
  }, [visible]);

  // Separate useEffect để populate form data khi có services và servicePackage
  useEffect(() => {
    if (visible && availableServices.length > 0) {
      if (isEditMode && servicePackage) {
        // Edit mode - populate form với data hiện có
        const serviceIds = servicePackage.serviceIds.map(service => 
          typeof service === 'string' ? service : service._id
        );
        
        form.setFieldsValue({
          name: servicePackage.name,
          description: servicePackage.description,
          image: servicePackage.image || '',
          priceBeforeDiscount: servicePackage.priceBeforeDiscount,
          price: servicePackage.price,
          serviceIds: serviceIds,
          isActive: servicePackage.isActive
        });
        
        // Set selected services for price calculation
        const selected = availableServices.filter(service => serviceIds.includes(service._id));
        setSelectedServices(selected);
      }
    }
  }, [visible, availableServices, isEditMode, servicePackage, form]);

  // Reset form khi modal đóng
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setSelectedServices([]);
    }
  }, [visible, form]);

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Validate pricing
      if (values.price > values.priceBeforeDiscount) {
        message.error('Giá sau giảm không thể lớn hơn giá gốc');
        return;
      }

      // Validate service selection
      if (!values.serviceIds || values.serviceIds.length === 0) {
        message.error('Vui lòng chọn ít nhất một dịch vụ');
        return;
      }

      const submitData: CreateServicePackageRequest | UpdateServicePackageRequest = {
        name: values.name.trim(),
        description: values.description.trim(),
        image: values.image?.trim() || undefined,
        priceBeforeDiscount: Number(values.priceBeforeDiscount),
        price: Number(values.price),
        serviceIds: values.serviceIds,
        ...(isEditMode && { isActive: values.isActive })
      };

      await onSubmit(submitData);
      form.resetFields();
      setSelectedServices([]);
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
    setSelectedServices([]);
    onCancel();
  };

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    const originalPrice = form.getFieldValue('priceBeforeDiscount');
    const currentPrice = form.getFieldValue('price');
    
    if (originalPrice && currentPrice && originalPrice > currentPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    return 0;
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
              <EditOutlined className="text-blue-primary text-lg" />
              <span className="text-lg font-semibold">Chỉnh sửa gói dịch vụ</span>
            </>
          ) : (
            <>
              <PlusOutlined className="text-green-primary text-lg" />
              <span className="text-lg font-semibold">Thêm gói dịch vụ mới</span>
            </>
          )}
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={800}
      className="service-package-modal"
      footer={[
        <Button key="cancel" onClick={handleCancel} size="large">
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          className="bg-blue-primary hover:bg-blue-secondary"
          size="large"
        >
          {isEditMode ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="pt-4"
      >
        {/* Package Name */}
        <Form.Item
          label="Tên gói dịch vụ"
          name="name"
          rules={[
            { required: true, message: 'Vui lòng nhập tên gói dịch vụ' },
            { min: 3, message: 'Tên gói dịch vụ phải có ít nhất 3 ký tự' },
            { max: 100, message: 'Tên gói dịch vụ không được quá 100 ký tự' }
          ]}
        >
          <Input
            placeholder="Nhập tên gói dịch vụ"
            className="rounded-lg"
            maxLength={100}
            showCount
            prefix={<GiftOutlined className="text-green-primary" />}
          />
        </Form.Item>

        {/* Description */}
        <Form.Item
          label="Mô tả gói dịch vụ"
          name="description"
          rules={[
            { required: true, message: 'Vui lòng nhập mô tả gói dịch vụ' },
            { min: 10, message: 'Mô tả phải có ít nhất 10 ký tự' },
            { max: 500, message: 'Mô tả không được quá 500 ký tự' }
          ]}
        >
          <TextArea
            placeholder="Nhập mô tả chi tiết về gói dịch vụ..."
            className="rounded-lg"
            rows={4}
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* Image URL */}
        <Form.Item
          label="Hình ảnh gói dịch vụ (URL)"
          name="image"
          rules={[
            { type: 'url', message: 'Vui lòng nhập URL hợp lệ' }
          ]}
        >
          <Input
            placeholder="https://example.com/image.jpg"
            className="rounded-lg"
            prefix={<PictureOutlined className="text-gray-400" />}
          />
        </Form.Item>

        <Divider>
          <span className="text-green-primary font-medium">Chọn dịch vụ & Định giá</span>
        </Divider>

        {/* Service Selection */}
        <Form.Item
          label={
            <div className="flex items-center gap-2">
              <TeamOutlined className="text-green-primary" />
              <span>Chọn các dịch vụ trong gói</span>
            </div>
          }
          name="serviceIds"
          rules={[
            { required: true, message: 'Vui lòng chọn ít nhất một dịch vụ' },
            { type: 'array', min: 1, message: 'Vui lòng chọn ít nhất một dịch vụ' }
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Chọn các dịch vụ..."
            className="rounded-lg"
            loading={servicesLoading}
            showSearch
            filterOption={(input, option) =>
              (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
            }
            onChange={handleServiceSelectionChange}
          >
            {availableServices.map(service => (
              <Option key={service._id} value={service._id}>
                <div className="flex justify-between items-center">
                  <span>{service.serviceName}</span>
                  <Text type="secondary" className="text-xs">
                    {formatPrice(service.price)} VNĐ
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Selected Services Info */}
        {selectedServices.length > 0 && (
          <Alert
            message={
              <div>
                <Text strong>Đã chọn {selectedServices.length} dịch vụ</Text>
                <br />
                <Text type="secondary">
                  Tổng giá trị: {formatPrice(calculateTotalServicePrice())} VNĐ
                </Text>
              </div>
            }
            type="info"
            className="mb-4"
            showIcon
          />
        )}

        {/* Pricing Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original Price */}
          <Form.Item
            label="Giá gốc (VNĐ)"
            name="priceBeforeDiscount"
            rules={[
              { required: true, message: 'Vui lòng nhập giá gốc' },
              { type: 'number', min: 1000, message: 'Giá gốc phải ít nhất 1,000 VNĐ' },
              { type: 'number', max: 100000000, message: 'Giá gốc không được quá 100,000,000 VNĐ' }
            ]}
          >
            <InputNumber
              placeholder="Nhập giá gốc"
              className="w-full rounded-lg"
              min={1000}
              max={100000000}
              step={1000}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              prefix={<DollarOutlined className="text-blue-primary" />}
            />
          </Form.Item>

          {/* Sale Price */}
          <Form.Item
            label="Giá bán (VNĐ)"
            name="price"
            rules={[
              { required: true, message: 'Vui lòng nhập giá bán' },
              { type: 'number', min: 1000, message: 'Giá bán phải ít nhất 1,000 VNĐ' },
              { type: 'number', max: 100000000, message: 'Giá bán không được quá 100,000,000 VNĐ' }
            ]}
          >
            <InputNumber
              placeholder="Nhập giá bán"
              className="w-full rounded-lg"
              min={1000}
              max={100000000}
              step={1000}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              prefix={<DollarOutlined className="text-green-primary" />}
            />
          </Form.Item>
        </div>

        {/* Discount Info */}
        {getDiscountPercentage() > 0 && (
          <Alert
            message={
              <Text>
                <Text strong className="text-red-600">
                  Giảm giá {getDiscountPercentage()}%
                </Text>
                {' - '}
                <Text>
                  Tiết kiệm {formatPrice(
                    (form.getFieldValue('priceBeforeDiscount') || 0) - 
                    (form.getFieldValue('price') || 0)
                  )} VNĐ
                </Text>
              </Text>
            }
            type="success"
            className="mb-4"
            showIcon
          />
        )}

        {/* Status for Edit Mode */}
        {isEditMode && (
          <Form.Item
            label="Trạng thái"
            name="isActive"
            valuePropName="checked"
          >
            <Select className="rounded-lg">
              <Option value={true}>
                <Space>
                  <span className="text-green-600">●</span>
                  Hoạt động
                </Space>
              </Option>
              <Option value={false}>
                <Space>
                  <span className="text-gray-400">●</span>
                  Tạm dừng
                </Space>
              </Option>
            </Select>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default ServicePackageModal; 