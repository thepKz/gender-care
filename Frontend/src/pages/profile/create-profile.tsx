import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Card, 
  notification, 
  Typography,
  Breadcrumb
} from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  TeamOutlined,
  FormOutlined 
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import moment from 'moment';
import userProfileApi from '../../api/endpoints/userProfileApi';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;

const CreateProfilePage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Tính toán ngày tối thiểu là 10 năm trước tính từ hiện tại
  const disabledDate = (current: moment.Moment) => {
    // Không cho phép chọn ngày trong tương lai
    if (current > moment().endOf('day')) {
      return true;
    }
    // Không cho phép chọn ngày dưới 10 tuổi
    return current > moment().subtract(10, 'years');
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // Định dạng lại ngày sinh nếu có
      const formattedValues = {
        ...values,
        year: values.year ? values.year.format('YYYY-MM-DD') : undefined
      };
      
      // Gọi API tạo hồ sơ mới
      await userProfileApi.createProfile(formattedValues);
      
      notification.success({
        message: 'Thành công',
        description: 'Tạo hồ sơ bệnh án mới thành công!'
      });
      
      // Chuyển hướng đến trang danh sách hồ sơ
      navigate('/profile/health-profiles');
    } catch (error) {
      console.error('Error creating profile:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể tạo hồ sơ bệnh án. Vui lòng thử lại sau.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Breadcrumb className="mb-6">
          <Breadcrumb.Item>
            <Link to="/profile">Tài khoản</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/profile/health-profiles">Hồ sơ sức khỏe</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Tạo hồ sơ mới</Breadcrumb.Item>
        </Breadcrumb>

        <div className="flex items-center justify-between mb-6">
          <div>
            <Title level={2} className="!text-[#0C3C54] !m-0 flex items-center">
              <TeamOutlined className="mr-2" /> 
              Tạo hồ sơ bệnh án mới
            </Title>
            <Text className="text-gray-500 mt-2 block">
              Hồ sơ bệnh án giúp lưu trữ thông tin y tế của bạn và người thân
            </Text>
          </div>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/profile/health-profiles')}
            className="flex items-center"
          >
            Quay lại
          </Button>
        </div>

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
                      if (value && value > moment().subtract(10, 'years')) {
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
            
            <div className="flex justify-end mt-6">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={<SaveOutlined />}
                className="rounded-lg bg-[#0C3C54] hover:bg-[#1a5570] border-none px-8"
              >
                Tạo hồ sơ
              </Button>
            </div>
          </Form>
        </Card>
      </motion.div>
    </div>
  );
};

export default CreateProfilePage; 