import React, { useEffect, useState } from 'react';
import { Card, Button, Row, Col, Typography, Tag, Divider, Steps, Space, message } from 'antd';
import { useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TickSquare as CheckSquare, 
  VideoPlay, 
  Calendar, 
  Clock,
  Profile,
  Call,
  Heart,
  Award,
  Shield
} from 'iconsax-react';
import { consultationApi } from '../../api';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

interface ConsultationInfo {
  _id: string;
  fullName: string;
  phone: string;
  question: string;
  notes?: string;
  status: string;
  doctorId?: string;
  appointmentDate?: string;
  appointmentSlot?: string;
  createdAt: string;
}

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { qaId: pathQaId } = useParams<{ qaId?: string }>();
  
  // Get qaId from either URL path params or query params
  const qaId = pathQaId || searchParams.get('qaId');
  
  const [consultation, setConsultation] = useState<ConsultationInfo | null>(
    location.state?.consultation || null
  );
  const [isLoading, setIsLoading] = useState(!consultation);
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'success' | 'failed'>('checking');

  // Check URL parameters for PayOS success
  useEffect(() => {
    const code = searchParams.get('code');
    const cancel = searchParams.get('cancel');
    const status = searchParams.get('status');
    const orderCode = searchParams.get('orderCode');
    
    console.log('🔍 Consultation Success - URL Parameters:', { code, cancel, status, orderCode, qaId });
    
    // Nếu có URL parameters từ PayOS thì process payment
    if (code && status && orderCode && qaId) {
      const isPaid = code === '00' && cancel === 'false' && status === 'PAID';
      
      if (isPaid) {
        console.log('✅ Consultation Payment SUCCESS detected from URL');
        handlePayOSSuccess(orderCode, status);
      } else {
        console.log('❌ Consultation Payment FAILED from URL');
        setPaymentStatus('failed');
      }
    } else if (!consultation && qaId) {
      // Nếu không có URL params, fetch consultation info và coi như success
      fetchConsultationInfo();
    } else {
      // Nếu có consultation từ state, coi như success
      setPaymentStatus('success');
    }
  }, [searchParams, qaId, consultation]);

  const handlePayOSSuccess = async (orderCode: string, status: string) => {
    if (!qaId) return;
    
    try {
      console.log('🚀 Fast confirming consultation payment...', { qaId, orderCode, status });
      
      // Gọi API để confirm payment với backend
      const response = await consultationApi.fastConfirmConsultationPayment({
        qaId,
        orderCode,
        status
      });
      
      if (response.data.success) {
        console.log('✅ Consultation payment confirmed successfully');
        message.success('Thanh toán thành công! Yêu cầu tư vấn đã được xác nhận.');
        setPaymentStatus('success');
        
        // Fetch updated consultation info
        if (!consultation) {
          fetchConsultationInfo();
        }
      } else {
        throw new Error(response.data.message || 'Không thể xác nhận thanh toán');
      }
      
    } catch (error: unknown) {
      console.error('❌ Error confirming consultation payment:', error);
      const errorMessage = (error as any)?.response?.data?.message || (error as Error)?.message || 'Lỗi xác nhận thanh toán';
      message.error(errorMessage);
      setPaymentStatus('failed');
    }
  };

  // Note: Removed auto redirect countdown as per user request

  const fetchConsultationInfo = async () => {
    if (!qaId) return;
    
    try {
      const response = await consultationApi.getConsultationById(qaId);
      setConsultation(response.data.data);
      setPaymentStatus('success');
    } catch (error: unknown) {
      const errorMessage = (error as any)?.response?.data?.message || (error as Error)?.message || 'Lỗi lấy thông tin tư vấn';
      message.error(errorMessage);
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewConsultations = () => {
    navigate('/booking-history', { replace: true });
  };

  const handleBackHome = () => {
    navigate('/');
  };

  // Note: Removed handleSkipCountdown as countdown is no longer needed

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
              Có lỗi xảy ra trong quá trình thanh toán tư vấn. Vui lòng thử lại.
            </Paragraph>
            
            <Space direction="vertical" className="w-full" size="middle">
              <Button 
                type="primary"
                size="large"
                onClick={() => navigate('/online-consultation')}
                className="w-full bg-blue-600 hover:bg-blue-700 border-none h-12 text-lg font-semibold rounded-xl"
                icon={<Calendar size={20} />}
              >
                🔄 Thử lại đặt tư vấn
              </Button>
              
              <Button 
                size="large"
                onClick={handleBackHome}
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
            Yêu cầu tư vấn đã được gửi đến bác sĩ. Chúng tôi sẽ liên hệ và cung cấp 
            link Google Meet trong vòng 24 giờ.
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
              title="Tư vấn" 
              description="Đang chuẩn bị"
              icon={<VideoPlay variant="Bold" />}
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
                        Bác sĩ xem xét yêu cầu
                      </Text>
                      <Text className="text-blue-700 text-sm">
                        Bác sĩ sẽ đánh giá câu hỏi và chuẩn bị nội dung tư vấn phù hợp
                      </Text>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <div>
                      <Text className="font-semibold text-orange-900 block mb-1">
                        Nhận link Google Meet
                      </Text>
                      <Text className="text-orange-700 text-sm">
                        Link tư vấn sẽ được gửi qua email và SMS trong vòng 24 giờ
                      </Text>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <div>
                      <Text className="font-semibold text-green-900 block mb-1">
                        Tham gia tư vấn trực tuyến
                      </Text>
                      <Text className="text-green-700 text-sm">
                        Click vào link để bắt đầu cuộc tư vấn với bác sĩ chuyên khoa
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
                    <li>• Kiểm tra email và SMS thường xuyên để nhận link tư vấn</li>
                    <li>• Chuẩn bị sẵn câu hỏi bổ sung nếu cần</li>
                    <li>• Đảm bảo kết nối internet ổn định khi tư vấn</li>
                    <li>• Tìm nơi riêng tư để bảo đảm tính bảo mật</li>
                  </ul>
                </div>

                {/* Note: Removed countdown display as per user request */}

                {/* Action Buttons */}
                <Space className="w-full" direction="vertical" size="middle">
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleViewConsultations}
                    className="w-full bg-green-primary hover:bg-green-secondary border-none h-12 text-lg font-semibold rounded-xl"
                    icon={<Calendar size={20} />}
                  >
                    📋 Xem lịch sử tư vấn
                  </Button>
                  
                  <Button
                    size="large"
                    onClick={handleBackHome}
                    className="w-full h-12 text-lg font-semibold rounded-xl border-green-primary text-green-primary hover:bg-green-50"
                    icon={<Heart size={20} />}
                  >
                    🏠 Về trang chủ
                  </Button>
                </Space>
              </Card>
            </motion.div>
          </Col>

          {/* Consultation Details */}
          <Col xs={24} lg={10}>
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-xl rounded-2xl">
                <Title level={4} className="text-gray-900 mb-4">
                  Chi tiết tư vấn
                </Title>
                
                {consultation && (
                  <div className="space-y-4">
                    <div>
                      <Text className="text-gray-500 block mb-1">Mã tư vấn:</Text>
                      <Text className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {consultation._id}
                      </Text>
                    </div>

                    <div>
                      <Text className="text-gray-500 block mb-1">Khách hàng:</Text>
                      <div className="flex items-center gap-2">
                        <Profile size={16} color="#6B7280" />
                        <Text className="font-semibold">{consultation.fullName}</Text>
                      </div>
                    </div>

                    <div>
                      <Text className="text-gray-500 block mb-1">Số điện thoại:</Text>
                      <div className="flex items-center gap-2">
                        <Call size={16} color="#6B7280" />
                        <Text className="font-semibold">{consultation.phone}</Text>
                      </div>
                    </div>

                    <Divider />

                    <div>
                      <Text className="text-gray-500 block mb-2">Câu hỏi tư vấn:</Text>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <Text className="text-sm">{consultation.question}</Text>
                      </div>
                    </div>

                    {consultation.notes && (
                      <div>
                        <Text className="text-gray-500 block mb-2">Ghi chú:</Text>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <Text className="text-sm">{consultation.notes}</Text>
                        </div>
                      </div>
                    )}

                    <Divider />

                    <div>
                      <Text className="text-gray-500 block mb-2">Trạng thái:</Text>
                      <Tag color="green" className="px-3 py-1">
                        Đã thanh toán - Chờ bác sĩ xử lý
                      </Tag>
                    </div>

                    <div>
                      <Text className="text-gray-500 block mb-2">Thời gian tạo:</Text>
                      <Text className="text-sm">
                        {new Date(consultation.createdAt).toLocaleString('vi-VN')}
                      </Text>
                    </div>

                    <div>
                      <Text className="text-gray-500 block mb-2">Giá dịch vụ:</Text>
                      <Text className="font-bold text-green-primary text-lg">
                        200.000 VND
                      </Text>
                    </div>
                  </div>
                )}
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
                        Mọi thông tin tư vấn được bảo mật tuyệt đối. 
                        Chúng tôi không chia sẻ dữ liệu cá nhân với bên thứ ba.
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
              Nếu bạn có thắc mắc hoặc cần hỗ trợ, đừng ngại liên hệ với chúng tôi
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