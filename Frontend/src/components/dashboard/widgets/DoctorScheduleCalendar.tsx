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
  Divider,
  DatePicker,
  Select,
  Dropdown,
  MenuProps,
  Badge
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
  MoreOutlined,
  SettingOutlined,
  PrinterOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  LinkOutlined
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
  const [selectedWeek, setSelectedWeek] = useState(dayjs().startOf('week' as any));
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
    setSelectedWeek(dayjs().startOf('week' as any));
  };

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setIsModalVisible(true);
  };

  const getSlotColor = (slot: TimeSlot) => {
    switch (slot.status) {
      case 'Free':
        return 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)';
      case 'Booked':
        return slot.appointmentType === 'online' 
          ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'
          : 'linear-gradient(135deg, #fa8c16 0%, #ffc53d 100%)';
      case 'Absent':
        return 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)';
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

  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt lịch',
    },
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: 'In lịch làm việc',
    },
    {
      key: 'export',
      icon: <DownloadOutlined />,
      label: 'Xuất Excel',
    },
  ];

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      padding: '0',
      margin: '-24px',
    }}>
      <style>
        {`
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes glow {
            0%, 100% { box-shadow: 0 4px 15px rgba(24, 144, 255, 0.2); }
            50% { box-shadow: 0 8px 25px rgba(24, 144, 255, 0.4), 0 0 30px rgba(24, 144, 255, 0.3); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          .slot-card {
            animation: slideIn 0.4s ease-out;
            position: relative;
            overflow: hidden;
          }
          
          .slot-card:hover {
            animation: glow 2s infinite ease-in-out;
          }
          
          .slot-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
          }
          
          .slot-card:hover::before {
            left: 100%;
          }
          
          .calendar-grid {
            animation: slideIn 0.6s ease-out;
          }
          
          .meet-button {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            border: none;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
            transition: all 0.3s ease;
          }
          
          .meet-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
            background: linear-gradient(135deg, #45a049 0%, #4CAF50 100%);
          }
        `}
      </style>

      {/* Header với gradient đẹp */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '32px',
        color: 'white',
        borderRadius: '0 0 30px 30px',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          filter: 'blur(100px)'
        }} />
        
        <Row justify="space-between" align="middle">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <CalendarOutlined style={{ fontSize: '28px' }} />
              </div>
              <div>
                <Title level={1} style={{ color: 'white', margin: 0, fontSize: '32px' }}>
                  Lịch làm việc cá nhân
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px' }}>
                  Tuần {scheduleData.weekRange}
                </Text>
              </div>
            </div>
          </Col>
          <Col>
            <div style={{ 
              background: 'rgba(255,255,255,0.15)',
              padding: '12px 20px',
              borderRadius: '25px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <Space size="middle">
                <Tag style={{ 
                  margin: 0, 
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  border: 'none',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '15px'
                }}>
                  <CheckCircleOutlined /> Trống
                </Tag>
                <Tag style={{ 
                  margin: 0, 
                  background: 'linear-gradient(135deg, #fa8c16 0%, #ffc53d 100%)',
                  border: 'none',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '15px'
                }}>
                  <EnvironmentOutlined /> Tại phòng
                </Tag>
                <Tag style={{ 
                  margin: 0, 
                  background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                  border: 'none',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '15px'
                }}>
                  <VideoCameraOutlined /> Online
                </Tag>
                <Tag style={{ 
                  margin: 0, 
                  background: 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)',
                  border: 'none',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '15px'
                }}>
                  <CloseCircleOutlined /> Vắng
                </Tag>
              </Space>
            </div>
          </Col>
        </Row>

        {/* Navigation Controls */}
        <Row justify="space-between" align="middle" style={{ marginTop: '24px' }}>
          <Col>
            <Space size="middle">
              <Button 
                type="text" 
                icon={<LeftOutlined />}
                onClick={goToPreviousWeek}
                style={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '0 20px',
                  height: '40px'
                }}
              >
                Tuần trước
              </Button>
              <Button 
                type="text" 
                onClick={goToToday}
                style={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  padding: '0 20px',
                  height: '40px',
                  fontWeight: 'bold'
                }}
              >
                Hôm nay
              </Button>
              <Button 
                type="text" 
                icon={<RightOutlined />}
                iconPosition="end"
                onClick={goToNextWeek}
                style={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '0 20px',
                  height: '40px'
                }}
              >
                Tuần sau
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <DatePicker.WeekPicker
                value={selectedWeek}
                onChange={(date) => date && setSelectedWeek(date.startOf('week' as any))}
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '20px',
                  height: '40px'
                }}
                placeholder="Chọn tuần"
              />
              <Dropdown menu={{ items: moreMenuItems }} placement="bottomRight">
                <Button 
                  type="text" 
                  icon={<MoreOutlined />}
                  style={{ 
                    color: 'white', 
                    borderColor: 'rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    width: '40px',
                    height: '40px'
                  }}
                />
              </Dropdown>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Calendar Grid */}
      <div style={{ padding: '32px' }}>
        <Card
          className="calendar-grid"
          style={{
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            border: 'none',
            overflow: 'hidden',
            background: 'white'
          }}
        >
          <div style={{ overflowX: 'auto', minWidth: '900px' }}>
            {/* Enhanced Header */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '160px repeat(7, 1fr)', 
              gap: '3px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '3px',
              borderRadius: '15px',
              marginBottom: '20px'
            }}>
              <div style={{ 
                padding: '20px 16px', 
                background: 'white',
                borderRadius: '12px 0 0 12px',
                fontWeight: 'bold',
                textAlign: 'center',
                color: '#667eea',
                fontSize: '16px'
              }}>
                <ClockCircleOutlined style={{ marginRight: '8px', fontSize: '18px' }} />
                Ca làm việc
              </div>
              {scheduleData.schedule.map((day, index) => {
                const isToday = day.fullDate.isSame(dayjs(), 'day');
                return (
                  <div key={day.date} style={{ 
                    padding: '20px 16px', 
                    background: isToday 
                      ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' 
                      : 'white',
                    borderRadius: index === 6 ? '0 12px 12px 0' : '0',
                    textAlign: 'center',
                    color: isToday ? 'white' : '#667eea',
                    position: 'relative'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                      {day.dayName}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: isToday ? 'rgba(255,255,255,0.8)' : '#999' 
                    }}>
                      {day.date}
                    </div>
                    {isToday && (
                      <div style={{ 
                        position: 'absolute',
                        top: '50%',
                        right: '10px',
                        transform: 'translateY(-50%)',
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: 'white',
                        animation: 'pulse 2s infinite'
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Enhanced Schedule Grid */}
            {TIME_SLOTS.map((timeSlot, timeIndex) => (
              <div key={timeSlot} style={{ 
                display: 'grid', 
                gridTemplateColumns: '160px repeat(7, 1fr)', 
                gap: '10px',
                marginBottom: '10px'
              }}>
                {/* Enhanced Time Column */}
                <div style={{ 
                  padding: '24px 16px',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '15px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#495057',
                  border: '2px solid #dee2e6',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  fontSize: '14px',
                  position: 'relative'
                }}>
                  <div style={{ fontSize: '16px', marginBottom: '4px' }}>{timeSlot}</div>
                  <Badge 
                    count={`Ca ${timeIndex + 1}`} 
                    style={{ 
                      background: '#667eea',
                      color: 'white',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }} 
                  />
                </div>
                
                {/* Enhanced Day Columns */}
                {scheduleData.schedule.map(day => {
                  const slot = day.slots.find(s => s.slotTime === timeSlot);
                  if (!slot) return <div key={day.date} />;

                  return (
                    <Tooltip
                      key={slot.id}
                      title={
                        slot.status === 'Booked' 
                          ? `${slot.serviceName} - ${slot.patientName}`
                          : getSlotText(slot)
                      }
                    >
                      <div
                        className="slot-card"
                        onClick={() => handleSlotClick(slot)}
                        style={{
                          padding: '20px 16px',
                          background: getSlotColor(slot),
                          color: 'white',
                          borderRadius: '15px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          border: slot.status === 'Booked' ? '3px solid rgba(255,255,255,0.3)' : 'none',
                          minHeight: '80px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontSize: '14px',
                          fontWeight: '600',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                          animationDelay: `${timeIndex * 0.05}s`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px) scale(1.03)';
                          e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.2)';
                          e.currentTarget.style.zIndex = '10';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                          e.currentTarget.style.zIndex = '1';
                        }}
                      >
                        {/* Decorative elements */}
                        {slot.status === 'Booked' && (
                          <>
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              width: '30px',
                              height: '30px',
                              background: 'rgba(255,255,255,0.2)',
                              borderRadius: '0 15px 0 30px',
                            }} />
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              width: '15px',
                              height: '15px',
                              background: 'rgba(255,255,255,0.15)',
                              borderRadius: '0 15px 0 0',
                            }} />
                          </>
                        )}
                        
                        <div style={{ 
                          marginBottom: '8px',
                          fontSize: '20px'
                        }}>
                          {getSlotIcon(slot)}
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          {getSlotText(slot)}
                        </div>
                        {slot.status === 'Booked' && (
                          <div style={{ 
                            fontSize: '11px', 
                            opacity: 0.9, 
                            marginTop: '6px',
                            background: 'rgba(255,255,255,0.25)',
                            padding: '4px 8px',
                            borderRadius: '10px',
                            fontWeight: '500'
                          }}>
                            {slot.appointmentType === 'online' ? '💻 Online' : '🏥 Phòng khám'}
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
      </div>

      {/* Enhanced Detail Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: selectedSlot ? getSlotColor(selectedSlot) : '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px'
            }}>
              {selectedSlot && getSlotIcon(selectedSlot)}
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Chi tiết lịch hẹn</div>
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
                className="meet-button"
                style={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  height: '40px',
                  fontWeight: 'bold'
                }}
              >
                Tham gia Google Meet
              </Button>
            ),
            <Button 
              key="complete"
              type="primary"
              icon={<CheckCircleOutlined />}
              style={{ 
                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                border: 'none',
                borderRadius: '8px',
                height: '40px'
              }}
            >
              Hoàn thành khám
            </Button>
          ] : [
            <Button key="cancel" onClick={() => setIsModalVisible(false)}>
              Đóng
            </Button>
          ]
        }
        width={800}
        style={{ top: 20 }}
        styles={{
          header: {
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '10px 10px 0 0'
          }
        }}
      >
        {selectedSlot && (
          <div style={{ padding: '20px 0' }}>
            {selectedSlot.status === 'Free' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: 'white',
                  fontSize: '40px',
                  boxShadow: '0 10px 30px rgba(82, 196, 26, 0.3)'
                }}>
                  <CheckCircleOutlined />
                </div>
                <Title level={2} style={{ color: '#52c41a', margin: '0 0 12px 0' }}>
                  Lịch trống
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Bạn có thể sử dụng thời gian này để nghỉ ngơi hoặc làm việc khác
                </Text>
              </div>
            )}

            {selectedSlot.status === 'Absent' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: 'white',
                  fontSize: '40px',
                  boxShadow: '0 10px 30px rgba(140, 140, 140, 0.3)'
                }}>
                  <ExclamationCircleOutlined />
                </div>
                <Title level={2} style={{ color: '#8c8c8c', margin: '0 0 12px 0' }}>
                  Không có mặt
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Bạn đã đăng ký không có mặt trong thời gian này
                </Text>
              </div>
            )}

            {selectedSlot.status === 'Booked' && (
              <div>
                <Row gutter={[24, 24]}>
                  <Col span={24}>
                    <div style={{ 
                      background: selectedSlot.appointmentType === 'online' 
                        ? 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)'
                        : 'linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)',
                      padding: '24px',
                      borderRadius: '16px',
                      border: `3px solid ${selectedSlot.appointmentType === 'online' ? '#40a9ff' : '#ffc53d'}`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Background decoration */}
                      <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.3)',
                        filter: 'blur(20px)'
                      }} />
                      
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: selectedSlot.appointmentType === 'online' ? '#1890ff' : '#fa8c16',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          marginRight: '16px',
                          fontSize: '20px',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                        }}>
                          {selectedSlot.appointmentType === 'online' ? 
                            <VideoCameraOutlined /> : <EnvironmentOutlined />
                          }
                        </div>
                        <div>
                          <Title level={3} style={{ margin: 0, color: '#1f2937' }}>
                            {selectedSlot.appointmentType === 'online' ? 'Tư vấn trực tuyến' : 'Khám tại phòng'}
                          </Title>
                          <Text style={{ fontSize: '16px', color: '#6b7280' }}>
                            {selectedSlot.serviceName}
                          </Text>
                        </div>
                      </div>

                      {/* Special Google Meet button for online appointments */}
                      {selectedSlot.appointmentType === 'online' && selectedSlot.meetingLink && (
                        <div style={{ 
                          background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                          padding: '16px',
                          borderRadius: '12px',
                          marginBottom: '16px',
                          textAlign: 'center'
                        }}>
                          <Button 
                            type="primary"
                            size="large"
                            icon={<PlayCircleOutlined />}
                            onClick={() => handleJoinMeeting(selectedSlot.meetingLink!)}
                            style={{
                              background: 'white',
                              color: '#4CAF50',
                              border: 'none',
                              fontWeight: 'bold',
                              height: '50px',
                              fontSize: '16px',
                              borderRadius: '25px',
                              minWidth: '200px',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                            }}
                          >
                            Tham gia Google Meet
                          </Button>
                          <div style={{ marginTop: '8px' }}>
                            <Text style={{ color: 'white', fontSize: '13px' }}>
                              <LinkOutlined /> Sẵn sàng cho cuộc gọi video
                            </Text>
                          </div>
                        </div>
                      )}
                    </div>
                  </Col>

                  <Col span={12}>
                    <div style={{ 
                      background: '#f8f9fa', 
                      padding: '20px', 
                      borderRadius: '16px',
                      height: '100%',
                      border: '2px solid #e9ecef'
                    }}>
                      <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                        Thông tin bệnh nhân
                      </Text>
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <Avatar icon={<UserOutlined />} size={40} style={{ background: '#1890ff' }} />
                          <Text style={{ fontSize: '16px', fontWeight: '600' }}>
                            {selectedSlot.patientName}
                          </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <PhoneOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                          <Text style={{ fontSize: '14px' }}>{selectedSlot.patientPhone}</Text>
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col span={12}>
                    <div style={{ 
                      background: '#f8f9fa', 
                      padding: '20px', 
                      borderRadius: '16px',
                      height: '100%',
                      border: '2px solid #e9ecef'
                    }}>
                      <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                        Chi tiết thời gian
                      </Text>
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <ClockCircleOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                          <Text style={{ fontSize: '16px', fontWeight: '600' }}>
                            {selectedSlot.slotTime}
                          </Text>
                        </div>
                        {selectedSlot.consultationFee && (
                          <div style={{ 
                            background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '2px solid #b7eb8f'
                          }}>
                            <Text strong style={{ color: '#52c41a', fontSize: '15px' }}>
                              Phí tư vấn: {selectedSlot.consultationFee.toLocaleString('vi-VN')} VNĐ
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>

                  {selectedSlot.notes && (
                    <Col span={24}>
                      <Divider style={{ margin: '20px 0' }} />
                      <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                        Ghi chú từ bệnh nhân:
                      </Text>
                      <div style={{ 
                        background: '#f9f9f9', 
                        padding: '20px', 
                        borderRadius: '16px',
                        marginTop: '12px',
                        border: '2px solid #e8e8e8'
                      }}>
                        <Text style={{ fontSize: '15px', lineHeight: 1.8 }}>
                          {selectedSlot.notes}
                        </Text>
                      </div>
                    </Col>
                  )}

                  {selectedSlot.meetingLink && (
                    <Col span={24}>
                      <Divider style={{ margin: '20px 0' }} />
                      <div style={{ 
                        background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', 
                        padding: '20px', 
                        borderRadius: '16px',
                        border: '2px solid #40a9ff'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <VideoCameraOutlined style={{ color: '#1890ff', marginRight: '12px', fontSize: '18px' }} />
                          <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                            Link tham gia cuộc họp:
                          </Text>
                        </div>
                        <Text 
                          code 
                          copyable 
                          style={{ 
                            fontSize: '14px',
                            background: 'rgba(255,255,255,0.9)',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            display: 'block',
                            border: '1px solid #d9d9d9'
                          }}
                        >
                          {selectedSlot.meetingLink}
                        </Text>
                      </div>
                    </Col>
                  )}
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