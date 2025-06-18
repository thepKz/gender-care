import { motion } from "framer-motion";
import {
    Award,
    Building,
    Calendar,
    Crown,
    Heart,
    People,
    Shield,
    Star1,
    TrendUp,
    UserOctagon
} from "iconsax-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doctorApi, type Doctor } from "../../api/endpoints/doctorApi";
import { AnimatedSection } from "../../shared";
import PrimaryButton from "../../components/ui/primitives/PrimaryButton";

// MagicUI Components
import { TextAnimate } from "../../components/ui/text-animate";
import { NumberTicker } from "../../components/ui/number-ticker";
import { BlurFade } from "../../components/ui/blur-fade";
import { SparklesText } from "../../components/ui/sparkles-text";
import { FlickeringGrid } from "../../components/ui/flickering-grid";
import { InteractiveGridPattern } from "../../components/ui/interactive-grid-pattern";
import { WarpBackground } from "../../components/ui/warp-background";
import { AnimatedShinyText } from "../../components/ui/animated-shiny-text";
import { HyperText } from "../../components/ui/hyper-text";
import { BoxReveal } from "../../components/ui/box-reveal";

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  value: number;
  color: string;
}

interface Milestone {
  year: string;
  title: string;
  description: string;
}

interface Value {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const AboutGCC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Lấy danh sách bác sĩ từ API
  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const doctorsList = await doctorApi.getAllDoctors();
      setDoctors(doctorsList.slice(0, 3)); // Chỉ lấy 3 bác sĩ đầu để hiển thị
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bác sĩ:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Achievement data with numbers for NumberTicker
  const achievements: Achievement[] = [
    {
      id: 1,
      title: "Bệnh nhân đã phục vụ",
      description: "Số lượng bệnh nhân đã được chăm sóc",
      icon: <People size={32} variant="Bold" />,
      value: 50000,
      color: "#0C3C54"
    },
    {
      id: 2,
      title: "Năm kinh nghiệm",
      description: "Thời gian hoạt động trong lĩnh vực",
      icon: <Calendar size={32} variant="Bold" />,
      value: 8,
      color: "#2A7F9E"
    },
    {
      id: 3,
      title: "Bác sĩ chuyên khoa",
      description: "Đội ngũ y tế chuyên nghiệp",
      icon: <UserOctagon size={32} variant="Bold" />,
      value: 25,
      color: "#4CAF50"
    },
    {
      id: 4,
      title: "Tỷ lệ hài lòng",
      description: "Mức độ hài lòng của bệnh nhân",
      icon: <Star1 size={32} variant="Bold" />,
      value: 98,
      color: "#FF9800"
    }
  ];

  const milestones: Milestone[] = [
    {
      year: "2016",
      title: "Thành lập Gender Healthcare",
      description: "Khởi đầu với sứ mệnh mang đến dịch vụ chăm sóc sức khỏe sinh sản chất lượng cao"
    },
    {
      year: "2018",
      title: "Mở rộng dịch vụ",
      description: "Bổ sung các dịch vụ tư vấn tâm lý và xét nghiệm STI"
    },
    {
      year: "2020",
      title: "Chuyển đổi số",
      description: "Ra mắt nền tảng tư vấn trực tuyến và ứng dụng di động"
    },
    {
      year: "2022",
      title: "Chứng nhận ISO",
      description: "Đạt chứng nhận ISO 9001:2015 về hệ thống quản lý chất lượng"
    },
    {
      year: "2024",
      title: "Mở rộng toàn quốc",
      description: "Phát triển mạng lưới phòng khám tại các thành phố lớn"
    }
  ];

  const values: Value[] = [
    {
      icon: <Heart size={40} variant="Bold" className="text-red-500" />,
      title: "Tận tâm",
      description: "Chúng tôi luôn đặt sức khỏe và hạnh phúc của bệnh nhân lên hàng đầu"
    },
    {
      icon: <Shield size={40} variant="Bold" className="text-blue-500" />,
      title: "Bảo mật",
      description: "Đảm bảo tuyệt đối sự riêng tư và bảo mật thông tin của bệnh nhân"
    },
    {
      icon: <Crown size={40} variant="Bold" className="text-yellow-500" />,
      title: "Chuyên nghiệp",
      description: "Đội ngũ y tế được đào tạo bài bản với trình độ chuyên môn cao"
    },
    {
      icon: <TrendUp size={40} variant="Bold" className="text-green-500" />,
      title: "Đổi mới",
      description: "Không ngừng cập nhật công nghệ và phương pháp điều trị tiên tiến"
    }
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchDoctors();
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with MagicUI */}
      <div className="relative pt-20 pb-20 overflow-hidden bg-[#0C3C54]">
        <FlickeringGrid
          className="absolute inset-0 z-0"
          squareSize={4}
          gridGap={6}
          color="#2A7F9E"
          maxOpacity={0.3}
          flickerChance={0.1}
        />
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <BlurFade delay={0.2} inView>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-white/10 rounded-full mb-8 backdrop-blur-sm border border-white/20"
            >
              <Building size={48} className="text-white" variant="Bold" />
            </motion.div>
          </BlurFade>
          
          <BlurFade delay={0.4} inView>
            <SparklesText 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              colors={{ first: "#FFFFFF", second: "#2A7F9E" }}
            >
              Về Gender Healthcare
            </SparklesText>
          </BlurFade>
          
          <BlurFade delay={0.6} inView>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 text-enhanced"
            >
              Đơn vị tiên phong trong lĩnh vực chăm sóc sức khỏe giới tính và sinh sản tại Việt Nam
            </motion.div>
          </BlurFade>
          
          <BlurFade delay={0.8} inView>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <PrimaryButton
                  className="!bg-white !text-[#0C3C54] !font-bold !px-8 !py-6 !text-lg !shadow-2xl hover:!bg-gray-50"
                  onClick={() => document.getElementById('mission')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Tìm hiểu thêm
                </PrimaryButton>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <PrimaryButton
                  variant="outline"
                  className="!border-white !text-white !font-bold !px-8 !py-6 !text-lg hover:!bg-white hover:!text-[#0C3C54]"
                  onClick={() => navigate('/counselors')}
                >
                  Gặp đội ngũ
                </PrimaryButton>
              </motion.div>
            </div>
          </BlurFade>
        </div>
      </div>

      {/* Statistics Section with NumberTicker */}
      <div className="py-20 bg-white relative">
        <InteractiveGridPattern
          className="absolute inset-0 opacity-5"
          width={60}
          height={60}
        />
        
        <div className="relative z-10 container mx-auto px-4">
          <BlurFade delay={0.2} inView>
            <div className="text-center mb-16">
              <HyperText className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Thành tựu của chúng tôi
              </HyperText>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto text-enhanced"
              >
                Những con số ấn tượng thể hiện sự tin tưởng và hài lòng của bệnh nhân
              </motion.div>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <BlurFade key={achievement.id} delay={0.2 + index * 0.1} inView>
                <WarpBackground className="h-full group cursor-pointer">
                  <div className="p-8 text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                      style={{ backgroundColor: `${achievement.color}20` }}
                    >
                      <div style={{ color: achievement.color }}>
                        {achievement.icon}
                      </div>
                    </motion.div>
                    
                    <div className="text-4xl font-bold mb-2" style={{ color: achievement.color }}>
                      <NumberTicker 
                        value={achievement.value}
                        className="text-4xl font-bold"
                      />
                      {achievement.id === 1 ? "+" : achievement.id === 4 ? "%" : "+"}
                    </div>
                    
                    <BoxReveal align="center">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        {achievement.title}
                      </h4>
                    </BoxReveal>
                    
                    <p className="text-gray-600 text-sm">
                      {achievement.description}
                    </p>
                  </div>
                </WarpBackground>
              </BlurFade>
            ))}
          </div>
        </div>
      </div>

      {/* Mission & Vision Section with Storytelling Layout */}
      <div id="mission" className="py-20 bg-gray-50 relative">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} inView>
            <div className="text-center mb-16">
              <SparklesText 
                className="text-3xl md:text-4xl font-bold mb-4"
                colors={{ first: "#0C3C54", second: "#2A7F9E" }}
              >
                Sứ mệnh & Tầm nhìn
              </SparklesText>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto text-enhanced"
              >
                Định hướng và giá trị cốt lõi dẫn dắt mọi hoạt động của chúng tôi
              </motion.div>
            </div>
          </BlurFade>

          {/* Alternating layout for storytelling */}
          <div className="space-y-20">
            {/* Mission */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <BlurFade delay={0.3} direction="left" inView>
                <WarpBackground className="h-full">
                  <div className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-[#0C3C54] rounded-full flex items-center justify-center mr-4">
                        <Heart size={24} className="text-white" variant="Bold" />
                      </div>
                      <HyperText className="text-2xl font-bold text-gray-800">
                        Sứ mệnh
                      </HyperText>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="text-gray-600 text-lg leading-relaxed text-enhanced"
                    >
                      Mang đến dịch vụ chăm sóc sức khỏe giới tính và sinh sản toàn diện, 
                      chuyên nghiệp và nhân văn. Chúng tôi cam kết tạo ra một môi trường 
                      an toàn, riêng tư và thoải mái để mọi người có thể tiếp cận các dịch vụ 
                      y tế chất lượng cao mà không bị phán xét hay kỳ thị.
                    </motion.div>
                  </div>
                </WarpBackground>
              </BlurFade>
              
              <BlurFade delay={0.5} direction="right" inView>
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="Mission"
                    className="w-full h-80 object-cover rounded-2xl shadow-2xl"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-[#0C3C54]/20"></div>
                </div>
              </BlurFade>
            </div>

            {/* Vision - Reversed layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <BlurFade delay={0.3} direction="left" inView className="lg:order-2">
                <WarpBackground className="h-full">
                  <div className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-[#2A7F9E] rounded-full flex items-center justify-center mr-4">
                        <Award size={24} className="text-white" variant="Bold" />
                      </div>
                      <HyperText className="text-2xl font-bold text-gray-800">
                        Tầm nhìn
                      </HyperText>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="text-gray-600 text-lg leading-relaxed text-enhanced"
                    >
                      Trở thành đơn vị hàng đầu Việt Nam trong lĩnh vực chăm sóc sức khỏe 
                      giới tính và sinh sản, được công nhận về chất lượng dịch vụ, 
                      sự đổi mới trong công nghệ y tế và đóng góp tích cực vào việc 
                      nâng cao nhận thức cộng đồng về sức khỏe sinh sản.
                    </motion.div>
                  </div>
                </WarpBackground>
              </BlurFade>
              
              <BlurFade delay={0.5} direction="right" inView className="lg:order-1">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="Vision"
                    className="w-full h-80 object-cover rounded-2xl shadow-2xl"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-[#2A7F9E]/20"></div>
                </div>
              </BlurFade>
            </div>
          </div>

          {/* Core Values */}
          <BlurFade delay={0.4} inView>
            <div className="text-center mt-20 mb-12">
              <SparklesText 
                className="text-2xl md:text-3xl font-bold mb-4"
                colors={{ first: "#0C3C54", second: "#2A7F9E" }}
              >
                Giá trị cốt lõi
              </SparklesText>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto text-enhanced"
              >
                Những nguyên tắc định hướng mọi hành động và quyết định của chúng tôi
              </motion.div>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <BlurFade key={index} delay={0.2 + index * 0.1} inView>
                <WarpBackground className="h-full group cursor-pointer">
                  <div className="p-6 text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="mb-4"
                    >
                      {value.icon}
                    </motion.div>
                    <BoxReveal align="center">
                      <h4 className="text-xl font-bold text-gray-800 mb-3">
                        {value.title}
                      </h4>
                    </BoxReveal>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="text-gray-600 text-sm leading-relaxed text-enhanced"
                    >
                      {value.description}
                    </motion.div>
                  </div>
                </WarpBackground>
              </BlurFade>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Section with Custom Design */}
      <div className="py-20 bg-white relative">
        <FlickeringGrid
          className="absolute inset-0 opacity-5"
          squareSize={6}
          gridGap={8}
          color="#0C3C54"
          maxOpacity={0.2}
          flickerChance={0.05}
        />
        
        <div className="relative z-10 container mx-auto px-4">
          <BlurFade delay={0.2} inView>
            <div className="text-center mb-16">
              <HyperText className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Hành trình phát triển
              </HyperText>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto text-enhanced"
              >
                Những cột mốc quan trọng trong quá trình xây dựng và phát triển
              </motion.div>
            </div>
          </BlurFade>

          {/* Custom Timeline */}
          <div className="max-w-6xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-[#0C3C54]/20 hidden lg:block"></div>
              
              {milestones.map((milestone, index) => (
                <BlurFade key={index} delay={0.3 + index * 0.2} inView>
                  <div className={`flex items-center mb-12 ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                    {/* Content */}
                    <div className="w-full lg:w-5/12">
                      <WarpBackground className="group cursor-pointer">
                        <div className="p-8">
                          <BoxReveal align="center">
                            <div className="text-3xl font-bold text-[#0C3C54] mb-4">
                              {milestone.year}
                            </div>
                          </BoxReveal>
                          <BoxReveal align="center">
                            <h4 className="text-xl font-semibold text-gray-800 mb-3">
                              {milestone.title}
                            </h4>
                          </BoxReveal>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="text-gray-600 leading-relaxed text-enhanced"
                          >
                            {milestone.description}
                          </motion.div>
                        </div>
                      </WarpBackground>
                    </div>
                    
                    {/* Timeline Dot */}
                    <div className="hidden lg:flex w-2/12 justify-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.2 }}
                        whileHover={{ scale: 1.2 }}
                        className="w-6 h-6 bg-[#0C3C54] rounded-full border-4 border-white shadow-lg z-10 relative"
                      />
                    </div>
                    
                    {/* Spacer */}
                    <div className="hidden lg:block w-5/12"></div>
                  </div>
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} inView>
            <div className="text-center mb-16">
              <SparklesText 
                className="text-3xl md:text-4xl font-bold mb-4"
                colors={{ first: "#0C3C54", second: "#2A7F9E" }}
              >
                Đội ngũ lãnh đạo
              </SparklesText>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto text-enhanced"
              >
                Những chuyên gia hàng đầu dẫn dắt Gender Healthcare
              </motion.div>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingDoctors ? (
              // Loading skeleton
              [...Array(3)].map((_, index) => (
                <BlurFade key={index} delay={0.2 + index * 0.1} inView>
                  <WarpBackground className="h-full animate-pulse">
                    <div className="relative h-64 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </WarpBackground>
                </BlurFade>
              ))
            ) : (
              doctors.map((doctor, index) => (
                <BlurFade key={doctor._id} delay={0.2 + index * 0.1} inView>
                  <motion.div
                    whileHover={{ y: -10 }}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/doctors/${doctor._id}`)}
                  >
                    <WarpBackground className="h-full overflow-hidden">
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={doctor.image || doctor.userId.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.userId.fullName}`}
                          alt={doctor.userId.fullName}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-4 left-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <AnimatedShinyText className="text-lg font-bold">
                            {doctor.userId.fullName}
                          </AnimatedShinyText>
                          <p className="text-sm opacity-90">{doctor.specialization || 'Bác sĩ chuyên khoa'}</p>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Award size={16} />
                            <span>{doctor.experience || 0} năm kinh nghiệm</span>
                          </div>
                          <div className="text-sm text-[#0C3C54] font-medium">
                            {doctor.specialization || 'Chuyên khoa'}
                          </div>
                        </div>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                          className="text-gray-600 text-sm leading-relaxed text-enhanced"
                        >
                          {doctor.bio || 'Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm trong lĩnh vực chăm sóc sức khỏe.'}
                        </motion.div>
                      </div>
                    </WarpBackground>
                  </motion.div>
                </BlurFade>
              ))
            )}
          </div>

          <BlurFade delay={0.6} inView>
            <div className="text-center mt-16">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <PrimaryButton
                  className="!bg-[#0C3C54] !text-white !font-bold !px-8 !py-6 !text-lg hover:!bg-[#2A7F9E] !shadow-2xl"
                  onClick={() => navigate('/counselors')}
                >
                  Xem tất cả bác sĩ
                </PrimaryButton>
              </motion.div>
            </div>
          </BlurFade>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-[#0C3C54] relative">
        <FlickeringGrid
          className="absolute inset-0"
          squareSize={4}
          gridGap={6}
          color="#2A7F9E"
          maxOpacity={0.3}
          flickerChance={0.1}
        />
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <BlurFade delay={0.2} inView>
            <SparklesText 
              className="text-3xl md:text-4xl font-bold mb-6"
              colors={{ first: "#FFFFFF", second: "#2A7F9E" }}
            >
              Sẵn sàng bắt đầu hành trình chăm sóc sức khỏe?
            </SparklesText>
          </BlurFade>
          
          <BlurFade delay={0.4} inView>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-white/90 max-w-2xl mx-auto mb-8 text-enhanced"
            >
              Hãy để chúng tôi đồng hành cùng bạn trong việc chăm sóc sức khỏe giới tính và sinh sản
            </motion.div>
          </BlurFade>
          
          <BlurFade delay={0.6} inView>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <PrimaryButton
                  className="!bg-white !text-[#0C3C54] !font-bold !px-8 !py-6 !text-lg !shadow-2xl hover:!bg-gray-50"
                  onClick={() => navigate('/booking')}
                >
                  Đặt lịch tư vấn
                </PrimaryButton>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <PrimaryButton
                  variant="outline"
                  className="!border-white !text-white !font-bold !px-8 !py-6 !text-lg hover:!bg-white hover:!text-[#0C3C54]"
                  onClick={() => navigate('/services')}
                >
                  Xem dịch vụ
                </PrimaryButton>
              </motion.div>
            </div>
          </BlurFade>
        </div>
      </div>
    </div>
  );
};

export default AboutGCC; 