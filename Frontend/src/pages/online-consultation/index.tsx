import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  VideoPlay,
  Clock,
  Shield,
  Verify,
  Heart,
  Profile,
  Star1,
  Call,
  InfoCircle,
  MessageQuestion,
  Send,
  MonitorMobbile,
  Profile2User,
  Award
} from 'iconsax-react';
import PrimaryButton from '../../components/ui/primitives/PrimaryButton';
import TagChip from '../../components/ui/primitives/TagChip';
import CardBox from '../../components/ui/primitives/CardBox';
import FloatingAppointmentButton from '../../components/ui/common/FloatingAppointmentButton';
import ModalDialog from '../../components/ui/primitives/ModalDialog';
import Accordion, { AccordionItem } from '../../components/ui/primitives/Accordion';
import { consultationApi } from '../../api';
import { useNavigate } from 'react-router-dom';

// MagicUI Components
import { BlurFade } from '../../components/ui/blur-fade';
import { WarpBackground } from '../../components/ui/warp-background';
import { BoxReveal } from '../../components/ui/box-reveal';

interface OnlineConsultationFormData {
  fullName: string;
  phone: string;
  notes?: string;
  question: string;
}

// CountUp component – không cần thư viện ngoài
const CountUp: React.FC<{ end: number; duration?: number; suffix?: string }> = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let startTime: number;
    const step = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, end, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
};

const OnlineConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  // Form state
  const [form, setForm] = useState<OnlineConsultationFormData>({
    fullName: '',
    phone: '',
    notes: '',
    question: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Scroll to top on mount – UX
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Toast auto-hide
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // Features data (icon + title + desc)
  const features = [
    {
      icon: <VideoPlay size={28} color="#0C3C54" variant="Bold" />,
      title: 'Tư vấn qua Video Call',
      description: 'Gặp gỡ trực tiếp với chuyên gia qua Google Meet chất lượng cao.',
      color: '#0C3C54'
    },
    {
      icon: <Shield size={28} color="#2A7F9E" variant="Bold" />,
      title: 'Bảo mật dữ liệu',
      description: 'Thông tin cá nhân được mã hoá và bảo vệ theo tiêu chuẩn y tế.',
      color: '#2A7F9E'
    },
    {
      icon: <Clock size={28} color="#4CAF50" variant="Bold" />,
      title: 'Linh hoạt thời gian',
      description: 'Đặt lịch tư vấn 24/7 theo khung giờ bạn muốn.',
      color: '#4CAF50'
    },
    {
      icon: <Verify size={28} color="#FF9800" variant="Bold" />,
      title: 'Chuyên gia uy tín',
      description: 'Đội ngũ bác sĩ giàu kinh nghiệm và có chứng chỉ hành nghề.',
      color: '#FF9800'
    }
  ];

  // Statistics data
  const stats = [
    { 
      icon: <Profile2User size={32} variant="Bold" />, 
      number: 5000, 
      suffix: '+', 
      label: 'Cuộc tư vấn thành công',
      color: '#0C3C54'
    },
    { 
      icon: <Star1 size={32} variant="Bold" />, 
      number: 4.8, 
      suffix: '/5', 
      label: 'Đánh giá từ khách hàng',
      color: '#4CAF50'
    },
    { 
      icon: <Clock size={32} variant="Bold" />, 
      number: 24, 
      suffix: '/7', 
      label: 'Hỗ trợ liên tục',
      color: '#2A7F9E'
    },
    { 
      icon: <Award size={32} variant="Bold" />, 
      number: 98, 
      suffix: '%', 
      label: 'Tỷ lệ hài lòng',
      color: '#FF9800'
    }
  ];

  // FAQ data
  const faqItems: AccordionItem[] = [
    {
      header: 'Làm thế nào để đặt lịch tư vấn trực tuyến?',
      content: (
        <p>
          Bạn chỉ cần điền biểu mẫu dưới đây với thông tin cá nhân và câu hỏi. Chúng tôi sẽ liên hệ trong vòng 24h để xác
          nhận và gửi link Google Meet.
        </p>
      )
    },
    {
      header: 'Chi phí tư vấn trực tuyến là bao nhiêu?',
      content: (
        <p>
          Phí tư vấn từ 200.000 – 500.000 VNĐ tuỳ theo loại dịch vụ và thời lượng. Phiên tư vấn đầu tiên miễn phí 15 phút.
        </p>
      )
    },
    {
      header: 'Thông tin cá nhân có được bảo mật không?',
      content: (
        <p>
          Hoàn toàn! Chúng tôi sử dụng mã hoá end-to-end và tuân thủ tiêu chuẩn bảo mật y tế quốc tế. Thông tin của bạn được
          bảo vệ tuyệt đối.
        </p>
      )
    },
    {
      header: 'Tôi có thể huỷ lịch hẹn không?',
      content: <p>Có. Bạn có thể huỷ hoặc đổi lịch trước 24 giờ và được hoàn phí hoặc chuyển lịch.</p>
    }
  ];

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (form.fullName.trim().length < 3) {
      setToast({ type: 'error', message: 'Họ tên phải có ít nhất 3 ký tự.' });
      return;
    }
    if (!/^[0-9]{10,11}$/.test(form.phone.trim())) {
      setToast({ type: 'error', message: 'Số điện thoại không hợp lệ.' });
      return;
    }
    if (form.question.trim().length < 10) {
      setToast({ type: 'error', message: 'Câu hỏi phải có ít nhất 10 ký tự.' });
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setShowLoginModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await consultationApi.createOnlineConsultation({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        notes: form.notes?.trim(),
        question: form.question.trim()
      });
      setToast({ type: 'success', message: 'Tạo yêu cầu tư vấn thành công! Vui lòng thanh toán.' });
      window.location.href = `/consultation/payment/${res.data.data._id}`;
    } catch (err: any) {
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Có lỗi xảy ra.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Input change helper
  const onInputChange = (field: keyof OnlineConsultationFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  // Scroll to form
  const scrollToForm = () => {
    document.getElementById('consultation-form')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section với MagicUI */}
      <section className="relative pt-20 pb-20 overflow-hidden bg-[#0C3C54]">
        {/* Animated grid background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-30">
            {[...Array(100)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-px h-px bg-[#2A7F9E]"
                style={{
                  left: `${(i % 10) * 10}%`,
                  top: `${Math.floor(i / 10) * 10}%`,
                }}
                animate={{
                  opacity: [0.1, 0.8, 0.1],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <BlurFade delay={0.2} inView>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-white/10 rounded-full mb-8 backdrop-blur-sm border border-white/20"
            >
              <VideoPlay size={48} className="text-white" variant="Bold" />
            </motion.div>
          </BlurFade>
          
          <BlurFade delay={0.4} inView>
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Tư vấn trực tuyến
            </motion.h1>
          </BlurFade>
          
          <BlurFade delay={0.6} inView>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 text-enhanced"
            >
              Kết nối với chuyên gia sức khỏe mọi lúc, mọi nơi
            </motion.div>
          </BlurFade>
          
          <BlurFade delay={0.8} inView>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <PrimaryButton
                  className="!bg-white !text-[#0C3C54] !font-bold !px-8 !py-6 !text-lg !shadow-2xl hover:!bg-gray-50"
                  onClick={scrollToForm}
                >
                  Bắt đầu tư vấn
                </PrimaryButton>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <PrimaryButton
                  variant="outline"
                  className="!border-white !text-white !font-bold !px-8 !py-6 !text-lg hover:!bg-white hover:!text-[#0C3C54]"
                  onClick={() => navigate('/counselors')}
                >
                  Xem bác sĩ
                </PrimaryButton>
              </motion.div>
            </div>
          </BlurFade>
        </div>
      </section>



      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} inView>
            <div className="text-center mb-16">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Tại sao chọn tư vấn trực tuyến?
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto text-enhanced"
              >
                Những ưu điểm vượt trội của dịch vụ tư vấn sức khỏe trực tuyến
              </motion.div>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <BlurFade key={index} delay={0.2 + index * 0.1} inView>
                <WarpBackground className="h-full group cursor-pointer">
                  <div className="p-8 text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                      style={{ backgroundColor: `${feature.color}20` }}
                    >
                      {feature.icon}
                    </motion.div>
                    
                    <BoxReveal align="center">
                      <h4 className="text-xl font-bold text-gray-800 mb-3">
                        {feature.title}
                      </h4>
                    </BoxReveal>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="text-gray-600 text-sm leading-relaxed text-enhanced"
                    >
                      {feature.description}
                    </motion.div>
                  </div>
                </WarpBackground>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} inView>
            <div className="text-center mb-16">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-red-400 rounded-full mb-8 shadow-xl"
              >
                <MessageQuestion size={40} className="text-white" variant="Bold" />
              </motion.div>
              
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Câu hỏi <span className="text-[#2A7F9E]">thường gặp</span>
              </motion.h2>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto text-enhanced"
              >
                Những thắc mắc phổ biến về dịch vụ tư vấn trực tuyến mà khách hàng quan tâm nhất
              </motion.div>
            </div>
          </BlurFade>
          
          <BlurFade delay={0.4} inView>
            <WarpBackground className="max-w-4xl mx-auto">
              <div className="p-8">
                <Accordion items={faqItems} />
              </div>
            </WarpBackground>
          </BlurFade>
        </div>
      </section>

      {/* Consultation Form Section */}
      <section id="consultation-form" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
            {/* left intro */}
            <BlurFade delay={0.2} direction="left" inView>
              <div className="space-y-8">
                <div>
                  <motion.h2 
                    className="text-4xl md:text-5xl font-bold text-[#0C3C54] mb-6 leading-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    Có câu hỏi về <span className="text-[#2A7F9E]">sức khỏe?</span>
                  </motion.h2>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-xl text-gray-600 leading-relaxed text-enhanced"
                  >
                    Đừng ngại chia sẻ vấn đề của bạn. Chúng tôi phản hồi trong 24 giờ với đội ngũ chuyên gia hàng đầu.
                  </motion.div>
                </div>

                <div className="space-y-4">
                  <TagChip className="bg-emerald-100 text-emerald-700 px-4 py-2 text-base">
                    <Clock size={18} className="mr-2" /> Phản hồi trong 24h
                  </TagChip>
                  <TagChip className="bg-blue-100 text-blue-700 px-4 py-2 text-base">
                    <Shield size={18} className="mr-2" /> Bảo mật thông tin
                  </TagChip>
                  <TagChip className="bg-orange-100 text-orange-700 px-4 py-2 text-base">
                    <Profile size={18} className="mr-2" /> Chuyên gia chứng chỉ
                  </TagChip>
                </div>
              </div>
            </BlurFade>

            {/* form */}
            <BlurFade delay={0.4} direction="right" inView>
              <WarpBackground className="group">
                <div className="p-10">
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-[#0C3C54]/10 rounded-full mb-4"
                    >
                      <Send size={24} className="text-[#0C3C54]" variant="Bold" />
                    </motion.div>
                    <BoxReveal align="center">
                      <h3 className="text-2xl font-bold text-[#0C3C54] mb-2">Gửi câu hỏi của bạn</h3>
                    </BoxReveal>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="text-gray-600 text-enhanced"
                    >
                      Chúng tôi sẽ phản hồi sớm nhất có thể
                    </motion.div>
                  </div>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-[#0C3C54]" htmlFor="fullName">
                        Họ và tên
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={form.fullName}
                        onChange={onInputChange('fullName')}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0C3C54] focus:border-transparent text-lg transition-all duration-300"
                        placeholder="Nhập họ tên đầy đủ"
                        required
                        minLength={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-[#0C3C54]" htmlFor="phone">
                        Số điện thoại
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={onInputChange('phone')}
                        pattern="[0-9]{10,11}"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0C3C54] focus:border-transparent text-lg transition-all duration-300"
                        placeholder="Nhập số điện thoại"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-[#0C3C54]" htmlFor="notes">
                        Ghi chú thêm (tuỳ chọn)
                      </label>
                      <input
                        id="notes"
                        type="text"
                        value={form.notes}
                        onChange={onInputChange('notes')}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0C3C54] focus:border-transparent text-lg transition-all duration-300"
                        placeholder="Thông tin bổ sung"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-[#0C3C54]" htmlFor="question">
                        Câu hỏi của bạn
                      </label>
                      <textarea
                        id="question"
                        rows={5}
                        value={form.question}
                        onChange={onInputChange('question')}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0C3C54] focus:border-transparent text-lg resize-none transition-all duration-300"
                        placeholder="Mô tả chi tiết triệu chứng hoặc thắc mắc của bạn..."
                        required
                        minLength={10}
                      />
                    </div>
                    <div className="pt-4">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <PrimaryButton 
                          type="submit" 
                          fullWidth 
                          icon={<Send size={20} />} 
                          disabled={isSubmitting} 
                          className="!py-4 !text-lg !font-bold !shadow-2xl"
                        >
                          {isSubmitting ? 'Đang gửi...' : 'Gửi câu hỏi tư vấn'}
                        </PrimaryButton>
                      </motion.div>
                    </div>
                  </form>
                </div>
              </WarpBackground>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* Toast notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </motion.div>
      )}

      {/* Floating button */}
      <FloatingAppointmentButton onAppointmentClick={scrollToForm} />

      {/* Modal yêu cầu đăng nhập */}
      <ModalDialog
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title={
          <>
            <InfoCircle size={22} color="#0C3C54" /> <span>Yêu cầu đăng nhập</span>
          </>
        }
        actions={
          <>
            <PrimaryButton 
              variant="outline" 
              onClick={() => setShowLoginModal(false)}
              className="!border-gray-300 !text-gray-600 hover:!border-gray-400 hover:!text-gray-700"
            >
              Đóng
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                setShowLoginModal(false);
                window.location.href = '/login';
              }}
            >
              Đăng nhập ngay
            </PrimaryButton>
          </>
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-sm text-enhanced"
        >
          Bạn cần đăng nhập để sử dụng dịch vụ tư vấn trực tuyến. Việc đăng nhập giúp chúng tôi bảo mật dữ liệu và theo dõi lịch
          sử tư vấn của bạn.
        </motion.div>
      </ModalDialog>
    </div>
  );
};

export default OnlineConsultationPage; 