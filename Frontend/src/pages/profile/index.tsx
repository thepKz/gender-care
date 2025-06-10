import { CameraOutlined, EditOutlined, HomeFilled, LockOutlined, UserOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { Avatar, Button, Skeleton, Spin, Upload, notification, Form, Input, Select, DatePicker, Divider } from 'antd';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import userApi from '../../api/endpoints/userApi';
import Image1 from '../../assets/images/image1.jpg';
import ChangePasswordForm from '../../components/auth/ChangePasswordForm';
import { useAuth } from '../../hooks/useAuth';
import dayjs from 'dayjs';

import './profile.css';

const { Option } = Select;

// Removed tab navigation - display content directly

const ProfilePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editForm] = Form.useForm();

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

  const handleEditToggle = () => {
    if (isEditing) {
      editForm.resetFields();
      setIsEditing(false);
    } else {
      editForm.setFieldsValue({
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        gender: user?.gender || '',
        year: user?.year ? dayjs(user.year) : null
      });
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const values = await editForm.validateFields();
      const updateData = {
        ...values,
        year: values.year ? values.year.toISOString() : undefined
      };
      
      await userApi.updateUserProfile(updateData);
      
      notification.success({
        message: 'Cập nhật thành công',
        description: 'Thông tin cá nhân đã được cập nhật',
      });
      
      setIsEditing(false);
      await fetchProfile();
    } catch (error) {
      console.error('Lỗi cập nhật profile:', error);
      notification.error({
        message: 'Lỗi cập nhật',
        description: 'Không thể cập nhật thông tin',
      });
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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 pt-10 pb-8 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-4 pt-5 pb-5">
              <div className="p-3 bg-[#0C3C54]/10 rounded-full">
                <UserOutlined className="text-2xl text-[#0C3C54]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0C3C54] m-0">Hồ sơ cá nhân</h1>
                <p className="text-[#0C3C54]/70 text-base m-0">Quản lý thông tin tài khoản và cài đặt của bạn</p>
              </div>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<HomeFilled />}
              onClick={() => navigate('/')} 
              className="bg-[#0C3C54] hover:bg-[#0C3C54]/90 border-0 shadow-lg px-6 py-2 text-base font-semibold"
            >
              Về trang chủ
            </Button>
          </motion.div>
        </div>
      </div>
      {/* Main Content */}
      <div className="container mx-auto px-2 py-10 md:px-0 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Profile Header Card */}
          <div className="mt-5 mb-12 border-0 shadow-lg bg-[#0C3C54] text-white rounded-2xl p-8 md:p-14 pt-16 flex flex-col md:flex-row items-center md:items-start gap-8">
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
                  try {
                    const res = await userApi.uploadAvatarImage(file as File);
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
                    size={120}
                    src={currentAvatar || user.avatar || Image1}
                    icon={!(currentAvatar || user.avatar) && <UserOutlined />}
                    className="border-4 border-white shadow-xl bg-white transition-transform duration-300 hover:scale-105"
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
              <h2 className="text-2xl font-bold text-white mb-2">{user.fullName || 'Người dùng'}</h2>
              <p className="text-white/80 text-lg mb-3">{user.email}</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <div className="bg-white/20 border-white/30 text-white px-4 py-1 text-base font-medium rounded-lg">
                  {user.role === 'customer' ? 'Khách hàng' : user.role === 'doctor' ? 'Bác sĩ' : user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                </div>
                {user.gender && (
                  <div className="bg-white/20 border-white/30 text-white px-4 py-1 text-base font-medium rounded-lg">
                    {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác'}
                  </div>
                )}
                {user.emailVerified && (
                  <div className="bg-green-500/30 border-green-300 text-white px-4 py-1 text-base font-medium rounded-lg">
                    ✓ Đã xác thực
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="border-0 shadow-lg rounded-2xl p-6 md:p-10 bg-white mb-12">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-[#0C3C54]/10 rounded-full">
                <UserOutlined className="text-2xl text-[#0C3C54]" />
              </div>
              <h3 className="text-xl font-semibold text-[#0C3C54] ml-4">Thông tin chi tiết</h3>
            </div>
            {/* Nội dung thông tin cá nhân */}
            <div>
              <div className="space-y-8">
                {/* Header với nút Edit */}
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-gray-800">Thông tin cá nhân</h4>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button 
                          icon={<SaveOutlined />} 
                          type="primary"
                          onClick={handleSaveProfile}
                          className="bg-[#0C3C54] hover:bg-[#0C3C54]/90"
                        >
                          Lưu thay đổi
                        </Button>
                        <Button 
                          icon={<CloseOutlined />} 
                          onClick={handleEditToggle}
                        >
                          Hủy
                        </Button>
                      </>
                    ) : (
                      <Button 
                        icon={<EditOutlined />} 
                        onClick={handleEditToggle}
                        className="border-[#0C3C54] text-[#0C3C54] hover:bg-[#0C3C54] hover:text-white"
                      >
                        Chỉnh sửa
                      </Button>
                    )}
                  </div>
                </div>

                {/* Thông tin cá nhân */}
                {isEditing ? (
                  <Form form={editForm} layout="vertical" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Form.Item
                      label="Họ và tên"
                      name="fullName"
                      rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                      <Input size="large" placeholder="Nhập họ và tên" />
                    </Form.Item>
                    
                    <Form.Item
                      label="Số điện thoại"
                      name="phone"
                      rules={[
                        { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                      ]}
                    >
                      <Input size="large" placeholder="Nhập số điện thoại" />
                    </Form.Item>
                    
                    <Form.Item
                      label="Giới tính"
                      name="gender"
                    >
                      <Select size="large" placeholder="Chọn giới tính">
                        <Option value="male">Nam</Option>
                        <Option value="female">Nữ</Option>
                        <Option value="other">Khác</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      label="Ngày sinh"
                      name="year"
                    >
                      <DatePicker 
                        size="large" 
                        placeholder="Chọn ngày sinh"
                        format="DD/MM/YYYY"
                        className="w-full"
                      />
                    </Form.Item>
                  </Form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Họ và tên</h4>
                        <p className="text-lg font-medium text-gray-800">{user.fullName || 'Chưa cập nhật'}</p>
                      </div>
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                        <p className="text-lg text-gray-800 flex items-center">
                          {user.email}
                          {user.emailVerified ? (
                            <div className="bg-green-500/30 border-green-300 text-white px-2 py-1 text-xs font-medium rounded-lg ml-2">
                              ✓ Đã xác thực
                            </div>
                          ) : (
                            <div className="bg-yellow-500/30 border-yellow-300 text-white px-2 py-1 text-xs font-medium rounded-lg ml-2">
                              Chưa xác thực
                              <Link to="/verify-email" className="ml-2 text-[#0C3C54] hover:text-[#0C3C54]/80 hover:underline">
                                Xác thực ngay
                              </Link>
                            </div>
                          )}
                        </p>
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

                {/* Phần bảo mật */}
                <Divider />
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <LockOutlined className="text-red-600 text-lg" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">Bảo mật tài khoản</h4>
                        <p className="text-sm text-gray-600">Quản lý mật khẩu và bảo mật tài khoản</p>
                      </div>
                    </div>
                    <Button 
                      type="primary"
                      danger
                      icon={<LockOutlined />}
                      onClick={() => setShowChangePassword(!showChangePassword)}
                      className="bg-red-600 hover:bg-red-700 border-red-600"
                    >
                      {showChangePassword ? 'Ẩn' : 'Đổi mật khẩu'}
                    </Button>
                  </div>
                  
                  {showChangePassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gray-50 rounded-lg p-6"
                    >
                      <ChangePasswordForm 
                        onSuccess={() => {
                          setShowChangePassword(false);
                          notification.success({
                            message: 'Cập nhật thành công',
                            description: 'Mật khẩu đã được thay đổi an toàn',
                          });
                        }}
                      />
                    </motion.div>
                  )}
                                 </div>
               </div>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage; 