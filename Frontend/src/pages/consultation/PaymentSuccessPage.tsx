import React, { useEffect, useState } from 'react';
import { Card, Button, Row, Col, Typography, Tag, Divider, Steps, Space, message } from 'antd';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  const { qaId } = useParams<{ qaId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [consultation, setConsultation] = useState<ConsultationInfo | null>(
    location.state?.consultation || null
  );
  const [isLoading, setIsLoading] = useState(!consultation);

  useEffect(() => {
    if (!consultation && qaId) {
      fetchConsultationInfo();
    }
  }, [qaId, consultation]);

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

  const handleViewConsultations = () => {
    navigate('/profile/consultations');
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

                {/* Action Buttons */}
                <Space className="w-full" direction="vertical" size="middle">
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleViewConsultations}
                    className="w-full bg-green-primary hover:bg-green-secondary border-none h-12 text-lg font-semibold rounded-xl"
                    icon={<Calendar size={20} />}
                  >
                    Xem lịch sử tư vấn
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
                        100.000 VND
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