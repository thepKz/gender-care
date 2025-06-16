import React, { useState, useEffect } from 'react';
import {
  Card,
  Calendar,
  Badge,
  Button,
  Modal,
  Form,
  Select,
  TimePicker,
  Row,
  Col,
  Typography,
  List,
  Tag,
  Space,
  Statistic,
  Avatar,
  Input
} from 'antd';
import {
  PlusOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import doctorScheduleApi from '../../../api/endpoints/doctorSchedule';
import doctorApi from '../../../api/endpoints/doctor';

const { Title, Text } = Typography;
const { Option } = Select;

interface Schedule {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  shift: 'morning' | 'afternoon' | 'evening' | 'night';
  room?: string;
  notes?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
}

const DoctorSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const [scheduleResponse, doctorResponse] = await Promise.all([
        doctorScheduleApi.getAll(),
        doctorApi.getAll()
      ]);
      
      // Convert API response to component format
      const convertedSchedules = scheduleResponse.map((schedule: any) => ({
        id: schedule._id,
        doctorId: schedule.doctorId._id,
        doctorName: schedule.doctorId.userId.fullName,
        date: new Date(schedule.weekSchedule[0]?.dayOfWeek).toISOString().split('T')[0],
        startTime: schedule.weekSchedule[0]?.slots[0]?.slotTime.split('-')[0] || '08:00',
        endTime: schedule.weekSchedule[0]?.slots[0]?.slotTime.split('-')[1] || '09:00',
        status: 'scheduled' as const,
        shift: 'morning' as const,
        room: 'Phòng khám'
      }));
      
      const convertedDoctors = doctorResponse.map((doctor: any) => ({
        id: doctor._id,
        name: doctor.userId.fullName,
        specialty: doctor.specialization || 'Bác sĩ đa khoa',
        avatar: doctor.avatar
      }));
      
      setSchedules(convertedSchedules);
      setDoctors(convertedDoctors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'blue';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Đã lên lịch';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  // Get schedules for a specific date
  const getSchedulesForDate = (date: string) => {
    return schedules.filter(schedule => schedule.date === date);
  };

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const daySchedules = getSchedulesForDate(dateStr);
    
    if (daySchedules.length === 0) return null;

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {daySchedules.slice(0, 2).map((schedule, index) => (
          <li key={index}>
            <Badge 
              status={schedule.status === 'scheduled' ? 'processing' : 'success'} 
              text={schedule.startTime}
              style={{ fontSize: '10px' }} 
            />
          </li>
        ))}
        {daySchedules.length > 2 && (
          <li>
            <Badge status="default" text={`+${daySchedules.length - 2} more`} style={{ fontSize: '10px' }} />
          </li>
        )}
      </ul>
    );
  };

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    return info.originNode;
  };

  const handleAddSchedule = () => {
    setIsModalVisible(true);
  };

  const selectedDateSchedules = getSchedulesForDate(selectedDate.format('YYYY-MM-DD'));

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý lịch làm việc bác sĩ
        </Title>
        <Text type="secondary">
          Lên lịch và quản lý ca làm việc của các bác sĩ
        </Text>
      </div>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Ca làm hôm nay"
              value={getSchedulesForDate(dayjs().format('YYYY-MM-DD')).length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng ca trong tuần"
              value={schedules.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Bác sĩ hoạt động"
              value={new Set(schedules.map(s => s.doctorId)).size}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={schedules.filter(s => s.status === 'completed').length}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Calendar */}
        <Col xs={24} lg={16}>
          <Card 
            title="Lịch làm việc" 
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddSchedule}
              >
                Thêm ca làm
              </Button>
            }
          >
            <Calendar 
              cellRender={cellRender}
              onSelect={setSelectedDate}
              value={selectedDate}
            />
          </Card>
        </Col>

        {/* Schedule Details */}
        <Col xs={24} lg={8}>
          <Card title={`Lịch ngày ${selectedDate.format('DD/MM/YYYY')}`}>
            {selectedDateSchedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text type="secondary">Không có ca làm việc nào</Text>
              </div>
            ) : (
              <List
                dataSource={selectedDateSchedules}
                renderItem={(schedule) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Avatar 
                            src={doctors.find(d => d.id === schedule.doctorId)?.avatar}
                            size={32}
                            style={{ backgroundColor: '#667eea' }}
                          >
                            {schedule.doctorName.split(' ').pop()?.charAt(0)}
                          </Avatar>
                          <div>
                            <Text strong style={{ fontSize: '14px', display: 'block' }}>
                              {schedule.doctorName}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {doctors.find(d => d.id === schedule.doctorId)?.specialty}
                            </Text>
                          </div>
                        </div>
                        <Space>
                          <Button type="text" icon={<EditOutlined />} size="small" />
                          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                        </Space>
                      </div>
                      
                      <div style={{ marginLeft: '40px' }}>
                        <div style={{ marginBottom: '4px' }}>
                          <ClockCircleOutlined style={{ marginRight: '4px' }} />
                          <Text>{schedule.startTime} - {schedule.endTime}</Text>
                        </div>
                        
                        {schedule.room && (
                          <div style={{ marginBottom: '4px' }}>
                            <Text type="secondary">Phòng: {schedule.room}</Text>
                          </div>
                        )}
                        
                        <div style={{ marginBottom: '4px' }}>
                          <Tag color={getStatusColor(schedule.status)}>
                            {getStatusText(schedule.status)}
                          </Tag>
                        </div>
                        
                        {schedule.notes && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {schedule.notes}
                          </Text>
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Add Schedule Modal */}
      <Modal
        title="Thêm ca làm việc"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item label="Bác sĩ" name="doctorId">
                <Select placeholder="Chọn bác sĩ">
                  {doctors.map(doctor => (
                    <Option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Thời gian" name="timeRange">
                <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Ghi chú" name="notes">
            <Input.TextArea rows={3} placeholder="Nhập ghi chú..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorSchedule;
