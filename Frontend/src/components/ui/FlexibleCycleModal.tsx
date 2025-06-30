import React, { useState } from 'react';
import { X } from 'lucide-react';
import menstrualCycleApi from '../../api/endpoints/menstrualCycle';

interface FlexibleCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ConfirmationState {
  requiresConfirmation: boolean;
  message: string;
  currentCycle?: {
    cycleNumber: number;
    startDate: string;
    daysTracked: number;
    isCompleted: boolean;
  };
  options?: Array<{
    key: string;
    label: string;
    action: string;
    params: Record<string, unknown>;
  }>;
}

// Interface for API responses that might require confirmation
interface FlexibleCycleResponse {
  success?: boolean;
  requiresConfirmation?: boolean;
  message?: string;
  currentCycle?: {
    cycleNumber: number;
    startDate: string;
    daysTracked: number;
    isCompleted: boolean;
  };
  options?: Array<{
    key: string;
    label: string;
    action: string;
    params: Record<string, unknown>;
  }>;
}

interface ResetCycleResponse {
  message?: string;
  deletedCycles?: number;
  deletedCycleDays?: number;
}

const FlexibleCycleModal: React.FC<FlexibleCycleModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleCreateCycle = async () => {
    if (!startDate) {
      setMessage('Vui lòng chọn ngày bắt đầu chu kỳ');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await menstrualCycleApi.createFlexibleCycle({
        startDate,
        resetToCycle1: false,
        forceCreate: false
      });

      // Cast response to our defined interface
      const responseData = response.data as FlexibleCycleResponse;

      if (!responseData.success && responseData.requiresConfirmation) {
        // Cần xác nhận từ user
        setConfirmation({
          requiresConfirmation: true,
          message: responseData.message || '',
          currentCycle: responseData.currentCycle,
          options: responseData.options
        });
      } else {
        // Thành công
        setMessage('✅ ' + (responseData.message || 'Tạo chu kỳ thành công'));
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Có lỗi xảy ra';
      setMessage('❌ ' + errorMessage);
    }

    setLoading(false);
  };

  const handleConfirmationAction = async (action: string, _params: Record<string, unknown>) => {
    setLoading(true);
    setMessage('');

    try {
      if (action === 'resetAllCycles') {
        // Reset toàn bộ chu kỳ
        const response = await menstrualCycleApi.resetAllCycles(true);
        const responseData = response.data as ResetCycleResponse;
        setMessage('✅ ' + (responseData.message || 'Reset thành công'));
        
        // Sau khi reset, tạo chu kỳ mới
        await menstrualCycleApi.createFlexibleCycle({
          startDate,
          resetToCycle1: true,
          forceCreate: true
        });
        
        setMessage('✅ Đã reset và tạo chu kỳ 1 mới');
      } else if (action === 'createFlexibleCycle') {
        // Tạo chu kỳ mới (giữ chu kỳ cũ)
        const response = await menstrualCycleApi.createFlexibleCycle({
          startDate,
          resetToCycle1: false,
          forceCreate: true
        });
        const responseData = response.data as FlexibleCycleResponse;
        setMessage('✅ ' + (responseData.message || 'Tạo chu kỳ thành công'));
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Có lỗi xảy ra';
      setMessage('❌ ' + errorMessage);
    }

    setLoading(false);
    setConfirmation(null);
  };

  const handleReset = async () => {
    if (!confirm('⚠️ CẢNH BÁO: Thao tác này sẽ XÓA TOÀN BỘ dữ liệu chu kỳ hiện có!\n\nBạn có chắc chắn muốn tiếp tục?')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await menstrualCycleApi.resetAllCycles(true);
      const responseData = response.data as ResetCycleResponse;
      setMessage(`✅ ${responseData.message || 'Reset thành công'}\n📊 Đã xóa: ${responseData.deletedCycles || 0} chu kỳ, ${responseData.deletedCycleDays || 0} ngày`);
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Có lỗi xảy ra';
      setMessage('❌ ' + errorMessage);
    }

    setLoading(false);
  };

  const handleCleanDuplicates = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await menstrualCycleApi.cleanDuplicates();
      const data = response.data;
      setMessage(`✅ Dọn dẹp hoàn tất!\n📊 Tổng: ${data.totalRecords}, Trùng lặp: ${data.duplicatesFound}, Đã xóa: ${data.duplicatesCleaned}, Còn lại: ${data.remainingRecords}`);
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🔧 Quản lý chu kỳ linh hoạt
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {!confirmation ? (
          <>
            {/* Form tạo chu kỳ mới */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Ngày bắt đầu chu kỳ mới
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleCreateCycle}
                  disabled={loading || !startDate}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 px-4 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ Đang xử lý...' : '🆕 Tạo chu kỳ mới'}
                </button>

                <div className="border-t pt-4 space-y-2">
                  <p className="text-sm text-gray-600 mb-2">🛠️ Công cụ quản lý:</p>
                  
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? '⏳ Đang xử lý...' : '🔄 Reset toàn bộ về chu kỳ 1'}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Confirmation Modal */
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Cần xác nhận</h4>
              <p className="text-yellow-700 mb-3">{confirmation.message}</p>
              
              {confirmation.currentCycle && (
                <div className="bg-white rounded p-3 mb-3">
                  <p className="text-sm text-gray-600">
                    <strong>Chu kỳ hiện tại:</strong> Chu kỳ {confirmation.currentCycle.cycleNumber}<br/>
                    <strong>Bắt đầu:</strong> {new Date(confirmation.currentCycle.startDate).toLocaleDateString('vi-VN')}<br/>
                    <strong>Đã ghi nhận:</strong> {confirmation.currentCycle.daysTracked} ngày<br/>
                    <strong>Trạng thái:</strong> {confirmation.currentCycle.isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {confirmation.options?.map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleConfirmationAction(option.action, option.params)}
                  disabled={loading}
                  className={`w-full py-2 px-4 rounded-lg transition-colors disabled:opacity-50 ${
                    option.key === 'resetAll' 
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {loading ? '⏳ Đang xử lý...' : option.label}
                </button>
              ))}
              
              <button
                onClick={() => setConfirmation(null)}
                disabled={loading}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                ⬅️ Quay lại
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm whitespace-pre-line ${
            message.startsWith('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500">
          <p><strong>💡 Chú thích:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Tạo chu kỳ mới: Giữ lại dữ liệu cũ, tạo chu kỳ tiếp theo</li>
            <li>Reset toàn bộ: Xóa hết dữ liệu và bắt đầu từ chu kỳ 1</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FlexibleCycleModal; 