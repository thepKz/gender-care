import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, message, Divider, Tag, Steps } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TickSquare as CheckSquare, 
  CloseSquare,
  Profile,
  Call,
  VideoPlay,
  Shield
} from 'iconsax-react';
import { consultationApi } from '../../api';

const { Title, Text } = Typography;
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
  consultationFee: number;
  serviceName?: string;
  createdAt: string;
}

const PaymentPage: React.FC = () => {
  const { qaId } = useParams<{ qaId: string }>();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState<ConsultationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  useEffect(() => {
    if (qaId) {
      fetchConsultationInfo();
    }
  }, [qaId]);

  const fetchConsultationInfo = async () => {
    try {
      console.log('🔍 [PaymentPage] Fetching consultation info for qaId:', qaId);
      const response = await consultationApi.getConsultationById(qaId!);
      const consultationData = response.data.data;
      
      console.log('✅ [PaymentPage] Consultation data received:', {
        id: consultationData._id,
        consultationFee: consultationData.consultationFee,
        status: consultationData.status,
        fullName: consultationData.fullName
      });
      
      setConsultation(consultationData);
    } catch (error: any) {
      console.error('❌ [PaymentPage] Error fetching consultation:', error);
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
      console.log('🚀 Creating consultation payment link...', { qaId });
      
      // Gọi API tạo PayOS payment link
      const response = await consultationApi.createConsultationPaymentLink(qaId);
      
      if (response.data && response.data.success) {
        const { paymentUrl, orderCode, amount } = response.data.data;
        
        console.log('✅ Payment link created successfully:', {
          paymentUrl,
          orderCode,
          amount
        });
        
        message.success('Đang chuyển đến trang thanh toán PayOS...');
        
        // Auto redirect to PayOS after 2 seconds  
        setTimeout(() => {
          console.log('🔄 Redirecting to PayOS:', paymentUrl);
          window.location.href = paymentUrl;
        }, 2000);
        
      } else {
        throw new Error(response.data?.message || 'Không thể tạo link thanh toán');
      }
      
    } catch (error: any) {
      console.error('❌ Error creating payment link:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi tạo link thanh toán';
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
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <Title level={2} className="text-gray-900 mb-2">
            Xác nhận đặt lịch Tư vấn Trực tuyến
          </Title>
          <Text className="text-gray-600">Vui lòng kiểm tra thông tin và xác nhận để hoàn tất đặt lịch</Text>
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
              title="Xác nhận" 
              description="Đang thực hiện"
              icon={<CheckSquare variant="Bold" />}
            />
            <Step 
              title="Tư vấn" 
              description="Chờ xác nhận"
              icon={<VideoPlay variant="Outline" />}
            />
          </Steps>
        </motion.div>

        {/* Main Consultation Details Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl rounded-2xl mb-8">
            <Title level={3} className="text-gray-900 mb-6 text-center">
              Chi tiết đơn đặt lịch tư vấn
            </Title>
            
            {consultation && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-blue-50 p-6 rounded-xl">
                  <Title level={5} className="text-blue-800 mb-4">Thông tin khách hàng</Title>
                  <Row gutter={[24, 16]}>
                    <Col span={12}>
                      <div className="flex items-center gap-3">
                        <Profile size={20} color="#1890FF" />
                        <div>
                          <Text className="text-gray-500 block text-sm">Họ tên:</Text>
                          <Text className="font-semibold">{consultation.fullName}</Text>
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="flex items-center gap-3">
                        <Call size={20} color="#1890FF" />
                        <div>
                          <Text className="text-gray-500 block text-sm">Số điện thoại:</Text>
                          <Text className="font-semibold">{consultation.phone}</Text>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                <Divider />

                {/* Consultation Content */}
                <div>
                  <Title level={5} className="text-gray-800 mb-3">Câu hỏi tư vấn</Title>
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-primary">
                    <Text className="text-gray-700">{consultation.question}</Text>
                  </div>
                </div>

                {consultation.notes && (
                  <div>
                    <Title level={5} className="text-gray-800 mb-3">Ghi chú bổ sung</Title>
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                      <Text className="text-gray-700">{consultation.notes}</Text>
                    </div>
                  </div>
                )}

                <Divider />

                {/* Order Summary */}
                <div className="bg-green-50 p-6 rounded-xl">
                  <Title level={5} className="text-green-800 mb-4">Tóm tắt đơn hàng</Title>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Text className="text-gray-600">Dịch vụ:</Text>
                      <Text className="font-semibold">{consultation.serviceName || 'Tư vấn trực tuyến'}</Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text className="text-gray-600">Mã đơn hàng:</Text>
                      <Text className="font-mono text-sm bg-white px-2 py-1 rounded border">
                        {consultation._id}
                      </Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text className="text-gray-600">Trạng thái:</Text>
                      <Tag color="orange" className="px-3 py-1">
                        Chờ xác nhận thanh toán
                      </Tag>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text className="text-gray-600">Ngày tạo:</Text>
                      <Text>{new Date(consultation.createdAt).toLocaleString('vi-VN')}</Text>
                    </div>
                    <Divider style={{ margin: '16px 0' }} />
                    <div className="flex justify-between items-center">
                      <Text className="text-lg font-semibold text-gray-800">Tổng chi phí:</Text>
                      <Text className="text-2xl font-bold text-green-primary">
                        {formatCurrency(consultation.consultationFee)}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Button
                        size="large"
                        danger
                        onClick={handlePaymentCancel}
                        disabled={isProcessingPayment}
                        className="w-full h-14 text-lg font-semibold rounded-xl"
                        icon={<CloseSquare size={20} />}
                      >
                        Hủy đặt lịch
                      </Button>
                    </Col>
                    <Col span={12}>
                      <Button
                        type="primary"
                        size="large"
                        loading={isProcessingPayment}
                        onClick={handlePaymentSuccess}
                        className="w-full bg-green-primary hover:bg-green-secondary border-none h-14 text-lg font-semibold rounded-xl"
                        icon={<CheckSquare size={20} />}
                      >
                        {isProcessingPayment ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
                      </Button>
                    </Col>
                  </Row>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-start gap-4">
              <Shield size={24} color="#10B981" className="mt-1 flex-shrink-0" />
              <div>
                <Text className="font-semibold text-gray-800 block mb-2">
                  Cam kết bảo mật & Chính sách
                </Text>
                <Text className="text-gray-600 text-sm leading-relaxed">
                  • Thông tin cá nhân được mã hóa và bảo vệ theo tiêu chuẩn quốc tế<br/>
                  • Dữ liệu tư vấn chỉ được chia sẻ với bác sĩ được chỉ định<br/>
                  • Bạn có thể hủy lịch hẹn trước 24 giờ mà không mất phí<br/>
                  • Đội ngũ bác sĩ có chứng chỉ hành nghề và kinh nghiệm tư vấn
                </Text>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentPage; 