import { EyeInvisibleOutlined, EyeTwoTone, LockOutlined } from '@ant-design/icons';
import { Button, Form, Input, notification, Progress } from 'antd';
import { motion } from 'framer-motion';
import React, { useState } from 'react';

import authApi from '../../../api/endpoints/auth';
import { checkPasswordStrength, PasswordStrength } from '../../../utils/passwordUtils';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: '', color: '#d9d9d9' });

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    if (value) {
      setPasswordStrength(checkPasswordStrength(value));
    } else {
      setPasswordStrength({ score: 0, feedback: '', color: '#d9d9d9' });
    }
  };

  const onFinish = async (values: PasswordFormData) => {
    try {
      setLoading(true);
      
      // Gọi API đổi mật khẩu
      await authApi.changePassword(values.currentPassword, values.newPassword);
      
      notification.success({
        message: 'Đổi mật khẩu thành công!',
        description: 'Mật khẩu của bạn đã được cập nhật an toàn',
      });
      form.resetFields();
      setNewPassword('');
      setPasswordStrength({ score: 0, feedback: '', color: '#d9d9d9' });
      
      if (onSuccess) onSuccess();
      
    } catch (error: unknown) {
      console.error('Lỗi đổi mật khẩu:', error);
      
      notification.error({
        message: 'Lỗi đổi mật khẩu',
        description: 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại thông tin và thử lại sau.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Form.Item
            label={<span className="text-gray-700 font-medium">Mật khẩu hiện tại</span>}
            name="currentPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Nhập mật khẩu hiện tại"
              size="large"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              className="rounded-xl border-gray-200 hover:border-[#0C3C54] focus:border-[#0C3C54] transition-all duration-200"
              style={{ paddingTop: '12px', paddingBottom: '12px' }}
            />
          </Form.Item>

          <div></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Form.Item
            label={<span className="text-gray-700 font-medium">Mật khẩu mới</span>}
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const strength = checkPasswordStrength(value);
                  if (strength.score < 40) {
                    return Promise.reject('Mật khẩu quá yếu! Hãy sử dụng mật khẩu mạnh hơn.');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Nhập mật khẩu mới"
              size="large"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              className="rounded-xl border-gray-200 hover:border-[#0C3C54] focus:border-[#0C3C54] transition-all duration-200"
              style={{ paddingTop: '12px', paddingBottom: '12px' }}
              onChange={(e) => handlePasswordChange(e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-gray-700 font-medium">Xác nhận mật khẩu mới</span>}
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject('Mật khẩu xác nhận không khớp!');
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Xác nhận mật khẩu mới"
              size="large"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              className="rounded-xl border-gray-200 hover:border-[#0C3C54] focus:border-[#0C3C54] transition-all duration-200"
              style={{ paddingTop: '12px', paddingBottom: '12px' }}
            />
          </Form.Item>
        </div>

        {/* Password Strength Indicator */}
        {newPassword && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50 rounded-xl p-4 border border-gray-100"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-600">Độ mạnh mật khẩu:</span>
              <span className="text-sm font-semibold" style={{ color: passwordStrength.color }}>
                {passwordStrength.feedback}
              </span>
            </div>
            <Progress
              percent={passwordStrength.score}
              strokeColor={passwordStrength.color}
              showInfo={false}
              size="small"
              className="mb-0"
            />
          </motion.div>
        )}

        {/* Submit Button */}
        <div className="pt-8 pb-4 flex justify-center">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            icon={<LockOutlined />}
            className="bg-gradient-to-r from-[#0C3C54] to-[#1a5570] border-none rounded-xl font-semibold px-12 py-3 h-auto hover:scale-105 hover:shadow-xl transition-all duration-200 text-white min-w-[200px]"
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </Button>
        </div>
      </Form>
    </motion.div>
  );
};

export default ChangePasswordForm; 