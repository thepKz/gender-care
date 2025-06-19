import React, { useState, useEffect } from 'react';
import { Button, Tooltip, message, Modal, Input } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { UnifiedAppointment } from '../../../types/appointment';
import consultationApi from '../../../api/endpoints/consultation';

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

  // Handle transfer action
  const handleTransfer = async () => {
    try {
      setLoading(true);
      
      // ✅ Show modal để nhập lý do transfer
      const transferReason = await new Promise<string>((resolve, reject) => {
        let reason = '';
        
        const modal = Modal.confirm({
          title: 'Thuyên chuyển tư vấn',
          content: (
            <div>
              <p>Bạn có chắc chắn muốn thuyên chuyển consultation này cho bác sĩ khác?</p>
              <Input.TextArea
                placeholder="Nhập lý do thuyên chuyển (bắt buộc)..."
                maxLength={200}
                showCount
                onChange={(e) => { reason = e.target.value; }}
                style={{ marginTop: '12px' }}
              />
            </div>
          ),
          onOk: () => {
            if (!reason.trim()) {
              message.error('Vui lòng nhập lý do thuyên chuyển');
              return Promise.reject();
            }
            resolve(reason.trim());
          },
          onCancel: () => reject(new Error('User cancelled')),
          okText: 'Thuyên chuyển',
          cancelText: 'Hủy'
        });
      });
      
      // ✅ Call real transfer API
      await consultationApi.transferConsultation(consultation._id, {
        newDoctorId: 'auto', // Backend sẽ tự động chọn doctor available
        transferReason
      });
      
      message.success('Thuyên chuyển tư vấn thành công cho bác sĩ khác');
      
      if (onTransferSuccess) {
        onTransferSuccess();
      }
      
    } catch (error: any) {
      console.error('❌ Transfer failed:', error);
      if (error.message !== 'User cancelled') {
        message.error(error.response?.data?.message || 'Thuyên chuyển thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Không hiển thị nút nếu status không phù hợp
  if (!['paid', 'scheduled', 'consulting', 'confirmed', 'pending_payment'].includes(consultation.status)) {
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