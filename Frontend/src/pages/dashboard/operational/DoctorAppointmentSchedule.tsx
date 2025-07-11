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
  Descriptions,
  Popconfirm,
  Row,
  Col,
  Avatar,
  Statistic
} from 'antd';
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
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { appointmentApi } from '../../../api/endpoints';
import consultationApi from '../../../api/endpoints/consultation';
import { useAuth } from '../../../hooks/useAuth';
import { TestResultsForm } from '../../../components/feature/medical/TestResultsForm';
import MedicalRecordModal from '../../../components/ui/forms/MedicalRecordModal';
import ViewMedicalRecordModal from '../../../components/ui/forms/ViewMedicalRecordModal';
import medicalApi from '../../../api/endpoints/medical';
import { doctorApi } from '../../../api/endpoints/doctorApi';

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
  status: 'pending_payment' | 'pending' | 'scheduled' | 'confirmed' | 'consulting' | 'completed' | 'cancelled' | 'done_testResultItem' | 'done_testResult';
  // ✅ Additional fields for consultations
  question?: string;
  age?: number;
  gender?: 'male' | 'female';
  consultationFee?: number;
  doctorNotes?: string;
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
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [selectedItem, setSelectedItem] = useState<UnifiedScheduleItem | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [medicalRecordModalVisible, setMedicalRecordModalVisible] = useState(false);
  const [viewMedicalRecordModalVisible, setViewMedicalRecordModalVisible] = useState(false);
  const [hasMedicalRecord, setHasMedicalRecord] = useState<boolean | null>(null);
  const [medicalRecordId, setMedicalRecordId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);

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

      // 🔥 Process Appointments - ✅ FIXED: Không filter theo serviceType nữa
      let myAppointments = [];
      if (appointmentsResponse.data?.appointments) {
        if (user?.role === 'staff') {
          // Staff xem tất cả appointments
          myAppointments = appointmentsResponse.data.appointments;
        } else if (user?.role === 'doctor' && doctorId) {
          // Doctor chỉ xem appointments được assign cho mình
          myAppointments = appointmentsResponse.data.appointments.filter((appointment: any) => {
            const aptDoctorId = appointment.doctorId?._id || appointment.doctorId;
            return aptDoctorId === doctorId;
          });
        }
      }

      // 🔥 Process Consultations (DoctorQA) - ✅ FIXED: Enhanced filtering
      let myConsultations = [];
      if (consultationsResponse.data && Array.isArray(consultationsResponse.data)) {
        myConsultations = consultationsResponse.data;
      } else if (consultationsResponse.data?.consultations) {
        myConsultations = consultationsResponse.data.consultations;
      } else if (consultationsResponse.data?.data) {
        // Backup case nếu data được wrap trong data property
        myConsultations = Array.isArray(consultationsResponse.data.data) ? consultationsResponse.data.data : [];
      }

      console.log('🔍 [Debug] Raw consultation data structure:', {
        hasData: !!consultationsResponse.data,
        isArray: Array.isArray(consultationsResponse.data),
        hasDataProperty: !!consultationsResponse.data?.data,
        hasConsultationsProperty: !!consultationsResponse.data?.consultations,
        consultationsCount: myConsultations.length,
        firstConsultation: myConsultations[0] || null
      });

      // ✅ Convert appointments to unified format
      const convertedAppointments: UnifiedScheduleItem[] = myAppointments.map((appointment: any) => ({
        _id: appointment._id,
        sourceType: 'appointment' as const,
        profileId: {
          _id: appointment.profileId?._id || appointment.profileId || '',
          fullName: appointment.profileId?.fullName || 'N/A',
          phoneNumber: appointment.profileId?.phone || appointment.profileId?.phoneNumber || 'N/A',
          dateOfBirth: appointment.profileId?.dateOfBirth,
          gender: appointment.profileId?.gender
        },
        serviceInfo: {
          _id: appointment.serviceId?._id || appointment.serviceId || '',
          serviceName: appointment.serviceId?.serviceName || 'N/A',
          serviceType: appointment.serviceId?.serviceType || 'test'
        },
        doctorId: appointment.doctorId ? {
          _id: appointment.doctorId._id || appointment.doctorId || '',
          userId: {
            fullName: appointment.doctorId?.userId?.fullName || user?.fullName || 'N/A'
          }
        } : {
          _id: '',
          userId: { fullName: 'Chưa phân công' }
        },
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        appointmentType: appointment.appointmentType || 'test',
        typeLocation: appointment.typeLocation || 'clinic',
        address: appointment.address || '',
        description: appointment.description || '',
        notes: appointment.notes || '',
        status: appointment.status,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      }));

      // ✅ Convert consultations to unified format  
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
        // Additional consultation fields
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

      console.log('🔍 [Debug] Final merged items:', allItems.length, {
        appointments: convertedAppointments.length,
        consultations: convertedConsultations.length
      });

      setScheduleItems(allItems);
    } catch (err: any) {
      console.error('❌ Error loading schedule:', err);
      message.error('Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const filterScheduleItems = () => {
    let filtered = scheduleItems;
    const today = dayjs().format('YYYY-MM-DD');
    const selectedDateStr = selectedDate?.format('YYYY-MM-DD');
    
    switch (activeTab) {
      case 'today':
        filtered = filtered.filter(item =>
          dayjs(item.appointmentDate).format('YYYY-MM-DD') === today &&
          ['consulting', 'done_testResultItem', 'done_testResult', 'completed', 'confirmed', 'scheduled'].includes(item.status)
        );
        break;
      case 'upcoming':
        filtered = filtered.filter(item => 
          dayjs(item.appointmentDate).isSameOrAfter(dayjs(), 'day') && 
          ['confirmed', 'scheduled'].includes(item.status)
        );
        break;
      case 'completed':
        filtered = filtered.filter(item => item.status === 'completed');
        break;
      case 'selected-date':
        filtered = filtered.filter(item => 
          dayjs(item.appointmentDate).format('YYYY-MM-DD') === selectedDateStr
        );
        break;
    }
    
    if (searchText) {
      filtered = filtered.filter(item =>
        item.profileId.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.profileId.phoneNumber.includes(searchText) ||
        item.serviceInfo.serviceName.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.question && item.question.toLowerCase().includes(searchText.toLowerCase()))
      );
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

  const handleCreateMedicalRecord = async (medicalRecordData) => {
    try {
      await medicalApi.createMedicalRecord(medicalRecordData);
      setMedicalRecordModalVisible(false);
      setHasMedicalRecord(true);
      message.success('Tạo hồ sơ bệnh án thành công!');
      return true;
    } catch (e) {
      message.error('Tạo hồ sơ bệnh án thất bại!');
      return false;
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
            {record.typeLocation === 'clinic' ? '🏥 Phòng khám' : 
             record.typeLocation === 'Online' ? '💻 Trực tuyến' : '🏠 Tại nhà'}
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
            {getStatusText(status)}
          </Tag>
          {record.sourceType === 'consultation' && record.question && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', maxWidth: '200px' }}>
              💬 {record.question.substring(0, 50)}...
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showItemDetails(record)}
            />
          </Tooltip>

          {['confirmed', 'scheduled'].includes(record.status) && (
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
        </Space>
      ),
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
    dayjs(item.appointmentDate).isSameOrAfter(dayjs(), 'day') && 
    ['confirmed', 'scheduled'].includes(item.status)
  );
  
  const completedItems = scheduleItems.filter(item => item.status === 'completed');

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
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <div style={{ 
                display: 'flex', 
                gap: '8px',
                flexWrap: 'wrap',
                alignItems: 'center'
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

        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Tìm kiếm bệnh nhân, dịch vụ, câu hỏi..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ height: '40px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: '100%', height: '40px' }}
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
            <Col xs={24} sm={12} md={8}>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                style={{ width: '100%', height: '40px' }}
                format="DD/MM/YYYY"
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
          
          const isTest = selectedItem.serviceInfo?.serviceType === 'test';
          
          return [
            <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
              Đóng
            </Button>,
            (!isTest && hasMedicalRecord === false) && (
              <Button key="create" type="primary" onClick={() => setMedicalRecordModalVisible(true)}>
                Tạo hồ sơ bệnh án
              </Button>
            ),
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
                <Card title="👤 Thông tin bệnh nhân" size="small" style={{ marginBottom: '16px' }}>
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
                        {selectedItem.gender === 'male' ? '👨 Nam' : '👩 Nữ'}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Trạng thái">
                      <Tag color={getStatusColor(selectedItem.status)}>
                        {getStatusText(selectedItem.status)}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              {/* ✅ Right Section - Thông tin lịch hẹn */}
              <Col span={12}>
                <Card title="📅 Thông tin lịch hẹn" size="small" style={{ marginBottom: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Dịch vụ">
                      <div>
                        <div style={{ fontWeight: 500 }}>{selectedItem.serviceInfo.serviceName}</div>
                        {selectedItem.consultationFee && (
                          <span style={{ color: '#fa8c16', fontSize: '12px' }}>
                            💰 {selectedItem.consultationFee.toLocaleString()}đ
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
                          {selectedItem.typeLocation === 'clinic' ? '🏥 Phòng khám' : 
                           selectedItem.typeLocation === 'Online' ? '💻 Trực tuyến' : '🏠 Tại nhà'}
                        </span>
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            {/* ✅ Bottom Section - Thông tin chi tiết */}
            <Card title="📝 Thông tin chi tiết" size="small">
              <Descriptions column={1} size="small">
                {selectedItem.address && (
                  <Descriptions.Item label="Địa chỉ">
                    📍 {selectedItem.address}
                  </Descriptions.Item>
                )}
                
                {selectedItem.question && (
                  <Descriptions.Item label="Câu hỏi tư vấn">
                    <div style={{ 
                      background: '#f6ffed', 
                      padding: '12px', 
                      borderRadius: '6px',
                      border: '1px solid #b7eb8f'
                    }}>
                      💬 {selectedItem.question}
                    </div>
                  </Descriptions.Item>
                )}
                
                <Descriptions.Item label="Mô tả">
                  {selectedItem.description || 'Không có mô tả'}
                </Descriptions.Item>
                
                {selectedItem.notes && (
                  <Descriptions.Item label="Ghi chú">
                    <div style={{ 
                      background: '#fff7e6', 
                      padding: '8px 12px', 
                      borderRadius: '4px',
                      fontStyle: 'italic'
                    }}>
                      📝 {selectedItem.notes}
                    </div>
                  </Descriptions.Item>
                )}
                
                {selectedItem.doctorNotes && (
                  <Descriptions.Item label="Ghi chú bác sĩ">
                    <div style={{ 
                      background: '#e6f7ff', 
                      padding: '12px', 
                      borderRadius: '6px',
                      border: '1px solid #91d5ff'
                    }}>
                      🩺 {selectedItem.doctorNotes}
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </div>
        )}
      </Modal>

      {/* Medical Record Modals */}
      <MedicalRecordModal
        visible={medicalRecordModalVisible}
        onCancel={() => setMedicalRecordModalVisible(false)}
        appointment={selectedItem && {
          key: selectedItem._id,
          _id: selectedItem._id,
          patientName: selectedItem.profileId?.fullName || '',
          patientPhone: selectedItem.profileId?.phoneNumber || '',
          serviceName: selectedItem.serviceInfo?.serviceName || '',
          serviceType: selectedItem.serviceInfo?.serviceType || '',
          doctorName: selectedItem.doctorId?.userId?.fullName || '',
          doctorSpecialization: '',
          appointmentDate: selectedItem.appointmentDate,
          appointmentTime: selectedItem.appointmentTime,
          appointmentType: selectedItem.appointmentType,
          typeLocation: selectedItem.typeLocation,
          address: selectedItem.address,
          description: selectedItem.description,
          notes: selectedItem.notes,
          status: selectedItem.status as any,
          totalAmount: selectedItem.consultationFee,
          paymentStatus: undefined,
          bookingType: undefined,
          createdAt: selectedItem.createdAt,
          updatedAt: selectedItem.updatedAt,
          type: selectedItem.sourceType,
          originalData: selectedItem as any
        }}
        onSubmit={handleCreateMedicalRecord}
      />
      
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
    </div>
  );
};

export default DoctorAppointmentSchedule;