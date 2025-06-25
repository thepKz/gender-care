import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Typography,
  Tooltip,
  DatePicker,
  message,
  Avatar
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  DeleteOutlined,
  PhoneOutlined,
  ClearOutlined,
  FilterOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { UnifiedAppointment, AppointmentFilters } from '../../../types/appointment';
import appointmentManagementService from '../../../api/services/appointmentManagementService';
import { useAuth } from '../../../hooks/useAuth';
import { doctorApi } from '../../../api/endpoints/doctorApi';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);
import ConsultationTransferButton from '../../../components/ui/buttons/ConsultationTransferButton';
import AppointmentCancelButton from '../../../components/ui/buttons/AppointmentCancelButton';
import TestRecordModal from '../../../components/ui/forms/TestRecordModal';
import MedicalRecordModal from '../../../components/ui/forms/MedicalRecordModal';
import AppointmentDetailModal from '../../../components/ui/modals/AppointmentDetailModal';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

// Use UnifiedAppointment interface from API types
type Appointment = UnifiedAppointment;



const AppointmentManagement: React.FC = () => {
  const { user } = useAuth(); // Get current user to determine role
  const userRole = user?.role || 'staff'; // Default to staff if no role found
  
  // 🔍 DEBUG: Log để kiểm tra user role
  console.log('🔍 [DEBUG] User info:', { 
    user: user, 
    role: user?.role, 
    userRole: userRole,
    email: user?.email,
    dataSource: 'REAL_API'
  });
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(''); // Client-side search since API doesn't support search
  const [selectedType, setSelectedType] = useState<string>('all');

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  
  // ✅ NEW: Advanced Filters for Staff
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [doctors, setDoctors] = useState<Array<{_id: string, userId: {fullName: string}}>>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  // Modal states for AppointmentDetailModal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAppointmentForDetail, setSelectedAppointmentForDetail] = useState<Appointment | null>(null);

  // Modal states for staff actions
  const [testRecordModalVisible, setTestRecordModalVisible] = useState(false);
  const [medicalRecordModalVisible, setMedicalRecordModalVisible] = useState(false);
  const [selectedAppointmentForRecord, setSelectedAppointmentForRecord] = useState<Appointment | null>(null);

  // ✅ Load doctors list for filter (Staff only)
  const loadDoctors = async () => {
    if (userRole !== 'staff') return; // Only staff needs doctor filter
    
    try {
      setDoctorsLoading(true);
      const doctorsData = await doctorApi.getAllDoctors();
      console.log('👨‍⚕️ [DEBUG] Doctors loaded for filter:', doctorsData.length);
      setDoctors(doctorsData);
    } catch (error) {
      console.error('❌ [ERROR] Failed to load doctors:', error);
      message.error('Không thể tải danh sách bác sĩ');
    } finally {
      setDoctorsLoading(false);
    }
  };

  // Load doctors on component mount
  useEffect(() => {
    if (userRole === 'staff') {
      loadDoctors();
    }
  }, [userRole]);

  // ✅ 72H RULE: Check if appointment can be cancelled (more than 72h before appointment time)
  const canCancelAppointment = (appointment: UnifiedAppointment): boolean => {
    try {
      // Parse appointment date and time with Vietnam timezone
      const appointmentDateTime = dayjs.tz(
        `${appointment.appointmentDate} ${appointment.appointmentTime}`, 
        'YYYY-MM-DD HH:mm',
        'Asia/Ho_Chi_Minh'
      );
      
      const now = dayjs.tz(new Date(), 'Asia/Ho_Chi_Minh');
      const hoursDiff = appointmentDateTime.diff(now, 'hours');
      
      console.log('🕐 [72H CHECK]:', {
        appointmentId: appointment._id,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        appointmentDateTime: appointmentDateTime.format('YYYY-MM-DD HH:mm'),
        now: now.format('YYYY-MM-DD HH:mm'),
        hoursDiff,
        canCancel: hoursDiff > 72
      });
      
      return hoursDiff > 72;
    } catch (error) {
      console.error('❌ [ERROR] Failed to parse appointment time:', error);
      return false; // If can't parse, don't allow cancel for safety
    }
  };

  // ✅ ENHANCED: Render cancel/transfer actions theo đúng flow chart - CHỈ CHO DOCTOR
  const renderCancelActions = (record: UnifiedAppointment) => {
    // ❌ STAFF ROLE: Không có quyền cancel/transfer appointment
    if (userRole === 'staff') {
      return null;
    }

    console.log('🔍 [DEBUG] renderCancelActions:', {
      id: record._id,
      type: record.type,
      status: record.status,
      patientName: record.patientName,
      appointmentDate: record.appointmentDate,
      appointmentTime: record.appointmentTime
    });

    // ✅ THEO DOCS: Hiển thị nút từ khi status = paid, scheduled, confirmed, consulting  
    const allowedStatuses = ['paid', 'scheduled', 'confirmed', 'consulting', 'pending_payment'];
    if (!allowedStatuses.includes(record.status)) {
      console.log('❌ [DEBUG] Status không cho phép cancel/transfer:', record.status, 'Allowed:', allowedStatuses);
      return null;
    }

    console.log('✅ [DEBUG] Status OK, proceeding with button render for:', record.status);

    if (record.type === 'consultation') {
      // ✅ CONSULTATION FLOW: Always show transfer button for paid/scheduled/consulting
      console.log('🎯 [DEBUG] Rendering ConsultationTransferButton for:', record._id);
      return (
        <ConsultationTransferButton 
          consultation={record} 
          onTransferSuccess={() => loadAppointments()} 
        />
      );
    } else {
      // ✅ APPOINTMENT FLOW: Show cancel button with 72h rule for paid/scheduled/consulting
      console.log('🎯 [DEBUG] Rendering AppointmentCancelButton for:', record._id, 'Type:', record.type);
      
      // ✅ CHECK 72H RULE for appointments only
      const canCancel = canCancelAppointment(record);
      
      if (!canCancel) {
        // ⏰ Không đủ 72h - chỉ hiển thị thông báo
        return (
          <Tooltip title="Chỉ có thể hủy lịch hẹn trước 72 giờ (3 ngày)">
            <Button 
              type="text" 
              size="small"
              disabled
              icon={<ClockCircleOutlined />}
            >
              Quá hạn hủy
            </Button>
          </Tooltip>
        );
      }
      
      return (
        <Space>
        <AppointmentCancelButton 
          appointment={record} 
          onCancelClick={(appointment) => showCancelModal(appointment)} 
        />
          {/* ✅ FALLBACK: Always visible cancel button when within 72h rule */}
          <Button 
            type="text" 
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => showCancelModal(record)}
          >
            Hủy lịch hẹn
          </Button>
        </Space>
      );
    }
  };

  // Load data based on user role - API for doctors, mock for staff testing
  const loadAppointments = async () => {
    try {
      setLoading(true);
      
      // ✅ REAL API LOADING: Load appointments from backend
      console.log('🔄 [API] Loading appointments with filters:', {
        userRole,
        searchText,
        selectedType,
        selectedDate
      });
      
      // ✅ ENHANCED: Prepare filters with doctor and date range support
      const filters: AppointmentFilters = {
        page: 1,
        limit: 100, // Get all for client-side filtering
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        appointmentType: selectedType !== 'all' ? selectedType : undefined,
        // Use date range if available, otherwise fall back to single date
        startDate: dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : (selectedDate !== 'all' ? selectedDate : undefined),
        endDate: dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : (selectedDate !== 'all' ? selectedDate : undefined),
      };
      
      // ✅ Get appointments and consultations from API
      const appointments = await appointmentManagementService.getAllDoctorAppointments(filters);
      console.log('✅ [API] Appointments loaded:', appointments.length);
      
      // Debug: check types
      const appointmentTypes = appointments.map(apt => apt.type);
      const consultationCount = appointments.filter(apt => apt.type === 'consultation').length;
      const appointmentCount = appointments.filter(apt => apt.type === 'appointment').length;
      
      console.log('✅ [DEBUG] Type breakdown:', {
        consultations: consultationCount,
        appointments: appointmentCount,
        types: appointmentTypes
      });
      
      setAppointments(appointments);
      
      if (appointments.length === 0) {
        message.info('Chưa có lịch hẹn nào trong hệ thống');
      } else {
        message.success(`Đã tải thành công ${appointments.length} lịch hẹn`);
      }
      
    } catch (error: unknown) {
      console.error('❌ [ERROR] Failed to load appointments:', error);
      message.error('Không thể tải danh sách lịch hẹn. Vui lòng thử lại.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedType, selectedDate, selectedDoctor, dateRange]);

  // Reload when search text changes (debounced)
  useEffect(() => {
    const delayedLoad = setTimeout(() => {
      if (searchText !== '') {
        // For search, we still do client-side filtering since API doesn't support search
        // The loadAppointments will still be called when filters change
      }
    }, 300);

    return () => clearTimeout(delayedLoad);
  }, [searchText]);

  // Filter appointments based on search (other filters are applied at API level)
  const filteredAppointments = appointments.filter(appointment => {
    if (searchText === '') return true;
    
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
                         appointment.serviceName.toLowerCase().includes(searchText.toLowerCase()) ||
                         appointment.patientPhone.includes(searchText);
    
    return matchesSearch;
  });

  const getStatusColor = (status: Appointment['status'] | 'pending' | 'paid' | 'confirmed') => {
    const colors = {
      pending_payment: 'gold',    // ✅ Chờ thanh toán
      pending: 'orange',          // ✅ Chờ xác nhận
      scheduled: 'purple',        // ✅ Đã lên lịch
      confirmed: 'blue',          // ✅ Đã xác nhận
      consulting: 'lime',         // ✅ Đang tư vấn
      completed: 'green',         // ✅ Hoàn thành
      cancelled: 'red',           // ✅ Đã hủy
      // ✅ LEGACY: Support during transition
      paid: 'cyan',              // Map to scheduled
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: Appointment['status'] | 'pending' | 'paid' | 'confirmed') => {
    const texts = {
      pending_payment: 'Chờ thanh toán',  // ✅ Chờ thanh toán
      pending: 'Chờ xác nhận',           // ✅ Chờ xác nhận  
      scheduled: 'Đã lên lịch',          // ✅ Đã lên lịch
      confirmed: 'Đã xác nhận',          // ✅ Đã xác nhận
      consulting: 'Đang tư vấn',         // ✅ Đang tư vấn
      completed: 'Hoàn thành',           // ✅ Hoàn thành
      cancelled: 'Đã hủy',              // ✅ Đã hủy
      // ✅ LEGACY: Support during transition
      paid: 'Đã thanh toán',            // Map to scheduled
    };
    return texts[status] || status;
  };

  // ✅ Determine service type based on service name and backend data
  const getServiceType = (record: Appointment): 'appointment' | 'consultation' => {
    // Check service name first for more accurate detection
    const serviceName = record.serviceName?.toLowerCase() || '';
    
    // If service name contains consultation/advisory keywords -> consultation 
    if (serviceName.includes('tư vấn') || 
        serviceName.includes('tu van') ||
        serviceName.includes('consultation') ||
        serviceName.includes('online') ||
        serviceName.includes('trực tuyến')) {
      return 'consultation';
    }
    
    // If service name contains physical exam keywords -> appointment
    if (serviceName.includes('khám') || 
        serviceName.includes('xét nghiệm') ||
        serviceName.includes('test') ||
        serviceName.includes('siêu âm') ||
        serviceName.includes('chẩn đoán')) {
      return 'appointment';
    }
    
    // Fallback to backend fields
    if (record.type === 'consultation') return 'consultation';
    if (record.appointmentType === 'consultation') return 'consultation';
    
    // Default to appointment for medical services
    return 'appointment';
  };

  const getTypeColor = (record: Appointment) => {
    const serviceType = getServiceType(record);
    const colors = {
      appointment: 'volcano',    // Phòng khám - màu đỏ cam
      consultation: 'geekblue'   // Trực tuyến - màu xanh dương
    };
    return colors[serviceType];
  };

  const getTypeText = (record: Appointment) => {
    const serviceType = getServiceType(record);
    const texts = {
      appointment: 'Phòng khám',   // Appointment = Phòng khám
      consultation: 'Trực tuyến'   // Consultation = Trực tuyến
    };
    return texts[serviceType];
  };

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelAppointmentData, setCancelAppointmentData] = useState<{
    id: string;
    type: 'appointment' | 'consultation';
    patientName: string;
  } | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const showCancelModal = (appointment: Appointment) => {
    setCancelAppointmentData({
      id: appointment._id,
      type: appointment.type,
      patientName: appointment.patientName
    });
    setCancelReason('');
    setCancelModalVisible(true);
  };

  const handleCancelByDoctor = async () => {
    if (!cancelAppointmentData || !cancelReason.trim()) {
      message.error('Vui lòng nhập lý do hủy lịch hẹn');
      return;
    }

    try {
      // ✅ Call proper backend API based on appointment type
      let success = false;
      
      if (cancelAppointmentData.type === 'appointment') {
        // ✅ APPOINTMENT: Call cancel-by-doctor API (72h rule applied in backend)
        success = await appointmentManagementService.cancelAppointmentByDoctor(
          cancelAppointmentData.id,
          cancelReason.trim()
        );
        
        if (success) {
          message.success('Hủy lịch hẹn thành công');
        }
      } else if (cancelAppointmentData.type === 'consultation') {
        // ✅ CONSULTATION: This should use transfer logic, not direct cancel
        // But keep this for legacy support or direct cancel cases
        success = await appointmentManagementService.cancelConsultationByDoctor(
        cancelAppointmentData.id,
        cancelReason.trim()
      );
        
        if (success) {
          message.success('Hủy lịch tư vấn thành công');
        }
      }

      if (success) {
        // Update local state
        setAppointments(prev => 
          prev.map(apt => 
            apt._id === cancelAppointmentData.id ? { ...apt, status: 'cancelled' } : apt
          )
        );
        setCancelModalVisible(false);
        setCancelAppointmentData(null);
        setCancelReason('');
      } else {
        message.error('Không thể hủy lịch hẹn');
      }
    } catch (error: unknown) {
      console.error('❌ [ERROR] Failed to cancel appointment by doctor:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra khi hủy lịch hẹn'
        : 'Có lỗi xảy ra khi hủy lịch hẹn';
      message.error(errorMessage);
    }
  };

  const showAppointmentDetails = async (appointment: Appointment) => {
    try {
      // 🔍 DEBUG: Log toàn bộ thông tin appointment để kiểm tra
      console.log('🔍 [DEBUG] Showing appointment details:', {
        id: appointment._id,
        type: appointment.type,
        patientName: appointment.patientName,
        serviceName: appointment.serviceName,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        status: appointment.status,
        fullObject: appointment
      });
      
      // ✅ SIMPLIFIED LOGIC: Theo user yêu cầu - không cần gọi API detail nữa
      // Data đã đầy đủ từ list, chỉ cần hiển thị modal
      console.log('✅ [SIMPLIFIED] Using existing data from list');
      setSelectedAppointmentForDetail(appointment);
      setDetailModalVisible(true);
      
    } catch (error: unknown) {
      console.error('❌ [ERROR] Failed to show appointment details:', error);
      
      // 🔄 FALLBACK: Nếu có lỗi, vẫn hiển thị modal với data có sẵn
      setSelectedAppointmentForDetail(appointment);
      setDetailModalVisible(true);
    }
  };

  const columns: ColumnsType<Appointment> = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '2px' }}>
              {record.patientName}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <PhoneOutlined style={{ marginRight: '4px' }} />
              {record.patientPhone}
            </div>
          </div>
        </Space>
      )
    },
    // ✅ NEW: Doctor column - Only for Staff
    ...(userRole === 'staff' ? [{
      title: 'Bác sĩ',
      key: 'doctor',
      width: 150,
      render: (_, record: Appointment) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '2px' }}>
            {record.doctorName || 'Chưa phân công'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.doctorSpecialization || ''}
          </div>
        </div>
      )
    }] : []),
    {
      title: 'Dịch vụ',
      key: 'service',
      width: 280,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>
            {record.serviceName}
          </div>
          <Space size="small" wrap>
            <Tag color={getTypeColor(record)}>
              {getTypeText(record)}
            </Tag>
          </Space>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {record.description.length > 50 
                ? `${record.description.substring(0, 50)}...` 
                : record.description
              }
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Lịch hẹn',
      key: 'schedule',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <CalendarOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
            <Text style={{ fontSize: '13px', fontWeight: 500 }}>
              {(() => {
                const date = new Date(record.appointmentDate);
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
              })()}
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <ClockCircleOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
            <Text style={{ fontSize: '13px' }}>{record.appointmentTime}</Text>
          </div>
          {record.address && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              <EnvironmentOutlined style={{ marginRight: '2px' }} />
              {record.address.length > 30 
                ? `${record.address.substring(0, 30)}...` 
                : record.address
              }
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => {
        // Handle both Date objects and string dates
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        
        // Create full datetime for comparison
        const datetimeA = new Date(dateA.toDateString() + ' ' + a.appointmentTime);
        const datetimeB = new Date(dateB.toDateString() + ' ' + b.appointmentTime);
        
        return datetimeA.getTime() - datetimeB.getTime();
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: Appointment['status'] | 'pending' | 'paid' | 'confirmed') => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: userRole === 'staff' ? 80 : 160, // Narrower for staff (only view button)
      render: (_, record) => (
        <Space>
          {/* ✅ ENHANCED: Gọi API thực để lấy chi tiết đầy đủ từ backend */}
          <Tooltip title="Xem chi tiết">
            <Button 
              type="primary" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => showAppointmentDetails(record)}
              style={{
                backgroundColor: '#1890ff',
                borderColor: '#1890ff'
              }}
              loading={loading}
            >
              {userRole === 'staff' ? 'Chi tiết' : ''}
            </Button>
          </Tooltip>
          
          {/* ✅ ENHANCED: Dynamic cancel/transfer actions theo type - CHỈ CHO DOCTOR */}
          {renderCancelActions(record)}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
        <Title level={2} style={{ margin: 0 }}>
              {userRole === 'staff' ? 'Lịch làm việc cá nhân' : 'Quản lý lịch hẹn'}
        </Title>
        <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
              {userRole === 'staff' 
                ? 'Xem lịch hẹn của tất cả bác sĩ trong trung tâm theo tuần' 
                : 'Quản lý lịch hẹn khám bệnh và tư vấn trực tuyến của bác sĩ'
              }
        </p>
          </div>
        </div>
      </div>

      <Card>
        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <Space wrap>
            <Search
              placeholder="Tìm kiếm bệnh nhân, dịch vụ..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            
            {/* ✅ NEW: Doctor Filter - Only for Staff */}
            {userRole === 'staff' && (
              <Select
                value={selectedDoctor}
                onChange={setSelectedDoctor}
                style={{ width: 180 }}
                loading={doctorsLoading}
                placeholder="Chọn bác sĩ..."
              >
                <Option value="all">Tất cả bác sĩ</Option>
                {doctors.map(doctor => (
                  <Option key={doctor._id} value={doctor._id}>
                    {doctor.userId?.fullName || 'Không có tên'}
                  </Option>
                ))}
              </Select>
            )}
            
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: 150 }}
              placeholder="Loại dịch vụ"
            >
              <Option value="all">Tất cả loại</Option>
              {/* ✅ CHỈ 2 LOẠI DỊCH VỤ: appointment và consultation (dựa vào backend data) */}
              <Option value="appointment">Phòng khám</Option>
              <Option value="consultation">Trực tuyến</Option>
            </Select>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 170 }}
              placeholder="Trạng thái"
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="pending_payment">Chờ thanh toán</Option>
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="scheduled">Đã lên lịch</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="consulting">Đang tư vấn</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
            
            {/* ✅ Date filtering - Range picker for staff, single date for doctor */}
            {userRole === 'staff' ? (
              <DatePicker.RangePicker
                placeholder={['Từ ngày', 'Đến ngày']}
                value={dateRange}
                onChange={setDateRange}
                style={{ width: 260 }}
                format="DD/MM/YYYY"
              />
            ) : (
              <DatePicker
                placeholder="Chọn ngày"
                onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : 'all')}
                style={{ width: 150 }}
                format="DD/MM/YYYY"
              />
            )}
          </Space>
          
          {/* ✅ Clear Filters Button - Cho cả Staff và Doctor */}
            <Space>
              <Button
                icon={<ClearOutlined />}
                onClick={() => {
                if (userRole === 'staff') {
                  setSelectedDoctor('all');
                  setDateRange(null);
                }
                  setSelectedType('all');
                  setSelectedStatus('all');
                  setSelectedDate('all');
                  setSearchText('');
                }}
                style={{ borderRadius: '6px' }}
              >
                Xóa bộ lọc
              </Button>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                style={{ borderRadius: '6px' }}
              >
              Hiển thị ({filteredAppointments.length})
              </Button>
            </Space>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredAppointments}
          loading={loading}
          pagination={{
            total: filteredAppointments.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} lịch hẹn`
          }}
          scroll={{ x: 1200 }}
        />

        {/* ✅ ENHANCED: Modal hủy lịch hẹn bởi bác sĩ với UI đẹp hơn */}
        <Modal
          title={
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '8px 0'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#fff2f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DeleteOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                  Hủy lịch hẹn
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                  Thao tác này không thể hoàn tác
                </div>
              </div>
            </div>
          }
          open={cancelModalVisible}
          onOk={handleCancelByDoctor}
          onCancel={() => {
            setCancelModalVisible(false);
            setCancelAppointmentData(null);
            setCancelReason('');
          }}
          okText="Xác nhận hủy"
          cancelText="Đóng"
          okButtonProps={{ 
            danger: true,
            size: 'large',
            style: { 
              minWidth: '120px',
              borderRadius: '8px',
              fontWeight: 500
            }
          }}
          cancelButtonProps={{
            size: 'large',
            style: {
              minWidth: '120px',
              borderRadius: '8px'
            }
          }}
          width={600}
          centered
          maskClosable={false}
          destroyOnClose
        >
          {cancelAppointmentData && (
            <div style={{ padding: '24px 0 8px 0' }}>
              {/* Patient Info Card */}
              <div style={{ 
                marginBottom: '24px',
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <UserOutlined style={{ 
                    color: '#3b82f6', 
                    fontSize: '16px',
                    padding: '8px',
                    backgroundColor: '#dbeafe',
                    borderRadius: '50%'
                  }} />
            <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                      {cancelAppointmentData.patientName}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {cancelAppointmentData.type === 'consultation' ? 'Tư vấn trực tuyến' : 'Lịch hẹn khám bệnh'}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                  Bạn có chắc chắn muốn hủy {cancelAppointmentData.type === 'consultation' ? 'tư vấn' : 'lịch hẹn'} này?
                  {cancelAppointmentData.type === 'consultation' && 
                    ' Hệ thống sẽ tự động tìm bác sĩ khác thay thế.'
                  }
                </div>
              </div>
              
              {/* Reason Input */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  marginBottom: '12px',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#374151'
                }}>
                  Lý do hủy {cancelAppointmentData.type === 'consultation' ? 'tư vấn' : 'lịch hẹn'}: 
                  <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
              </div>
              
              <TextArea
                  placeholder={`Vui lòng nhập lý do hủy ${cancelAppointmentData.type === 'consultation' ? 'tư vấn' : 'lịch hẹn'} (bắt buộc)...`}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                maxLength={500}
                showCount
                  style={{ 
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                />
              </div>
              
              {/* Info Notice */}
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#fffbeb', 
                borderRadius: '8px',
                border: '1px solid #fed7aa',
                display: 'flex',
                gap: '12px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  !
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 500, 
                    marginBottom: '4px', 
                    color: '#92400e',
                    fontSize: '14px'
                  }}>
                    Lưu ý quan trọng:
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#92400e',
                    lineHeight: '1.5'
                  }}>
                    {cancelAppointmentData.type === 'consultation' 
                      ? 'Lý do hủy sẽ được gửi cho bệnh nhân. Hệ thống sẽ tự động tìm bác sĩ khác có sẵn trong slot để thay thế.'
                      : 'Lý do hủy sẽ được gửi cho bệnh nhân để họ hiểu tình hình. Slot này sẽ được đánh dấu là Absent.'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </Card>

      {/* ✅ NEW: AppointmentDetailModal thay thế Modal.info() */}
      <AppointmentDetailModal
        visible={detailModalVisible}
        appointment={selectedAppointmentForDetail}
        userRole={userRole}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedAppointmentForDetail(null);
        }}
        onCreateTestRecord={(appointment) => {
          setSelectedAppointmentForRecord(appointment);
          setTestRecordModalVisible(true);
          setDetailModalVisible(false);
        }}
        onCreateMedicalRecord={(appointment) => {
          setSelectedAppointmentForRecord(appointment);
          setMedicalRecordModalVisible(true);
          setDetailModalVisible(false);
        }}
        onViewTestRecord={(appointment) => {
          // TODO: Open ViewTestRecordModal
          console.log('View test record for:', appointment.patientName);
          message.info(`Xem kết quả xét nghiệm cho ${appointment.patientName}`);
        }}
        onViewMedicalRecord={(appointment) => {
          // TODO: Open ViewMedicalRecordModal  
          console.log('View medical record for:', appointment.patientName);
                      message.info(`Xem bệnh án cho ${appointment.patientName}`);
        }}
      />

      {/* ✅ EXISTING: TestRecordModal cho staff tạo hồ sơ xét nghiệm */}
      <TestRecordModal
        visible={testRecordModalVisible}
        appointment={selectedAppointmentForRecord}
        onCancel={() => {
          setTestRecordModalVisible(false);
          setSelectedAppointmentForRecord(null);
        }}
        onSuccess={() => {
          setTestRecordModalVisible(false);
          setSelectedAppointmentForRecord(null);
          loadAppointments(); // Refresh list
        }}
      />

      {/* ✅ EXISTING: MedicalRecordModal cho staff tạo hồ sơ bệnh án */}
      <MedicalRecordModal
        visible={medicalRecordModalVisible}
        appointment={selectedAppointmentForRecord}
        onCancel={() => {
          setMedicalRecordModalVisible(false);
          setSelectedAppointmentForRecord(null);
        }}
        onSuccess={() => {
          setMedicalRecordModalVisible(false);
          setSelectedAppointmentForRecord(null);
          loadAppointments(); // Refresh list
        }}
      />
    </div>
  );
};

export default AppointmentManagement;