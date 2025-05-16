import { Avatar, Button, Rate } from "antd";
import { motion } from "framer-motion";
import { ArrowLeft2, ArrowRight2, Award, Calendar, Call, Chart2, ClipboardTick, Clock, HeartAdd, HeartTick, Hospital, MonitorMobbile, NotificationStatus, People, Profile2User, SecuritySafe, User } from "iconsax-react";
import { useEffect } from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { useNavigate } from "react-router-dom";
import Background from "../../assets/images/background.jpg";
import Image1 from "../../assets/images/image1.jpg";
import Image2 from "../../assets/images/image2.jpg";
import Image3 from "../../assets/images/image3.jpg";
import Facility1 from "../../assets/images/image4.jpg";
import Facility2 from "../../assets/images/image5.jpg";
import Facility3 from "../../assets/images/image6.jpg";
import Facility4 from "../../assets/images/image7.jpg";

import HealthBanner from "../../assets/images/doctor-banner.jpg";
import { AnimatedSection, DividerComponent } from "../../share";


const responsive = {
  desktop: { breakpoint: { max: 3000, min: 1024 }, items: 2 },
  tablet: { breakpoint: { max: 1024, min: 464 }, items: 2 },
  mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
};

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative w-full overflow-x-hidden">
      {/* Background layer with pattern overlay */}
      <div className="fixed inset-0 z-0" style={{ width: '100vw', left: 0, right: 0 }}>
        <img className="h-full w-full object-cover" src={Background} alt="Nền y tế" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C3C54] via-[#2A7F9E] to-sky-400 opacity-60"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('../../assets/images/pattern.png')] bg-repeat"></div>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/30"
            animate={{
              x: [`${Math.random() * 100}vw`, `${Math.random() * 100}vw`, `${Math.random() * 100}vw`],
              y: [`${Math.random() * 100}vh`, `${Math.random() * 100}vh`, `${Math.random() * 100}vh`],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      {/* Banner Container */}
      <div className="relative min-h-screen w-full" style={{ width: '100vw' }}>
        <div className="relative z-10 flex min-h-screen items-center w-full">
          <div className="w-full">
            <div className="px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between">
              <div className="w-full lg:w-5/12 text-left mb-8 lg:mb-0">
                <AnimatedSection animation="slideRight">
                  <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight text-white">
                    Chăm sóc sức khỏe giới tính toàn diện.
                  </h1>
                  <p className="py-4 text-base md:text-lg opacity-90 leading-relaxed text-white">
                    Gender Healthcare là cơ sở y tế chuyên cung cấp dịch vụ chăm sóc sức khỏe giới tính và sức khỏe sinh sản. <br />
                    Chúng tôi cam kết bảo mật thông tin và mang đến những dịch vụ chất lượng nhất cho bạn.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-4 mt-6">
                    <Button
                      ghost
                      size="large"
                      type="default"
                      onClick={() => window.open('tel:+84888888888', '_blank')}
                      className="w-full sm:w-auto sm:min-w-40 border-2 border-white rounded-full backdrop-blur-sm bg-white/10
                                 transition-all duration-300 hover:!bg-cyan-400 hover:!text-[#0C3C54] hover:!border-cyan-400 flex items-center justify-center text-white group"
                    >
                      Gọi tư vấn
                      <Call size={18} className="ml-2 text-white transition-colors duration-300 group-hover:!text-[#0C3C54]" />
                    </Button>
                    <Button
                      ghost
                      size="large"
                      type="default"
                      onClick={() => navigate('/booking')}
                      className="w-full sm:w-auto sm:min-w-40 border-2 border-white rounded-full backdrop-blur-sm bg-white/10
                                 transition-all duration-300 hover:!bg-cyan-400 hover:!text-[#0C3C54] hover:!border-cyan-400 flex items-center justify-center text-white group"
                    >
                      Đặt lịch hẹn
                      <Calendar size={18} className="ml-2 text-white transition-colors duration-300 group-hover:!text-[#0C3C54]" />
                    </Button>
                    <Button
                      ghost
                      size="large"
                      type="default"
                      onClick={() => navigate('/consultants')}
                      className="w-full sm:w-auto sm:min-w-40 border-2 border-white rounded-full backdrop-blur-sm bg-white/10
                                 transition-all duration-300 hover:!bg-cyan-400 hover:!text-[#0C3C54] hover:!border-cyan-400 flex items-center justify-center text-white group"
                    >
                      Tìm tư vấn viên
                      <Profile2User size={18} className="ml-2 text-white transition-colors duration-300 group-hover:!text-[#0C3C54]" />
                    </Button>
                  </div>
                </AnimatedSection>
              </div>
              <div className="w-full lg:w-7/12 relative flex justify-center">
                <div className="flex flex-col items-center md:flex-row md:justify-center md:items-stretch gap-8 md:gap-4 lg:gap-6 relative mt-12 md:mt-16 lg:mt-[100px] w-full">
                  <div className="absolute -bottom-20 left-10 w-64 h-64 rounded-full bg-cyan-400/20 blur-3xl"></div>
                  <AnimatedSection
                    animation="slideRight"
                    delay={0.1}
                    className="relative w-full max-w-sm md:max-w-none md:w-[200px] h-[360px] transform overflow-hidden rounded-3xl shadow-2xl
                            transition-all duration-500 hover:shadow-[0_0_20px_5px_rgba(34,211,238,0.3)] "
                    hoverEffect="float"
                  >
                    <img
                      src={Image1}
                      alt="Tư vấn sức khỏe"
                      className="h-full w-full object-cover filter brightness-[0.95] transition-all duration-500 hover:brightness-[1.15] hover:scale-110"
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700">
                      <div className="absolute inset-0 rounded-3xl border border-white/30 shadow-[0_0_20px_5px_rgba(34,211,238,0.2)]"></div>
                    </div>
                    <div className="absolute bottom-0 left-0 p-5 text-white">
                      <div className="w-12 h-0.5 bg-cyan-400 my-4"></div>
                      <h3 className="text-xl font-semibold mb-1">Tư vấn</h3>
                      <p className="text-sm text-white/85">Khám & tư vấn sức khỏe</p>
                    </div>
                  </AnimatedSection>
                  <AnimatedSection
                    animation="slideRight"
                    delay={0.3}
                    className="relative w-full max-w-sm md:max-w-none md:w-[200px] h-[420px] transform overflow-hidden rounded-3xl shadow-2xl
                            transition-all duration-500 hover:shadow-[0_0_20px_5px_rgba(34,211,238,0.3)] mt-0 md:mt-[-30px]"
                    hoverEffect="float"
                  >
                    <img
                      src={Image2}
                      alt="Chăm sóc sức khỏe"
                      className="h-full w-full object-cover filter brightness-[0.95] transition-all duration-500 hover:brightness-[1.15] hover:scale-110"
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700">
                      <div className="absolute inset-0 rounded-3xl ENSURE border border-white/30 shadow-[0_0_20px_5px_rgba(34,211,238,0.2)]"></div>
                    </div>
                    <div className="absolute bottom-0 left-0 p-5 text-white">
                      <div className="w-12 h-0.5 bg-cyan-400 my-4"></div>
                      <h3 className="text-xl font-semibold mb-1">Chăm sóc</h3>
                      <p className="text-sm text-white/85">Chăm sóc sức khỏe sinh sản</p>
                    </div>
                  </AnimatedSection>
                  <AnimatedSection
                    animation="slideRight"
                    delay={0.5}
                    className="relative w-full max-w-sm md:max-w-none md:w-[200px] h-[360px] transform overflow-hidden rounded-3xl shadow-2xl
                            transition-all duration-500 hover:shadow-[0_0_20px_5px_rgba(34,211,238,0.3)] "
                    hoverEffect="float"
                  >
                    <img
                      src={Image3}
                      alt="Xét nghiệm"
                      className="h-full w-full object-cover filter brightness-[0.95] transition-all duration-500 hover:brightness-[1.15] hover:scale-110"
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700">
                      <div className="absolute inset-0 rounded-3xl border border-white/30 shadow-[0_0_20px_5px_rgba(34,211,238,0.2)]"></div>
                    </div>
                    <div className="absolute bottom-0 left-0 p-5 text-white">
                      <div className="w-12 h-0.5 bg-cyan-400 my-4"></div>
                      <h3 className="text-xl font-semibold mb-1">Xét nghiệm</h3>
                      <p className="text-sm text-white/85">Tầm soát bệnh STI chuyên sâu</p>
                    </div>
                  </AnimatedSection>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why? Section */}
      <div className="relative py-20 bg-[#2A7F9E] text-center w-screen" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
        <div className="w-full">
          <div className="px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fadeIn" duration={1}>
              <h1 className="text-3xl md:text-4xl font-bold mb-5 text-white">Tại sao chọn Gender Healthcare?</h1>
              <p className="text-lg max-w-5xl mx-auto opacity-90 text-white">
                Chúng tôi cung cấp dịch vụ chăm sóc sức khỏe giới tính toàn diện, từ tư vấn đến xét nghiệm, với đội ngũ chuyên gia giàu kinh nghiệm và trang thiết bị hiện đại.
              </p>
            </AnimatedSection>
            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-full">
              {[
                { icon: <SecuritySafe size={30} variant="Bold" className="text-amber-400" />, title: "Bảo mật thông tin", description: "Thông tin cá nhân của bạn luôn được bảo vệ nghiêm ngặt" },
                { icon: <Hospital size={30} variant="Bold" className="text-sky-400" />, title: "Chuyên gia hàng đầu", description: "Đội ngũ bác sĩ và tư vấn viên có chuyên môn cao, giàu kinh nghiệm" },
                { icon: <Clock size={30} variant="Bold" className="text-emerald-400" />, title: "Tiết kiệm thời gian", description: "Đặt lịch trực tuyến dễ dàng, không cần chờ đợi lâu" },
                { icon: <HeartAdd size={30} variant="Bold" className="text-rose-400" />, title: "Chăm sóc toàn diện", description: "Dịch vụ chăm sóc sức khỏe giới tính và sinh sản đầy đủ" },
              ].map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  animation="zoomIn"
                  delay={0.2 + index * 0.1}
                  className="transform rounded-xl bg-white/10 p-6 backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/20 hover:shadow-xl"
                  hoverEffect="tilt"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-white/20 p-4 shadow-lg mb-4">{item.icon}</div>
                    <h2 className="text-xl font-bold mb-3 text-white">{item.title}</h2>
                    <p className="text-sm text-white">{item.description}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
            <AnimatedSection animation="fadeIn" delay={0.6} className="mt-12">
              <Button
                type="link"
                onClick={() => navigate("/about-us")}
                className="text-white hover:text-cyan-300 hover:underline text-lg group"
              >
                Và thêm nhiều lý do để chọn Gender Healthcare
                <ArrowRight2 size={18} className="ml-2 inline-block transition-colors duration-300 group-hover:text-cyan-300" />
              </Button>
            </AnimatedSection>
          </div>
        </div>
      </div>
      <div className="w-screen" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
        <DividerComponent topColor="#2A7F9E" bottomColor="#0C3C54" height={120} />
      </div>
      {/* Services Section */}
      <div className="relative py-20 bg-[#0C3C54] w-screen" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
        
        <div className="w-full">
          <div className="px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="slideUp">
              <div className="text-center mb-16">
                <h1 className="text-3xl md:text-4xl font-bold mb-5 text-white">Đầy đủ dịch vụ chăm sóc sức khỏe giới tính</h1>
                <p className="text-lg max-w-5xl mx-auto opacity-90 text-white">
                  Chúng tôi cung cấp các dịch vụ toàn diện cho sức khỏe giới tính và sinh sản của bạn, từ tư vấn đến xét nghiệm chuyên sâu.
                </p>
              </div>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-full">
              {[
                { icon: <People size={32} variant="Bold" className="text-white" />, title: "Tư vấn tiền hôn nhân", description: "Tư vấn và kiểm tra sức khỏe toàn diện cho các cặp đôi chuẩn bị kết hôn.", iconBg: "bg-sky-500" },
                { icon: <ClipboardTick size={32} variant="Bold" className="text-white" />, title: "Xét nghiệm STIs", description: "Xét nghiệm các bệnh lây truyền qua đường tình dục nhanh chóng, chính xác và bảo mật.", iconBg: "bg-teal-500" },
                { icon: <Chart2 size={32} variant="Bold" className="text-white" />, title: "Theo dõi chu kỳ kinh nguyệt", description: "Công cụ theo dõi chu kỳ kinh nguyệt, dự đoán ngày rụng trứng và thời điểm dễ mang thai.", iconBg: "bg-cyan-500" },
                { icon: <MonitorMobbile size={32} variant="Bold" className="text-white" />, title: "Tư vấn trực tuyến", description: "Đặt lịch tư vấn trực tuyến với các chuyên gia về sức khỏe giới tính và sinh sản.", iconBg: "bg-sky-600" },
                { icon: <HeartTick size={32} variant="Bold" className="text-white" />, title: "Tư vấn sức khỏe sinh sản", description: "Tư vấn chuyên sâu về sức khỏe sinh sản cho cả nam và nữ giới.", iconBg: "bg-teal-600" },
                { icon: <NotificationStatus size={32} variant="Bold" className="text-white" />, title: "Nhắc nhở uống thuốc", description: "Hệ thống nhắc nhở uống thuốc thông minh theo lịch.", iconBg: "bg-cyan-600" },
              ].map((service, index) => (
                <AnimatedSection
                  key={service.title}
                  animation="zoomIn"
                  delay={0.1 * index}
                  className="bg-white/10 border border-white/20 rounded-xl backdrop-blur-md p-6 hover:bg-white/15 transition-all hover:shadow-lg group"
                  hoverEffect="tilt"
                >
                  <div className="flex flex-col items-start">
                    <div className={`rounded-full p-3 mb-4 flex items-center justify-center ${service.iconBg} transition-all group-hover:scale-110 shadow-lg`}>
                      {service.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">{service.title}</h3>
                    <p className="text-sm text-white/90">{service.description}</p>
                    <div className="mt-4 self-end">
                      <Button
                        type="text"
                        onClick={() => navigate("/services")}
                        className="text-white hover:!text-cyan-300 hover:underline flex items-center group"
                        icon={<ArrowRight2 size={18} className="ml-1 transition-colors duration-300 group-hover:text-cyan-300" />}
                      >
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full overflow-hidden" style={{ height: "60px" }}>
<svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="h-full w-full scale-y-[-1]">
  <path d="M0 51.669C240 17.223 480 17.223 720 51.669C960 86.115 1200 86.115 1440 51.669V120H0V51.669Z" fill="#0C3C54" />
</svg>

        </div>
      </div>

      <div className="w-screen" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
        <DividerComponent topColor="#0C3C54" bottomColor="#2A7F9E" height={100} />
      </div>

      {/* Images Section */}
      <div className="relative py-20 bg-[#2A7F9E]/10 text-center w-screen" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
        <div className="w-full">
          <div className="px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fadeIn" delay={0.2}>
              <h1 className="text-3xl md:text-4xl font-bold mb-10 text-white">Hình ảnh hoạt động tại Gender Healthcare</h1>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-full">
              {[Facility1, Facility2, Facility3, Facility4].map((image, index) => (
                <AnimatedSection
                  key={index}
                  animation="zoomIn"
                  delay={0.1 * index}
                  className="h-60 md:h-64 overflow-hidden rounded-xl shadow-lg duration-300 hover:-translate-y-2 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                >
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                    src={image}
                    alt={`Facility image ${index + 1}`}
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                  />
                </AnimatedSection>
              ))}
            </div>
            <AnimatedSection animation="fadeIn" delay={0.6} className="mt-10">
              <Button
                type="link"
                onClick={() => navigate("/gallery")}
                className="text-white hover:text-cyan-300 hover:underline text-lg group"
              >
                Xem thêm hình ảnh
                <ArrowRight2 size={18} className="ml-2 inline-block transition-colors duration-300 group-hover:text-cyan-300" />
              </Button>
            </AnimatedSection>
          </div>
        </div>
      </div>
      {/* Feedbacks Section */}
      <div className="relative py-20 bg-[#0C3C54] text-center w-screen" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
        <div className="w-full">
          <div className="px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fadeIn" delay={0.2}>
              <h1 className="mb-5 text-3xl md:text-4xl font-bold text-white">Được khách hàng ghi nhận</h1>
              <p className="text-lg max-w-5xl mx-auto mb-16 opacity-90 text-white">
                Sự hài lòng và tin tưởng của khách hàng là động lực để chúng tôi không ngừng phát triển
              </p>
              <div className="cursor-grabbing w-full">
                <Carousel
                  infinite={true}
                  autoPlay
                  autoPlaySpeed={3000}
                  customRightArrow={<button className="absolute right-0 p-2 text-white duration-200 ease-in hover:text-cyan-400"><ArrowRight2 /></button>}
                  customLeftArrow={<button className="absolute left-2 p-2 text-white duration-200 ease-in hover:text-cyan-400"><ArrowLeft2 /></button>}
                  className="p-1 w-full"
                  responsive={responsive}
                >
                  {[
                    {
                      rating: 5,
                      comment: "Dịch vụ tại Gender Healthcare rất chuyên nghiệp và tận tâm. Đội ngũ nhân viên thân thiện và tư vấn rất chi tiết về các vấn đề sức khỏe.",
                      serviceName: "Tư vấn sức khỏe sinh sản",
                      customerAvatar: "https://picsum.photos/200",
                      customerName: "Nguyễn Thị Hương",
                      feedbackDate: new Date("2023-05-15"),
                    },
                    {
                      rating: 5,
                      comment: "Tôi rất hài lòng với dịch vụ xét nghiệm STI tại Gender Healthcare. Kết quả nhanh chóng và chính xác, nhân viên tư vấn rất tận tình.",
                      serviceName: "Xét nghiệm STI",
                      customerAvatar: "https://picsum.photos/201",
                      customerName: "Trần Văn Nam",
                      feedbackDate: new Date("2023-06-10"),
                    },
                    {
                      rating: 4,
                      comment: "Chất lượng dịch vụ rất tốt, tôi cảm thấy yên tâm khi được tư vấn tại đây. Các bác sĩ rất chuyên nghiệp và thân thiện.",
                      serviceName: "Tư vấn tiền hôn nhân",
                      customerAvatar: "https://picsum.photos/202",
                      customerName: "Lê Thị Lan",
                      feedbackDate: new Date("2023-07-05"),
                    },
                  ].map((mockFeedback, index) => (
                    <div key={index} className="mx-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 transition-all duration-300 hover:bg-white/20">
                      <div className="flex flex-col h-full">
                        <div className="mb-6">
                          <Rate disabled defaultValue={mockFeedback.rating} />
                        </div>
                        <p className="mb-4 text-lg flex-grow text-white">{mockFeedback.comment}</p>
                        <div className="mt-auto pt-4 border-t border-white/20">
                          <div className="flex items-center justify-center gap-4">
                            <Avatar size="large" className="border-2 border-cyan-400" src={mockFeedback.customerAvatar} icon={<User className="text-white" />} />
                            <div className="text-left">
                              <h3 className="font-bold text-white">{mockFeedback.customerName}</h3>
                              <p className="text-sm text-white">{mockFeedback.feedbackDate.toLocaleDateString()}</p>
                              <p className="text-xs text-white">Dịch vụ: {mockFeedback.serviceName}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Carousel>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
      <div className="w-screen" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
        <DividerComponent topColor="#0C3C54" bottomColor="#2A7F9E" height={100} />
      </div>
      {/* Expected Section - Redesigned */}
      <div className="relative py-20 bg-[#2A7F9E] w-screen" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
        <div className="w-full">
          <div className="px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fadeIn" duration={1}>
              <h1 className="text-3xl md:text-4xl font-bold mb-5 text-white text-center">Cam kết của Gender Healthcare</h1>
              <p className="text-lg max-w-5xl mx-auto opacity-90 text-white text-center mb-16">
                Chúng tôi luôn nỗ lực mang đến dịch vụ chăm sóc sức khỏe giới tính tốt nhất cho bạn.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {[
                { icon: <Award size={40} variant="Bulk" className="text-cyan-400" />, title: "Chuyên môn", description: "Đội ngũ y bác sĩ và tư vấn viên được đào tạo chuyên sâu, có nhiều năm kinh nghiệm trong lĩnh vực sức khỏe giới tính và sinh sản." },
                { icon: <SecuritySafe size={40} variant="Bulk" className="text-sky-400" />, title: "Riêng tư", description: "Chúng tôi tôn trọng quyền riêng tư của bạn. Mọi thông tin cá nhân và kết quả xét nghiệm đều được bảo mật tuyệt đối." },
                { icon: <HeartAdd size={40} variant="Bulk" className="text-teal-400" />, title: "Tận tâm", description: "Chúng tôi luôn đặt sức khỏe và nhu cầu của khách hàng lên hàng đầu, đảm bảo mang đến dịch vụ tốt nhất với thái độ tận tâm." },
              ].map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  animation="zoomIn"
                  delay={0.1 * index}
                  className="bg-sky-800/60 p-8 rounded-xl shadow-xl backdrop-blur-md border border-sky-700/50 text-center hover:bg-sky-700/70 transition-all duration-300 group"
                  hoverEffect="tilt"
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 shadow-lg group-hover:bg-white/20 transition-colors duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{item.title}</h3>
                  <p className="leading-relaxed text-white/90 text-sm">{item.description}</p>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection animation="fadeIn" duration={0.8} delay={0.5}>
              {/* Flex container for two columns */}
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mt-12 lg:mt-16">
                {/* Left Column: Text */}
                <div className="lg:w-1/2 text-left">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                    Không Gian Hiện Đại & Chăm Sóc Tận Tâm
                  </h2>
                  <p className="text-white/90 leading-relaxed text-base md:text-lg">
                    Tại Gender Healthcare, chúng tôi tự hào mang đến một không gian y tế được thiết kế hiện đại, 
                    thân thiện và đảm bảo sự riêng tư tuyệt đối. Kết hợp với trang thiết bị tiên tiến 
                    và đội ngũ chuyên gia tận tâm, mỗi trải nghiệm của bạn đều được chúng tôi chăm chút kỹ lưỡng, 
                    hướng đến sức khỏe và sự thoải mái toàn diện.
                  </p>
                  {/* Optional: You can add a button here if needed */}
                  {/* <Button type="primary" size="large" className="mt-8">Tìm hiểu thêm</Button> */}
                </div>

                {/* Right Column: Image */}
                <div className="lg:w-1/2 w-full">
                  <div className="relative">
                    <div className="absolute -inset-2 md:-inset-3 bg-cyan-500/25 blur-xl md:blur-2xl rounded-2xl opacity-70 transition-all duration-500 group-hover:opacity-100"></div>
                    <img
                      className="relative w-full h-auto rounded-2xl shadow-2xl transition-all duration-500 hover:scale-105"
                      src={HealthBanner}
                      alt="Không gian hiện đại và chăm sóc tận tâm tại Gender Healthcare"
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                    />
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-screen" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
        <DividerComponent topColor="#2A7F9E" bottomColor="#0E324F" height={120} />
      </div>
    </div>
  );
};

export default Home;