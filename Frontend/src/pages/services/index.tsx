import { Badge, Button, Input, Modal, Rate, Select, Spin } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    ArrowRight,
    Award,
    Calendar,
    Call,
    Clock,
    DocumentText,
    Heart,
    Home,
    Location,
    MonitorMobbile,
    People,
    SearchNormal1,
    Shield,
    Sort,
    Star1,
    TickCircle,
    VideoPlay
} from "iconsax-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Image1 from "../../assets/images/image1.jpg";
import Image2 from "../../assets/images/image2.jpg";
import Image3 from "../../assets/images/image3.jpg";
import Image4 from "../../assets/images/image4.jpg";
import Image5 from "../../assets/images/image5.jpg";
import Image6 from "../../assets/images/image6.jpg";
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

interface ServicePackage {
  id: number;
  name: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  services: string[];
  duration: string;
  isRecommended: boolean;
  features: string[];
  gradient: string;
}

interface Testimonial {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  service: string;
  date: string;
}

const Services = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Enhanced services data với gradient và styling mới
  const services: Service[] = [
    {
      id: 1,
      name: "Tư vấn sức khỏe sinh sản",
      description: "Dịch vụ tư vấn toàn diện về sức khỏe sinh sản cho nam và nữ, bao gồm tư vấn về chu kỳ kinh nguyệt, kế hoạch hóa gia đình, và các vấn đề liên quan đến sức khỏe tình dục.",
      shortDescription: "Tư vấn chuyên sâu về sức khỏe sinh sản và tình dục",
      image: Image1,
      price: {
        online: 300000,
        offline: 500000,
        home: 800000
      },
      duration: "45-60 phút",
      category: "consultation",
      features: [
        "Tư vấn 1:1 với bác sĩ chuyên khoa",
        "Đánh giá tình trạng sức khỏe tổng quát",
        "Lập kế hoạch chăm sóc cá nhân",
        "Tư vấn về phương pháp tránh thai",
        "Hỗ trợ tâm lý và giải đáp thắc mắc"
      ],
      benefits: [
        "Được tư vấn bởi chuyên gia hàng đầu",
        "Môi trường riêng tư và thoải mái",
        "Kế hoạch chăm sóc cá nhân hóa",
        "Hỗ trợ 24/7 sau tư vấn"
      ],
      availableAt: ["Online", "Tại phòng khám", "Tại nhà"],
      rating: 4.8,
      reviewCount: 245,
      isPopular: true,
      icon: <People size={32} variant="Bold" />,
      gradient: "from-blue-500 via-purple-500 to-pink-500"
    },
    {
      id: 2,
      name: "Xét nghiệm STI/STD",
      description: "Gói xét nghiệm toàn diện các bệnh lây truyền qua đường tình dục, bao gồm HIV, Giang mai, Lậu, Chlamydia và các STI khác với công nghệ hiện đại và kết quả chính xác.",
      shortDescription: "Xét nghiệm toàn diện các bệnh lây truyền qua đường tình dục",
      image: Image2,
      price: {
        online: 0,
        offline: 1200000,
        home: 1500000
      },
      duration: "30-45 phút",
      category: "testing",
      features: [
        "Xét nghiệm 12 loại STI phổ biến",
        "Công nghệ PCR hiện đại",
        "Kết quả trong 24-48 giờ",
        "Tư vấn kết quả miễn phí",
        "Bảo mật tuyệt đối"
      ],
      benefits: [
        "Phát hiện sớm các bệnh lý",
        "Điều trị kịp thời và hiệu quả",
        "Bảo vệ sức khỏe bản thân và người thân",
        "An tâm trong các mối quan hệ"
      ],
      availableAt: ["Tại phòng khám", "Tại nhà"],
      rating: 4.9,
      reviewCount: 189,
      isPopular: true,
      isNew: true,
      icon: <Activity size={32} variant="Bold" />,
      gradient: "from-green-500 via-teal-500 to-blue-500"
    },
    {
      id: 3,
      name: "Tư vấn tiền hôn nhân",
      description: "Dịch vụ tư vấn chuyên sâu cho các cặp đôi chuẩn bị kết hôn, bao gồm khám sức khỏe, tư vấn tâm lý và chuẩn bị cho cuộc sống hôn nhân.",
      shortDescription: "Tư vấn toàn diện cho các cặp đôi chuẩn bị kết hôn",
      image: Image3,
      price: {
        online: 400000,
        offline: 600000,
        home: 900000
      },
      duration: "60-90 phút",
      category: "consultation",
      features: [
        "Khám sức khỏe tổng quát",
        "Tư vấn tâm lý hôn nhân",
        "Kế hoạch hóa gia đình",
        "Tư vấn dinh dưỡng",
        "Hướng dẫn chuẩn bị mang thai"
      ],
      benefits: [
        "Chuẩn bị tốt nhất cho hôn nhân",
        "Phát hiện sớm các vấn đề sức khỏe",
        "Tăng cường hiểu biết lẫn nhau",
        "Kế hoạch tương lai rõ ràng"
      ],
      availableAt: ["Online", "Tại phòng khám", "Tại nhà"],
      rating: 4.7,
      reviewCount: 156,
      isPopular: false,
      icon: <Heart size={32} variant="Bold" />,
      gradient: "from-pink-500 via-rose-500 to-red-500"
    },
    {
      id: 4,
      name: "Theo dõi chu kỳ kinh nguyệt",
      description: "Dịch vụ theo dõi và tư vấn về chu kỳ kinh nguyệt, giúp phụ nữ hiểu rõ hơn về cơ thể và phát hiện sớm các bất thường.",
      shortDescription: "Theo dõi và tư vấn chu kỳ kinh nguyệt chuyên nghiệp",
      image: Image4,
      price: {
        online: 250000,
        offline: 400000
      },
      duration: "30-45 phút",
      category: "monitoring",
      features: [
        "Theo dõi chu kỳ chi tiết",
        "Phân tích các triệu chứng",
        "Dự đoán chu kỳ tiếp theo",
        "Tư vấn về rối loạn kinh nguyệt",
        "Ứng dụng theo dõi miễn phí"
      ],
      benefits: [
        "Hiểu rõ hơn về cơ thể",
        "Phát hiện sớm bất thường",
        "Kế hoạch sinh hoạt hiệu quả",
        "Cải thiện chất lượng cuộc sống"
      ],
      availableAt: ["Online", "Tại phòng khám"],
      rating: 4.6,
      reviewCount: 203,
      isPopular: false,
      icon: <Calendar size={32} variant="Bold" />,
      gradient: "from-purple-500 via-indigo-500 to-blue-500"
    },
    {
      id: 5,
      name: "Tư vấn tâm lý tình dục",
      description: "Dịch vụ tư vấn tâm lý chuyên sâu về các vấn đề tình dục, giúp giải quyết các rối loạn chức năng tình dục và cải thiện chất lượng cuộc sống tình dục.",
      shortDescription: "Tư vấn tâm lý về các vấn đề tình dục",
      image: Image5,
      price: {
        online: 350000,
        offline: 550000,
        home: 850000
      },
      duration: "60 phút",
      category: "consultation",
      features: [
        "Tư vấn tâm lý chuyên sâu",
        "Điều trị rối loạn chức năng tình dục",
        "Liệu pháp cặp đôi",
        "Kỹ thuật thư giãn và mindfulness",
        "Kế hoạch điều trị cá nhân hóa"
      ],
      benefits: [
        "Cải thiện chất lượng cuộc sống tình dục",
        "Tăng cường sự tự tin",
        "Mối quan hệ hài hòa hơn",
        "Giảm stress và lo âu"
      ],
      availableAt: ["Online", "Tại phòng khám", "Tại nhà"],
      rating: 4.8,
      reviewCount: 127,
      isPopular: false,
      icon: <Shield size={32} variant="Bold" />,
      gradient: "from-orange-500 via-amber-500 to-yellow-500"
    },
    {
      id: 6,
      name: "Chăm sóc sức khỏe tại nhà",
      description: "Dịch vụ chăm sóc sức khỏe tại nhà với đội ngũ y tá và bác sĩ chuyên nghiệp, mang đến sự tiện lợi và an toàn cho khách hàng.",
      shortDescription: "Dịch vụ chăm sóc sức khỏe tận nhà chuyên nghiệp",
      image: Image6,
      price: {
        online: 0,
        offline: 0,
        home: 1000000
      },
      duration: "60-120 phút",
      category: "homecare",
      features: [
        "Khám sức khỏe tại nhà",
        "Lấy mẫu xét nghiệm",
        "Tư vấn và điều trị",
        "Theo dõi sức khỏe định kỳ",
        "Báo cáo chi tiết"
      ],
      benefits: [
        "Tiết kiệm thời gian di chuyển",
        "Môi trường quen thuộc và thoải mái",
        "Dịch vụ cá nhân hóa",
        "An toàn và riêng tư"
      ],
      availableAt: ["Tại nhà"],
      rating: 4.9,
      reviewCount: 98,
      isPopular: true,
      isNew: true,
      icon: <Home size={32} variant="Bold" />,
      gradient: "from-emerald-500 via-green-500 to-teal-500"
    }
  ];

  // Service packages data
  const servicePackages: ServicePackage[] = [
    {
      id: 1,
      name: "Gói Chăm sóc Toàn diện",
      description: "Gói dịch vụ hoàn chỉnh bao gồm tư vấn, xét nghiệm và theo dõi sức khỏe",
      originalPrice: 2500000,
      discountPrice: 1999000,
      services: ["Tư vấn sức khỏe sinh sản", "Xét nghiệm STI/STD", "Theo dõi chu kỳ kinh nguyệt"],
      duration: "3 tháng",
      isRecommended: true,
      features: [
        "3 buổi tư vấn trực tiếp",
        "Xét nghiệm STI đầy đủ",
        "Ứng dụng theo dõi premium",
        "Hỗ trợ 24/7",
        "Báo cáo sức khỏe chi tiết"
      ],
      gradient: "from-blue-600 via-purple-600 to-pink-600"
    },
    {
      id: 2,
      name: "Gói Cặp đôi Hạnh phúc",
      description: "Dành cho các cặp đôi muốn chuẩn bị tốt nhất cho hôn nhân",
      originalPrice: 1800000,
      discountPrice: 1499000,
      services: ["Tư vấn tiền hôn nhân", "Tư vấn tâm lý tình dục", "Khám sức khỏe"],
      duration: "2 tháng",
      isRecommended: false,
      features: [
        "Tư vấn cho cả hai người",
        "Khám sức khỏe toàn diện",
        "Liệu pháp cặp đôi",
        "Kế hoạch chuẩn bị mang thai",
        "Theo dõi sau tư vấn"
      ],
      gradient: "from-pink-600 via-rose-600 to-red-600"
    },
    {
      id: 3,
      name: "Gói Chăm sóc Tại nhà",
      description: "Dịch vụ chăm sóc sức khỏe tận nơi với sự tiện lợi tối đa",
      originalPrice: 3000000,
      discountPrice: 2499000,
      services: ["Chăm sóc sức khỏe tại nhà", "Xét nghiệm tại nhà", "Tư vấn online"],
      duration: "1 tháng",
      isRecommended: false,
      features: [
        "4 lần thăm khám tại nhà",
        "Xét nghiệm tại chỗ",
        "Tư vấn online không giới hạn",
        "Báo cáo sức khỏe định kỳ",
        "Hỗ trợ khẩn cấp 24/7"
      ],
      gradient: "from-emerald-600 via-green-600 to-teal-600"
    }
  ];

  // Testimonials data
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Nguyễn Thị Lan",
      avatar: Image1,
      rating: 5,
      comment: "Dịch vụ tư vấn rất chuyên nghiệp và tận tâm. Tôi cảm thấy an tâm và được hỗ trợ tốt nhất.",
      service: "Tư vấn sức khỏe sinh sản",
      date: "2024-01-15"
    },
    {
      id: 2,
      name: "Trần Văn Minh",
      avatar: Image2,
      rating: 5,
      comment: "Quy trình xét nghiệm nhanh chóng, kết quả chính xác. Nhân viên rất thân thiện và chuyên nghiệp.",
      service: "Xét nghiệm STI/STD",
      date: "2024-01-10"
    },
    {
      id: 3,
      name: "Lê Thị Hương",
      avatar: Image3,
      rating: 5,
      comment: "Tư vấn tiền hôn nhân giúp chúng tôi chuẩn bị tốt hơn cho cuộc sống hôn nhân. Rất hữu ích!",
      service: "Tư vấn tiền hôn nhân",
      date: "2024-01-08"
    }
  ];

  const categories = [
    { key: "all", label: "Tất cả dịch vụ", icon: <DocumentText size={20} /> },
    { key: "consultation", label: "Tư vấn", icon: <People size={20} /> },
    { key: "testing", label: "Xét nghiệm", icon: <Activity size={20} /> },
    { key: "monitoring", label: "Theo dõi", icon: <Calendar size={20} /> },
    { key: "homecare", label: "Tại nhà", icon: <Home size={20} /> }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

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
      case "price-low":
        return a.price.online - b.price.online;
      case "price-high":
        return b.price.online - a.price.online;
      case "newest":
        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      default:
        return 0;
    }
  });

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setIsModalVisible(true);
  };

  const handleBookService = (service: Service) => {
    // Map service IDs to booking service types
    const serviceMapping: Record<number, string> = {
      1: 'consultation',
      2: 'sti-testing', 
      3: 'health-checkup',
      4: 'home-sampling',
      5: 'cycle-tracking'
    };
    
    const serviceType = serviceMapping[service.id] || 'consultation';
    navigate(`/booking?service=${serviceType}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <Spin size="large" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full"
            />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-gray-600 font-medium"
          >
            Đang tải dịch vụ chăm sóc sức khỏe...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section với Parallax Effect */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background với Multiple Images */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-green-600/90"
          />
          <div className="absolute inset-0 grid grid-cols-3 gap-0 opacity-20">
            {[Image1, Image2, Image3, Image4, Image5, Image6].map((img, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 1.2 }}
                animate={{ opacity: 0.3, scale: 1 }}
                transition={{ delay: index * 0.2, duration: 1 }}
                className="relative overflow-hidden"
              >
                <img
                  src={img}
                  alt={`Background ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-green-100 bg-clip-text text-transparent">
              Dịch vụ Chăm sóc
              <br />
              <span className="text-6xl md:text-8xl">Sức khỏe Phụ nữ</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Chăm sóc sức khỏe toàn diện với đội ngũ chuyên gia hàng đầu, 
              công nghệ hiện đại và dịch vụ tận tâm
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              type="primary"
              size="large"
              className="bg-white text-blue-600 border-none hover:bg-blue-50 font-semibold px-8 py-6 h-auto text-lg rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              icon={<Calendar size={24} />}
              onClick={() => navigate('/booking')}
            >
              Đặt lịch ngay
            </Button>
            <Button
              size="large"
              className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-6 h-auto text-lg rounded-full transition-all duration-300 hover:scale-105"
              icon={<VideoPlay size={24} />}
            >
              Xem video giới thiệu
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { number: "10,000+", label: "Khách hàng tin tưởng" },
              { number: "50+", label: "Chuyên gia y tế" },
              { number: "24/7", label: "Hỗ trợ khẩn cấp" },
              { number: "99%", label: "Khách hàng hài lòng" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-100 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white"
        >
          <div className="flex flex-col items-center">
            <span className="text-sm mb-2">Cuộn xuống để khám phá</span>
            <ArrowRight size={24} className="rotate-90" />
          </div>
        </motion.div>
      </motion.section>

      {/* Search & Filter Section */}
      <AnimatedSection className="py-16 bg-white/80 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <Search
                placeholder="Tìm kiếm dịch vụ..."
                size="large"
                prefix={<SearchNormal1 size={20} className="text-gray-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-full"
                style={{ borderRadius: '50px' }}
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <motion.button
                  key={category.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                    selectedCategory === category.key
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.icon}
                  <span className="hidden sm:inline">{category.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Sort size={20} className="text-gray-400" />
              <Select
                value={sortBy}
                onChange={setSortBy}
                size="large"
                className="min-w-[150px]"
              >
                <Option value="popular">Phổ biến nhất</Option>
                <Option value="newest">Mới nhất</Option>
                <Option value="price-low">Giá thấp đến cao</Option>
                <Option value="price-high">Giá cao đến thấp</Option>
              </Select>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Services Grid */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Dịch vụ Chăm sóc Sức khỏe
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Khám phá các dịch vụ chăm sóc sức khỏe chuyên nghiệp được thiết kế 
              riêng cho nhu cầu của phụ nữ hiện đại
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory + searchTerm + sortBy}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {sortedServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group cursor-pointer"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/20">
                    {/* Service Image với Overlay */}
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-80 group-hover:opacity-70 transition-opacity duration-300`} />
                      
                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        {service.isPopular && (
                          <Badge.Ribbon text="Phổ biến" color="gold">
                            <div />
                          </Badge.Ribbon>
                        )}
                        {service.isNew && (
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Mới
                          </span>
                        )}
                      </div>

                      {/* Service Icon */}
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-3 text-white">
                        {service.icon}
                      </div>

                      {/* Rating */}
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                        <Star1 size={16} variant="Bold" className="text-yellow-500" />
                        <span className="text-sm font-semibold text-gray-800">
                          {service.rating}
                        </span>
                        <span className="text-xs text-gray-600">
                          ({service.reviewCount})
                        </span>
                      </div>
                    </div>

                    {/* Service Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {service.shortDescription}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {service.features.slice(0, 2).map((feature, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            {feature}
                          </span>
                        ))}
                        {service.features.length > 2 && (
                          <span className="text-blue-500 text-xs font-medium">
                            +{service.features.length - 2} tính năng
                          </span>
                        )}
                      </div>

                      {/* Price & Duration */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {service.price.online > 0 ? formatPrice(service.price.online) : 'Liên hệ'}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={12} />
                            {service.duration}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-1">Có sẵn tại:</div>
                          <div className="flex gap-1">
                            {service.availableAt.includes("Online") && (
                              <MonitorMobbile size={16} className="text-blue-500" />
                            )}
                            {service.availableAt.includes("Tại phòng khám") && (
                              <Location size={16} className="text-green-500" />
                            )}
                            {service.availableAt.includes("Tại nhà") && (
                              <Home size={16} className="text-purple-500" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        type="primary"
                        block
                        size="large"
                        className="bg-gradient-to-r from-blue-500 to-purple-500 border-none hover:from-blue-600 hover:to-purple-600 font-semibold rounded-xl h-12"
                        icon={<Calendar size={20} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookService(service);
                        }}
                      >
                        Đặt lịch ngay
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {sortedServices.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-gray-400 mb-4">
                <SearchNormal1 size={64} />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Không tìm thấy dịch vụ phù hợp
              </h3>
              <p className="text-gray-500">
                Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
              </p>
            </motion.div>
          )}
        </div>
      </AnimatedSection>

      {/* Service Packages Section */}
      <AnimatedSection className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Gói Dịch vụ Đặc biệt
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tiết kiệm chi phí với các gói dịch vụ được thiết kế đặc biệt, 
              mang lại giá trị tối ưu cho sức khỏe của bạn
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicePackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`relative bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 ${
                  pkg.isRecommended ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
                }`}
              >
                {pkg.isRecommended && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Được khuyến nghị
                    </span>
                  </div>
                )}

                <div className={`h-32 bg-gradient-to-br ${pkg.gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-4 left-6 text-white">
                    <h3 className="text-2xl font-bold mb-1">{pkg.name}</h3>
                    <p className="text-blue-100 text-sm">{pkg.duration}</p>
                  </div>
                  <div className="absolute top-4 right-4 text-white">
                    <Award size={32} variant="Bold" />
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-gray-600 mb-6">{pkg.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-bold text-blue-600">
                        {formatPrice(pkg.discountPrice)}
                      </span>
                      <span className="text-lg text-gray-400 line-through">
                        {formatPrice(pkg.originalPrice)}
                      </span>
                    </div>
                    <div className="text-sm text-green-600 font-semibold">
                      Tiết kiệm {formatPrice(pkg.originalPrice - pkg.discountPrice)}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Bao gồm:</h4>
                    <ul className="space-y-2">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <TickCircle size={16} variant="Bold" className="text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Services */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Dịch vụ:</h4>
                    <div className="flex flex-wrap gap-2">
                      {pkg.services.map((service, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="primary"
                    block
                    size="large"
                    className={`${
                      pkg.isRecommended
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-none hover:from-blue-600 hover:to-purple-600'
                        : 'bg-gray-800 border-none hover:bg-gray-700'
                    } font-semibold rounded-xl h-12`}
                    icon={<Calendar size={20} />}
                  >
                    Chọn gói này
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Testimonials Section */}
      <AnimatedSection className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Khách hàng Nói gì về Chúng tôi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hàng nghìn khách hàng đã tin tưởng và hài lòng với dịch vụ của chúng tôi
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12 text-center"
              >
                <div className="mb-6">
                  <img
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].name}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
                  />
                  <Rate
                    disabled
                    defaultValue={testimonials[currentTestimonial].rating}
                    className="text-yellow-500 mb-4"
                  />
                </div>

                <blockquote className="text-xl md:text-2xl text-gray-700 font-medium mb-6 italic">
                  "{testimonials[currentTestimonial].comment}"
                </blockquote>

                <div className="text-center">
                  <div className="font-semibold text-gray-900 text-lg">
                    {testimonials[currentTestimonial].name}
                  </div>
                  <div className="text-blue-600 text-sm">
                    {testimonials[currentTestimonial].service}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Testimonial Navigation */}
            <div className="flex justify-center mt-8 gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? 'bg-blue-500 w-8'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Sẵn sàng Chăm sóc Sức khỏe của Bạn?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Đừng để sức khỏe chờ đợi. Đặt lịch tư vấn ngay hôm nay và nhận được 
              sự chăm sóc tốt nhất từ đội ngũ chuyên gia của chúng tôi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                type="primary"
                size="large"
                className="bg-white text-blue-600 border-none hover:bg-blue-50 font-semibold px-8 py-6 h-auto text-lg rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
                icon={<Calendar size={24} />}
                onClick={() => navigate('/booking?service=consultation')}
              >
                Đặt lịch tư vấn
              </Button>
              <Button
                size="large"
                className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-6 h-auto text-lg rounded-full transition-all duration-300 hover:scale-105"
                icon={<Call size={24} />}
              >
                Gọi ngay: 1900 1234
              </Button>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Service Detail Modal */}
      <Modal
        title={null}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        className="service-detail-modal"
        styles={{
          body: { padding: 0 },
          mask: { backdropFilter: 'blur(10px)' }
        }}
      >
        {selectedService && (
          <div className="relative">
            {/* Modal Header với Image */}
            <div className="relative h-64 overflow-hidden">
              <img
                src={selectedService.image}
                alt={selectedService.name}
                className="w-full h-full object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${selectedService.gradient} opacity-80`} />
              <div className="absolute inset-0 flex items-center justify-center text-white text-center p-6">
                <div>
                  <div className="mb-4">{selectedService.icon}</div>
                  <h2 className="text-3xl font-bold mb-2">{selectedService.name}</h2>
                  <p className="text-blue-100">{selectedService.shortDescription}</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Mô tả chi tiết</h3>
                  <p className="text-gray-600 mb-6">{selectedService.description}</p>

                  <h3 className="text-xl font-semibold mb-4">Tính năng nổi bật</h3>
                  <ul className="space-y-2 mb-6">
                    {selectedService.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <TickCircle size={16} variant="Bold" className="text-green-500" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right Column */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Thông tin dịch vụ</h3>
                  
                  {/* Pricing */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold mb-3">Bảng giá</h4>
                    <div className="space-y-2">
                      {selectedService.price.online > 0 && (
                        <div className="flex justify-between">
                          <span>Tư vấn online:</span>
                          <span className="font-semibold text-blue-600">
                            {formatPrice(selectedService.price.online)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Tại phòng khám:</span>
                        <span className="font-semibold text-blue-600">
                          {formatPrice(selectedService.price.offline)}
                        </span>
                      </div>
                      {selectedService.price.home && (
                        <div className="flex justify-between">
                          <span>Tại nhà:</span>
                          <span className="font-semibold text-blue-600">
                            {formatPrice(selectedService.price.home)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Duration & Rating */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <Clock size={24} className="text-blue-500 mx-auto mb-1" />
                      <div className="text-sm text-gray-600">Thời gian</div>
                      <div className="font-semibold">{selectedService.duration}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <Star1 size={24} variant="Bold" className="text-yellow-500 mx-auto mb-1" />
                      <div className="text-sm text-gray-600">Đánh giá</div>
                      <div className="font-semibold">{selectedService.rating}/5</div>
                    </div>
                  </div>

                  {/* Available At */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Có sẵn tại:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedService.availableAt.map((location, index) => (
                        <span
                          key={index}
                          className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {location}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      type="primary"
                      block
                      size="large"
                      className="bg-gradient-to-r from-blue-500 to-purple-500 border-none hover:from-blue-600 hover:to-purple-600 font-semibold rounded-xl h-12"
                      icon={<Calendar size={20} />}
                      onClick={() => {
                        setIsModalVisible(false);
                        handleBookService(selectedService);
                      }}
                    >
                      Đặt lịch ngay
                    </Button>
                    <Button
                      block
                      size="large"
                      className="font-semibold rounded-xl h-12"
                      icon={<Call size={20} />}
                    >
                      Gọi tư vấn: 1900 1234
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Services; 