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
  Spin,
  Modal
} from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  TeamOutlined,
  FormOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import moment from 'moment';
import userProfileApi from '../../api/endpoints/userProfileApi';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile } from '../../types';

const { Title, Text } = Typography;
const { confirm } = Modal;

interface EditProfilePageProps {}

const EditProfilePage: React.FC<EditProfilePageProps> = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Lấy thông tin hồ sơ cần chỉnh sửa
  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) {
        notification.error({
          message: 'Lỗi',
          description: 'Không tìm thấy ID hồ sơ'
        });
        navigate('/profile');
        return;
      }

      try {
        setFetchLoading(true);
        console.log('Fetching profile with ID:', profileId);
        
        const response = await userProfileApi.getProfileById(profileId);
        console.log('API Response:', response); // Log để debug
        
        // API trả về trực tiếp UserProfile object
        const profileData = response;
        
        console.log('Profile data:', profileData);
        
        if (!profileData) {
          notification.error({
            message: 'Lỗi dữ liệu',
            description: 'Không tìm thấy thông tin hồ sơ'
          });
          navigate('/profile');
          return;
        }

        setProfile(profileData);
        
        // Cập nhật form với dữ liệu hiện tại
        const formData = {
          ...profileData,
          year: profileData.year ? moment(profileData.year) : null
        };
        
        console.log('Setting form values:', formData);
        form.setFieldsValue(formData);
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        
        let errorMessage = 'Không thể tải thông tin hồ sơ.';
        
        if (error.response) {
          // Lỗi từ server với response
          console.log('Error response status:', error.response.status);
          console.log('Error response data:', error.response.data);
          errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
          // Không nhận được response
          console.log('No response received:', error.request);
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        } else {
          // Lỗi trong quá trình thiết lập request
          errorMessage = 'Lỗi khi gửi yêu cầu: ' + error.message;
        }
        
        notification.error({
          message: 'Lỗi tải dữ liệu',
          description: errorMessage
        });
        // Không chuyển hướng ngay lập tức để người dùng có thể thử lại
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProfile();
  }, [profileId, form, navigate]);

  // Xử lý cập nhật hồ sơ
  const handleSubmit = async (values: any) => {
    if (!profileId) return;

    try {
      setLoading(true);
      
      // Định dạng lại ngày sinh nếu có
      const formattedValues = {
        ...values,
        year: values.year ? values.year.format('YYYY-MM-DD') : undefined
      };
      
      console.log('Sending update request with data:', formattedValues);
      
      // Gọi API cập nhật hồ sơ
      const response = await userProfileApi.updateProfile(profileId, formattedValues);
      console.log('Update response:', response);
      
      notification.success({
        message: 'Thành công',
        description: 'Cập nhật hồ sơ bệnh án thành công!'
      });
      
      // Chuyển hướng đến trang danh sách hồ sơ
      window.location.hash = '#/user-profiles';
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Hiển thị thông báo lỗi chi tiết hơn
      let errorMessage = 'Không thể cập nhật hồ sơ bệnh án.';
      
      if (error.response) {
        // Lỗi từ server với response
        console.log('Error response:', error.response);
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // Không nhận được response
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
      } else {
        // Lỗi trong quá trình thiết lập request
        errorMessage = 'Lỗi khi gửi yêu cầu: ' + error.message;
      }
      
      notification.error({
        message: 'Lỗi cập nhật',
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xóa hồ sơ
  const handleDelete = () => {
    if (!profileId) return;

    confirm({
      title: 'Bạn có chắc chắn muốn xóa hồ sơ này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Hành động này không thể hoàn tác. Mọi dữ liệu liên quan đến hồ sơ này sẽ bị xóa vĩnh viễn.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await userProfileApi.deleteProfile(profileId);
          notification.success({
            message: 'Thành công',
            description: 'Xóa hồ sơ bệnh án thành công!'
          });
          window.location.hash = '#/user-profiles';
        } catch (error) {
          console.error('Error deleting profile:', error);
          notification.error({
            message: 'Lỗi',
            description: 'Không thể xóa hồ sơ bệnh án. Vui lòng thử lại sau.'
          });
        }
      }
    });
  };

  if (fetchLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl flex justify-center items-center min-h-[60vh]">
        <Spin size="large" tip="Đang tải thông tin hồ sơ..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Breadcrumb 
          className="mb-6"
          items={[
            {
              title: <Link to="/profile">Tài khoản</Link>
            },
            {
              title: <Link to="/profile">Hồ sơ sức khỏe</Link>
            },
            {
              title: "Chỉnh sửa hồ sơ"
            }
          ]}
        />

        <div className="flex items-center justify-between mb-6">
          <div>
            <Title level={2} className="!text-[#0C3C54] !m-0 flex items-center">
              <TeamOutlined className="mr-2" /> 
              Chỉnh sửa hồ sơ bệnh án
            </Title>
            <Text className="text-gray-500 mt-2 block">
              Cập nhật thông tin hồ sơ bệnh án
            </Text>
          </div>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/profile')}
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
                Cập nhật thông tin hồ sơ bệnh án. Các trường có dấu * là bắt buộc.
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
              >
                <DatePicker 
                  placeholder="Chọn ngày sinh" 
                  className="rounded-lg w-full" 
                  size="large"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </div>
            
            <div className="flex justify-between mt-6">
              <Button
                danger
                size="large"
                onClick={handleDelete}
                className="rounded-lg"
              >
                Xóa hồ sơ
              </Button>
              
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={<SaveOutlined />}
                className="rounded-lg bg-[#0C3C54] hover:bg-[#1a5570] border-none px-8"
              >
                Cập nhật
              </Button>
            </div>
          </Form>
        </Card>
      </motion.div>
    </div>
  );
};

export default EditProfilePage; 