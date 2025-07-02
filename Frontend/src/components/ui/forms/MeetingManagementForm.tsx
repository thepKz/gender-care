import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Descriptions,
  Tag,
  message,
  Modal
} from 'antd';
import {
  VideoCameraOutlined,
  EditOutlined,
  LinkOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SaveOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { DoctorMeetingFormData, MeetingInputForm } from '../../../shared/mockData/consultationMockData';

const { TextArea } = Input;

interface MeetingManagementFormProps {
  meetingData: MeetingInputForm;
  onSave: (data: DoctorMeetingFormData) => Promise<void>;
  onJoinMeeting?: () => void;
  loading?: boolean;
  readOnly?: boolean;
}

const MeetingManagementForm: React.FC<MeetingManagementFormProps> = ({
  meetingData,
  onSave,
  onJoinMeeting,
  loading = false,
  readOnly = false
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      const formData: DoctorMeetingFormData = {
        notes: values.notes,
        maxParticipants: values.maxParticipants,
        actualStartTime: values.actualStartTime
      };

      await onSave(formData);
      message.success('Cập nhật thông tin meeting thành công');
      
    } catch (error) {
      console.error('Error saving meeting data:', error);
      message.error('Không thể cập nhật thông tin meeting');
    } finally {
      setSaving(false);
    }
  };

  const handleJoinMeetingClick = () => {
    Modal.confirm({
      title: 'Tham gia Meeting',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có muốn mở meeting trong tab mới không?',
      okText: 'Tham gia',
      cancelText: 'Hủy',
      onOk: onJoinMeeting
    });
  };

  return (
    <Card 
      title={
        <Space>
          <VideoCameraOutlined style={{ color: '#1890ff' }} />
          <span>📋 Quản lý Meeting</span>
        </Space>
      }
      extra={
        !readOnly && (
          <Space>
            {onJoinMeeting && (
              <Button 
                type="primary"
                icon={<LinkOutlined />}
                onClick={handleJoinMeetingClick}
              >
                Tham gia Meeting
              </Button>
            )}
            <Button 
              type="primary"
              ghost
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              Lưu thay đổi
            </Button>
          </Space>
        )
      }
      style={{ marginBottom: '24px' }}
    >
      {/* Read-only Meeting Information */}
      <Card 
        title="📊 Thông tin Meeting (Chỉ đọc)"
        size="small"
        style={{ marginBottom: '24px', background: '#fafafa' }}
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="👤 Bệnh nhân">
            <Space>
              <UserOutlined />
              <strong>{meetingData.patientName}</strong>
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="🕐 Thời gian hẹn">
            <Space>
              <ClockCircleOutlined />
              <span>{meetingData.appointmentTime}</span>
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="🔗 Meeting Link">
            <a 
              href={meetingData.meetingLink} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ fontSize: '12px' }}
            >
              {meetingData.meetingLink.length > 50 
                ? `${meetingData.meetingLink.substring(0, 50)}...` 
                : meetingData.meetingLink
              }
            </a>
          </Descriptions.Item>
          
          <Descriptions.Item label="📊 Trạng thái">
            <Tag color={getStatusColor(meetingData.status)}>
              {getStatusText(meetingData.status)}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="👥 Người tham gia">
            <Tag color="cyan">
              {meetingData.participantCount} người
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="📅 Thời gian lên lịch">
            <Space>
              <ClockCircleOutlined />
              <span>{new Date(meetingData.scheduledTime).toLocaleString('vi-VN')}</span>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Editable Doctor Fields */}
      <Card 
        title={
          <Space>
            <EditOutlined style={{ color: '#52c41a' }} />
            <span>✏️ Thông tin do Bác sĩ quản lý</span>
          </Space>
        }
        size="small"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            notes: meetingData.notes || '',
            maxParticipants: meetingData.maxParticipants || 2
          }}
          disabled={readOnly || loading}
        >
          <Form.Item
            label="📝 Ghi chú Meeting"
            name="notes"
            help="Ghi chú về cuộc tư vấn, kết quả, khuyến nghị cho bệnh nhân"
          >
            <TextArea
              rows={4}
              placeholder="Nhập ghi chú về cuộc tư vấn này..."
              maxLength={500}
              showCount
              style={{ fontSize: '14px' }}
            />
          </Form.Item>

          <Form.Item
            label="👥 Số người tham gia tối đa"
            name="maxParticipants"
            rules={[
              { required: true, message: 'Vui lòng nhập số người tham gia tối đa' },
              { type: 'number', min: 2, max: 10, message: 'Số người phải từ 2 đến 10' }
            ]}
          >
            <InputNumber
              min={2}
              max={10}
              style={{ width: '100%' }}
              placeholder="Nhập số người tham gia tối đa"
            />
          </Form.Item>

          {/* Quick Action Buttons */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button 
                type="default"
                onClick={() => form.resetFields()}
                disabled={readOnly || loading}
              >
                Khôi phục
              </Button>
              
              <Button
                type="primary"
                onClick={handleSave}
                loading={saving}
                disabled={readOnly || loading}
                icon={<SaveOutlined />}
              >
                Lưu thay đổi
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Help Information */}
      <Card 
        size="small"
        style={{ 
          background: '#e6f7ff', 
          border: '1px solid #91d5ff' 
        }}
      >
        <div style={{ fontSize: '13px', color: '#1890ff' }}>
          <strong>💡 Hướng dẫn sử dụng:</strong>
          <ul style={{ marginTop: '8px', marginLeft: '16px' }}>
            <li>Ghi chú meeting sẽ được lưu để theo dõi sau này</li>
            <li>Số người tham gia tối đa có thể điều chỉnh theo nhu cầu</li>
            <li>Click "Tham gia Meeting" để mở Jitsi Meet trong tab mới</li>
            <li>Các thông tin khác được tự động cập nhật từ hệ thống</li>
          </ul>
        </div>
      </Card>
    </Card>
  );
};

export default MeetingManagementForm; 