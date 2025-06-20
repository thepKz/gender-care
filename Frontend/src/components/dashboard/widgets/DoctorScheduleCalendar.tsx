import React, { useState, useEffect } from 'react';
import {
    Card,
  Typography, 
  Button, 
    Modal,
    Space,
    Tag,
  Row, 
  Col, 
    Tooltip,
  Avatar,
  Divider,
  Spin,
  message
} from 'antd';
import {
  CalendarOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  VideoCameraOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  LeftOutlined,
  RightOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StopOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import appointmentManagementService from '../../../api/services/appointmentManagementService';
import { UnifiedAppointment } from '../../../types/appointment';
import { meetingAPI, MeetingData } from '../../../api/endpoints/meeting';
import { mockConsultations, ConsultationMockData } from '../../../shared/mockData/consultationMockData';

// Setup timezone cho dayjs - an toàn hơn
dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

// Types
interface TimeSlot {
  id: string;
  slotTime: string;
  status: 'Free' | 'Booked' | 'Absent';
  appointment?: UnifiedAppointment; // Thêm data từ API
}

interface DaySchedule {
  date: string;
  dayName: string;
  fullDate: dayjs.Dayjs;
  slots: TimeSlot[];
}

interface WeekSchedule {
  weekRange: string;
  schedule: DaySchedule[];
}

// Define 8-hour working schedule (giống doctor schedule backend)
const TIME_SLOTS = [
  '07:00 - 08:00',
  '08:00 - 09:00', 
  '09:00 - 10:00',
  '10:00 - 11:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00'
];

// Smart button configuration based on consultation status
interface ConsultationButtonConfig {
  text: string;
  action: 'join' | 'rejoin' | 'complete' | 'completed';
  color: string;
  icon: React.ReactNode;
  loading: boolean;
  disabled: boolean;
}

const DoctorScheduleCalendar: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState(dayjs().startOf('week'));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<UnifiedAppointment[]>([]);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<MeetingData | null>(null);

  // Load real appointment data from API + Mock consultations for testing
  const loadAppointments = async () => {
    try {
      setLoading(true);
      console.log('📅 [DEBUG] Loading doctor appointments for calendar view');
      
      // Gọi API giống AppointmentManagement
      const appointmentData = await appointmentManagementService.getAllDoctorAppointments({
        page: 1,
        limit: 500 // Lấy nhiều để cover cả tuần
      });
      
      // Mix real data với mock consultations để test
      const mixedData = [...appointmentData, ...mockConsultations];
      
      console.log('✅ [DEBUG] Calendar loaded appointments:', mixedData.length);
      setAppointments(mixedData);
      
    } catch (error: unknown) {
      console.error('❌ [ERROR] Failed to load appointments for calendar:', error);
      message.error('Không thể tải lịch làm việc. Vui lòng thử lại sau.');
      
      // Fallback to mock data for testing
      console.log('📋 [DEBUG] Using mock consultation data for testing');
      setAppointments(mockConsultations);
    } finally {
      setLoading(false);
    }
  };

  // Smart button configuration based on consultation status
  const getConsultationButtonConfig = (appointment: UnifiedAppointment): ConsultationButtonConfig | null => {
    if (appointment.type !== 'consultation') return null;
    
    switch (appointment.status) {
      case 'scheduled':
        return {
          text: 'Tham gia Meet',
          action: 'join',
          color: '#52c41a',
          icon: <PlayCircleOutlined />,
          loading: false,
          disabled: false
        };
      case 'consulting':
        return {
          text: 'Đang tư vấn',
          action: 'rejoin', 
          color: '#fa8c16',
          icon: <VideoCameraOutlined />,
          loading: false,
          disabled: false
        };
      case 'completed':
        return {
          text: 'Đã hoàn thành',
          action: 'completed',
          color: '#8c8c8c', 
          icon: <CheckCircleOutlined />,
          loading: false,
          disabled: true
        };
      default:
        return null;
    }
  };

  // Transform appointments to calendar schedule format
  const generateScheduleFromAPI = (startWeek: dayjs.Dayjs): WeekSchedule => {
    const schedule: DaySchedule[] = [];
    const weekEnd = startWeek.add(6, 'day');
    const today = dayjs().startOf('day'); // Ngày hôm nay để so sánh
    
    for (let i = 0; i < 7; i++) {
      const currentDay = startWeek.add(i, 'day');
      const dayDateString = currentDay.format('YYYY-MM-DD');
      const isPastDate = currentDay.isBefore(today, 'day'); // Kiểm tra ngày quá khứ
      
      // Lọc appointments cho ngày này
      const dayAppointments = appointments.filter(apt => {
        const aptDate = dayjs(apt.appointmentDate).format('YYYY-MM-DD');
        return aptDate === dayDateString;
      });
      
      const daySchedule: DaySchedule = {
        date: currentDay.format('DD/MM'),
        dayName: currentDay.format('dddd'),
        fullDate: currentDay,
        slots: TIME_SLOTS.map((timeSlot, index) => {
          const slotId = `${currentDay.format('YYYY-MM-DD')}-${index}`;
          
          // Tìm appointment matching với time slot này
          const matchingAppointment = dayAppointments.find(apt => {
            const aptTime = apt.appointmentTime;
            
            // So sánh time slot (VD: "07:00 - 08:00" vs "07:00")
            const slotStart = timeSlot.split(' - ')[0];
            return aptTime.startsWith(slotStart) || aptTime === slotStart;
          });
          
          const slot: TimeSlot = {
            id: slotId,
            slotTime: timeSlot,
            status: matchingAppointment ? 'Booked' : isPastDate ? 'Absent' : 'Free' // Ngày quá khứ = Absent
          };

          if (matchingAppointment) {
            slot.appointment = matchingAppointment;
          }

          return slot;
        })
      };
      schedule.push(daySchedule);
    }

    return {
      weekRange: `${startWeek.format('DD/MM')} - ${weekEnd.format('DD/MM/YYYY')}`,
      schedule
    };
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // Generate schedule data from real API data
  const scheduleData = generateScheduleFromAPI(selectedWeek);

  const goToPreviousWeek = () => {
    setSelectedWeek(prev => prev.subtract(1, 'week'));
  };

  const goToNextWeek = () => {
    setSelectedWeek(prev => prev.add(1, 'week'));
  };

  const goToToday = () => {
    setSelectedWeek(dayjs().startOf('week'));
  };

  const refreshData = () => {
    loadAppointments();
  };

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setIsModalVisible(true);
    
    // Debug appointment data structure
    if (slot.appointment) {
      console.log('🧪 [DEBUG] Appointment data structure:', {
        appointmentDate: slot.appointment.appointmentDate,
        appointmentTime: slot.appointment.appointmentTime,
        type: slot.appointment.type,
        status: slot.appointment.status,
        patientName: slot.appointment.patientName,
        fullObject: slot.appointment
      });
    }
  };

  const getSlotColor = (slot: TimeSlot) => {
    if (slot.appointment) {
      switch (slot.appointment.status) {
        case 'pending_payment':
          return '#fa8c16'; // Orange
        case 'scheduled':
          return slot.appointment.type === 'consultation' ? '#1890ff' : '#722ed1'; // Blue for consultation, purple for appointment
        case 'consulting':
          return '#fa8c16'; // Orange - đang tư vấn
        case 'completed':
          return '#8c8c8c'; // Gray
        case 'cancelled':
          return '#f5222d'; // Red
        default:
          return '#d9d9d9';
      }
    }
    
    switch (slot.status) {
      case 'Free':
        return '#52c41a'; // Green
      case 'Absent':
        return '#8c8c8c'; // Gray
      default:
        return '#f5f5f5';
    }
  };

  const getSlotIcon = (slot: TimeSlot) => {
    if (slot.appointment) {
      switch (slot.appointment.status) {
        case 'consulting':
          return <VideoCameraOutlined />; // Live consultation
        default:
          switch (slot.appointment.type) {
            case 'consultation':
              return <VideoCameraOutlined />;
            case 'appointment':
              return slot.appointment.typeLocation === 'Online' ? 
                <VideoCameraOutlined /> : <EnvironmentOutlined />;
            default:
              return <UserOutlined />;
          }
      }
    }
    
    switch (slot.status) {
      case 'Free':
        return <CheckCircleOutlined />;
      case 'Absent':
        return <CloseCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getSlotText = (slot: TimeSlot) => {
    if (slot.appointment) {
      switch (slot.appointment.status) {
        case 'consulting':
          return 'Đang tư vấn'; // Live status
        default:
          switch (slot.appointment.type) {
            case 'consultation':
              return 'Tư vấn Online';
            case 'appointment':
              return slot.appointment.typeLocation === 'Online' ? 'Online' : 'Tại phòng';
            default:
              return 'Đã đặt';
          }
      }
    }
    
    switch (slot.status) {
      case 'Free':
        return 'Lịch trống';
      case 'Absent':
        return 'Vắng mặt';
      default:
        return 'N/A';
    }
  };

  const getStatusColor = (status: UnifiedAppointment['status']) => {
    const colors = {
      pending_payment: 'gold',
      scheduled: 'blue',
      consulting: 'orange',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: UnifiedAppointment['status']) => {
    const texts = {
      pending_payment: 'Chờ thanh toán',
      scheduled: 'Đã lên lịch',
      consulting: '🔴 Đang tư vấn',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canJoinMeeting = (appointment: UnifiedAppointment) => {
    // Luôn cho phép join meeting - không cần điều kiện gì
    return true;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getMeetingButtonText = (appointment: UnifiedAppointment) => {
    const config = getConsultationButtonConfig(appointment);
    return config?.text || 'Tham gia Meet';
  };

  // Handle start/rejoin consultation
  const handleJoinMeeting = async (appointment: UnifiedAppointment) => {
    const config = getConsultationButtonConfig(appointment);
    if (!config) return;

    try {
      setMeetingLoading(true);

      // For mock data, simulate status change
      if (mockConsultations.find(m => m._id === appointment._id)) {
        console.log('🧪 [MOCK] Simulating consultation start for:', appointment.patientName);
        
        // Update status in mock data
        const mockConsultation = appointment as ConsultationMockData;
        if (config.action === 'join') {
          // Start consultation
          mockConsultation.status = 'consulting';
          if (mockConsultation.originalData) {
            mockConsultation.originalData.status = 'consulting';
          }
          message.success(`Đã bắt đầu tư vấn với ${appointment.patientName}`);
        }
        
        // Open Jitsi meeting
        const meetingLink = mockConsultation.meetingLink || `https://meet.jit.si/consultation-${appointment._id}-${Date.now()}`;
        window.open(meetingLink, '_blank');
        message.success('Đã mở Jitsi Meet');
        
        // Refresh data to update UI
        setTimeout(() => {
          refreshData();
        }, 500);
        
        return;
      }

      // Real API call for production data
      let qaId = '';
      if (appointment.type === 'consultation') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const consultationData = appointment.originalData as any;
        qaId = consultationData?._id || consultationData?.id;
      }

      if (!qaId) {
        message.error('Không tìm thấy thông tin meeting');
        return;
      }

      // 1. Kiểm tra meeting đã tồn tại chưa
      let meetingData: MeetingData;
      try {
        meetingData = await meetingAPI.getMeetingByQA(qaId);
        console.log('✅ Found existing meeting:', meetingData);
      } catch {
        console.log('⚠️ Meeting chưa tồn tại, tạo mới...');
        
        // 2. Tạo meeting mới với Jitsi
        const createMeetingData = {
          qaId,
          doctorId: 'current-doctor-id', // TODO: Get from auth context
          scheduledTime: `${appointment.appointmentDate} ${appointment.appointmentTime}`,
          duration: 60,
          preferredProvider: 'jitsi' as const // Changed to Jitsi
        };

        const createResult = await meetingAPI.createMeeting(createMeetingData);
        console.log('✅ Created new meeting:', createResult);
        
        // Lấy lại meeting data sau khi tạo
        meetingData = await meetingAPI.getMeetingByQA(qaId);
      }

      // 3. Start consultation if action is 'join'
      if (config.action === 'join') {
        // TODO: Call API to update DoctorQA status to 'consulting'
        console.log('🚀 Starting consultation - updating status to consulting');
      }

      // 4. Notify join meeting (update participant count)
      await meetingAPI.joinMeeting(qaId, { participantType: 'doctor' });
      console.log('✅ Doctor joined meeting');

      // 5. Mở meeting link (Jitsi)
      if (meetingData.meetLink) {
        window.open(meetingData.meetLink, '_blank');
        message.success(`Đã mở ${meetingData.provider === 'google' ? 'Google Meet' : 'Jitsi Meet'}`);
        
        // Cập nhật state để hiển thị thông tin meeting
        setCurrentMeeting(meetingData);
      } else {
        message.error('Không có meeting link khả dụng');
      }

    } catch (error: unknown) {
      console.error('❌ Error joining meeting:', error);
      
      // Fallback: Tạo Jitsi Meet link tạm thời
      const fallbackLink = `https://meet.jit.si/consultation-${Date.now()}`;
      window.open(fallbackLink, '_blank');
      message.warning('Không thể kết nối meeting chính, đã tạo phòng Jitsi tạm thời');
      
    } finally {
      setMeetingLoading(false);
    }
  };

  // Handle complete consultation
  const handleCompleteMeeting = async (appointment: UnifiedAppointment) => {
    try {
      setMeetingLoading(true);

      // For mock data, simulate completion
      if (mockConsultations.find(m => m._id === appointment._id)) {
        console.log('🧪 [MOCK] Completing consultation for:', appointment.patientName);
        
        const mockConsultation = appointment as ConsultationMockData;
        mockConsultation.status = 'completed';
        if (mockConsultation.originalData) {
          mockConsultation.originalData.status = 'completed';
        }
        
        message.success(`Đã hoàn thành tư vấn với ${appointment.patientName}`);
        
        // Refresh data to update UI
        setTimeout(() => {
          refreshData();
        }, 500);
        
        return;
      }

      // Real API call for production
      // TODO: Call API to update DoctorQA status to 'completed'
      console.log('✅ Completing consultation - updating status to completed');
      
      message.success('Đã hoàn thành tư vấn');
      refreshData();

    } catch (error: unknown) {
      console.error('❌ Error completing consultation:', error);
      message.error('Có lỗi xảy ra khi hoàn thành tư vấn');
    } finally {
      setMeetingLoading(false);
    }
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px', borderRadius: '8px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CalendarOutlined style={{ color: '#1890ff' }} />
              Lịch làm việc cá nhân
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Tuần {scheduleData.weekRange}
            </Text>
          </Col>
          <Col>
            <Space>
            <Button
              icon={<ReloadOutlined />}
                onClick={refreshData}
              loading={loading}
            >
                Làm mới
            </Button>
              <Button 
                icon={<LeftOutlined />}
                onClick={goToPreviousWeek}
              >
                Tuần trước
              </Button>
            <Button
              type="primary"
                onClick={goToToday}
            >
                Hôm nay
            </Button>
              <Button 
                icon={<RightOutlined />}
                onClick={goToNextWeek}
              >
                Tuần sau
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Legend */}
        <Divider />
        <Row justify="center">
          <Space size="large">
            <Tag color="success">
              <CheckCircleOutlined /> Lịch trống
            </Tag>
            <Tag color="processing">
              <VideoCameraOutlined /> Tư vấn Online
            </Tag>
            <Tag color="purple">
              <EnvironmentOutlined /> Khám tại phòng
            </Tag>
            <Tag color="gold">
              <ExclamationCircleOutlined /> Chờ thanh toán
            </Tag>
            <Tag color="default">
              <CloseCircleOutlined /> Đã qua
            </Tag>
          </Space>
        </Row>
      </Card>

      {/* Calendar Grid */}
      <Card style={{ borderRadius: '8px' }}>
        <Spin spinning={loading}>
          <div style={{ overflowX: 'auto' }}>
            {/* Headers */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '120px repeat(7, 1fr)', 
              gap: '1px',
              background: '#f0f0f0',
              padding: '1px'
            }}>
              {/* Time column header */}
              <div style={{ 
                background: '#fafafa', 
                padding: '16px', 
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#666'
              }}>
                <ClockCircleOutlined style={{ marginRight: '8px' }} />
                Ca làm việc
            </div>

              {/* Day headers */}
              {scheduleData.schedule.map((day) => (
                <div 
                  key={day.date}
                  style={{ 
                    background: day.fullDate.isSame(dayjs(), 'day') ? '#e6f7ff' : '#fafafa',
                    padding: '16px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: day.fullDate.isSame(dayjs(), 'day') ? '#1890ff' : '#333'
                  }}
                >
                  <div style={{ fontSize: '14px' }}>{day.dayName}</div>
                  <div style={{ fontSize: '18px', marginTop: '4px' }}>{day.date}</div>
                </div>
              ))}
              </div>

            {/* Time slots */}
            {TIME_SLOTS.map((timeSlot, timeIndex) => (
              <div 
                key={timeSlot}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '120px repeat(7, 1fr)', 
                  gap: '1px',
                  background: '#f0f0f0',
                  padding: '1px'
                }}
              >
                {/* Time label */}
                <div style={{ 
                  background: '#fafafa', 
                  padding: '16px', 
                  textAlign: 'center',
                  fontWeight: '500',
                  color: '#666',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#999' }}>Ca {timeIndex + 1}</div>
                  <div style={{ fontSize: '14px' }}>{timeSlot}</div>
                </div>
                
                {/* Day slots */}
                {scheduleData.schedule.map((day) => {
                  const slot = day.slots[timeIndex];
                  const isPastDate = day.fullDate.isBefore(dayjs(), 'day');
                  const isClickable = slot.appointment || !isPastDate; // Chỉ click được nếu có appointment hoặc không phải ngày quá khứ
                  
                  return (
                    <Tooltip
                      key={slot.id}
                      title={
                        slot.appointment 
                        ? `${slot.appointment.patientName} - ${slot.appointment.serviceName}`
                        : isPastDate 
                        ? 'Ngày đã qua' 
                        : getSlotText(slot)
                      }
                    >
                      <div
                        onClick={isClickable ? () => handleSlotClick(slot) : undefined}
                        style={{
                          background: isPastDate && !slot.appointment ? '#f5f5f5' : '#fff',
                          padding: '16px',
                          textAlign: 'center',
                          cursor: isClickable ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                          borderLeft: `4px solid ${getSlotColor(slot)}`,
                          minHeight: '80px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          opacity: isPastDate && !slot.appointment ? 0.5 : 1, // Làm mờ ngày quá khứ
                        }}
                        onMouseEnter={isClickable ? (e) => {
                          e.currentTarget.style.background = isPastDate && !slot.appointment ? '#f0f0f0' : '#fafafa';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        } : undefined}
                        onMouseLeave={isClickable ? (e) => {
                          e.currentTarget.style.background = isPastDate && !slot.appointment ? '#f5f5f5' : '#fff';
                          e.currentTarget.style.transform = 'scale(1)';
                        } : undefined}
                      >
                        <div style={{
                          color: isPastDate && !slot.appointment ? '#bfbfbf' : getSlotColor(slot),
                          fontSize: '18px',
                          marginBottom: '8px'
                        }}>
                          {getSlotIcon(slot)}
              </div>
                <div style={{ 
                          fontSize: '12px',
                          fontWeight: '500',
                          color: isPastDate && !slot.appointment ? '#bfbfbf' : getSlotColor(slot)
                        }}>
                          {isPastDate && !slot.appointment ? 'Đã qua' : getSlotText(slot)}
                </div>
                        {slot.appointment && (
                  <div style={{ 
                            fontSize: '10px', 
                            color: isPastDate ? '#999' : '#666',
                            marginTop: '4px',
                            textAlign: 'center'
                          }}>
                            {slot.appointment.patientName}
                  </div>
                )}
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </Spin>
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: selectedSlot ? getSlotColor(selectedSlot) : '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              {selectedSlot && getSlotIcon(selectedSlot)}
                  </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Chi tiết lịch hẹn</div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {selectedSlot?.slotTime}
                </div>
              </div>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={
          selectedSlot?.appointment ? [
            <Button key="cancel" onClick={() => setIsModalVisible(false)}>
              Đóng
            </Button>,
            selectedSlot.appointment.type === 'consultation' && (
              <Button 
                key="join"
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={() => handleJoinMeeting(selectedSlot.appointment!)}
                loading={meetingLoading}
                style={{ 
                  background: '#52c41a', 
                  borderColor: '#52c41a'
                }}
              >
                {meetingLoading ? 'Đang tạo Meet...' : getMeetingButtonText(selectedSlot.appointment)}
              </Button>
            ),
            <Button 
              key="complete"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCompleteMeeting(selectedSlot.appointment!)}
              loading={meetingLoading}
            >
              Hoàn thành
            </Button>
          ] : [
            <Button key="cancel" onClick={() => setIsModalVisible(false)}>
              Đóng
            </Button>
          ]
        }
        width={600}
      >
        {selectedSlot && (
          <div style={{ padding: '20px 0' }}>
            {!selectedSlot.appointment && selectedSlot.status === 'Free' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircleOutlined style={{ 
                  fontSize: '48px', 
                  color: '#52c41a', 
                  marginBottom: '16px' 
                }} />
                <Title level={3} style={{ color: '#52c41a', margin: '0 0 8px 0' }}>
                  Lịch trống
                </Title>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Bạn có thể sử dụng thời gian này để nghỉ ngơi hoặc làm việc khác
                </Text>
              </div>
            )}

            {!selectedSlot.appointment && selectedSlot.status === 'Absent' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <ExclamationCircleOutlined style={{ 
                  fontSize: '48px', 
                  color: '#8c8c8c', 
                  marginBottom: '16px' 
                }} />
                <Title level={3} style={{ color: '#8c8c8c', margin: '0 0 8px 0' }}>
                  Vắng mặt
                </Title>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Bạn đã đăng ký không có mặt trong thời gian này
                </Text>
              </div>
            )}

            {selectedSlot.appointment && (
              <div>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card size="small" style={{ 
                      background: selectedSlot.appointment.type === 'consultation' ? '#e6f7ff' : '#fff7e6'
                    }}>
                      <Row align="middle" gutter={16}>
                        <Col flex="auto">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Avatar icon={<UserOutlined />} size={40} />
                            <div>
                              <Text strong style={{ fontSize: '16px' }}>
                                {selectedSlot.appointment.patientName}
                              </Text>
                              <div style={{ color: '#666', fontSize: '14px' }}>
                                <PhoneOutlined style={{ marginRight: '8px' }} />
                                {selectedSlot.appointment.patientPhone}
                              </div>
                            </div>
                          </div>
              </Col>
                        <Col>
                          <Tag 
                            color={getStatusColor(selectedSlot.appointment.status)}
                            style={{ padding: '4px 12px' }}
                          >
                            {getStatusText(selectedSlot.appointment.status)}
                          </Tag>
              </Col>
            </Row>
                    </Card>
                  </Col>

                  <Col span={24}>
                    <div style={{ padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
                      <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                        Dịch vụ:
                      </Text>
                      <Text>{selectedSlot.appointment.serviceName}</Text>
                      
                      <Divider style={{ margin: '16px 0' }} />
                      
                      <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                        Loại:
                      </Text>
                      <Tag 
                        color={selectedSlot.appointment.type === 'consultation' ? 'blue' : 'purple'}
                        style={{ padding: '4px 12px' }}
                      >
                        {selectedSlot.appointment.type === 'consultation' ? 
                          <><VideoCameraOutlined /> Tư vấn Online</> : 
                          <><EnvironmentOutlined /> {selectedSlot.appointment.typeLocation}</>
                        }
                      </Tag>

                      {selectedSlot.appointment.description && (
                        <>
                          <Divider style={{ margin: '16px 0' }} />
                          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                            {selectedSlot.appointment.type === 'consultation' ? 'Câu hỏi:' : 'Mô tả:'}
                          </Text>
                          <Text>{selectedSlot.appointment.description}</Text>
                        </>
                      )}

                      {selectedSlot.appointment.notes && (
                        <>
                          <Divider style={{ margin: '16px 0' }} />
                          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                            Ghi chú:
                          </Text>
                          <Text>{selectedSlot.appointment.notes}</Text>
                        </>
                      )}

                      {selectedSlot.appointment.address && (
                        <>
                          <Divider style={{ margin: '16px 0' }} />
                          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                            Địa chỉ:
                          </Text>
                          <Text>{selectedSlot.appointment.address}</Text>
                        </>
                      )}

                      {/* Meeting Info */}
                      {selectedSlot.appointment.type === 'consultation' && currentMeeting && (
                        <>
                          <Divider style={{ margin: '16px 0' }} />
                          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                            Thông tin Meeting:
                          </Text>
                          <div style={{ background: '#f0f8ff', padding: '12px', borderRadius: '6px' }}>
                            <div style={{ marginBottom: '8px' }}>
                              <Text strong>Provider: </Text>
                              <Tag color={currentMeeting.provider === 'google' ? 'blue' : 'orange'}>
                                {currentMeeting.provider === 'google' ? 'Google Meet' : 'Jitsi Meet'}
                              </Tag>
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                              <Text strong>Trạng thái: </Text>
                              <Tag color={currentMeeting.status === 'in_progress' ? 'green' : 'default'}>
                                {currentMeeting.status === 'in_progress' ? 'Đang diễn ra' : 'Đã lên lịch'}
                              </Tag>
                            </div>
                            <div>
                              <Text strong>Người tham gia: </Text>
                              <Text>{currentMeeting.participantCount}/{currentMeeting.maxParticipants}</Text>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorScheduleCalendar;