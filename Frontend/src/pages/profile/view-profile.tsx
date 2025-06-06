import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, 
  Typography, 
  Breadcrumb, 
  Spin, 
  Avatar, 
  Descriptions, 
  Button, 
  Tabs,
  Tag,
  Divider,
  notification,
  Empty,
  Result
} from 'antd';
import { 
  ArrowLeftOutlined, 
  TeamOutlined, 
  ManOutlined, 
  WomanOutlined,
  QuestionOutlined,
  EditOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  HistoryOutlined,
  CalendarOutlined,
  ReloadOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import userProfileApi from '../../api/endpoints/userProfileApi';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile } from '../../types';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface MedicalRecord {
  date: string;
  diagnosis: string;
  treatment: string;
  doctor: string;
}

interface TestResult {
  date: string;
  testType: string;
  result: string;
}

// Dữ liệu mẫu cho bệnh án
const sampleMedicalRecords: MedicalRecord[] = [
  {
    date: '2023-10-15',
    diagnosis: 'Viêm họng cấp',
    treatment: 'Kháng sinh, nghỉ ngơi, uống nhiều nước',
    doctor: 'BS. Nguyễn Văn A'
  },
  {
    date: '2023-08-20',
    diagnosis: 'Cảm cúm mùa',
    treatment: 'Paracetamol, vitamin C',
    doctor: 'BS. Trần Thị B'
  }
];

// Dữ liệu mẫu cho kết quả xét nghiệm
const sampleTestResults: TestResult[] = [
  {
    date: '2023-10-14',
    testType: 'Xét nghiệm máu',
    result: 'Bạch cầu tăng nhẹ'
  },
  {
    date: '2023-08-19',
    testType: 'Chụp X-quang phổi',
    result: 'Bình thường, không phát hiện bất thường'
  }
];

const ViewProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('1');
  const [error, setError] = useState<string | null>(null);

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Lấy thông tin hồ sơ
  const fetchProfileData = async () => {
    if (!profileId) {
      notification.error({
        message: 'Lỗi',
        description: 'Không tìm thấy ID hồ sơ'
      });
      navigate('/profile/health-profiles');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await userProfileApi.getProfileById(profileId);
      console.log('API Response:', response); // Log để debug
      
      // Kiểm tra và xử lý nhiều cấu trúc dữ liệu có thể có
      let profileData;
      if (response?.data?.data) {
        profileData = response.data.data;
      } else if (response?.data) {
        profileData = response.data;
      }
      
      if (!profileData) {
        setError('Không tìm thấy thông tin hồ sơ');
        notification.error({
          message: 'Lỗi dữ liệu',
          description: 'Không tìm thấy thông tin hồ sơ'
        });
        return;
      }

      setProfile(profileData);
    } catch (error: unknown) {
      console.error('Error fetching profile:', error);
      
      let errorMessage = 'Không thể tải thông tin hồ sơ.';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.log('Error response:', error.response);
          errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        } else {
          errorMessage = 'Lỗi khi gửi yêu cầu: ' + error.message;
        }
      } else {
        errorMessage = 'Lỗi không xác định: ' + String(error);
      }
      
      setError(errorMessage);
      notification.error({
        message: 'Lỗi kết nối',
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông tin hồ sơ
  useEffect(() => {
    fetchProfileData();
  }, [profileId, navigate]);

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
  const renderGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      default:
        return 'Khác';
    }
  };

  // Hàm điều hướng đến trang quản lý chu kỳ kinh nguyệt
  const handleNavigateToMenstrualTracker = () => {
    if (profile && profile._id) {
      navigate(`/profile/menstrual-tracker/${profile._id}`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl flex justify-center items-center min-h-[60vh]">
        <Spin size="large" tip="Đang tải thông tin hồ sơ..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Result
          status="error"
          title="Không thể tải thông tin hồ sơ"
          subTitle={error}
          extra={[
            <Button 
              type="primary" 
              key="retry"
              icon={<ReloadOutlined />}
              onClick={fetchProfileData}
              className="bg-[#0C3C54] hover:bg-[#1a5570] border-none"
            >
              Thử lại
            </Button>,
            <Button 
              key="back" 
              onClick={() => navigate('/profile/health-profiles')}
            >
              Quay lại danh sách
            </Button>,
          ]}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Empty 
          description="Không tìm thấy thông tin hồ sơ" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
        <div className="text-center mt-4">
          <Button 
            type="primary"
            onClick={() => navigate('/profile/health-profiles')}
            className="rounded-lg bg-[#0C3C54] hover:bg-[#1a5570] border-none"
          >
            Quay lại danh sách hồ sơ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Breadcrumb className="mb-6">
          <Breadcrumb.Item>
            <Link to="/profile">Tài khoản</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/profile/health-profiles">Hồ sơ sức khỏe</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Chi tiết hồ sơ</Breadcrumb.Item>
        </Breadcrumb>

        <div className="flex items-center justify-between mb-6">
          <div>
            <Title level={2} className="!text-[#0C3C54] !m-0 flex items-center">
              <TeamOutlined className="mr-2" /> 
              Chi tiết hồ sơ bệnh án
            </Title>
            <Text className="text-gray-500 mt-2 block">
              Xem thông tin chi tiết hồ sơ bệnh án
            </Text>
          </div>
          <div className="flex gap-3">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/profile/health-profiles')}
              className="flex items-center"
            >
              Quay lại
            </Button>
            {profile && profile.gender === 'female' && (
              <Button
                type="primary"
                icon={<LineChartOutlined />}
                onClick={handleNavigateToMenstrualTracker}
                className="flex items-center bg-pink-500 hover:bg-pink-600 border-none"
              >
                Quản lý chu kỳ
              </Button>
            )}
            <Button 
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/profile/edit-profile/${profile?._id}`)}
              className="flex items-center bg-[#0C3C54] hover:bg-[#1a5570] border-none"
            >
              Chỉnh sửa
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Thông tin cơ bản */}
          <div className="md:col-span-1">
            <Card className="rounded-xl shadow-md text-center">
              <div className="mb-4">
                <Avatar 
                  size={100} 
                  icon={renderGenderIcon(profile.gender)}
                  className={`border-4 ${
                    profile.gender === 'male' ? 'border-blue-500' : 
                    profile.gender === 'female' ? 'border-pink-500' : 
                    'border-purple-500'
                  }`}
                  style={{ backgroundColor: '#fff' }}
                />
              </div>
              <Title level={4} className="!mb-1">{profile.fullName}</Title>
              <Tag color={
                profile.gender === 'male' ? 'blue' : 
                profile.gender === 'female' ? 'pink' : 
                'purple'
              }>
                {renderGenderLabel(profile.gender)}
              </Tag>
              
              <Divider />
              
              <div className="text-left">
                {profile.phone && (
                  <div className="mb-2">
                    <Text type="secondary">Số điện thoại:</Text>
                    <div>{profile.phone}</div>
                  </div>
                )}
                
                {profile.year && (
                  <div>
                    <Text type="secondary">Ngày sinh:</Text>
                    <div>{new Date(profile.year).toLocaleDateString('vi-VN')}</div>
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          {/* Thông tin chi tiết */}
          <div className="md:col-span-3">
            <Card className="rounded-xl shadow-md">
              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                type="card"
                className="profile-detail-tabs"
              >
                <TabPane 
                  tab={
                    <span className="flex items-center">
                      <FileTextOutlined className="mr-2" />
                      Thông tin chung
                    </span>
                  } 
                  key="1"
                >
                  <Descriptions 
                    title="Thông tin chi tiết" 
                    bordered 
                    column={{ xs: 1, sm: 2 }}
                    className="rounded-lg overflow-hidden"
                  >
                    <Descriptions.Item label="Họ và tên">{profile.fullName}</Descriptions.Item>
                    <Descriptions.Item label="Giới tính">{renderGenderLabel(profile.gender)}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{profile.phone || 'Chưa cập nhật'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày sinh">
                      {profile.year ? new Date(profile.year).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo hồ sơ" span={2}>
                      {new Date(profile.createdAt).toLocaleDateString('vi-VN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Descriptions.Item>
                  </Descriptions>
                  
                  <div className="mt-6">
                    <Paragraph className="text-gray-500 italic">
                      * Đây là thông tin cơ bản của hồ sơ bệnh án. Để cập nhật thông tin, vui lòng nhấn nút "Chỉnh sửa".
                    </Paragraph>
                  </div>
                </TabPane>
                
                <TabPane 
                  tab={
                    <span className="flex items-center">
                      <MedicineBoxOutlined className="mr-2" />
                      Bệnh án
                    </span>
                  } 
                  key="2"
                >
                  <div className="mb-4">
                    <Title level={5}>Lịch sử bệnh án</Title>
                    <Paragraph className="text-gray-500">
                      Danh sách các lần khám và điều trị
                    </Paragraph>
                  </div>
                  
                  {sampleMedicalRecords.length > 0 ? (
                    <div className="space-y-4">
                      {sampleMedicalRecords.map((record, index) => (
                        <Card 
                          key={index} 
                          className="rounded-lg border border-gray-200"
                          size="small"
                        >
                          <div className="flex items-center mb-2">
                            <CalendarOutlined className="mr-2 text-blue-600" />
                            <Text strong>{new Date(record.date).toLocaleDateString('vi-VN')}</Text>
                          </div>
                          <Descriptions column={1} size="small" className="mb-0">
                            <Descriptions.Item label="Chẩn đoán">{record.diagnosis}</Descriptions.Item>
                            <Descriptions.Item label="Điều trị">{record.treatment}</Descriptions.Item>
                            <Descriptions.Item label="Bác sĩ">{record.doctor}</Descriptions.Item>
                          </Descriptions>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Empty description="Chưa có thông tin bệnh án" />
                  )}
                </TabPane>
                
                <TabPane 
                  tab={
                    <span className="flex items-center">
                      <HistoryOutlined className="mr-2" />
                      Kết quả xét nghiệm
                    </span>
                  } 
                  key="3"
                >
                  <div className="mb-4">
                    <Title level={5}>Kết quả xét nghiệm</Title>
                    <Paragraph className="text-gray-500">
                      Danh sách các kết quả xét nghiệm
                    </Paragraph>
                  </div>
                  
                  {sampleTestResults.length > 0 ? (
                    <div className="space-y-4">
                      {sampleTestResults.map((test, index) => (
                        <Card 
                          key={index} 
                          className="rounded-lg border border-gray-200"
                          size="small"
                        >
                          <div className="flex items-center mb-2">
                            <CalendarOutlined className="mr-2 text-green-600" />
                            <Text strong>{new Date(test.date).toLocaleDateString('vi-VN')}</Text>
                          </div>
                          <Descriptions column={1} size="small" className="mb-0">
                            <Descriptions.Item label="Loại xét nghiệm">{test.testType}</Descriptions.Item>
                            <Descriptions.Item label="Kết quả">{test.result}</Descriptions.Item>
                          </Descriptions>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Empty description="Chưa có kết quả xét nghiệm" />
                  )}
                </TabPane>
              </Tabs>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ViewProfilePage; 