import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Row, Col } from 'antd';
import { UserOutlined, PhoneOutlined, CalendarOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { UserProfile } from '../../types';
import { CreateUserProfileRequest, UpdateUserProfileRequest } from '../../api/endpoints/userProfileApi';
import './UserProfile.css';


interface UserProfileModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: CreateUserProfileRequest | UpdateUserProfileRequest) => Promise<void>;
  editingProfile?: UserProfile | null;
  loading?: boolean;
  title?: string;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  editingProfile,
  loading = false,
  title
}) => {
  const [form] = Form.useForm();
  const isEditing = !!editingProfile;

  useEffect(() => {
    if (visible) {
      if (isEditing && editingProfile) {
        // Fill form with existing data for editing
        form.setFieldsValue({
          fullName: editingProfile.fullName,
          gender: editingProfile.gender,
          phone: editingProfile.phone,
          year: editingProfile.year ? dayjs(editingProfile.year) : null
        });
      } else {
        // Reset form for creating new profile
        form.resetFields();
      }
    }
  }, [visible, isEditing, editingProfile, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const submitData = {
        fullName: values.fullName.trim(),
        gender: values.gender,
        phone: values.phone?.trim() || undefined,
        year: values.year ? values.year.format('YYYY-MM-DD') : undefined
      };

      await onSubmit(submitData);
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const validatePhone = (_: unknown, value: string) => {
    if (!value) return Promise.resolve();
    
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(value)) {
      return Promise.reject(new Error('Số điện thoại không hợp lệ (10-11 chữ số)'));
    }
    return Promise.resolve();
  };

  const modalTitle = title || (isEditing ? 'Chỉnh sửa hồ sơ bệnh án' : 'Thêm hồ sơ bệnh án mới');

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <UserOutlined className="text-blue-500" />
          <span className="text-lg font-semibold">{modalTitle}</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText={isEditing ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
      width={600}
      destroyOnClose
      maskClosable={false}
      className="user-profile-modal"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 mb-2">
           <strong>Lưu ý:</strong> Hồ sơ bệnh án có thể được tạo cho bản thân hoặc người thân.
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          autoComplete="off"
          className="space-y-4"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="fullName"
                label={
                  <span className="flex items-center space-x-1">
                    <UserOutlined className="text-gray-500" />
                    <span>Họ và tên</span>
                    <span className="text-red-500">*</span>
                  </span>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập họ và tên' },
                  { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
                  { max: 50, message: 'Họ tên không được vượt quá 50 ký tự' },
                  {
                    pattern: /^[a-zA-ZÀ-ỹ\s]+$/,
                    message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng'
                  }
                ]}
              >
                <Input
                  placeholder="Nhập họ và tên đầy đủ"
                  size="large"
                  prefix={<UserOutlined className="text-gray-400" />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="gender"
                label={
                  <span className="flex items-center space-x-1">
                    <span>Giới tính</span>
                    <span className="text-red-500">*</span>
                  </span>
                }
                rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
              >
                <Select
                  placeholder="Chọn giới tính"
                  size="large"
                  options={[
                    { value: 'male', label: 'Nam' },
                    { value: 'female', label: 'Nữ' },
                    { value: 'other', label: 'Khác' }
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="year"
                label={
                  <span className="flex items-center space-x-1">
                    <CalendarOutlined className="text-gray-500" />
                    <span>Năm sinh</span>
                  </span>
                }
              >
                <DatePicker
                  placeholder="Chọn năm sinh"
                  size="large"
                  picker="year"
                  disabledDate={(current) => current && current > dayjs().endOf('year')}
                  className="w-full"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="phone"
                label={
                  <span className="flex items-center space-x-1">
                    <PhoneOutlined className="text-gray-500" />
                    <span>Số điện thoại</span>
                  </span>
                }
                rules={[
                  { validator: validatePhone }
                ]}
              >
                <Input
                  placeholder="Nhập số điện thoại (tùy chọn)"
                  size="large"
                  prefix={<PhoneOutlined className="text-gray-400" />}
                  maxLength={11}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 flex items-start space-x-2">
            <span>
              Thông tin cá nhân sẽ được bảo mật và chỉ sử dụng cho mục đích y tế. 
              Bạn có thể cập nhật hoặc xóa thông tin này bất kỳ lúc nào.
            </span>
          </p>
        </div>
      </motion.div>
    </Modal>
  );
};

export default UserProfileModal; 