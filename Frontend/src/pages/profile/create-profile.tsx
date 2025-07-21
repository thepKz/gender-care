import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  message
} from 'antd';
import SimpleDatePicker from '../../components/ui/SimpleDatePicker';
import { 
  ArrowLeftOutlined, 
  FormOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { useAuth } from '../../hooks/useAuth';
import { CreateUserProfileRequest } from '../../api/endpoints/userProfileApi';
import userProfileApi from '../../api/endpoints/userProfileApi';

const { Title, Text } = Typography;

const CreateProfile: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Tính toán ngày tối thiểu là 10 năm trước tính từ hiện tại
  const disabledDate = (current: dayjs.Dayjs) => {
    if (!current) return false;
    
    // Không cho phép chọn ngày trong tương lai
    if (current.isAfter(dayjs(), 'day')) {
      return true;
    }
    
    // Không cho phép chọn ngày dưới 10 tuổi (sinh sau 10 năm trước)
    const minDate = dayjs().subtract(10, 'years');
    if (current.isAfter(minDate, 'day')) {
      return true;
    }
    
    // Không cho phép chọn ngày quá xa (trước 120 năm)
    const maxDate = dayjs().subtract(120, 'years');
    if (current.isBefore(maxDate, 'day')) {
      return true;
    }
    
    return false;
  };

  const handleSubmit = async (values: {
    fullName: string;
    gender: 'male' | 'female' | 'other';
    phone?: string;
    year?: dayjs.Dayjs;
  }) => {
    try {
      setLoading(true);
      
      const profileData: CreateUserProfileRequest = {
        fullName: values.fullName,
        phone: values.phone,
        year: values.year ? values.year.format('YYYY-MM-DD') : undefined,
        gender: values.gender,
      };

      await userProfileApi.createProfile(profileData);
      message.success('Tạo hồ sơ thành công!');
      navigate('/user-profiles');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo hồ sơ';
      console.error('Error creating profile:', error);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b mt-[50.5px]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-[#0C3C54]/10 rounded-full">
                <UserAddOutlined style={{ fontSize: 32, color: "#0C3C54" }} />
              </div>
              <div>
                <Title level={2} className="mb-1 !text-[#0C3C54]">Tạo Hồ sơ Bệnh án Mới</Title>
                <Text type="secondary" className="text-base text-[#0C3C54]/70">
                  Điền thông tin để tạo hồ sơ bệnh án cho bản thân hoặc người thân
                </Text>
              </div>
            </div>

            <Button
              icon={<ArrowLeftOutlined />}
              size="large"
              onClick={() => navigate('/user-profiles')}
              className="hidden md:flex bg-[#0C3C54] text-white border-0 hover:bg-[#0C3C54]/90"
            >
              Quay lại
            </Button>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-6"
      >
        <div className="container mx-auto px-4 py-6 max-w-3xl mb-6">
          <Card className="rounded-xl shadow-md">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
              className="profile-form"
            >
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <div className="flex items-center text-blue-800 font-medium mb-2">
                  <FormOutlined className="mr-2" />
                  <span>Thông tin cá nhân</span>
                </div>
                <Text className="text-blue-700">
                  Điền đầy đủ thông tin để tạo hồ sơ bệnh án mới. Các trường có dấu * là bắt buộc.
                </Text>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item
                  name="fullName"
                  label={<span>Họ và tên <span className="text-red-500">*</span></span>}
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
                  label={<span>Giới tính <span className="text-red-500">*</span></span>}
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
                  label={<span>Số điện thoại <span className="text-red-500">*</span></span>}
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                    { 
                      pattern: /^[0-9]{10}$/, 
                      message: 'Số điện thoại phải có đúng 10 chữ số'
                    }
                  ]}
                >
                  <Input 
                    placeholder="Nhập số điện thoại" 
                    className="rounded-lg" 
                    size="large"
                    maxLength={10}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </Form.Item>
                
                <Form.Item
                  name="year"
                  label={<span>Ngày sinh <span className="text-red-500">*</span></span>}
                  rules={[
                    { required: true, message: 'Vui lòng chọn ngày sinh' },
                    {
                      validator: (_, value) => {
                        if (value && value.isAfter(dayjs().subtract(10, 'years'), 'day')) {
                          return Promise.reject('Tuổi phải từ 10 trở lên');
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <SimpleDatePicker
                    placeholder="Chọn ngày sinh"
                    style={{ width: '100%', height: '40px', borderRadius: '8px' }}
                    value=""
                    onChange={() => {}}
                  />
                </Form.Item>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button
                  size="large"
                  onClick={() => navigate('/user-profiles')}
                  className="px-8 py-2 h-auto border-gray-300 text-gray-600 hover:border-[#0C3C54] hover:text-[#0C3C54]"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  className="px-8 py-2 h-auto bg-[#0C3C54] border-[#0C3C54] hover:bg-[#0C3C54]/90"
                >
                  {loading ? 'Đang tạo...' : 'Tạo hồ sơ'}
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateProfile; 