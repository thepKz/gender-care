import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  Typography, 
  Breadcrumb, 
  Empty, 
  Spin, 
  List, 
  Avatar, 
  Tag, 
  Tooltip,
  notification
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  TeamOutlined, 
  ManOutlined, 
  WomanOutlined,
  QuestionOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import userProfileApi from '../../api/endpoints/userProfileApi';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile } from '../../types';

const { Title, Text } = Typography;

const HealthProfilesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const response = await userProfileApi.getMyProfiles();
        // Trích xuất dữ liệu từ response.data.data vì cấu trúc API trả về
        setProfiles(response?.data?.data || []);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        notification.error({
          message: 'Lỗi',
          description: 'Không thể tải danh sách hồ sơ bệnh án. Vui lòng thử lại sau.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  // Hiển thị biểu tượng giới tính
  const renderGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return <ManOutlined className="text-blue-600" />;
      case 'female':
        return <WomanOutlined className="text-pink-600" />;
      default:
        return <QuestionOutlined className="text-gray-600" />;
    }
  };

  // Hiển thị nhãn giới tính
  const renderGenderTag = (gender: string) => {
    switch (gender) {
      case 'male':
        return <Tag color="blue">Nam</Tag>;
      case 'female':
        return <Tag color="pink">Nữ</Tag>;
      default:
        return <Tag color="gray">Khác</Tag>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Breadcrumb className="mb-6">
          <Breadcrumb.Item>
            <Link to="/profile">Tài khoản</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Hồ sơ sức khỏe</Breadcrumb.Item>
        </Breadcrumb>

        <div className="flex items-center justify-between mb-6">
          <div>
            <Title level={2} className="!text-[#0C3C54] !m-0 flex items-center">
              <TeamOutlined className="mr-2" /> 
              Hồ sơ bệnh án của tôi
            </Title>
            <Text className="text-gray-500 mt-2 block">
              Quản lý hồ sơ bệnh án của bạn và người thân
            </Text>
          </div>
        </div>

        <Card className="rounded-xl shadow-md">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Spin size="large" tip="Đang tải hồ sơ bệnh án..." />
            </div>
          ) : profiles.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-center">
                  <p className="text-gray-500 mb-4">Bạn chưa có hồ sơ bệnh án nào</p>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => navigate('/profile/create-profile')}
                    className="rounded-lg bg-[#0C3C54] hover:bg-[#1a5570] border-none"
                  >
                    Tạo hồ sơ mới ngay
                  </Button>
                </div>
              }
              className="py-16"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((profile) => (
                <Card 
                  key={profile._id}
                  hoverable
                  className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                  cover={
                    <div className={`h-24 flex items-center justify-center ${profile.gender === 'male' ? 'bg-blue-500' : profile.gender === 'female' ? 'bg-pink-500' : 'bg-purple-500'}`}>
                      <Avatar 
                        size={64} 
                        className="border-4 border-white shadow-md"
                        icon={renderGenderIcon(profile.gender)}
                        style={{ backgroundColor: '#fff' }}
                      />
                    </div>
                  }
                  actions={[
                    <Tooltip title="Xem chi tiết">
                      <Button 
                        type="text" 
                        icon={<ArrowRightOutlined />}
                        onClick={() => navigate(`/profile/view-profile/${profile._id}`)}
                      >
                        Chi tiết
                      </Button>
                    </Tooltip>,
                    <Tooltip title="Chỉnh sửa">
                      <Button 
                        type="text" 
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/profile/edit-profile/${profile._id}`)}
                      >
                        Chỉnh sửa
                      </Button>
                    </Tooltip>
                  ]}
                >
                  <div className="text-center mb-2">
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-lg font-medium">{profile.fullName}</span>
                      <span className="ml-2">{renderGenderTag(profile.gender)}</span>
                    </div>
                    
                    <div className="flex flex-col items-center text-gray-600 text-sm">
                      {profile.phone && (
                        <div className="flex items-center mb-1">
                          <PhoneOutlined className="mr-1" /> {profile.phone}
                        </div>
                      )}
                      {profile.year && (
                        <div className="flex items-center">
                          <CalendarOutlined className="mr-1" /> {new Date(profile.year).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default HealthProfilesPage; 