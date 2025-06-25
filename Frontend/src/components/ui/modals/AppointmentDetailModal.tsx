import React, { useState, useEffect } from 'react';
import {
  Modal,
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Avatar,
  Descriptions,
  Row,
  Col,
  Spin
} from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  PhoneOutlined,
  ExperimentOutlined,
  MedicineBoxOutlined,
  InfoCircleOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { UnifiedAppointment } from '../../../types/appointment';
// import apiClient from '../../../api/axiosConfig'; // 🚫 COMMENTED FOR MOCK TESTING

const { Text } = Typography;

interface AppointmentDetailModalProps {
  visible: boolean;
  appointment: UnifiedAppointment | null;
  userRole: string;
  onCancel: () => void;
  onCreateTestRecord: (appointment: UnifiedAppointment) => void;
  onCreateMedicalRecord: (appointment: UnifiedAppointment) => void;
  onViewTestRecord?: (appointment: UnifiedAppointment) => void;
  onViewMedicalRecord?: (appointment: UnifiedAppointment) => void;
}

interface RecordStatus {
  hasMedicalRecord: boolean;
  hasTestResults: boolean;
  loading: boolean;
}

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  visible,
  appointment,
  userRole,
  onCancel,
  onCreateTestRecord,
  onCreateMedicalRecord,
  onViewTestRecord,
  onViewMedicalRecord
}) => {
  const [recordStatus, setRecordStatus] = useState<RecordStatus>({
    hasMedicalRecord: false,
    hasTestResults: false,
    loading: false
  });

  // Check record status when appointment changes
  useEffect(() => {
    if (appointment && visible) {
      checkRecordStatus(appointment._id);
    }
  }, [appointment, visible]);

  const checkRecordStatus = async (appointmentId: string) => {
    setRecordStatus(prev => ({ ...prev, loading: true }));
    
    // 🔍 DEBUG: Log appointmentId để kiểm tra
    console.log('🔍 [DEBUG] Checking record status for appointmentId:', appointmentId);
    
    try {
      // ⚠️ TEMPORARY: Tạm thời tắt API call vì backend chưa có endpoint medical-records/check
      // Sẽ bật lại khi backend đã implement đầy đủ
      
      // ✅ SIMPLE MOCK: Tạm thời dùng mock data để tránh lỗi
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simple mock - không dựa vào appointmentId string methods để tránh lỗi
      const mockMedicalExists = Math.random() > 0.7; // 30% chance có medical record
      const mockTestExists = Math.random() > 0.8;    // 20% chance có test results
      
      setRecordStatus({
        hasMedicalRecord: mockMedicalExists,
        hasTestResults: mockTestExists,
        loading: false
      });
      
      console.log('🧪 [MOCK] Record status for', appointmentId, ':', {
        hasMedicalRecord: mockMedicalExists,
        hasTestResults: mockTestExists
      });
      
    } catch (error) {
      console.error('❌ [ERROR] Failed to check record status:', error);
      setRecordStatus({
        hasMedicalRecord: false,
        hasTestResults: false,
        loading: false
      });
    }
  };

  useEffect(() => {
    if (visible && appointment) {
      // ✅ SIMPLIFIED: Không cần load thêm data, dùng data có sẵn từ list
      console.log('✅ [DETAIL] Using data from list:', appointment);
    } else {
      // Reset state when modal closes
      setRecordStatus({
        hasMedicalRecord: false,
        hasTestResults: false,
        loading: false
      });
    }
  }, [visible, appointment]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_payment: 'gold',
      pending: 'orange',
      scheduled: 'purple',
      confirmed: 'blue',
      consulting: 'lime',
      completed: 'green',
      cancelled: 'red',
      // Legacy support
      paid: 'cyan'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending_payment: 'Chờ thanh toán',
      pending: 'Chờ xác nhận',
      scheduled: 'Đã lên lịch',
      confirmed: 'Đã xác nhận',
      consulting: 'Đang tư vấn',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      // Legacy support
      paid: 'Đã thanh toán'
    };
    return texts[status] || status;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      consultation: 'blue',
      test: 'green',
      'online-consultation': 'cyan',
      other: 'purple'
    };
    return colors[type] || 'purple';
  };

  const getTypeText = (type: string) => {
    const texts: Record<string, string> = {
      consultation: 'Tư vấn',
      test: 'Xét nghiệm',
      'online-consultation': 'Tư vấn online',
      other: 'Khác'
    };
    return texts[type] || 'Khác';
  };

  const getLocationColor = (location: string) => {
    const colors: Record<string, string> = {
      clinic: 'volcano',
      home: 'cyan',
      Online: 'geekblue'
    };
    return colors[location] || 'default';
  };

  const getLocationText = (location: string) => {
    const texts: Record<string, string> = {
      clinic: 'Phòng khám',
      Online: 'Trực tuyến',
      home: 'Tại nhà'
    };
    return texts[location] || location;
  };

  // Check if staff should see the action buttons
  const shouldShowActionButtons = () => {
    if (userRole !== 'staff') {
      console.log('🚫 [UI] No buttons - User role is not staff:', userRole);
      return false;
    }
    if (!appointment) {
      console.log('🚫 [UI] No buttons - No appointment data');
      return false;
    }
    
    // ✅ CORRECTED: Only show when status = 'consulting' (when doctor is examining)
    const shouldShow = appointment.status === 'consulting';
    console.log('🎯 [UI] Button visibility check:', {
      appointmentId: appointment._id,
      appointmentType: appointment.appointmentType,
      status: appointment.status,
      userRole: userRole,
      shouldShowButtons: shouldShow
    });
    
    return shouldShow;
  };

  // Check if test record button should be shown
  const shouldShowTestRecordButton = () => {
    if (!shouldShowActionButtons()) return false;
    return appointment?.appointmentType === 'test';
  };

  const handleCreateTestRecord = () => {
    if (appointment) {
      onCreateTestRecord(appointment);
    }
  };

  const handleCreateMedicalRecord = () => {
    if (appointment) {
      onCreateMedicalRecord(appointment);
    }
  };

  const handleViewTestRecord = () => {
    if (appointment && onViewTestRecord) {
      onViewTestRecord(appointment);
    }
  };

  const handleViewMedicalRecord = () => {
    if (appointment && onViewMedicalRecord) {
      onViewMedicalRecord(appointment);
    }
  };

  const formatDate = (dateString: string) => {
    // 🔍 DEBUG: Log input để kiểm tra format
    console.log('🔍 [DEBUG] Format date input:', dateString);
    
    if (!dateString) {
      console.log('⚠️ [WARN] Empty date string');
      return 'Chưa có thông tin';
    }
    
    try {
      const date = new Date(dateString);
      
      // Kiểm tra date có hợp lệ không
      if (isNaN(date.getTime())) {
        console.log('⚠️ [WARN] Invalid date:', dateString);
        return dateString; // Trả về original string nếu không parse được
      }
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const formatted = `${day}/${month}/${year}`;
      
      console.log('✅ [DEBUG] Date formatted:', { input: dateString, output: formatted });
      return formatted;
    } catch (error) {
      console.error('❌ [ERROR] Date formatting error:', error);
      return dateString; // Fallback to original string
    }
  };

  const renderActionButtons = () => {
    if (!shouldShowActionButtons()) return null;

    const showMedicalButton = appointment?.appointmentType === 'consultation';
    const showTestButton = appointment?.appointmentType === 'test';

    return (
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Space>
          {showMedicalButton && (
            <>
              {recordStatus.hasMedicalRecord ? (
                <Button
                  type="default"
                  icon={<MedicineBoxOutlined />}
                  onClick={handleViewMedicalRecord}
                  loading={recordStatus.loading}
                  size="large"
                  style={{ marginRight: 8 }}
                >
                  Xem bệnh án
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<MedicineBoxOutlined />}
                  onClick={handleCreateMedicalRecord}
                  disabled={recordStatus.loading}
                  loading={recordStatus.loading}
                  size="large"
                >
                  Tạo bệnh án
                </Button>
              )}
            </>
          )}
          
          {showTestButton && (
            <>
              {recordStatus.hasTestResults ? (
                <Button
                  type="default"
                  icon={<FileSearchOutlined />}
                  onClick={handleViewTestRecord}
                  loading={recordStatus.loading}
                  size="large"
                  style={{ marginRight: 8 }}
                >
                  Xem kết quả xét nghiệm
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<FileSearchOutlined />}
                  onClick={handleCreateTestRecord}
                  disabled={recordStatus.loading}
                  loading={recordStatus.loading}
                  size="large"
                >
                  Tạo đăng ký xét nghiệm
                </Button>
              )}
            </>
          )}
        </Space>
      </div>
    );
  };

  if (!appointment) return null;

  // 🔍 DEBUG: Log toàn bộ appointment data để debug
  console.log('🔍 [DEBUG] AppointmentDetailModal received appointment:', {
    id: appointment._id,
    patientName: appointment.patientName,
    serviceName: appointment.serviceName,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    appointmentType: appointment.appointmentType,
    typeLocation: appointment.typeLocation,
    status: appointment.status,
    type: appointment.type,
    fullData: appointment
  });

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#e6f7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CalendarOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
              Chi tiết {appointment.type === 'consultation' ? 'tư vấn trực tuyến' : 'lịch hẹn'}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
              Thông tin đầy đủ về cuộc hẹn
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={[
        <Button key="cancel" size="large" onClick={onCancel}>
          Đóng
        </Button>
      ]}
      styles={{
        footer: {
          textAlign: 'right',
          paddingTop: '20px',
          borderTop: '1px solid #f0f0f0'
        }
      }}
    >
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
                {/* ✅ SIMPLIFIED: Lấy thông tin từ originalData nếu có */}
                {appointment.originalData && 'profileId' in appointment.originalData && (
                  <>
                    {appointment.originalData.profileId?.gender && (
                      <Descriptions.Item label="Giới tính">
                        {appointment.originalData.profileId.gender === 'male' ? 'Nam' : 
                         appointment.originalData.profileId.gender === 'female' ? 'Nữ' : 'Khác'}
                      </Descriptions.Item>
                    )}
                    {appointment.originalData.profileId?.year && (
                      <Descriptions.Item label="Năm sinh">
                        {appointment.originalData.profileId.year}
                      </Descriptions.Item>
                    )}
                  </>
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
                  {/* ✅ FIX: Dùng serviceName từ transformed data */}
                  {appointment.serviceName || 'Chưa có thông tin dịch vụ'}
                </div>
                <Space>
                  <Tag color={getTypeColor(appointment.appointmentType || 'other')}>
                    {getTypeText(appointment.appointmentType || 'other')}
                  </Tag>
                </Space>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Loại lịch hẹn">
              <Tag color={getLocationColor(appointment.typeLocation || 'clinic')}>
                <EnvironmentOutlined style={{ marginRight: '4px' }} />
                {getLocationText(appointment.typeLocation || 'clinic')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hẹn">
              <CalendarOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
              {formatDate(appointment.appointmentDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ hẹn">
              <ClockCircleOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
              {appointment.appointmentTime || 'Chưa có thông tin'}
            </Descriptions.Item>
            {appointment.address && (
              <Descriptions.Item label="Địa chỉ cụ thể" span={2}>
                <EnvironmentOutlined style={{ marginRight: '4px' }} />
                {appointment.address}
              </Descriptions.Item>
            )}
            {/* ✅ FIX: Hiển thị giá từ originalData nếu có */}
            {appointment.originalData && 'serviceId' in appointment.originalData && 
             appointment.originalData.serviceId?.price && (
              <Descriptions.Item label="Giá dịch vụ">
                <DollarOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                {appointment.originalData.serviceId.price.toLocaleString('vi-VN')} VNĐ
              </Descriptions.Item>
            )}
            {appointment.originalData && 'packageId' in appointment.originalData && 
             appointment.originalData.packageId?.price && (
              <Descriptions.Item label="Giá gói dịch vụ">
                <DollarOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                {appointment.originalData.packageId.price.toLocaleString('vi-VN')} VNĐ
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Thông tin chi tiết */}
        {(appointment.description || appointment.notes) && (
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <InfoCircleOutlined style={{ color: '#52c41a' }} />
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

            {/* ✅ FIX: Hiển thị doctorNotes từ originalData */}
            {appointment.originalData && 'doctorNotes' in appointment.originalData && 
             appointment.originalData.doctorNotes && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#e6f7ff', 
                borderRadius: '8px',
                border: '1px solid #91d5ff'
              }}>
                <div style={{ fontWeight: 500, marginBottom: '4px', color: '#1890ff' }}>
                  Ghi chú của bác sĩ:
                </div>
                <Text>{appointment.originalData.doctorNotes}</Text>
              </div>
            )}
          </Card>
        )}

        {/* Staff record status info */}
        {shouldShowActionButtons() && (
          <Card
            size="small"
            style={{ 
              marginTop: '16px',
              backgroundColor: '#fafafa',
              border: '1px dashed #d9d9d9'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '8px'
            }}>
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: 500, color: '#1890ff' }}>
                Trạng thái hồ sơ
              </span>
              {recordStatus.loading && <Spin size="small" />}
            </div>
            
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MedicineBoxOutlined style={{ 
                    color: recordStatus.hasMedicalRecord ? '#52c41a' : '#8c8c8c' 
                  }} />
                  <span style={{ 
                    color: recordStatus.hasMedicalRecord ? '#52c41a' : '#8c8c8c',
                    fontSize: '13px'
                  }}>
                    Hồ sơ bệnh án: {recordStatus.hasMedicalRecord ? 'Đã tạo' : 'Chưa tạo'}
                  </span>
                </div>
              </Col>
              {shouldShowTestRecordButton() && (
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ExperimentOutlined style={{ 
                      color: recordStatus.hasTestResults ? '#52c41a' : '#8c8c8c' 
                    }} />
                    <span style={{ 
                      color: recordStatus.hasTestResults ? '#52c41a' : '#8c8c8c',
                      fontSize: '13px'
                    }}>
                      Kết quả xét nghiệm: {recordStatus.hasTestResults ? 'Đã có' : 'Chưa có'}
                    </span>
                  </div>
                </Col>
              )}
            </Row>
          </Card>
        )}

        {renderActionButtons()}
      </div>
    </Modal>
  );
};

export default AppointmentDetailModal; 