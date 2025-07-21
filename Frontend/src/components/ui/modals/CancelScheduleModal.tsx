import React from 'react';
import { Modal, Button, Input, Typography, Alert, Form, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface CancelScheduleModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  loading: boolean;
  reason: string;
  setReason: (val: string) => void;
  confirmCall: boolean;
  setConfirmCall: (val: boolean) => void;
}

const CancelScheduleModal: React.FC<CancelScheduleModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  loading,
  reason,
  setReason,
  confirmCall,
  setConfirmCall,
}) => {
  return (
    <Modal
      title={
        <Space align="center">
          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 28 }} />
          <Title level={4} style={{ margin: 0, color: '#1f2937' }}>Hủy lịch hẹn</Title>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>Đóng</Button>,
        <Button
          key="submit"
          type="primary"
          danger
          loading={loading}
          disabled={!reason.trim() || !confirmCall}
          onClick={onSubmit}
        >
          Xác nhận hủy
        </Button>,
      ]}
      width={500}
      bodyStyle={{ paddingTop: 16, paddingBottom: 8 }}
    >
      <Form layout="vertical" requiredMark={false} style={{ marginBottom: 0 }}>
        <Form.Item label={<Text strong>Lý do hủy lịch:</Text>} required style={{ marginBottom: 18 }}>
          <Input.TextArea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Nhập lý do hủy lịch..."
            style={{ marginTop: 4 }}
          />
        </Form.Item>
      </Form>
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 0, background: '#fffbe6', borderRadius: 8, padding: 12 }}
        message={
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <input
              type="checkbox"
              checked={confirmCall}
              onChange={e => setConfirmCall(e.target.checked)}
              style={{ marginTop: 4 }}
            />
            <div style={{ fontSize: 15 }}>
              <span style={{ fontWeight: 500 }}>Tôi xác nhận đã gọi điện thông báo cho khách hàng về việc hủy lịch.</span><br />
              <span>Nếu chưa thực hiện, tôi sẽ chịu hoàn toàn trách nhiệm.</span>
            </div>
          </div>
        }
      />
    </Modal>
  );
};

export default CancelScheduleModal; 