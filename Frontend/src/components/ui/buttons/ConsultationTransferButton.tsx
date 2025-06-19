import React, { useState, useEffect } from 'react';
import { Button, Tooltip, message } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { UnifiedAppointment } from '../../../types/appointment';
import appointmentManagementService from '../../../api/services/appointmentManagementService';

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

  // Function kiểm tra có thể transfer không
  const checkTransferAvailability = async () => {
    try {
      setChecking(true);
      // TODO: Call API để check available doctors trong slot
      // Tạm thời mock logic - sẽ replace bằng real API call
      const mockAvailable = Math.random() > 0.3; // 70% chance có doctor available
      setCanTransfer(mockAvailable);
      
      console.log('🔍 [DEBUG] Check transfer availability:', {
        consultationId: consultation._id,
        available: mockAvailable
      });
      
    } catch (error) {
      console.error('❌ Error checking transfer availability:', error);
      setCanTransfer(false);
    } finally {
      setChecking(false);
    }
  };

  // Check availability khi component mount hoặc consultation thay đổi
  useEffect(() => {
    if (['scheduled', 'consulting'].includes(consultation.status)) {
      checkTransferAvailability();
    } else {
      setCanTransfer(false);
    }
  }, [consultation._id, consultation.status]);

  // Handle transfer action
  const handleTransfer = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace với real transfer API call
      console.log('🔄 [DEBUG] Transferring consultation:', consultation._id);
      
      // Mock transfer success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Thuyên chuyển tư vấn thành công cho bác sĩ khác');
      
      if (onTransferSuccess) {
        onTransferSuccess();
      }
      
    } catch (error) {
      console.error('❌ Transfer failed:', error);
      message.error('Thuyên chuyển thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Không hiển thị nút nếu status không phù hợp
  if (!['scheduled', 'consulting'].includes(consultation.status)) {
    return null;
  }

  // Tooltip text tùy theo trạng thái
  const getTooltipText = () => {
    if (checking) return "Đang kiểm tra tình trạng slot...";
    if (canTransfer) return "Thuyên chuyển cho bác sĩ khác trong cùng slot";
    return "Không có bác sĩ khác trong slot này - Bắt buộc phải làm";
  };

  // Button text tùy theo trạng thái
  const getButtonText = () => {
    if (checking) return "Kiểm tra...";
    if (canTransfer) return "Thuyên chuyển";
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
        onClick={handleTransfer}
        style={{
          color: canTransfer ? '#1890ff' : '#bfbfbf'
        }}
      >
        {getButtonText()}
      </Button>
    </Tooltip>
  );
};

export default ConsultationTransferButton; 