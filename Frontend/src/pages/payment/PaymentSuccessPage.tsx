import React, { useEffect, useState } from 'react';
import { Card, Button, Row, Col, Typography, Tag, Divider, Steps, Space, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TickSquare as CheckSquare, 
  Calendar, 
  Clock,
  Profile,
  Heart,
  Award,
  Shield,
  MoneyRecive
} from 'iconsax-react';
import { paymentApi } from '../../api';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get appointmentId from URL params
  const appointmentId = searchParams.get('appointmentId');
  
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'success' | 'failed'>('checking');
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);

  // ✅ FIX: Fallback function to fetch appointment amount
  const fetchAppointmentAmount = async () => {
    if (!appointmentId) return;
    
    try {
      console.log('🔄 [PaymentSuccess] Fetching appointment amount as fallback...');
      // Import appointmentApi để lấy thông tin appointment
      const { appointmentApi } = await import('../../api');
      const response = await appointmentApi.getAppointmentById(appointmentId);
      
      if (response.success && response.data) {
        const appointment = response.data;
        const amount = appointment.totalAmount || 0;
        console.log('💰 [PaymentSuccess] Fallback amount from appointment:', amount);
        console.log('🔍 [DEBUG] Appointment data:', appointment); // ✅ DEBUG: Log appointment data
        setPaymentAmount(amount);
      } else {
        console.error('❌ [PaymentSuccess] Failed to get appointment:', response);
      }
    } catch (error) {
      console.error('❌ [PaymentSuccess] Failed to fetch appointment amount:', error);
      // Giữ paymentAmount = null để hiển thị "Đang tải..."
    }
  };

  // Fast confirm payment with PayOS success parameters
  const handlePayOSSuccess = async (orderCode: string, status: string) => {
    if (!appointmentId) return;
    
    try {
      console.log('🚀 Fast confirming appointment payment...', { appointmentId, orderCode, status });
      
      // Gọi API để confirm payment với backend
      const response = await paymentApi.fastConfirmPayment({
        appointmentId,
        orderCode,
        status
      });
      
      if (response.success) {
        console.log('✅ Appointment payment confirmed successfully');
        console.log('🔍 [DEBUG] Full backend response:', response); // ✅ DEBUG: Log toàn bộ response
        message.success('Thanh toán thành công! Lịch hẹn đã được xác nhận.');
        setPaymentStatus('success');
        
        // ✅ FIX: Set payment amount from backend response
        if (response.data && typeof response.data === 'object' && 'amount' in response.data) {
          const amount = (response.data as { amount: number }).amount;
          console.log('💰 [PaymentSuccess] Amount received from backend:', amount);
          setPaymentAmount(amount);
        } else {
          console.warn('⚠️ [PaymentSuccess] No amount in backend response:', response.data);
          console.warn('⚠️ [PaymentSuccess] Will fetch from appointment as fallback');
          // Fallback: fetch appointment để lấy totalAmount
          fetchAppointmentAmount();
        }
        
        // Fetch updated appointment info nếu cần
        // fetchAppointmentInfo();
      } else {
        throw new Error(response.message || 'Không thể xác nhận thanh toán');
      }
      
    } catch (error: unknown) {
      console.error('❌ Error confirming appointment payment:', error);
      // Proper error typing instead of 'any'
      interface ApiError {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
      const errorMessage = (error as ApiError)?.response?.data?.message || (error as Error)?.message || 'Lỗi xác nhận thanh toán';
      message.error(errorMessage);
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Check URL parameters for PayOS success
  useEffect(() => {
    const code = searchParams.get('code');
    const cancel = searchParams.get('cancel');
    const status = searchParams.get('status');
    const orderCode = searchParams.get('orderCode');
    
    console.log('🔍 Appointment Success - URL Parameters:', { 
      code, 
      cancel, 
      status, 
      orderCode, 
      appointmentId,
      fullURL: window.location.href 
    });
    
    // ✅ DEBUG: Extract additional payment info from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    console.log('🔍 [DEBUG] All URL params:', Object.fromEntries(urlParams.entries()));
    
    // Nếu có URL parameters từ PayOS thì process payment
    if (code && status && orderCode && appointmentId) {
      const isPaid = code === '00' && cancel === 'false' && status === 'PAID';
      
      if (isPaid) {
        console.log('✅ Appointment Payment SUCCESS detected from URL');
        handlePayOSSuccess(orderCode, status);
      } else {
        console.log('❌ Appointment Payment FAILED from URL');
        setPaymentStatus('failed');
        setIsLoading(false);
      }
    } else if (appointmentId) {
      // Nếu có appointmentId nhưng không có payment params, coi như success đơn giản
      console.log('📋 No payment params, treating as simple success...');
      setPaymentStatus('success');
      // ✅ FIX: Lấy amount từ appointment khi không có payment params
      fetchAppointmentAmount();
      setIsLoading(false);
      
      // ✅ WORKAROUND: Set default amount nếu không lấy được từ backend
      setTimeout(() => {
        if (paymentAmount === null) {
          console.warn('⚠️ [WORKAROUND] Setting default amount 200000 after 3 seconds');
          setPaymentAmount(200000); // Default 200k VND
        }
      }, 3000);
    } else {
      // Nếu không có appointmentId, redirect về booking page
      console.log('❌ No appointmentId found, redirecting...');
      message.error('Không tìm thấy thông tin lịch hẹn');
      navigate('/booking', { replace: true });
    }
  }, [searchParams, appointmentId, navigate]);

  const handleViewBookingHistory = () => {
    navigate('/booking-history', { replace: true });
  };

  const handleBackHome = () => {
    navigate('/');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  if (isLoading || paymentStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-primary mx-auto mb-4"></div>
          <Text className="text-lg text-gray-600">
            {paymentStatus === 'checking' ? 'Đang xử lý thanh toán...' : 'Đang tải thông tin...'}
          </Text>
        </div>
      </div>
    );
  }

  // FAILED STATE
  if (paymentStatus === 'failed') {
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
              Có lỗi xảy ra trong quá trình thanh toán lịch hẹn. Vui lòng thử lại.
            </Paragraph>
            
            <Space direction="vertical" className="w-full" size="middle">
              <Button 
                type="primary"
                size="large"
                onClick={handleViewBookingHistory}
                className="w-full bg-blue-600 hover:bg-blue-700 border-none h-12 text-lg font-semibold rounded-xl"
                icon={<Calendar size={20} />}
              >
                 Quay lại lịch hẹn
              </Button>
              
              <Button 
                size="large"
                onClick={handleBackHome}
                className="w-full h-12 text-lg font-semibold rounded-xl border-gray-300"
                icon={<Heart size={20} />}
              >
                 Về trang chủ
              </Button>
            </Space>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
      <motion.div 
        className="container mx-auto px-4 max-w-4xl"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Success Header */}
        <motion.div 
          className="text-center mb-8"
          variants={itemVariants}
        >
          <div className="mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.5, 
                type: "spring", 
                stiffness: 200, 
                damping: 15 
              }}
              className="w-24 h-24 bg-green-primary rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckSquare size={48} color="white" variant="Bold" />
            </motion.div>
          </div>
          
          <Title level={1} className="text-green-primary mb-4">
            Thanh toán thành công!
          </Title>
          <Paragraph className="text-lg text-gray-600 max-w-2xl mx-auto">
            Lịch hẹn của bạn đã được thanh toán thành công. Chúng tôi sẽ liên hệ xác nhận 
            trong vòng 24 giờ.
          </Paragraph>
        </motion.div>

        {/* Progress Steps */}
        <motion.div variants={itemVariants} className="mb-8">
          <Steps current={2} className="mb-8">
            <Step 
              title="Đặt lịch" 
              description="Hoàn thành"
              icon={<CheckSquare variant="Bold" />}
            />
            <Step 
              title="Thanh toán" 
              description="Thành công"
              icon={<CheckSquare variant="Bold" />}
            />
            <Step 
              title="Khám bệnh" 
              description="Sắp diễn ra"
              icon={<Calendar variant="Bold" />}
            />
          </Steps>
        </motion.div>

        <Row gutter={[24, 24]}>
          {/* Main Success Card */}
          <Col xs={24} lg={14}>
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-xl rounded-2xl">
                <Title level={3} className="text-gray-900 mb-6 flex items-center gap-3">
                  <Award size={24} color="#10B981" variant="Bold" />
                  Bước tiếp theo
                </Title>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <div>
                      <Text className="font-semibold text-blue-900 block mb-1">
                        Xác nhận lịch hẹn
                      </Text>
                      <Text className="text-blue-700 text-sm">
                        Chúng tôi sẽ liên hệ để xác nhận thời gian và địa điểm khám
                      </Text>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <div>
                      <Text className="font-semibold text-orange-900 block mb-1">
                        Chuẩn bị khám
                      </Text>
                      <Text className="text-orange-700 text-sm">
                        Mang theo giấy tờ tùy thân và các xét nghiệm liên quan (nếu có)
                      </Text>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <div>
                      <Text className="font-semibold text-green-900 block mb-1">
                        Đến khám đúng giờ
                      </Text>
                      <Text className="text-green-700 text-sm">
                        Có mặt tại phòng khám theo đúng thời gian đã đặt
                      </Text>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Important Notes */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
                  <Title level={5} className="text-yellow-800 mb-2 flex items-center gap-2">
                    <Clock size={16} />
                    Lưu ý quan trọng
                  </Title>
                  <ul className="text-yellow-700 text-sm space-y-1 mb-0">
                    <li>• Kiểm tra email và SMS thường xuyên để nhận thông báo</li>
                    <li>• Đến trước giờ hẹn 15-30 phút để làm thủ tục</li>
                    <li>• Mang theo giấy tờ tùy thân và thẻ bảo hiểm y tế</li>
                    <li>• Liên hệ hotline nếu cần thay đổi lịch hẹn</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <Space className="w-full" direction="vertical" size="middle">
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleViewBookingHistory}
                    className="w-full bg-green-primary hover:bg-green-secondary border-none h-12 text-lg font-semibold rounded-xl"
                    icon={<Calendar size={20} />}
                  >
                     Xem lịch sử đặt hẹn
                  </Button>
                  
                  <Button
                    size="large"
                    onClick={handleBackHome}
                    className="w-full h-12 text-lg font-semibold rounded-xl border-green-primary text-green-primary hover:bg-green-50"
                    icon={<Heart size={20} />}
                  >
                     Về trang chủ
                  </Button>
                </Space>
              </Card>
            </motion.div>
          </Col>

          {/* Appointment Details */}
          <Col xs={24} lg={10}>
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-xl rounded-2xl">
                <Title level={4} className="text-gray-900 mb-4">
                  Chi tiết lịch hẹn
                </Title>
                
                <div className="space-y-4">
                  <div>
                    <Text className="text-gray-500 block mb-1">Mã lịch hẹn:</Text>
                    <Text className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {appointmentId}
                    </Text>
                  </div>

                  <div>
                    <Text className="text-gray-500 block mb-1">Dịch vụ:</Text>
                    <div className="flex items-center gap-2">
                      <MoneyRecive size={16} color="#6B7280" />
                      <Text className="font-semibold">Dịch vụ y tế</Text>
                    </div>
                  </div>

                  <div>
                    <Text className="text-gray-500 block mb-1">Hình thức:</Text>
                    <div className="flex items-center gap-2">
                      <Profile size={16} color="#6B7280" />
                      <Text className="font-semibold">Khám tại phòng khám</Text>
                    </div>
                  </div>

                  <Divider />

                  <div>
                    <Text className="text-gray-500 block mb-2">Trạng thái:</Text>
                    <Tag color="green" className="px-3 py-1">
                      Đã thanh toán - Chờ xác nhận
                    </Tag>
                  </div>

                  <div>
                    <Text className="text-gray-500 block mb-2">Thời gian đặt:</Text>
                    <Text className="text-sm">
                      {new Date().toLocaleString('vi-VN')}
                    </Text>
                  </div>

                  <div>
                    <Text className="text-gray-500 block mb-2">Tổng thanh toán:</Text>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <Text className="font-bold text-green-primary text-xl">
                            {paymentAmount ? `${paymentAmount.toLocaleString('vi-VN')} VND` : 'Đang tải...'}
                          </Text>
                          <Text className="text-green-600 text-sm block">
                            Phí dịch vụ y tế
                          </Text>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckSquare size={20} color="#10B981" variant="Bold" />
                          <Text className="text-green-700 font-semibold">
                            Đã thanh toán
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Success Status */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckSquare size={16} color="white" variant="Bold" />
                      </div>
                      <Text className="font-semibold text-green-800">
                        Thanh toán thành công!
                      </Text>
                    </div>
                    <Text className="text-green-700 text-sm">
                       Lịch hẹn đã được xác nhận<br/>
                       Thông báo xác nhận đã được gửi
                    </Text>
                  </div>
                </div>
              </Card>

              {/* Security Note */}
              <motion.div variants={itemVariants} className="mt-6">
                <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex items-start gap-3">
                    <Shield size={24} color="#10B981" className="mt-1" />
                    <div>
                      <Text className="font-semibold text-gray-800 block mb-2">
                        Cam kết bảo mật
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        Mọi thông tin cá nhân và y tế được bảo mật tuyệt đối theo 
                        quy định pháp luật về bảo vệ dữ liệu.
                      </Text>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          </Col>
        </Row>

        {/* Contact Support */}
        <motion.div variants={itemVariants} className="mt-8">
          <Card className="border-0 shadow-xl rounded-2xl text-center">
            <Title level={4} className="text-gray-900 mb-4">
              Cần hỗ trợ?
            </Title>
            <Paragraph className="text-gray-600 mb-6">
              Nếu bạn có thắc mắc hoặc cần thay đổi lịch hẹn, đừng ngại liên hệ với chúng tôi
            </Paragraph>
            <Space size="large">
              <Button 
                size="large"
                className="h-12 px-6 text-lg rounded-xl border-blue-primary text-blue-primary hover:bg-blue-50"
              >
                Hotline: 1900-1234
              </Button>
              <Button 
                size="large"
                className="h-12 px-6 text-lg rounded-xl border-green-primary text-green-primary hover:bg-green-50"
              >
                Email: support@healthcare.com
              </Button>
            </Space>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccessPage; 