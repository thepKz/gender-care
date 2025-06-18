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
  Popconfirm,
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
  CheckCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { UnifiedAppointment, AppointmentFilters } from '../../../types/appointment';
import appointmentManagementService from '../../../api/services/appointmentManagementService';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

// Use UnifiedAppointment interface from API types
type Appointment = UnifiedAppointment;



const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(''); // Client-side search since API doesn't support search
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');

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
      
    } catch (err: any) {
      console.error('❌ [ERROR] Failed to load appointments:', err);
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

  const getStatusColor = (status: Appointment['status']) => {
    const colors = {
      pending: 'orange',
      pending_payment: 'gold',
      paid: 'cyan',
      confirmed: 'blue',
      scheduled: 'purple',
      consulting: 'lime',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status];
  };

  const getStatusText = (status: Appointment['status']) => {
    const texts = {
      pending: 'Chờ xác nhận',
      pending_payment: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      confirmed: 'Đã xác nhận',
      scheduled: 'Đã lên lịch',
      consulting: 'Đang tư vấn',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return texts[status];
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
      home: 'Tại nhà',
      Online: 'Trực tuyến'
    };
    return texts[location];
  };

  const handleDelete = async (appointmentId: string, appointmentType: 'appointment' | 'consultation') => {
    try {
      const success = await appointmentManagementService.cancelAppointment(appointmentId, appointmentType);
      
      if (success) {
        // Remove from local state
        setAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
        message.success('Hủy cuộc hẹn thành công');
      } else {
        message.error('Hủy cuộc hẹn thất bại');
      }
    } catch (err: any) {
      console.error('❌ [ERROR] Failed to cancel appointment:', err);
      message.error('Hủy cuộc hẹn thất bại');
    }
  };

  const handleStatusChange = async (
    appointmentId: string, 
    newStatus: Appointment['status'], 
    appointmentType: 'appointment' | 'consultation'
  ) => {
    try {
      const success = await appointmentManagementService.confirmAppointment(
        appointmentId, 
        appointmentType
      );
      
      if (success) {
        // Update local state
        setAppointments(prev => 
          prev.map(apt => 
            apt._id === appointmentId ? { ...apt, status: newStatus } : apt
          )
        );
        message.success('Xác nhận lịch hẹn thành công');
      } else {
        message.error('Xác nhận lịch hẹn thất bại');
      }
    } catch (err: any) {
      console.error('❌ [ERROR] Failed to confirm appointment:', err);
      message.error('Xác nhận lịch hẹn thất bại');
    }
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
      message.error('Vui lòng nhập lý do bỏ lịch hẹn');
      return;
    }

    try {
      const success = await appointmentManagementService.cancelByDoctor(
        cancelAppointmentData.id,
        cancelAppointmentData.type,
        cancelReason.trim()
      );

      if (success) {
        // Update local state
        setAppointments(prev => 
          prev.map(apt => 
            apt._id === cancelAppointmentData.id ? { ...apt, status: 'cancelled' } : apt
          )
        );
        message.success('Bỏ lịch hẹn thành công');
        setCancelModalVisible(false);
        setCancelAppointmentData(null);
        setCancelReason('');
      } else {
        message.error('Bỏ lịch hẹn thất bại');
      }
    } catch (err: any) {
      console.error('❌ [ERROR] Failed to cancel appointment by doctor:', err);
      message.error('Bỏ lịch hẹn thất bại');
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
                    {appointment.type === 'appointment' && (detailData as any).profileId?.gender && (
                      <Descriptions.Item label="Giới tính">
                        {(detailData as any).profileId.gender === 'male' ? 'Nam' : 
                         (detailData as any).profileId.gender === 'female' ? 'Nữ' : 'Khác'}
                      </Descriptions.Item>
                    )}
                    {appointment.type === 'appointment' && (detailData as any).profileId?.year && (
                      <Descriptions.Item label="Năm sinh">
                        {(detailData as any).profileId.year}
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
                  {appointment.appointmentDate}
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
                {appointment.type === 'appointment' && (detailData as any).serviceId?.price && (
                  <Descriptions.Item label="Giá dịch vụ">
                    <DollarOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                    {(detailData as any).serviceId.price.toLocaleString('vi-VN')} VNĐ
                  </Descriptions.Item>
                )}
                {appointment.type === 'appointment' && (detailData as any).packageId?.price && (
                  <Descriptions.Item label="Giá gói">
                    <DollarOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                    {(detailData as any).packageId.price.toLocaleString('vi-VN')} VNĐ
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Thông tin chi tiết */}
            {(appointment.description || appointment.notes || 
              (appointment.type === 'consultation' && (detailData as any).doctorNotes)) && (
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

                {appointment.type === 'consultation' && (detailData as any).doctorNotes && (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#e6f7ff', 
                    borderRadius: '8px',
                    border: '1px solid #91d5ff'
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px', color: '#1890ff' }}>
                      Ghi chú của bác sĩ:
                    </div>
                    <Text>{(detailData as any).doctorNotes}</Text>
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
              {new Date(record.appointmentDate).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
              })}
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
      render: (status: Appointment['status']) => (
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
          {record.status === 'paid' && (
            <Tooltip title="Xác nhận">
              <Popconfirm
                title="Xác nhận lịch hẹn này?"
                onConfirm={() => handleStatusChange(record._id, 'confirmed', record.type)}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button 
                  type="text" 
                  icon={<CheckCircleOutlined />} 
                  size="small"
                  style={{ color: '#52c41a' }}
                />
              </Popconfirm>
            </Tooltip>
          )}
          {['paid', 'confirmed', 'scheduled', 'consulting'].includes(record.status) && (
            <Tooltip title="Bỏ lịch hẹn">
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small"
                danger
                onClick={() => showCancelModal(record)}
              >
                Bỏ lịch hẹn
              </Button>
            </Tooltip>
          )}
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
              <Option value="home">Tại nhà</Option>
              <Option value="Online">Trực tuyến</Option>
            </Select>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 150 }}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="pending_payment">Chờ thanh toán</Option>
              <Option value="paid">Đã thanh toán</Option>
              <Option value="confirmed">Đã xác nhận</Option>
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

        {/* Modal hủy lịch hẹn bởi bác sĩ */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DeleteOutlined style={{ color: '#ff4d4f' }} />
              <span>Bỏ lịch hẹn</span>
            </div>
          }
          open={cancelModalVisible}
          onOk={handleCancelByDoctor}
          onCancel={() => {
            setCancelModalVisible(false);
            setCancelAppointmentData(null);
            setCancelReason('');
          }}
          okText="Bỏ lịch hẹn"
          cancelText="Đóng"
          okButtonProps={{ danger: true }}
          width={500}
        >
          {cancelAppointmentData && (
            <div>
              <p style={{ marginBottom: '16px' }}>
                Bạn có chắc chắn muốn bỏ lịch hẹn của bệnh nhân{' '}
                <strong>{cancelAppointmentData.patientName}</strong>?
              </p>
              
              <div style={{ marginBottom: '8px' }}>
                <Text strong>Lý do bỏ lịch hẹn: <span style={{ color: '#ff4d4f' }}>*</span></Text>
              </div>
              
              <TextArea
                placeholder="Vui lòng nhập lý do bỏ lịch hẹn (bắt buộc)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                maxLength={500}
                showCount
                style={{ marginBottom: '16px' }}
              />
              
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#fff7e6', 
                borderRadius: '6px',
                border: '1px solid #ffd591',
                fontSize: '13px',
                color: '#ad6800'
              }}>
                <strong>Lưu ý:</strong> Lý do bỏ lịch sẽ được gửi cho bệnh nhân để họ hiểu tình hình. 
                Slot thời gian sẽ được giải phóng và có thể được đặt lại.
              </div>
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default AppointmentManagement;