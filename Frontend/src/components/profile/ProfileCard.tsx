import React from 'react';
import { Card, Avatar, Tag, Button, Popconfirm, Tooltip } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  PhoneOutlined,
  UserOutlined,
  HistoryOutlined,
  FileSearchOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { UserProfile } from '../../types';

interface ProfileCardProps {
  profile: UserProfile;
  isMainProfile?: boolean;
  onEdit: (profile: UserProfile) => void;
  onDelete: (profileId: string) => void;
  onSelect: (profile: UserProfile) => void;
  onViewHistory: (profileId: string) => void;
  onManageMenstrualCycle?: (profileId: string) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  isMainProfile = false,
  onEdit,
  onDelete,
  onSelect,
  onViewHistory,
  onManageMenstrualCycle
}) => {
  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      case 'other':
        return 'Khác';
      default:
        return 'Không xác định';
    }
  };
  
  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'blue';
      case 'female':
        return 'pink';
      case 'other':
        return 'purple';
      default:
        return 'default';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`profile-card rounded-xl shadow-md hover:shadow-lg transition-all ${
          isMainProfile ? 'border-2 border-[#0C3C54]' : 'border border-gray-200'
        }`}
        actions={[
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => onEdit(profile)}
              aria-label="Chỉnh sửa hồ sơ"
            />
          </Tooltip>,
          <Tooltip title="Xem lịch sử y tế">
            <Button 
              type="text" 
              icon={<HistoryOutlined />}
              onClick={() => onViewHistory(profile._id)}
              aria-label="Xem lịch sử y tế"
            />
          </Tooltip>,
          <Tooltip title="Xóa hồ sơ">
            <Popconfirm
              title="Xóa hồ sơ này?"
              description="Bạn có chắc chắn muốn xóa hồ sơ này? Hành động này không thể hoàn tác."
              onConfirm={() => onDelete(profile._id)}
              okText="Xóa"
              cancelText="Hủy"
              placement="left"
              okButtonProps={{ danger: true }}
            >
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                danger 
                aria-label="Xóa hồ sơ"
              />
            </Popconfirm>
          </Tooltip>,
        ]}
      >
        <div className="flex items-start mb-4">
          <Avatar
            size={64}
            icon={<UserOutlined />}
            className="mr-4 bg-[#0C3C54] flex-shrink-0"
          />
          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 m-0">
                {profile.fullName}
              </h3>
              {isMainProfile && (
                <Tag color="green">Hồ sơ chính</Tag>
              )}
            </div>
            <div className="flex items-center mt-1">
              <Tag color={getGenderColor(profile.gender)}>
                {getGenderText(profile.gender)}
              </Tag>
            </div>
          </div>
        </div>
        
        <div className="mt-4 space-y-2 text-gray-600">
          <div className="flex items-center">
            <CalendarOutlined className="mr-2" />
            <span>
              {profile.year 
                ? new Date(profile.year).toLocaleDateString('vi-VN') 
                : 'Chưa có thông tin ngày sinh'}
            </span>
          </div>
          <div className="flex items-center">
            <PhoneOutlined className="mr-2" />
            <span>{profile.phone || 'Chưa có thông tin số điện thoại'}</span>
          </div>
          <div className="flex items-center">
            <FileSearchOutlined className="mr-2" />
            <span>Hồ sơ tạo ngày {new Date(profile.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Button 
            type="primary" 
            block 
            className="bg-[#0C3C54] hover:bg-[#1a5570] border-none"
            onClick={() => onSelect(profile)}
          >
            Chọn hồ sơ này
          </Button>
          
          {profile.gender === 'female' && onManageMenstrualCycle && (
            <Button
              type="primary"
              block
              icon={<LineChartOutlined />}
              onClick={() => onManageMenstrualCycle(profile._id)}
              className="bg-pink-500 hover:bg-pink-600 border-none"
            >
              Quản lý chu kỳ kinh nguyệt
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default ProfileCard; 