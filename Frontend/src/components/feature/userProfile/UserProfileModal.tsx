
import { Form, Input, Modal, Select } from 'antd';
import SimpleDatePicker from '../../ui/SimpleDatePicker';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import React, { useEffect } from 'react';
import { CreateUserProfileRequest, UpdateUserProfileRequest } from '../../../api/endpoints/userProfileApi';
import { UserProfile } from '../../../types';
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

  const modalTitle = title || (isEditing ? 'Chỉnh sửa thông tin cơ bản' : 'Thêm hồ sơ bệnh án mới');

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText={isEditing ? "Lưu thay đổi" : "Tạo mới"}
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


        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          autoComplete="off"
          className="mt-4"
        >
          <Form.Item
            label={
              <span>
                Họ và tên <span className="text-red-500">*</span>
              </span>
            }
            name="fullName"
            rules={[
              { required: true, message: 'Vui lòng nhập họ và tên' },
              { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
              { max: 50, message: 'Họ tên không được quá 50 ký tự' }
            ]}
          >
            <Input placeholder="Nhập họ và tên" />
          </Form.Item>

          <Form.Item
            label={
              <span>
                Giới tính <span className="text-red-500">*</span>
              </span>
            }
            name="gender"
            rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
          >
            <Select placeholder="Chọn giới tính">
              <Select.Option value="male">Nam</Select.Option>
              <Select.Option value="female">Nữ</Select.Option>
              <Select.Option value="other">Khác</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={
              <span>
                Số điện thoại <span className="text-red-500">*</span>
              </span>
            }
            name="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có đúng 10 chữ số' }
            ]}
          >
            <Input placeholder="Nhập số điện thoại" maxLength={10} />
          </Form.Item>

          <Form.Item
            label={
              <span>
                Ngày sinh <span className="text-red-500">*</span>
              </span>
            }
            name="year"
            rules={[
              { required: true, message: 'Vui lòng chọn ngày sinh' }
            ]}
          >
            <SimpleDatePicker
              placeholder="Chọn ngày sinh"
              style={{ width: '100%' }}
              value=""
              onChange={() => {}}
            />
          </Form.Item>
        </Form>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            Thông tin cá nhân sẽ được bảo mật và chỉ sử dụng cho mục đích y tế. 
            Bạn có thể cập nhật hoặc xóa thông tin này bất kỳ lúc nào.
          </p>
        </div>
      </motion.div>
    </Modal>
  );
};

export default UserProfileModal; 