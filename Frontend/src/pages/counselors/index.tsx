import { Button, Card, Input, Rate, Select, Spin, Tag } from "antd";
import { motion } from "framer-motion";
import {
    Award,
    Calendar,
    Clock,
    Heart,
    Profile2User,
    SearchNormal1,
    User
} from "iconsax-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Image1 from "../../assets/images/image1.jpg";
import { AnimatedSection } from "../../share";

const { Search } = Input;
const { Option } = Select;

interface Doctor {
  id: number;
  name: string;
  avatar: string;
  specialization: string;
  education: string;
  experience: number;
  rating: number;
  reviewCount: number;
  bio: string;
  languages: string[];
  consultationTypes: string[];
  price: {
    online: number;
    offline: number;
  };
  availability: string[];
  certificates: string[];
  isOnline: boolean;
  responseTime: string;
  successRate: number;
}

const Counselors = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("all");
  const [selectedConsultationType, setSelectedConsultationType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  // Mock data cho doctors
  const doctors: Doctor[] = [
    {
      id: 1,
      name: "BS. Nguyễn Thị Hương",
      avatar: Image1,
      specialization: "Sức khỏe sinh sản nữ",
      education: "Tiến sĩ Y khoa - Đại học Y Hà Nội",
      experience: 8,
      rating: 4.9,
      reviewCount: 245,
      bio: "Bác sĩ chuyên khoa Sản phụ khoa với hơn 8 năm kinh nghiệm trong lĩnh vực chăm sóc sức khỏe sinh sản nữ. Chuyên về tư vấn tiền hôn nhân, kế hoạch hóa gia đình và điều trị các vấn đề về chu kỳ kinh nguyệt.",
      languages: ["Tiếng Việt", "English"],
      consultationTypes: ["Online", "Tại phòng khám"],
      price: {
        online: 300000,
        offline: 500000
      },
      availability: ["Thứ 2-6: 8:00-17:00", "Thứ 7: 8:00-12:00"],
      certificates: ["Chứng chỉ Sản phụ khoa", "Chứng chỉ Tư vấn tâm lý"],
      isOnline: true,
      responseTime: "< 30 phút",
      successRate: 96
    },
    {
      id: 2,
      name: "BS. Trần Văn Nam",
      avatar: Image1,
      specialization: "Sức khỏe sinh sản nam",
      education: "Thạc sĩ Y khoa - Đại học Y Dược TP.HCM",
      experience: 6,
      rating: 4.8,
      reviewCount: 189,
      bio: "Bác sĩ chuyên khoa Nam học với kinh nghiệm phong phú trong điều trị các vấn đề về sức khỏe sinh sản nam giới. Tư vấn về rối loạn chức năng tình dục, vô sinh nam và các bệnh lây truyền qua đường tình dục.",
      languages: ["Tiếng Việt"],
      consultationTypes: ["Online", "Tại phòng khám"],
      price: {
        online: 350000,
        offline: 550000
      },
      availability: ["Thứ 2-6: 9:00-18:00", "Chủ nhật: 9:00-15:00"],
      certificates: ["Chứng chỉ Nam học", "Chứng chỉ Điều trị vô sinh"],
      isOnline: false,
      responseTime: "< 1 giờ",
      successRate: 94
    },
    {
      id: 3,
      name: "BS. Lê Thị Lan",
      avatar: Image1,
      specialization: "Tâm lý tình dục",
      education: "Tiến sĩ Tâm lý học - Đại học Quốc gia Hà Nội",
      experience: 10,
      rating: 4.9,
      reviewCount: 312,
      bio: "Chuyên gia tâm lý với chuyên môn sâu về tâm lý tình dục và các vấn đề trong mối quan hệ. Có kinh nghiệm tư vấn cho các cặp đôi về vấn đề tình dục, hôn nhân và kế hoạch hóa gia đình.",
      languages: ["Tiếng Việt", "English", "中文"],
      consultationTypes: ["Online", "Tại phòng khám", "Tại nhà"],
      price: {
        online: 400000,
        offline: 600000
      },
      availability: ["Thứ 2-7: 8:00-20:00"],
      certificates: ["Chứng chỉ Tâm lý lâm sàng", "Chứng chỉ Trị liệu gia đình"],
      isOnline: true,
      responseTime: "< 15 phút",
      successRate: 98
    },
    {
      id: 4,
      name: "BS. Phạm Minh Tuấn",
      avatar: Image1,
      specialization: "Xét nghiệm STI",
      education: "Thạc sĩ Y khoa - Đại học Y Hà Nội",
      experience: 7,
      rating: 4.7,
      reviewCount: 156,
      bio: "Bác sĩ chuyên khoa Xét nghiệm với kinh nghiệm trong chẩn đoán và điều trị các bệnh lây truyền qua đường tình dục. Chuyên về tư vấn phòng ngừa và điều trị HIV, Giang mai, Lậu và các STI khác.",
      languages: ["Tiếng Việt", "English"],
      consultationTypes: ["Online", "Tại phòng khám"],
      price: {
        online: 250000,
        offline: 450000
      },
      availability: ["Thứ 2-6: 7:00-16:00"],
      certificates: ["Chứng chỉ Xét nghiệm", "Chứng chỉ HIV/AIDS"],
      isOnline: true,
      responseTime: "< 45 phút",
      successRate: 92
    },
    {
      id: 5,
      name: "BS. Hoàng Thị Mai",
      avatar: Image1,
      specialization: "Kế hoạch hóa gia đình",
      education: "Tiến sĩ Y khoa - Đại học Y Dược TP.HCM",
      experience: 12,
      rating: 4.8,
      reviewCount: 278,
      bio: "Bác sĩ có nhiều năm kinh nghiệm trong lĩnh vực kế hoạch hóa gia đình, tư vấn về các phương pháp tránh thai, điều trị vô sinh và chăm sóc sức khỏe phụ nữ trước và sau sinh.",
      languages: ["Tiếng Việt", "English"],
      consultationTypes: ["Online", "Tại phòng khám", "Tại nhà"],
      price: {
        online: 380000,
        offline: 580000
      },
      availability: ["Thứ 2-6: 8:00-17:00", "Thứ 7: 8:00-14:00"],
      certificates: ["Chứng chỉ Kế hoạch hóa gia đình", "Chứng chỉ Sản khoa"],
      isOnline: false,
      responseTime: "< 2 giờ",
      successRate: 95
    },
    {
      id: 6,
      name: "BS. Đỗ Văn Hùng",
      avatar: Image1,
      specialization: "Tư vấn tiền hôn nhân",
      education: "Thạc sĩ Y khoa - Đại học Y Hà Nội",
      experience: 5,
      rating: 4.6,
      reviewCount: 134,
      bio: "Bác sĩ trẻ với đam mê tư vấn cho các cặp đôi chuẩn bị kết hôn. Chuyên về khám sức khỏe tiền hôn nhân, tư vấn về sức khỏe sinh sản và chuẩn bị cho việc có con.",
      languages: ["Tiếng Việt"],
      consultationTypes: ["Online", "Tại phòng khám"],
      price: {
        online: 280000,
        offline: 480000
      },
      availability: ["Thứ 2-6: 9:00-18:00"],
      certificates: ["Chứng chỉ Tư vấn hôn nhân", "Chứng chỉ Sức khỏe sinh sản"],
      isOnline: true,
      responseTime: "< 1 giờ",
      successRate: 90
    }
  ];

  const specializations = [
    { value: "all", label: "Tất cả chuyên khoa" },
    { value: "Sức khỏe sinh sản nữ", label: "Sức khỏe sinh sản nữ" },
    { value: "Sức khỏe sinh sản nam", label: "Sức khỏe sinh sản nam" },
    { value: "Tâm lý tình dục", label: "Tâm lý tình dục" },
    { value: "Xét nghiệm STI", label: "Xét nghiệm STI" },
    { value: "Kế hoạch hóa gia đình", label: "Kế hoạch hóa gia đình" },
    { value: "Tư vấn tiền hôn nhân", label: "Tư vấn tiền hôn nhân" }
  ];

  const consultationTypes = [
    { value: "all", label: "Tất cả hình thức" },
    { value: "Online", label: "Tư vấn trực tuyến" },
    { value: "Tại phòng khám", label: "Tại phòng khám" },
    { value: "Tại nhà", label: "Tư vấn tại nhà" }
  ];

  const sortOptions = [
    { value: "rating", label: "Đánh giá cao nhất" },
    { value: "experience", label: "Kinh nghiệm nhiều nhất" },
    { value: "price_low", label: "Giá thấp nhất" },
    { value: "price_high", label: "Giá cao nhất" },
    { value: "reviews", label: "Nhiều đánh giá nhất" }
  ];

  // Filter and sort doctors
  const filteredDoctors = doctors
    .filter(doctor => {
      const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecialization = selectedSpecialization === "all" || 
                                   doctor.specialization === selectedSpecialization;
      const matchesConsultationType = selectedConsultationType === "all" ||
                                    doctor.consultationTypes.includes(selectedConsultationType);
      return matchesSearch && matchesSpecialization && matchesConsultationType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "experience":
          return b.experience - a.experience;
        case "price_low":
          return a.price.online - b.price.online;
        case "price_high":
          return b.price.online - a.price.online;
        case "reviews":
          return b.reviewCount - a.reviewCount;
        default:
          return 0;
      }
    });

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleFavorite = (doctorId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = new Set(favoriteIds);
    if (favoriteIds.has(doctorId)) {
      newFavorites.delete(doctorId);
    } else {
      newFavorites.add(doctorId);
    }
    setFavoriteIds(newFavorites);
  };

  const handleBookConsultation = (doctor: Doctor) => {
    navigate(`/booking/consultation/${doctor.id}`);
  };

  const handleViewProfile = (doctor: Doctor) => {
    navigate(`/doctors/${doctor.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="relative pt-12 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E] opacity-90"></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('../../assets/images/pattern.png')] opacity-10"></div>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/30"
              animate={{
                x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
                y: [Math.random() * 400, Math.random() * 400],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: Math.random() * 15 + 10,
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
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6 backdrop-blur-sm"
            >
              <Profile2User size={40} className="text-white" variant="Bold" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Đội ngũ bác sĩ chuyên nghiệp
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
              Kết nối với các chuyên gia hàng đầu về sức khỏe giới tính và sinh sản
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="large"
                  className="bg-white text-[#0C3C54] border-none font-semibold px-8 py-6 h-auto rounded-full"
                  onClick={() => document.getElementById('doctors')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Tìm bác sĩ
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="large"
                  ghost
                  className="border-white text-white font-semibold px-8 py-6 h-auto rounded-full hover:!bg-white hover:!text-[#0C3C54]"
                  onClick={() => navigate('/booking')}
                >
                  Đặt lịch ngay
                </Button>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="py-12 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="slideUp">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Search
                  placeholder="Tìm kiếm bác sĩ..."
                  allowClear
                  size="large"
                  prefix={<SearchNormal1 size={20} className="text-gray-400" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg"
                />
                
                <Select
                  size="large"
                  value={selectedSpecialization}
                  onChange={setSelectedSpecialization}
                  className="w-full"
                >
                  {specializations.map(spec => (
                    <Option key={spec.value} value={spec.value}>
                      {spec.label}
                    </Option>
                  ))}
                </Select>

                <Select
                  size="large"
                  value={selectedConsultationType}
                  onChange={setSelectedConsultationType}
                  className="w-full"
                >
                  {consultationTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>

                <Select
                  size="large"
                  value={sortBy}
                  onChange={setSortBy}
                  className="w-full"
                >
                  {sortOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>
              
              <div className="text-center text-gray-600">
                Tìm thấy <span className="font-semibold text-[#0C3C54]">{filteredDoctors.length}</span> bác sĩ phù hợp
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Doctors Grid */}
      <div id="doctors" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredDoctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Card
                  className="h-full border-0 shadow-lg group-hover:shadow-2xl transition-all duration-500 overflow-hidden"
                  cover={
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={doctor.avatar}
                        alt={doctor.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      
                      {/* Online Status */}
                      <div className="absolute top-4 left-4">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          doctor.isOnline 
                            ? "bg-green-500 text-white" 
                            : "bg-gray-500 text-white"
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            doctor.isOnline ? "bg-white" : "bg-gray-300"
                          }`}></div>
                          {doctor.isOnline ? "Đang online" : "Offline"}
                        </div>
                      </div>

                      {/* Favorite Button */}
                      <div className="absolute top-4 right-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleFavorite(doctor.id, e)}
                          className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                            favoriteIds.has(doctor.id)
                              ? "bg-red-500 text-white"
                              : "bg-white/20 text-white hover:bg-red-500"
                          }`}
                        >
                          <Heart size={16} variant={favoriteIds.has(doctor.id) ? "Bold" : "Outline"} />
                        </motion.button>
                      </div>

                      {/* Quick Actions */}
                      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleViewProfile(doctor)}
                          className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-blue-500 transition-colors"
                        >
                          <User size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleBookConsultation(doctor)}
                          className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-green-500 transition-colors"
                        >
                          <Calendar size={16} />
                        </motion.button>
                      </div>
                    </div>
                  }
                >
                  <div className="p-6">
                    {/* Doctor Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-[#0C3C54] transition-colors">
                        {doctor.name}
                      </h3>
                      <p className="text-[#0C3C54] font-medium mb-2">
                        {doctor.specialization}
                      </p>
                      <p className="text-gray-600 text-sm mb-3">
                        {doctor.education}
                      </p>
                    </div>

                    {/* Rating and Experience */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Rate disabled defaultValue={doctor.rating} allowHalf className="text-sm" />
                        <span className="text-sm text-gray-600">
                          {doctor.rating} ({doctor.reviewCount})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Award size={16} />
                        <span>{doctor.experience} năm</span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {doctor.bio}
                    </p>

                    {/* Languages */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {doctor.languages.map((lang, idx) => (
                          <Tag key={idx} className="text-xs">
                            {lang}
                          </Tag>
                        ))}
                      </div>
                    </div>

                    {/* Consultation Types */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {doctor.consultationTypes.map((type, idx) => (
                          <Tag key={idx} color="blue" className="text-xs">
                            {type}
                          </Tag>
                        ))}
                      </div>
                    </div>

                    {/* Price and Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#0C3C54]">
                          {doctor.price.online.toLocaleString()}đ
                        </div>
                        <div className="text-xs text-gray-600">Online</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#0C3C54]">
                          {doctor.successRate}%
                        </div>
                        <div className="text-xs text-gray-600">Thành công</div>
                      </div>
                    </div>

                    {/* Response Time */}
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                      <Clock size={16} />
                      <span>Phản hồi: {doctor.responseTime}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        type="primary"
                        className="flex-1 bg-[#0C3C54] border-[#0C3C54] rounded-lg font-medium"
                        onClick={() => handleBookConsultation(doctor)}
                        icon={<Calendar size={16} />}
                      >
                        Đặt lịch
                      </Button>
                      <Button
                        className="flex-1 border-[#0C3C54] text-[#0C3C54] rounded-lg font-medium hover:!bg-[#0C3C54] hover:!text-white"
                        onClick={() => handleViewProfile(doctor)}
                        icon={<User size={16} />}
                      >
                        Xem hồ sơ
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Load More */}
          {filteredDoctors.length > 0 && (
            <AnimatedSection animation="fadeIn" delay={0.5}>
              <div className="text-center mt-16">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="large"
                    className="bg-[#0C3C54] text-white border-none font-semibold px-8 py-6 h-auto rounded-full hover:!bg-[#2A7F9E]"
                  >
                    Xem thêm bác sĩ
                  </Button>
                </motion.div>
              </div>
            </AnimatedSection>
          )}

          {/* No Results */}
          {filteredDoctors.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Profile2User size={64} />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Không tìm thấy bác sĩ phù hợp
              </h3>
              <p className="text-gray-500 mb-6">
                Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
              </p>
              <Button
                type="primary"
                size="large"
                className="bg-[#0C3C54] border-[#0C3C54] rounded-full px-8"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSpecialization("all");
                  setSelectedConsultationType("all");
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Counselors; 