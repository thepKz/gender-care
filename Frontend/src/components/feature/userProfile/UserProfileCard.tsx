import { CalendarOutlined, DeleteOutlined, EditOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { Man, Profile, Profile2User, Woman } from 'iconsax-react';
import React from 'react';
import { UserProfile } from '../../../types';
import './UserProfile.css';

interface UserProfileCardProps {
  profile: UserProfile;
  onEdit: (profile: UserProfile) => void;
  onDelete: (id: string) => void;
  onView: () => void;
  loading?: boolean;
  className?: string;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  profile,
  onEdit,
  onDelete,
  onView,
  loading = false,
  className = ''
}) => {
  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male':
        return '#1890ff';
      case 'female':
        return '#eb2f96';
      default:
        return '#722ed1';
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return <Man size={18} color={getGenderColor(gender)} variant="Bold" />;
      case 'female':
        return <Woman size={18} color={getGenderColor(gender)} variant="Bold" />;
      default:
        return <Profile size={18} color={getGenderColor(gender)} variant="Bold" />;
    }
  };

  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      default:
        return 'Khác';
    }
  };

  const getAge = () => {
    if (!profile.year) return null;
    return dayjs().year() - dayjs(profile.year).year();
  };

  const formatDate = (date: string) => {
    return dayjs(date).format('DD/MM/YYYY');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <div
        className="relative p-5 overflow-hidden border border-[#0C3C54] hover:border-blue-400 transition-all duration-300 hover:shadow-lg group cursor-pointer"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('.card-action-btn')) return;
          onView();
        }}
      >
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity">
          <Profile2User size={80} color={getGenderColor(profile.gender)} />
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          {/* Header with Avatar and Actions */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-12 h-12 rounded-full border-[#0C3C54] p-1">
                  <div className="w-10 h-10 rounded-full bg-white p-1">
                    <UserOutlined />
                  </div>
                </div>
              </motion.div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-1">
                  {profile.fullName}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-[#0C3C54] font-semibold border border-[#0C3C54] px-2 py-1 rounded-full">
                    {getGenderText(profile.gender)}
                  </span>
                  {getAge() && (
                    <span className="text-sm text-gray-500">
                      {getAge()} tuổi
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Tooltip title="Chỉnh sửa">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(profile);
                  }}
                  className="text-blue-500 hover:bg-blue-50 card-action-btn"
                />
              </Tooltip>
              <Tooltip title="Xóa">
                <Popconfirm
                  title="Xóa hồ sơ bệnh án"
                  description="Bạn có chắc chắn muốn xóa hồ sơ này? Hành động này không thể hoàn tác."
                  onConfirm={() => onDelete(profile._id)}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    size="small"
                    className="text-red-500 hover:bg-red-50 card-action-btn"
                  />
                </Popconfirm>
              </Tooltip>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-3">
            {profile.phone && (
              <div className="flex items-center space-x-2 text-gray-600">
                <PhoneOutlined className="text-green-500" />
                <span className="text-sm">{profile.phone}</span>
              </div>
            )}
            
            {profile.year && (
              <div className="flex items-center space-x-2 text-gray-600">
                <CalendarOutlined className="text-orange-500" />
                <span className="text-sm">Sinh năm: {dayjs(profile.year).year()}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Tạo lúc: {formatDate(profile.createdAt)}</span>
              {profile.updatedAt !== profile.createdAt && (
                <span>Cập nhật: {formatDate(profile.updatedAt)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Hover Effect Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
      </div>
    </motion.div>
  );
};

export default UserProfileCard; 