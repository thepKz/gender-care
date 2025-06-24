import React, { useState, useEffect } from 'react';
import { Button, Tooltip, message, Modal, Input, Card, Avatar, Divider, Typography, Space, Form } from 'antd';
import { SwapOutlined, UserOutlined, ClockCircleOutlined, CalendarOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { UnifiedAppointment } from '../../../types/appointment';
import consultationApi from '../../../api/endpoints/consultation';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ConsultationTransferButtonProps {
  consultation: UnifiedAppointment;
  onTransferSuccess?: () => void;
}

const ConsultationTransferButton: React.FC<ConsultationTransferButtonProps> = ({ 
  consultation, 
  onTransferSuccess 
}) => {
  const [canTransfer, setCanTransfer] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Function kiểm tra có thể transfer không
  const checkTransferAvailability = async () => {
    try {
      setChecking(true);
      
      // ✅ Call real API để check available doctors trong slot
      const response = await consultationApi.checkAvailableDoctors(consultation._id);
      const available = response.data.data?.available || false;
      
      setCanTransfer(available);
      
      console.log('🔍 [DEBUG] Check transfer availability:', {
        consultationId: consultation._id,
        available,
        availableDoctors: response.data.data?.availableDoctors?.length || 0
      });
      
    } catch (error) {
      console.error('❌ Error checking transfer availability:', error);
      // Fallback: disable transfer button nếu có lỗi API
      setCanTransfer(false);
      message.warning('Không thể kiểm tra tình trạng slot. Vui lòng thử lại sau.');
    } finally {
      setChecking(false);
    }
  };

  // Check availability khi component mount hoặc consultation thay đổi
  useEffect(() => {
    if (['paid', 'scheduled', 'consulting', 'confirmed', 'pending_payment'].includes(consultation.status)) {
      checkTransferAvailability();
    } else {
      setCanTransfer(false);
    }
  }, [consultation._id, consultation.status]);

  // Handle open transfer modal
  const handleOpenModal = () => {
    setModalVisible(true);
  };

  // Handle transfer action
  const handleTransfer = async (values: { transferReason: string }) => {
    try {
      setLoading(true);
      
      // ✅ Call real transfer API
      await consultationApi.transferConsultation(consultation._id, {
        newDoctorId: 'auto', // Backend sẽ tự động chọn doctor available
        transferReason: values.transferReason
      });
      
      message.success('Chuyển ca tư vấn thành công cho bác sĩ khác');
      setModalVisible(false);
      form.resetFields();
      
      if (onTransferSuccess) {
        onTransferSuccess();
      }
      
    } catch (error: any) {
      console.error('❌ Transfer failed:', error);
      message.error(error.response?.data?.message || 'Chuyển ca thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel modal
  const handleCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  // Không hiển thị nút nếu status không phù hợp
  if (!['paid', 'scheduled', 'consulting', 'confirmed', 'pending_payment'].includes(consultation.status)) {
    return null;
  }

  // Tooltip text tùy theo trạng thái
  const getTooltipText = () => {
    if (checking) return "Đang kiểm tra tình trạng slot...";
    if (canTransfer) return "Chuyển ca tư vấn cho bác sĩ khác";
    return "Không có bác sĩ khác trong slot này - Bắt buộc phải làm";
  };

  // Button text tùy theo trạng thái
  const getButtonText = () => {
    if (checking) return "Kiểm tra...";
    if (canTransfer) return "Chuyển ca";
    return "Không thể chuyển";
  };

  return (
    <Tooltip title={getTooltipText()}>
      <Button 
        type="text" 
        icon={<SwapOutlined />} 
        size="small"
        loading={loading || checking}
        disabled={!canTransfer}
        onClick={handleOpenModal}
        style={{
          color: canTransfer ? '#1890ff' : '#bfbfbf'
        }}
      >
        {getButtonText()}
      </Button>
      
      {/* ✅ Beautiful Transfer Modal */}
      <Modal
        title={null}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={580}
        centered
        destroyOnClose
        maskClosable={false}
        style={{ borderRadius: '16px' }}
      >
        <div style={{ padding: '8px 4px' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#fff7e6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #ffd666'
            }}>
              <SwapOutlined style={{ color: '#fa8c16', fontSize: '20px' }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, color: '#1f2937' }}>
                Chuyển ca tư vấn
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Chuyển ca tư vấn này cho bác sĩ khác cùng khung giờ
              </Text>
            </div>
          </div>

          {/* Patient Info Card */}
          <Card 
            size="small" 
            style={{ 
              marginBottom: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar 
                icon={<UserOutlined />} 
                size={40}
                style={{ backgroundColor: '#3b82f6' }}
              />
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: '15px', color: '#1f2937' }}>
                  {consultation.patientName}
                </Text>
                <div style={{ marginTop: '4px' }}>
                  <Space size="middle">
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      <CalendarOutlined style={{ marginRight: '4px' }} />
                      {(() => {
                        const date = new Date(consultation.appointmentDate);
                        const day = date.getDate().toString().padStart(2, '0');
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                      })()}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      <ClockCircleOutlined style={{ marginRight: '4px' }} />
                      {consultation.appointmentTime}
                    </Text>
                  </Space>
                </div>
              </div>
            </div>
          </Card>

          {/* Warning Notice */}
          <div style={{
            padding: '16px',
            backgroundColor: '#fff7e6',
            borderRadius: '8px',
            border: '1px solid #ffd666',
            marginBottom: '20px',
            display: 'flex',
            gap: '12px'
          }}>
            <ExclamationCircleOutlined style={{ 
              color: '#fa8c16', 
              fontSize: '16px',
              marginTop: '2px',
              flexShrink: 0
            }} />
            <div>
              <Text strong style={{ color: '#b45309', fontSize: '14px' }}>
                Lưu ý quan trọng:
              </Text>
              <Paragraph style={{ 
                margin: '4px 0 0 0',
                color: '#92400e',
                fontSize: '13px',
                lineHeight: '1.5'
              }}>
                Hệ thống sẽ tự động tìm bác sĩ khác có slot khả dụng trong cùng thời gian để thay thế. 
                Lý do chuyển ca sẽ được ghi lại để theo dõi.
              </Paragraph>
            </div>
          </div>

          {/* Transfer Form */}
          <Form
            form={form}
            onFinish={handleTransfer}
            layout="vertical"
          >
            <Form.Item
              label={
                <span style={{ fontWeight: 500, color: '#374151' }}>
                  Lý do chuyển ca <span style={{ color: '#ef4444' }}>*</span>
                </span>
              }
              name="transferReason"
              rules={[
                { required: true, message: 'Vui lòng nhập lý do chuyển ca' },
                { min: 10, message: 'Lý do phải có ít nhất 10 ký tự' }
              ]}
            >
              <TextArea
                placeholder="Ví dụ: Bận lịch khẩn cấp, vấn đề sức khỏe, có công tác đột xuất..."
                maxLength={200}
                showCount
                rows={4}
                style={{ 
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              />
            </Form.Item>

            {/* Actions */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px',
              marginTop: '24px'
            }}>
              <Button 
                size="large"
                onClick={handleCancel}
                style={{
                  minWidth: '100px',
                  borderRadius: '8px'
                }}
              >
                Hủy bỏ
              </Button>
              <Button 
                type="primary"
                size="large"
                htmlType="submit"
                loading={loading}
                style={{
                  minWidth: '140px',
                  borderRadius: '8px',
                  backgroundColor: '#fa8c16',
                  borderColor: '#fa8c16'
                }}
              >
                Xác nhận chuyển ca
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </Tooltip>
  );
};

export default ConsultationTransferButton; 