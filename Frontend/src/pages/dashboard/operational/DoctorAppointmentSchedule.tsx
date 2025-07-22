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
  message,
  Descriptions,
  Popconfirm,
  Row,
  Col,
  Avatar,
  Statistic
} from 'antd';
import SimpleDatePicker from '../../../components/ui/SimpleDatePicker';
import {
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  MessageOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
  MedicineBoxOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { appointmentApi } from '../../../api/endpoints';
import consultationApi from '../../../api/endpoints/consultation';
import { useAuth } from '../../../hooks/useAuth';
import { TestResultsForm } from '../../../components/feature/medical/TestResultsForm';
import ViewMedicalRecordModal from '../../../components/ui/forms/ViewMedicalRecordModal';
import medicalApi from '../../../api/endpoints/medical';
import { doctorApi } from '../../../api/endpoints/doctorApi';
import CancelScheduleModal from '../../../components/ui/modals/CancelScheduleModal';
import servicesApi from '../../../api/endpoints/services';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

dayjs.extend(isSameOrAfter);

// ✅ NEW: Unified interface cho cả appointments và consultations
interface UnifiedScheduleItem {
  _id: string;
  sourceType: 'appointment' | 'consultation'; // 🔥 Indicator to distinguish sources
  profileId: {
    _id: string;
    fullName: string;
    phoneNumber: string;
    dateOfBirth?: string;
    gender?: string;
  };
  serviceInfo: {
    _id: string;
    serviceName: string;
    serviceType: string;
  };
  doctorId: {
    _id: string;
    userId: {
      fullName: string;
    };
  };
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'consultation' | 'test' | 'treatment' | 'other';
  typeLocation: 'clinic' | 'home' | 'Online';
  address?: string;
  description: string;
  notes?: string;
  status: 'pending_payment' | 'pending' | 'scheduled' | 'confirmed' | 'consulting' | 'completed' | 'cancelled' | 'doctor_cancel' | 'done_testResultItem' | 'done_testResult';
  // ✅ Additional fields for consultations
  question?: string;
  age?: number;
  gender?: 'male' | 'female';
  consultationFee?: number;
  doctorNotes?: string;
  createdAt: string;
  updatedAt: string;
  cancelledBy?: string; // Added for cancelled items
  cancelReason?: string; // Added for cancelled items
}

// Add a minimal type for appointments from backend
interface RawProfile {
  _id: string;
  fullName?: string;
  phone?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
}
interface RawService {
  _id: string;
  serviceName?: string;
  serviceType?: string;
}
interface RawPackage {
  _id: string;
  name?: string;
}
interface RawDoctor {
  _id: string;
  userId?: { fullName?: string };
}
interface RawAppointment {
  _id: string;
  profileId: RawProfile | string;
  serviceId?: RawService | string;
  packageId?: RawPackage | string;
  doctorId?: RawDoctor | string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType?: string;
  typeLocation?: string;
  address?: string;
  description?: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const DoctorAppointmentSchedule: React.FC = () => {
  const { user } = useAuth();
  // ✅ UPDATED: Use unified interface
  const [scheduleItems, setScheduleItems] = useState<UnifiedScheduleItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<UnifiedScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [selectedItem, setSelectedItem] = useState<UnifiedScheduleItem | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [viewMedicalRecordModalVisible, setViewMedicalRecordModalVisible] = useState(false);
  const [hasMedicalRecord, setHasMedicalRecord] = useState<boolean | null>(null);
  const [medicalRecordId, setMedicalRecordId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelConfirmCall, setCancelConfirmCall] = useState(false);

  useEffect(() => {
    if (user?.role === 'doctor' && user?._id) {
      doctorApi.getAllDoctors().then(doctors => {
        const found = doctors.find(doc => doc.userId?._id === user._id);
        setDoctorId(found?._id || null);
      });
    }
  }, [user]);

  useEffect(() => {
    loadUnifiedSchedule();
  }, [selectedDate, doctorId]);

  useEffect(() => {
    filterScheduleItems();
  }, [scheduleItems, searchText, selectedStatus, activeTab]);

  useEffect(() => {
    const checkMedicalRecord = async () => {
      if (isDetailModalVisible && selectedItem && selectedItem.sourceType === 'appointment') {
        try {
          const res = await medicalApi.checkMedicalRecordByAppointment(selectedItem._id);
          if (res.data?.exists && res.data?.medicalRecordId) {
            setHasMedicalRecord(true);
            setMedicalRecordId(res.data.medicalRecordId);
          } else {
            setHasMedicalRecord(false);
            setMedicalRecordId(null);
          }
        } catch (e) {
          setHasMedicalRecord(false);
          setMedicalRecordId(null);
        }
      }
    };
    checkMedicalRecord();
  }, [isDetailModalVisible, selectedItem]);

  // ✅ NEW: Load both appointments and consultations
  const loadUnifiedSchedule = async () => {
    try {
      setLoading(true);
      // 🔥 Parallel API calls
      const [appointmentsResponse, consultationsResponse] = await Promise.all([
        appointmentApi.getAllAppointments().catch(() => ({ data: { appointments: [] } })),
        consultationApi.getMyConsultations().catch(() => ({ data: [] }))
      ]);
      let myAppointments = [];
      if (appointmentsResponse.data?.appointments) {
        if (user?.role === 'staff') {
          myAppointments = appointmentsResponse.data.appointments;
        } else if (user?.role === 'doctor' && doctorId) {
          myAppointments = appointmentsResponse.data.appointments.filter((appointment: any) => {
            const aptDoctorId = appointment.doctorId?._id || appointment.doctorId;
            return aptDoctorId === doctorId;
          });
        }
      }
      let myConsultations = [];
      if (consultationsResponse.data && Array.isArray(consultationsResponse.data)) {
        myConsultations = consultationsResponse.data;
      } else if (consultationsResponse.data?.consultations) {
        myConsultations = consultationsResponse.data.consultations;
      } else if (consultationsResponse.data?.data) {
        myConsultations = Array.isArray(consultationsResponse.data.data) ? consultationsResponse.data.data : [];
      }
      // --- Sửa logic lấy tên dịch vụ/package ---
      // Tạo map packageId -> name để tránh gọi API nhiều lần
      const packageNameCache: Record<string, string> = {};
      async function getPackageName(packageObj: RawPackage | string): Promise<string> {
        if (!packageObj) return 'N/A';
        if (typeof packageObj === 'object' && packageObj.name) return packageObj.name;
        if (typeof packageObj === 'string') {
          if (packageNameCache[packageObj]) return packageNameCache[packageObj];
          try {
            const res = await servicesApi.getServicePackageDetail(packageObj);
            const name = res.data?.name || 'Gói dịch vụ';
            packageNameCache[packageObj] = name;
            return name;
          } catch {
            return 'Gói dịch vụ';
          }
        }
        return 'Gói dịch vụ';
      }
      // Convert appointments to unified format (async để lấy tên package nếu cần)
      const convertedAppointments: UnifiedScheduleItem[] = await Promise.all(myAppointments.map(async (appointment: RawAppointment) => {
        let serviceName = (typeof appointment.serviceId === 'object' && appointment.serviceId?.serviceName) ? appointment.serviceId.serviceName : '';
        let serviceType = (typeof appointment.serviceId === 'object' && appointment.serviceId?.serviceType) ? appointment.serviceId.serviceType : '';
        // Nếu không có serviceId mà có packageId thì lấy tên package
        if (!serviceName && appointment.packageId) {
          serviceName = await getPackageName(appointment.packageId);
          serviceType = 'package';
        }
        // Ensure correct type for appointmentType
        let appointmentType: UnifiedScheduleItem['appointmentType'] = 'test';
        if (appointment.appointmentType === 'consultation' || appointment.appointmentType === 'test' || appointment.appointmentType === 'treatment' || appointment.appointmentType === 'other') {
          appointmentType = appointment.appointmentType;
        }
        let typeLocation: UnifiedScheduleItem['typeLocation'] = 'clinic';
        if (appointment.typeLocation === 'clinic' || appointment.typeLocation === 'home' || appointment.typeLocation === 'Online') {
          typeLocation = appointment.typeLocation;
        }
        return {
          _id: appointment._id,
          sourceType: 'appointment',
          profileId: {
            _id: typeof appointment.profileId === 'object' ? appointment.profileId._id : appointment.profileId || '',
            fullName: typeof appointment.profileId === 'object' ? appointment.profileId.fullName || 'N/A' : 'N/A',
            phoneNumber: typeof appointment.profileId === 'object' ? (appointment.profileId.phone || appointment.profileId.phoneNumber || 'N/A') : 'N/A',
            dateOfBirth: typeof appointment.profileId === 'object' ? appointment.profileId.dateOfBirth : undefined,
            gender: typeof appointment.profileId === 'object' ? appointment.profileId.gender : undefined
          },
          serviceInfo: {
            _id:
              ((typeof appointment.serviceId === 'object' && appointment.serviceId?._id)
                || (typeof appointment.serviceId === 'string' && appointment.serviceId)
                || (typeof appointment.packageId === 'object' && appointment.packageId?._id)
                || (typeof appointment.packageId === 'string' && appointment.packageId)
                || '') as string,
            serviceName: serviceName || 'N/A',
            serviceType: serviceType || (appointment.packageId ? 'package' : 'test')
          },
          doctorId: appointment.doctorId && typeof appointment.doctorId === 'object' ? {
            _id: appointment.doctorId._id || '',
            userId: {
              fullName: appointment.doctorId.userId?.fullName || user?.fullName || 'N/A'
            }
          } : {
            _id: '',
            userId: { fullName: 'Chưa phân công' }
          },
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          appointmentType,
          typeLocation,
          address: appointment.address || '',
          description: appointment.description || '',
          notes: appointment.notes || '',
          status: appointment.status as UnifiedScheduleItem['status'],
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt
        };
      }));
      // Convert consultations to unified format (không đổi)
      const convertedConsultations: UnifiedScheduleItem[] = myConsultations.map((consultation: any) => ({
        _id: consultation._id,
        sourceType: 'consultation' as const,
        profileId: {
          _id: consultation.userId?._id || consultation.userId || '',
          fullName: consultation.fullName || 'N/A',
          phoneNumber: consultation.phone || 'N/A',
          dateOfBirth: undefined,
          gender: consultation.gender
        },
        serviceInfo: {
          _id: consultation.serviceId?._id || consultation.serviceId || '',
          serviceName: consultation.serviceName || 'Tư vấn trực tuyến',
          serviceType: 'consultation'
        },
        doctorId: consultation.doctorId ? {
          _id: consultation.doctorId._id || consultation.doctorId || '',
          userId: {
            fullName: consultation.doctorId?.userId?.fullName || user?.fullName || 'N/A'
          }
        } : {
          _id: '',
          userId: { fullName: 'Chưa phân công' }
        },
        appointmentDate: consultation.appointmentDate || consultation.createdAt,
        appointmentTime: consultation.appointmentSlot || 'Chưa xác định',
        appointmentType: 'consultation',
        typeLocation: 'Online',
        address: '',
        description: consultation.question || '',
        notes: consultation.notes || '',
        status: consultation.status,
        question: consultation.question,
        age: consultation.age,
        gender: consultation.gender,
        consultationFee: consultation.consultationFee,
        doctorNotes: consultation.doctorNotes,
        createdAt: consultation.createdAt,
        updatedAt: consultation.updatedAt
      }));
      // 🔥 Merge and sort by date
      const allItems = [...convertedAppointments, ...convertedConsultations].sort(
        (a, b) => dayjs(b.appointmentDate).valueOf() - dayjs(a.appointmentDate).valueOf()
      );
      setScheduleItems(allItems);
    } catch (err: any) {
      console.error('❌ Error loading schedule:', err);
      message.error('Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  // --- Sửa filterScheduleItems: nâng cấp sort theo mức độ liên quan khi search ---
  const filterScheduleItems = () => {
    let filtered = scheduleItems;
    const today = dayjs().format('YYYY-MM-DD');
    const selectedDateStr = selectedDate;

    switch (activeTab) {
      case 'today':
        filtered = filtered.filter(item =>
          dayjs(item.appointmentDate).format('YYYY-MM-DD') === today &&
          ['consulting', 'done_testResultItem', 'done_testResult', 'completed', 'confirmed', 'scheduled'].includes(item.status)
        );
        break;
      case 'upcoming':
        filtered = filtered.filter(item => 
          dayjs(item.appointmentDate).isAfter(dayjs(), 'day') &&
          ['confirmed', 'scheduled'].includes(item.status)
        );
        break;
      case 'completed':
        filtered = filtered.filter(item => item.status === 'completed');
        break;
      case 'cancelled':
        filtered = filtered.filter(item => item.status === 'cancelled' || item.status === 'doctor_cancel');
        break;
      case 'selected-date':
        if (selectedDateStr) {
          filtered = filtered.filter(item =>
            dayjs(item.appointmentDate).format('YYYY-MM-DD') === selectedDateStr
          );
          // sort theo giờ tăng dần
          filtered = filtered.sort((a, b) => {
            const getStart = (t) => t && t.split('-')[0] ? t.split('-')[0] : '';
            return getStart(a.appointmentTime).localeCompare(getStart(b.appointmentTime));
          });
        }
        break;
    }
    if (searchText) {
      const keyword = searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.profileId.fullName.toLowerCase().includes(keyword) ||
        item.profileId.phoneNumber.includes(keyword) ||
        item.serviceInfo.serviceName.toLowerCase().includes(keyword) ||
        (item.question && item.question.toLowerCase().includes(keyword))
      );
      // sort theo mức độ liên quan
      filtered = filtered.sort((a, b) => {
        const kw = keyword;
        const score = (item) => {
          if (item.profileId.fullName.toLowerCase().includes(kw)) return 4;
          if (item.serviceInfo.serviceName.toLowerCase().includes(kw)) return 3;
          if (item.profileId.phoneNumber.includes(kw)) return 2;
          if (item.question && item.question.toLowerCase().includes(kw)) return 1;
          return 0;
        };
        return score(b) - score(a);
      });
    }
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }
    setFilteredItems(filtered);
  };

  // ✅ Simple status colors
  const getStatusColor = (status: UnifiedScheduleItem['status']) => {
    const colors = {
      pending_payment: 'orange',
      pending: 'orange', 
      scheduled: 'blue',
      confirmed: 'blue',
      consulting: 'orange',
      done_testResultItem: 'cyan',
      done_testResult: 'cyan',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: UnifiedScheduleItem['status']) => {
    const texts = {
      pending_payment: 'Chờ thanh toán',
      pending: 'Chờ xác nhận',
      scheduled: 'Đã lên lịch',
      confirmed: 'Đã xác nhận',
      consulting: 'Đang khám',
      done_testResultItem: 'Hoàn thành kết quả',
      done_testResult: 'Hoàn thành hồ sơ',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  // ✅ Support both appointment and consultation actions
  const handleCompleteItem = async (itemId: string, sourceType: 'appointment' | 'consultation') => {
    try {
      if (sourceType === 'appointment') {
        await appointmentApi.updateAppointmentStatus(itemId, 'completed');
      } else {
        await consultationApi.updateConsultationStatus(itemId, 'completed');
      }
      message.success('Đã cập nhật trạng thái thành công');
      loadUnifiedSchedule();
    } catch (error) {
      message.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleStartConsulting = async (item: UnifiedScheduleItem) => {
    try {
      const newStatus = 'consulting';
      if (item.sourceType === 'appointment') {
        await appointmentApi.updateAppointmentStatus(item._id, newStatus);
      } else {
        await consultationApi.updateConsultationStatus(item._id, newStatus);
      }
      message.success('Đã chuyển sang trạng thái đang khám');
      loadUnifiedSchedule();
    } catch (error) {
      message.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleStartExamination = (item: UnifiedScheduleItem) => {
    setSelectedItem(item);
    setShowTestForm(true);
  };

  const handleTestSuccess = () => {
    message.success('Đã lưu kết quả xét nghiệm thành công!');
    setShowTestForm(false);
    setSelectedItem(null);
    loadUnifiedSchedule();
  };

  const showItemDetails = (item: UnifiedScheduleItem) => {
    setSelectedItem(item);
    setIsDetailModalVisible(true);
  };

  // Cancel handler
  const [cancelTargetItem, setCancelTargetItem] = useState<UnifiedScheduleItem | null>(null);
  const handleShowCancelModal = (item: UnifiedScheduleItem) => {
    setCancelTargetItem(item);
    setCancelReason('');
    setCancelConfirmCall(false);
    setCancelModalVisible(true);
  };

  const handleCancelSchedule = async () => {
    if (!cancelTargetItem) return;
    setCancelLoading(true);
    try {
      if (cancelTargetItem.sourceType === 'appointment') {
        await appointmentApi.cancelByDoctor(cancelTargetItem._id, cancelReason);
      } else {
        await consultationApi.cancelByDoctor(cancelTargetItem._id, cancelReason);
      }
      message.success('Đã hủy lịch thành công!');
      setCancelModalVisible(false);
      setCancelTargetItem(null);
      setCancelReason('');
      setCancelConfirmCall(false);
      loadUnifiedSchedule();
    } catch (err) {
      message.error('Hủy lịch thất bại!');
    } finally {
      setCancelLoading(false);
    }
  };

  // ✅ Clean and simple columns
  const columns: ColumnsType<UnifiedScheduleItem> = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.profileId.fullName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.profileId.phoneNumber}
            </div>
            {record.age && (
              <div style={{ fontSize: '11px', color: '#999' }}>
                {record.age} tuổi • {record.gender === 'male' ? 'Nam' : 'Nữ'}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Dịch vụ',
      key: 'service',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.serviceInfo.serviceName}</div>
          <Space>
            <Tag color={record.sourceType === 'consultation' ? 'blue' : 'green'}>
              {record.sourceType === 'consultation' ? 'Tư vấn' : 'Xét nghiệm'}
            </Tag>
            {record.consultationFee && (
              <span style={{ color: '#fa8c16', fontSize: '12px' }}>
                {record.consultationFee.toLocaleString()}đ
              </span>
            )}
          </Space>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      key: 'datetime',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{dayjs(record.appointmentDate).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.appointmentTime}</div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            {record.typeLocation === 'clinic' ? 'Phòng khám' : 
             record.typeLocation === 'Online' ? 'Trực tuyến' : 'Tại nhà'}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <div>
          <Tag color={getStatusColor(status)}>
            {status === 'doctor_cancel'
              ? 'Bác sĩ hủy'
              : status === 'cancelled'
                ? 'Khách hàng hủy'
                : getStatusText(status)}
          </Tag>
          {record.sourceType === 'consultation' && record.question && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', maxWidth: '200px' }}>
              {record.question.substring(0, 50)}...
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        const isDoctor = user?.role === 'doctor';
        const daysDiff = dayjs(record.appointmentDate).diff(dayjs(), 'day');
        const canCancel = isDoctor && daysDiff >= 7 && !['cancelled', 'doctor_cancel', 'completed'].includes(record.status);
        // Nếu đang ở tab Đã hủy thì chỉ render nút xem chi tiết
        if (activeTab === 'cancelled') {
          return (
            <Space size="small">
              <Tooltip title="Xem chi tiết">
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => showItemDetails(record)}
                />
              </Tooltip>
            </Space>
          );
        }
        return (
          <Space size="small">
            <Tooltip title="Xem chi tiết">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => showItemDetails(record)}
              />
            </Tooltip>

            {['confirmed', 'scheduled'].includes(record.status) && activeTab === 'today' && (
              <Popconfirm
                title="Xác nhận bắt đầu khám?"
                onConfirm={() => handleStartConsulting(record)}
                okText="Có"
                cancelText="Không"
              >
                <Tooltip title="Bắt đầu khám">
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlayCircleOutlined />}
                  >
                    Bắt đầu
                  </Button>
                </Tooltip>
              </Popconfirm>
            )}

            {record.status === 'consulting' && (
              <Popconfirm
                title="Xác nhận hoàn thành?"
                onConfirm={() => handleCompleteItem(record._id, record.sourceType)}
                okText="Có"
                cancelText="Không"
              >
                <Tooltip title="Hoàn thành">
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                  >
                    Hoàn thành
                  </Button>
                </Tooltip>
              </Popconfirm>
            )}

            {canCancel && (
              <Tooltip title="Hủy lịch (chỉ khi còn trên 7 ngày)">
                <Button
                  danger
                  size="small"
                  icon={<ExclamationCircleOutlined />}
                  onClick={() => handleShowCancelModal(record)}
                >
                  Hủy lịch
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  if (showTestForm && selectedItem) {
    return (
      <div style={{ padding: '24px' }}>
        <TestResultsForm
          serviceId={selectedItem.serviceInfo._id}
          testResultId={selectedItem._id}
          patientName={selectedItem.profileId.fullName}
          onSuccess={handleTestSuccess}
          onCancel={() => setShowTestForm(false)}
        />
      </div>
    );
  }

  // ✅ FIXED: Calculate counts from full scheduleItems, not filteredItems
  const todayItems = scheduleItems.filter(item =>
    dayjs(item.appointmentDate).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
  );
  
  const upcomingItems = scheduleItems.filter(item => 
    dayjs(item.appointmentDate).isAfter(dayjs(), 'day') && 
    ['confirmed', 'scheduled'].includes(item.status)
  );
  
  const completedItems = scheduleItems.filter(item => item.status === 'completed');
  const cancelledItems = scheduleItems.filter(item => item.status === 'cancelled' || item.status === 'doctor_cancel');

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CalendarOutlined style={{ color: '#1890ff' }} />
              Lịch hẹn của tôi
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Quản lý lịch hẹn được phân công cho bạn - bao gồm cả xét nghiệm và tư vấn trực tuyến
            </Text>
          </Col>
          <Col>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadUnifiedSchedule}
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
              title="Hôm nay"
              value={todayItems.length}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Sắp tới"
              value={upcomingItems.length}
              prefix={<CalendarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã hoàn thành"
              value={completedItems.length}
              prefix={<CheckCircleOutlined style={{ color: '#8c8c8c' }} />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng cộng"
              value={scheduleItems.length}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ✅ ENHANCED: Beautiful Filters and Tabs */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle" justify="center">
            <Col flex="auto">
              <div style={{ 
                display: 'flex', 
                gap: '8px',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Button 
                  type={activeTab === 'today' ? 'primary' : 'default'}
                  icon={<ClockCircleOutlined />}
                  onClick={() => setActiveTab('today')}
                  style={{ 
                    borderRadius: '6px',
                    height: '40px',
                    minWidth: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Hôm nay ({todayItems.length})
                </Button>
                
                <Button 
                  type={activeTab === 'upcoming' ? 'primary' : 'default'}
                  icon={<CalendarOutlined />}
                  onClick={() => setActiveTab('upcoming')}
                  style={{ 
                    borderRadius: '6px',
                    height: '40px',
                    minWidth: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Sắp tới ({upcomingItems.length})
                </Button>
                
                <Button 
                  type={activeTab === 'completed' ? 'primary' : 'default'}
                  icon={<CheckCircleOutlined />}
                  onClick={() => setActiveTab('completed')}
                  style={{ 
                    borderRadius: '6px',
                    height: '40px',
                    minWidth: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Đã hoàn thành ({completedItems.length})
                </Button>
                
                <Button 
                  type={activeTab === 'cancelled' ? 'primary' : 'default'}
                  icon={<ExclamationCircleOutlined />}
                  onClick={() => setActiveTab('cancelled')}
                  style={{ 
                    borderRadius: '6px',
                    height: '40px',
                    minWidth: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Đã hủy ({cancelledItems.length})
                </Button>
                
                <Button 
                  type={activeTab === 'selected-date' ? 'primary' : 'default'}
                  icon={<SearchOutlined />}
                  onClick={() => setActiveTab('selected-date')}
                  style={{ 
                    borderRadius: '6px',
                    height: '40px',
                    minWidth: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Theo ngày
                </Button>
              </div>
            </Col>
          </Row>
        </div>
        <Row gutter={16} align="middle" justify="center">
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="Tìm kiếm bệnh nhân, dịch vụ, câu hỏi..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ height: '44px', borderRadius: 12, padding: '0 12px', fontSize: 16 }}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: '100%', height: '44px', borderRadius: 12, fontSize: 16 }}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="pending_payment">Chờ thanh toán</Option>
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="scheduled">Đã lên lịch</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="consulting">Đang khám</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Col>
          {activeTab === 'selected-date' && (
            <Col xs={24} sm={8} md={6}>
              <SimpleDatePicker
                value={selectedDate}
                onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : '')}
                style={{ width: '100%', height: '44px', borderRadius: 12, fontSize: 16 }}
                placeholder="Chọn ngày"
              />
            </Col>
          )}
        </Row>
      </Card>

      {/* Main Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="_id"
          loading={loading}
          pagination={{
            total: filteredItems.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} lịch hẹn`,
          }}
        />
      </Card>

      {/* ✅ ENHANCED: Detail Modal with 2-section layout */}
      <Modal
        title={
          <Space>
            {selectedItem?.sourceType === 'consultation' ? (
              <MessageOutlined style={{ color: '#1890ff' }} />
            ) : (
              <MedicineBoxOutlined style={{ color: '#52c41a' }} />
            )}
            <span>
              Chi tiết {selectedItem?.sourceType === 'consultation' ? 'tư vấn' : 'lịch hẹn'}
            </span>
          </Space>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={(() => {
          if (!selectedItem) return [<Button key="close" onClick={() => setIsDetailModalVisible(false)}>Đóng</Button>];
          if (selectedItem.sourceType === 'consultation') {
            return [<Button key="close" onClick={() => setIsDetailModalVisible(false)}>Đóng</Button>];
          }
          // XÓA biến isCancelled không còn dùng
          const isTest = selectedItem.serviceInfo?.serviceType === 'test';
          return [
            <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
              Đóng
            </Button>,
            (!isTest && hasMedicalRecord === true && medicalRecordId) && (
              <Button key="view" onClick={() => setViewMedicalRecordModalVisible(true)}>
                Xem hồ sơ bệnh án
              </Button>
            )
          ].filter(Boolean);
        })()}
        width={800}
      >
        {selectedItem && (
          <div>
            {/* ✅ Header với loại dịch vụ */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <Tag 
                color={selectedItem.sourceType === 'consultation' ? 'blue' : 'green'}
                style={{ fontSize: '14px', padding: '4px 12px' }}
              >
                {selectedItem.sourceType === 'consultation' ? '💬 Tư vấn trực tuyến' : '🧪 Xét nghiệm'}
              </Tag>
            </div>

            <Row gutter={16}>
              {/* ✅ Left Section - Thông tin bệnh nhân */}
              <Col span={12}>
                <Card title="Thông tin bệnh nhân" size="small" style={{ marginBottom: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Họ tên">
                      <Space>
                        <UserOutlined />
                        <span style={{ fontWeight: 500 }}>{selectedItem.profileId.fullName}</span>
                        {selectedItem.age && (
                          <span style={{ color: '#666' }}>({selectedItem.age} tuổi)</span>
                        )}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                      <Space>
                        <PhoneOutlined />
                        <span>{selectedItem.profileId.phoneNumber}</span>
                      </Space>
                    </Descriptions.Item>
                    {selectedItem.gender && (
                      <Descriptions.Item label="Giới tính">
                        {selectedItem.gender === 'male' ? 'Nam' : 'Nữ'}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Trạng thái">
                      {selectedItem.status === 'doctor_cancel' ? (
                        <Tag color="red">Bác sĩ hủy</Tag>
                      ) : selectedItem.status === 'cancelled' ? (
                        <Tag color="volcano">Khách hàng hủy</Tag>
                      ) : (
                        <Tag color={getStatusColor(selectedItem.status)}>
                          {getStatusText(selectedItem.status)}
                        </Tag>
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              {/* ✅ Right Section - Thông tin lịch hẹn */}
              <Col span={12}>
                <Card title="Thông tin lịch hẹn" size="small" style={{ marginBottom: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Dịch vụ">
                      <div>
                        <div style={{ fontWeight: 500 }}>{selectedItem.serviceInfo.serviceName}</div>
                        {selectedItem.consultationFee && (
                          <span style={{ color: '#fa8c16', fontSize: '12px' }}>
                            {selectedItem.consultationFee.toLocaleString()}đ
                          </span>
                        )}
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày hẹn">
                      <Space>
                        <CalendarOutlined />
                        <span>{dayjs(selectedItem.appointmentDate).format('DD/MM/YYYY')}</span>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Thời gian">
                      <Space>
                        <ClockCircleOutlined />
                        <span>{selectedItem.appointmentTime}</span>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa điểm">
                      <Space>
                        {selectedItem.typeLocation === 'Online' ? <VideoCameraOutlined /> : 
                         selectedItem.typeLocation === 'clinic' ? <MedicineBoxOutlined /> :
                         <UserOutlined />}
                        <span>
                          {selectedItem.typeLocation === 'clinic' ? 'Phòng khám' : 
                           selectedItem.typeLocation === 'Online' ? 'Trực tuyến' : 'Tại nhà'}
                        </span>
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            {/* ✅ Bottom Section - Thông tin chi tiết */}
            <Card title="Thông tin chi tiết" size="small">
              <Descriptions column={1} size="small">
                {selectedItem.address && (
                  <Descriptions.Item label="Địa chỉ">
                    {selectedItem.address}
                  </Descriptions.Item>
                )}
                
                {selectedItem.question && (
                  <Descriptions.Item label="Câu hỏi tư vấn">
                    {selectedItem.question}
                  </Descriptions.Item>
                )}
                
                <Descriptions.Item label="Mô tả">
                  {selectedItem.description || 'Không có mô tả'}
                </Descriptions.Item>
                
                {(() => {
                  let noteText = selectedItem?.notes;
                  if (noteText && noteText.includes('[DOCTOR CANCELLED]')) {
                    noteText = noteText.split('[DOCTOR CANCELLED]')[0].trim();
                  }
                  return noteText ? (
                    <Descriptions.Item label="Ghi chú">
                      {noteText}
                    </Descriptions.Item>
                  ) : null;
                })()}
                {activeTab === 'cancelled' && selectedItem.status === 'doctor_cancel' && selectedItem.notes && selectedItem.notes.includes('[DOCTOR CANCELLED]') && (
                  <Descriptions.Item label="Lý do bác sĩ hủy">
                    <div style={{ color: '#cf1322', fontWeight: 500 }}>
                      {selectedItem.notes.split('[DOCTOR CANCELLED]')[1]?.trim() || 'Không có lý do'}
                    </div>
                  </Descriptions.Item>
                )}
                
                {selectedItem.doctorNotes && (
                  <Descriptions.Item label="Ghi chú bác sĩ">
                    {selectedItem.doctorNotes}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </div>
        )}
      </Modal>

      {/* Medical Record Modals */}
      
      <ViewMedicalRecordModal
        visible={viewMedicalRecordModalVisible}
        appointment={selectedItem ? {
          _id: selectedItem._id,
          patientName: selectedItem.profileId?.fullName || '',
          patientPhone: selectedItem.profileId?.phoneNumber || '',
          serviceName: selectedItem.serviceInfo?.serviceName || '',
          appointmentDate: selectedItem.appointmentDate,
          appointmentTime: selectedItem.appointmentTime,
          appointmentType: selectedItem.appointmentType,
        } : null}
        onCancel={() => setViewMedicalRecordModalVisible(false)}
      />

      {/* Modal hủy lịch */}
      <CancelScheduleModal
        visible={cancelModalVisible}
        onCancel={() => setCancelModalVisible(false)}
        onSubmit={handleCancelSchedule}
        loading={cancelLoading}
        reason={cancelReason}
        setReason={setCancelReason}
        confirmCall={cancelConfirmCall}
        setConfirmCall={setCancelConfirmCall}
      />
    </div>
  );
};

export default DoctorAppointmentSchedule;