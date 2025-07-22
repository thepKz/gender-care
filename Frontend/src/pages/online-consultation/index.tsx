    import { motion } from 'framer-motion';
    import {
    Clock,
    InfoCircle,
    MessageQuestion,
    Profile,
    Send,
    Shield,
    Verify,
    VideoPlay,
    ArrowLeft2,
    ArrowRight2
    } from 'iconsax-react';
    import React, { useEffect, useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import FloatingAppointmentButton from '../../components/ui/common/FloatingAppointmentButton';
    import Accordion, { AccordionItem } from '../../components/ui/primitives/Accordion';
    import ModalDialog from '../../components/ui/primitives/ModalDialog';
    import PrimaryButton from '../../components/ui/primitives/PrimaryButton';
    import TagChip from '../../components/ui/primitives/TagChip';
    import dayjs, { Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { consultationApi } from '../../api';
import 'dayjs/locale/vi';

// Setup dayjs for Vietnam timezone
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('vi');
dayjs.tz.setDefault('Asia/Ho_Chi_Minh');

// Set Monday as first day of week for Vietnam
import weekday from 'dayjs/plugin/weekday';
dayjs.extend(weekday);

    // MagicUI Components
    import { BlurFade } from '../../components/ui/blur-fade';
    import { BoxReveal } from '../../components/ui/box-reveal';
    import { WarpBackground } from '../../components/ui/warp-background';

    interface OnlineConsultationFormData {
    fullName: string;
    phone: string;
    notes?: string;
    question: string;
    age?: string;
    gender?: string;
    }

    interface SlotInfo {
    slotTime: string;
    available: boolean;
    }

    const OnlineConsultationPage: React.FC = () => {
    const navigate = useNavigate();
    // Form state
    const [form, setForm] = useState<OnlineConsultationFormData>({
        fullName: '',
        phone: '',
        notes: '',
        question: ''
    });
    const [showLoginModal, setShowLoginModal] = useState(false);

      // Multi-step form state
  const [step, setStep] = useState(1);

  // Calendar state  
  const [currentMonth, setCurrentMonth] = useState(dayjs().tz('Asia/Ho_Chi_Minh'));
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

    // Scroll to top on mount – UX
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Custom Calendar Component
    const CustomCalendar = () => {
        const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];

        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        
        const startOfMonth = currentMonth.startOf('month');
        const endOfMonth = currentMonth.endOf('month');
        
        // Fix: Manual calculation for Vietnamese calendar (CN=Sunday, T2=Monday, ...)
        // Get first day of month and calculate which Sunday to start from
        const firstDay = startOfMonth;
        const firstDayOfWeek = firstDay.day(); // 0=Sunday, 1=Monday, etc.
        
        // Start from the Sunday of the week containing the first day
        const startOfWeek = firstDay.subtract(firstDayOfWeek, 'day');
        const endOfWeek = endOfMonth.add(6 - endOfMonth.day(), 'day');
        
        const days = [];
        let day = startOfWeek;
        
        while (day.isBefore(endOfWeek) || day.isSame(endOfWeek, 'day')) {
        days.push(day);
        day = day.add(1, 'day');
        }

        const goToPrevMonth = () => setCurrentMonth(prev => prev.subtract(1, 'month'));
        const goToNextMonth = () => setCurrentMonth(prev => prev.add(1, 'month'));

        const isToday = (date: Dayjs) => date.isSame(dayjs().tz('Asia/Ho_Chi_Minh'), 'day');
        const isSelected = (date: Dayjs) => selectedDate && date.isSame(selectedDate, 'day');
        const isCurrentMonth = (date: Dayjs) => date.isSame(currentMonth, 'month');
        const isPastDate = (date: Dayjs) => date.isBefore(dayjs().tz('Asia/Ho_Chi_Minh'), 'day');

        return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E] text-white p-6">
            <div className="flex items-center justify-between">
                <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToPrevMonth}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                <ArrowLeft2 size={20} />
                </motion.button>
                
                <div className="text-center">
                <h3 className="text-xl font-bold">
                    {monthNames[currentMonth.month()]} {currentMonth.year()}
                </h3>
                <p className="text-white/80 text-sm mt-1">Chọn ngày bạn muốn tư vấn với bác sĩ</p>
                </div>
                
                <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                <ArrowRight2 size={20} />
                </motion.button>
            </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
                {dayNames.map(dayName => (
                <div
                    key={dayName}
                    className="text-center text-sm font-semibold text-gray-600 py-2"
                >
                    {dayName}
                </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
                {days.map(day => {
                const isDisabled = isPastDate(day);
                const isCurrentMonthDay = isCurrentMonth(day);
                const isTodayDay = isToday(day);
                const isSelectedDay = isSelected(day);

                return (
                    <motion.button
                    key={day.format('YYYY-MM-DD')}
                    whileHover={!isDisabled ? { scale: 1.05 } : {}}
                    whileTap={!isDisabled ? { scale: 0.95 } : {}}
                    onClick={() => !isDisabled && setSelectedDate(day)}
                    disabled={isDisabled}
                    className={`
                        aspect-square rounded-xl text-sm font-medium transition-all duration-200 relative
                        ${isSelectedDay 
                        ? 'bg-[#0C3C54] text-white shadow-lg scale-105' 
                        : isDisabled
                            ? 'text-gray-300 cursor-not-allowed'
                            : isTodayDay
                            ? 'bg-blue-100 text-[#0C3C54] font-bold border-2 border-[#0C3C54]'
                            : isCurrentMonthDay
                            ? 'text-gray-700 hover:bg-[#0C3C54]/10 hover:text-[#0C3C54]'
                            : 'text-gray-400'
                    }
                    `}
                    >
                    {day.date()}
                    {isTodayDay && !isSelectedDay && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                    </motion.button>
                );
                })}
            </div>

            {/* Selected Date Display */}
            {selectedDate && (
                <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-[#0C3C54]/5 rounded-xl border border-[#0C3C54]/20"
                >
                <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Ngày đã chọn</p>
                                    <p className="text-lg font-bold text-[#0C3C54]">
                  {selectedDate.format('dddd, DD MMMM YYYY').replace(/^([a-z])/, (match) => match.toUpperCase())}
                </p>
                </div>
                </motion.div>
            )}
            </div>
        </div>
        );
    };

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

      // Helper function to filter slots based on current time
  const filterSlotsByCurrentTime = (slots: SlotInfo[], selectedDate: Dayjs) => {
    const now = dayjs().tz('Asia/Ho_Chi_Minh');
    const isToday = selectedDate.isSame(now, 'day');
    
    if (!isToday) {
      return slots; // If not today, return all available slots
    }
    
    // If today, filter slots that are still bookable
    return slots.map(slot => {
      if (!slot.available) return slot; // Keep unavailable slots as is
      
      // Parse slot time (format: "07:00-08:00" -> start time "07:00")
      const slotStartTime = slot.slotTime.split('-')[0];
      const [hours, minutes] = slotStartTime.split(':').map(Number);
      
      // Create slot datetime for today
      const slotDateTime = selectedDate.hour(hours).minute(minutes).second(0);
      
      // Add 30 minutes buffer - can't book slot that starts within 30 minutes
      const bufferTime = 30; // minutes
      const cutoffTime = now.add(bufferTime, 'minute');
      
      // If slot starts before cutoff time, mark as unavailable
      if (slotDateTime.isBefore(cutoffTime)) {
        return { ...slot, available: false };
      }
      
      return slot;
    });
  };

  // Fetch slots khi bước 3 và có ngày
  useEffect(() => {
    if (step === 3 && selectedDate) {
      setLoadingSlots(true);
      consultationApi
        .getAvailableSlotsForDate(selectedDate.format('YYYY-MM-DD'))
        .then(res => {
          console.log('API slots response', res.data);
          const apiSlots = res.data?.data?.slots;
          if (Array.isArray(apiSlots)) {
            console.log('Raw slots from API', apiSlots);
            
            // Filter slots based on current time if today
            const filteredSlots = filterSlotsByCurrentTime(apiSlots as SlotInfo[], selectedDate);
            console.log('Filtered slots after time check', filteredSlots);
            
            setSlots(filteredSlots);
          } else {
            console.warn('slots not array', apiSlots);
            setSlots([]);
          }
        })
        .catch(() => setSlots([]))
        .finally(() => setLoadingSlots(false));
    }
  }, [step, selectedDate]);

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
                        <h3 className="text-2xl font-bold text-[#0C3C54] mb-2">
                            {step === 1 && 'Gửi câu hỏi của bạn'}
                            {step === 2 && 'Chọn ngày tư vấn'}
                            {step === 3 && 'Chọn khung giờ tư vấn'}
                        </h3>
                        </BoxReveal>
                        <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="text-gray-600 text-enhanced"
                        >
                        {step === 1 && 'Chúng tôi sẽ phản hồi sớm nhất có thể'}
                        {step === 2 && 'Vui lòng chọn ngày bạn muốn tư vấn'}
                        {step === 3 && 'Vui lòng chọn khung giờ phù hợp'}
                        </motion.div>
                    </div>

                    {/* Stepper UI */}
                    <div className="flex justify-center mb-6">
                        {[1, 2, 3].map(s => (
                        <div key={s} className={`w-8 h-2 mx-1 rounded-full ${step === s ? 'bg-[#0C3C54]' : 'bg-gray-200'}`}></div>
                        ))}
                    </div>

                    {/* Step 1: Form nhập thông tin */}
                    {step === 1 && (
                        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setStep(2); }}>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-[#0C3C54]" htmlFor="fullName">
                            Họ và tên
                            </label>
                            <input
                            id="fullName"
                            type="text"
                            value={form.fullName}
                            onChange={onInputChange('fullName')}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0C3C54] focus:border-transparent text-base transition-all duration-300"
                            placeholder="Nhập họ tên đầy đủ"
                            required
                            minLength={3}
                            />
                        </div>
                        {/* 3 trường cùng 1 hàng - Compact */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                            <label className="block text-sm font-semibold mb-1.5 text-[#0C3C54]" htmlFor="phone">
                                Số điện thoại
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                value={form.phone}
                                onChange={onInputChange('phone')}
                                pattern="[0-9]{10,11}"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0C3C54] focus:border-transparent text-base transition-all duration-300"
                                placeholder="SĐT"
                                required
                            />
                            </div>
                            <div>
                            <label className="block text-sm font-semibold mb-1.5 text-[#0C3C54]" htmlFor="age">
                                Tuổi
                            </label>
                            <input
                                id="age"
                                type="number"
                                min={12}
                                max={100}
                                value={form.age || ''}
                                onChange={e => setForm(prev => ({ ...prev, age: e.target.value }))}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0C3C54] focus:border-transparent text-base transition-all duration-300 appearance-none"
                                placeholder="Tuổi"
                                required
                                inputMode="numeric"
                            />
                            </div>
                            <div>
                            <label className="block text-sm font-semibold mb-1.5 text-[#0C3C54]" htmlFor="gender">
                                Giới tính
                            </label>
                            <div className="relative">
                                <select
                                    id="gender"
                                    value={form.gender || ''}
                                    onChange={e => setForm(prev => ({ ...prev, gender: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0C3C54] focus:border-transparent text-base transition-all duration-300 appearance-none bg-white cursor-pointer"
                                    required
                                >
                                    <option value="" disabled className="text-gray-400">Chọn</option>
                                    <option value="male" className="text-gray-800">Nam</option>
                                    <option value="female" className="text-gray-800">Nữ</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-[#0C3C54]" htmlFor="notes">
                            Ghi chú thêm (tuỳ chọn)
                            </label>
                            <input
                            id="notes"
                            type="text"
                            value={form.notes}
                            onChange={onInputChange('notes')}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0C3C54] focus:border-transparent text-base transition-all duration-300"
                            placeholder="Thông tin bổ sung"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-[#0C3C54]" htmlFor="question">
                            Câu hỏi của bạn
                            </label>
                            <textarea
                            id="question"
                            rows={4}
                            value={form.question}
                            onChange={onInputChange('question')}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0C3C54] focus:border-transparent text-base resize-none transition-all duration-300"
                            placeholder="Mô tả chi tiết triệu chứng hoặc thắc mắc của bạn..."
                            required
                            minLength={10}
                            />
                        </div>
                        <div className="pt-3 flex gap-2">
                            <PrimaryButton type="submit" fullWidth icon={<Send size={18} />} className="!py-3 !text-base !font-bold !shadow-xl">
                            Tiếp tục
                            </PrimaryButton>
                        </div>
                        </form>
                    )}

                    {/* Step 2: Chọn ngày */}
                    {step === 2 && (
                        <div className="space-y-6">
                        <CustomCalendar />
                        <div className="pt-4 flex gap-2">
                            <PrimaryButton variant="outline" onClick={() => setStep(1)}>
                            Quay lại
                            </PrimaryButton>
                            <PrimaryButton onClick={() => selectedDate && setStep(3)} disabled={!selectedDate}>
                            Tiếp tục
                            </PrimaryButton>
                        </div>
                        </div>
                    )}

                    {/* Step 3: Chọn slot */}
                    {step === 3 && (
                        <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {loadingSlots && <div className="col-span-2 text-center py-8 text-gray-500">Đang tải khung giờ...</div>}
                            {!loadingSlots && slots.length === 0 && <div className="col-span-2 text-center py-8 text-gray-500">Không có khung giờ khả dụng</div>}
                            {!loadingSlots && slots.map(slot => (
                            <button
                                key={slot.slotTime}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => setSelectedSlot(slot.slotTime)}
                                className={`rounded-xl border px-4 py-3 text-lg font-semibold transition-all duration-200
                                ${slot.available ? (selectedSlot === slot.slotTime ? 'bg-[#0C3C54] text-white border-[#0C3C54]' : 'bg-white text-[#0C3C54] border-gray-300 hover:bg-[#0C3C54]/10') : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                            >
                                {slot.slotTime}
                            </button>
                            ))}
                        </div>
                        <div className="pt-4 flex gap-2">
                            <PrimaryButton variant="outline" onClick={() => setStep(2)} disabled={isSubmitting}>
                            Quay lại
                            </PrimaryButton>
                            <PrimaryButton
                                onClick={async () => {
                                    if (!selectedSlot || isSubmitting) return;
                                    const token = localStorage.getItem('access_token');
                                    if (!token) {
                                        setShowLoginModal(true);
                                        return;
                                    }
                                    
                                    setIsSubmitting(true);
                                    try {
                                        if (!form.age || parseInt(form.age,10)<12 || parseInt(form.age,10)>100) {
                                            alert('Tuổi không hợp lệ'); 
                                            setIsSubmitting(false);
                                            return;
                                        }
                                        const res = await consultationApi.createQAWithSelectedSlot({
                                            fullName: form.fullName,
                                            phone: form.phone,
                                            age: parseInt(form.age, 10),
                                            gender: form.gender,
                                            question: form.question,
                                            notes: form.notes,
                                            selectedDate: selectedDate?.format('YYYY-MM-DD'),
                                            selectedSlot,
                                        });
                                        const qaId = res.data.data.qaId;
                                        navigate(`/consultation/payment/${qaId}`);
                                    } catch (error: unknown) {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const err:any = error;
                                        console.error('API Error', err.response?.data || err);
                                        setIsSubmitting(false);
                                    }
                                }}
                                disabled={!selectedSlot || isSubmitting}
                            >
                                {isSubmitting ? '⏳ Đang xử lý, xin chờ...' : 'Xác nhận'}
                            </PrimaryButton>
                        </div>
                        </div>
                    )}
                    </div>
                </WarpBackground>
                </BlurFade>
            </div>
            </div>
        </section>

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