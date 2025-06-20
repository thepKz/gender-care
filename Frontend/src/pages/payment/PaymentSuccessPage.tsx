import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface AppointmentData {
  appointmentDate: string;
  appointmentTime: string;
  serviceId?: { serviceName: string };
  packageId?: { name: string };
  status: string;
  totalAmount?: number;
}

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appointmentId = searchParams.get('appointmentId');
  
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appointmentId) {
      checkAppointmentStatus();
    } else {
      setError('Không tìm thấy thông tin lịch hẹn');
      setLoading(false);
    }
  }, [appointmentId]);

  const checkAppointmentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 1. Kiểm tra và cập nhật payment status trước
      try {
        console.log('Kiểm tra và cập nhật payment status cho appointment:', appointmentId);
        const paymentCheckResponse = await fetch(`/api/payments/appointments/${appointmentId}/payment/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (paymentCheckResponse.ok) {
          const paymentResult = await paymentCheckResponse.json();
          console.log('Payment status check result:', paymentResult);
          
          // Nếu payment tracking có status = 'success' nhưng appointment chưa confirmed
          if (paymentResult.data?.status === 'success' && paymentResult.data?.appointmentStatus !== 'confirmed') {
            console.log('Payment successful but appointment not confirmed yet, updating...');
            // Gọi API để update appointment status
            const updateResponse = await fetch(`/api/appointments/${appointmentId}/payment`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ status: 'confirmed' })
            });
            
            if (updateResponse.ok) {
              console.log('Successfully updated appointment status to confirmed');
            }
          }
        }
      } catch (paymentError) {
        console.warn('Error checking payment status:', paymentError);
        // Tiếp tục lấy thông tin appointment dù check payment lỗi
      }
      
      // 2. Lấy thông tin appointment mới nhất
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        setAppointment(result.data);
        console.log('Appointment data after payment check:', result.data);
      } else {
        setError(result.message || 'Không thể lấy thông tin lịch hẹn');
      }
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Đang xử lý...</h2>
            <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Có lỗi xảy ra</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => navigate('/booking-history')}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
            >
              Quay lại lịch sử đặt hẹn
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-green-600">Thanh toán thành công!</h1>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Lịch hẹn đã được xác nhận</h3>
              <p className="text-gray-600 text-sm mb-4">
                Cảm ơn bạn đã thanh toán. Lịch hẹn của bạn đã được xác nhận và chúng tôi sẽ liên hệ với bạn sớm nhất.
              </p>
            </div>

            {appointment && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-gray-800">Thông tin lịch hẹn:</h4>
                
                <div className="flex items-center space-x-2 text-sm">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Ngày: {new Date(appointment.appointmentDate).toLocaleDateString('vi-VN')}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Giờ: {appointment.appointmentTime}</span>
                </div>
                
                {appointment.serviceId && (
                  <div className="text-sm">
                    <span className="text-gray-600">Dịch vụ: </span>
                    <span className="font-medium">{appointment.serviceId.serviceName}</span>
                  </div>
                )}
                
                {appointment.packageId && (
                  <div className="text-sm">
                    <span className="text-gray-600">Gói dịch vụ: </span>
                    <span className="font-medium">{appointment.packageId.name}</span>
                  </div>
                )}
                
                <div className="text-sm">
                  <span className="text-gray-600">Trạng thái: </span>
                  <span className="font-medium text-green-600">
                    {appointment.status === 'confirmed' ? 'Đã xác nhận' : appointment.status}
                  </span>
                </div>
                
                {appointment.totalAmount && (
                  <div className="text-sm">
                    <span className="text-gray-600">Số tiền đã thanh toán: </span>
                    <span className="font-medium text-green-600">
                      {appointment.totalAmount.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button 
                onClick={() => navigate('/booking-history')}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200"
              >
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
              <p>Nếu có thắc mắc, vui lòng liên hệ hotline: 1900-xxxx</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage; 