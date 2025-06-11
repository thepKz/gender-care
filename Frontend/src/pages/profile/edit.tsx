import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Form, Input, Radio, notification } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userApi from '../../api/endpoints/userApi';
import { useAuth } from '../../hooks/useAuth';

interface FormValues {
  fullName: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  year?: dayjs.Dayjs;
}

const ProfileEditPage: React.FC = () => {
  const [form] = Form.useForm();
  const { user, isAuthenticated, fetchProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      // Log trạng thái xác thực
      console.log('isAuthenticated:', isAuthenticated, 'user:', user);

      // Nếu không đăng nhập, chuyển hướng về trang đăng nhập
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      try {
        const result = await fetchProfile();
        console.log('fetchProfile result:', result);

        if (!result.success) {
          notification.error({
            message: 'Không thể tải dữ liệu',
            description: 'Vui lòng thử lại sau',
          });
          console.error('Không thể tải thông tin người dùng', result.error);

          // Nếu lỗi do không có thông tin đăng nhập, chuyển hướng về login
          if (result.error === 'Không có thông tin đăng nhập') {
            navigate('/login');
          }
        } else {
          // Nạp dữ liệu vào form
          if (user) {
            form.setFieldsValue({
              fullName: user.fullName,
              phone: user.phone || '',
              gender: user.gender || '',
              year: user.year ? dayjs(user.year) : null,
            });
            setImageUrl(user.avatar);
          } else {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin người dùng', error);
        notification.error({
          message: 'Lỗi hệ thống',
          description: 'Có lỗi xảy ra khi tải thông tin người dùng',
        });
      }
    };

    loadProfile();
  }, [isAuthenticated, fetchProfile, navigate, form]);

  

  const onFinish = async (values: FormValues) => {
    try {
      setSubmitting(true);
      // Format date trước khi submit
      const formattedValues = {
        ...values,
        year: values.year ? values.year.format('YYYY-MM-DD') : undefined,
        avatar: imageUrl, // Thêm trường avatar nếu đã upload
      };
      
      // Loại bỏ các trường rỗng hoặc undefined để tránh validation lỗi
      Object.keys(formattedValues).forEach(key => {
        if (formattedValues[key as keyof typeof formattedValues] === '' || 
            formattedValues[key as keyof typeof formattedValues] === undefined) {
          delete formattedValues[key as keyof typeof formattedValues];
        }
      });
      
      // Gọi API cập nhật profile thực tế
      await userApi.updateUserProfile(formattedValues);
      // Sau khi cập nhật thành công, gọi lại fetchProfile để đồng bộ redux và localStorage
      await fetchProfile();
      notification.success({
        message: 'Cập nhật thành công!',
        description: 'Thông tin cá nhân đã được lưu',
      });
      navigate('/profile');
    } catch (error: any) {
      console.error('Lỗi khi cập nhật thông tin', error);
      
      // Hiển thị lỗi cụ thể từ server
      let errorMessage = 'Không thể cập nhật thông tin. Vui lòng thử lại';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      notification.error({
        message: 'Cập nhật thất bại',
        description: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };


  // Kiểm tra nếu không đăng nhập hoặc không có thông tin user, hiển thị thông báo
  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Không thể truy cập</h2>
          <p className="text-gray-600 mb-6">Vui lòng đăng nhập để chỉnh sửa thông tin cá nhân.</p>
          <Button 
            type="primary"
            onClick={() => navigate('/login')}
            className="bg-blue-500"
          >
            Đăng nhập ngay
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card 
          className="rounded-2xl shadow-lg border-0 bg-white"
          title={
            <div className="flex items-center gap-3 p-2">
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/profile')}
                className="hover:bg-gray-100 rounded-lg transition-all duration-200"
                size="large"
              />
              <div>
                <h1 className="text-2xl font-bold text-[#0C3C54] mb-0">Chỉnh sửa thông tin</h1>
                <p className="text-gray-500 text-sm mb-0">Cập nhật thông tin cá nhân của bạn</p>
              </div>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              fullName: user?.fullName || '',
              phone: user?.phone || '',
              gender: user?.gender || '',
              year: user?.year ? dayjs(user.year) : null,
            }}
            className="mt-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                name="fullName"
                label={<span className="text-gray-700 font-medium">Họ và tên</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập họ và tên' },
                  { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
                  { max: 50, message: 'Họ tên không được vượt quá 50 ký tự' },
                ]}
              >
                <Input 
                  placeholder="Nhập họ và tên" 
                  size="large"
                  className="rounded-xl border-gray-200 hover:border-[#0C3C54] focus:border-[#0C3C54] transition-all duration-200"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label={<span className="text-gray-700 font-medium">Số điện thoại</span>}
                rules={[
                  { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' },
                ]}
              >
                <Input 
                  placeholder="Nhập số điện thoại" 
                  size="large"
                  className="rounded-xl border-gray-200 hover:border-[#0C3C54] focus:border-[#0C3C54] transition-all duration-200"
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                name="gender"
                label={<span className="text-gray-700 font-medium">Giới tính</span>}
                rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
              >
                <Radio.Group className="flex flex-col gap-3">
                  <Radio value="male" className="text-gray-700 font-medium">Nam</Radio>
                  <Radio value="female" className="text-gray-700 font-medium">Nữ</Radio>
                  <Radio value="other" className="text-gray-700 font-medium">Khác</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="year"
                label={<span className="text-gray-700 font-medium">Ngày sinh</span>}
                rules={[{
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const minDate = dayjs().subtract(12, 'years').endOf('day');
                    if (value.isAfter(minDate)) {
                      return Promise.reject('Bạn phải trên 12 tuổi!');
                    }
                    return Promise.resolve();
                  },
                }]}
              >
                <DatePicker 
                  format="DD/MM/YYYY" 
                  placeholder="Chọn ngày sinh"
                  size="large"
                  style={{ width: '100%' }}
                  className="rounded-xl border-gray-200 hover:border-[#0C3C54] focus:border-[#0C3C54] transition-all duration-200"
                  disabledDate={current => {
                    return current && current.isAfter(dayjs().subtract(12, 'years').endOf('day'));
                  }}
                  onChange={date => form.setFieldsValue({ year: date })}
                />
              </Form.Item>
            </div>

            <Form.Item className="mt-8 mb-0">
              <div className="flex justify-end gap-4">
                <Button 
                  size="large"
                  onClick={() => navigate('/profile')}
                  className="px-8 rounded-xl border-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  Hủy
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitting}
                  size="large"
                  className="bg-gradient-to-r from-[#0C3C54] to-[#1a5570] border-none rounded-xl px-8 hover:scale-105 hover:shadow-lg transition-all duration-200"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default ProfileEditPage; 