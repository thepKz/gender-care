import {
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  MedicineBoxOutlined,
  SaveOutlined,
  StarOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Progress,
  Rate,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import React, { useEffect, useState } from 'react';
import doctorApi, { Doctor } from '../../../api/endpoints/doctorApi';
import { useAuth } from '../../../hooks/useAuth';
import { getDoctorScheduleStats, getTodayStats } from '../../../utils/doctorCalendarUtils';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface DoctorInfo extends Doctor {
  totalPatients?: number;
  totalAppointments?: number;
  averageRating?: number;
  experienceYears?: number;
  currentSchedules?: DoctorSchedule[];
}

const DoctorOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Load doctor information and schedules
  useEffect(() => {
    if (user && user.role === 'doctor') {
      loadDoctorData();
    }
  }, [user]);

  const loadDoctorData = async () => {
    try {
      setLoading(true);
      
      // Load doctor's personal information and schedules in parallel
      const [doctorData, schedulesData] = await Promise.all([
        // Tìm thông tin doctor từ user ID (cần implement API endpoint)
        loadDoctorInfo(),
        doctorApi.getDoctorSchedules(user?._id || '')
      ]);

      setDoctorInfo(doctorData);
      setSchedules([schedulesData]);
    } catch (error: any) {
      console.error('Error loading doctor data:', error);
      message.error('Không thể tải thông tin bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorInfo = async (): Promise<DoctorInfo> => {
    // Tạm thời sử dụng thông tin từ user, sau này có thể gọi API riêng
    // để lấy thông tin doctor chi tiết từ bảng Doctor
    const mockDoctorInfo: DoctorInfo = {
      _id: 'doctor_' + user?._id,
      userId: {
                  _id: user?._id || '',
        fullName: user?.fullName || '',
        email: user?.email || '',
                  avatar: user?.avatar,
          phone: user?.phone,
        role: 'doctor'
      },
      bio: 'Bác sĩ chuyên khoa với nhiều năm kinh nghiệm trong lĩnh vực chăm sóc sức khỏe phụ nữ.',
      experience: 5,
      rating: 4.5,
      specialization: 'Sản phụ khoa',
      education: 'Đại học Y Hà Nội',
      certificate: 'Chứng chỉ hành nghề số 12345',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Mock statistics
      totalPatients: 150,
      totalAppointments: 280,
      averageRating: 4.5,
      experienceYears: 5
    };

    return mockDoctorInfo;
  };

  const handleEditProfile = () => {
    if (doctorInfo) {
      form.setFieldsValue({
        bio: doctorInfo.bio,
        specialization: doctorInfo.specialization,
        experience: doctorInfo.experience,
        education: doctorInfo.education,
        certificate: doctorInfo.certificate
      });
      setIsEditModalVisible(true);
    }
  };

  const handleSaveProfile = async (values: any) => {
    try {
      // TODO: Implement API call to update doctor profile
      console.log('Updating doctor profile:', values);
      
      // Update local state
      if (doctorInfo) {
        setDoctorInfo({
          ...doctorInfo,
          ...values
        });
      }
      
      message.success('Cập nhật thông tin thành công!');
      setIsEditModalVisible(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      message.error('Cập nhật thất bại. Vui lòng thử lại.');
    }
  };

  // Calculate statistics
  const overallStats = schedules.length > 0 ? getDoctorScheduleStats(schedules) : null;
  const todayStats = schedules.length > 0 ? getTodayStats(schedules) : null;

  // Check if user is doctor
  if (!user || user.role !== 'doctor') {
    return (
      <Alert
        message="Không có quyền truy cập"
        description="Bạn cần đăng nhập với tài khoản bác sĩ để xem trang này."
        type="error"
        showIcon
      />
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!doctorInfo) {
    return (
      <Alert
        message="Không tìm thấy thông tin"
        description="Không thể tải thông tin bác sĩ."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <UserOutlined /> Tổng quan
        </Title>
        <Text type="secondary">
          Thông tin cá nhân và thống kê hoạt động của bạn
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* Doctor Profile Card */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <UserOutlined />
                Thông tin cá nhân
              </Space>
            }
            extra={
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={handleEditProfile}
              >
                Chỉnh sửa
              </Button>
            }
          >
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Avatar 
                size={80} 
                src={doctorInfo.userId.avatar}
                icon={<UserOutlined />}
              />
              <Title level={4} style={{ margin: '8px 0 4px 0' }}>
                {doctorInfo.userId.fullName}
              </Title>
              <Text type="secondary">{doctorInfo.userId.email}</Text>
            </div>

            <Divider />

            <List
              size="small"
              dataSource={[
                {
                  label: 'Chuyên khoa',
                  value: doctorInfo.specialization || 'Chưa cập nhật',
                  icon: <MedicineBoxOutlined />
                },
                {
                  label: 'Kinh nghiệm',
                  value: `${doctorInfo.experience || 0} năm`,
                  icon: <TrophyOutlined />
                },
                {
                  label: 'Đánh giá',
                  value: (
                    <Space>
                      <Rate disabled value={doctorInfo.rating} />
                      <Text>({doctorInfo.rating || 0}/5)</Text>
                    </Space>
                  ),
                  icon: <StarOutlined />
                },
                {
                  label: 'Học vấn',
                  value: doctorInfo.education || 'Chưa cập nhật',
                  icon: <BookOutlined />
                }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    {item.icon}
                    <Text strong>{item.label}:</Text>
                  </Space>
                  <div>{item.value}</div>
                </List.Item>
              )}
            />

            {doctorInfo.bio && (
              <>
                <Divider />
                <div>
                  <Text strong>Giới thiệu:</Text>
                  <Paragraph style={{ marginTop: '8px' }}>
                    {doctorInfo.bio}
                  </Paragraph>
                </div>
              </>
            )}
          </Card>
        </Col>

        {/* Statistics Cards */}
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            {/* Today's Statistics */}
            <Col span={24}>
              <Card 
                title={
                  <Space>
                    <CalendarOutlined />
                    Thống kê hôm nay
                  </Space>
                }
              >
                <Row gutter={16}>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Tổng slots"
                      value={todayStats?.totalSlots || 0}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Có bệnh nhân"
                      value={todayStats?.bookedSlots || 0}
                      prefix={<TeamOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Slots trống"
                      value={todayStats?.freeSlots || 0}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Tỷ lệ sử dụng"
                      value={todayStats?.utilizationRate || 0}
                      suffix="%"
                      prefix={<BarChartOutlined />}
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Overall Statistics */}
            <Col span={24}>
              <Card 
                title={
                  <Space>
                    <BarChartOutlined />
                    Thống kê tổng thể
                  </Space>
                }
              >
                <Row gutter={16}>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Tổng bệnh nhân"
                      value={doctorInfo.totalPatients || 0}
                      prefix={<TeamOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Tổng cuộc hẹn"
                      value={doctorInfo.totalAppointments || 0}
                      prefix={<CalendarOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card.Meta
                      title="Tỷ lệ sử dụng lịch"
                      description={
                        <Tooltip title={`${overallStats?.bookedSlots || 0} / ${overallStats?.totalSlots || 0} slots đã được đặt`}>
                          <Progress 
                            percent={overallStats?.utilizationRate || 0} 
                            size="small"
                            status={
                              (overallStats?.utilizationRate || 0) > 80 ? 'success' :
                              (overallStats?.utilizationRate || 0) > 50 ? 'normal' : 'exception'
                            }
                          />
                        </Tooltip>
                      }
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card.Meta
                      title="Tỷ lệ khả dụng"
                      description={
                        <Tooltip title={`${overallStats?.freeSlots || 0} / ${overallStats?.totalSlots || 0} slots còn trống`}>
                          <Progress 
                            percent={overallStats?.availabilityRate || 0} 
                            size="small"
                            strokeColor="#52c41a"
                          />
                        </Tooltip>
                      }
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Status Overview */}
            <Col span={24}>
              <Card title="Trạng thái lịch làm việc">
                <Space wrap>
                  <Tag color="blue" icon={<BookOutlined />}>
                    {overallStats?.bookedSlots || 0} Slots đã đặt
                  </Tag>
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    {overallStats?.freeSlots || 0} Slots trống
                  </Tag>
                  <Tag color="red" icon={<ClockCircleOutlined />}>
                    {overallStats?.absentSlots || 0} Slots nghỉ
                  </Tag>
                  <Tag color="purple">
                    Tổng {overallStats?.totalSlots || 0} slots
                  </Tag>
                </Space>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Edit Profile Modal */}
      <Modal
        title="Chỉnh sửa thông tin cá nhân"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveProfile}
        >
          <Form.Item
            name="specialization"
            label="Chuyên khoa"
            rules={[{ required: true, message: 'Vui lòng nhập chuyên khoa!' }]}
          >
            <Select placeholder="Chọn chuyên khoa">
              <Option value="Sản phụ khoa">Sản phụ khoa</Option>
              <Option value="Nội khoa">Nội khoa</Option>
              <Option value="Ngoại khoa">Ngoại khoa</Option>
              <Option value="Nhi khoa">Nhi khoa</Option>
              <Option value="Tâm lý học">Tâm lý học</Option>
              <Option value="Dinh dưỡng">Dinh dưỡng</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="experience"
            label="Số năm kinh nghiệm"
            rules={[{ required: true, message: 'Vui lòng nhập số năm kinh nghiệm!' }]}
          >
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="education"
            label="Học vấn"
          >
            <Input placeholder="Ví dụ: Đại học Y Hà Nội" />
          </Form.Item>

          <Form.Item
            name="certificate"
            label="Chứng chỉ hành nghề"
          >
            <Input placeholder="Số chứng chỉ hành nghề" />
          </Form.Item>

          <Form.Item
            name="bio"
            label="Giới thiệu bản thân"
          >
            <TextArea 
              rows={4} 
              placeholder="Mô tả ngắn về kinh nghiệm và chuyên môn của bạn"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsEditModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Lưu thay đổi
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorOverviewPage; 