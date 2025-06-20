import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Breadcrumb, Button, Typography } from 'antd';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateUserProfileRequest, UpdateUserProfileRequest } from '../../api/endpoints/userProfileApi';
import '../../components/feature/userProfile/UserProfile.css';
import UserProfileList from '../../components/feature/userProfile/UserProfileList';
import UserProfileModal from '../../components/feature/userProfile/UserProfileModal';
import { UserProfileProvider } from '../../context/UserProfileContext';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { UserProfile } from '../../types';

const { Title, Text } = Typography;

const UserProfilesPageContent: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  const {
    filteredProfiles,
    loading,
    error,
    searchQuery,
    sortBy,
    sortOrder,
    filterGender,
    loadProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    searchProfiles,
    sortProfiles,
    filterByGender,
    resetFilters,
    clearError,
    getStatistics
  } = useUserProfiles();

  useEffect(() => {
    if (isAuthenticated) {
      loadProfiles();
    }
  }, [isAuthenticated, loadProfiles]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAddProfile = () => {
    setEditingProfile(null);
    setModalVisible(true);
  };

  const handleEditProfile = (profile: UserProfile) => {
    setEditingProfile(profile);
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingProfile(null);
  };

  const handleModalSubmit = async (data: CreateUserProfileRequest | UpdateUserProfileRequest) => {
    try {
      if (editingProfile) {
        await updateProfile(editingProfile._id, data as UpdateUserProfileRequest);
      } else {
        await createProfile(data as CreateUserProfileRequest);
      }
      setModalVisible(false);
      setEditingProfile(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleDeleteProfile = async (id: string) => {
    await deleteProfile(id);
  };

  const stats = getStatistics();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Breadcrumb 
                className="mb-4"
                items={[
                  {
                    title: <a href="/">Trang chủ</a>
                  },
                  {
                    title: <a href="/#/profile">Trang cá nhân</a>
                  },
                  {
                    title: "Hồ sơ bệnh án"
                  }
                ]}
              />

              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#0C3C54]/10 rounded-full">
                  <UserOutlined style={{ fontSize: 32, color: "#0C3C54" }} />
                </div>
                <div>
                  <Title level={2} className="mb-1 !text-[#0C3C54]">
                    Quản lý Hồ sơ Bệnh án
                  </Title>
                  <Text type="secondary" className="text-base text-[#0C3C54]/70">
                    Quản lý hồ sơ y tế cho bản thân và người thân trong gia đình
                  </Text>
                </div>
              </div>
            </div>

            <Button
              icon={<ArrowLeftOutlined />}
              size="large"
              onClick={() => { window.location.hash = '#/profile'; }}
              className="hidden md:flex bg-[#0C3C54] text-white border-0 hover:bg-[#0C3C54]/90"
            >
              Quay lại
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 py-8 md:px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Welcome Card */}
          <div className="mt-5 mb-10 bg-[#0C3C54] border-0 text-white rounded-2xl p-6 md:p-10 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-semibold mb-2 flex items-center">
                  Xin chào, {user?.fullName || 'Người dùng'}
                  <span className="ml-2 text-lg align-middle" style={{fontSize: '1.5rem', paddingLeft: '0.25rem'}}>👋</span>
                </h3>
                <p className="text-white/80 text-base mb-3">
                  Bạn có thể tạo và quản lý nhiều hồ sơ bệnh án cho các thành viên trong gia đình. Điều này giúp việc đặt lịch khám và theo dõi sức khỏe trở nên dễ dàng hơn.
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    <span>Tổng: {stats.total} hồ sơ</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-white/40 rounded-full"></span>
                    <span>Mới trong tháng: {stats.recentCount}</span>
                  </span>
                  <Button 
                    size="small"
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30 hover:text-white font-medium px-3 py-1 rounded-lg text-sm"
                    onClick={() => { window.location.hash = '#/purchased-packages'; }}
                  >
                    📦 Xem gói dịch vụ đã mua
                  </Button>
                </div>
              </div>
              <Button
                type="primary"
                size="large"
                onClick={handleAddProfile}
                className="bg-white text-[#0C3C54] border-0 hover:bg-[#0C3C54]/10 font-medium px-6 py-2 rounded-lg shadow-md"
                style={{marginRight: '0.5rem'}}
              >
                + Tạo hồ sơ mới
              </Button>
            </div>
          </div>

       

          {/* Search + Nút */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex-1 md:max-w-[70%]">
              <input type="text" placeholder="Tìm kiếm theo tên hoặc số điện thoại..." className="w-full rounded-lg border border-gray-200 px-5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#0C3C54]" value={searchQuery} onChange={e => searchProfiles(e.target.value)} />
            </div>
            <div className="flex gap-3 md:max-w-[30%] justify-end mt-2 md:mt-0">
              <Button className="bg-white text-[#0C3C54] border border-[#0C3C54] hover:bg-[#0C3C54]/10 font-medium px-5 py-2 rounded-lg shadow-sm">Bộ lọc</Button>
              <Button className="bg-[#0C3C54] text-white border-0 hover:bg-[#0C3C54]/90 font-medium px-5 py-2 rounded-lg shadow-md" onClick={handleAddProfile}>+ Thêm hồ sơ</Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              message="Có lỗi xảy ra"
              description={error}
              type="error"
              showIcon
              closable
              onClose={clearError}
              className="mb-6"
            />
          )}

          {/* User Profiles List */}
          <UserProfileList
            profiles={filteredProfiles}
            loading={loading}
            onEdit={handleEditProfile}
            onDelete={handleDeleteProfile}
            onAdd={handleAddProfile}
            searchQuery={searchQuery}
            onSearch={searchProfiles}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(sortBy) => sortProfiles(sortBy as any, sortOrder)}
            filterGender={filterGender}
            onFilter={filterByGender}
            onResetFilters={resetFilters}
            onView={(id) => { window.location.hash = `#/profile/view-profile/${id}`; }}
          />

          {/* Profile Modal */}
          <UserProfileModal
            visible={modalVisible}
            onCancel={handleModalCancel}
            onSubmit={handleModalSubmit}
            editingProfile={editingProfile}
            loading={loading}
          />
        </motion.div>
      </div>
    </div>
  );
};

const UserProfilesPage: React.FC = () => {
  return (
    <UserProfileProvider>
      <UserProfilesPageContent />
    </UserProfileProvider>
  );
};

export default UserProfilesPage; 