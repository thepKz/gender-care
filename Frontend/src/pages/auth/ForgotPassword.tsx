import { ArrowLeftOutlined, EyeInvisibleOutlined, EyeTwoTone, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, message, Progress, Result, Steps } from 'antd';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authApi from '../../api/endpoints/auth';
import { checkPasswordStrength, PasswordStrength } from '../../utils/passwordUtils';

const { Step } = Steps;

interface EmailFormData {
  email: string;
}

interface ResetFormData {
  password: string;
  confirmPassword: string;
}



const ForgotPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(searchParams.get('token') ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: '', color: '#d9d9d9' });
  const [resetForm] = Form.useForm();
  const [emailForm] = Form.useForm();

  const resetToken = searchParams.get('token');

  // Bước 1: Gửi email reset password
  const handleSendResetEmail = async (values: EmailFormData) => {
    try {
      setLoading(true);
      await authApi.forgotPassword(values.email);
      
      setEmail(values.email);
      setCurrentStep(1);
      message.success('Email reset mật khẩu đã được gửi!');
      
    } catch (error: any) {
      console.error('Lỗi gửi email reset:', error);
      
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Reset mật khẩu với token
  const handleResetPassword = async (values: ResetFormData) => {
    if (!resetToken) {
      message.error('Token reset không hợp lệ');
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword(resetToken, values.password);
      
      setCurrentStep(2);
      message.success('Đặt lại mật khẩu thành công!');
      
      // Redirect sau 3 giây
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error: any) {
      console.error('Lỗi reset mật khẩu:', error);
      
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error.response?.status === 400) {
        message.error('Token reset không hợp lệ hoặc đã hết hạn');
      } else {
        message.error('Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại sau.');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl rounded-xl border-0 overflow-hidden">
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E] rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <LockOutlined className="text-2xl text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-[#0C3C54] mb-2">Quên mật khẩu</h1>
            <p className="text-gray-600">
              {currentStep === 0 && 'Nhập email để nhận liên kết đặt lại mật khẩu'}
              {currentStep === 1 && 'Đặt mật khẩu mới cho tài khoản của bạn'}
              {currentStep === 2 && 'Mật khẩu đã được đặt lại thành công'}
            </p>
          </div>

          {/* Progress Steps */}
          <Steps current={currentStep} size="small" className="mb-8">
            <Step title="Gửi email" />
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
                description="Chúng tôi sẽ gửi liên kết đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư và làm theo hướng dẫn."
                type="info"
                showIcon
                className="mb-6"
              />

              <Form
                form={emailForm}
                layout="vertical"
                onFinish={handleSendResetEmail}
                autoComplete="off"
              >
                <Form.Item
                  label="Email"
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
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item className="mb-4">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                    className="bg-gradient-to-r from-[#0C3C54] to-[#1a5570] border-none rounded-lg font-semibold h-12 hover:scale-105 hover:shadow-lg transition-all duration-200"
                  >
                    {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
                  </Button>
                </Form.Item>
              </Form>
            </motion.div>
          )}

          {/* Bước 1: Đặt lại mật khẩu */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {email && (
                <Alert
                  message="Email đã được gửi"
                  description={`Chúng tôi đã gửi liên kết đặt lại mật khẩu đến ${email}. Vui lòng kiểm tra email và click vào liên kết để tiếp tục.`}
                  type="success"
                  showIcon
                  className="mb-6"
                />
              )}

              {resetToken && (
                <Form
                  form={resetForm}
                  layout="vertical"
                  onFinish={handleResetPassword}
                  autoComplete="off"
                >
                  <Form.Item
                    label="Mật khẩu mới"
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
                      className="rounded-lg"
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
                    label="Xác nhận mật khẩu"
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
                      className="rounded-lg"
                    />
                  </Form.Item>

                  <Form.Item className="mb-4">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                      className="bg-gradient-to-r from-[#0C3C54] to-[#1a5570] border-none rounded-lg font-semibold h-12 hover:scale-105 hover:shadow-lg transition-all duration-200"
                    >
                      {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                    </Button>
                  </Form.Item>
                </Form>
              )}
            </motion.div>
          )}

          {/* Bước 2: Thành công */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Result
                status="success"
                title="Đặt lại mật khẩu thành công!"
                subTitle="Mật khẩu của bạn đã được cập nhật. Bạn sẽ được chuyển hướng đến trang đăng nhập trong 3 giây."
                extra={
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate('/login')}
                    className="bg-gradient-to-r from-[#0C3C54] to-[#1a5570] border-none rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    Đăng nhập ngay
                  </Button>
                }
              />
            </motion.div>
          )}

          {/* Back to Login */}
          <div className="text-center pt-6 border-t border-gray-100">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[#0C3C54] hover:text-[#2A7F9E] transition-colors"
            >
              <ArrowLeftOutlined />
              <span>Quay lại đăng nhập</span>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword; 