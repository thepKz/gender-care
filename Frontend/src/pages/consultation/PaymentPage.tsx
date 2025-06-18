import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Progress, message, Space, Divider, Tag, Steps } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CardEdit as CreditCard, 
  Clock, 
  Shield, 
  TickSquare as CheckSquare, 
  CloseSquare,
  Profile,
  Call,
  VideoPlay
} from 'iconsax-react';
import { consultationApi } from '../../api';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

// Temporary QR Code component
const QRCodeSVG: React.FC<{ 
  value: string; 
  size?: number; 
  level?: string; 
  includeMargin?: boolean; 
  className?: string;
}> = ({ value, size = 200, className }) => (
  <div 
    className={`${className} bg-white border-2 border-gray-300 flex items-center justify-center rounded-lg`}
    style={{ width: size, height: size }}
  >
    <div className="text-center p-4">
      <div className="text-xs text-gray-500 mb-2">QR Code</div>
      <div className="text-xs break-all text-gray-700 font-mono max-w-[150px]">{value}</div>
      <div className="text-xs text-gray-500 mt-2">Quét để thanh toán</div>
    </div>
  </div>
);

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

const PaymentPage: React.FC = () => {
  const { qaId } = useParams<{ qaId: string }>();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState<ConsultationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  
  // Mock QR data
  const qrData = `PAYMENT_${qaId}_100000_VND`;
  const paymentAmount = 100000; // 100k VND

  useEffect(() => {
    if (qaId) {
      fetchConsultationInfo();
    }
  }, [qaId]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          message.warning('Phiên thanh toán đã hết hạn. Vui lòng thử lại.');
          navigate('/online-consultation');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const fetchConsultationInfo = async () => {
    try {
      const response = await consultationApi.getConsultationById(qaId!);
      setConsultation(response.data.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi lấy thông tin tư vấn';
      message.error(errorMessage);
      navigate('/online-consultation');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!qaId) return;
    
    setIsProcessingPayment(true);
    try {
      // Mock payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call API to update payment status
      const response = await consultationApi.updatePaymentStatus(qaId, { paymentSuccess: true });
      
      // Show message from backend API response
      const successMessage = response.data.message || 'Thanh toán thành công! Yêu cầu tư vấn đã được gửi đến bác sĩ.';
      message.success(successMessage);
      
      // Log auto-scheduling info if available
      if (response.data.autoScheduled) {
        console.log('✅ Auto-scheduled successfully:', {
          doctorName: response.data.doctorName,
          appointmentDate: response.data.appointmentDate,
          appointmentSlot: response.data.appointmentSlot,
          nextStep: response.data.nextStep
        });
      } else if (response.data.needManualSchedule) {
        console.log('⏳ Doctor assigned, waiting for schedule:', {
          doctorName: response.data.doctorName,
          nextStep: response.data.nextStep
        });
      }
      
      // Navigate to success page
      navigate(`/consultation/success/${qaId}`, {
        state: { consultation: response.data.data }
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi xử lý thanh toán';
      message.error(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentCancel = async () => {
    if (!qaId) return;
    
    try {
      await consultationApi.updatePaymentStatus(qaId, { paymentSuccess: false });
      message.info('Bạn đã hủy thanh toán. Yêu cầu tư vấn đã bị hủy.');
      navigate('/online-consultation');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi hủy thanh toán';
      message.error(errorMessage);
      navigate('/online-consultation');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-primary mx-auto mb-4"></div>
          <Text className="text-lg text-gray-600">Đang tải thông tin...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <Title level={2} className="text-gray-900 mb-2">
            Thanh toán Tư vấn Trực tuyến
          </Title>
          <Text className="text-gray-600">Hoàn tất thanh toán để nhận tư vấn từ chuyên gia</Text>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Steps current={1} className="mb-8">
            <Step 
              title="Đặt lịch" 
              description="Hoàn thành"
              icon={<CheckSquare variant="Bold" />}
            />
            <Step 
              title="Thanh toán" 
              description="Đang thực hiện"
              icon={<CreditCard variant="Bold" />}
            />
            <Step 
              title="Tư vấn" 
              description="Chờ thanh toán"
              icon={<VideoPlay variant="Outline" />}
            />
          </Steps>
        </motion.div>

        <Row gutter={[24, 24]}>
          {/* Payment QR & Timer */}
          <Col xs={24} lg={12}>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-xl rounded-2xl h-full">
                <div className="text-center">
                  <Title level={3} className="text-gray-900 mb-4">
                    Quét mã QR để thanh toán
                  </Title>
                  
                  {/* Timer */}
                  <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock size={20} color="#F59E0B" />
                      <Text className="text-orange-600 font-semibold">
                        Thời gian còn lại: {formatTime(timeLeft)}
                      </Text>
                    </div>
                    <Progress 
                      percent={(timeLeft / 900) * 100} 
                      showInfo={false}
                      strokeColor="#F59E0B"
                    />
                  </div>

                  {/* QR Code */}
                  <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 mb-6">
                    <QRCodeSVG 
                      value={qrData}
                      size={200}
                      level="M"
                      includeMargin
                      className="mx-auto"
                    />
                  </div>

                  {/* Payment Info */}
                  <div className="text-left space-y-3 mb-6">
                    <div className="flex justify-between">
                      <Text className="text-gray-600">Số tiền:</Text>
                      <Text className="font-bold text-lg text-green-primary">
                        {formatCurrency(paymentAmount)}
                      </Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-gray-600">Mã đơn hàng:</Text>
                      <Text className="font-mono text-sm">{qaId}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-gray-600">Phương thức:</Text>
                      <Tag color="blue">QR Code</Tag>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <Space className="w-full" direction="vertical" size="middle">
                    <Button
                      type="primary"
                      size="large"
                      loading={isProcessingPayment}
                      onClick={handlePaymentSuccess}
                      className="w-full bg-green-primary hover:bg-green-secondary border-none h-12 text-lg font-semibold rounded-xl"
                      icon={<CheckSquare size={20} />}
                    >
                      {isProcessingPayment ? 'Đang xử lý...' : 'Xác nhận đã thanh toán'}
                    </Button>
                    
                    <Button
                      size="large"
                      danger
                      onClick={handlePaymentCancel}
                      disabled={isProcessingPayment}
                      className="w-full h-12 text-lg font-semibold rounded-xl"
                      icon={<CloseSquare size={20} />}
                    >
                      Hủy thanh toán
                    </Button>
                  </Space>
                </div>
              </Card>
            </motion.div>
          </Col>

          {/* Consultation Details */}
          <Col xs={24} lg={12}>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-0 shadow-xl rounded-2xl h-full">
                <Title level={3} className="text-gray-900 mb-4">
                  Thông tin tư vấn
                </Title>
                
                {consultation && (
                  <div className="space-y-4">
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
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <Text>{consultation.question}</Text>
                      </div>
                    </div>

                    {consultation.notes && (
                      <div>
                        <Text className="text-gray-500 block mb-2">Ghi chú:</Text>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <Text>{consultation.notes}</Text>
                        </div>
                      </div>
                    )}

                    <Divider />

                    <div>
                      <Text className="text-gray-500 block mb-2">Trạng thái:</Text>
                      <Tag color="orange" className="px-3 py-1">
                        Chờ thanh toán
                      </Tag>
                    </div>

                    <div>
                      <Text className="text-gray-500 block mb-2">Ngày tạo:</Text>
                      <Text>{new Date(consultation.createdAt).toLocaleString('vi-VN')}</Text>
                    </div>
                  </div>
                )}

                <Divider />

                {/* Security Notice */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <Shield size={20} color="#10B981" className="mt-1" />
                    <div>
                      <Text className="font-semibold text-green-800 block">
                        Bảo mật & Riêng tư
                      </Text>
                      <Text className="text-green-700 text-sm">
                        Thông tin của bạn được mã hóa và bảo vệ theo tiêu chuẩn quốc tế.
                        Dữ liệu tư vấn chỉ được chia sẻ với bác sĩ được chỉ định.
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Payment Instructions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="border-0 shadow-xl rounded-2xl">
            <Title level={4} className="text-gray-900 mb-4">
              Hướng dẫn thanh toán
            </Title>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={8}>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Text className="text-blue-600 font-bold text-xl">1</Text>
                  </div>
                  <Text className="font-semibold block mb-2">Quét mã QR</Text>
                  <Text className="text-gray-600 text-sm">
                    Sử dụng app banking hoặc ví điện tử để quét mã QR
                  </Text>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Text className="text-orange-600 font-bold text-xl">2</Text>
                  </div>
                  <Text className="font-semibold block mb-2">Thanh toán</Text>
                  <Text className="text-gray-600 text-sm">
                    Xác nhận số tiền và hoàn tất giao dịch
                  </Text>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Text className="text-green-600 font-bold text-xl">3</Text>
                  </div>
                  <Text className="font-semibold block mb-2">Xác nhận</Text>
                  <Text className="text-gray-600 text-sm">
                    Nhấn "Xác nhận đã thanh toán" sau khi hoàn tất
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentPage; 