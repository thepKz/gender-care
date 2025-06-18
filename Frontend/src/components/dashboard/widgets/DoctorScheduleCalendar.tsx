import React, { useState, useMemo } from 'react';
import { 
  Card, 
  Button, 
  Modal, 
  Tag, 
  Typography, 
  Space, 
  Tooltip,
  Avatar,
  Divider,
  Row,
  Col,
  DatePicker,
  Select,
  Dropdown,
  MenuProps
} from 'antd';
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  UserOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  LeftOutlined,
  RightOutlined,
  MoreOutlined,
  SettingOutlined,
  PrinterOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/vi';

dayjs.extend(isoWeek);
dayjs.locale('vi');

const { Title, Text } = Typography;

// Types
interface TimeSlot {
  id: string;
  slotTime: string;
  status: 'Free' | 'Booked' | 'Absent';
  appointmentType?: 'clinic' | 'online';
  patientName?: string;
  patientPhone?: string;
  serviceName?: string;
  serviceType?: 'appointment' | 'consultation';
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

interface ScheduleData {
  doctorName: string;
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

// Generate mock data function
const generateMockScheduleData = (startDate: dayjs.Dayjs): ScheduleData => {
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const currentDay = startDate.add(i, 'day');
    weekDays.push({
      date: currentDay.format('DD/MM'),
      dayName: currentDay.format('dddd'),
      fullDate: currentDay,
      slots: generateDaySlots(i)
    });
  }

  return {
    doctorName: '',
    weekRange: `${startDate.format('DD/MM')} - ${startDate.add(6, 'day').format('DD/MM/YYYY')}`,
    schedule: weekDays
  };
};

const generateDaySlots = (dayIndex: number): TimeSlot[] => {
  return TIME_SLOTS.map((slot, index) => {
    const slotId = `${dayIndex}-${index}`;
    
    // Mock different scenarios for demo
    if (dayIndex === 0) { // Monday
      if (index === 1) return {
        id: slotId, slotTime: slot, status: 'Booked', appointmentType: 'clinic',
        patientName: 'Trần Văn An', patientPhone: '0912345678', serviceName: 'Khám sản khoa tổng quát',
        serviceType: 'appointment', notes: 'Khám thai định kỳ'
      };
      if (index === 2) return {
        id: slotId, slotTime: slot, status: 'Booked', appointmentType: 'online',
        patientName: 'Lê Thị Mai', patientPhone: '0987654321', serviceName: 'Tư vấn sức khỏe sinh sản',
        serviceType: 'consultation', meetingLink: 'https://meet.google.com/abc-def-ghi',
        consultationFee: 200000, notes: 'Tư vấn về kế hoạch hóa gia đình'
      };
    } else if (dayIndex === 1) { // Tuesday
      if (index === 4) return {
        id: slotId, slotTime: slot, status: 'Booked', appointmentType: 'clinic',
        patientName: 'Phạm Minh Đức', patientPhone: '0901234567', serviceName: 'Xét nghiệm STI',
        serviceType: 'appointment', notes: 'Xét nghiệm định kỳ'
      };
      if (index === 5) return {
        id: slotId, slotTime: slot, status: 'Booked', appointmentType: 'online',
        patientName: 'Nguyễn Thu Hà', patientPhone: '0976543210', serviceName: 'Tư vấn tâm lý sức khỏe',
        serviceType: 'consultation', meetingLink: 'https://meet.google.com/xyz-uvw-rst',
        consultationFee: 150000, notes: 'Tư vấn stress và lo âu'
      };
    } else if (dayIndex === 2) { // Wednesday
      if (index === 0) return {
        id: slotId, slotTime: slot, status: 'Booked', appointmentType: 'online',
        patientName: 'Hoàng Văn Long', patientPhone: '0965432109', serviceName: 'Tư vấn dinh dưỡng',
        serviceType: 'consultation', meetingLink: 'https://meet.google.com/def-ghi-jkl',
        consultationFee: 180000, notes: 'Tư vấn chế độ ăn cho bà bầu'
      };
      if (index === 7) return {
        id: slotId, slotTime: slot, status: 'Booked', appointmentType: 'clinic',
        patientName: 'Vũ Thị Lan', patientPhone: '0954321098', serviceName: 'Khám phụ khoa',
        serviceType: 'appointment', notes: 'Khám định kỳ'
      };
    } else if (dayIndex === 6) { // Sunday - Absent day
      return { id: slotId, slotTime: slot, status: 'Absent' };
    }

    // Random absent slots
    if (Math.random() < 0.08) {
      return { id: slotId, slotTime: slot, status: 'Absent' };
    }

    return { id: slotId, slotTime: slot, status: 'Free' };
  });
};

const DoctorScheduleCalendar: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState(dayjs().startOf('isoWeek'));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  // Generate schedule data based on selected week
  const scheduleData = useMemo(() => {
    return generateMockScheduleData(selectedWeek);
  }, [selectedWeek]);

  const goToPreviousWeek = () => {
    setSelectedWeek(prev => prev.subtract(1, 'week'));
  };

  const goToNextWeek = () => {
    setSelectedWeek(prev => prev.add(1, 'week'));
  };

  const goToToday = () => {
    setSelectedWeek(dayjs().startOf('isoWeek'));
  };

  const getSlotColor = (slot: TimeSlot) => {
    switch (slot.status) {
      case 'Free':
        return 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
      case 'Booked':
        return slot.appointmentType === 'online' 
          ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
          : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)';
      case 'Absent':
        return 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)';
      default:
        return '#f5f5f5';
    }
  };

  const getSlotIcon = (slot: TimeSlot) => {
    if (slot.status === 'Free') return <CheckCircleOutlined style={{ fontSize: '16px' }} />;
    if (slot.status === 'Absent') return <CloseCircleOutlined style={{ fontSize: '16px' }} />;
    if (slot.appointmentType === 'online') return <VideoCameraOutlined style={{ fontSize: '16px' }} />;
    return <EnvironmentOutlined style={{ fontSize: '16px' }} />;
  };

  const getSlotText = (slot: TimeSlot) => {
    if (slot.status === 'Free') return 'Lịch trống';
    if (slot.status === 'Absent') return 'Vắng mặt';
    if (slot.appointmentType === 'online') return 'Online';
    return 'Phòng khám';
  };

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setIsModalVisible(true);
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
      background: '#f0f2f5',
      minHeight: '100vh',
      padding: '0',
      margin: '-24px',
    }}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.3); }
            50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4); }
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%) skewX(-15deg); }
            100% { transform: translateX(200%) skewX(-15deg); }
          }
          
          .slot-card {
            animation: slideIn 0.3s ease-out;
          }
          
          .slot-card:hover {
            animation: glow 1.5s infinite ease-in-out;
          }
          
          .calendar-grid {
            animation: fadeInUp 0.6s ease-out;
          }
          
          @keyframes fadeInUp {
            from { 
              opacity: 0; 
              transform: translateY(30px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
        `}
      </style>
      {/* Modern Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px 32px',
        color: 'white',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <CalendarOutlined style={{ fontSize: '32px' }} />
              <div>
                <Title level={2} style={{ color: 'white', margin: 0 }}>
                  Lịch làm việc cá nhân
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                  Tuần {scheduleData.weekRange}
                </Text>
              </div>
            </div>
          </Col>
          <Col>
            <Space size="large">
              <div style={{ 
                background: 'rgba(255,255,255,0.15)',
                padding: '8px 16px',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)'
              }}>
                <Space>
                  <Tag style={{ 
                    margin: 0, 
                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                    border: 'none',
                    color: 'white'
                  }}>
                    <CheckCircleOutlined /> Trống
                  </Tag>
                  <Tag style={{ 
                    margin: 0, 
                    background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                    border: 'none',
                    color: 'white'
                  }}>
                    <EnvironmentOutlined /> Phòng
                  </Tag>
                  <Tag style={{ 
                    margin: 0, 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                    border: 'none',
                    color: 'white'
                  }}>
                    <VideoCameraOutlined /> Online
                  </Tag>
                  <Tag style={{ 
                    margin: 0, 
                    background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
                    border: 'none',
                    color: 'white'
                  }}>
                    <CloseCircleOutlined /> Vắng
                  </Tag>
                </Space>
              </div>
            </Space>
          </Col>
        </Row>

        {/* Navigation Controls */}
        <Row justify="space-between" align="middle" style={{ marginTop: '20px' }}>
          <Col>
            <Space size="middle">
              <Button 
                type="text" 
                icon={<LeftOutlined />}
                onClick={goToPreviousWeek}
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                Tuần trước
              </Button>
              <Button 
                type="text" 
                onClick={goToToday}
                style={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)'
                }}
              >
                Hôm nay
              </Button>
              <Button 
                type="text" 
                icon={<RightOutlined />}
                iconPosition="end"
                onClick={goToNextWeek}
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                Tuần sau
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <DatePicker.WeekPicker
                value={selectedWeek}
                onChange={(date) => date && setSelectedWeek(date.startOf('isoWeek'))}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none' }}
                placeholder="Chọn tuần"
              />
              <Dropdown menu={{ items: moreMenuItems }} placement="bottomRight">
                <Button 
                  type="text" 
                  icon={<MoreOutlined />}
                  style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
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
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: 'none',
            overflow: 'hidden'
          }}
        >
          <div style={{ overflowX: 'auto', minWidth: '800px' }}>
            {/* Enhanced Header */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '140px repeat(7, 1fr)', 
              gap: '2px',
              background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%)',
              padding: '2px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ 
                padding: '16px 12px', 
                background: 'white',
                borderRadius: '10px 0 0 10px',
                fontWeight: 'bold',
                textAlign: 'center',
                color: '#1890ff',
                fontSize: '14px'
              }}>
                <ClockCircleOutlined style={{ marginRight: '6px' }} />
                Ca làm việc
              </div>
              {scheduleData.schedule.map((day, index) => {
                const isToday = day.fullDate.isSame(dayjs(), 'day');
                return (
                  <div key={day.date} style={{ 
                    padding: '16px 12px', 
                    background: isToday ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' : 'white',
                    borderRadius: index === 6 ? '0 10px 10px 0' : '0',
                    textAlign: 'center',
                    color: isToday ? 'white' : '#1890ff'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>
                      {day.dayName}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: isToday ? 'rgba(255,255,255,0.8)' : '#666' 
                    }}>
                      {day.date}
                    </div>
                    {isToday && (
                      <div style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: 'white',
                        margin: '4px auto 0'
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
                gridTemplateColumns: '140px repeat(7, 1fr)', 
                gap: '8px',
                marginBottom: '8px'
              }}>
                {/* Enhanced Time Column */}
                <div style={{ 
                  padding: '20px 12px',
                  background: 'linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#595959',
                  border: '2px solid #e8e8e8',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  fontSize: '13px'
                }}>
                  <div>{timeSlot}</div>
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                    Ca {timeIndex + 1}
                  </div>
                </div>
                
                {/* Enhanced Day Columns */}
                {scheduleData.schedule.map(day => {
                  const slot = day.slots.find(s => s.slotTime === timeSlot);
                  if (!slot) return <div key={day.date} />;
                  
                  return (
                                          <Tooltip 
                        key={`${day.date}-${timeSlot}`}
                        title={
                          slot.status === 'Booked' 
                            ? `${getSlotText(slot)} - ${slot.serviceName}`
                            : getSlotText(slot)
                        }
                    >
                      <div
                        className="slot-card"
                        onClick={() => handleSlotClick(slot)}
                        style={{
                          padding: '16px 12px',
                          background: getSlotColor(slot),
                          color: 'white',
                          borderRadius: '12px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          border: slot.status === 'Booked' ? '2px solid rgba(255,255,255,0.3)' : 'none',
                          minHeight: '60px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontSize: '13px',
                          fontWeight: '500',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          animationDelay: `${timeIndex * 0.05}s`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.2)';
                          e.currentTarget.style.zIndex = '10';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                          e.currentTarget.style.zIndex = '1';
                        }}
                      >
                        {/* Background patterns */}
                        {slot.status === 'Booked' && (
                          <>
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              width: '24px',
                              height: '24px',
                              background: 'rgba(255,255,255,0.25)',
                              borderRadius: '0 12px 0 24px',
                            }} />
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              width: '12px',
                              height: '12px',
                              background: 'rgba(255,255,255,0.15)',
                              borderRadius: '0 12px 0 0',
                            }} />
                          </>
                        )}
                        
                        {slot.status === 'Free' && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                            animation: 'shimmer 3s infinite',
                            pointerEvents: 'none'
                          }} />
                        )}
                        
                                                 <div style={{ 
                           marginBottom: '6px',
                           animation: slot.status === 'Booked' ? 'pulse 2s infinite' : 'none'
                         }}>
                           {getSlotIcon(slot)}
                         </div>
                         <div style={{ fontWeight: '600' }}>{getSlotText(slot)}</div>
                         {slot.status === 'Booked' && (
                           <div style={{ 
                             fontSize: '10px', 
                             opacity: 0.8, 
                             marginTop: '4px',
                             fontWeight: '400',
                             background: 'rgba(255,255,255,0.2)',
                             padding: '2px 6px',
                             borderRadius: '8px'
                           }}>
                             {slot.appointmentType === 'online' ? '💻' : '🏥'}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
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
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Chi tiết lịch hẹn</div>
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
            selectedSlot?.appointmentType === 'online' && (
              <Button 
                key="join"
                type="primary" 
                icon={<VideoCameraOutlined />}
                onClick={() => window.open(selectedSlot.meetingLink, '_blank')}
                style={{
                  background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                  border: 'none'
                }}
              >
                Tham gia cuộc họp
              </Button>
            ),
            <Button 
              key="complete"
              type="primary"
              icon={<CheckCircleOutlined />}
              style={{ 
                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                border: 'none'
              }}
            >
              Hoàn thành
            </Button>
          ] : [
            <Button key="cancel" onClick={() => setIsModalVisible(false)}>
              Đóng
            </Button>
          ]
        }
        width={700}
        style={{ top: 20 }}
      >
        {selectedSlot && (
          <div style={{ padding: '16px 0' }}>
            {selectedSlot.status === 'Free' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'white',
                  fontSize: '32px'
                }}>
                  <CheckCircleOutlined />
                </div>
                <Title level={3} style={{ color: '#52c41a', margin: '0 0 8px 0' }}>
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
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #d9d9d9 0%, #f0f0f0 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: '#999',
                  fontSize: '32px'
                }}>
                  <ExclamationCircleOutlined />
                </div>
                <Title level={3} style={{ color: '#999', margin: '0 0 8px 0' }}>
                  Không có mặt
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Bạn đã đăng ký không có mặt trong thời gian này
                </Text>
              </div>
            )}

            {selectedSlot.status === 'Booked' && (
              <div>
                <Row gutter={[20, 20]}>
                  <Col span={24}>
                    <div style={{ 
                      background: selectedSlot.appointmentType === 'online' 
                        ? 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)'
                        : 'linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)',
                      padding: '20px',
                      borderRadius: '12px',
                      border: `2px solid ${selectedSlot.appointmentType === 'online' ? '#91d5ff' : '#ffd591'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: selectedSlot.appointmentType === 'online' ? '#1890ff' : '#fa8c16',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          marginRight: '12px'
                        }}>
                          {selectedSlot.appointmentType === 'online' ? 
                            <VideoCameraOutlined /> : <EnvironmentOutlined />
                          }
                        </div>
                        <Title level={4} style={{ margin: 0 }}>
                          {selectedSlot.appointmentType === 'online' ? 'Tư vấn trực tuyến' : 'Khám tại phòng'}
                        </Title>
                      </div>
                      <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {selectedSlot.serviceName}
                      </Text>
                    </div>
                  </Col>

                  <Col span={12}>
                    <div style={{ 
                      background: '#fafafa', 
                      padding: '16px', 
                      borderRadius: '12px',
                      height: '100%'
                    }}>
                      <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
                        Thông tin bệnh nhân
                      </Text>
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Avatar icon={<UserOutlined />} size={32} />
                          <Text style={{ fontSize: '15px', fontWeight: '500' }}>
                            {selectedSlot.patientName}
                          </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <PhoneOutlined style={{ color: '#1890ff' }} />
                          <Text>{selectedSlot.patientPhone}</Text>
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col span={12}>
                    <div style={{ 
                      background: '#fafafa', 
                      padding: '16px', 
                      borderRadius: '12px',
                      height: '100%'
                    }}>
                      <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
                        Chi tiết thời gian
                      </Text>
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <ClockCircleOutlined style={{ color: '#1890ff' }} />
                          <Text style={{ fontSize: '15px', fontWeight: '500' }}>
                            {selectedSlot.slotTime}
                          </Text>
                        </div>
                        {selectedSlot.consultationFee && (
                          <div style={{ 
                            background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #b7eb8f'
                          }}>
                            <Text strong style={{ color: '#52c41a' }}>
                              Phí tư vấn: {selectedSlot.consultationFee.toLocaleString('vi-VN')} VNĐ
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>

                  {selectedSlot.notes && (
                    <Col span={24}>
                      <Divider style={{ margin: '16px 0' }} />
                      <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
                        Ghi chú từ bệnh nhân:
                      </Text>
                      <div style={{ 
                        background: '#f9f9f9', 
                        padding: '16px', 
                        borderRadius: '12px',
                        marginTop: '8px',
                        border: '1px solid #e8e8e8'
                      }}>
                        <Text style={{ fontSize: '14px', lineHeight: 1.6 }}>
                          {selectedSlot.notes}
                        </Text>
                      </div>
                    </Col>
                  )}

                  {selectedSlot.meetingLink && (
                    <Col span={24}>
                      <Divider style={{ margin: '16px 0' }} />
                      <div style={{ 
                        background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', 
                        padding: '16px', 
                        borderRadius: '12px',
                        border: '1px solid #91d5ff'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <VideoCameraOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                          <Text strong style={{ color: '#1890ff' }}>
                            Link tham gia cuộc họp:
                          </Text>
                        </div>
                        <Text 
                          code 
                          copyable 
                          style={{ 
                            fontSize: '13px',
                            background: 'rgba(255,255,255,0.8)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            display: 'block'
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