import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Space, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TickSquare as CheckSquare, 
  Calendar, 
  Clock,
  Heart,
  MoneyRecive
} from 'iconsax-react';
import { fastConfirmPayment } from '../../api/endpoints/payment';

const { Title, Paragraph, Text } = Typography;

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [paymentStatus, setPaymentStatus] = useState('checking');
  const [countdown, setCountdown] = useState(0);

  // Check URL params và gọi API để lưu vào database
  useEffect(() => {
    const appointmentId = searchParams.get('appointmentId');
    const code = searchParams.get('code');
    const cancel = searchParams.get('cancel');
    const status = searchParams.get('status');
    const orderCode = searchParams.get('orderCode') || searchParams.get('id');
    
    console.log('🔍 Appointment Success - URL Parameters:', { appointmentId, code, cancel, status, orderCode });
    
    // Nếu có URL parameters từ PayOS thì process payment
    if (code && status && orderCode && appointmentId) {
      const isPaid = code === '00' && cancel === 'false' && status === 'PAID';
      
      if (isPaid) {
        console.log('✅ Appointment Payment SUCCESS detected from URL');
        handlePayOSSuccess(appointmentId, orderCode, status);
      } else {
        console.log('❌ Appointment Payment FAILED from URL');
        setPaymentStatus('failed');
      }
    } else {
      // Nếu không có đủ params, coi như failed
      console.log('❌ Missing required URL parameters');
      setPaymentStatus('failed');
    }
  }, [searchParams]);

  const handlePayOSSuccess = async (appointmentId: string, orderCode: string, status: string) => {
    try {
      console.log('🚀 Fast confirming appointment payment...', { appointmentId, orderCode, status });
      
      // Gọi API để confirm payment với backend
      const response = await fastConfirmPayment({
        appointmentId,
        orderCode,
        status
      });
      
      if (response.success) {
        console.log('✅ Appointment payment confirmed successfully');
        message.success('Thanh toán thành công! Lịch hẹn đã được xác nhận.');
        setPaymentStatus('success');
        setCountdown(5); // 5s countdown
      } else {
        throw new Error(response.message || 'Không thể xác nhận thanh toán');
      }
      
    } catch (error: any) {
      console.error('❌ Error confirming appointment payment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi xác nhận thanh toán';
      message.error(errorMessage);
      setPaymentStatus('failed');
    }
  };

  // Auto redirect countdown
  useEffect(() => {
    if (paymentStatus === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        if (countdown === 1) {
          navigate('/booking-history', { replace: true });
        } else {
          setCountdown(countdown - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, countdown, navigate]);

  const handleNavigateToBookingHistory = () => {
    navigate('/booking-history', { replace: true });
  };

  const handleSkipCountdown = () => {
    setCountdown(0);
    handleNavigateToBookingHistory();
  };

  // CHECKING STATE
  if (paymentStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <Text className="text-lg text-gray-600">
            🔄 Đang xử lý thanh toán và lưu vào hệ thống...
          </Text>
        </div>
      </div>
    );
  }

  // SUCCESS STATE
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 flex items-center justify-center py-8">
        <motion.div 
          className="max-w-md mx-auto px-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-0 shadow-2xl rounded-3xl text-center overflow-hidden">
            <motion.div 
              className="mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckSquare size={48} color="white" variant="Bold" />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Title level={2} className="text-green-600 mb-4">
                🎉 Thanh toán thành công!
              </Title>
              
              <Paragraph className="text-gray-600 text-lg mb-6">
                Lịch hẹn của bạn đã được thanh toán và lưu vào hệ thống thành công.<br/>
                Thông tin đã được cập nhật vào database.
              </Paragraph>
            </motion.div>

            <motion.div 
              className="bg-green-50 p-4 rounded-xl border border-green-200 mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <CheckSquare size={24} color="#059669" variant="Bold" />
                <Text className="text-green-700 font-semibold">
                  ✅ Đã lưu vào database thành công!
                </Text>
              </div>
              <Text className="text-green-600 text-sm">
                💾 Thông tin thanh toán đã được ghi nhận<br/>
                📧 Email xác nhận đã được gửi
              </Text>
            </motion.div>

            {countdown > 0 && (
              <motion.div 
                className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock size={20} color="#3B82F6" />
                  <Text className="text-blue-800 font-medium">
                    Tự động chuyển sau
                  </Text>
                </div>
                <motion.div 
                  className="bg-blue-500 text-white font-bold text-xl px-3 py-1 rounded-lg inline-block"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {countdown}s
                </motion.div>
                <div className="mt-2">
                  <Button 
                    type="link"
                    size="small"
                    onClick={handleSkipCountdown}
                    className="text-blue-600 hover:text-blue-700 p-0"
                  >
                    ⚡ Chuyển ngay
                  </Button>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <Space direction="vertical" className="w-full" size="middle">
                <Button
                  type="primary"
                  size="large"
                  onClick={handleNavigateToBookingHistory}
                  className="w-full bg-green-500 hover:bg-green-600 border-none h-12 text-lg font-semibold rounded-xl shadow-lg"
                  icon={<Calendar size={20} />}
                >
                  📋 Xem lịch sử đặt hẹn
                </Button>
                
                <Button
                  size="large"
                  onClick={() => navigate('/')}
                  className="w-full h-12 text-lg font-semibold rounded-xl border-green-500 text-green-600 hover:bg-green-50"
                  icon={<Heart size={20} />}
                >
                  🏠 Về trang chủ
                </Button>
              </Space>
            </motion.div>

            <motion.div 
              className="mt-6 p-3 bg-gray-50 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              <Text className="text-gray-500 text-sm">
                💡 Chúng tôi sẽ liên hệ xác nhận lịch hẹn trong vòng 24h
              </Text>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ERROR STATE
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12 px-4">
      <motion.div 
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-xl rounded-2xl text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <Title level={3} className="text-red-600 mb-4">
            ❌ Thanh toán thất bại
          </Title>
          
          <Paragraph className="text-gray-600 mb-6">
            Có lỗi xảy ra trong quá trình thanh toán hoặc thiếu thông tin. Vui lòng thử lại.
          </Paragraph>
          
          <Space direction="vertical" className="w-full" size="middle">
            <Button 
              type="primary"
              size="large"
              onClick={handleNavigateToBookingHistory}
              className="w-full bg-blue-600 hover:bg-blue-700 border-none h-12 text-lg font-semibold rounded-xl"
              icon={<Calendar size={20} />}
            >
              📋 Quay lại lịch sử đặt hẹn
            </Button>
            
            <Button 
              size="large"
              onClick={() => navigate('/')}
              className="w-full h-12 text-lg font-semibold rounded-xl border-gray-300"
              icon={<Heart size={20} />}
            >
              🏠 Về trang chủ
            </Button>
          </Space>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentSuccessPage; 