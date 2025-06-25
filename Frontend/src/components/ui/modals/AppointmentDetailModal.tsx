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
  message,
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
import appointmentManagementService from '../../../api/services/appointmentManagementService';
import { appointmentApi } from '../../../api/endpoints/appointment';
import MedicalRecordModal, { MedicalRecordFormData } from '../forms/MedicalRecordModal';
import medicalApi from '../../../api/endpoints/medical';
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

interface DetailData {
  profileId?: { gender?: 'male' | 'female' | 'other'; year?: number | string };
  serviceId?: { price?: number };
  packageId?: { price?: number };
  doctorNotes?: string;
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
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [medicalRecordModalVisible, setMedicalRecordModalVisible] = useState(false);

  // Check record status when appointment changes
  useEffect(() => {
    if (appointment && visible) {
      checkRecordStatus(appointment._id);
    }
  }, [appointment, visible]);

  const checkRecordStatus = async (appointmentId: string) => {
    setRecordStatus(prev => ({ ...prev, loading: true }));
    
    try {
      // ✅ FIX: Gọi trực tiếp từ appointmentApi thay vì qua service layer
      const [medicalResponse, testResponse] = await Promise.all([
        medicalApi.checkMedicalRecordByAppointment(appointmentId),
        appointmentApi.checkTestResultExists(appointmentId) // Fixed: checkTestResultExists instead of checkTestResultsExists
      ]);

      console.log('🏥 Medical record check:', medicalResponse.data);
      console.log('🧪 Test result check:', testResponse.data);

      setRecordStatus({
        hasMedicalRecord: medicalResponse.data?.exists || false,
        hasTestResults: testResponse.data?.exists || false,
        loading: false
      });

    } catch (error) {
      console.error('❌ Error checking record status:', error);
      setRecordStatus({
        hasMedicalRecord: false,
        hasTestResults: false,
        loading: false
      });
    }
  };

  // Load detail data từ API thật
  const loadDetailData = async () => {
    try {
      if (!appointment) return;
      
      // ✅ SỬ DỤNG REAL API để load chi tiết appointment
      const data = await appointmentManagementService.getAppointmentDetail(
        appointment._id, 
        appointment.type
      );
      
      if (data) {
        // Transform API data to DetailData format
        const detailData: DetailData = {
          profileId: 'profileId' in data ? (data as any).profileId || undefined : undefined,
          serviceId: 'serviceId' in data ? (data as any).serviceId || undefined : undefined,
          packageId: 'packageId' in data ? (data as any).packageId || undefined : undefined,
          doctorNotes: 'doctorNotes' in data ? (data as any).doctorNotes || (data as any).notes || undefined : undefined
        };  
        
        setDetailData(detailData);
        console.log('✅ [API] Loaded appointment detail data:', detailData);
      } else {
        setDetailData(null);
        console.log('⚠️ [API] No detail data found for appointment:', appointment._id);
      }
      
    } catch (error) {
      console.error('❌ [API] Failed to load detail data:', error);
      setDetailData(null);
      
      // Don't show error message to user as this is supplementary data
      console.warn('Detail data unavailable, using basic appointment info only');
    }
  };

  useEffect(() => {
    if (visible && appointment) {
      loadDetailData();
    } else {
      // Reset state when modal closes
      setRecordStatus({
        hasMedicalRecord: false,
        hasTestResults: false,
        loading: false
      });
      setDetailData(null);
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
    console.log('🔍 [DEBUG] shouldShowActionButtons called with:', {
      userRole,
      appointment: appointment ? {
        _id: appointment._id,
        appointmentType: appointment.appointmentType,
        status: appointment.status,
        type: appointment.type
      } : null
    });

    if (userRole !== 'staff') {
      console.log('🚫 [UI] No buttons - User role is not staff:', userRole);
      return false;
    }
    if (!appointment) {
      console.log('🚫 [UI] No buttons - No appointment data');
      return false;
    }
    
    // ✅ FIX: Staff có thể thấy nút cho tất cả appointment types, không chỉ consultation
    // Chỉ giới hạn theo status để đảm bảo appointment đã confirmed/completed
    const allowedStatuses = ['confirmed', 'consulting', 'completed'];
    const isValidStatus = allowedStatuses.includes(appointment.status);
    
    console.log('🎯 [UI] Button visibility check:', {
      appointmentId: appointment._id,
      appointmentType: appointment.appointmentType,
      status: appointment.status,
      userRole: userRole,
      isValidStatus,
      shouldShowButtons: isValidStatus
    });
    
    return isValidStatus;
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
      setMedicalRecordModalVisible(true);
    }
  };

  const handleMedicalRecordSubmit = async (medicalRecordData: MedicalRecordFormData): Promise<boolean> => {
    try {
      console.log('🏥 [MEDICAL] Creating medical record:', medicalRecordData);
      
      // Call API to create medical record
      const response = await medicalApi.createMedicalRecord({
        profileId: medicalRecordData.profileId,
        appointmentId: medicalRecordData.appointmentId,
        diagnosis: medicalRecordData.diagnosis,
        symptoms: medicalRecordData.symptoms || '',
        treatment: medicalRecordData.treatment,
        notes: medicalRecordData.notes || ''
      });

      if (response.status === 201 || response.status === 200) {
        console.log('✅ [MEDICAL] Medical record created successfully');
        
        // Update record status to reflect the new medical record
        setRecordStatus(prev => ({
          ...prev,
          hasMedicalRecord: true
        }));
        
        // Close modal
        setMedicalRecordModalVisible(false);
        
        return true;
      } else {
        console.error('❌ [MEDICAL] Failed to create medical record:', response);
        return false;
      }
    } catch (error) {
      console.error('❌ [MEDICAL] Error creating medical record:', error);
      return false;
    }
  };

  const handleMedicalRecordCancel = () => {
    setMedicalRecordModalVisible(false);
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
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderActionButtons = () => {
    console.log('🔍 [DEBUG] renderActionButtons called');
    
    if (!shouldShowActionButtons()) {
      console.log('🚫 [DEBUG] shouldShowActionButtons returned false, no buttons will render');
      return null;
    }

    // ✅ FIX: Staff luôn có thể tạo medical record cho bất kỳ appointment type nào
    // Test record chỉ cho appointment type 'test'
    const showMedicalButton = true; // Staff luôn có thể tạo bệnh án
    const showTestButton = appointment?.appointmentType === 'test';

    console.log('🎯 [DEBUG] Button rendering logic:', {
      appointmentType: appointment?.appointmentType,
      showMedicalButton,
      showTestButton,
      hasMedicalRecord: recordStatus.hasMedicalRecord,
      hasTestResults: recordStatus.hasTestResults,
      loading: recordStatus.loading
    });

    return (
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Space>
          {showMedicalButton && (
            <>
              {recordStatus.hasMedicalRecord ? (
                <Button
                  type="default"
                  icon={<MedicineBoxOutlined />}
                  onClick={() => appointment && onViewMedicalRecord?.(appointment)}
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
                  onClick={() => appointment && onViewTestRecord?.(appointment)}
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
                {detailData?.profileId?.gender && (
                  <Descriptions.Item label="Giới tính">
                    {detailData.profileId.gender === 'male' ? 'Nam' : 
                     detailData.profileId.gender === 'female' ? 'Nữ' : 'Khác'}
                  </Descriptions.Item>
                )}
                {detailData?.profileId?.year && (
                  <Descriptions.Item label="Năm sinh">
                    {detailData.profileId.year}
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
                  {appointment.serviceName || 'Dịch vụ không xác định'}
                </div>
                <Space>
                  <Tag color={getTypeColor(appointment.appointmentType)}>
                    {getTypeText(appointment.appointmentType)}
                  </Tag>
                </Space>
                {appointment.serviceType && appointment.serviceType !== 'other' && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginTop: '4px',
                    fontStyle: 'italic'
                  }}>
                    Loại dịch vụ: {appointment.serviceType}
                  </div>
                )}
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
              {formatDate(appointment.appointmentDate)}
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
            {detailData?.serviceId?.price && (
              <Descriptions.Item label="Giá dịch vụ">
                <DollarOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                {detailData.serviceId.price.toLocaleString('vi-VN')} VNĐ
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Thông tin chi tiết */}
        {(appointment.description || appointment.notes || detailData?.doctorNotes) && (
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
                  {appointment.type === 'consultation' ? 'Câu hỏi tư vấn: ' : 'Mô tả gói dịch vụ: '}
                </Text>
                <div style={{ 
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  lineHeight: '1.6'
                }}>
                  <Text>{appointment.description}</Text>
                </div>
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

            {detailData?.doctorNotes && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#e6f7ff', 
                borderRadius: '8px',
                border: '1px solid #91d5ff'
              }}>
                <div style={{ fontWeight: 500, marginBottom: '4px', color: '#1890ff' }}>
                  Ghi chú của bác sĩ:
                </div>
                <Text>{detailData.doctorNotes}</Text>
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

      {/* Medical Record Modal */}
      <MedicalRecordModal
        visible={medicalRecordModalVisible}
        appointment={appointment}
        onCancel={handleMedicalRecordCancel}
        onSubmit={handleMedicalRecordSubmit}
      />
    </Modal>
  );
};

export default AppointmentDetailModal; 