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
  Avatar,
  Descriptions,
  Row,
  Col
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  DeleteOutlined,
  DollarOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { UnifiedAppointment, AppointmentFilters } from '../../../types/appointment';
import appointmentManagementService from '../../../api/services/appointmentManagementService';
import ConsultationTransferButton from '../../../components/ui/buttons/ConsultationTransferButton';
import AppointmentCancelButton from '../../../components/ui/buttons/AppointmentCancelButton';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

// Use UnifiedAppointment interface from API types
type Appointment = UnifiedAppointment;

interface DetailData {
  profileId?: { gender?: 'male' | 'female' | 'other'; year?: number | string };
  serviceId?: { price?: number };
  packageId?: { price?: number };
  doctorNotes?: string;
}

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(''); // Client-side search since API doesn't support search
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');

  // ✅ ENHANCED: Render cancel/transfer actions theo đúng flow chart
  const renderCancelActions = (record: UnifiedAppointment) => {
    console.log('🔍 [DEBUG] renderCancelActions:', {
      id: record._id,
      type: record.type,
      status: record.status,
      patientName: record.patientName,
      appointmentDate: record.appointmentDate,
      appointmentTime: record.appointmentTime
    });

    // ✅ THEO DOCS: Hiển thị nút từ khi status = paid, scheduled, consulting  
    // ✅ EXPANDED: Include all possible status values để debug issue
    const allowedStatuses = ['paid', 'scheduled', 'consulting', 'confirmed', 'pending_payment'];
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
      
      // ✅ FINAL: Show both original + fallback cancel button
      return (
        <Space>
        <AppointmentCancelButton 
          appointment={record} 
          onCancelClick={(appointment) => showCancelModal(appointment)} 
        />
          {/* ✅ FALLBACK: Always visible cancel button */}
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

  // Load real data from API
  const loadAppointments = async () => {
    try {
      setLoading(true);
      console.log('🔄 [DEBUG] Loading doctor appointments with filters:', {
        searchText,
        selectedType,
        selectedLocation,
        selectedStatus,
        selectedDate
      });
      
      // Prepare filters for API call
      const filters: AppointmentFilters = {
        page: 1,
        limit: 100, // Get all for client-side filtering
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        appointmentType: selectedType !== 'all' ? selectedType : undefined,
        startDate: selectedDate !== 'all' ? selectedDate : undefined,
        endDate: selectedDate !== 'all' ? selectedDate : undefined
      };
      
      // Call API to get both appointments and consultations
      const appointments = await appointmentManagementService.getAllDoctorAppointments(filters);
      
      console.log('✅ [DEBUG] Loaded appointments:', appointments.length);
      console.log('✅ [DEBUG] Appointments data:', appointments);
      
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
        message.info('Chưa có cuộc hẹn nào. Hệ thống sẽ hiển thị khi có dữ liệu mới.');
      }
      
    } catch (error: unknown) {
      console.error('❌ [ERROR] Failed to load appointments:', error);
      message.error('Không thể tải danh sách cuộc hẹn. Vui lòng thử lại sau.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedType, selectedLocation, selectedDate]);

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
      pending_payment: 'gold',    // ✅ KEEP
      scheduled: 'purple',        // ✅ KEEP
      consulting: 'lime',         // ✅ KEEP  
      completed: 'green',         // ✅ KEEP
      cancelled: 'red',          // ✅ KEEP
      // ✅ LEGACY: Support during transition
      pending: 'orange',         // Map to pending_payment
      paid: 'cyan',              // Map to scheduled
      confirmed: 'purple'        // Map to scheduled
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: Appointment['status'] | 'pending' | 'paid' | 'confirmed') => {
    const texts = {
      pending_payment: 'Chờ thanh toán',  // ✅ KEEP
      scheduled: 'Đã lên lịch',          // ✅ KEEP
      consulting: 'Đang tư vấn',         // ✅ KEEP
      completed: 'Hoàn thành',           // ✅ KEEP
      cancelled: 'Đã hủy',              // ✅ KEEP
      // ✅ LEGACY: Support during transition
      pending: 'Chờ xác nhận',          // Map to pending_payment
      paid: 'Đã thanh toán',            // Map to scheduled
      confirmed: 'Đã xác nhận'          // Map to scheduled
    };
    return texts[status] || status;
  };

  const getTypeColor = (type: Appointment['appointmentType']) => {
    const colors = {
      consultation: 'blue',
      test: 'green',
      'online-consultation': 'cyan',
      other: 'purple'
    };
    return colors[type] || 'purple';
  };

  const getTypeText = (type: Appointment['appointmentType']) => {
    const texts = {
      consultation: 'Tư vấn',
      test: 'Xét nghiệm',
      'online-consultation': 'Tư vấn online',
      other: 'Khác'
    };
    return texts[type] || 'Khác';
  };

  const getLocationColor = (location: Appointment['typeLocation']) => {
    const colors = {
      clinic: 'volcano',
      home: 'cyan',
      Online: 'geekblue'
    };
    return colors[location];
  };

  const getLocationText = (location: Appointment['typeLocation']) => {
    const texts = {
      clinic: 'Phòng khám',
      Online: 'Trực tuyến'
    };
    return texts[location];
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
          message.success('Hủy lịch hẹn thành công. Slot đã được đánh dấu Absent.');
        }
      } else if (cancelAppointmentData.type === 'consultation') {
        // ✅ CONSULTATION: This should use transfer logic, not direct cancel
        // But keep this for legacy support or direct cancel cases
        success = await appointmentManagementService.cancelConsultationByDoctor(
        cancelAppointmentData.id,
        cancelReason.trim()
      );
        
        if (success) {
          message.success('Hủy tư vấn thành công. Hệ thống sẽ tự động tìm bác sĩ thay thế.');
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
        message.error('Hủy lịch hẹn thất bại');
      }
    } catch (error: unknown) {
      console.error('❌ [ERROR] Failed to cancel appointment by doctor:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Hủy lịch hẹn thất bại'
        : 'Hủy lịch hẹn thất bại';
      message.error(errorMessage);
    }
  };

  const showAppointmentDetails = async (appointment: Appointment) => {
    try {
      // Fetch detailed data from API
      const detailData = await appointmentManagementService.getAppointmentDetail(appointment._id, appointment.type);
      
      if (!detailData) {
        message.error('Không thể tải chi tiết cuộc hẹn');
        return;
      }

      // Render detailed modal based on appointment type
      Modal.info({
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarOutlined style={{ color: '#1890ff' }} />
            <span>Chi tiết {appointment.type === 'consultation' ? 'tư vấn trực tuyến' : 'lịch hẹn'}</span>
          </div>
        ),
        width: 900,
        content: (
          <div style={{ marginTop: '16px' }}>
            {/* Thông tin bệnh nhân */}
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserOutlined style={{ color: '#722ed1' }} />
                  <span>Thông tin bệnh nhân</span>
                </div>
              }
              size="small" 
              style={{ marginBottom: '16px' }}
            >
              <Row gutter={16}>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Avatar icon={<UserOutlined />} size={64} style={{ marginBottom: '8px' }} />
                    <div style={{ fontWeight: 500 }}>{appointment.patientName}</div>
                  </div>
                </Col>
                <Col span={18}>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="Số điện thoại">
                      <PhoneOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                      {appointment.patientPhone}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      <Tag color={getStatusColor(appointment.status)}>
                        {getStatusText(appointment.status)}
                      </Tag>
                    </Descriptions.Item>
                    {appointment.type === 'appointment' && (detailData as DetailData).profileId?.gender && (
                      <Descriptions.Item label="Giới tính">
                        {(detailData as DetailData).profileId.gender === 'male' ? 'Nam' : 
                         (detailData as DetailData).profileId.gender === 'female' ? 'Nữ' : 'Khác'}
                      </Descriptions.Item>
                    )}
                    {appointment.type === 'appointment' && (detailData as DetailData).profileId?.year && (
                      <Descriptions.Item label="Năm sinh">
                        {(() => {
                          const year = (detailData as DetailData).profileId?.year;
                          if (year && typeof year === 'string' && year.includes('T')) {
                            // Nếu là ISO date string, extract năm
                            return new Date(year).getFullYear();
                          }
                          return year; // Nếu đã là number hoặc string năm
                        })()}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Thông tin dịch vụ & lịch hẹn */}
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarOutlined style={{ color: '#1890ff' }} />
                  <span>Thông tin dịch vụ & Lịch hẹn</span>
                </div>
              }
              size="small" 
              style={{ marginBottom: '16px' }}
            >
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Dịch vụ">
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                      {appointment.serviceName}
                    </div>
                    <Space>
                      <Tag color={getTypeColor(appointment.appointmentType)}>
                        {getTypeText(appointment.appointmentType)}
                      </Tag>
                    </Space>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Loại lịch hẹn">
                  <Tag color={getLocationColor(appointment.typeLocation)}>
                    <EnvironmentOutlined style={{ marginRight: '4px' }} />
                    {getLocationText(appointment.typeLocation)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày hẹn">
                  <CalendarOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                  {(() => {
                    const date = new Date(appointment.appointmentDate);
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}/${month}/${year}`;
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="Giờ hẹn">
                  <ClockCircleOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                  {appointment.appointmentTime}
                </Descriptions.Item>
                {appointment.address && (
                  <Descriptions.Item label="Địa chỉ cụ thể" span={2}>
                    <EnvironmentOutlined style={{ marginRight: '4px' }} />
                    {appointment.address}
                  </Descriptions.Item>
                )}
                {appointment.type === 'appointment' && (detailData as DetailData).serviceId?.price && (
                  <Descriptions.Item label="Giá dịch vụ">
                    <DollarOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                    {(detailData as DetailData).serviceId.price.toLocaleString('vi-VN')} VNĐ
                  </Descriptions.Item>
                )}
                {appointment.type === 'appointment' && (detailData as DetailData).packageId?.price && (
                  <Descriptions.Item label="Giá gói">
                    <DollarOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                    {(detailData as DetailData).packageId.price.toLocaleString('vi-VN')} VNĐ
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Thông tin chi tiết */}
            {(appointment.description || appointment.notes || 
              (appointment.type === 'consultation' && (detailData as DetailData).doctorNotes)) && (
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <EnvironmentOutlined style={{ color: '#52c41a' }} />
                    <span>Thông tin chi tiết</span>
                  </div>
                }
                size="small"
              >
                {appointment.description && (
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>
                      {appointment.type === 'consultation' ? 'Câu hỏi: ' : 'Mô tả: '}
                    </Text>
                    <Text>{appointment.description}</Text>
                  </div>
                )}
                
                {appointment.notes && (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f6ffed', 
                    borderRadius: '8px',
                    border: '1px solid #b7eb8f',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px', color: '#52c41a' }}>
                      Ghi chú:
                    </div>
                    <Text>{appointment.notes}</Text>
                  </div>
                )}

                {appointment.type === 'consultation' && (detailData as DetailData).doctorNotes && (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#e6f7ff', 
                    borderRadius: '8px',
                    border: '1px solid #91d5ff'
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px', color: '#1890ff' }}>
                      Ghi chú của bác sĩ:
                    </div>
                    <Text>{(detailData as DetailData).doctorNotes}</Text>
                  </div>
                )}
              </Card>
            )}
          </div>
        ),
      });
    } catch (error) {
      console.error('❌ [ERROR] Failed to show appointment details:', error);
      message.error('Không thể tải chi tiết cuộc hẹn');
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
            <Tag color={getTypeColor(record.appointmentType)}>
              {getTypeText(record.appointmentType)}
            </Tag>
            <Tag color={getLocationColor(record.typeLocation)}>
              {getLocationText(record.typeLocation)}
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
      width: 160,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => showAppointmentDetails(record)}
            />
          </Tooltip>
          
          {/* ✅ ENHANCED: Dynamic cancel/transfer actions theo type */}
          {renderCancelActions(record)}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Quản lý lịch hẹn
        </Title>
        <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
          Quản lý lịch hẹn khám bệnh và tư vấn trực tuyến của bác sĩ
        </p>
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
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: 130 }}
            >
              <Option value="all">Tất cả loại</Option>
              <Option value="consultation">Tư vấn</Option>
              <Option value="test">Xét nghiệm</Option>
              <Option value="online-consultation">Tư vấn online</Option>
              <Option value="other">Khác</Option>
            </Select>
            <Select
              value={selectedLocation}
              onChange={setSelectedLocation}
              style={{ width: 130 }}
            >
              <Option value="all">Tất cả địa điểm</Option>
              <Option value="clinic">Phòng khám</Option>
              <Option value="Online">Trực tuyến</Option>
            </Select>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 150 }}
            >
              <Option value="all">Tất cả trạng thái</Option>
              {/* ✅ SIMPLIFIED STATUS OPTIONS */}
              <Option value="pending_payment">Chờ thanh toán</Option>
              <Option value="scheduled">Đã lên lịch</Option>
              <Option value="consulting">Đang tư vấn</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
            <DatePicker
              placeholder="Chọn ngày"
              onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : 'all')}
              style={{ width: 130 }}
            />
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
    </div>
  );
};

export default AppointmentManagement;