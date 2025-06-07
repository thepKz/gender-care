import React, { useState, useEffect } from 'react';
import { Card, Avatar, Tag, Spin, Empty, notification, Row, Col, Button } from 'antd';
import { 
  ManOutlined, 
  WomanOutlined, 
  QuestionOutlined, 
  PhoneOutlined, 
  CalendarOutlined,
  ArrowRightOutlined,
  UserOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import userProfileApi from '../../api/endpoints/userProfileApi';
import { UserProfile } from '../../types';
import QuickAddProfile from '../userProfile/QuickAddProfile';

const ProfilesList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const profilesData = await userProfileApi.getMyProfiles();
      setProfiles(profilesData);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      notification.error({
        message: 'Lỗi kết nối',
        description: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại sau.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleProfileAdded = () => {
    fetchProfiles(); // Refresh danh sách sau khi thêm
  };

  // Hiển thị biểu tượng giới tính
  const renderGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return <ManOutlined className="text-[#0F7EA9]" />; // blue-secondary từ design system
      case 'female':
        return <WomanOutlined className="text-[#00A693]" />; // green-secondary từ design system
      default:
        return <QuestionOutlined className="text-gray-500" />;
    }
  };

  // Hiển thị nhãn giới tính
  const renderGenderTag = (gender: string) => {
    switch (gender) {
      case 'male':
        return <Tag color="#0c3c54">Nam</Tag>; // blue-primary từ design system
      case 'female':
        return <Tag color="#006478">Nữ</Tag>; // green-primary từ design system
      default:
        return <Tag color="#6B7280">Khác</Tag>; // gray-500 từ design system
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin 
          size="large" 
          tip="Đang tải..." 
          className="text-[#0c3c54]" // blue-primary từ design system
        />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-xl shadow-sm">
        <Empty 
          description={
            <span className="text-gray-600 font-medium">Bạn chưa có hồ sơ bệnh án nào</span>
          } 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="mb-6"
        />
        <QuickAddProfile 
          onSuccess={handleProfileAdded}
          trigger={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              className="bg-[#0F7EA9] hover:bg-[#0c3c54]"
            >
              Tạo hồ sơ mới
            </Button>
          }
        />
      </div>
    );
  }

  // Chỉ hiển thị tối đa 3 hồ sơ trong trang profile
  const displayedProfiles = profiles.slice(0, 3);

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#0c3c54]">Hồ sơ bệnh án của bạn</h2>
        <QuickAddProfile 
          onSuccess={handleProfileAdded}
          trigger={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              className="bg-[#0F7EA9] hover:bg-[#0c3c54] border-none shadow-md"
            >
              Thêm nhanh
            </Button>
          }
        />
      </div>
      
      <Row gutter={[20, 20]}>
        {displayedProfiles.map((profile) => (
          <Col xs={24} sm={12} md={8} key={profile._id}>
            <Card 
              hoverable
              className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border-0"
              cover={
                <div className={`h-24 flex items-center justify-center bg-gradient-to-r ${
                  profile.gender === 'male' 
                    ? 'from-[#0c3c54] to-[#0F7EA9]' // blue-primary to blue-secondary
                    : profile.gender === 'female' 
                    ? 'from-[#006478] to-[#00A693]' // green-primary to green-secondary
                    : 'from-[#6B7280] to-[#9CA3AF]' // gray-700 to gray-400
                }`}>
                  <Avatar 
                    size={64} 
                    className="border-4 border-white shadow-lg"
                    icon={renderGenderIcon(profile.gender)}
                    style={{ backgroundColor: '#fff' }}
                  />
                </div>
              }
              onClick={() => navigate(`/profile/view-profile/${profile._id}`)}
              bodyStyle={{ padding: '1.5rem' }}
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <span className="text-xl font-semibold text-gray-800">{profile.fullName}</span>
                  <span className="ml-2">{renderGenderTag(profile.gender)}</span>
                </div>
                
                <div className="flex flex-col items-center text-gray-600 text-sm">
                  {profile.phone && (
                    <div className="flex items-center mb-2 bg-gray-50 px-3 py-1 rounded-full">
                      <PhoneOutlined className="mr-2 text-[#0F7EA9]" /> {profile.phone}
                    </div>
                  )}
                  {profile.year && (
                    <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
                      <CalendarOutlined className="mr-2 text-[#0F7EA9]" /> 
                      {new Date(profile.year).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>
                
                <div className="mt-5 flex justify-center">
                  <Button 
                    type="link" 
                    icon={<ArrowRightOutlined />} 
                    className={`text-${profile.gender === 'male' ? '[#0F7EA9]' : '[#00A693]'} font-medium hover:opacity-80`}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ProfilesList; 