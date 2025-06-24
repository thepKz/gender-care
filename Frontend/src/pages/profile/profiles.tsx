import {
    HeartOutlined,
    InfoCircleOutlined,
    SafetyCertificateOutlined,
    TeamOutlined,
    UserAddOutlined
} from '@ant-design/icons';
import {
    Button,
    Card,
    Col,
    Empty,
    Modal,
    notification,
    Row,
    Spin,
    Statistic,
    Typography
} from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userProfileApi from '../../api/endpoints/userProfileApi';
import ProfileCard from '../../components/feature/profile/ProfileCard';
import ProfileForm from '../../components/feature/profile/ProfileForm';
import QuickAddProfile from '../../components/feature/userProfile/QuickAddProfile';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile } from '../../types';

const { Title, Text } = Typography;

const ProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchProfiles();
  }, [isAuthenticated, navigate]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await userProfileApi.getMyProfiles();
      setProfiles(response || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể tải danh sách hồ sơ. Vui lòng thử lại sau.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = (profile: UserProfile) => {
    setSelectedProfile(profile);
    setIsModalVisible(true);
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      await userProfileApi.deleteProfile(profileId);
      notification.success({
        message: 'Thành công',
        description: 'Xóa hồ sơ thành công!'
      });
      fetchProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể xóa hồ sơ. Vui lòng thử lại sau.'
      });
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleSelectProfile = (profile: UserProfile) => {
    Modal.confirm({
      title: 'Chọn hồ sơ',
      icon: <InfoCircleOutlined />,
      content: `Bạn muốn sử dụng hồ sơ "${profile.fullName}" cho việc đặt lịch và khám bệnh?`,
      okText: 'Đồng ý',
      cancelText: 'Hủy',
      onOk: () => {
        localStorage.setItem('selectedProfileId', profile._id);
        notification.success({
          message: 'Đã chọn hồ sơ',
          description: `Đã chọn hồ sơ "${profile.fullName}" làm hồ sơ mặc định.`
        });
      }
    });
  };

  const handleViewMedicalHistory = (profileId: string) => {
    navigate(`/medical-records/${profileId}`);
  };

  const getStatistics = () => {
    const total = profiles.length;
    const maleCount = profiles.filter(p => p.gender === 'male').length;
    const femaleCount = profiles.filter(p => p.gender === 'female').length;
    return { total, maleCount, femaleCount };
  };

  const stats = getStatistics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[#0C3C54]/10 rounded-full">
                  <TeamOutlined className="text-2xl text-[#0C3C54]" />
                </div>
                <div>
                  <Title level={2} className="!text-[#0C3C54] !m-0">
                    Hồ sơ bệnh án của bạn
                  </Title>
                  <Text className="text-gray-600 text-base">
                    Quản lý hồ sơ y tế cho bản thân và người thân trong gia đình
                  </Text>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
                <QuickAddProfile 
                  onSuccess={fetchProfiles}
                  trigger={
                                         <Button
                       size="large"
                       icon={<UserAddOutlined />}
                       className="border-[#0C3C54]/30 text-[#0C3C54] hover:bg-[#0C3C54]/5"
                     >
                       Tạo nhanh
                     </Button>
                   }
                 />
                 <Button
                   type="primary"
                   size="large"
                   icon={<TeamOutlined />}
                   onClick={() => navigate('/user-profiles')}
                   className="bg-[#0C3C54] hover:bg-[#0C3C54]/90 border-0 shadow-lg"
                 >
                   Quản lý nâng cao
                 </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
                     {/* Welcome Card */}
           <Card className="mb-8 bg-gradient-to-r from-[#0C3C54] to-[#1a5570] border-0 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 opacity-10">
              <HeartOutlined className="text-8xl" />
            </div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
                <div className="mb-4 lg:mb-0">
                  <h3 className="text-xl font-semibold mb-2">
                    Xin chào, {user?.fullName || 'Người dùng'}! 👋
                  </h3>
                                     <p className="text-white/80 text-base mb-4">
                     Quản lý hồ sơ bệnh án giúp bạn theo dõi sức khỏe một cách có hệ thống và an toàn.
                     Tạo hồ sơ riêng cho từng thành viên trong gia đình để có trải nghiệm tốt nhất.
                   </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center space-x-2">
                      <SafetyCertificateOutlined />
                      <span>Bảo mật cao</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <TeamOutlined />
                      <span>Đa thành viên</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <HeartOutlined />
                      <span>Chăm sóc toàn diện</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Statistics Cards */}
          {profiles.length > 0 && (
            <Row gutter={[16, 16]} className="mb-8">
              <Col xs={24} sm={8}>
                <Card className="text-center border-0 shadow-md">
                                     <Statistic
                     title="Tổng hồ sơ"
                     value={stats.total}
                     valueStyle={{ color: '#0C3C54', fontSize: '24px', fontWeight: 'bold' }}
                     prefix={<TeamOutlined />}
                   />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="text-center border-0 shadow-md">
                  <Statistic
                    title="Hồ sơ nam"
                    value={stats.maleCount}
                    valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                    prefix={<UserAddOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="text-center border-0 shadow-md">
                  <Statistic
                    title="Hồ sơ nữ"
                    value={stats.femaleCount}
                    valueStyle={{ color: '#eb2f96', fontSize: '24px', fontWeight: 'bold' }}
                    prefix={<HeartOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Information Card */}
                     <Card className="mb-8 border-l-4 border-l-[#0C3C54] shadow-sm">
                         <div className="flex items-start gap-3">
               <InfoCircleOutlined className="text-[#0C3C54] text-xl mt-1" />
              <div>
                <Title level={4} className="!m-0 !text-gray-800">Hướng dẫn sử dụng</Title>
                                 <div className="mt-3 space-y-2 text-gray-600">
                   <div className="flex items-start gap-2">
                     <span className="w-2 h-2 bg-[#0C3C54] rounded-full mt-2 flex-shrink-0"></span>
                     <span>Tạo hồ sơ riêng cho từng thành viên trong gia đình</span>
                   </div>
                   <div className="flex items-start gap-2">
                     <span className="w-2 h-2 bg-[#0C3C54] rounded-full mt-2 flex-shrink-0"></span>
                     <span>Chọn hồ sơ phù hợp trước khi đặt lịch khám bệnh</span>
                   </div>
                   <div className="flex items-start gap-2">
                     <span className="w-2 h-2 bg-[#0C3C54] rounded-full mt-2 flex-shrink-0"></span>
                     <span>Sử dụng "Quản lý nâng cao" để có thêm nhiều tính năng</span>
                   </div>
                 </div>
              </div>
            </div>
          </Card>

          {/* Profiles List */}
          {loading ? (
            <Card className="text-center py-16 border-0 shadow-md">
              <div className="text-center">
          <Spin size="large" />
          <div className="mt-2 text-gray-600">Đang tải danh sách hồ sơ...</div>
        </div>
            </Card>
          ) : profiles.length === 0 ? (
            <Card className="text-center py-16 border-0 shadow-md">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Text className="text-gray-500 text-lg block mb-4">
                      Bạn chưa có hồ sơ bệnh án nào
                    </Text>
                    <Text className="text-gray-400">
                      Tạo hồ sơ đầu tiên để bắt đầu quản lý sức khỏe
                    </Text>
                  </div>
                }
              />
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <QuickAddProfile 
                  onSuccess={fetchProfiles}
                  trigger={
                    <Button
                                             type="primary"
                       size="large"
                       icon={<UserAddOutlined />}
                       className="bg-[#0C3C54] hover:bg-[#0C3C54]/90 border-0"
                    >
                      Tạo hồ sơ đầu tiên
                    </Button>
                  }
                />
                <Button
                  size="large"
                  icon={<TeamOutlined />}
                  onClick={() => navigate('/user-profiles')}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  Xem hướng dẫn
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="border-0 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <Title level={4} className="!m-0 !text-gray-800">
                  Danh sách hồ sơ ({profiles.length})
                </Title>
                                 <Button
                   type="link"
                   onClick={() => navigate('/user-profiles')}
                   className="text-[#0C3C54] hover:text-[#0C3C54]/80 p-0"
                 >
                  Xem tất cả →
                </Button>
              </div>
              
              <Row gutter={[16, 16]}>
                <AnimatePresence>
                  {profiles.slice(0, 6).map((profile, index) => (
                    <Col xs={24} sm={12} lg={8} key={profile._id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <ProfileCard
                          profile={profile}
                          onEdit={handleEditProfile}
                          onDelete={handleDeleteProfile}
                          onSelect={handleSelectProfile}
                          onViewHistory={handleViewMedicalHistory}
                        />
                      </motion.div>
                    </Col>
                  ))}
                </AnimatePresence>
              </Row>

              {profiles.length > 6 && (
                <div className="text-center mt-6 pt-4 border-t border-gray-100">
                  <Button
                                         type="primary"
                     size="large"
                     onClick={() => navigate('/user-profiles')}
                     className="bg-[#0C3C54] hover:bg-[#0C3C54]/90 border-0"
                  >
                    Xem thêm {profiles.length - 6} hồ sơ khác
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Modal for Create/Edit Profile */}
          <Modal
            title={selectedProfile ? 'Chỉnh sửa hồ sơ' : 'Tạo hồ sơ mới'}
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={null}
            width={600}
            destroyOnClose
          >
                         <ProfileForm
               initialValues={selectedProfile || undefined}
               onCancel={() => setIsModalVisible(false)}
               onSubmit={async (data) => {
                try {
                  setIsFormSubmitting(true);
                  if (selectedProfile?._id) {
                    await userProfileApi.updateProfile(selectedProfile._id, data);
                    notification.success({
                      message: 'Thành công',
                      description: 'Cập nhật hồ sơ thành công!'
                    });
                  } else {
                    await userProfileApi.createProfile(data);
                    notification.success({
                      message: 'Thành công',
                      description: 'Tạo hồ sơ mới thành công!'
                    });
                  }
                  setIsModalVisible(false);
                  fetchProfiles();
                } catch (error) {
                  console.error('Error submitting profile:', error);
                  notification.error({
                    message: 'Lỗi',
                    description: 'Không thể lưu hồ sơ. Vui lòng thử lại sau.'
                  });
                } finally {
                  setIsFormSubmitting(false);
                }
              }}
              loading={isFormSubmitting}
            />
          </Modal>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilesPage; 