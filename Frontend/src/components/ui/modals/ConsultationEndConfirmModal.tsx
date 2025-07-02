import React, { useState } from 'react';
import { 
  Modal, 
  Typography, 
  Space, 
  Alert, 
  Checkbox, 
  Divider,
  Card
} from 'antd';
import { 
  PoweroffOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface ConsultationEndConfirmModalProps {
  visible: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  consultationData: {
    patientName: string;
    patientPhone?: string;
    appointmentTime?: string;
    description?: string;
  };
  loading?: boolean;
}

const ConsultationEndConfirmModal: React.FC<ConsultationEndConfirmModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  consultationData,
  loading = false
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [understoodWarning, setUnderstoodWarning] = useState(false);

  const handleSubmit = async () => {
    try {
      // Validate checkboxes
      if (!sessionCompleted) {
        Modal.error({
          title: 'Vui lòng xác nhận',
          content: 'Bạn cần xác nhận rằng ca làm của mình đã hoàn thành.',
        });
        return;
      }

      if (!understoodWarning) {
        Modal.error({
          title: 'Vui lòng xác nhận',
          content: 'Bạn cần xác nhận đã hiểu về việc không thể tạo lại lịch hẹn sau khi kết thúc.',
        });
        return;
      }

      setSubmitting(true);
      
      // Call the confirm function
      await onConfirm();
      
      // Reset state after successful completion
      setSessionCompleted(false);
      setUnderstoodWarning(false);
      
    } catch (error) {
      console.error('Consultation end confirmation error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset state when cancelled
    setSessionCompleted(false);
    setUnderstoodWarning(false);
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <PoweroffOutlined style={{ color: '#ff4d4f' }} />
          <span>Xác nhận kết thúc tư vấn</span>
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="Xác nhận kết thúc"
      cancelText="Hủy"
      okType="danger"
      confirmLoading={submitting || loading}
      width={600}
      centered
    >
      <div style={{ marginBottom: '16px' }}>
        {/* Patient Information Card */}
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <UserOutlined style={{ color: '#1890ff' }} />
              <Text strong>Bệnh nhân: {consultationData.patientName}</Text>
            </Space>
            {consultationData.appointmentTime && (
              <Space>
                <ClockCircleOutlined style={{ color: '#52c41a' }} />
                <Text>Thời gian: {consultationData.appointmentTime}</Text>
              </Space>
            )}
            {consultationData.description && (
              <Text type="secondary">
                <strong>Vấn đề:</strong> {consultationData.description}
              </Text>
            )}
          </Space>
        </Card>

        {/* Critical Warning */}
        <Alert
          message={
            <Space>
              <WarningOutlined />
              <strong>Cảnh báo quan trọng</strong>
            </Space>
          }
          description={
            <div>
              <p>• <strong>Kết thúc tư vấn sẽ KHÔNG THỂ TẠO LẠI</strong> lịch hẹn này</p>
              <p>• Hệ thống sẽ đánh dấu cuộc tư vấn đã hoàn thành</p>
              <p>• Bệnh nhân sẽ không thể tiếp tục phiên tư vấn này</p>
              <p>• Vui lòng đảm bảo đã giải quyết xong mọi vấn đề của bệnh nhân</p>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <Divider />

        {/* Confirmation Checkboxes */}
        <Space direction="vertical" style={{ width: '100%' }}>
          <Checkbox
            checked={sessionCompleted}
            onChange={(e) => setSessionCompleted(e.target.checked)}
            style={{ fontSize: '14px' }}
          >
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <strong>Tôi xác nhận ca làm của mình đã hoàn thành</strong>
            </Space>
          </Checkbox>

          <Checkbox
            checked={understoodWarning}
            onChange={(e) => setUnderstoodWarning(e.target.checked)}
            style={{ fontSize: '14px' }}
          >
            <Space>
              <WarningOutlined style={{ color: '#fa8c16' }} />
              <strong>Tôi hiểu rằng việc kết thúc sẽ KHÔNG THỂ TẠO LẠI lịch hẹn này</strong>
            </Space>
          </Checkbox>
        </Space>

        <Alert
          message="Lưu ý: Sau khi kết thúc, hệ thống sẽ gửi thông báo cho bệnh nhân và lưu trữ thông tin tư vấn."
          type="info"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </div>
    </Modal>
  );
};

export default ConsultationEndConfirmModal; 