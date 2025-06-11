import { Button, Card, Timeline, message } from "antd";
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

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string;
  color: string;
}

const AboutGCC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mission");
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
      message.error('Không thể tải danh sách bác sĩ');
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Mock data cho achievements
  const achievements: Achievement[] = [
    {
      id: 1,
      title: "Bệnh nhân đã phục vụ",
      description: "Số lượng bệnh nhân đã được chăm sóc",
      icon: <People size={32} variant="Bold" />,
      value: "50,000+",
      color: "#0C3C54"
    },
    {
      id: 2,
      title: "Năm kinh nghiệm",
      description: "Thời gian hoạt động trong lĩnh vực",
      icon: <Calendar size={32} variant="Bold" />,
      value: "8+",
      color: "#2A7F9E"
    },
    {
      id: 3,
      title: "Bác sĩ chuyên khoa",
      description: "Đội ngũ y tế chuyên nghiệp",
      icon: <UserOctagon size={32} variant="Bold" />,
      value: "25+",
      color: "#4CAF50"
    },
    {
      id: 4,
      title: "Tỷ lệ hài lòng",
      description: "Mức độ hài lòng của bệnh nhân",
      icon: <Star1 size={32} variant="Bold" />,
      value: "98%",
      color: "#FF9800"
    }
  ];

  const milestones = [
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

  const values = [
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="relative pt-12 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E] opacity-90"></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('../../assets/images/pattern.png')] opacity-10"></div>
          {[...Array(25)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/20"
              animate={{
                x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
                y: [Math.random() * 500, Math.random() * 500],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: Math.random() * 20 + 15,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <AnimatedSection animation="slideUp">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full mb-8 backdrop-blur-sm"
            >
              <Building size={48} className="text-white" variant="Bold" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Về Gender Healthcare
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8">
              Đơn vị tiên phong trong lĩnh vực chăm sóc sức khỏe giới tính và sinh sản tại Việt Nam
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="large"
                  className="bg-white text-[#0C3C54] border-none font-semibold px-8 py-6 h-auto rounded-full"
                  onClick={() => document.getElementById('mission')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Tìm hiểu thêm
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="large"
                  ghost
                  className="border-white text-white font-semibold px-8 py-6 h-auto rounded-full hover:!bg-white hover:!text-[#0C3C54]"
                  onClick={() => navigate('/counselors')}
                >
                  Gặp đội ngũ
                </Button>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="slideUp">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Thành tựu của chúng tôi
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Những con số ấn tượng thể hiện sự tin tưởng và hài lòng của bệnh nhân
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Card className="text-center border-0 shadow-lg group-hover:shadow-2xl transition-all duration-500 h-full">
                  <div className="p-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                      style={{ backgroundColor: `${achievement.color}20` }}
                    >
                      <div style={{ color: achievement.color }}>
                        {achievement.icon}
                      </div>
                    </motion.div>
                    <h3 className="text-3xl font-bold mb-2" style={{ color: achievement.color }}>
                      {achievement.value}
                    </h3>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      {achievement.title}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {achievement.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission, Vision, Values Section */}
      <div id="mission" className="py-20">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="slideUp">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Sứ mệnh & Tầm nhìn
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Định hướng và giá trị cốt lõi dẫn dắt mọi hoạt động của chúng tôi
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Mission */}
            <AnimatedSection animation="slideLeft">
              <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500">
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-[#0C3C54] rounded-full flex items-center justify-center mr-4">
                      <Heart size={24} className="text-white" variant="Bold" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Sứ mệnh</h3>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Mang đến dịch vụ chăm sóc sức khỏe giới tính và sinh sản toàn diện, 
                    chuyên nghiệp và nhân văn. Chúng tôi cam kết tạo ra một môi trường 
                    an toàn, riêng tư và thoải mái để mọi người có thể tiếp cận các dịch vụ 
                    y tế chất lượng cao mà không bị phán xét hay kỳ thị.
                  </p>
                </div>
              </Card>
            </AnimatedSection>

            {/* Vision */}
            <AnimatedSection animation="slideRight">
              <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500">
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-[#2A7F9E] rounded-full flex items-center justify-center mr-4">
                      <Award size={24} className="text-white" variant="Bold" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Tầm nhìn</h3>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Trở thành đơn vị hàng đầu Việt Nam trong lĩnh vực chăm sóc sức khỏe 
                    giới tính và sinh sản, được công nhận về chất lượng dịch vụ, 
                    sự đổi mới trong công nghệ y tế và đóng góp tích cực vào việc 
                    nâng cao nhận thức cộng đồng về sức khỏe sinh sản.
                  </p>
                </div>
              </Card>
            </AnimatedSection>
          </div>

          {/* Core Values */}
          <AnimatedSection animation="slideUp">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                Giá trị cốt lõi
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Những nguyên tắc định hướng mọi hành động và quyết định của chúng tôi
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Card className="text-center border-0 shadow-lg group-hover:shadow-2xl transition-all duration-500 h-full">
                  <div className="p-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="mb-4"
                    >
                      {value.icon}
                    </motion.div>
                    <h4 className="text-xl font-bold text-gray-800 mb-3">
                      {value.title}
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="slideUp">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Hành trình phát triển
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Những cột mốc quan trọng trong quá trình xây dựng và phát triển
              </p>
            </div>
          </AnimatedSection>

          <div className="max-w-4xl mx-auto">
            <Timeline
              mode="alternate"
              items={milestones.map((milestone, index) => ({
                dot: (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                    className="w-4 h-4 bg-[#0C3C54] rounded-full border-4 border-white shadow-lg"
                  />
                ),
                children: (
                  <motion.div
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="p-6">
                        <div className="text-2xl font-bold text-[#0C3C54] mb-2">
                          {milestone.year}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">
                          {milestone.title}
                        </h4>
                        <p className="text-gray-600">
                          {milestone.description}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                )
              }))}
            />
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="slideUp">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Đội ngũ lãnh đạo
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Những chuyên gia hàng đầu dẫn dắt Gender Healthcare
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingDoctors ? (
              // Loading skeleton
              [...Array(3)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <Card className="border-0 shadow-lg transition-all duration-500 overflow-hidden animate-pulse">
                    <div className="relative h-64 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              doctors.map((doctor, index) => (
                <motion.div
                  key={doctor._id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/doctors/${doctor._id}`)}
                >
                  <Card className="border-0 shadow-lg group-hover:shadow-2xl transition-all duration-500 overflow-hidden">
                    <div className="relative h-64 overflow-hidden">
                      <img
                                                      src={doctor.image || doctor.userId.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.userId.fullName}`}
                        alt={doctor.userId.fullName}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <h4 className="text-lg font-bold">{doctor.userId.fullName}</h4>
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
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {doctor.bio || 'Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm trong lĩnh vực chăm sóc sức khỏe.'}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          <AnimatedSection animation="fadeIn" delay={0.5}>
            <div className="text-center mt-16">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="large"
                  className="bg-[#0C3C54] text-white border-none font-semibold px-8 py-6 h-auto rounded-full hover:!bg-[#2A7F9E]"
                  onClick={() => navigate('/counselors')}
                >
                  Xem tất cả bác sĩ
                </Button>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E]">
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection animation="slideUp">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Sẵn sàng bắt đầu hành trình chăm sóc sức khỏe?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Hãy để chúng tôi đồng hành cùng bạn trong việc chăm sóc sức khỏe giới tính và sinh sản
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="large"
                  className="bg-white text-[#0C3C54] border-none font-semibold px-8 py-6 h-auto rounded-full"
                  onClick={() => navigate('/booking')}
                >
                  Đặt lịch tư vấn
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="large"
                  ghost
                  className="border-white text-white font-semibold px-8 py-6 h-auto rounded-full hover:!bg-white hover:!text-[#0C3C54]"
                  onClick={() => navigate('/services')}
                >
                  Xem dịch vụ
                </Button>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
};

export default AboutGCC; 