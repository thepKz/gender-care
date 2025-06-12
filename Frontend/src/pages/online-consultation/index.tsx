import { Button, Card, Col, Collapse, Form, Input, message, Modal, Row, Space, Tag, Typography } from 'antd';
import { motion, useInView } from 'framer-motion';
import { Call, Clock, Heart, InfoCircle, MessageQuestion, Profile, Send, Shield, Star1, Verify, VideoPlay } from 'iconsax-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultationApi } from '../../api';
import { FloatingAppointmentButton } from '../../components/ui/common';
import './styles.css';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

interface OnlineConsultationFormData {
  fullName: string;
  phone: string;
  notes?: string;
  question: string;
}

// Custom CountUp Component
const CountUp: React.FC<{ end: number; duration?: number; suffix?: string }> = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [inView, end, duration]);

  return <div ref={ref}>{count}{suffix}</div>;
};

const OnlineConsultationPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Ensure page starts at top on mount – UX cải thiện
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Mock data for features - Simplified and reduced
  const features = [
    {
      icon: <VideoPlay size={32} color="#006478" variant="Bold" />,
      title: "Tư vấn qua Video Call",
      description: "Gặp gỡ trực tiếp với chuyên gia qua video call chất lượng cao với Google Meet"
    },
    {
      icon: <Shield size={32} color="#006478" variant="Bold" />,
      title: "Bảo mật tuyệt đối",
      description: "Thông tin cá nhân được mã hóa và bảo vệ theo tiêu chuẩn quốc tế"
    },
    {
      icon: <Clock size={32} color="#006478" variant="Bold" />,
      title: "Linh hoạt thời gian",
      description: "Đặt lịch theo thời gian phù hợp, hỗ trợ tư vấn 24/7"
    },
    {
      icon: <Verify size={32} color="#006478" variant="Bold" />,
      title: "Chuyên gia uy tín",
      description: "Đội ngũ bác sĩ và tư vấn viên có chứng chỉ hành nghề"
    }
  ];

  // Animation variants - Simplified
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const handleSubmit = async (values: OnlineConsultationFormData) => {
    // Check authentication first - simple token check
    const token = localStorage.getItem('access_token');
    if (!token) {
      setShowLoginModal(true);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Call API to create consultation request
      const response = await consultationApi.createOnlineConsultation({
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
        question: values.question.trim(),
        notes: values.notes?.trim()
      });

      message.success('Tạo yêu cầu tư vấn thành công! Chuyển đến trang thanh toán.');
      
      // Navigate to payment page
      navigate(`/consultation/payment/${response.data.data._id}`);
      
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('Error creating consultation:', err);
      const errorMessage = err?.response?.data?.message ?? err?.message ?? 'Có lỗi xảy ra. Vui lòng thử lại sau.';
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    navigate('/login', { 
      state: { 
        from: '/online-consultation',
        message: 'Vui lòng đăng nhập để đặt lịch tư vấn' 
      }
    });
  };

  const scrollToForm = () => {
    const formElement = document.getElementById('consultation-form');
    if (formElement) {
      formElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Hero Section - Simplified */}
      <motion.section 
        className="relative py-20 overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{ minHeight: '30vh' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-primary/5 to-green-primary/5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <Row gutter={[48, 32]} align="middle">
            <Col xs={24} lg={12}>
              <motion.div variants={itemVariants}>
                <Title 
                  level={1} 
                  className="text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6"
                >
                  Tư vấn Sức khỏe{' '}
                  <span className="gradient-text">Trực tuyến</span>
                </Title>
                <Paragraph className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Kết nối trực tiếp với các chuyên gia y tế hàng đầu qua Google Meet. 
                  Nhận tư vấn chuyên nghiệp, riêng tư và an toàn ngay tại nhà.
                </Paragraph>
                <Space size="large" wrap>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={scrollToForm}
                      className="bg-green-primary hover:bg-green-secondary border-none px-10 py-4 h-auto text-xl font-bold rounded-2xl shadow-xl flex items-center gap-2"
                      icon={<VideoPlay size={24} />}
                    >
                      Đặt lịch ngay
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      size="large"
                      className="border-green-primary text-green-primary px-10 py-4 h-auto text-xl font-bold rounded-2xl flex items-center gap-2"
                      icon={<MessageQuestion size={24} />}
                    >
                      Tìm hiểu thêm
                    </Button>
                  </motion.div>
                </Space>
              </motion.div>
            </Col>
           
          </Row>
        </div>
      </motion.section>

      {/* Features Section - Simplified */}
      <motion.section 
        className="py-20 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <Title level={2} className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Tại sao chọn{' '}
              <span className="gradient-text">chúng tôi?</span>
            </Title>
            <Paragraph className="text-lg text-gray-600 max-w-3xl mx-auto">
              Dịch vụ tư vấn sức khỏe trực tuyến tiên tiến với công nghệ hiện đại
            </Paragraph>
          </motion.div>

          <Row gutter={[32, 32]} align="stretch">
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={6} key={index} className="h-full">
                <motion.div variants={itemVariants} className="h-full">
                  <Card className="feature-card h-full flex flex-col justify-between text-center border-0 shadow-lg rounded-2xl">
                    <div className="p-6 flex flex-col flex-1 justify-between">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-primary/10 to-blue-primary/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
                        {feature.icon}
                      </div>
                      <Title level={4} className="text-gray-900 mb-3">
                        {feature.title}
                      </Title>
                      <Paragraph className="text-gray-600">
                        {feature.description}
                      </Paragraph>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section 
        className="py-20 bg-gradient-to-r from-blue-primary to-green-primary"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <Row gutter={[32, 32]} justify="center">
            <Col xs={24} sm={12} md={6}>
              <motion.div variants={itemVariants}>
                <Card className="rounded-3xl shadow-2xl bg-gradient-to-br from-green-400 to-blue-500 border-0 text-center py-8 px-4 flex flex-col items-center" style={{background: 'linear-gradient(135deg, #00A693 0%, #006478 100%)'}}>
                  <Heart size={48} color="#fff" variant="Bold" className="mb-4" />
                  <Title level={1} className="text-white font-extrabold mb-2" style={{color:'#fff'}}>
                    <CountUp end={5000} suffix="+" />
                  </Title>
                  <Text className="text-white text-lg font-medium">Khách hàng tin tưởng</Text>
                </Card>
              </motion.div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <motion.div variants={itemVariants}>
                <Card className="rounded-3xl shadow-2xl bg-gradient-to-br from-green-400 to-blue-500 border-0 text-center py-8 px-4 flex flex-col items-center" style={{background: 'linear-gradient(135deg, #00A693 0%, #006478 100%)'}}>
                  <Profile size={48} color="#fff" variant="Bold" className="mb-4" />
                  <Title level={1} className="text-white font-extrabold mb-2" style={{color:'#fff'}}>
                    <CountUp end={50} suffix="+" />
                  </Title>
                  <Text className="text-white text-lg font-medium">Chuyên gia y tế</Text>
                </Card>
              </motion.div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <motion.div variants={itemVariants}>
                <Card className="rounded-3xl shadow-2xl bg-gradient-to-br from-green-400 to-blue-500 border-0 text-center py-8 px-4 flex flex-col items-center" style={{background: 'linear-gradient(135deg, #00A693 0%, #006478 100%)'}}>
                  <Star1 size={48} color="#fff" variant="Bold" className="mb-4" />
                  <Title level={1} className="text-white font-extrabold mb-2" style={{color:'#fff'}}>
                    <CountUp end={98} suffix="%" />
                  </Title>
                  <Text className="text-white text-lg font-medium">Hài lòng dịch vụ</Text>
                </Card>
              </motion.div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <motion.div variants={itemVariants}>
                <Card className="rounded-3xl shadow-2xl bg-gradient-to-br from-green-400 to-blue-500 border-0 text-center py-8 px-4 flex flex-col items-center" style={{background: 'linear-gradient(135deg, #00A693 0%, #006478 100%)'}}>
                  <Call size={48} color="#fff" variant="Bold" className="mb-4" />
                  <Title level={1} className="text-white font-extrabold mb-2" style={{color:'#fff'}}>
                    24/7
                  </Title>
                  <Text className="text-white text-lg font-medium">Hỗ trợ khách hàng</Text>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </div>
      </motion.section>

      {/* Process Steps */}
      <motion.section 
        className="py-20 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <Title level={2} className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Quy trình tư vấn
            </Title>
            <Paragraph className="text-lg text-gray-600 max-w-3xl mx-auto">
              Chỉ 3 bước đơn giản để bắt đầu hành trình chăm sóc sức khỏe
            </Paragraph>
          </motion.div>

          <Row gutter={[32, 32]} justify="center">
            {[
              {
                step: "01",
                title: "Đặt lịch",
                description: "Điền form thông tin và câu hỏi của bạn"
              },
              {
                step: "02", 
                title: "Xác nhận",
                description: "Chúng tôi liên hệ xác nhận trong 24h"
              },
              {
                step: "03",
                title: "Tư vấn",
                description: "Gặp gỡ chuyên gia qua video call"
              }
            ].map((process, index) => (
              <Col xs={24} md={8} key={index}>
                <motion.div variants={itemVariants}>
                  <Card className="text-center border-0 shadow-lg rounded-2xl">
                    <div className="p-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-primary to-blue-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Text className="text-white text-xl font-bold">{process.step}</Text>
                      </div>
                      <Title level={4} className="text-gray-900 mb-3">
                        {process.title}
                      </Title>
                      <Paragraph className="text-gray-600">
                        {process.description}
                      </Paragraph>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        className="py-20 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <Title level={2} className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Câu hỏi thường gặp
            </Title>
            <Paragraph className="text-lg text-gray-600 max-w-3xl mx-auto">
              Những thắc mắc phổ biến về dịch vụ tư vấn trực tuyến
            </Paragraph>
          </motion.div>

          <Row gutter={[32, 32]}>
            <Col xs={24} lg={16} offset={4}>
              <motion.div variants={itemVariants}>
                <Collapse 
                  size="large"
                  className="bg-white rounded-2xl shadow-lg border-0"
                >
                  <Panel 
                    header="Làm thế nào để đặt lịch tư vấn trực tuyến?"
                    key="1"
                    className="border-0"
                  >
                    <Paragraph>
                      Bạn chỉ cần điền form ở phía dưới với thông tin cá nhân và câu hỏi. 
                      Chúng tôi sẽ liên hệ trong vòng 24h để xác nhận và gửi link Google Meet.
                    </Paragraph>
                  </Panel>
                  <Panel 
                    header="Chi phí tư vấn trực tuyến là bao nhiêu?"
                    key="2"
                    className="border-0"
                  >
                    <Paragraph>
                      Phí tư vấn từ 200.000 - 500.000 VNĐ tùy theo loại dịch vụ và thời gian tư vấn. 
                      Consultation đầu tiên miễn phí 15 phút.
                    </Paragraph>
                  </Panel>
                  <Panel 
                    header="Thông tin cá nhân có được bảo mật không?"
                    key="3"
                    className="border-0"
                  >
                    <Paragraph>
                      Hoàn toàn! Chúng tôi sử dụng mã hóa end-to-end và tuân thủ các tiêu chuẩn 
                      bảo mật y tế quốc tế. Thông tin của bạn được bảo vệ tuyệt đối.
                    </Paragraph>
                  </Panel>
                  <Panel 
                    header="Tôi có thể hủy lịch hẹn không?"
                    key="4"
                    className="border-0"
                  >
                    <Paragraph>
                      Có thể hủy hoặc đổi lịch trước 24h. Phí đã thanh toán sẽ được hoàn lại 
                      hoặc chuyển sang lịch hẹn mới theo yêu cầu.
                    </Paragraph>
                  </Panel>
                </Collapse>
              </motion.div>
            </Col>
          </Row>
        </div>
      </motion.section>

      {/* Contact Form Section */}
      <motion.section 
        id="consultation-form"
        className="py-20 bg-gradient-to-br from-blue-primary/5 to-green-primary/5"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <Row gutter={[48, 32]}>
            <Col xs={24} lg={12}>
              <motion.div variants={itemVariants}>
                <Title level={2} className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  Có câu hỏi về sức khỏe?
                </Title>
                <Paragraph className="text-lg text-gray-600 mb-8">
                  Đừng ngại chia sẻ những thắc mắc về sức khỏe của bạn. 
                  Đội ngũ chuyên gia của chúng tôi sẽ liên hệ và tư vấn trong vòng 24 giờ.
                </Paragraph>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Tag color="green" className="px-3 py-1">
                      <Clock size={16} className="mr-1" />
                      Phản hồi trong 24h
                    </Tag>
                  </div>
                  <div className="flex items-center">
                    <Tag color="blue" className="px-3 py-1">
                      <Shield size={16} className="mr-1" />
                      Bảo mật thông tin
                    </Tag>
                  </div>
                  <div className="flex items-center">
                    <Tag color="orange" className="px-3 py-1">
                      <Profile size={16} className="mr-1" />
                      Chuyên gia có chứng chỉ
                    </Tag>
                  </div>
                </div>
              </motion.div>
            </Col>
            
            <Col xs={24} lg={12}>
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-xl rounded-2xl">
                  <div className="p-8">
                    <Title level={3} className="text-center mb-6 text-gray-900">
                      Gửi câu hỏi của bạn
                    </Title>
                    
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSubmit}
                      size="large"
                    >
                      <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[
                          { required: true, message: 'Vui lòng nhập họ tên!' },
                          { min: 3, message: 'Họ tên phải có ít nhất 3 ký tự!' }
                        ]}
                      >
                        <Input 
                          placeholder="Nhập họ và tên của bạn"
                          className="custom-input rounded-lg"
                        />
                      </Form.Item>

                      <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[
                          { required: true, message: 'Vui lòng nhập số điện thoại!' },
                          { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
                        ]}
                      >
                        <Input 
                          placeholder="Nhập số điện thoại"
                          className="custom-input rounded-lg"
                        />
                      </Form.Item>

                      <Form.Item
                        name="notes"
                        label="Ghi chú thêm (tùy chọn)"
                      >
                        <Input 
                          placeholder="Thông tin bổ sung (tuổi, giới tính, v.v.)"
                          className="custom-input rounded-lg"
                        />
                      </Form.Item>

                      <Form.Item
                        name="question"
                        label="Câu hỏi của bạn"
                        rules={[
                          { required: true, message: 'Vui lòng nhập câu hỏi!' },
                          { min: 10, message: 'Câu hỏi phải có ít nhất 10 ký tự!' }
                        ]}
                      >
                        <TextArea
                          rows={4}
                          placeholder="Mô tả chi tiết các triệu chứng, thắc mắc về sức khỏe..."
                          className="custom-input rounded-lg"
                        />
                      </Form.Item>

                      <Form.Item>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={isSubmitting}
                            icon={<Send size={20} />}
                            className="w-full bg-green-primary hover:bg-green-secondary border-none h-12 text-lg font-semibold rounded-xl"
                          >
                            {isSubmitting ? 'Đang gửi...' : 'Gửi câu hỏi'}
                          </Button>
                        </motion.div>
                      </Form.Item>
                    </Form>
                  </div>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </div>
      </motion.section>

      {/* Floating Appointment Button */}
      <FloatingAppointmentButton 
        onAppointmentClick={() => {
          // Scroll to form when clicked
          const formElement = document.getElementById('consultation-form');
          if (formElement) {
            formElement.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
        }}
      />

      {/* Login Required Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <InfoCircle size={24} color="#1890ff" />
            <span>Yêu cầu đăng nhập</span>
          </div>
        }
        open={showLoginModal}
        onCancel={() => setShowLoginModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowLoginModal(false)}>
            Hủy
          </Button>,
          <Button key="login" type="primary" onClick={handleLoginRedirect}>
            Đăng nhập ngay
          </Button>
        ]}
        centered
      >
        <div className="py-4">
          <Paragraph className="text-gray-600 mb-4">
            Bạn cần đăng nhập để sử dụng dịch vụ tư vấn trực tuyến. 
            Việc đăng nhập giúp chúng tôi:
          </Paragraph>
          <ul className="text-gray-600 space-y-2 mb-4">
            <li>• Bảo mật thông tin cá nhân của bạn</li>
            <li>• Theo dõi lịch sử tư vấn</li>
            <li>• Gửi link Google Meet an toàn</li>
            <li>• Cung cấp dịch vụ chăm sóc tốt hơn</li>
          </ul>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <Text className="text-blue-700 text-sm">
              💡 <strong>Lưu ý:</strong> Thông tin đăng nhập được mã hóa và bảo mật tuyệt đối.
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OnlineConsultationPage;
