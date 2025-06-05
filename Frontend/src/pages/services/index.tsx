import { Button, Card, Input, Modal, Rate, Select, Spin } from "antd";
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
  description: string;
  shortDescription: string;
  image: string;
  price: {
    online: number;
    offline: number;
    home?: number;
  };
  duration: string;
  category: string;
  features: string[];
  benefits: string[];
  availableAt: string[];
  rating: number;
  reviewCount: number;
  isPopular: boolean;
  isNew?: boolean;
  icon: React.ReactNode;
  gradient: string;
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
      description: "Dịch vụ tư vấn toàn diện về sức khỏe sinh sản cho mọi giới tính, bao gồm tư vấn về sức khỏe tình dục, kế hoạch hóa gia đình, và các vấn đề liên quan đến sức khỏe giới tính.",
      shortDescription: "Tư vấn chuyên sâu về sức khỏe sinh sản cho mọi giới tính",
      image: Image1,
      price: { online: 300000, offline: 500000, home: 800000 },
      duration: "45-60 phút",
      category: "consultation",
      features: [
        "Tư vấn 1:1 với bác sĩ chuyên khoa",
        "Đánh giá tình trạng sức khỏe tổng quát",
        "Lập kế hoạch chăm sóc cá nhân",
        "Tư vấn về phương pháp tránh thai",
        "Hỗ trợ tâm lý và giải đáp thắc mắc",
      ],
      benefits: [
        "Được tư vấn bởi chuyên gia hàng đầu",
        "Môi trường riêng tư và thoải mái",
        "Kế hoạch chăm sóc cá nhân hóa",
        "Hỗ trợ 24/7 sau tư vấn",
      ],
      availableAt: ["Online", "Tại phòng khám", "Tại nhà"],
      rating: 4.8,
      reviewCount: 245,
      isPopular: true,
      icon: <Heart size={32} variant="Bold" />,
      gradient: "from-pink-500 via-rose-500 to-red-500",
    },
    {
      id: 2,
      name: "Xét nghiệm STI/STD",
      description: "Gói xét nghiệm toàn diện các bệnh lây truyền qua đường tình dục cho mọi giới tính, bao gồm HIV, Giang mai, Lậu, Chlamydia và các STI khác với công nghệ hiện đại.",
      shortDescription: "Xét nghiệm toàn diện các bệnh lây truyền qua đường tình dục",
      image: Image2,
      price: { online: 0, offline: 1200000, home: 1500000 },
      duration: "30-45 phút",
      category: "testing",
      features: [
        "Xét nghiệm 12 loại STI phổ biến",
        "Công nghệ PCR hiện đại",
        "Kết quả trong 24-48 giờ",
        "Tư vấn kết quả miễn phí",
        "Bảo mật tuyệt đối",
      ],
      benefits: [
        "Phát hiện sớm các bệnh lý",
        "Điều trị kịp thời và hiệu quả",
        "Bảo vệ sức khỏe bản thân và người thân",
        "An tâm trong các mối quan hệ",
      ],
      availableAt: ["Tại phòng khám", "Tại nhà"],
      rating: 4.9,
      reviewCount: 189,
      isPopular: true,
      isNew: true,
      icon: <Activity size={32} variant="Bold" />,
      gradient: "from-blue-500 via-teal-500 to-cyan-500",
    },
    {
      id: 3,
      name: "Tư vấn Sức khỏe Giới tính",
      description: "Dịch vụ tư vấn chuyên sâu về sức khỏe giới tính cho LGBT+ và mọi nhóm đối tượng, bao gồm tư vấn về định danh giới tính và các vấn đề liên quan.",
      shortDescription: "Tư vấn toàn diện về sức khỏe giới tính cho mọi nhóm đối tượng",
      image: Image3,
      price: { online: 400000, offline: 600000, home: 900000 },
      duration: "60-90 phút",
      category: "consultation",
      features: [
        "Tư vấn về định danh giới tính",
        "Hỗ trợ quá trình chuyển đổi giới tính",
        "Tư vấn tâm lý chuyên sâu",
        "Kế hoạch chăm sóc dài hạn",
        "Hỗ trợ gia đình và người thân",
      ],
      benefits: [
        "Môi trường an toàn và thấu hiểu",
        "Chuyên gia có kinh nghiệm về LGBT+",
        "Kế hoạch hỗ trợ toàn diện",
        "Bảo mật thông tin tuyệt đối",
      ],
      availableAt: ["Online", "Tại phòng khám", "Tại nhà"],
      rating: 4.7,
      reviewCount: 156,
      isPopular: false,
      icon: <People size={32} variant="Bold" />,
      gradient: "from-purple-500 via-indigo-500 to-blue-500",
    },
    {
      id: 4,
      name: "Theo dõi Sức khỏe Tình dục",
      description: "Dịch vụ theo dõi và tư vấn về sức khỏe tình dục cho mọi giới tính, giúp mọi người hiểu rõ hơn về cơ thể và phát hiện sớm các bất thường.",
      shortDescription: "Theo dõi và tư vấn sức khỏe tình dục chuyên nghiệp",
      image: Image4,
      price: { online: 250000, offline: 400000 },
      duration: "30-45 phút",
      category: "monitoring",
      features: [
        "Theo dõi sức khỏe tình dục",
        "Phân tích các triệu chứng",
        "Tư vấn về rối loạn chức năng",
        "Ứng dụng theo dõi miễn phí",
        "Nhắc nhở chăm sóc định kỳ",
      ],
      benefits: [
        "Phát hiện sớm vấn đề sức khỏe",
        "Cải thiện chất lượng cuộc sống",
        "Tăng cường tự tin",
        "Kiến thức chăm sóc bản thân",
      ],
      availableAt: ["Online", "Tại phòng khám"],
      rating: 4.6,
      reviewCount: 198,
      isPopular: false,
      icon: <MonitorMobbile size={32} variant="Bold" />,
      gradient: "from-green-500 via-emerald-500 to-teal-500",
    },
  ];

  const categories = [
    { value: "all", label: "Tất cả dịch vụ" },
    { value: "consultation", label: "Tư vấn" },
    { value: "testing", label: "Xét nghiệm" },
    { value: "monitoring", label: "Theo dõi" },
  ];

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.rating - a.rating;
      case "rating":
        return b.rating - a.rating;
      case "price":
        return (a.price.online || a.price.offline) - (b.price.online || b.price.offline);
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
      {/* Fixed Header Padding */}
      <div className="pt-20"></div>

      {/* Hero Section */}
      <div className="relative min-h-[60vh] bg-gradient-to-br from-[#0C3C54] via-[#2A7F9E] to-sky-400">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('../../assets/images/pattern.png')] bg-repeat"></div>
        </div>
        
        {/* Floating Elements */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/20"
            animate={{
              x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
              y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <AnimatedSection animation="fadeIn">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                  Dịch vụ Sức khỏe 
                  <span className="block bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">
                    Giới tính Toàn diện
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                  Chăm sóc sức khỏe giới tính cho mọi người - An toàn, Chuyên nghiệp, Bảo mật
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="large"
                    type="primary"
                    onClick={() => navigate('/booking')}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 border-none rounded-full px-8 py-3 h-auto text-lg font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    Đặt lịch ngay
                    <Calendar size={20} className="ml-2" />
                  </Button>
                  <Button
                    size="large"
                    ghost
                    onClick={() => window.open('tel:+84888888888')}
                    className="border-2 border-white text-white rounded-full px-8 py-3 h-auto text-lg font-semibold hover:bg-white hover:text-[#0C3C54] transition-all duration-300"
                  >
                    Tư vấn miễn phí
                    <Call size={20} className="ml-2" />
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
                    className="h-full rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
                    cover={
                      <div className="relative overflow-hidden h-48">
                        <img
                          src={service.image}
                          alt={service.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t ${service.gradient} opacity-60`}></div>
                        <div className="absolute top-4 left-4">
                          <div className={`p-2 rounded-xl bg-gradient-to-r ${service.gradient} text-white shadow-lg`}>
                            {service.icon}
                          </div>
                        </div>
                        {service.isNew && (
                          <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            MỚI
                          </div>
                        )}
                        {service.isPopular && (
                          <div className="absolute top-4 right-4 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            PHỔ BIẾN
                          </div>
                        )}
                      </div>
                    }
                    onClick={() => handleServiceClick(service)}
                  >
                    <div className="p-2">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                        {service.name}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {service.shortDescription}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Rate disabled defaultValue={service.rating} className="text-sm" />
                          <span className="ml-2 text-gray-500 text-sm">
                            ({service.reviewCount})
                          </span>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Clock size={16} className="mr-1" />
                          {service.duration}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Online:</span>
                          <span className="font-semibold text-green-600">
                            {service.price.online ? formatPrice(service.price.online) : 'Không có'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Tại phòng khám:</span>
                          <span className="font-semibold text-blue-600">
                            {formatPrice(service.price.offline)}
                          </span>
                        </div>
                      </div>

                      <Button
                        type="primary"
                        block
                        size="large"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookService(service);
                        }}
                        className={`bg-gradient-to-r ${service.gradient} border-none rounded-xl font-semibold hover:scale-105 transition-all duration-300`}
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
      <Modal
        title={null}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        className="service-modal"
      >
        {selectedService && (
          <div className="p-6">
            <div className="flex items-start gap-6 mb-6">
              <div className={`p-4 rounded-2xl bg-gradient-to-r ${selectedService.gradient} text-white`}>
                {selectedService.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedService.name}
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  <Rate disabled defaultValue={selectedService.rating} />
                  <span className="text-gray-500">
                    ({selectedService.reviewCount} đánh giá)
                  </span>
                  <div className="flex items-center text-gray-500">
                    <Clock size={16} className="mr-1" />
                    {selectedService.duration}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Mô tả chi tiết</h3>
              <p className="text-gray-600 leading-relaxed">
                {selectedService.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Tính năng</h3>
                <ul className="space-y-2">
                  {selectedService.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <TickCircle size={16} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Lợi ích</h3>
                <ul className="space-y-2">
                  {selectedService.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <Star1 size={16} className="text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-gray-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Hình thức dịch vụ</h3>
              <div className="flex flex-wrap gap-2">
                {selectedService.availableAt.map((type, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3">Bảng giá</h3>
              <div className="space-y-2">
                {selectedService.price.online > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tư vấn online:</span>
                    <span className="font-semibold text-green-600">
                      {formatPrice(selectedService.price.online)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tại phòng khám:</span>
                  <span className="font-semibold text-blue-600">
                    {formatPrice(selectedService.price.offline)}
                  </span>
                </div>
                {selectedService.price.home && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tại nhà:</span>
                    <span className="font-semibold text-purple-600">
                      {formatPrice(selectedService.price.home)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  setIsModalVisible(false);
                  handleBookService(selectedService);
                }}
                className={`flex-1 bg-gradient-to-r ${selectedService.gradient} border-none rounded-xl font-semibold`}
              >
                Đặt lịch ngay
              </Button>
              <Button
                size="large"
                onClick={() => window.open('tel:+84888888888')}
                className="px-8 rounded-xl"
              >
                Gọi tư vấn
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Services;