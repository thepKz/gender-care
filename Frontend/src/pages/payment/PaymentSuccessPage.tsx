import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import { fastConfirmPayment } from '../../api/endpoints/payment';

interface AppointmentData {
  appointmentDate: string;
  appointmentTime: string;
  serviceId?: { serviceName: string };
  packageId?: { name: string };
  status: string;
  totalAmount?: number;
}

const PaymentSuccessPage = () => {
  // FORCE RENDER DEBUG
  console.log('🚨 [PaymentSuccess] COMPONENT RENDERING!!!');
  console.log('🚨 [PaymentSuccess] Current URL:', window.location.href);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'pending' | 'failed' | 'cancelled'>('pending');
  const [updateAttempted, setUpdateAttempted] = useState(false);

  // CRITICAL: Immediately fix hash fragments that break navigation
  useEffect(() => {
    const currentUrl = window.location.href;
    console.log('🔧 [PaymentSuccess] Current URL:', currentUrl);
    
    if (currentUrl.includes('#')) {
      console.log('⚠️ [PaymentSuccess] Hash detected - this breaks navigation!');
      const cleanUrl = currentUrl.split('#')[0];
      console.log('🧹 [PaymentSuccess] Cleaning to:', cleanUrl);
      
      // Force immediate URL replace to prevent navigation conflicts
      window.history.replaceState(null, '', cleanUrl);
      
      // Force page reload if hash points to different route
      const hashPart = currentUrl.split('#')[1];
      if (hashPart && hashPart.startsWith('/') && hashPart !== '/payment/success') {
        console.log('🚨 [PaymentSuccess] Hash contains route conflict - force reload');
        window.location.replace(cleanUrl);
        return;
      }
    }
  }, []);

  // CRITICAL: IMMEDIATE redirect for PAID status without ANY delay
  useEffect(() => {
    console.log('🚀 [PaymentSuccess] Component mounted/updated');
    console.log('🔍 [PaymentSuccess] Current URL:', window.location.href);
    
    const code = searchParams.get('code');
    const cancel = searchParams.get('cancel');
    const status = searchParams.get('status');
    
    console.log('🎯 [PaymentSuccess] URL Parameters:', { 
      code, 
      cancel, 
      status, 
      appointmentId,
      updateAttempted 
    });
    
    // Debug exact condition check
    const isPaid = code === '00' && cancel === 'false' && status === 'PAID';
    console.log('✅ [PaymentSuccess] Is PAID condition met?', isPaid);
    
    if (isPaid) {
      console.log('🚨 [PaymentSuccess] PAID DETECTED - STARTING REDIRECT');
      
      // START API call in background
      if (appointmentId && !updateAttempted) {
        console.log('🔄 [PaymentSuccess] Starting API call...');
        updateAppointmentPaymentStatus();
      }
      
      // Use React Router navigation với replace để clean URL
      console.log('🚀 [PaymentSuccess] Calling navigate...');
      navigate('/booking-history', { replace: true });
      console.log('✅ [PaymentSuccess] Navigate called');
      return;
    } else {
      console.log('⚠️ [PaymentSuccess] PAID condition not met, setting other status');
      if (cancel === 'true') {
        setPaymentStatus('cancelled');
      } else if (status && status !== 'PAID') {
        setPaymentStatus('pending');
      } else {
        setPaymentStatus('failed');
      }
    }
  }, [searchParams, appointmentId, updateAttempted, navigate]);

  // Auto redirect countdown
  useEffect(() => {
    if (paymentStatus === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        if (countdown === 1) {
          handleNavigateToBookingHistory();
        } else {
          setCountdown(countdown - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, countdown]);

  // Handle appointment loading/updating
  useEffect(() => {
    if (!appointmentId) {
      setError('Không tìm thấy thông tin lịch hẹn');
      setLoading(false);
      return;
    }

    if (paymentStatus === 'success' && !updateAttempted) {
      console.log('🚀 [PaymentSuccess] Processing PAID status...');
      updateAppointmentPaymentStatus();
    } else if (paymentStatus !== 'pending' && paymentStatus !== 'success') {
      fetchAppointmentInfo();
    }
  }, [appointmentId, paymentStatus, updateAttempted]);

  const updateAppointmentPaymentStatus = async () => {
    setUpdateAttempted(true);
    
    const orderCode = searchParams.get('orderCode');
    const status = searchParams.get('status');
    
    if (!orderCode || !status) {
      console.error('❌ [PaymentSuccess] Missing orderCode or status from URL');
      setError('Thiếu thông tin thanh toán');
      setLoading(false);
      return;
    }
    
    try {
      console.log('⚡ [PaymentSuccess] Fast confirming payment for:', appointmentId);
      
      // Use NEW fast confirm API
      const updateResponse = await fastConfirmPayment({
        appointmentId: appointmentId!,
        orderCode: orderCode,
        status: status
      });
      
      console.log('✅ [PaymentSuccess] Fast confirm response:', updateResponse);
      
      if (updateResponse.success) {
        setAppointment({
          appointmentDate: '', // Sẽ được load từ API khác nếu cần
          appointmentTime: '',
          status: 'confirmed',
          totalAmount: 0
        });
        console.log('📋 [PaymentSuccess] Payment confirmed successfully');
        
        // Set success immediately để có thể redirect
        setPaymentStatus('success');
        
        // Immediate redirect after successful fast confirm
        console.log('🚀 [PaymentSuccess] Fast confirm successful, redirecting immediately...');
        setTimeout(() => {
          window.location.href = '/booking-history';
        }, 1000); // 1 second delay for user to see success message
      }
      
    } catch (error) {
      console.error('❌ [PaymentSuccess] Fast confirm failed:', error);
      
      // Fallback to old API method
      try {
        console.log('🔄 [PaymentSuccess] Falling back to old API...');
        const updateResponse = await axiosInstance.put(`/appointments/${appointmentId}/payment`, {
          status: 'confirmed'
        });
        
        console.log('✅ [PaymentSuccess] Fallback update response:', updateResponse.data);
        
        // Fetch updated appointment
        const appointmentResponse = await axiosInstance.get(`/appointments/${appointmentId}`);
        
        if (appointmentResponse.data?.data) {
          setAppointment(appointmentResponse.data.data);
          console.log('📋 [PaymentSuccess] Updated appointment loaded:', appointmentResponse.data.data.status);
        }
        
      } catch (fallbackError) {
        console.error('❌ [PaymentSuccess] Both fast confirm and fallback failed:', fallbackError);
        setError('Không thể cập nhật trạng thái thanh toán. Vui lòng kiểm tra lịch sử đặt lịch.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentInfo = async () => {
    try {
      console.log('📋 [PaymentSuccess] Fetching appointment info...');
      const response = await axiosInstance.get(`/appointments/${appointmentId}`);
      
      if (response.data?.data) {
        setAppointment(response.data.data);
      } else {
        setError('Không thể lấy thông tin lịch hẹn');
      }
    } catch (error) {
      console.error('❌ [PaymentSuccess] Fetch error:', error);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToBookingHistory = () => {
    console.log('🚀 [PaymentSuccess] Navigating to booking history...');
    setCountdown(0);
    navigate('/booking-history', { replace: true });
  };

  const handleSkipCountdown = () => {
    console.log('⏩ [PaymentSuccess] User skipped countdown');
    handleNavigateToBookingHistory();
  };

  // Render methods
  const renderStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'cancelled':
        return (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'pending':
        return (
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const renderStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <>
            <h1 className="text-xl font-semibold text-green-600">Thanh toán thành công!</h1>
            <p className="text-gray-600 text-sm mt-2">
              Lịch hẹn của bạn đã được xác nhận và chúng tôi sẽ liên hệ với bạn sớm nhất.
            </p>
            {countdown > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  Tự động chuyển về lịch sử đặt hẹn sau <span className="font-semibold">{countdown}</span> giây...
                </p>
                <button 
                  onClick={handleSkipCountdown}
                  className="mt-2 text-green-600 hover:text-green-700 text-sm underline"
                >
                  Chuyển ngay
                </button>
              </div>
            )}
          </>
        );
      case 'cancelled':
        return (
          <>
            <h1 className="text-xl font-semibold text-red-600">Thanh toán đã bị hủy</h1>
            <p className="text-gray-600 text-sm mt-2">
              Bạn đã hủy quá trình thanh toán. Lịch hẹn vẫn được giữ nguyên với trạng thái chờ thanh toán.
            </p>
          </>
        );
      case 'pending':
        return (
          <>
            <h1 className="text-xl font-semibold text-yellow-600">Đang chờ thanh toán</h1>
            <p className="text-gray-600 text-sm mt-2">
              Thanh toán của bạn đang được xử lý. Vui lòng kiểm tra lại sau ít phút.
            </p>
          </>
        );
      default:
        return (
          <>
            <h1 className="text-xl font-semibold text-gray-600">Trạng thái không xác định</h1>
            <p className="text-gray-600 text-sm mt-2">
              Không thể xác định trạng thái thanh toán. Vui lòng kiểm tra lại lịch sử đặt hẹn.
            </p>
          </>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Đang xử lý thanh toán...</h2>
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
              onClick={handleNavigateToBookingHistory}
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
            {renderStatusIcon()}
            {renderStatusMessage()}
          </div>

          {appointment && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
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
                <span className={`font-medium ${
                  appointment.status === 'confirmed' ? 'text-green-600' : 
                  appointment.status === 'pending_payment' ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {appointment.status === 'confirmed' ? 'Đã thanh toán' : 
                   appointment.status === 'pending_payment' ? 'Chờ thanh toán' : appointment.status}
                </span>
              </div>
              
              {appointment.totalAmount && (
                <div className="text-sm">
                  <span className="text-gray-600">Số tiền: </span>
                  <span className={`font-medium ${paymentStatus === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
                    {appointment.totalAmount.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button 
              onClick={handleNavigateToBookingHistory}
              className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-200 ${
                paymentStatus === 'success' 
                  ? 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {paymentStatus === 'success' ? 'Xem lịch sử đặt hẹn' : 'Quay lại lịch sử đặt hẹn'}
            </button>
            
            <button 
              onClick={() => navigate('/', { replace: true })}
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
  );
};

export default PaymentSuccessPage; 