import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Card, 
  notification, 
  Typography,
  Breadcrumb,
  message,
  Row,
  Col
} from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  TeamOutlined,
  FormOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { useAuth } from '../../hooks/useAuth';
import { CreateUserProfileRequest } from '../../api/endpoints/userProfileApi';
import userProfileApi from '../../api/endpoints/userProfileApi';

const { Title, Text } = Typography;
const { Option } = Select;

const CreateProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
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
    // Không cho phép chọn ngày trong tương lai
    if (current > dayjs().endOf('day')) {
      return true;
    }
    // Không cho phép chọn ngày dưới 10 tuổi
    return current > dayjs().subtract(10, 'years');
  };

  const handleSubmit = async (values: any) => {
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
    } catch (error: any) {
      console.error('Error creating profile:', error);
      message.error(error.message || 'Có lỗi xảy ra khi tạo hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumb className="mb-4">
            <Breadcrumb.Item><a href="/">Trang chủ</a></Breadcrumb.Item>
            <Breadcrumb.Item><a href="/profile">Trang cá nhân</a></Breadcrumb.Item>
            <Breadcrumb.Item><a href="/user-profiles">Hồ sơ bệnh án</a></Breadcrumb.Item>
            <Breadcrumb.Item>Tạo hồ sơ mới</Breadcrumb.Item>
          </Breadcrumb>

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
      >
        <div className="container mx-auto px-4 py-8 max-w-3xl">
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
                  rules={[
                    {
                      validator: (_, value) => {
                        if (value && value > dayjs().subtract(10, 'years')) {
                          return Promise.reject('Tuổi phải từ 10 trở lên');
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <DatePicker 
                    placeholder="Chọn ngày sinh" 
                    className="rounded-lg w-full" 
                    size="large"
                    format="DD/MM/YYYY"
                    disabledDate={disabledDate}
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