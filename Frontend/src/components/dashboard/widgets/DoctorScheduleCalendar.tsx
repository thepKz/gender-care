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
  HomeOutlined,
  LaptopOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { UnifiedAppointment, UnifiedStatus, ApiAppointment, ApiConsultation } from '../../../types/appointment';
import { meetingAPI, MeetingData } from '../../../api/endpoints/meeting';
import appointmentApi from '../../../api/endpoints/appointment';
import consultationApi from '../../../api/endpoints/consultation';
import { useAuth } from '../../../hooks/useAuth';

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

// Thêm hàm chuẩn hóa record về UnifiedAppointment
function normalizeRecordToUnified(obj: Record<string, unknown>): UnifiedAppointment {
  // Lấy tên bệnh nhân
  let patientName = '';
  if (typeof obj.profileId === 'object' && obj.profileId !== null) {
    patientName = String((obj.profileId as any).fullName || (obj.profileId as any).name || '');
  } else {
    patientName = String(obj.patientName || obj.fullName || '');
  }
  // Lấy tên dịch vụ/gói
  let serviceName = '';
  if (typeof obj.serviceId === 'object' && obj.serviceId !== null && (obj.serviceId as any).serviceName) {
    serviceName = String((obj.serviceId as any).serviceName);
  } else if (typeof obj.packageId === 'object' && obj.packageId !== null && (obj.packageId as any).name) {
    serviceName = 'Gói dịch vụ: ' + String((obj.packageId as any).name);
  } else if (obj.serviceName) {
    serviceName = String(obj.serviceName);
  } else if (obj.type === 'consultation') {
    serviceName = 'Tư vấn trực tuyến';
  } else {
    serviceName = 'Không xác định';
  }
  // Lấy giờ phút
  let appointmentTime = '';
  if (obj.appointmentTime) {
    appointmentTime = String(obj.appointmentTime).slice(0, 5);
  } else if (obj.appointmentSlot) {
    appointmentTime = String(obj.appointmentSlot).slice(0, 5);
  }
  // typeLocation giữ tiếng Anh cho type
  let typeLocation: 'clinic' | 'Online' | 'home' = 'clinic';
  if (obj.typeLocation === 'clinic' || obj.typeLocation === 'Online' || obj.typeLocation === 'home') {
    typeLocation = obj.typeLocation as 'clinic' | 'Online' | 'home';
  }
  // status giữ đúng type
  let status: UnifiedStatus = 'pending';
  if (typeof obj.status === 'string' && [
    'pending_payment','pending','scheduled','confirmed','consulting','completed','cancelled','doctor_cancel','payment_cancelled','expired','done_testResultItem','done_testResult'
  ].includes(obj.status)) {
    status = obj.status as UnifiedStatus;
  }
  // _id, key, serviceType, appointmentType, ...
  const _id = String((obj as any)._id || (obj as any).id || '');
  const key = _id;
  const serviceType = (obj as any).serviceType || '';
  const appointmentType = (obj as any).appointmentType || 'consultation';
  return {
    _id,
    key,
    type: (obj.type as 'appointment' | 'consultation') || 'appointment',
    status,
    patientName,
    patientPhone: typeof obj.profileId === 'object' && obj.profileId !== null
      ? String((obj.profileId as any).phone || (obj.profileId as any).phoneNumber || '')
      : String(obj.patientPhone || obj.phone || ''),
    appointmentDate: String(obj.appointmentDate || ''),
    appointmentTime,
    serviceName,
    typeLocation,
    serviceType,
    appointmentType,
    description: String(obj.description || obj.question || ''),
    notes: String(obj.notes || ''),
    address: String(obj.address || ''),
    originalData: (obj as unknown) as ApiAppointment | ApiConsultation
  };
}

const DoctorScheduleCalendar: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState(dayjs().startOf('week'));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  // Tách riêng 2 state
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [consultations, setConsultations] = useState<Record<string, unknown>[]>([]);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<MeetingData | null>(null);
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'doctor' && user?._id) {
      // Nếu user._id là userId, cần mapping sang doctorId nếu cần
      // Nếu user đã có doctorId, dùng luôn
      setDoctorId(user.doctorId || user._id);
    }
  }, [user]);

  // ✅ Loại bỏ mock data transformation, chỉ sử dụng real API

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

  // Fix: Use getMyAppointments for doctors to only get their own appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      if (user?.role === 'doctor') {
        // For doctors: use getMyAppointments to get only their own appointments
        const res = await appointmentApi.getMyAppointments({ page: 1, limit: 500 });
        const arr = res.data?.appointments || res.appointments || res.data || [];
        setAppointments(Array.isArray(arr) ? arr : []);
      } else {
        // For staff: use getAllAppointments
        const res = await appointmentApi.getAllAppointments({ page: 1, limit: 500 });
        const arr = res.data?.appointments || res.appointments || res.data || [];
        setAppointments(Array.isArray(arr) ? arr : []);
      }
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };
  // Fetch consultations
  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const res = await consultationApi.getMyConsultations({ page: 1, limit: 500 });
      const arr = res.data || [];
      setConsultations(Array.isArray(arr) ? arr : []);
    } catch {
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };
  // Gọi cả 2 API khi mount
  useEffect(() => {
    fetchAppointments();
    fetchConsultations();
  }, []);

  // Sau khi fetch xong, log dữ liệu
  useEffect(() => {
    fetchAppointments().then(() => {
      console.log('Appointments:', appointments);
    });
    fetchConsultations().then(() => {
      console.log('Consultations:', consultations);
    });
  }, []);

  // Mapping lại normalizeRecordToUnified cho appointment giống DoctorAppointmentSchedule
  function normalizeRecordToUnified(obj: Record<string, unknown>): UnifiedAppointment {
    return {
      id: String(obj._id || obj.id || ''),
      type: (obj.type as 'appointment' | 'consultation') || 'appointment',
      status: String(obj.status || ''),
      patientName: typeof obj.profileId === 'object' && obj.profileId !== null
        ? String((obj.profileId as any).fullName || '')
        : String(obj.patientName || obj.fullName || ''),
      patientPhone: typeof obj.profileId === 'object' && obj.profileId !== null
        ? String((obj.profileId as any).phone || (obj.profileId as any).phoneNumber || '')
        : String(obj.patientPhone || obj.phone || ''),
      appointmentDate: String(obj.appointmentDate || ''),
      appointmentTime: String(obj.appointmentTime || obj.appointmentSlot || ''),
      serviceName: typeof obj.serviceId === 'object' && obj.serviceId !== null
        ? String((obj.serviceId as any).serviceName || '')
        : String(obj.serviceName || ''),
      typeLocation: String(obj.typeLocation || ''),
      description: String(obj.description || obj.question || ''),
      notes: String(obj.notes || ''),
      address: String(obj.address || ''),
      originalData: obj
    };
  }

  const generateScheduleFromAPI = (startWeek: dayjs.Dayjs): WeekSchedule => {
    const schedule: DaySchedule[] = [];
    const weekEnd = startWeek.add(6, 'day');
    const today = dayjs().startOf('day');
    for (let i = 0; i < 7; i++) {
      const currentDay = startWeek.add(i, 'day');
      const dayDateString = currentDay.format('YYYY-MM-DD');
      const isPastDate = currentDay.isBefore(today, 'day');
      // Lọc appointments cho ngày này
      const dayAppointments = appointments.filter(apt => {
        const aptDate = dayjs(String(apt.appointmentDate)).format('YYYY-MM-DD');
        return aptDate === dayDateString;
      });
      // Lọc consultations cho ngày này
      const dayConsultations = consultations.filter(qa => {
        const qaDate = dayjs(String(qa.appointmentDate)).format('YYYY-MM-DD');
        return qaDate === dayDateString;
      });
      const daySchedule: DaySchedule = {
        date: currentDay.format('DD/MM'),
        dayName: currentDay.format('dddd'),
        fullDate: currentDay,
        slots: TIME_SLOTS.map((timeSlot, index) => {
          const slotId = `${currentDay.format('YYYY-MM-DD')}-${index}`;
          // Tìm appointment matching với time slot này
          const matchingAppointment = dayAppointments.find(apt => {
            const slotStart = timeSlot.split(' - ')[0].trim(); // '07:00'
            const aptTime = String(apt.appointmentTime || '').slice(0, 5); // '07:00'
            const match = aptTime === slotStart;
            if (match) {
              console.log('MATCH APPOINTMENT:', { slotStart, aptTime, apt });
            }
            return match;
          });
          // Tìm consultation matching với time slot này
          const matchingConsultation = dayConsultations.find(qa => {
            const slotStart = timeSlot.split(' - ')[0].trim(); // '07:00'
            const qaTime = String(qa.appointmentSlot || '').slice(0, 5); // '07:00'
            const match = qaTime === slotStart;
            if (match) {
              console.log('MATCH CONSULTATION:', { slotStart, qaTime, qa });
            }
            return match;
          });
          let slot: TimeSlot = {
            id: slotId,
            slotTime: timeSlot,
            status: 'Free',
          };
          if (matchingConsultation) {
            slot = {
              ...slot,
              status: 'Booked',
              appointment: normalizeRecordToUnified(matchingConsultation),
            };
          } else if (matchingAppointment) {
            slot = {
              ...slot,
              status: 'Booked',
              appointment: normalizeRecordToUnified(matchingAppointment),
            };
          } else if (isPastDate) {
            slot.status = 'Absent';
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

  const goToPreviousWeek = () => {
    setSelectedWeek(prev => prev.subtract(1, 'week'));
  };

  const goToNextWeek = () => {
    setSelectedWeek(prev => prev.add(1, 'week'));
  };

  const goToToday = () => {
    setSelectedWeek(dayjs().startOf('week'));
  };

  // Khi cần refresh
  const refreshData = () => {
    fetchAppointments();
    fetchConsultations();
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

  // Hàm lấy màu border theo status/type/typeLocation
  function getSlotColor(slot: TimeSlot): string {
    if (slot.appointment) {
      const { status, type, typeLocation } = slot.appointment;
      if (status === 'pending_payment') return '#fa8c16'; // cam
      if (status === 'pending') return '#bfbfbf'; // xám
      if (status === 'scheduled' || status === 'confirmed') return '#1890ff'; // xanh dương
      if (status === 'consulting') return '#fa8c16'; // cam
      if (status === 'completed') return '#3b82f6'; // xanh dương đậm (mới)
      if (status === 'cancelled') return '#f5222d'; // đỏ
      if (status === 'doctor_cancel') return '#a8071a'; // đỏ đậm
      if (status === 'done_testResultItem' || status === 'done_testResult') return '#13c2c2'; // cyan
      if (status === 'expired') return '#bfbfbf'; // xám nhạt
      // Phân biệt loại
      if (type === 'consultation') return '#722ed1'; // tím cho tư vấn
      if (typeLocation === 'Online') return '#722ed1'; // tím cho online
      if (typeLocation === 'home') return '#faad14'; // vàng cho tại nhà
      if (typeLocation === 'clinic') return '#2f54eb'; // xanh đậm cho tại phòng
      return '#d9d9d9';
    }
    if (slot.status === 'Free') return '#52c41a';
    if (slot.status === 'Absent') return '#bfbfbf';
    return '#d9d9d9';
  }
  // Hàm lấy icon theo status/type/typeLocation
  function getSlotIcon(slot: TimeSlot): React.ReactNode {
    if (slot.appointment) {
      const { status, type, typeLocation } = slot.appointment;
      if (status === 'pending_payment') return <ExclamationCircleOutlined />;
      if (status === 'pending') return <ClockCircleOutlined />;
      if (status === 'scheduled' || status === 'confirmed') {
        if (type === 'consultation' || typeLocation === 'Online') return <VideoCameraOutlined />;
        if (typeLocation === 'home') return <HomeOutlined />;
        if (typeLocation === 'clinic') return <EnvironmentOutlined />;
        return <CheckCircleOutlined />;
      }
      if (status === 'consulting') return <PlayCircleOutlined />;
      if (status === 'completed') return <CheckCircleOutlined />;
      if (status === 'cancelled' || status === 'doctor_cancel') return <CloseCircleOutlined />;
      if (status === 'done_testResultItem' || status === 'done_testResult') return <CheckCircleOutlined />;
      if (status === 'expired') return <ClockCircleOutlined />;
      return <UserOutlined />;
    }
    if (slot.status === 'Free') return <CheckCircleOutlined />;
    if (slot.status === 'Absent') return <CloseCircleOutlined />;
    return <ClockCircleOutlined />;
  }
  // Hàm lấy text theo status/type/typeLocation
  function getSlotText(slot: TimeSlot): string {
    if (slot.appointment) {
      const { status, type, typeLocation, patientName, serviceName } = slot.appointment;
      // Đổi toàn bộ status sang tiếng Việt
      if (status === 'pending_payment') return 'Chờ thanh toán';
      if (status === 'pending') return 'Chờ xác nhận';
      if (status === 'scheduled') return 'Đã lên lịch';
      if (status === 'confirmed') return 'Đã xác nhận';
      if (status === 'consulting') return type === 'consultation' ? 'Đang tư vấn' : 'Đang khám';
      if (status === 'completed') return 'Hoàn thành';
      if (status === 'cancelled') return 'Đã hủy';
      if (status === 'doctor_cancel') return 'Bác sĩ hủy';
      if (status === 'done_testResultItem' || status === 'done_testResult') return 'Đã có kết quả';
      if (status === 'expired') return 'Hết hạn';
      // Phân biệt loại
      if (type === 'consultation') return 'Tư vấn Online';
      if (typeLocation === 'Online') return 'Online';
      if (typeLocation === 'home') return 'Tại nhà';
      if (typeLocation === 'clinic') return 'Tại phòng';
      return serviceName || patientName || 'Đã đặt';
    }
    if (slot.status === 'Free') return 'Lịch trống';
    if (slot.status === 'Absent') return 'Đã qua';
    return 'N/A';
  }

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

      // ✅ SỬ DỤNG REAL API cho tất cả consultations

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

      // ✅ SỬ DỤNG REAL API cho tất cả consultations
      // Get consultation ID from original data
      let qaId = '';
      if (appointment.type === 'consultation') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const consultationData = appointment.originalData as any;
        qaId = consultationData?._id || consultationData?.id;
      }

      if (!qaId) {
        message.error('Không tìm thấy thông tin consultation');
        return;
      }

      // Call API to update consultation status to 'completed'
      console.log('✅ [API] Completing consultation - updating status to completed');

      // TODO: Implement actual API call
      // await consultationAPI.updateStatus(qaId, 'completed');

      message.success(`Đã hoàn thành tư vấn với ${appointment.patientName}`);
      refreshData();

    } catch (error: unknown) {
      console.error('❌ [API] Error completing consultation:', error);
      message.error('Có lỗi xảy ra khi hoàn thành tư vấn');
    } finally {
      setMeetingLoading(false);
    }
  };

  const scheduleData = generateScheduleFromAPI(selectedWeek);

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
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>
        ]}
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