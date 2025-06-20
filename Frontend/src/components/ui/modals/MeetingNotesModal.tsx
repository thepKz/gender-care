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
  Col
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
  CheckCircleOutlined
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
    if (meetingDetails?.meetingLink) {
      window.open(meetingDetails.meetingLink, '_blank');
      message.success('Đã mở meeting trong tab mới');
    }
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
    </Modal>
  );
};

export default MeetingNotesModal; 