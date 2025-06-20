import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentCancelPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appointmentId = searchParams.get('appointmentId');

  const retryPayment = () => {
    if (appointmentId) {
      navigate(`/payment/process?appointmentId=${appointmentId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-red-600">Thanh toán đã bị hủy</h1>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Giao dịch không hoàn thành</h3>
              <p className="text-gray-600 text-sm mb-4">
                Thanh toán của bạn đã bị hủy hoặc không thể hoàn thành. Lịch hẹn vẫn đang chờ thanh toán.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">Lưu ý quan trọng</h4>
                  <p className="mt-1 text-sm text-yellow-700">
                    Lịch hẹn của bạn sẽ bị hủy tự động nếu không thanh toán trong thời gian quy định.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {appointmentId && (
                <button 
                  onClick={retryPayment}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Thử thanh toán lại
                </button>
              )}
              
              <button 
                onClick={() => navigate('/booking-history')}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Xem lịch sử đặt hẹn
              </button>
              
              <button 
                onClick={() => navigate('/')}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
              >
                Về trang chủ
              </button>
            </div>

            <div className="text-center text-xs text-gray-500 pt-4">
              <p>Cần hỗ trợ? Liên hệ hotline: 1900-xxxx</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage; 