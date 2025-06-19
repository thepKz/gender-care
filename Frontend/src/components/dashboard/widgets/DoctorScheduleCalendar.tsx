import React, { useState } from 'react';
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
  Divider
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
  PlayCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Types
interface TimeSlot {
  id: string;
  slotTime: string;
  status: 'Free' | 'Booked' | 'Absent';
  patientName?: string;
  patientPhone?: string;
  serviceName?: string;
  appointmentType?: 'online' | 'in-person';
  meetingLink?: string;
  notes?: string;
  consultationFee?: number;
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

// Define 8-hour working schedule
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

// Mock data generator
const generateMockSchedule = (startWeek: dayjs.Dayjs): WeekSchedule => {
  const schedule: DaySchedule[] = [];
  const weekEnd = startWeek.add(6, 'day');
  
  for (let i = 0; i < 7; i++) {
    const currentDay = startWeek.add(i, 'day');
    const daySchedule: DaySchedule = {
      date: currentDay.format('DD/MM'),
      dayName: currentDay.format('dddd'),
      fullDate: currentDay,
      slots: TIME_SLOTS.map((timeSlot, index) => {
        const slotId = `${currentDay.format('YYYY-MM-DD')}-${index}`;
        
        // Random assignment for demo
        const statuses: TimeSlot['status'][] = ['Free', 'Booked', 'Absent'];
        const randomStatus = statuses[Math.floor(Math.random() * 3)];
        
        let slot: TimeSlot = {
          id: slotId,
          slotTime: timeSlot,
          status: randomStatus
        };

        if (randomStatus === 'Booked') {
          const isOnline = Math.random() > 0.5;
          slot = {
            ...slot,
            patientName: `Bệnh nhân ${index + 1}${i + 1}`,
            patientPhone: `0${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 8) + 1}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`,
            serviceName: isOnline ? 'Tư vấn sức khỏe phụ nữ online' : 'Khám phụ khoa tổng quát',
            appointmentType: isOnline ? 'online' : 'in-person',
            meetingLink: isOnline ? `https://meet.google.com/abc-def-${Math.random().toString(36).substr(2, 3)}` : undefined,
            notes: Math.random() > 0.7 ? 'Bệnh nhân có triệu chứng đau bụng, cần tư vấn kỹ' : undefined,
            consultationFee: isOnline ? 200000 : 300000
          };
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

const DoctorScheduleCalendar: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState(dayjs().startOf('week'));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Generate schedule data based on selected week
  const scheduleData = generateMockSchedule(selectedWeek);

  const goToPreviousWeek = () => {
    setSelectedWeek(prev => prev.subtract(1, 'week'));
  };

  const goToNextWeek = () => {
    setSelectedWeek(prev => prev.add(1, 'week'));
  };

  const goToToday = () => {
    setSelectedWeek(dayjs().startOf('week'));
  };

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setIsModalVisible(true);
  };

  const getSlotColor = (slot: TimeSlot) => {
    switch (slot.status) {
      case 'Free':
        return '#52c41a';
      case 'Booked':
        return slot.appointmentType === 'online' ? '#1890ff' : '#fa8c16';
      case 'Absent':
        return '#8c8c8c';
      default:
        return '#f5f5f5';
    }
  };

  const getSlotIcon = (slot: TimeSlot) => {
    switch (slot.status) {
      case 'Free':
        return <CheckCircleOutlined />;
      case 'Booked':
        return slot.appointmentType === 'online' ? 
          <VideoCameraOutlined /> : <EnvironmentOutlined />;
      case 'Absent':
        return <CloseCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getSlotText = (slot: TimeSlot) => {
    switch (slot.status) {
      case 'Free':
        return 'Lịch trống';
      case 'Booked':
        return slot.appointmentType === 'online' ? 'Online' : 'Tại phòng';
      case 'Absent':
        return 'Vắng mặt';
      default:
        return 'N/A';
    }
  };

  const handleJoinMeeting = (meetingLink: string) => {
    window.open(meetingLink, '_blank');
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
            <Tag color="warning">
              <EnvironmentOutlined /> Khám tại phòng
            </Tag>
            <Tag color="default">
              <CloseCircleOutlined /> Vắng mặt
            </Tag>
            </Space>
        </Row>
      </Card>

      {/* Calendar Grid */}
      <Card style={{ borderRadius: '8px' }}>
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
                  return (
                    <Tooltip
                      key={slot.id}
                      title={
                        slot.status === 'Booked' 
                        ? `${slot.patientName} - ${slot.serviceName}`
                          : getSlotText(slot)
                      }
                    >
                      <div
                        onClick={() => handleSlotClick(slot)}
                        style={{
                        background: '#fff',
                        padding: '16px',
                          textAlign: 'center',
                          cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderLeft: `4px solid ${getSlotColor(slot)}`,
                          minHeight: '80px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        alignItems: 'center'
                        }}
                        onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fafafa';
                        e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                            <div style={{
                        color: getSlotColor(slot),
                        fontSize: '18px',
                        marginBottom: '8px'
                        }}>
                          {getSlotIcon(slot)}
                        </div>
                      <div style={{ 
                        fontSize: '12px',
                        fontWeight: '500',
                        color: getSlotColor(slot)
                      }}>
                          {getSlotText(slot)}
                        </div>
                        {slot.status === 'Booked' && (
                          <div style={{ 
                          fontSize: '10px', 
                          color: '#666',
                          marginTop: '4px',
                          textAlign: 'center'
                        }}>
                          {slot.patientName}
                          </div>
                        )}
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
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
          selectedSlot?.status === 'Booked' ? [
            <Button key="cancel" onClick={() => setIsModalVisible(false)}>
              Đóng
            </Button>,
            selectedSlot?.appointmentType === 'online' && selectedSlot.meetingLink && (
              <Button 
                key="join"
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={() => handleJoinMeeting(selectedSlot.meetingLink!)}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Tham gia Meet
              </Button>
            ),
            <Button 
              key="complete"
              type="primary"
              icon={<CheckCircleOutlined />}
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
            {selectedSlot.status === 'Free' && (
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

            {selectedSlot.status === 'Absent' && (
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

            {selectedSlot.status === 'Booked' && (
              <div>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card size="small" style={{ 
                      background: selectedSlot.appointmentType === 'online' ? '#e6f7ff' : '#fff7e6'
                    }}>
                      <Row align="middle" gutter={16}>
                        <Col flex="auto">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Avatar icon={<UserOutlined />} size={40} />
                        <div>
                              <Text strong style={{ fontSize: '16px' }}>
                                {selectedSlot.patientName}
                          </Text>
                              <div style={{ color: '#666', fontSize: '14px' }}>
                                <PhoneOutlined style={{ marginRight: '8px' }} />
                                {selectedSlot.patientPhone}
                        </div>
                      </div>
                          </div>
                        </Col>
                        <Col>
                          <Tag 
                            color={selectedSlot.appointmentType === 'online' ? 'blue' : 'orange'}
                            style={{ padding: '4px 12px' }}
                          >
                            {selectedSlot.appointmentType === 'online' ? 
                              <><VideoCameraOutlined /> Online</> : 
                              <><EnvironmentOutlined /> Tại phòng</>
                            }
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
                      <Text>{selectedSlot.serviceName}</Text>
                      
                      <Divider style={{ margin: '16px 0' }} />
                      
                      <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                        Phí tư vấn:
                      </Text>
                      <Text style={{ fontSize: '16px', color: '#52c41a', fontWeight: 'bold' }}>
                        {selectedSlot.consultationFee?.toLocaleString('vi-VN')} VNĐ
                      </Text>

                      {selectedSlot.notes && (
                        <>
                          <Divider style={{ margin: '16px 0' }} />
                          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                            Ghi chú:
                        </Text>
                          <Text>{selectedSlot.notes}</Text>
                        </>
                      )}

                      {selectedSlot.appointmentType === 'online' && selectedSlot.meetingLink && (
                        <>
                          <Divider style={{ margin: '16px 0' }} />
                          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                            Link tham gia:
                          </Text>
                          <Text code copyable={{ text: selectedSlot.meetingLink }}>
                          {selectedSlot.meetingLink}
                        </Text>
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