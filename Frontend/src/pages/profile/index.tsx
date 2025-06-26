import { CameraOutlined, LockOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Col, DatePicker, Form, Input, notification, Row, Select, Skeleton, Spin, Upload } from 'antd';
import { motion } from 'framer-motion';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import userApi from '../../api/endpoints/userApi';
import Image1 from '../../assets/images/image1.jpg';
import ChangePasswordForm from '../../components/feature/auth/ChangePasswordForm';
import { useAuth } from '../../hooks/useAuth';
import './profile.css';

const ProfilePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const { user, isAuthenticated, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      try {
        setIsLoading(true);
        const result = await fetchProfile();
        if (!result.success) {
          if (result.error && !result.error.includes('Không có thông tin đăng nhập')) {
            console.error('Không thể tải thông tin người dùng', result.error);
            notification.error({
              message: 'Lỗi tải dữ liệu',
              description: 'Không thể tải thông tin người dùng. Vui lòng thử lại sau.',
            });
          }
        }
      } catch (error) {
        if (error instanceof Error && 
            !error.message.includes('Không có thông tin đăng nhập') && 
            !error.message.includes('Unauthorized')) {
          console.error('Lỗi khi tải thông tin người dùng', error);
          notification.error({
            message: 'Lỗi hệ thống',
            description: 'Lỗi khi tải thông tin người dùng. Vui lòng thử lại sau.',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, fetchProfile, navigate]);

  // Đồng bộ currentAvatar với user.avatar
  useEffect(() => {
    if (user?.avatar) {
      setCurrentAvatar(user.avatar);
    }
  }, [user?.avatar]);

  // Set form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        phone: user.phone,
        gender: user.gender,
        year: user.year ? moment(user.year) : null,
      });
    }
  }, [user, form]);

  const handleUpdateProfile = async (values: {
    fullName: string;
    phone?: string;
    gender?: 'male' | 'female' | 'other';
    year?: moment.Moment;
  }) => {
    try {
      setUpdateLoading(true);
      
      const updateData = {
        fullName: values.fullName,
        phone: values.phone,
        gender: values.gender,
        year: values.year ? values.year.format('YYYY-MM-DD') : null,
      };

      await userApi.updateUserProfile(updateData);
      
      notification.success({
        message: 'Cập nhật thành công',
        description: 'Thông tin cá nhân đã được cập nhật',
      });
      
      await fetchProfile();
      setEditMode(false);
      
      // Set lại form values sau khi update thành công
      setTimeout(() => {
        form.setFieldsValue({
          fullName: updateData.fullName,
          phone: updateData.phone,
          gender: updateData.gender,
          year: updateData.year ? moment(updateData.year) : null,
        });
      }, 100);
    } catch (error: unknown) {
      console.error('Lỗi cập nhật thông tin:', error);
              notification.error({
          message: 'Lỗi cập nhật',
          description: 'Không thể cập nhật thông tin. Vui lòng thử lại sau.',
        });
    } finally {
      setUpdateLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl min-h-screen">
        <Skeleton active avatar paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-8 min-h-screen flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy thông tin</h2>
        <p className="text-gray-600 mb-6">Vui lòng đăng nhập để xem thông tin cá nhân.</p>
        <Link
          to="/login"
          className="px-6 py-2 bg-[#0C3C54] text-white rounded-lg hover:bg-[#2A7F9E] transition-all"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc]">
      {/* Main Content */}
      <div className="container mx-auto px-2 py-10 md:px-0 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Profile Header Card */}
          <div className="mt-32 mb-8 border-0 shadow-lg bg-[#0C3C54] text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-center gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  if (file.size > 5 * 1024 * 1024) {
                    notification.error({
                      message: 'File quá lớn',
                      description: 'Ảnh đại diện phải nhỏ hơn 5MB',
                    });
                    return Upload.LIST_IGNORE;
                  }
                  return true;
                }}
                customRequest={async ({ file, onSuccess, onError }) => {
                  setUploading(true);
                  const formData = new FormData();
                  formData.append('avatar', file as File);
                  try {
                    const res = await userApi.uploadAvatarImage(formData as unknown as File);
                    const url = res.data.url;
                    await userApi.updateAvatar(url);
                    
                    setCurrentAvatar(url);
                    
                    notification.success({
                      message: 'Cập nhật thành công',
                      description: 'Ảnh đại diện đã được cập nhật',
                    });
                    await fetchProfile();
                    if (onSuccess) onSuccess({}, file as unknown as File);
                  } catch (err) {
                    notification.error({
                      message: 'Lỗi upload',
                      description: 'Không thể upload ảnh đại diện',
                    });
                    if (onError) onError(err as Error);
                  } finally {
                    setUploading(false);
                  }
                }}
                accept="image/*"
                disabled={uploading}
              >
                <div className="relative cursor-pointer">
                  <Avatar
                    size={80}
                    src={currentAvatar || user.avatar || Image1}
                    icon={!(currentAvatar || user.avatar) && <UserOutlined />}
                    className="border-3 border-white shadow-lg bg-white transition-transform duration-300 hover:scale-105"
                    style={{ objectFit: 'cover', backgroundColor: '#fff' }}
                  />
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300">
                    <CameraOutlined className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black bg-opacity-40 z-20">
                      <Spin size="large" />
                    </div>
                  )}
                </div>
              </Upload>
            </motion.div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-xl font-semibold text-white mb-0">Xin chào, {user.fullName || 'Người dùng'}!</h2>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="border-0 shadow-lg rounded-2xl p-6 md:p-10 bg-white mb-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="p-3 bg-[#0C3C54]/10 rounded-full">
                  <UserOutlined className="text-2xl text-[#0C3C54]" />
                </div>
                <h3 className="text-xl font-semibold text-[#0C3C54] ml-4">Thông tin cá nhân</h3>
              </div>
              {!editMode && (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={() => {
                    setEditMode(true);
                    // Set lại form values khi vào edit mode
                    form.setFieldsValue({
                      fullName: user.fullName,
                      phone: user.phone,
                      gender: user.gender,
                      year: user.year ? moment(user.year) : null,
                    });
                  }}
                  className="bg-[#0C3C54] hover:bg-[#0C3C54]/90 border-0"
                >
                  Chỉnh sửa
                </Button>
              )}
            </div>

            {editMode ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdateProfile}
                className="space-y-6"
              >
                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={<span className="text-gray-700 font-medium">Họ và tên</span>}
                      name="fullName"
                      rules={[
                        { required: true, message: 'Vui lòng nhập họ tên!' },
                        { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự!' }
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="Nhập họ và tên"
                        className="rounded-xl border-gray-200 hover:border-[#0C3C54] focus:border-[#0C3C54]"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={<span className="text-gray-700 font-medium">Số điện thoại</span>}
                      name="phone"
                      rules={[
                        { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="Nhập số điện thoại"
                        className="rounded-xl border-gray-200 hover:border-[#0C3C54] focus:border-[#0C3C54]"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={<span className="text-gray-700 font-medium">Giới tính</span>}
                      name="gender"
                    >
                      <Select
                        size="large"
                        placeholder="Chọn giới tính"
                        className="rounded-xl"
                        options={[
                          { value: 'male', label: 'Nam' },
                          { value: 'female', label: 'Nữ' },
                          { value: 'other', label: 'Khác' }
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={<span className="text-gray-700 font-medium">Ngày sinh</span>}
                      name="year"
                    >
                      <DatePicker
                        size="large"
                        placeholder="Chọn ngày sinh"
                        className="w-full rounded-xl border-gray-200 hover:border-[#0C3C54] focus:border-[#0C3C54]"
                        format="DD/MM/YYYY"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                      <div className="text-lg text-gray-800 flex items-center">
                        <span>{user.email}</span>
                        {user.emailVerified ? (
                          <div className="bg-green-500/30 border-green-300 text-white px-2 py-1 text-base font-medium rounded-lg ml-2">
                            ✓ Đã xác thực
                          </div>
                        ) : (
                          <div className="bg-yellow-500/30 border-yellow-300 text-white px-2 py-1 text-base font-medium rounded-lg ml-2">
                            Chưa xác thực
                            <Link to="/verify-email" className="ml-2 text-[#0C3C54] hover:text-[#0C3C54]/80 hover:underline">
                              Xác thực ngay
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>

                <div className="flex justify-end gap-4 pt-6">
                  <Button
                    onClick={() => {
                      setEditMode(false);
                      // Reset về values gốc thay vì clear hoàn toàn
                      form.setFieldsValue({
                        fullName: user.fullName,
                        phone: user.phone,
                        gender: user.gender,
                        year: user.year ? moment(user.year) : null,
                      });
                    }}
                    className="px-6"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={updateLoading}
                    icon={<SaveOutlined />}
                    className="bg-[#0C3C54] hover:bg-[#0C3C54]/90 border-0 px-6"
                  >
                    {updateLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </div>
              </Form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Họ và tên</h4>
                    <p className="text-lg font-medium text-gray-800">{user.fullName}</p>
                  </div>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                    <div className="text-lg text-gray-800 flex items-center">
                      <span>{user.email}</span>
                      {user.emailVerified ? (
                        <div className="bg-green-500/30 border-green-300 text-white px-2 py-1 text-base font-medium rounded-lg ml-2">
                          ✓ Đã xác thực
                        </div>
                      ) : (
                        <div className="bg-yellow-500/30 border-yellow-300 text-white px-2 py-1 text-base font-medium rounded-lg ml-2">
                          Chưa xác thực
                          <Link to="/verify-email" className="ml-2 text-[#0C3C54] hover:text-[#0C3C54]/80 hover:underline">
                            Xác thực ngay
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Số điện thoại</h4>
                    <p className="text-lg text-gray-800">{user.phone || "Chưa cập nhật"}</p>
                  </div>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Giới tính</h4>
                    <p className="text-lg text-gray-800">
                      {user.gender === 'male'
                        ? 'Nam'
                        : user.gender === 'female'
                        ? 'Nữ'
                        : user.gender === 'other'
                        ? 'Khác'
                        : 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Ngày sinh</h4>
                  <p className="text-lg text-gray-800">
                    {user.year ? new Date(user.year).toLocaleDateString('vi-VN') : "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Ngày tham gia</h4>
                  <p className="text-lg text-gray-800">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Change Password Section */}
          <div className="border-0 shadow-lg rounded-2xl p-6 md:p-10 bg-white mb-12">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-[#0C3C54]/10 rounded-full">
                <LockOutlined className="text-2xl text-[#0C3C54]" />
              </div>
              <h3 className="text-xl font-semibold text-[#0C3C54] ml-4">Đổi mật khẩu</h3>
            </div>
            <ChangePasswordForm 
              onSuccess={() => {
                notification.success({
                  message: 'Cập nhật thành công',
                  description: 'Mật khẩu đã được thay đổi an toàn',
                });
              }}
            />
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage; 