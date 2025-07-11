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
import React, { useEffect, useState } from 'react';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface CreateServiceRequest {
  serviceName: string;
  serviceType: 'consultation' | 'test' | 'treatment';
  description: string;
  price: number;
  availableAt: ('Athome' | 'Online' | 'Center')[];
}

interface Service {
  id: string;
  serviceName: string;
  serviceType: 'consultation' | 'test' | 'treatment';
  description: string;
  price: number;
  availableAt: ('Athome' | 'Online' | 'Center')[];
  status: 'active' | 'inactive' | 'suspended';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: CreateServiceRequest) => Promise<void>;
  service?: Service | null; // null = create mode, Service = edit mode
  loading?: boolean;
}

const ServiceModal: React.FC<ServiceModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  service,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingService, setPendingService] = useState<any>(null);
  
  const isEditMode = !!service;

  // Service type mappings
  const getServiceTypeText = (type: string) => {
    switch (type) {
      case 'consultation': return 'Tư vấn';
      case 'test': return 'Xét nghiệm';
      case 'treatment': return 'Điều trị';
      default: return type;
    }
  };

  const getLocationText = (location: string) => {
    switch (location) {
      case 'Athome': return 'Tại nhà';
      case 'Online': return 'Trực tuyến';
      case 'Center': return 'Tại trung tâm';
      default: return location;
    }
  };

  // Populate form data in edit mode
  useEffect(() => {
    if (visible) {
      if (isEditMode && service) {
        form.setFieldsValue({
          serviceName: service.serviceName,
          serviceType: service.serviceType,
          description: service.description,
          price: service.price,
          availableAt: service.availableAt
        });
      } else {
        // Create mode - set defaults
        form.setFieldsValue({
          serviceType: 'consultation',
          availableAt: ['Center']
        });
      }
    }
  }, [visible, isEditMode, service, form]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        form.resetFields();
      }, 0);
    }
  }, [visible, form]);

  // Handle form submit - show confirmation instead of direct submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Validate required fields
      if (!values.serviceName || !values.serviceType || !values.description || 
          !values.price || !values.availableAt || values.availableAt.length === 0) {
        message.error('Vui lòng điền đầy đủ thông tin');
        return;
      }

      setPendingService(values);
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

  // Handle confirmation OK - actually submit the service
  const handleConfirmOk = async () => {
    if (!pendingService) return;
    
    const submitData: CreateServiceRequest = {
      serviceName: pendingService.serviceName.trim(),
      serviceType: pendingService.serviceType,
      description: pendingService.description.trim(),
      price: Number(pendingService.price),
      availableAt: pendingService.availableAt
    };

    await onSubmit(submitData);
    setConfirmVisible(false);
    setPendingService(null);
    form.resetFields();
  };

  // Handle confirmation cancel - back to form
  const handleConfirmCancel = () => {
    setConfirmVisible(false);
  };

  // Handle main modal cancel
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <>
      {/* Main Form Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            {isEditMode ? (
              <span>Chỉnh sửa dịch vụ</span>
            ) : (
              <span>Thêm dịch vụ mới</span>
            )}
          </div>
        }
        open={visible && !confirmVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          {/* Service Name */}
          <Form.Item
            name="serviceName"
            label="Tên dịch vụ"
            rules={[
              { required: true, message: 'Vui lòng nhập tên dịch vụ!' },
              { min: 3, message: 'Tên dịch vụ phải có ít nhất 3 ký tự' }
            ]}
          >
            <Input placeholder="Nhập tên dịch vụ" />
          </Form.Item>

          {/* Service Type */}
          <Form.Item
            name="serviceType"
            label="Loại dịch vụ"
            rules={[{ required: true, message: 'Vui lòng chọn loại dịch vụ!' }]}
          >
            <Select placeholder="Chọn loại dịch vụ">
              <Option value="consultation">Tư vấn</Option>
              <Option value="test">Xét nghiệm</Option>
              <Option value="treatment">Điều trị</Option>
            </Select>
          </Form.Item>

          {/* Description */}
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="Nhập mô tả chi tiết về dịch vụ"
              showCount
              maxLength={500}
            />
          </Form.Item>

          {/* Price */}
          <Form.Item
            name="price"
            label="Giá (VNĐ)"
            rules={[
              { required: true, message: 'Vui lòng nhập giá!' },
              { type: 'number', min: 0, message: 'Giá phải lớn hơn hoặc bằng 0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value: any) => (value || '').replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập giá dịch vụ"
            />
          </Form.Item>

          {/* Available At */}
          <Form.Item
            name="availableAt"
            label="Hình thức cung cấp"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một hình thức!' }]}
          >
            <Select 
              mode="multiple"
              placeholder="Chọn hình thức cung cấp (có thể chọn nhiều)"
              style={{ minHeight: '40px' }}
            >
              <Option value="Athome">Tại nhà</Option>
              <Option value="Online">Trực tuyến</Option>
              <Option value="Center">Tại trung tâm</Option>
            </Select>
          </Form.Item>

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
              {isEditMode ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmVisible}
        title={
          <span>
            <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
            Xác nhận thông tin dịch vụ
          </span>
        }
        onOk={handleConfirmOk}
        onCancel={handleConfirmCancel}
        okText="OK"
        cancelText="Cancel"
        maskClosable={false}
        confirmLoading={loading}
      >
        {pendingService && (
          <div>
            <p><strong>Tên dịch vụ:</strong> {pendingService.serviceName}</p>
            <p><strong>Loại dịch vụ:</strong> {getServiceTypeText(pendingService.serviceType)}</p>
            <p><strong>Mô tả:</strong> {pendingService.description}</p>
            <p><strong>Hình thức cung cấp:</strong> {
              pendingService.availableAt?.map((location: string) => getLocationText(location)).join(', ')
            }</p>
            <p>
              <strong>Giá:</strong>
              <span style={{ color: '#1677ff', fontWeight: 'bold', fontSize: 18, marginLeft: 8 }}>
                {formatPrice(pendingService.price)} VNĐ
              </span>
            </p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ServiceModal; 