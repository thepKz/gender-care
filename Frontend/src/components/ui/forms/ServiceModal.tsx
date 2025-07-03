import {
    EditOutlined,
    PictureOutlined,
    PlusOutlined
} from '@ant-design/icons';
import {
    Button,
    Checkbox,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Select,
    Space
} from 'antd';
import React, { useEffect } from 'react';
import { CreateServiceRequest, Service, UpdateServiceRequest } from '../../../types';

const { TextArea } = Input;
const { Option } = Select;

interface ServiceModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: CreateServiceRequest | UpdateServiceRequest) => Promise<void>;
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
  const isEditMode = !!service;

  // Reset form khi modal đóng/mở
  useEffect(() => {
    if (visible) {
      if (isEditMode && service) {
        // Edit mode - populate form với data hiện có
        form.setFieldsValue({
          serviceName: service.serviceName,
          price: service.price,
          description: service.description,
          serviceType: service.serviceType,
          availableAt: service.availableAt
        });
      } else {
        // Create mode - reset form
        form.resetFields();
      }
    }
  }, [visible, service, isEditMode, form]);

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Validate price
      if (values.price <= 0) {
        message.error('Giá dịch vụ phải lớn hơn 0');
        return;
      }

      // Validate availableAt
      if (!values.availableAt || values.availableAt.length === 0) {
        message.error('Vui lòng chọn ít nhất một địa điểm cung cấp');
        return;
      }

      const submitData: CreateServiceRequest | UpdateServiceRequest = {
        serviceName: values.serviceName.trim(),
        price: Number(values.price),
        description: values.description.trim(),
        image: values.image?.trim() || undefined,
        serviceType: values.serviceType,
        availableAt: values.availableAt
      };

      await onSubmit(submitData);
      form.resetFields();
    } catch (error) {
      // Form validation errors sẽ được handle bởi Ant Design
      console.error('Form validation error:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <EditOutlined className="text-blue-primary" />
              <span>Chỉnh sửa dịch vụ</span>
            </>
          ) : (
            <>
              <PlusOutlined className="text-green-primary" />
              <span>Thêm dịch vụ mới</span>
            </>
          )}
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={600}
      className="service-modal"
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          className="bg-blue-primary hover:bg-blue-secondary"
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
        {/* Service Name */}
        <Form.Item
          label="Tên dịch vụ"
          name="serviceName"
          rules={[
            { required: true, message: 'Vui lòng nhập tên dịch vụ' },
            { min: 3, message: 'Tên dịch vụ phải có ít nhất 3 ký tự' },
            { max: 100, message: 'Tên dịch vụ không được quá 100 ký tự' }
          ]}
        >
          <Input
            placeholder="Nhập tên dịch vụ"
            className="rounded-lg"
            maxLength={100}
            showCount
          />
        </Form.Item>

        {/* Service Type */}
        <Form.Item
          label="Loại dịch vụ"
          name="serviceType"
          rules={[{ required: true, message: 'Vui lòng chọn loại dịch vụ' }]}
        >
          <Select
            placeholder="Chọn loại dịch vụ"
            className="rounded-lg"
            getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
          >
            <Option value="consultation">
              <span className="flex items-center gap-2">
                👩‍⚕️ Tư vấn
              </span>
            </Option>
            <Option value="test">
              <span className="flex items-center gap-2">
                🧪 Xét nghiệm
              </span>
            </Option>
            <Option value="treatment">
              <span className="flex items-center gap-2">
                💊 Điều trị
              </span>
            </Option>
            <Option value="other">
              <span className="flex items-center gap-2">
                ⚕️ Khác
              </span>
            </Option>
          </Select>
        </Form.Item>

        {/* Price */}
        <Form.Item
          label="Giá dịch vụ (VNĐ)"
          name="price"
          rules={[
            { required: true, message: 'Vui lòng nhập giá dịch vụ' },
            { type: 'number', min: 1000, message: 'Giá dịch vụ phải ít nhất 1,000 VNĐ' },
            { type: 'number', max: 100000000, message: 'Giá dịch vụ không được quá 100,000,000 VNĐ' }
          ]}
        >
          <InputNumber
            min={1000}
            max={100000000}
            step={1000}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => {
              const parsed = parseInt(value!.replace(/\$\s?|(,*)/g, ''), 10) || 1000;
              return Math.max(1000, Math.min(100000000, parsed)) as 1000 | 100000000;
            }}
            placeholder="Nhập giá dịch vụ"
          />
        </Form.Item>

        {/* Available Locations */}
        <Form.Item
          label="Địa điểm cung cấp"
          name="availableAt"
          rules={[
            { required: true, message: 'Vui lòng chọn ít nhất một địa điểm' },
            { type: 'array', min: 1, message: 'Vui lòng chọn ít nhất một địa điểm' }
          ]}
        >
          <Checkbox.Group className="w-full">
            <Space direction="vertical" className="w-full">
              <Checkbox value="Center" className="text-gray-700">
                🏥 Tại trung tâm
              </Checkbox>
            </Space>
          </Checkbox.Group>
        </Form.Item>

        {/* Image URL */}
        <Form.Item
          label="Hình ảnh dịch vụ (URL)"
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

        {/* Description */}
        <Form.Item
          label="Mô tả dịch vụ"
          name="description"
          rules={[
            { required: true, message: 'Vui lòng nhập mô tả dịch vụ' },
            { min: 10, message: 'Mô tả phải có ít nhất 10 ký tự' },
            { max: 500, message: 'Mô tả không được quá 500 ký tự' }
          ]}
        >
          <TextArea
            placeholder="Nhập mô tả chi tiết về dịch vụ..."
            className="rounded-lg"
            rows={4}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ServiceModal; 