import React, { useState } from 'react';
import { Row, Col, Input, Select, Button, Empty, Spin, Card, Space, Statistic } from 'antd';
import { SearchOutlined, FilterOutlined, SortAscendingOutlined, SortDescendingOutlined, ClearOutlined, PlusOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile2User, Man, Woman, Profile } from 'iconsax-react';
import { UserProfile } from '../../types';
import UserProfileCard from './UserProfileCard';
import './UserProfile.css';

const { Search } = Input;
const { Option } = Select;

interface UserProfileListProps {
  profiles: UserProfile[];
  loading?: boolean;
  onEdit: (profile: UserProfile) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  sortBy: 'name' | 'date' | 'gender';
  sortOrder: 'asc' | 'desc';
  onSort: (sortBy: 'name' | 'date' | 'gender', sortOrder: 'asc' | 'desc') => void;
  filterGender: 'all' | 'male' | 'female' | 'other';
  onFilter: (gender: 'all' | 'male' | 'female' | 'other') => void;
  onResetFilters: () => void;
  onView: (id: string) => void;
}

const UserProfileList: React.FC<UserProfileListProps> = ({
  profiles,
  loading = false,
  onEdit,
  onDelete,
  onAdd,
  searchQuery,
  onSearch,
  sortBy,
  sortOrder,
  onSort,
  filterGender,
  onFilter,
  onResetFilters,
  onView
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const getStatistics = () => {
    const total = profiles.length;
    const maleCount = profiles.filter(p => p.gender === 'male').length;
    const femaleCount = profiles.filter(p => p.gender === 'female').length;
    const otherCount = profiles.filter(p => p.gender === 'other').length;
    
    return { total, male: maleCount, female: femaleCount, other: otherCount };
  };

  const stats = getStatistics();

  const getSortIcon = () => {
    return sortOrder === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />;
  };

  const getSortText = () => {
    const sortTexts = {
      name: 'Tên',
      date: 'Ngày tạo',
      gender: 'Giới tính'
    };
    return `${sortTexts[sortBy]} (${sortOrder === 'asc' ? 'A→Z' : 'Z→A'})`;
  };

  const hasActiveFilters = searchQuery.trim() !== '' || filterGender !== 'all';

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spin size="large" />
        <span className="ml-3 text-gray-600">Đang tải danh sách hồ sơ...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profiles Grid */}
      {profiles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="text-center py-20">
            <Empty
              image="/images/empty-profiles.svg"
              imageStyle={{ height: 120 }}
              description={
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-800">
                    {hasActiveFilters ? 'Không tìm thấy kết quả' : 'Chưa có hồ sơ bệnh án nào'}
                  </h3>
                  <p className="text-gray-600">
                    {hasActiveFilters 
                      ? 'Thử thay đổi bộ lọc để tìm thấy hồ sơ phù hợp'
                      : 'Hãy tạo hồ sơ bệnh án đầu tiên cho bản thân hoặc người thân'
                    }
                  </p>
                </div>
              }
            >
              <div className="mt-4 space-x-2">
                {hasActiveFilters ? (
                  <Button onClick={onResetFilters} icon={<ClearOutlined />}>
                    Xóa bộ lọc
                  </Button>
                ) : (
                  <Button type="primary" onClick={onAdd} icon={<PlusOutlined />} size="large">
                    Tạo hồ sơ đầu tiên
                  </Button>
                )}
              </div>
            </Empty>
          </Card>
        </motion.div>
      ) : (
        <motion.div layout>
          <Row gutter={[16, 16]}>
            <AnimatePresence>
              {profiles.map((profile) => (
                <Col key={profile._id} xs={24} sm={12} lg={8} xl={6}>
                  <UserProfileCard
                    profile={profile}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onView={() => onView(profile._id)}
                    className="h-full"
                  />
                </Col>
              ))}
            </AnimatePresence>
          </Row>
        </motion.div>
      )}

      {/* Results Count */}
      {profiles.length > 0 && (
        <div className="text-center text-gray-600 text-sm">
          Hiển thị {profiles.length} hồ sơ {hasActiveFilters && `từ ${stats.total} tổng số`}
        </div>
      )}
    </div>
  );
};

export default UserProfileList; 