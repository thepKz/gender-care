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

      // ✅ Check meeting existence cho từng consultation
      const meetingStatuses: {[key: string]: boolean} = {};
      for (const consultation of todayData) {
        const hasMeeting = await checkConsultationMeeting(consultation._id);
        meetingStatuses[consultation._id] = hasMeeting;
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

  const handleJoinMeeting = async (consultation: ConsultationData) => {
    try {
      console.log('🎯 [JOIN-MEETING] Joining meeting for consultation:', consultation._id);
      
      // ✅ Call API to join meeting and update status
      await consultationApi.joinConsultationMeeting(consultation._id, {
        participantType: 'doctor'
      });
      
      // ✅ Update status to 'consulting' if not already
      if (consultation.status !== 'consulting') {
        await consultationApi.updateConsultationStatus(consultation._id, 'consulting');
      }
      
      // ✅ Open meeting link
      const meetingLink = consultation.meetingLink || `https://meet.jit.si/consultation-${consultation._id}`;
      window.open(meetingLink, '_blank');
      
      message.success(`Đã tham gia meeting với ${consultation.patientName}`);
      
      // ✅ Reload data to reflect status changes
      loadConsultationData();
      
    } catch (error) {
      console.error('❌ Error joining meeting:', error);
      message.error('Không thể tham gia meeting. Vui lòng thử lại.');
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

  // Live Consultation Card Component
  const LiveConsultationCard: React.FC<{ consultation: ConsultationData }> = ({ consultation }) => (
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
              icon={<VideoCameraOutlined />}
              onClick={() => handleJoinMeeting(consultation)}
            >
              Tham gia lại
            </Button>
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

  // Today's Consultation Item Component - ✅ UPDATED với meeting workflow
  const TodayConsultationItem: React.FC<{ consultation: ConsultationData }> = ({ consultation }) => {
    const hasMeeting = consultationMeetings[consultation._id] || false;
    
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
        // Đã có meeting record → hiển thị tag đã tạo meeting
        return (
          <Tag color="green">
            <CheckCircleOutlined style={{ marginRight: '4px' }} />
            Đã tạo meeting
          </Tag>
        );
      }
    };

    return (
      <List.Item
        actions={[renderActionButton()]}
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
          <Card title="💡 Mẹo tư vấn">
            <div style={{ color: '#666' }}>
              <p>• Kiểm tra kết nối mạng trước khi bắt đầu</p>
              <p>• Chuẩn bị sẵn câu hỏi để tư vấn hiệu quả</p>
              <p>• Ghi chú lại các điểm quan trọng</p>
              <p>• Đảm bảo môi trường yên tĩnh</p>
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