import { ArrowLeftOutlined, EyeInvisibleOutlined, EyeTwoTone, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, notification, Progress, Result, Steps } from 'antd';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../../api/endpoints/auth';
import { checkPasswordStrength, PasswordStrength } from '../../utils/passwordUtils';

const { Step } = Steps;

interface EmailFormData {
  email: string;
}

interface ResetFormData {
  otp: string;
  password: string;
  confirmPassword: string;
}

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: '', color: '#d9d9d9' });
  const [resetForm] = Form.useForm();
  const [emailForm] = Form.useForm();

  // Bước 1: Gửi email reset password
  const handleSendResetEmail = async (values: EmailFormData) => {
    try {
      setLoading(true);
      await authApi.forgotPassword(values.email);
      
      setEmail(values.email);
      setCurrentStep(1);
      notification.success({
        message: 'Thành công',
        description: 'Mã OTP đã được gửi đến email của bạn!',
        placement: 'topRight',
      });
      
    } catch (error: any) {
      console.error('Lỗi gửi email reset:', error);
      
      if (error.response?.data?.message) {
        notification.error({
          message: 'Lỗi',
          description: error.response.data.message,
          placement: 'topRight',
        });
      } else {
        notification.error({
          message: 'Lỗi',
          description: 'Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau.',
          placement: 'topRight',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Reset mật khẩu với OTP
  const handleResetPassword = async (values: ResetFormData) => {
    try {
      setLoading(true);
      await authApi.resetPassword(email, values.otp, values.password);
      
      setCurrentStep(2);
      notification.success({
        message: 'Thành công',
        description: 'Đặt lại mật khẩu thành công!',
        placement: 'topRight',
      });
      
      // Redirect sau 3 giây
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error: any) {
      console.error('Lỗi reset mật khẩu:', error);
      
      if (error.response?.data?.message) {
        notification.error({
          message: 'Lỗi',
          description: error.response.data.message,
          placement: 'topRight',
        });
      } else if (error.response?.status === 400) {
        notification.error({
          message: 'Lỗi',
          description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
          placement: 'topRight',
        });
      } else {
        notification.error({
          message: 'Lỗi',
          description: 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại sau.',
          placement: 'topRight',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    if (value) {
      setPasswordStrength(checkPasswordStrength(value));
    } else {
      setPasswordStrength({ score: 0, feedback: '', color: '#d9d9d9' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-16 h-16 bg-gradient-to-r from-blue-primary to-green-primary rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <LockOutlined className="text-2xl text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-blue-primary mb-2">Quên mật khẩu</h1>
        <p className="text-gray-600 text-base">
          {currentStep === 0 && 'Nhập email để nhận mã OTP đặt lại mật khẩu'}
          {currentStep === 1 && 'Nhập mã OTP và đặt mật khẩu mới'}
          {currentStep === 2 && 'Mật khẩu đã được đặt lại thành công'}
        </p>
      </div>

      {/* Progress Steps */}
      <Steps current={currentStep} size="small" className="mb-8">
        <Step title="Gửi OTP" />
        <Step title="Đặt lại mật khẩu" />
        <Step title="Hoàn thành" />
      </Steps>

      {/* Bước 0: Nhập email */}
      {currentStep === 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Alert
            message="Thông tin"
            description="Chúng tôi sẽ gửi mã OTP (6 chữ số) đến email của bạn để xác thực việc đặt lại mật khẩu."
            type="info"
            showIcon
            className="mb-6 rounded-lg"
          />

          <Form
            form={emailForm}
            layout="vertical"
            onFinish={handleSendResetEmail}
            autoComplete="off"
          >
            <Form.Item
              label={<span className="text-gray-700 font-medium">Email</span>}
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="Nhập email của bạn"
                size="large"
                className="rounded-lg border-gray-300 focus:border-blue-primary"
              />
            </Form.Item>

            <Form.Item className="mb-6">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="bg-blue-primary hover:bg-blue-secondary border-none rounded-lg font-semibold h-12 transition-all duration-200"
              >
                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-blue-primary hover:text-blue-secondary font-medium transition-colors duration-200"
            >
              <ArrowLeftOutlined className="mr-2" />
              Quay lại đăng nhập
            </Link>
          </div>
        </motion.div>
      )}

      {/* Bước 1: Nhập OTP và đặt lại mật khẩu */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Alert
            message="Mã OTP đã được gửi"
            description={`Chúng tôi đã gửi mã OTP (6 chữ số) đến ${email}. Vui lòng kiểm tra email và nhập mã để tiếp tục.`}
            type="success"
            showIcon
            className="mb-6 rounded-lg"
          />

          <Form
            form={resetForm}
            layout="vertical"
            onFinish={handleResetPassword}
            autoComplete="off"
          >
            <Form.Item
              label={<span className="text-gray-700 font-medium">Mã OTP</span>}
              name="otp"
              rules={[
                { required: true, message: 'Vui lòng nhập mã OTP!' },
                { len: 6, message: 'Mã OTP phải có 6 chữ số!' },
                { pattern: /^\d{6}$/, message: 'Mã OTP chỉ chứa số!' },
              ]}
            >
              <Input
                placeholder="Nhập mã OTP 6 chữ số"
                size="large"
                className="rounded-lg border-gray-300 focus:border-blue-primary text-center text-lg tracking-widest"
                maxLength={6}
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-gray-700 font-medium">Mật khẩu mới</span>}
              name="password"
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
                className="rounded-lg border-gray-300 focus:border-blue-primary"
                onChange={(e) => handlePasswordChange(e.target.value)}
              />
            </Form.Item>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Độ mạnh mật khẩu:</span>
                  <span className="text-sm font-medium" style={{ color: passwordStrength.color }}>
                    {passwordStrength.feedback}
                  </span>
                </div>
                <Progress
                  percent={passwordStrength.score}
                  strokeColor={passwordStrength.color}
                  showInfo={false}
                  size="small"
                />
              </div>
            )}

            <Form.Item
              label={<span className="text-gray-700 font-medium">Xác nhận mật khẩu</span>}
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
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
                className="rounded-lg border-gray-300 focus:border-blue-primary"
              />
            </Form.Item>

            <Form.Item className="mb-6">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="bg-blue-primary hover:bg-blue-secondary border-none rounded-lg font-semibold h-12 transition-all duration-200"
              >
                {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-blue-primary hover:text-blue-secondary font-medium transition-colors duration-200"
            >
              <ArrowLeftOutlined className="mr-2" />
              Quay lại đăng nhập
            </Link>
          </div>
        </motion.div>
      )}

      {/* Bước 2: Hoàn thành */}
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Result
            status="success"
            title="Đặt lại mật khẩu thành công!"
            subTitle="Mật khẩu của bạn đã được cập nhật. Bạn sẽ được chuyển hướng đến trang đăng nhập trong giây lát."
            extra={[
              <Button 
                type="primary" 
                key="login"
                onClick={() => navigate('/login')}
                className="bg-blue-primary hover:bg-blue-secondary border-none rounded-lg font-semibold"
              >
                Đăng nhập ngay
              </Button>
            ]}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default ForgotPassword; 