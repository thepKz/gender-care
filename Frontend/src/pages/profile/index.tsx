import { CalendarOutlined, CameraOutlined, EditOutlined, HomeFilled, LockOutlined, TeamOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Skeleton, Spin, Tabs, Tag, Upload, notification } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import userApi from '../../api/endpoints/userApi';
import Image1 from '../../assets/images/image1.jpg';
import ChangePasswordForm from '../../components/auth/ChangePasswordForm';
import ProfilesList from '../../components/profile/ProfilesList';
import { useAuth } from '../../hooks/useAuth';

import './profile.css';

const TabItems = [
  { key: "1", label: "Thông tin cá nhân", icon: <UserOutlined /> },
  { key: "2", label: "Lịch sử đặt lịch", icon: <CalendarOutlined /> },
  { key: "3", label: "Quản lý hồ sơ sức khỏe", icon: <TeamOutlined /> },
  { key: "4", label: "Đổi mật khẩu", icon: <LockOutlined /> },
];

const ProfilePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("1");
  const { user, isAuthenticated, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);

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

  const handleTabChange = (key: string) => {
    setActiveTab(key);
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
    <div> 
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full flex flex-col items-center mb-8 relative"
      >
        <Button
          type="primary"
          shape="round"
          size="large"
          icon={<HomeFilled style={{ fontSize: 22 }} />}
          className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#0C3C54] to-[#1a5570] border-none shadow-xl px-6 py-2 text-lg font-semibold flex items-center gap-2 hover:scale-105 hover:shadow-2xl transition-all duration-300 z-20"
          onClick={() => navigate('/')}
        >
          Về trang chủ
        </Button>
        <motion.div
          whileHover={{ scale: 1.08 }}
          className="relative group mb-4 mt-10"
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
                const res = await userApi.uploadAvatarImage(formData);
                const url = res.url;
                await userApi.updateAvatar(url);
                
                // Cập nhật avatar ngay lập tức trên UI
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
                size={128}
                src={currentAvatar || user.avatar || Image1}
                icon={!(currentAvatar || user.avatar) && <UserOutlined />}
                className="border-4 border-[#0C3C54] shadow-xl bg-white transition-transform duration-300 hover:scale-105"
                style={{ objectFit: 'cover', backgroundColor: '#fff' }}
              />
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300"
              >
                <CameraOutlined className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black bg-opacity-40 z-20">
                  <Spin size="large" />
                </div>
              )}
            </div>
          </Upload>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full"
      >
        <Card className="rounded-2xl shadow-md bg-white border border-gray-100">
          <Tabs
            defaultActiveKey="1"
            activeKey={activeTab}
            onChange={handleTabChange}
            size="large"
            type="card"
            className="rounded-xl bg-gray-50"
            items={TabItems.map(item => ({
              key: item.key,
              label: (
                <motion.span 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-200"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </motion.span>
              ),
            }))}
          />
          <div className="mt-6 min-h-[600px] relative">
            <AnimatePresence mode="wait">
              {activeTab === "1" && (
              <motion.div 
                key="tab-1"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-[#0C3C54]">Thông tin chi tiết</h3>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => navigate('/profile/edit')}
                    className="bg-[#0C3C54] hover:bg-[#1a5570] border-none rounded-lg transition-all duration-200 hover:shadow-lg"
                  >
                    Chỉnh sửa
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Họ và tên</h4>
                      <p className="text-lg font-medium text-gray-800">{user.fullName}</p>
                    </div>
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                      <p className="text-lg text-gray-800 flex items-center">
                        {user.email}
                        {user.emailVerified ? (
                          <Tag color="success" className="ml-2">Đã xác thực</Tag>
                        ) : (
                          <Tag color="warning" className="ml-2">
                            Chưa xác thực
                            <Link to="/verify-email" className="ml-2 text-[#0C3C54] hover:text-[#2A7F9E] hover:underline">
                              Xác thực ngay
                            </Link>
                          </Tag>
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
              </motion.div>
            )}
            {activeTab === "2" && (
              <motion.div 
                key="tab-2"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full"
              >
                <h3 className="text-xl font-semibold text-[#0C3C54] mb-6">Lịch sử đặt lịch</h3>
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <CalendarOutlined className="text-3xl text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-6 text-lg">Chưa có lịch sử đặt lịch</p>
                  <p className="text-gray-500 mb-8">Hãy đặt lịch ngay để trải nghiệm dịch vụ của chúng tôi.</p>
                  <Button 
                    type="primary" 
                    size="large"
                    className="bg-[#0C3C54] hover:bg-[#1a5570] border-none rounded-lg px-8 py-3 h-auto transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    Đặt lịch ngay
                  </Button>
                </div>
              </motion.div>
            )}
            {activeTab === "3" && (
              <motion.div 
                key="tab-3"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full"
              >
                <ProfilesList />
                
                <div className="mt-6 text-center">
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<TeamOutlined />}
                    onClick={() => navigate('/profile/health-profiles')}
                    className="bg-[#0C3C54] hover:bg-[#1a5570] border-none rounded-lg px-8 py-3 h-auto transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    Xem tất cả hồ sơ
                  </Button>
                </div>
              </motion.div>
            )}
            {activeTab === "4" && (
              <motion.div 
                key="tab-4"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full"
              >
                <ChangePasswordForm 
                  onSuccess={() => {
                    notification.success({
                      message: 'Cập nhật thành công',
                      description: 'Mật khẩu đã được thay đổi an toàn',
                    });
                  }}
                />
              </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProfilePage; 