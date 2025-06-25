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
  CameraOutlined
} from '@ant-design/icons';
import consultationApi from '../../../api/endpoints/consultation';

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

  // Load meeting details khi modal mở
  useEffect(() => {
    if (visible && consultationId) {
      loadMeetingDetails();
    }
  }, [visible, consultationId]);

  const loadMeetingDetails = async () => {
    try {
      setLoadingDetails(true);
      const response = await consultationApi.getMeetingDetails(consultationId);
      const details = response.data?.data;
      
      if (details) {
        setMeetingDetails(details);
        // Set form values
        form.setFieldsValue({
          notes: details.notes || '',
          maxParticipants: details.maxParticipants || 2
        });
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
      
      // Reload meeting details
      await loadMeetingDetails();
      
    } catch (error) {
      console.error('Error saving notes:', error);
      message.error('Không thể lưu ghi chú meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = () => {
    console.log('🎯 [JOIN-MEETING] Requesting to join meeting from MeetingNotesModal');
    
    // 🎥 Show recording confirmation modal first
    setRecordingConfirmed(false);
    setRecordingModalVisible(true);
  };

  // 🎥 Handle recording confirmation and actual meeting join
  const handleConfirmRecordingAndJoin = () => {
    if (!recordingConfirmed) {
      message.warning('Vui lòng xác nhận đã hiểu về việc ghi hình buổi tư vấn');
      return;
    }

    if (meetingDetails?.meetingLink) {
      window.open(meetingDetails.meetingLink, '_blank');
      message.success('Đã mở meeting trong tab mới');
      
      // ✅ Close modal and reset state
      setRecordingModalVisible(false);
      setRecordingConfirmed(false);
    } else {
      message.error('Không tìm thấy link meeting');
    }
  };

  // 🎥 Handle recording modal close
  const handleRecordingModalClose = () => {
    setRecordingModalVisible(false);
    setRecordingConfirmed(false);
  };

  const handleCompleteMeeting = async () => {
    try {
      setLoading(true);
      
      // Lưu notes trước khi kết thúc
      const values = form.getFieldsValue();
      if (values.notes) {
        await consultationApi.updateMeetingNotes(consultationId, {
          notes: values.notes
        });
      }
      
      // Kết thúc consultation
      await consultationApi.completeConsultationWithMeeting(
        consultationId, 
        values.notes || 'Meeting completed successfully'
      );
      
      message.success('Kết thúc tư vấn thành công');
      onMeetingCompleted();
      onClose();
      
    } catch (error) {
      console.error('Error completing meeting:', error);
      message.error('Không thể kết thúc tư vấn');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'blue',
      in_progress: 'orange',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      scheduled: 'Đã lên lịch',
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
          <span>📋 Quản lý Meeting - {consultationData.patientName}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Đóng
        </Button>,
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
      ]}
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
            title="👤 Thông tin bệnh nhân"
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
              title="📊 Thông tin Meeting"
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
            </Card>
          )}

          <Divider />

          {/* Doctor Notes Form */}
          <Card 
            title={
              <Space>
                <EditOutlined style={{ color: '#52c41a' }} />
                <span>✏️ Ghi chú của bác sĩ</span>
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
                label="📝 Ghi chú về cuộc tư vấn"
                name="notes"
                help="Ghi lại nội dung tư vấn, kết quả, khuyến nghị cho bệnh nhân"
              >
                <TextArea
                  rows={6}
                  placeholder="Nhập ghi chú về cuộc tư vấn này..."
                  maxLength={1000}
                  showCount
                  style={{ fontSize: '14px' }}
                />
              </Form.Item>

              <Form.Item
                label="👥 Số người tham gia tối đa"
                name="maxParticipants"
                help="Giới hạn số người có thể tham gia meeting"
              >
                <Input 
                  type="number" 
                  min={2} 
                  max={10}
                  placeholder="2"
                  style={{ width: '100px' }}
                />
              </Form.Item>
            </Form>
          </Card>

          {/* Help Information */}
          <Card 
            size="small"
            style={{ 
              marginTop: '16px',
              background: '#e6f7ff', 
              border: '1px solid #91d5ff' 
            }}
          >
            <div style={{ fontSize: '13px', color: '#1890ff' }}>
              <strong>💡 Hướng dẫn:</strong>
              <ul style={{ marginTop: '8px', marginLeft: '16px', marginBottom: 0 }}>
                <li>Nhập ghi chú trong quá trình tư vấn để theo dõi</li>
                <li>Click "Lưu ghi chú" để lưu thông tin</li>
                <li>Click "Tham gia Meeting" để mở Jitsi Meet</li>
                <li>Click "Kết thúc tư vấn" khi hoàn thành</li>
              </ul>
            </div>
          </Card>
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
                  ⚠️ <strong>Lưu ý:</strong> Nếu không thực hiện ghi hình và xảy ra tranh chấp, công ty sẽ không chịu trách nhiệm về các vấn đề pháp lý phát sinh.
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
            📋 Thông tin buổi tư vấn:
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
          💡 <strong>Gợi ý phần mềm ghi màn hình:</strong> OBS Studio (miễn phí), Bandicam, Camtasia, hoặc sử dụng tính năng ghi màn hình có sẵn trên hệ điều hành.
        </div>
      </Modal>
    </Modal>
  );
};

export default MeetingNotesModal; 