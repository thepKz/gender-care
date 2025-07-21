import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Descriptions,
  Tag,
  message,
  Divider,
  Card,
  Row,
  Col,
  Checkbox,
  Alert
} from 'antd';
import {
  VideoCameraOutlined,
  EditOutlined,
  LinkOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SaveOutlined,
  PoweroffOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CameraOutlined,
  MessageOutlined,
  CopyOutlined
} from '@ant-design/icons';
import consultationApi from '../../../api/endpoints/consultation';
import { meetingAPI } from '../../../api/endpoints/meeting';
import ConsultationEndConfirmModal from './ConsultationEndConfirmModal';

const { TextArea } = Input;

interface MeetingNotesModalProps {
  visible: boolean;
  consultationId: string;
  consultationData: {
    patientName: string;
    patientPhone: string;
    appointmentTime: string;
    description: string;
  };
  onClose: () => void;
  onMeetingCompleted: () => void;
}

interface MeetingDetails {
  _id: string;
  meetingLink: string;
  status: string;
  notes?: string;
  maxParticipants: number;
  participantCount: number;
  scheduledTime: string;
  actualStartTime?: string;
  provider: string;
  meetingPassword?: string; // ➕ ADD: Password field
}

const MeetingNotesModal: React.FC<MeetingNotesModalProps> = ({
  visible,
  consultationId,
  consultationData,
  onClose,
  onMeetingCompleted
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // 🎥 Recording Confirmation Modal state
  const [recordingModalVisible, setRecordingModalVisible] = useState(false);
  const [recordingConfirmed, setRecordingConfirmed] = useState(false);

  // ➕ ADD: Consultation End Confirm Modal state  
  const [endConfirmVisible, setEndConfirmVisible] = useState(false);

  // ➕ ADD: Meeting password state
  const [meetingPassword, setMeetingPassword] = useState<string>('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // ➕ ADD: Send customer invite function
  const handleSendCustomerInvite = async () => {
    try {
      setInviteLoading(true);
      console.log('[MODAL-INVITE] Sending customer invite for consultation:', consultationId);
      
      const response = await meetingAPI.sendCustomerInvite(consultationId);
      
      message.success(`Đã gửi thư mời tham gia meeting cho ${consultationData.patientName}!`);
      console.log('Customer invite sent from modal:', response);
      
      // ✅ Reload meeting details để cập nhật UI với status mới
      await loadMeetingDetails();
      
    } catch (error: unknown) {
      console.error('Error sending customer invite from modal:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : 'Không thể gửi thư mời cho customer';
      
      // ✅ Sử dụng Modal.error để hiển thị đẹp hơn
      const fullErrorMessage = errorMessage || 'Không thể gửi thư mời cho customer';
      
      // Parse error message để format đẹp hơn
      if (fullErrorMessage.includes('⚠️ Bác sĩ cần chuẩn bị meeting')) {
        const lines = fullErrorMessage.split('\n').filter(line => line.trim());
        const steps = lines.slice(2, 6); // Lấy 4 bước chuẩn bị
        const status = lines[lines.length - 1];
        
        Modal.error({
          title: 'Cần chuẩn bị meeting trước',
          width: 500,
          content: (
            <div style={{ marginTop: '16px' }}>
              <Alert
                message="Bác sĩ cần hoàn thành các bước sau để gửi thư mời:"
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              <div style={{ marginBottom: '16px' }}>
                {steps.map((step, index) => (
                  <div key={index} style={{ 
                    marginBottom: '8px', 
                    padding: '8px 12px', 
                    background: '#f6ffed', 
                    border: '1px solid #b7eb8f',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}>
                    {step}
                  </div>
                ))}
              </div>
              <div style={{ 
                padding: '12px',
                background: '#fff1f0',
                border: '1px solid #ffccc7',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#cf1322'
              }}>
                {status}
              </div>
            </div>
          ),
          okText: 'Hiểu rồi',
          centered: true
        });
      } else {
        // Fallback cho các lỗi khác
        Modal.error({
          title: 'Không thể gửi thư mời',
          content: fullErrorMessage,
          okText: 'Đóng',
          centered: true
        });
      }
    } finally {
      setInviteLoading(false);
    }
  };

  // Load meeting details khi modal mở
  useEffect(() => {
    if (visible && consultationId) {
      // ✅ Reset form để đảm bảo notes field luôn trống
      form.resetFields();
      loadMeetingDetails();
    }
  }, [visible, consultationId]);

  const loadMeetingDetails = async () => {
    try {
      setLoadingDetails(true);
      console.log(`🔑 [MODAL-LOAD] Loading meeting details for consultation: ${consultationId}`);
      
      const response = await consultationApi.getMeetingDetails(consultationId);
      const details = response.data?.data;
      
      if (details) {
        setMeetingDetails(details);
        
        // ✅ FIX: Load cả notes và maxParticipants từ DB để user có thể edit tiếp
        const formValues: { maxParticipants: number; notes?: string } = {
          maxParticipants: details.maxParticipants || 2
        };
        
        // ✅ FIX: Chỉ set notes nếu có trong DB, nếu không có thì để trống
        if (details.notes && details.notes.trim()) {
          formValues.notes = details.notes;
          console.log('[LOAD-NOTES] Found existing notes, loading into form:', details.notes);
        } else {
          console.log('[LOAD-NOTES] No existing notes found, form will be empty');
        }
        
        form.setFieldsValue(formValues);

        // ➕ ADD: Load meeting password từ meeting API
        try {
          console.log(`[MODAL-LOAD] Loading password for consultation: ${consultationId}`);
          const meetingData = await meetingAPI.getMeetingByQA(consultationId);
          if (meetingData && meetingData.meetingPassword) {
            console.log(`[MODAL-LOAD] Password found: ${meetingData.meetingPassword}`);
            setMeetingPassword(meetingData.meetingPassword);
          } else {
            console.log(`[MODAL-LOAD] No password found in meeting data`);
          }
        } catch (passwordError) {
          console.error('[MODAL-LOAD] Error loading meeting password:', passwordError);
        }
      }
    } catch (error) {
      console.error('Error loading meeting details:', error);
      message.error('Không thể tải thông tin meeting');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      await consultationApi.updateMeetingNotes(consultationId, {
        notes: values.notes,
        maxParticipants: values.maxParticipants
      });
      
      message.success('Lưu ghi chú meeting thành công');
      
      // ✅ FIX: Reload meeting details để update UI với notes mới được lưu
      await loadMeetingDetails();
      
    } catch (error) {
      console.error('Error saving notes:', error);
      message.error('Không thể lưu ghi chú meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = () => {
    console.log('[JOIN-MEETING] Requesting to join meeting from MeetingNotesModal');
    
    // 🎥 Show recording confirmation modal first
    setRecordingConfirmed(false);
    setRecordingModalVisible(true);
  };

  // 🎥 Handle recording confirmation and actual meeting join
  const handleConfirmRecordingAndJoin = async () => {
    if (!recordingConfirmed) {
      message.warning('Vui lòng xác nhận đã hiểu về việc ghi hình buổi tư vấn');
      return;
    }

    try {
      console.log('[MODAL-DOCTOR-JOIN] Doctor joining meeting from modal, consultation:', consultationId);
      
      // ✅ FIRST: Call API to update meeting status
      const response = await meetingAPI.updateDoctorJoinStatus(consultationId);
      console.log('[MODAL-DOCTOR-JOIN] Meeting status updated:', response);
      
      // ✅ THEN: Open meeting link
      if (meetingDetails?.meetingLink) {
        window.open(meetingDetails.meetingLink, '_blank');
        message.success(`${response.message || 'Doctor đã tham gia meeting'}`);
        
        // ❌ REMOVED: Không reload để tránh load lại notes vào form
        // await loadMeetingDetails();
        
        // ✅ Close modal and reset state
        setRecordingModalVisible(false);
        setRecordingConfirmed(false);
      } else {
        message.error('Không tìm thấy link meeting');
      }
    } catch (error: unknown) {
      console.error('[MODAL-DOCTOR-JOIN] Error joining meeting:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : 'Không thể tham gia meeting. Vui lòng thử lại.';
      message.error(errorMessage || 'Không thể tham gia meeting. Vui lòng thử lại.');
    }
  };

  // 🎥 Handle recording modal close
  const handleRecordingModalClose = () => {
    setRecordingModalVisible(false);
    setRecordingConfirmed(false);
  };

  // ➕ ADD: Copy password function
  const handleCopyPassword = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      message.success(`Đã copy password: ${password}`);
    } catch (error) {
      console.warn('Clipboard API failed, using fallback:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = password;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      message.success(`Đã copy password: ${password}`);
    }
  };

  // ✅ UPDATED: Show confirmation modal instead of direct completion
  const handleCompleteMeeting = () => {
    console.log('[MEETING-COMPLETE] Requesting meeting completion for:', consultationId);
    setEndConfirmVisible(true);
  };

  // ➕ ADD: Handle actual completion after confirmation
  const handleConfirmEndMeeting = async () => {
    try {
      setLoading(true);
      
      // ✅ SIMPLIFIED: Chỉ lưu notes ở Meeting, không duplicate ở DoctorQA
      const values = form.getFieldsValue();
      console.log('[FORM-VALUES] Notes from form:', values.notes);
      
      // 1. Lưu notes vào Meeting (bắt buộc)
      if (values.notes && values.notes.trim()) {
        console.log('[SAVE-NOTES] Saving notes to meeting:', values.notes);
        await consultationApi.updateMeetingNotes(consultationId, {
          notes: values.notes
        });
        console.log('[SAVE-NOTES] Notes saved successfully');
      } else {
        console.warn('[SAVE-NOTES] No notes to save or notes is empty');
      }
      
      // 2. Kết thúc consultation KHÔNG cần truyền notes (đã lưu ở Meeting rồi)
      await consultationApi.completeConsultationWithMeeting(
        consultationId, 
        'Meeting completed successfully' // Generic message, notes đã lưu ở Meeting
      );
      
      message.success('Kết thúc tư vấn thành công');
      
      // ✅ Close confirmation modal
      setEndConfirmVisible(false);
      
      // ✅ Close meeting notes modal và notify parent
      onMeetingCompleted();
      onClose();
      
    } catch (error) {
      console.error('Error completing meeting:', error);
      message.error('Không thể kết thúc tư vấn');
      throw error; // Re-throw to let modal handle loading state
    } finally {
      setLoading(false);
    }
  };

  // ➕ ADD: Handle cancel end meeting
  const handleCancelEndMeeting = () => {
    setEndConfirmVisible(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'blue',
      waiting_customer: 'orange',
      invite_sent: 'green',
      in_progress: 'purple',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      scheduled: 'Đã lên lịch',
      waiting_customer: 'Chờ customer tham gia',
      invite_sent: 'Đã gửi thư mời',
      in_progress: 'Đang diễn ra',
      completed: 'Đã hoàn thành',
      cancelled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  return (
    <Modal
      title={
        <Space>
          <VideoCameraOutlined style={{ color: '#1890ff' }} />
          <span>Quản lý Meeting - {consultationData.patientName}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Đóng
        </Button>,
        meetingPassword && meetingDetails?.status === 'waiting_customer' && (
          <Button 
            key="invite" 
            type="primary"
            icon={<MessageOutlined />}
            onClick={handleSendCustomerInvite}
            loading={inviteLoading}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Gửi thư mời Meeting
          </Button>
        ),
        meetingDetails?.status === 'invite_sent' && (
          <Button 
            key="invite-sent" 
            type="default"
            disabled
            icon={<CheckCircleOutlined />}
            style={{ color: '#52c41a', borderColor: '#52c41a' }}
          >
            Đã gửi thư mời
          </Button>
        ),
        <Button 
          key="join" 
          type="primary" 
          icon={<LinkOutlined />}
          onClick={handleJoinMeeting}
          disabled={!meetingDetails?.meetingLink}
        >
          Tham gia Meeting
        </Button>,
        <Button
          key="save"
          type="primary"
          ghost
          icon={<SaveOutlined />}
          onClick={handleSaveNotes}
          loading={loading}
        >
          Lưu ghi chú
        </Button>,
        <Button
          key="complete"
          type="primary"
          danger
          icon={<PoweroffOutlined />}
          onClick={handleCompleteMeeting}
          loading={loading}
        >
          Kết thúc tư vấn
        </Button>
      ].filter(Boolean)}
      destroyOnClose
    >
      {loadingDetails ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          Đang tải thông tin meeting...
        </div>
      ) : (
        <>
          {/* Patient Information */}
          <Card 
            title="Thông tin bệnh nhân"
            size="small"
            style={{ marginBottom: '16px' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Tên bệnh nhân">
                    <Space>
                      <UserOutlined />
                      <strong>{consultationData.patientName}</strong>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    <Space>
                      <PhoneOutlined />
                      <span>{consultationData.patientPhone}</span>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Thời gian hẹn">
                    <Space>
                      <ClockCircleOutlined />
                      <span>{consultationData.appointmentTime}</span>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Vấn đề">
                    <span>{consultationData.description}</span>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>

          {/* Meeting Information */}
          {meetingDetails && (
            <Card 
              title="Thông tin Meeting"
              size="small"
              style={{ marginBottom: '16px' }}
            >
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Trạng thái">
                  <Tag color={getStatusColor(meetingDetails.status)}>
                    {getStatusText(meetingDetails.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Số người tham gia">
                  <Tag color="cyan">
                    {meetingDetails.participantCount}/{meetingDetails.maxParticipants}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Meeting Link">
                  <a 
                    href={meetingDetails.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: '12px' }}
                  >
                    {meetingDetails.meetingLink.length > 50 
                      ? `${meetingDetails.meetingLink.substring(0, 50)}...` 
                      : meetingDetails.meetingLink
                    }
                  </a>
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian bắt đầu">
                  {meetingDetails.actualStartTime 
                    ? new Date(meetingDetails.actualStartTime).toLocaleString('vi-VN')
                    : 'Chưa bắt đầu'
                  }
                </Descriptions.Item>
              </Descriptions>
              
              {/* ADD: PROMINENT PASSWORD DISPLAY */}
              {meetingPassword && (
                <div style={{ marginTop: '16px' }}>
                  <Divider style={{ margin: '12px 0' }} />
                  <div style={{ 
                    background: '#f44336', 
                    padding: '16px', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '2px solid #d32f2f'
                  }}>
                    <div style={{ 
                      color: 'white', 
                      fontSize: '14px', 
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <CheckCircleOutlined />
                      <span>Mật khẩu Meeting</span>
                    </div>
                    <div style={{ 
                      color: 'white', 
                      fontSize: '32px', 
                      fontWeight: 'bold', 
                      letterSpacing: '8px',
                      fontFamily: 'monospace',
                      margin: '8px 0',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      {meetingPassword}
                    </div>
                    <Button 
                      type="primary" 
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyPassword(meetingPassword)}
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.2)', 
                        borderColor: 'rgba(255,255,255,0.3)',
                        color: 'white',
                        marginBottom: '8px'
                      }}
                    >
                      Copy Password
                    </Button>
                    <div style={{ 
                      color: 'rgba(255,255,255,0.9)', 
                      fontSize: '12px',
                      fontWeight: 'normal'
                    }}>
                      Bảo mật - Chỉ chia sẻ với customer thông qua email chính thức
                    </div>
                  </div>
                </div>
              )}

              {/* ✅ ADD: Thông báo đã gửi invite */}
              {meetingDetails.status === 'invite_sent' && (
                <div style={{ marginTop: '16px' }}>
                  <Alert
                    message="Đã gửi thư mời thành công!"
                    description={`Thư mời meeting đã được gửi đến ${consultationData.patientName}. Customer sẽ nhận được email với password và link tham gia.`}
                    type="success"
                    showIcon
                    style={{ marginBottom: '12px' }}
                  />
                </div>
              )}
            </Card>
          )}

          <Divider />

          {/* Doctor Notes Form */}
          <Card 
            title={
              <Space>
                <EditOutlined style={{ color: '#52c41a' }} />
                <span>Ghi chú của bác sĩ</span>
              </Space>
            }
            size="small"
          >
            <Form
              form={form}
              layout="vertical"
              disabled={loading}
            >
              <Form.Item
                name="notes"
                rules={[
                  { required: true, message: 'Vui lòng nhập ghi chú về cuộc tư vấn' }
                ]}
              >
                <TextArea
                  rows={6}
                  placeholder="Nhập ghi chú về cuộc tư vấn này (bắt buộc)..."
                  maxLength={1000}
                  showCount
                  style={{ fontSize: '14px' }}
                />
              </Form.Item>
            </Form>
          </Card>

          {/* ➕ ADD: Security Training Information */}
          {meetingPassword && (
            <Card 
              size="small"
              style={{ 
                marginTop: '16px',
                background: '#fff3cd', 
                border: '2px solid #ffc107' 
              }}
            >
              <Alert
                message="Bảo mật Password Meeting - Bác sĩ đã được huấn luyện"
                description={
                  <div style={{ fontSize: '13px', lineHeight: '1.6', marginTop: '8px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#856404' }}>Quy trình đã được huấn luyện tại trung tâm:</strong>
                    </div>
                    <ul style={{ marginLeft: '16px', marginBottom: '8px', color: '#856404' }}>
                      <li><strong>Bảo mật Password:</strong> Chỉ chia sẻ với customer được phân công</li>
                      <li><strong>Gửi thư mời:</strong> Sử dụng hệ thống email chính thức của trung tâm</li>
                      <li><strong>Ghi hình bắt buộc:</strong> Tự ghi hình toàn bộ buổi tư vấn</li>
                      <li><strong>Bảo mật thông tin:</strong> Thông tin bệnh nhân được bảo vệ tuyệt đối</li>
                    </ul>
                    <div style={{ 
                      background: '#ffeaa7', 
                      padding: '6px 8px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#856404',
                      fontWeight: 'bold'
                    }}>
                      Password hiển thị chỉ cho bác sĩ được phân công. Việc rò rỉ có thể gây hậu quả nghiêm trọng.
                    </div>
                  </div>
                }
                type="warning"
                showIcon
                style={{ marginBottom: '12px' }}
              />
            </Card>
          )}
        </>
      )}

      {/* 🎥 Recording Confirmation Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
            <span>Xác nhận ghi hình buổi tư vấn</span>
          </Space>
        }
        open={recordingModalVisible}
        onCancel={handleRecordingModalClose}
        footer={[
          <Button key="cancel" onClick={handleRecordingModalClose}>
            Hủy bỏ
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            disabled={!recordingConfirmed}
            onClick={handleConfirmRecordingAndJoin}
            icon={<CameraOutlined />}
          >
            Xác nhận và Tham gia Meeting
          </Button>
        ]}
        width={600}
        maskClosable={false}
        destroyOnClose
      >
        <div style={{ marginBottom: '20px' }}>
          <Alert
            message="Thông báo quan trọng về ghi hình buổi tư vấn"
            description={
              <div style={{ marginTop: '12px', lineHeight: '1.6' }}>
                <p><strong>Để đảm bảo chất lượng dịch vụ và bảo vệ quyền lợi của cả hai bên, bác sĩ vui lòng:</strong></p>
                <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
                  <li><strong>Tự ghi hình</strong> toàn bộ buổi tư vấn bằng phần mềm ghi màn hình trên máy tính của mình</li>
                  <li><strong>Lưu trữ file ghi hình</strong> tại máy tính cá nhân với tên file theo format: <code>YYYYMMDD_HH-mm_TenBenhNhan.mp4</code></li>
                  <li><strong>Ghi chú ngày giờ</strong> vào sổ tay hoặc lịch cá nhân để tra cứu khi cần</li>
                  <li><strong>Bảo mật thông tin</strong> bệnh nhân và chỉ cung cấp khi có yêu cầu chính thức từ trung tâm</li>
                </ul>
                <p style={{ color: '#fa8c16', fontWeight: 'bold', marginTop: '16px' }}>
                  <strong>Lưu ý:</strong> Nếu không thực hiện ghi hình và xảy ra tranh chấp, công ty sẽ không chịu trách nhiệm về các vấn đề pháp lý phát sinh.
                </p>
              </div>
            }
            type="warning"
            showIcon
          />
        </div>

        <div style={{ 
          padding: '16px', 
          background: '#f9f9f9', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#1890ff' }}>
            Thông tin buổi tư vấn:
          </h4>
          <Row gutter={16}>
            <Col span={12}>
              <p><strong>Bệnh nhân:</strong> {consultationData.patientName}</p>
              <p><strong>Số điện thoại:</strong> {consultationData.patientPhone}</p>
            </Col>
            <Col span={12}>
              <p><strong>Thời gian:</strong> {consultationData.appointmentTime}</p>
              <p><strong>Meeting Link:</strong> {meetingDetails?.meetingLink ? 'Có sẵn' : 'Không có'}</p>
            </Col>
          </Row>
          <p style={{ margin: '8px 0 0 0' }}>
            <strong>Vấn đề:</strong> {consultationData.description}
          </p>
        </div>

        <div style={{ 
          padding: '16px', 
          border: '2px dashed #d9d9d9', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <Checkbox
            checked={recordingConfirmed}
            onChange={(e) => setRecordingConfirmed(e.target.checked)}
            style={{ fontSize: '16px' }}
          >
            <strong>
              Tôi xác nhận đã đọc và hiểu các yêu cầu trên. Tôi sẽ tự ghi hình buổi tư vấn và chịu trách nhiệm về việc lưu trữ, bảo mật thông tin bệnh nhân.
            </strong>
          </Checkbox>
        </div>

        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: '#e6f7ff', 
          borderRadius: '6px',
          fontSize: '14px',
          color: '#0050b3'
        }}>
          <strong>Gợi ý phần mềm ghi màn hình:</strong> OBS Studio (miễn phí), Bandicam, Camtasia, hoặc sử dụng tính năng ghi màn hình có sẵn trên hệ điều hành.
        </div>
      </Modal>

      {/* ➕ ADD: Consultation End Confirm Modal */}
      <ConsultationEndConfirmModal
        visible={endConfirmVisible}
        onConfirm={handleConfirmEndMeeting}
        onCancel={handleCancelEndMeeting}
        consultationData={{
          patientName: consultationData.patientName,
          patientPhone: consultationData.patientPhone,
          appointmentTime: consultationData.appointmentTime,
          description: consultationData.description
        }}
        loading={loading}
      />
    </Modal>
  );
};

export default MeetingNotesModal; 