import { Alert, Button } from 'antd';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateUserProfileRequest, UpdateUserProfileRequest } from '../../api/endpoints/userProfileApi';
import '../../components/feature/userProfile/UserProfile.css';
import UserProfileList from '../../components/feature/userProfile/UserProfileList';
import UserProfileModal from '../../components/feature/userProfile/UserProfileModal';
import FilterDropdown from '../../components/ui/FilterDropdown';
import { UserProfileProvider } from '../../context/UserProfileContext';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { UserProfile } from '../../types';



const UserProfilesPageContent: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  const {
    filteredProfiles,
    loading,
    error,
    searchQuery,
    filterGender,
    hasActiveFilters,
    loadProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    searchProfiles,
    filterByGender,
    filterByDateRange,
    resetFilters,
    clearError,
    getCurrentFilters
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
    navigate('/user-profiles/create');
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

  const handleFilter = (filters: { 
    gender?: 'all' | 'male' | 'female' | 'other'; 
    dateRange?: [dayjs.Dayjs, dayjs.Dayjs] | null 
  }) => {
    // Áp dụng filter giới tính
    if (filters.gender && filters.gender !== 'all') {
      filterByGender(filters.gender);
    } else {
      filterByGender('all');
    }
    
    // Áp dụng filter khoảng thời gian
    if (filters.dateRange && filters.dateRange.length === 2) {
      filterByDateRange(filters.dateRange);
    } else {
      filterByDateRange(null);
    }
  };

  const handleResetFilters = () => {
    resetFilters();
  };



  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-[#f8fafc]">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Search + Nút */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 mt-16">
            <div className="flex-1 lg:max-w-[65%]">
              <input 
                type="text" 
                placeholder="Tìm kiếm theo tên hoặc số điện thoại..." 
                className="w-full rounded-lg border border-gray-200 px-5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#0C3C54] transition-all duration-200" 
                value={searchQuery} 
                onChange={e => searchProfiles(e.target.value)} 
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 lg:max-w-[35%] lg:justify-end">
              <FilterDropdown
                onFilter={handleFilter}
                onReset={handleResetFilters}
                currentFilters={getCurrentFilters()}
              />
              <Button 
                type="primary"
                size="large"
                onClick={handleAddProfile}
                className="bg-[#0C3C54] text-white border-0 hover:bg-[#0C3C54]/90 font-medium px-5 py-2 rounded-lg shadow-md transition-all duration-200 whitespace-nowrap"
              >
                + Tạo hồ sơ mới
              </Button>
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
            filterGender={filterGender}
            onView={(id) => navigate(`/profile/view-profile/${id}`)}
            hasActiveFilters={hasActiveFilters()}
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