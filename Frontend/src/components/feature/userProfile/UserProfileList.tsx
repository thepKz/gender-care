import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Spin } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { UserProfile } from '../../../types';
import './UserProfile.css';
import UserProfileCard from './UserProfileCard';

interface UserProfileListProps {
  profiles: UserProfile[];
  loading?: boolean;
  onEdit: (profile: UserProfile) => void;
  onDelete: (id: string) => Promise<void>;
  onAdd: () => void;
  searchQuery: string;
  onSearch?: (query: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (sortBy: string) => void;
  filterGender: 'all' | 'male' | 'female' | 'other';
  onFilter?: (gender: 'all' | 'male' | 'female' | 'other') => void;
  onView: (id: string) => void;
  hasActiveFilters?: boolean;
}

const UserProfileList: React.FC<UserProfileListProps> = ({
  profiles,
  loading = false,
  onEdit,
  onDelete,
  onAdd,
  searchQuery,
  filterGender,
  onView,
  hasActiveFilters = false
}) => {

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spin size="large" />
        <span className="ml-3 text-gray-600">Đang tải danh sách hồ sơ...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profiles Grid */}
      {profiles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="text-center py-16">
            {hasActiveFilters ? (
              // UI cho trường hợp không tìm thấy kết quả từ bộ lọc
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">
                  Không tìm thấy kết quả
                </h3>
              </div>
            ) : (
              // UI cho trường hợp chưa có hồ sơ nào
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Chưa có hồ sơ bệnh án nào
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Hãy tạo hồ sơ bệnh án đầu tiên cho bản thân hoặc người thân để bắt đầu quản lý sức khỏe.
                  </p>
                </div>

                <Button 
                  type="primary" 
                  onClick={onAdd} 
                  icon={<PlusOutlined />} 
                  size="large"
                  className="px-8 py-3 h-auto text-base"
                >
                  Tạo hồ sơ đầu tiên
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      ) : (
        <motion.div layout>
          <Row gutter={[8, 8]} justify="start" align="stretch">
            <AnimatePresence>
              {profiles.map((profile) => (
                <Col 
                  key={profile._id} 
                  xs={24} 
                  sm={12} 
                  md={12} 
                  lg={8} 
                  xl={6} 
                  xxl={4}
                  className="flex"
                >
                  <UserProfileCard
                    profile={profile}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onView={() => onView(profile._id)}
                    className="w-full"
                  />
                </Col>
              ))}
            </AnimatePresence>
          </Row>
        </motion.div>
      )}

      {/* Results Count */}
      {profiles.length > 0 && (
        <div className="text-center text-gray-600 text-sm mt-4 p-3 bg-white rounded-lg border border-gray-100">
          <span className="font-medium text-gray-700">
            {hasActiveFilters ? (
              <>Tìm thấy <span className="text-blue-600 font-semibold">{profiles.length}</span> hồ sơ phù hợp</>
            ) : (
              <>Tổng cộng <span className="text-green-600 font-semibold">{profiles.length}</span> hồ sơ</>
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default UserProfileList; 