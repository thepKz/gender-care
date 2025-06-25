import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Avatar,
  Button,
  Space,
  Statistic,
  List,
  Badge,
  message
} from 'antd';
import {
  VideoCameraOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  MessageOutlined,
  ReloadOutlined,
  CalendarOutlined,
  PoweroffOutlined,
  CloseCircleOutlined,
  EditOutlined
} from '@ant-design/icons';
import consultationApi from '../../../api/endpoints/consultation';
import { meetingAPI } from '../../../api/endpoints/meeting';
import MeetingNotesModal from '../../../components/ui/modals/MeetingNotesModal';

const { Title, Text } = Typography;

// ✅ Type definitions cho API response data
interface ConsultationData {
  _id: string;
  patientName: string; // Alias for fullName from API
  patientPhone: string; // Alias for phone from API
  serviceName: string;
  appointmentDate: string;
  appointmentSlot: string; // Format: "14:00-15:00"
  appointmentTime: string; // Alias for appointmentSlot
  status: 'pending_payment' | 'scheduled' | 'consulting' | 'completed' | 'cancelled';
  description: string; // Alias for question from API
  notes?: string;
  doctorNotes?: string;
  meetingLink?: string;
  fullName: string; // Original field from API
  phone: string; // Original field from API
  question: string; // Original field from API
  doctorId?: {
    _id: string;
    userId: {
      fullName: string;
      email: string;
    };
  };
  userId?: {
    fullName: string;
    email: string;
  };
  serviceId?: {
    serviceName: string;
    price: number;
  };
}

const ConsultationManagement: React.FC = () => {
  const [liveConsultations, setLiveConsultations] = useState<ConsultationData[]>([]);
  const [todayConsultations, setTodayConsultations] = useState<ConsultationData[]>([]);
  const [scheduledConsultations, setScheduledConsultations] = useState<ConsultationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [consultationMeetings, setConsultationMeetings] = useState<{[key: string]: boolean}>({});

  // Meeting Notes Modal state
  const [meetingNotesVisible, setMeetingNotesVisible] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationData | null>(null);

  // ➕ ADD: Meeting Password & Invite state
  const [meetingPasswords, setMeetingPasswords] = useState<{[key: string]: string}>({});
  const [meetingStatuses, setMeetingStatuses] = useState<{[key: string]: string}>({});
  const [inviteLoading, setInviteLoading] = useState<{[key: string]: boolean}>({});

  const loadConsultationData = async () => {
    setLoading(true);
    try {
      console.log('📊 [CONSULTATION] Loading consultation data from API...');
      
      // ✅ Helper function để transform API data sang format component cần
      const transformApiData = (apiData: ConsultationData[]): ConsultationData[] => {
        return apiData.map(item => ({
          ...item,
          // Create aliases for component compatibility
          patientName: item.fullName || 'N/A',
          patientPhone: item.phone || 'N/A', 
          appointmentTime: item.appointmentSlot || 'N/A',
          description: item.question || 'Không có mô tả',
          serviceName: item.serviceId?.serviceName || item.serviceName || 'Tư vấn trực tuyến'
        }));
      };
      
      // 🔴 Load live consultations (status = 'consulting')  
      const liveResponse = await consultationApi.getLiveConsultations();
      const liveData = transformApiData(liveResponse.data?.data || []);
      setLiveConsultations(liveData);
      
      // 📅 Load today consultations (all statuses for today)
      const todayResponse = await consultationApi.getTodayConsultations();
      const todayData = transformApiData(todayResponse.data?.data || []);
      setTodayConsultations(todayData);
      
      // 📋 Calculate scheduled consultations from today data (status = 'scheduled')
      const scheduledData = todayData.filter(item => item.status === 'scheduled');
      setScheduledConsultations(scheduledData);

      // ✅ Check meeting existence cho từng consultation và load password
      const meetingStatuses: {[key: string]: boolean} = {};
      for (const consultation of todayData) {
        const hasMeeting = await checkConsultationMeeting(consultation._id);
        meetingStatuses[consultation._id] = hasMeeting;
        
        // ➕ ADD: Load password nếu có meeting
        if (hasMeeting) {
          console.log(`🔑 [LOAD-DATA] Found existing meeting for ${consultation._id}, loading password...`);
          loadMeetingPassword(consultation._id);
        }
      }
      setConsultationMeetings(meetingStatuses);
      
      console.log('✅ [CONSULTATION] Data loaded successfully:', {
        live: liveData.length,
        today: todayData.length,
        scheduled: scheduledData.length,
        meetingStatuses
      });
      
    } catch (error) {
      console.error('❌ Error loading consultation data:', error);
      message.error('Không thể tải dữ liệu tư vấn');
      
      // Set empty arrays on error
      setLiveConsultations([]);
      setTodayConsultations([]);
      setScheduledConsultations([]);
      setConsultationMeetings({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultationData();
    
    // Auto-refresh every 30 seconds for live status
    const interval = setInterval(loadConsultationData, 30000);
    return () => clearInterval(interval);
  }, []);

  // ➕ NEW: Handle doctor join meeting with status update
  const handleDoctorJoinMeeting = async (consultation: ConsultationData) => {
    try {
      console.log('🎯 [DOCTOR-JOIN] Doctor joining meeting for consultation:', consultation._id);
      console.log('🌐 [API-CALL] Calling API: POST /meetings/' + consultation._id + '/doctor-join');
      
      // ✅ Call NEW API to update meeting status
      const response = await meetingAPI.updateDoctorJoinStatus(consultation._id);
      
      console.log('✅ [API-RESPONSE] Doctor join response:', response);
      
      // ✅ Open meeting link  
      const meetingLink = consultation.meetingLink || `https://meet.jit.si/consultation-${consultation._id}`;
      console.log('🔗 [MEETING-LINK] Opening:', meetingLink);
      window.open(meetingLink, '_blank');
      
      // ✅ Show success message from API
      message.success(`🎥 ${response.message}`);
      console.log('✅ [DOCTOR-JOIN] Status updated:', response.data);
      
      // ✅ Reload data to reflect status changes
      loadConsultationData();
      
    } catch (error: unknown) {
      console.error('❌ [ERROR] Doctor joining meeting failed:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : 'Không thể tham gia meeting. Vui lòng thử lại.';
      console.error('❌ [ERROR-MESSAGE]:', errorMessage);
      message.error(errorMessage || 'Không thể tham gia meeting. Vui lòng thử lại.');
    }
  };

  const handleCompleteConsultation = async (consultation: ConsultationData) => {
    try {
      console.log('✅ [COMPLETE-CONSULTATION] Completing consultation:', consultation._id);
      
      await consultationApi.completeConsultationWithMeeting(consultation._id, 'Consultation completed successfully');
      
      message.success(`Đã hoàn thành tư vấn với ${consultation.patientName}`);
      
      // ✅ Reload data to reflect status changes
      loadConsultationData();
      
    } catch (error) {
      console.error('❌ Error completing consultation:', error);
      message.error('Không thể hoàn thành tư vấn. Vui lòng thử lại.');
    }
  };

  // ✅ Helper function để check meeting existence cho consultation
  const checkConsultationMeeting = async (consultationId: string): Promise<boolean> => {
    try {
      const response = await consultationApi.checkMeetingExistence(consultationId);
      return response.data?.data?.hasmeeting || false;
    } catch (error) {
      console.error('Error checking meeting:', error);
      return false;
    }
  };

  // ✅ Tạo hồ sơ meeting cho consultation
  const handleCreateMeeting = async (consultation: ConsultationData) => {
    try {
      console.log('📝 [CREATE-MEETING] Creating meeting for consultation:', consultation._id);
      
      await consultationApi.createMeetingRecord(consultation._id);
      
      message.success(`Đã tạo hồ sơ meeting cho ${consultation.patientName}`);
      
      // ✅ Update meeting status locally và reload data
      setConsultationMeetings(prev => ({
        ...prev,
        [consultation._id]: true
      }));
      
      // ➕ ADD: Load password ngay sau khi tạo meeting
      setTimeout(() => {
        loadMeetingPassword(consultation._id);
      }, 1000); // Delay 1s để đảm bảo meeting đã được tạo
      
      loadConsultationData();
      
    } catch (error) {
      console.error('❌ Error creating meeting:', error);
      message.error('Không thể tạo hồ sơ meeting. Vui lòng thử lại.');
    }
  };

  // Open meeting notes modal
  const handleOpenMeetingNotes = (consultation: ConsultationData) => {
    setSelectedConsultation(consultation);
    setMeetingNotesVisible(true);
  };

  // Close meeting notes modal
  const handleCloseMeetingNotes = () => {
    setMeetingNotesVisible(false);
    setSelectedConsultation(null);
  };

  // Reload data when meeting completed
  const handleMeetingCompleted = () => {
    loadConsultationData();
  };

  // ➕ ADD: Load meeting password và status cho consultation
  const loadMeetingPassword = async (consultationId: string) => {
    try {
      console.log(`🔑 [LOAD-PASSWORD] Loading password for consultation: ${consultationId}`);
      
      const meetingData = await meetingAPI.getMeetingByQA(consultationId);
      console.log(`🔑 [LOAD-PASSWORD] Meeting data received:`, meetingData);
      
      if (meetingData) {
        if (meetingData.meetingPassword) {
        console.log(`🔑 [LOAD-PASSWORD] Password found: ${meetingData.meetingPassword}`);
        setMeetingPasswords(prev => ({
          ...prev,
          [consultationId]: meetingData.meetingPassword
        }));
        }
        
        if (meetingData.status) {
          console.log(`🔑 [LOAD-STATUS] Status found: ${meetingData.status}`);
          setMeetingStatuses(prev => ({
            ...prev,
            [consultationId]: meetingData.status
          }));
        }
      } else {
        console.log(`🔑 [LOAD-PASSWORD] No meeting data found`);
      }
    } catch (error) {
      console.error('❌ [LOAD-PASSWORD] Error loading meeting data:', error);
    }
  };

  // ➕ ADD: Send customer invite
  const handleSendCustomerInvite = async (consultation: ConsultationData) => {
    try {
      setInviteLoading(prev => ({ ...prev, [consultation._id]: true }));
      
      console.log('📧 [SEND-INVITE] Sending customer invite for consultation:', consultation._id);
      
      const response = await meetingAPI.sendCustomerInvite(consultation._id);
      
      message.success(`📧 Đã gửi thư mời tham gia meeting cho ${consultation.patientName}!`);
      console.log('✅ Customer invite sent:', response);
      
    } catch (error: unknown) {
      console.error('❌ Error sending customer invite:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : 'Không thể gửi thư mời cho customer';
      message.error(errorMessage || 'Không thể gửi thư mời cho customer');
    } finally {
      setInviteLoading(prev => ({ ...prev, [consultation._id]: false }));
    }
  };

  // Live Consultation Card Component - ✅ UPDATED với password display
  const LiveConsultationCard: React.FC<{ consultation: ConsultationData }> = ({ consultation }) => {
    const password = meetingPasswords[consultation._id];

    // Load meeting password khi component mount
    React.useEffect(() => {
      if (!password) {
        loadMeetingPassword(consultation._id);
      }
    }, [consultation._id, password]);

    return (
      <Card
        size="small"
        style={{ 
          marginBottom: 16,
          border: '2px solid #fa8c16',
          background: '#fff7e6'
        }}
      >
        <Row justify="space-between" align="middle">
          <Col flex="auto">
            <Space>
              <Badge status="processing" />
              <Avatar icon={<UserOutlined />} />
              <div>
                <Text strong style={{ fontSize: '16px' }}>
                  {consultation.patientName}
                </Text>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  <PhoneOutlined style={{ marginRight: '8px' }} />
                  {consultation.patientPhone}
                </div>
              </div>
              <Tag color="orange">🔴 LIVE</Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              <Text type="secondary">
                {consultation.appointmentTime}
              </Text>
              <Button 
                icon={<EditOutlined />}
                onClick={() => handleOpenMeetingNotes(consultation)}
                type="dashed"
              >
                Quản lý
              </Button>
              <Button 
                type="primary"
                danger
                icon={<PoweroffOutlined />}
                onClick={() => handleCompleteConsultation(consultation)}
              >
                Kết thúc
              </Button>
            </Space>
          </Col>
        </Row>

        <div style={{ marginTop: 12, padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary">
            <strong>Vấn đề:</strong> {consultation.description}
          </Text>
        </div>
      </Card>
    );
  };

  // Today's Consultation Item Component - ✅ UPDATED với meeting workflow + PASSWORD DISPLAY
  const TodayConsultationItem: React.FC<{ consultation: ConsultationData }> = ({ consultation }) => {
    const hasMeeting = consultationMeetings[consultation._id] || false;
    const password = meetingPasswords[consultation._id];
    const meetingStatus = meetingStatuses[consultation._id];
    const isInviteLoading = inviteLoading[consultation._id] || false;

    // Load meeting password khi component mount nếu có meeting
    React.useEffect(() => {
      if (hasMeeting && !password) {
        loadMeetingPassword(consultation._id);
      }
    }, [consultation._id, hasMeeting, password]);
    
    // ✅ Dynamic button logic dựa trên meeting existence
    const renderActionButton = () => {
      // ❌ Đã cancelled hoặc completed → không cho phép tạo meeting
      if (consultation.status === 'completed') {
        return (
          <Tag color="green">
            <CheckCircleOutlined style={{ marginRight: '4px' }} />
            Đã hoàn thành
          </Tag>
        );
      }

      if (consultation.status === 'cancelled') {
        return (
          <Tag color="red">
            <CloseCircleOutlined style={{ marginRight: '4px' }} />
            Đã hủy
          </Tag>
        );
      }

      // ✅ Chỉ cho phép tạo meeting với status 'scheduled'
      if (consultation.status !== 'scheduled') {
        return (
          <Tag color="orange">
            <ClockCircleOutlined style={{ marginRight: '4px' }} />
            Chờ xử lý
          </Tag>
        );
      }

      // ✅ Meeting workflow logic - chỉ áp dụng cho status = 'scheduled'
      if (!hasMeeting) {
        // Chưa có meeting record → hiển thị button "Tạo hồ sơ meeting"
        return (
          <Button 
            type="primary"
            icon={<CalendarOutlined />}
            onClick={() => handleCreateMeeting(consultation)}
            size="small"
          >
            Tạo hồ sơ meeting
          </Button>
        );
      } else {
        // Đã có meeting record → check meeting status
        if (meetingStatus === 'scheduled') {
          // Doctor chưa tham gia → hiển thị button tham gia
          return (
            <Button 
              type="primary"
              icon={<VideoCameraOutlined />}
              onClick={() => handleDoctorJoinMeeting(consultation)}
              size="small"
              style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
            >
              Tham gia Meeting
            </Button>
          );
        } else if (meetingStatus === 'waiting_customer') {
          // Doctor đã vào → đang chờ customer
          return (
            <Tag color="orange">
              <ClockCircleOutlined style={{ marginRight: '4px' }} />
              Chờ customer tham gia
            </Tag>
          );
        } else {
          // Các status khác (in_progress, completed)
        return (
          <Tag color="green">
            <CheckCircleOutlined style={{ marginRight: '4px' }} />
              Meeting đang hoạt động
          </Tag>
        );
        }
      }
    };

    return (
      <List.Item
        actions={[
          renderActionButton(),
          // ➕ ADD: Send invite button chỉ khi meeting status = waiting_customer
          hasMeeting && meetingStatus === 'waiting_customer' && consultation.status === 'scheduled' && (
            <Button 
              type="primary"
              icon={<MessageOutlined />}
              onClick={() => handleSendCustomerInvite(consultation)}
              loading={isInviteLoading}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              size="small"
            >
              Gửi thư mời
            </Button>
          )
        ].filter(Boolean)}
      >
        <List.Item.Meta
          avatar={<Avatar icon={<UserOutlined />} />}
          title={
            <Space>
              <span>{consultation.patientName}</span>
              <Tag color="blue">{consultation.appointmentTime}</Tag>
              {hasMeeting && (
                <Tag color="green">
                  📋 Có meeting
                </Tag>
              )}
            </Space>
          }
          description={
            <div>
              <div>{consultation.description}</div>
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                <span>Trạng thái: </span>
                <Tag color={
                  consultation.status === 'scheduled' ? 'blue' :
                  consultation.status === 'consulting' ? 'orange' :
                  consultation.status === 'completed' ? 'green' : 'red'
                }>
                  {consultation.status === 'scheduled' ? 'Đã lên lịch' :
                   consultation.status === 'consulting' ? 'Đang tư vấn' :
                   consultation.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                </Tag>
              </div>
            </div>
          }
        />
      </List.Item>
    );
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <VideoCameraOutlined style={{ color: '#1890ff' }} />
              Quản lý Tư vấn Trực tuyến
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Theo dõi và quản lý các cuộc tư vấn trực tuyến
            </Text>
          </Col>
          <Col>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadConsultationData}
              loading={loading}
            >
              Làm mới
            </Button>
          </Col>
        </Row>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang tư vấn"
              value={liveConsultations.length}
              prefix={<VideoCameraOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Hôm nay"
              value={todayConsultations.length}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Chờ bắt đầu"
              value={scheduledConsultations.length}
              prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã hoàn thành"
              value={todayConsultations.filter(c => c.status === 'completed').length}
              prefix={<CheckCircleOutlined style={{ color: '#8c8c8c' }} />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Live Consultations - Priority 1 */}
      <Card 
        title={
          <Space>
            <Badge status="processing" />
            <span>🔴 Đang tư vấn ({liveConsultations.length})</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {liveConsultations.length > 0 ? (
          liveConsultations.map(consultation => (
            <LiveConsultationCard 
              key={consultation._id} 
              consultation={consultation} 
            />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <VideoCameraOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <div>Hiện tại không có cuộc tư vấn nào đang diễn ra</div>
          </div>
        )}
      </Card>

      {/* Today's Consultations - Priority 2 */}
      <Card 
        title={`⏰ Lịch tư vấn hôm nay (${todayConsultations.length})`}
        style={{ marginBottom: 24 }}
      >
        <List
          dataSource={todayConsultations}
          renderItem={(consultation) => (
            <TodayConsultationItem consultation={consultation} />
          )}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <CalendarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>Hôm nay không có lịch tư vấn nào</div>
              </div>
            )
          }}
        />
      </Card>

      {/* Quick Actions & Tips */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="⚡ Thao tác nhanh">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />} 
                block
                disabled={scheduledConsultations.length === 0}
              >
                Bắt đầu tư vấn tiếp theo
              </Button>
              <Button 
                icon={<MessageOutlined />} 
                block
              >
                Gửi tin nhắn cho bệnh nhân
              </Button>
              <Button 
                icon={<CalendarOutlined />} 
                block
              >
                Xem lịch tuần này
              </Button>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="💡 Mẹo tư vấn với Password bảo mật">
            <div style={{ color: '#666' }}>
              <p>• <strong>Kiểm tra password hiển thị</strong> trước khi gửi thư mời</p>
              <p>• <strong>Chỉ gửi thư mời</strong> qua nút "Gửi thư mời Meeting"</p>
              <p>• <strong>Xác nhận customer nhận email</strong> trước khi bắt đầu</p>
              <p>• <strong>Ghi hình toàn bộ buổi tư vấn</strong> để bảo vệ quyền lợi</p>
              <p>• <strong>Không chia sẻ password</strong> qua điện thoại hoặc tin nhắn</p>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Meeting Notes Modal */}
      {selectedConsultation && (
        <MeetingNotesModal
          visible={meetingNotesVisible}
          consultationId={selectedConsultation._id}
          consultationData={{
            patientName: selectedConsultation.patientName,
            patientPhone: selectedConsultation.patientPhone,
            appointmentTime: selectedConsultation.appointmentTime,
            description: selectedConsultation.description
          }}
          onClose={handleCloseMeetingNotes}
          onMeetingCompleted={handleMeetingCompleted}
        />
      )}
    </div>
  );
};

export default ConsultationManagement; 