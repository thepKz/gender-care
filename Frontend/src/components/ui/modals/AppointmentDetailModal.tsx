import {
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  InfoCircleOutlined,
  MedicineBoxOutlined,
  PhoneOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Typography
} from 'antd';
import React, { useEffect, useState } from 'react';
import { appointmentApi } from '../../../api/endpoints/appointment';
import medicalApi from '../../../api/endpoints/medical';
import { UnifiedAppointment } from '../../../types/appointment';
import MedicalRecordModal, { MedicalRecordFormData } from '../forms/MedicalRecordModal';
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
  onCreateMedicalRecord, // eslint-disable-line @typescript-eslint/no-unused-vars
  onViewTestRecord,
  onViewMedicalRecord
}) => {
  const [recordStatus, setRecordStatus] = useState<RecordStatus>({
    hasMedicalRecord: false,
    hasTestResults: false,
    loading: false
  });
  const [medicalRecordModalVisible, setMedicalRecordModalVisible] = useState(false);

  // Check record status when appointment changes
  useEffect(() => {
    if (appointment && visible) {
      checkRecordStatus(appointment._id);
    }
  }, [appointment, visible]);

  const checkRecordStatus = async (appointmentId: string) => {
    try {
      setRecordStatus(prev => ({ ...prev, loading: true }));
      
      // Check medical record
      const medicalResponse = await medicalApi.getMedicalRecordsByAppointment(appointmentId);
      const hasMedicalRecord = medicalResponse.data && medicalResponse.data.length > 0;
      
      // Check test results
      const testResponse = await appointmentApi.checkTestResultsByAppointment(appointmentId);
      const hasTestResults = testResponse.data && testResponse.data.exists;
      
      setRecordStatus({
        hasMedicalRecord,
        hasTestResults,
        loading: false
      });
      

    } catch (error) {
      console.error('❌ [Record Status] Error checking records:', error);
      setRecordStatus(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (visible && appointment) {
      // ✅ SIMPLIFIED: Không cần load thêm data, dùng data có sẵn từ list
  
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
      payment_cancelled: 'red',
      expired: 'red',
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
      payment_cancelled: 'Hủy thanh toán',
      expired: 'Hết hạn',
      // Legacy support
      paid: 'Đã thanh toán'
    };
    return texts[status] || status;
  };

  // Check if appointment is paid but cancelled (highlight with yellow)
  const isPaidButCancelled = () => {
    // ✅ UPDATED: Bao gồm các appointment có refund request 
    return (appointment?.status === 'cancelled' || appointment?.status === 'expired') && 
           (appointment?.paymentStatus === 'paid' || 
            appointment?.paymentStatus === 'refunded' ||
            appointment?.paymentStatus === 'expired' ||
            appointment?.refund?.refundInfo); // Có yêu cầu hoàn tiền
  };

  // Get enhanced status color with yellow highlight for paid but cancelled
  const getEnhancedStatusColor = (status: string) => {
    if (isPaidButCancelled()) {
      return 'gold'; // Yellow highlight for paid but cancelled appointments
    }
    
    // Check for expired payment status
    if (appointment?.status === 'expired' && appointment?.paymentStatus === 'expired') {
      return 'red'; // Red for expired payment status
    }
    
    return getStatusColor(status);
  };

  // Get enhanced status text with payment info
  const getEnhancedStatusText = (status: string) => {
    if (isPaidButCancelled()) {
      if (appointment?.status === 'expired') {
        return 'Đã thanh toán - Hết hạn';
      }
      return 'Đã thanh toán - Đã hủy';
    }
    
    // Check for expired payment status
    if (appointment?.status === 'expired' && appointment?.paymentStatus === 'expired') {
      return 'Đã quá hạn thanh toán';
    }
    
    return getStatusText(status);
  };

  // Check refund eligibility
  const isRefundEligible = () => {
    if (!appointment) return false;
    
    // ✅ UPDATED: Eligible nếu đã thanh toán và đã hủy/hết hạn, hoặc đã có yêu cầu hoàn tiền
    return (appointment.status === 'cancelled' || appointment.status === 'expired') && 
           (appointment.paymentStatus === 'paid' || 
            appointment.paymentStatus === 'refunded' ||
            appointment.paymentStatus === 'expired' ||
            appointment.refund?.refundInfo);
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

      return false;
    }
    if (!appointment) {

      return false;
    }
    
    // ✅ FIX: Staff có thể thấy nút cho tất cả appointment types, không chỉ consultation
    // Chỉ giới hạn theo status để đảm bảo appointment đã confirmed/completed
    const allowedStatuses = ['confirmed', 'consulting', 'completed'];
    const isValidStatus = allowedStatuses.includes(appointment.status);
    

    
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

      
      // Call API to create medical record
      const response = await medicalApi.createMedicalRecord({
        profileId: medicalRecordData.profileId,
        appointmentId: medicalRecordData.appointmentId,
        conclusion: medicalRecordData.conclusion,
        symptoms: medicalRecordData.symptoms || '',
        treatment: medicalRecordData.treatment,
        notes: medicalRecordData.notes || ''
      });

      if (response.status === 201 || response.status === 200) {

        
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

  // Phân tích cancellationReason để tách notes và lý do hủy
  const parseNotes = (cancellationReason: string): { reason: string, note: string } => {
    if (!cancellationReason) return { reason: '', note: '' };
    
    const noteMatch = cancellationReason.match(/Note:\s*(.*)$/);
    if (noteMatch) {
      const note = noteMatch[1].trim();
      const reason = cancellationReason.replace(/\s*Note:\s*.*$/, '').trim();
      return { reason, note };
    }
    
    return { reason: cancellationReason, note: '' };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'Chưa có thông tin';
    }
    
    try {
      const date = new Date(dateString);
      
      // Kiểm tra date có hợp lệ không
      if (isNaN(date.getTime())) {
        return dateString; // Trả về original string nếu không parse được
      }
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const formatted = `${day}/${month}/${year}`;
      
      return formatted;
    } catch (error) {
      console.error('❌ [ERROR] Date formatting error:', error);
      return dateString; // Fallback to original string
    }
  };

  const renderActionButtons = () => {
    if (!shouldShowActionButtons()) {
      return null;
    }

    // ✅ FIX: Staff luôn có thể tạo medical record cho bất kỳ appointment type nào
    // Test record chỉ cho appointment type 'test'
    const showMedicalButton = true; // Staff luôn có thể tạo bệnh án
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
                  <Tag 
                    color={getEnhancedStatusColor(appointment.status)}
                    style={isPaidButCancelled() ? { 
                      backgroundColor: '#fff7e6', 
                      borderColor: '#ffd666',
                      color: '#d48806'
                    } : {}}
                  >
                    {getEnhancedStatusText(appointment.status)}
                  </Tag>
                  {isPaidButCancelled() && (
                    <div style={{ 
                      marginTop: '4px', 
                      padding: '4px 8px', 
                      backgroundColor: '#fff7e6', 
                      border: '1px solid #ffd666',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#d48806'
                    }}>
                      {isRefundEligible() ? 
                        'Đủ điều kiện hoàn tiền' : 
                        'Không đủ điều kiện hoàn tiền'
                      }
                    </div>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái thanh toán">
                  <div>
                    <Tag color="green">
                      Đã thanh toán
                    </Tag>
                    {/* Hiển thị trạng thái hoàn tiền nếu có */}
                    {appointment.refund && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          Tracking hoàn tiền:
                        </div>
                        {(() => {
                          const refundStatus = appointment.refund?.processingStatus || 'pending';
                          

                          
                          const getRefundStatusColor = (status: string) => {
                            switch (status) {
                              case 'pending': return '#faad14';
                              case 'completed': return '#52c41a';
                              case 'rejected': return '#ff4d4f';
                              default: return '#d9d9d9';
                            }
                          };
                          const getRefundStatusText = (status: string) => {
                            switch (status) {
                              case 'pending': return 'Chờ xử lý';
                              case 'completed': return 'Đã hoàn tiền';
                              case 'rejected': return 'Từ chối hoàn tiền';
                              default: return 'Không xác định';
                            }
                          };
                          return (
                            <Tag color={getRefundStatusColor(refundStatus)}>
                              {getRefundStatusText(refundStatus)}
                            </Tag>
                          );
                        })()}
                        {appointment.refund?.processedAt && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#999', 
                            marginTop: '4px' 
                          }}>
                            Cập nhật: {formatDate(appointment.refund.processedAt)}
                          </div>
                        )}
                        {appointment.refund?.refundReason && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#666', 
                            marginTop: '4px',
                            fontStyle: 'italic'
                          }}>
                            Lý do: {appointment.refund.refundReason}
                          </div>
                        )}
                        {appointment.refund?.processingNotes && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#666', 
                            marginTop: '4px',
                            fontStyle: 'italic'
                          }}>
                            Ghi chú: {appointment.refund.processingNotes}
                          </div>
                        )}
                        {appointment.refund?.refundInfo && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#666', 
                            marginTop: '6px',
                            padding: '6px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '4px'
                          }}>
                            <div><strong>Thông tin hoàn tiền:</strong></div>
                            <div>Ngân hàng: {appointment.refund.refundInfo.bankName}</div>
                            <div>Tài khoản: {appointment.refund.refundInfo.accountNumber}</div>
                            <div>Chủ TK: {appointment.refund.refundInfo.accountHolderName}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                  {appointment.serviceName || 'Dịch vụ không xác định'}
                </div>
                <Space>
                  <Tag color={getTypeColor(appointment.appointmentType || 'other')}>
                    {getTypeText(appointment.appointmentType || 'other')}
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
            
            {appointment.notes && (() => {
              const { reason, note } = parseNotes(appointment.notes);
              
              return (
                <>
                  {/* Ghi chú gốc */}
                  {reason && (
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
                      <Text>{reason}</Text>
                    </div>
                  )}
                  
                  {/* Lý do hủy - chỉ hiển thị cho appointment đã hủy */}
                  {note && appointment.status === 'cancelled' && (
                    <div style={{ 
                      padding: '12px', 
                      backgroundColor: '#fff2f0', 
                      borderRadius: '8px',
                      border: '1px solid #ffccc7',
                      marginBottom: '12px'
                    }}>
                      <div style={{ fontWeight: 500, marginBottom: '4px', color: '#cf1322' }}>
                        Lý do hủy lịch hẹn:
                      </div>
                      <Text style={{ color: '#cf1322', fontStyle: 'italic' }}>
                        {note}
                      </Text>
                    </div>
                  )}
                </>
              );
            })()}

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