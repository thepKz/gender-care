import { Button, Card, Input, Rate, Select, Spin } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Award,
  Calendar,
  Call,
  Clock,
  Heart,
  MonitorMobbile,
  People,
  SearchNormal1,
  Shield,
  Star1,
  TickCircle
} from "iconsax-react";
import { Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Image1 from "../../assets/images/image1.jpg";
import Image2 from "../../assets/images/image2.jpg";
import Image3 from "../../assets/images/image3.jpg";
import Image4 from "../../assets/images/image4.jpg";
import { AnimatedSection } from "../../share";

const { Search } = Input;
const { Option } = Select;

interface Service {
  id: number;
  name: string;
  image: string;
  price: number;
  rating: number;
  reviewCount: number;
  icon: React.ReactNode;
  description: string;
  highlights: string[];
}

function CustomModal({ open, onClose, children }: { open: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Modal content */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 p-8 animate-fadeInUp" style={{ zIndex: 10 }}>
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Đóng"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

const Services = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular");

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const services: Service[] = [
    {
      id: 1,
      name: "Tư vấn Sức khỏe Sinh sản",
      image: Image1,
      price: 500000,
      rating: 4.8,
      reviewCount: 245,
      icon: <Heart size={32} variant="Bold" color="#0C3C54" />,
      description: "Dịch vụ tư vấn toàn diện về sức khỏe sinh sản cho mọi giới tính, bao gồm tư vấn về sức khỏe tình dục, kế hoạch hóa gia đình, và các vấn đề liên quan đến sức khỏe giới tính.",
      highlights: [
        "Tư vấn 1:1 với bác sĩ chuyên khoa",
        "Đánh giá tình trạng sức khỏe tổng quát",
        "Lập kế hoạch chăm sóc cá nhân",
        "Tư vấn về phương pháp tránh thai",
        "Hỗ trợ tâm lý và giải đáp thắc mắc"
      ]
    },
    {
      id: 2,
      name: "Xét nghiệm STI/STD",
      image: Image2,
      price: 1200000,
      rating: 4.9,
      reviewCount: 189,
      icon: <Activity size={32} variant="Bold" color="#0C3C54" />,
      description: "Gói xét nghiệm toàn diện các bệnh lây truyền qua đường tình dục cho mọi giới tính, bao gồm HIV, Giang mai, Lậu, Chlamydia và các STI khác với công nghệ hiện đại.",
      highlights: [
        "Xét nghiệm 12 loại STI phổ biến",
        "Công nghệ PCR hiện đại",
        "Kết quả trong 24-48 giờ",
        "Tư vấn kết quả miễn phí",
        "Bảo mật tuyệt đối"
      ]
    },
    {
      id: 3,
      name: "Tư vấn Sức khỏe Giới tính",
      image: Image3,
      price: 600000,
      rating: 4.7,
      reviewCount: 156,
      icon: <People size={32} variant="Bold" color="#0C3C54" />,
      description: "Dịch vụ tư vấn chuyên sâu về sức khỏe giới tính cho LGBT+ và mọi nhóm đối tượng, bao gồm tư vấn về định danh giới tính và các vấn đề liên quan.",
      highlights: [
        "Tư vấn về định danh giới tính",
        "Hỗ trợ quá trình chuyển đổi giới tính",
        "Tư vấn tâm lý chuyên sâu",
        "Kế hoạch chăm sóc dài hạn",
        "Hỗ trợ gia đình và người thân"
      ]
    },
    {
      id: 4,
      name: "Theo dõi Sức khỏe Tình dục",
      image: Image4,
      price: 400000,
      rating: 4.6,
      reviewCount: 198,
      icon: <MonitorMobbile size={32} variant="Bold" color="#0C3C54" />,
      description: "Dịch vụ theo dõi và tư vấn về sức khỏe tình dục cho mọi giới tính, giúp mọi người hiểu rõ hơn về cơ thể và phát hiện sớm các bất thường.",
      highlights: [
        "Theo dõi sức khỏe tình dục",
        "Phân tích các triệu chứng",
        "Tư vấn về rối loạn chức năng",
        "Ứng dụng theo dõi miễn phí",
        "Nhắc nhở chăm sóc định kỳ"
      ]
    },
  ];

  const categories = [
    { value: "all", label: "Tất cả dịch vụ" },
    { value: "consultation", label: "Tư vấn" },
    { value: "testing", label: "Xét nghiệm" },
    { value: "monitoring", label: "Theo dõi" },
  ];

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === "all" || service.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.rating - a.rating;
      case "rating":
        return b.rating - a.rating;
      case "price":
        return (a.price) - (b.price);
      default:
        return 0;
    }
  });

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setIsModalVisible(true);
  };

  const handleBookService = (service: Service) => {
    navigate('/booking', { state: { selectedService: service } });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-hidden">

      {/* Hero Section */}
      <div className="relative min-h-[60vh] overflow-hidden">
        {/* Nền gradient + overlay pattern + floating dots */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E] opacity-90"></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('../../assets/images/pattern.png')] opacity-10"></div>
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white/20"
              animate={{
                x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
                y: [Math.random() * 400, Math.random() * 400],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <AnimatedSection animation="fadeIn">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                  Dịch vụ Sức khỏe <br />
                  <span className="block text-white font-bold">
                    Giới tính Toàn diện
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-white mb-8 leading-relaxed">
                  Chăm sóc sức khỏe giới tính cho mọi người - An toàn, Chuyên nghiệp, Bảo mật
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="large"
                    type="primary"
                    onClick={() => navigate('/booking')}
                    className="bg-[#0C3C54] border border-[#0C3C54] text-white rounded-full px-8 py-3 h-auto text-lg font-semibold hover:bg-[#17688a] hover:border-[#17688a] transition-all duration-300 shadow-none"
                  >
                    Đặt lịch ngay
                    <Calendar size={20} className="ml-2" color="white" />
                  </Button>
                  <Button
                    size="large"
                    ghost
                    onClick={() => window.open('tel:+84888888888')}
                    className="border-2 border-[#0C3C54] text-[#0C3C54] rounded-full px-8 py-3 h-auto text-lg font-semibold hover:bg-[#0C3C54] hover:text-white hover:border-[#17688a] transition-all duration-300"
                  >
                    Tư vấn miễn phí
                    <Call size={20} className="ml-2" color="#0C3C54" />
                  </Button>
                </div>
              </motion.div>
            </AnimatedSection>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <AnimatedSection animation="fadeIn">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Dịch vụ Chăm sóc Sức khỏe
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Chúng tôi cung cấp các dịch vụ chăm sóc sức khỏe giới tính toàn diện cho mọi người, 
                đảm bảo môi trường an toàn và chuyên nghiệp.
              </p>
            </div>
          </AnimatedSection>

          {/* Search and Filter */}
          <AnimatedSection animation="slideUp" delay={0.2}>
            <div className="flex flex-col lg:flex-row gap-4 mb-12 bg-white p-6 rounded-2xl shadow-lg">
              <Search
                placeholder="Tìm kiếm dịch vụ..."
                allowClear
                size="large"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
                prefix={<SearchNormal1 size={20} />}
              />
              <Select
                size="large"
                value={selectedCategory}
                onChange={setSelectedCategory}
                className="w-full lg:w-48"
              >
                {categories.map(cat => (
                  <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                ))}
              </Select>
              <Select
                size="large"
                value={sortBy}
                onChange={setSortBy}
                className="w-full lg:w-48"
              >
                <Option value="popular">Phổ biến nhất</Option>
                <Option value="rating">Đánh giá cao</Option>
                <Option value="price">Giá tăng dần</Option>
              </Select>
            </div>
          </AnimatedSection>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence>
              {sortedServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group"
                >
                  <Card
                    hoverable
                    className="h-full rounded-2xl border border-gray-200 shadow-sm transition-all duration-300 overflow-hidden bg-white"
                    cover={
                      <div className="relative overflow-hidden h-48 flex items-center justify-center bg-gray-50">
                        <img
                          src={service.image}
                          alt={service.name}
                          className="w-full h-full object-cover opacity-90"
                        />
                        <div className="absolute top-4 left-4">
                          <div className="p-2 rounded-full bg-white border border-[#0C3C54] text-[#0C3C54] shadow-sm">
                            {service.icon}
                          </div>
                        </div>
                      </div>
                    }
                    onClick={() => handleServiceClick(service)}
                  >
                    <div className="p-2">
                      <h3 className="text-xl font-bold text-[#0C3C54] mb-2 line-clamp-1">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Rate disabled defaultValue={service.rating} className="text-sm" style={{ color: '#faad14' }} />
                        <span className="text-gray-500 text-sm">({service.reviewCount})</span>
                      </div>
                      <div className="text-lg font-semibold text-[#0C3C54] mb-2">
                        {formatPrice(service.price)}
                      </div>
                      <Button
                        type="primary"
                        block
                        size="large"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookService(service);
                        }}
                        className="bg-[#0C3C54] border border-[#0C3C54] text-white rounded-xl font-semibold hover:bg-[#17688a] hover:border-[#17688a] transition-all duration-300 mt-2"
                      >
                        Đặt lịch ngay
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fadeIn">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Tại sao chọn chúng tôi?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Chúng tôi cam kết mang đến dịch vụ chăm sóc sức khỏe giới tính tốt nhất 
                với sự tôn trọng và hiểu biết về mọi nhóm đối tượng.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield size={40} className="text-blue-500" />,
                title: "Bảo mật tuyệt đối",
                description: "Thông tin cá nhân được bảo vệ nghiêm ngặt theo tiêu chuẩn quốc tế"
              },
              {
                icon: <Award size={40} className="text-green-500" />,
                title: "Chuyên gia hàng đầu",
                description: "Đội ngũ bác sĩ và tư vấn viên có kinh nghiệm lâu năm"
              },
              {
                icon: <People size={40} className="text-purple-500" />,
                title: "Phù hợp mọi người",
                description: "Dịch vụ toàn diện cho mọi giới tính và nhóm đối tượng"
              },
              {
                icon: <TickCircle size={40} className="text-red-500" />,
                title: "Chất lượng đảm bảo",
                description: "Cam kết chất lượng dịch vụ và sự hài lòng của khách hàng"
              }
            ].map((item, index) => (
              <AnimatedSection key={index} animation="slideUp" delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300"
                >
                  <div className="mb-4 flex justify-center">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fadeIn">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Sẵn sàng bắt đầu hành trình chăm sóc sức khỏe?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Liên hệ với chúng tôi ngay hôm nay để được tư vấn miễn phí
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="large"
                type="primary"
                onClick={() => navigate('/booking')}
                className="bg-white text-[#0C3C54] border-none rounded-full px-8 py-3 h-auto text-lg font-semibold hover:scale-105 transition-all duration-300"
              >
                Đặt lịch tư vấn
                <Calendar size={20} className="ml-2" />
              </Button>
              <Button
                size="large"
                ghost
                onClick={() => window.open('tel:+84888888888')}
                className="border-2 border-white text-white rounded-full px-8 py-3 h-auto text-lg font-semibold hover:bg-white hover:text-[#0C3C54] transition-all duration-300"
              >
                Gọi ngay: 088 888 8888
                <Phone size={20} className="ml-2" />
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Service Detail Modal */}
      <CustomModal open={isModalVisible} onClose={() => setIsModalVisible(false)}>
        {selectedService && (
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-shrink-0 flex items-center justify-center w-28 h-28 rounded-full border-2 border-[#0C3C54] text-[#0C3C54] bg-white">
              {selectedService.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#0C3C54] mb-2">
                {selectedService.name}
              </h2>
              <div className="flex items-center gap-4 mb-2">
                <Rate disabled defaultValue={selectedService.rating} className="text-[#faad14]" />
                <span className="text-gray-500">({selectedService.reviewCount} đánh giá)</span>
              </div>
              <div className="text-lg font-semibold text-[#0C3C54] mb-4">
                {formatPrice(selectedService.price)}
              </div>
              <div className="mb-4">
                <h3 className="text-base font-semibold mb-1 text-[#0C3C54]">Mô tả dịch vụ</h3>
                <p className="text-gray-700 leading-relaxed">{selectedService.description}</p>
              </div>
              <div className="mb-6">
                <h3 className="text-base font-semibold mb-1 text-[#0C3C54]">Điểm nổi bật</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {selectedService.highlights.map((item, idx) => (
                    <li key={idx} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  setIsModalVisible(false);
                  handleBookService(selectedService);
                }}
                className="bg-[#0C3C54] border border-[#0C3C54] text-white rounded-xl font-semibold hover:bg-[#17688a] hover:border-[#17688a] transition-all duration-300 px-8"
              >
                Đặt lịch ngay
              </Button>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
};

export default Services;