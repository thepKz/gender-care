import { CalendarOutlined, CameraOutlined, HomeFilled, LockOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Skeleton, Spin, Upload, notification } from 'antd';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import userApi from '../../api/endpoints/userApi';
import Image1 from '../../assets/images/image1.jpg';
import ChangePasswordForm from '../../components/feature/auth/ChangePasswordForm';
import ProfilesList from '../../components/feature/profile/ProfilesList';
import { useAuth } from '../../hooks/useAuth';
import './profile.css';

const TabItems = [
  { key: "1", label: "Thông tin cá nhân", icon: <UserOutlined /> },
  { key: "2", label: "Lịch sử đặt lịch", icon: <CalendarOutlined /> },
  { key: "3", label: "Hồ sơ bệnh án", icon: <TeamOutlined /> },
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
          {/* Main Tabs Content */}
          <div className="border-0 shadow-lg rounded-2xl p-6 md:p-10 bg-white mb-12">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-[#0C3C54]/10 rounded-full">
                <UserOutlined className="text-2xl text-[#0C3C54]" />
              </div>
              <h3 className="text-xl font-semibold text-[#0C3C54] ml-4">Thông tin chi tiết</h3>
            </div>
            <div className="flex gap-4 mb-8">
              {TabItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg text-base font-semibold transition-all duration-200
                    ${activeTab === item.key ? 'bg-[#0C3C54] text-white' : 'bg-[#0C3C54]/10 text-[#0C3C54] hover:bg-[#0C3C54]/20'}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            {/* Nội dung từng tab */}
            {activeTab === "1" && (
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
            {activeTab === "2" && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <CalendarOutlined className="text-3xl text-gray-400" />
                </div>
                <p className="text-gray-600 mb-6 text-lg">Chưa có lịch sử đặt lịch</p>
                <p className="text-gray-500 mb-8">Hãy đặt lịch ngay để trải nghiệm dịch vụ của chúng tôi.</p>
                <button className="bg-[#0C3C54] hover:bg-[#0C3C54]/90 text-white rounded-lg px-8 py-3 h-auto transition-all duration-200 hover:shadow-lg hover:scale-105 font-semibold">
                  Đặt lịch ngay
                </button>
              </div>
            )}
            {activeTab === "3" && (
              <div>
                <ProfilesList />
                <div className="mt-6 text-center">
                  <button
                    className="bg-[#0C3C54] hover:bg-[#0C3C54]/90 text-white rounded-lg px-8 py-3 h-auto transition-all duration-200 hover:shadow-lg hover:scale-105 font-semibold flex items-center gap-2 mx-auto"
                    onClick={() => navigate('/user-profiles')}
                  >
                    <TeamOutlined /> Xem tất cả hồ sơ bệnh án
                  </button>
                </div>
              </div>
            )}
            {activeTab === "4" && (
              <div>
                <ChangePasswordForm 
                  onSuccess={() => {
                    notification.success({
                      message: 'Cập nhật thành công',
                      description: 'Mật khẩu đã được thay đổi an toàn',
                    });
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage; 