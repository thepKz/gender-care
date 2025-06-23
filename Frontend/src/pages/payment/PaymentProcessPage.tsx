import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentApi } from '../../api/endpoints';

interface PaymentData {
  checkoutUrl: string;
  orderCode: string;
  amount: number;
}

const PaymentProcessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appointmentId = searchParams.get('appointmentId');

  const [status, setStatus] = useState<'loading' | 'creating' | 'redirecting' | 'checking' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!appointmentId) {
      setErrorMessage('Không tìm thấy thông tin lịch hẹn');
      setStatus('error');
      return;
    }

    createPaymentLink();
  }, [appointmentId]);

  const createPaymentLink = async () => {
    try {
      setStatus('creating');
      
      if (!appointmentId) {
        setErrorMessage('Không tìm thấy ID lịch hẹn');
        setStatus('error');
        return;
      }

      const result = await paymentApi.createPaymentLink({ 
        appointmentId,
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`
      });

      if (result.success) {
        const data = result.data;
        setPaymentData({
          checkoutUrl: data.paymentUrl,
          orderCode: data.orderCode,
          amount: data.amount
        });
        
        // Auto redirect to PayOS after 3 seconds
        setStatus('redirecting');
        
        const countdownTimer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownTimer);
              window.location.href = data.paymentUrl;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

      } else {
        setErrorMessage(result.message || 'Không thể tạo liên kết thanh toán');
        setStatus('error');
      }
    } catch (error: any) {
      console.error('Payment creation error:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Lỗi kết nối. Vui lòng thử lại.');
      setStatus('error');
    }
  };

  const handleRedirectNow = () => {
    if (paymentData) {
      window.location.href = paymentData.checkoutUrl;
    }
  };

  const handleCancel = async () => {
    try {
      if (!appointmentId) {
        navigate('/booking');
        return;
      }

      const result = await paymentApi.cancelPayment(appointmentId);

      if (result.success) {
        // Navigate back to booking with cancellation message
        navigate('/booking', { 
          state: { 
            message: 'Thanh toán đã bị hủy. Bạn có thể đặt lịch lại.',
            type: 'warning'
          }
        });
      } else {
        setErrorMessage(result.message || 'Không thể hủy thanh toán');
        setStatus('error');
      }
    } catch (error: any) {
      console.error('Payment cancellation error:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Lỗi kết nối. Vui lòng thử lại.');
      setStatus('error');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
      case 'creating':
        return (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">
              {status === 'loading' ? 'Đang khởi tạo...' : 'Đang tạo liên kết thanh toán...'}
            </h2>
            <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
          </div>
        );

      case 'redirecting':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Chuẩn bị chuyển đến trang thanh toán</h2>
            <p className="text-gray-600 mb-4">
              Bạn sẽ được chuyển đến PayOS trong {countdown} giây...
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={handleRedirectNow}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
              >
                Thanh toán ngay
              </button>
              
              <button 
                onClick={handleCancel}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
              >
                Hủy thanh toán
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-600">Có lỗi xảy ra</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            
            <div className="space-y-3">
              <button 
                onClick={createPaymentLink}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
              >
                Thử lại
              </button>
              
              <button 
                onClick={() => navigate('/booking')}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
              >
                Quay lại đặt lịch
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-center">Thanh toán lịch hẹn</h1>
          </div>
          <div className="p-6">
            {renderContent()}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
              <svg className="w-3 h-3 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm">
              <p className="font-medium text-yellow-800 mb-1">Lưu ý bảo mật:</p>
              <ul className="text-yellow-700 space-y-1">
                <li>• Bạn sẽ được chuyển đến trang thanh toán chính thức của PayOS</li>
                <li>• Không chia sẻ thông tin thanh toán cho bất kỳ ai</li>
                <li>• Phiên thanh toán sẽ hết hạn sau 15 phút</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessPage; 