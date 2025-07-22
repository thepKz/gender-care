import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import {
    Button,
    Divider,
    Form,
    Input,
    notification,
    Select
} from 'antd';
import SimpleDatePicker from '../../ui/SimpleDatePicker';
import { motion } from 'framer-motion';
import moment from 'moment';
import React, { useEffect } from 'react';
import { UserProfile } from '../../../types';

interface ProfileFormProps {
  initialValues?: UserProfile;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  loading
}) => {
  const [form] = Form.useForm();
  const isEdit = !!initialValues?._id;

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        year: initialValues.year ? moment(initialValues.year) : null
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleSubmit = async (values: any) => {
    try {
      const formattedValues = {
        ...values,
        year: values.year ? values.year.format('YYYY-MM-DD') : undefined
      };
      
      await onSubmit(formattedValues);
      form.resetFields();
    } catch (error) {
      console.error('Error submitting form:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Có lỗi xảy ra khi lưu hồ sơ. Vui lòng thử lại sau.'
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-semibold text-[#0C3C54] mb-6">
        {isEdit ? 'Chỉnh sửa hồ sơ' : 'Tạo hồ sơ mới'}
      </h2>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        className="profile-form"
      >
        <Form.Item
          name="fullName"
          label="Họ và tên"
          rules={[
            { required: true, message: 'Vui lòng nhập họ và tên' },
            { min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự' }
          ]}
        >
          <Input 
            placeholder="Nhập họ và tên" 
            className="rounded-lg" 
            size="large"
          />
        </Form.Item>
        
        <Form.Item
          name="gender"
          label="Giới tính"
          rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
        >
          <Select 
            placeholder="Chọn giới tính" 
            className="rounded-lg" 
            size="large"
            options={[
              { value: 'male', label: 'Nam' },
              { value: 'female', label: 'Nữ' },
              { value: 'other', label: 'Khác' }
            ]}
          />
        </Form.Item>
        
        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[
            { 
              pattern: /^[0-9]{10}$/, 
              message: 'Số điện thoại phải có 10 chữ số'
            }
          ]}
        >
          <Input 
            placeholder="Nhập số điện thoại" 
            className="rounded-lg" 
            size="large"
          />
        </Form.Item>
        
        <Form.Item
          name="year"
          label="Ngày sinh"
        >
          <SimpleDatePicker
            placeholder="Chọn ngày sinh"
            style={{ width: '100%', height: '40px', borderRadius: '8px' }}
          />
        </Form.Item>

        <Divider className="my-6" />
        
        <div className="flex justify-end gap-4">
          <Button
            onClick={onCancel}
            size="large"
            icon={<CloseOutlined />}
            className="rounded-lg"
          >
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            icon={<SaveOutlined />}
            className="rounded-lg bg-[#0C3C54] hover:bg-[#0C3C54]/90 border-none"
          >
            {isEdit ? 'Cập nhật hồ sơ' : 'Tạo hồ sơ'}
          </Button>
        </div>
      </Form>
    </motion.div>
  );
};

export default ProfileForm; 