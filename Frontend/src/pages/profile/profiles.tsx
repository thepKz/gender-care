import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Empty, 
  Spin, 
  Modal, 
  notification, 
  Typography,
  Row,
  Col
} from 'antd';
import { 
  UserAddOutlined, 
  TeamOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileCard from '../../components/profile/ProfileCard';
import ProfileForm from '../../components/profile/ProfileForm';
import { UserProfile } from '../../types';
import userProfileApi from '../../api/endpoints/userProfileApi';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;

const ProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
      setProfiles(response.data || []);
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

  const handleCreateProfile = () => {
    setSelectedProfile(null);
    setIsModalVisible(true);
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
    }
  };

  const handleProfileSubmit = async (formData: Partial<UserProfile>) => {
    try {
      setIsFormSubmitting(true);
      
      if (selectedProfile?._id) {
        // Update existing profile
        await userProfileApi.updateProfile(selectedProfile._id, formData);
        notification.success({
          message: 'Thành công',
          description: 'Cập nhật hồ sơ thành công!'
        });
      } else {
        // Create new profile
        await userProfileApi.createProfile(formData);
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
  };

  const handleSelectProfile = (profile: UserProfile) => {
    // Đặt profile này làm profile chính cho booking
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

  const handleManageMenstrualCycle = (profileId: string) => {
    navigate(`/profile/menstrual-tracker/${profileId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <Title level={2} className="!text-[#0C3C54] !m-0">
              Quản lý hồ sơ sức khỏe
            </Title>
            <Text className="text-gray-500 mt-2 block">
              Quản lý hồ sơ sức khỏe của bạn và người thân
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<UserAddOutlined />}
            onClick={handleCreateProfile}
            className="mt-4 md:mt-0 bg-[#0C3C54] hover:bg-[#1a5570] border-none rounded-lg"
          >
            Tạo hồ sơ mới
          </Button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md mb-8">
          <div className="flex items-center gap-3 mb-4">
            <InfoCircleOutlined className="text-[#0C3C54] text-xl" />
            <Title level={4} className="!m-0">Thông tin quan trọng</Title>
          </div>
          <Text className="text-gray-600 block mb-4">
            Hồ sơ sức khỏe là nơi lưu trữ thông tin y tế của bạn và người thân. 
            Mỗi hồ sơ sẽ lưu trữ riêng biệt lịch sử khám bệnh, xét nghiệm, và kết quả y tế.
          </Text>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <ExclamationCircleOutlined className="text-blue-500 mt-1" />
              <div>
                <Text strong className="text-blue-700">Lưu ý:</Text>
                <ul className="ml-6 mt-2 list-disc text-gray-700 space-y-1">
                  <li>Bạn có thể tạo nhiều hồ sơ cho bản thân và người thân</li>
                  <li>Trước khi đặt lịch khám, bạn cần chọn hồ sơ tương ứng</li>
                  <li>Mỗi hồ sơ sẽ có lịch sử y tế riêng biệt</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Spin size="large" />
            <p className="mt-4 text-gray-500">Đang tải hồ sơ...</p>
          </div>
        ) : (
          <>
            {profiles.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span className="text-gray-500">
                      Bạn chưa có hồ sơ nào. Hãy tạo hồ sơ đầu tiên!
                    </span>
                  }
                >
                  <Button 
                    type="primary" 
                    icon={<UserAddOutlined />} 
                    onClick={handleCreateProfile}
                    className="mt-4 bg-[#0C3C54] hover:bg-[#1a5570] border-none"
                  >
                    Tạo hồ sơ mới
                  </Button>
                </Empty>
              </div>
            ) : (
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-6">
                  <TeamOutlined className="text-[#0C3C54] text-xl" />
                  <Title level={4} className="!m-0">Danh sách hồ sơ ({profiles.length})</Title>
                </div>
                
                <Row gutter={[16, 16]}>
                  <AnimatePresence>
                    {profiles.map((profile) => (
                      <Col xs={24} sm={12} lg={8} key={profile._id}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ProfileCard
                            profile={profile}
                            isMainProfile={localStorage.getItem('selectedProfileId') === profile._id}
                            onEdit={handleEditProfile}
                            onDelete={handleDeleteProfile}
                            onSelect={handleSelectProfile}
                            onViewHistory={handleViewMedicalHistory}
                            onManageMenstrualCycle={profile.gender === 'female' ? handleManageMenstrualCycle : undefined}
                          />
                        </motion.div>
                      </Col>
                    ))}
                  </AnimatePresence>
                </Row>
              </div>
            )}
          </>
        )}
      </motion.div>

      <Modal
        title={selectedProfile ? 'Chỉnh sửa hồ sơ' : 'Tạo hồ sơ mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
        className="profile-modal"
      >
        <ProfileForm
          initialValues={selectedProfile || undefined}
          onSubmit={handleProfileSubmit}
          onCancel={() => setIsModalVisible(false)}
          loading={isFormSubmitting}
        />
      </Modal>
    </div>
  );
};

export default ProfilesPage; 