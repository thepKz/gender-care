import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Select, 
  DatePicker, 
  Tag, 
  Space,
  Row,
  Col,
  Statistic,
  Avatar,
  Timeline,
  Alert
} from 'antd';
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BookOutlined,
  BellOutlined
} from '@ant-design/icons';
import { MOCK_DOCTORS, MOCK_DOCTOR_SCHEDULES, type DoctorProfile } from '../../../share/doctorMockData';
import dayjs, { Dayjs } from 'dayjs';

const { Option } = Select;

interface ScheduleSlot {
  id: string;
  time: string;
  status: 'Free' | 'Booked' | 'Absent';
  patientName?: string;
}

interface DaySchedule {
  date: string;
  doctorId: string;
  slots: ScheduleSlot[];
}

const DoctorMySchedulePage: React.FC = () => {
  // Giả sử doctor hiện tại đăng nhập
  const currentDoctorId = MOCK_DOCTORS[0].id; // Mock current doctor
  const currentDoctor = MOCK_DOCTORS[0];
  
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'date'>('today');

  // Load mock data - chỉ lịch của doctor hiện tại
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      // Convert MOCK_DOCTOR_SCHEDULES to DaySchedule format
      const mySchedules: DaySchedule[] = [];
      const doctorSchedule = MOCK_DOCTOR_SCHEDULES.find(s => s.doctorId === currentDoctorId);
      
      if (doctorSchedule) {
        doctorSchedule.weekSchedule.forEach(weekDay => {
          mySchedules.push({
            date: dayjs(weekDay.dayOfWeek).format('YYYY-MM-DD'),
            doctorId: currentDoctorId,
            slots: weekDay.slots.map(slot => ({
              id: slot._id,
              time: slot.slotTime,
              status: slot.status,
              patientName: slot.status === 'Booked' ? 'Bệnh nhân ABC' : undefined
            }))
          });
        });
      }
      
      setSchedules(mySchedules);
      setLoading(false);
    }, 500);
  }, [currentDoctorId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Free': return 'green';
      case 'Booked': return 'blue';
      case 'Absent': return 'red';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Free': return 'Trống';
      case 'Booked': return 'Có bệnh nhân';
      case 'Absent': return 'Nghỉ';
      default: return status;
    }
  };

  // Lấy lịch theo chế độ xem
  const getFilteredSchedules = () => {
    if (viewMode === 'today') {
      return schedules.filter(s => s.date === dayjs().format('YYYY-MM-DD'));
    } else if (viewMode === 'week') {
      const startOfWeek = dayjs().startOf('week');
      const endOfWeek = dayjs().endOf('week');
      return schedules.filter(s => {
        const scheduleDate = dayjs(s.date);
        return scheduleDate.isAfter(startOfWeek) && scheduleDate.isBefore(endOfWeek);
      });
    } else {
      return schedules.filter(s => s.date === selectedDate.format('YYYY-MM-DD'));
    }
  };

  const filteredSchedules = getFilteredSchedules();

  // Thống kê
  const todaySchedule = schedules.find(s => s.date === dayjs().format('YYYY-MM-DD'));
  const todayStats = todaySchedule ? {
    total: todaySchedule.slots.length,
    booked: todaySchedule.slots.filter(s => s.status === 'Booked').length,
    free: todaySchedule.slots.filter(s => s.status === 'Free').length,
    absent: todaySchedule.slots.filter(s => s.status === 'Absent').length,
  } : { total: 0, booked: 0, free: 0, absent: 0 };

  // Lịch hôm nay dạng timeline
  const getTodayTimeline = () => {
    if (!todaySchedule) return [];
    
    return todaySchedule.slots.map(slot => ({
      color: getStatusColor(slot.status),
      children: (
        <div>
          <Space>
            <strong>{slot.time}</strong>
            <Tag color={getStatusColor(slot.status)}>
              {getStatusText(slot.status)}
            </Tag>
          </Space>
          {slot.patientName && (
            <div style={{ marginTop: '4px', color: '#666' }}>
              <UserOutlined /> Bệnh nhân: {slot.patientName}
            </div>
          )}
        </div>
      )
    }));
  };

  const tableColumns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{dayjs(date).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{dayjs(date).format('dddd')}</div>
        </div>
      ),
    },
    {
      title: 'Thống kê',
      key: 'stats',
      render: (record: DaySchedule) => (
        <Space>
          <Tag color="blue">
            <BookOutlined /> {record.slots.filter(s => s.status === 'Booked').length} BN
          </Tag>
          <Tag color="green">
            <CheckCircleOutlined /> {record.slots.filter(s => s.status === 'Free').length} Trống
          </Tag>
          {record.slots.filter(s => s.status === 'Absent').length > 0 && (
            <Tag color="red">
              <CloseCircleOutlined /> {record.slots.filter(s => s.status === 'Absent').length} Nghỉ
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Lịch trình',
      key: 'schedule',
      render: (record: DaySchedule) => (
        <Space wrap>
          {record.slots.map(slot => (
            <Tag
              key={slot.id}
              color={getStatusColor(slot.status)}
              style={{ marginBottom: '4px' }}
            >
              {slot.time}
              {slot.patientName && (
                <span style={{ marginLeft: '4px' }}>
                  - {slot.patientName}
                </span>
              )}
            </Tag>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Doctor Info */}
      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle">
          <Col>
            <Space size="large">
              <Avatar size={64} src={currentDoctor.userId.avatar} icon={<UserOutlined />} />
              <div>
                <h2 style={{ margin: 0 }}>{currentDoctor.userId.fullName}</h2>
                <p style={{ margin: 0, color: '#666' }}>
                  {currentDoctor.specialization} • {currentDoctor.experience} năm kinh nghiệm
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                  Đánh giá: {currentDoctor.rating}⭐ • Email: {currentDoctor.userId.email}
                </p>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Today */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Tổng slots hôm nay" 
              value={todayStats.total}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Bệnh nhân hôm nay" 
              value={todayStats.booked}
              valueStyle={{ color: '#1890ff' }}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Slots trống" 
              value={todayStats.free}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Hiệu suất" 
              value={todayStats.total ? Math.round((todayStats.booked / todayStats.total) * 100) : 0}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* Schedule Table */}
        <Col span={16}>
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Space>
                <Select
                  value={viewMode}
                  onChange={setViewMode}
                  style={{ width: '150px' }}
                >
                  <Option value="today">Hôm nay</Option>
                  <Option value="week">Tuần này</Option>
                  <Option value="date">Chọn ngày</Option>
                </Select>
                
                {viewMode === 'date' && (
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => date && setSelectedDate(date)}
                    format="DD/MM/YYYY"
                  />
                )}
              </Space>
            </div>

            {filteredSchedules.length === 0 ? (
              <Alert
                message="Không có lịch làm việc"
                description="Bạn không có lịch làm việc trong thời gian này."
                type="info"
                showIcon
                icon={<CalendarOutlined />}
              />
            ) : (
              <Table
                columns={tableColumns}
                dataSource={filteredSchedules}
                rowKey={(record) => record.date}
                loading={loading}
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Col>

        {/* Today Timeline */}
        <Col span={8}>
          <Card title={
            <Space>
              <BellOutlined />
              Lịch trình hôm nay
              <Tag color="blue">{dayjs().format('DD/MM')}</Tag>
            </Space>
          }>
            {todaySchedule ? (
              <Timeline
                items={getTodayTimeline()}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#999' }}>
                <CalendarOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
                <div>Bạn không có lịch làm việc hôm nay</div>
              </div>
            )}
          </Card>

          {/* Upcoming appointments */}
          {todayStats.booked > 0 && (
            <Card 
              title="Bệnh nhân hôm nay" 
              style={{ marginTop: '16px' }}
              size="small"
            >
              {todaySchedule?.slots
                .filter(s => s.status === 'Booked' && s.patientName)
                .map(slot => (
                  <div key={slot.id} style={{ 
                    padding: '8px 0', 
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{slot.patientName}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{slot.time}</div>
                    </div>
                    <Tag color="blue">Đã đặt</Tag>
                  </div>
                ))}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default DoctorMySchedulePage; 