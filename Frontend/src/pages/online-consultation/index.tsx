import React, { useState, useEffect, useRef } from 'react';
import { Button, Form, Input, message, Card, Row, Col, Typography, Space, Tag, Avatar, Progress, Timeline, Collapse, Statistic } from 'antd';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { VideoPlay, MessageQuestion, Profile, Shield, Clock, Heart, Send, Star1, Verify, Call, Messages2, TrendUp, Award, SecurityUser, VideoCircle } from 'iconsax-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'doctor', text: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?', time: '14:30' },
    { id: 2, sender: 'user', text: 'Chào bác sĩ, tôi muốn tư vấn về vấn đề sức khỏe sinh sản', time: '14:31' },
    { id: 3, sender: 'doctor', text: 'Tất nhiên rồi! Bạn có thể mô tả chi tiết triệu chứng được không?', time: '14:32' }
  ]);
  const [currentStep, setCurrentStep] = useState(0);

  // Mock data for features
  const features = [
    {
      icon: <VideoPlay size={32} color="#006478" variant="Bold" />,
      title: "Tư vấn qua Google Meet",
      description: "Gặp gỡ trực tiếp với chuyên gia qua video call chất lượng cao"
    },
    {
      icon: <Shield size={32} color="#006478" variant="Bold" />,
      title: "Bảo mật tuyệt đối",
      description: "Thông tin cá nhân được mã hóa và bảo vệ an toàn"
    },
    {
      icon: <Clock size={32} color="#006478" variant="Bold" />,
      title: "Linh hoạt thời gian",
      description: "Đặt lịch theo thời gian phù hợp với bạn, 24/7"
    },
    {
      icon: <Profile size={32} color="#006478" variant="Bold" />,
      title: "Chuyên gia giàu kinh nghiệm",
      description: "Đội ngũ bác sĩ và tư vấn viên có chứng chỉ hành nghề"
    }
  ];

  // Mock data for testimonials
  const testimonials = [
    {
      name: "Nguyễn Thị A",
      avatar: "",
      rating: 5,
      comment: "Dịch vụ tư vấn rất chuyên nghiệp và tận tình. Tôi cảm thấy an tâm hơn về sức khỏe của mình."
    },
    {
      name: "Trần Thị B", 
      avatar: "",
      rating: 5,
      comment: "Video call chất lượng tốt, bác sĩ giải thích rất dễ hiểu. Rất hài lòng với dịch vụ."
    },
    {
      name: "Lê Thị C",
      avatar: "", 
      rating: 5,
      comment: "Thuận tiện và tiết kiệm thời gian. Không cần đi xa vẫn được tư vấn chất lượng."
    }
  ];

  // Animation variants
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

  const handleSubmit = async (values: OnlineConsultationFormData) => {
    setIsSubmitting(true);
    
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success('Câu hỏi của bạn đã được gửi thành công! Chúng tôi sẽ liên hệ trong vòng 24h.');
      form.resetFields();
    } catch (error) {
      message.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
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
      {/* Hero Section */}
      <motion.section 
        className="relative py-20 overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-primary/10 to-green-primary/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <Row gutter={[48, 32]} align="middle">
            <Col xs={24} lg={12}>
              <motion.div variants={itemVariants}>
                <Title 
                  level={1} 
                  className="hero-title text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6"
                >
                  Tư vấn Sức khỏe{' '}
                  <span className="gradient-text">Trực tuyến</span>
                </Title>
                <Paragraph className="hero-subtitle text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed">
                  Kết nối trực tiếp với các chuyên gia y tế hàng đầu qua Google Meet. 
                  Nhận tư vấn chuyên nghiệp, riêng tư và an toàn ngay tại nhà.
                </Paragraph>
                <Space size="large">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={scrollToForm}
                      className="pulse-button bg-green-primary hover:bg-green-secondary border-none px-8 py-3 h-auto text-lg font-semibold rounded-xl shadow-lg"
                      icon={<VideoPlay size={20} />}
                    >
                      Đặt lịch ngay
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      size="large"
                      className="border-green-primary text-green-primary px-8 py-3 h-auto text-lg font-semibold rounded-xl"
                      icon={<MessageQuestion size={20} />}
                    >
                      Tìm hiểu thêm
                    </Button>
                  </motion.div>
                </Space>
              </motion.div>
            </Col>
            <Col xs={24} lg={12}>
              <motion.div 
                variants={itemVariants}
                className="relative"
              >
                <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  <div 
                    className="w-full h-80 bg-gradient-to-br from-blue-100 to-green-100 rounded-2xl flex items-center justify-center"
                  >
                    <VideoPlay size={64} color="#006478" variant="Bold" />
                  </div>
                  <div className="absolute -top-4 -right-4 bg-green-primary text-white px-4 py-2 rounded-full text-sm font-semibold">
                    <Heart size={16} className="inline mr-1" variant="Bold" />
                    Tin cậy #1
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-blue-primary/20 rounded-full floating-element"></div>
                <div className="absolute -top-6 -left-6 w-16 h-16 bg-green-primary/20 rounded-full bounce-slow"></div>
              </motion.div>
            </Col>
          </Row>
        </div>
      </motion.section>

      {/* Features Section */}
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
              Tại sao chọn tư vấn trực tuyến?
            </Title>
            <Paragraph className="text-lg text-gray-600 max-w-3xl mx-auto">
              Nền tảng tư vấn sức khỏe trực tuyến hiện đại, kết nối bạn với các chuyên gia y tế 
              uy tín thông qua Google Meet với chất lượng video và âm thanh tốt nhất.
            </Paragraph>
          </motion.div>

          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <motion.div variants={itemVariants}>
                  <Card 
                    className="feature-card h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl"
                    hoverable
                  >
                    <div className="text-center p-4">
                      <motion.div 
                        className="rotating-icon mb-4 inline-flex p-4 bg-green-50 rounded-full"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        {feature.icon}
                      </motion.div>
                      <Title level={4} className="text-gray-900 mb-3">
                        {feature.title}
                      </Title>
                      <Paragraph className="text-gray-600 text-base">
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

      {/* Process Section */}
      <motion.section 
        className="py-20 bg-gradient-to-br from-green-50 to-blue-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <Title level={2} className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Quy trình tư vấn đơn giản
            </Title>
          </motion.div>

          <Row gutter={[32, 32]} justify="center">
            {[
              { step: 1, title: "Gửi câu hỏi", desc: "Điền form bên dưới với thông tin và câu hỏi của bạn" },
              { step: 2, title: "Xác nhận lịch hẹn", desc: "Nhận cuộc gọi từ chúng tôi trong vòng 24h để xác nhận" },
              { step: 3, title: "Tham gia Google Meet", desc: "Nhận link Google Meet và tham gia cuộc tư vấn" },
              { step: 4, title: "Nhận tư vấn", desc: "Tư vấn trực tiếp với chuyên gia và nhận phác đồ điều trị" }
            ].map((item, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <motion.div 
                  variants={itemVariants}
                  className="text-center"
                >
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-green-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                      {item.step}
                    </div>
                    {index < 3 && (
                      <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-green-200 -translate-y-1/2"></div>
                    )}
                  </div>
                  <Title level={4} className="text-gray-900 mb-3">
                    {item.title}
                  </Title>
                  <Paragraph className="text-gray-600">
                    {item.desc}
                  </Paragraph>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </motion.section>

      {/* Testimonials Section */}
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
              Khách hàng nói gì về chúng tôi?
            </Title>
          </motion.div>

          <Row gutter={[32, 32]}>
            {testimonials.map((testimonial, index) => (
              <Col xs={24} md={8} key={index}>
                <motion.div variants={itemVariants}>
                  <Card className="testimonial-card h-full border-0 shadow-lg rounded-2xl">
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <Avatar 
                          size={48} 
                          className="mr-3 bg-green-primary"
                        >
                          {testimonial.name.charAt(0)}
                        </Avatar>
                        <div>
                          <Title level={5} className="mb-1">{testimonial.name}</Title>
                          <div className="flex text-yellow-500">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <span key={i}>⭐</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Paragraph className="text-gray-600 italic">
                        "{testimonial.comment}"
                      </Paragraph>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </motion.section>

      {/* Floating Particles Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-green-primary/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Interactive Stats Section */}
      <motion.section 
        className="py-20 bg-gradient-to-r from-green-primary to-blue-primary text-white relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <Title level={2} className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Thống kê ấn tượng
            </Title>
            <Paragraph className="text-lg text-white/90 max-w-3xl mx-auto">
              Những con số chứng minh chất lượng dịch vụ của chúng tôi
            </Paragraph>
          </motion.div>

          <Row gutter={[32, 32]}>
            {[
              { number: 15000, suffix: "+", title: "Khách hàng tin tưởng", icon: <Heart size={48} variant="Bold" /> },
              { number: 98, suffix: "%", title: "Độ hài lòng", icon: <Star1 size={48} variant="Bold" /> },
              { number: 24, suffix: "/7", title: "Hỗ trợ liên tục", icon: <Call size={48} variant="Bold" /> },
              { number: 50, suffix: "+", title: "Chuyên gia y tế", icon: <Verify size={48} variant="Bold" /> },
            ].map((stat, index) => (
              <Col xs={12} md={6} key={index}>
                <motion.div 
                  variants={itemVariants}
                  className="text-center p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20"
                  whileHover={{ scale: 1.05, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="text-white mb-4 flex justify-center"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {stat.icon}
                  </motion.div>
                  <Title level={2} className="text-white mb-2">
                    <CountUp end={stat.number} suffix={stat.suffix} />
                  </Title>
                  <Paragraph className="text-white/90 mb-0">
                    {stat.title}
                  </Paragraph>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </motion.section>

      {/* Live Chat Simulation */}
      <motion.section 
        className="py-20 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <Row gutter={[48, 32]} align="middle">
            <Col xs={24} lg={12}>
              <motion.div variants={itemVariants}>
                <Title level={2} className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  Trải nghiệm tư vấn{' '}
                  <span className="gradient-text">thực tế</span>
                </Title>
                <Paragraph className="text-lg text-gray-600 mb-8">
                  Xem trước giao diện tư vấn trực tuyến của chúng tôi. 
                  Đơn giản, thân thiện và chuyên nghiệp.
                </Paragraph>
                
                <div className="space-y-4">
                  {[
                    { icon: <VideoCircle size={24} />, text: "Video call HD chất lượng cao" },
                    { icon: <Messages2 size={24} />, text: "Chat real-time trong cuộc gọi" },
                    { icon: <SecurityUser size={24} />, text: "Bảo mật end-to-end encryption" },
                  ].map((feature, index) => (
                    <motion.div 
                      key={index}
                      className="flex items-center gap-3"
                      variants={itemVariants}
                    >
                      <div className="text-green-primary">{feature.icon}</div>
                      <Text className="text-gray-700">{feature.text}</Text>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </Col>
            
            <Col xs={24} lg={12}>
              <motion.div variants={itemVariants}>
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  {/* Chat Header */}
                  <div className="bg-green-primary text-white p-4 flex items-center gap-3">
                    <Avatar size={40} className="bg-green-secondary">
                      BS
                    </Avatar>
                    <div>
                      <Text className="text-white font-semibold block">Bác sĩ Nguyễn Văn A</Text>
                      <Text className="text-green-100 text-sm">Chuyên khoa Sản Phụ khoa</Text>
                    </div>
                    <div className="ml-auto">
                      <motion.div 
                        className="w-3 h-3 bg-green-300 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </div>
                  
                  {/* Chat Messages */}
                  <div className="p-4 h-80 overflow-y-auto bg-gray-50">
                    <AnimatePresence>
                      {chatMessages.map((msg, index) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.5 }}
                          className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                            msg.sender === 'user' 
                              ? 'bg-green-primary text-white' 
                              : 'bg-white shadow-md'
                          }`}>
                            <Text className={msg.sender === 'user' ? 'text-white' : 'text-gray-800'}>
                              {msg.text}
                            </Text>
                            <div className={`text-xs mt-1 ${
                              msg.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                            }`}>
                              {msg.time}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* Typing indicator */}
                    <motion.div 
                      className="flex justify-start"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2 }}
                    >
                      <div className="bg-white px-4 py-2 rounded-2xl shadow-md">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-gray-400 rounded-full"
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ 
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2 
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Chat Input */}
                  <div className="p-4 bg-white border-t">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Nhập tin nhắn..."
                        disabled
                        className="rounded-full"
                      />
                      <Button 
                        type="primary" 
                        shape="circle"
                        icon={<Send size={16} />}
                        className="bg-green-primary"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Col>
          </Row>
        </div>
      </motion.section>

      {/* Technology Showcase */}
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
              Công nghệ tiên tiến
            </Title>
            <Paragraph className="text-lg text-gray-600 max-w-3xl mx-auto">
              Chúng tôi sử dụng những công nghệ hàng đầu để mang đến trải nghiệm tư vấn tốt nhất
            </Paragraph>
          </motion.div>

          <Row gutter={[32, 32]}>
            {[
              {
                title: "Google Meet Integration",
                description: "Nền tảng video call ổn định nhất thế giới",
                tech: "WebRTC, HD Video",
                progress: 98
              },
              {
                title: "AI Health Assistant", 
                description: "Trợ lý AI hỗ trợ chẩn đoán sơ bộ",
                tech: "Machine Learning, NLP",
                progress: 95
              },
              {
                title: "Secure Data Encryption",
                description: "Mã hóa dữ liệu đầu cuối an toàn tuyệt đối",
                tech: "AES-256, SSL/TLS",
                progress: 100
              }
            ].map((tech, index) => (
              <Col xs={24} md={8} key={index}>
                <motion.div variants={itemVariants}>
                  <Card className="h-full border-0 shadow-lg rounded-2xl overflow-hidden">
                    <div className="p-6">
                      <motion.div 
                        className="w-16 h-16 bg-gradient-to-br from-green-primary to-blue-primary rounded-xl mb-4 flex items-center justify-center"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.8 }}
                      >
                        <TrendUp size={32} color="white" variant="Bold" />
                      </motion.div>
                      <Title level={4} className="text-gray-900 mb-3">
                        {tech.title}
                      </Title>
                      <Paragraph className="text-gray-600 mb-4">
                        {tech.description}
                      </Paragraph>
                      <div className="mb-4">
                        <div className="flex justify-between mb-2">
                          <Text className="text-sm font-medium text-gray-700">
                            {tech.tech}
                          </Text>
                          <Text className="text-sm font-medium text-green-primary">
                            {tech.progress}%
                          </Text>
                        </div>
                        <Progress 
                          percent={tech.progress} 
                          strokeColor={{
                            '0%': '#006478',
                            '100%': '#00A693',
                          }}
                          showInfo={false}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </motion.section>

      {/* Interactive FAQ */}
      <motion.section 
        className="py-20 bg-gradient-to-br from-gray-50 to-green-50"
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

      {/* Success Stories Timeline */}
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
              Hành trình chăm sóc sức khỏe
            </Title>
            <Paragraph className="text-lg text-gray-600 max-w-3xl mx-auto">
              Từ tư vấn ban đầu đến phục hồi hoàn toàn
            </Paragraph>
          </motion.div>

          <Row gutter={[32, 32]}>
            <Col xs={24} lg={16} offset={4}>
              <motion.div variants={itemVariants}>
                <Timeline
                  mode="left"
                  items={[
                    {
                      color: 'green',
                      children: (
                        <div className="pb-8">
                          <Title level={4} className="text-green-primary mb-2">
                            Tư vấn ban đầu
                          </Title>
                          <Paragraph className="text-gray-600">
                            Khách hàng liên hệ với các triệu chứng lo lắng về sức khỏe sinh sản. 
                            Bác sĩ tiến hành tư vấn sơ bộ qua video call.
                          </Paragraph>
                        </div>
                      ),
                    },
                    {
                      color: 'blue',
                      children: (
                        <div className="pb-8">
                          <Title level={4} className="text-blue-primary mb-2">
                            Xét nghiệm & chẩn đoán
                          </Title>
                          <Paragraph className="text-gray-600">
                            Bác sĩ đề xuất các xét nghiệm cần thiết. Kết quả được phân tích 
                            và thảo luận chi tiết trong buổi tư vấn tiếp theo.
                          </Paragraph>
                        </div>
                      ),
                    },
                    {
                      color: 'orange',
                      children: (
                        <div className="pb-8">
                          <Title level={4} className="text-orange-500 mb-2">
                            Điều trị & theo dõi
                          </Title>
                          <Paragraph className="text-gray-600">
                            Phác đồ điều trị được xây dựng phù hợp. Theo dõi định kỳ 
                            qua các buổi tư vấn online.
                          </Paragraph>
                        </div>
                      ),
                    },
                    {
                      color: 'green',
                      children: (
                        <div>
                          <Title level={4} className="text-green-primary mb-2">
                            Phục hồi hoàn toàn
                          </Title>
                          <Paragraph className="text-gray-600">
                            Sức khỏe được cải thiện đáng kể. Khách hàng hài lòng và 
                            tiếp tục duy trì chế độ chăm sóc phòng ngừa.
                          </Paragraph>
                        </div>
                      ),
                    },
                  ]}
                />
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
                            className="submit-button w-full bg-green-primary hover:bg-green-secondary border-none h-12 text-lg font-semibold rounded-xl"
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
    </div>
  );
};

export default OnlineConsultationPage;
