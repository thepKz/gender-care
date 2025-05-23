import { EyeInvisibleOutlined, EyeTwoTone, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { Alert, Button, Divider, Form, Input, Progress } from 'antd';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import authApi from '../../api/endpoints/auth';
import { showErrorNotification, showSuccessNotification } from '../../utils/notification';
import { checkPasswordStrength, PasswordStrength } from '../../utils/passwordUtils';

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
      
      showSuccessNotification({
        title: 'Đổi mật khẩu thành công!',
        description: 'Mật khẩu của bạn đã được cập nhật an toàn',
      });
      form.resetFields();
      setNewPassword('');
      setPasswordStrength({ score: 0, feedback: '', color: '#d9d9d9' });
      
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      console.error('Lỗi đổi mật khẩu:', error);
      
      if (error.response?.data?.message) {
        showErrorNotification({
          title: 'Lỗi đổi mật khẩu',
          description: error.response.data.message,
        });
      } else if (error.response?.status === 400) {
        showErrorNotification({
          title: 'Mật khẩu không chính xác',
          description: 'Vui lòng kiểm tra lại mật khẩu hiện tại',
        });
      } else {
        showErrorNotification({
          title: 'Có lỗi xảy ra',
          description: 'Không thể đổi mật khẩu. Vui lòng thử lại sau',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-[#0C3C54] to-[#1a5570] rounded-xl flex items-center justify-center shadow-lg">
          <LockOutlined className="text-white text-xl" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[#0C3C54] mb-0">Đổi mật khẩu</h3>
          <p className="text-gray-500 text-sm mb-0">Cập nhật mật khẩu để bảo mật tài khoản</p>
        </div>
      </div>

      {/* Security Alert */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Alert
          message={
            <div className="flex items-center gap-2">
              <SafetyOutlined className="text-blue-500" />
              <span className="font-medium">Bảo mật tài khoản</span>
            </div>
          }
          description="Để đảm bảo an toàn, vui lòng sử dụng mật khẩu mạnh với ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
          type="info"
          showIcon={false}
          className="mb-8 rounded-xl border-l-4 border-l-blue-500 bg-blue-50 border-blue-100"
        />
      </motion.div>

      <Divider className="my-6" />

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
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
    </motion.div>
  );
};

export default ChangePasswordForm; 