import { Button, Card, Input, Rate, Select, Spin, Tag, message } from "antd";
import { motion } from "framer-motion";
import {
    Award,
    Calendar,
    Heart,
    Profile2User,
    SearchNormal1,
    Star1,
    User
} from "iconsax-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doctorApi, type Doctor } from "../../api/endpoints/doctorApi";
import { AnimatedSection } from "../../shared";

const { Search } = Input;
const { Option } = Select;

const Counselors = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("all");
  const [selectedConsultationType, setSelectedConsultationType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Lấy danh sách bác sĩ từ API
  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const doctorsList = await doctorApi.getAllDoctors();
      
      // Remove potential duplicates based on _id
      const uniqueDoctors = doctorsList.filter((doctor, index, array) => 
        array.findIndex(d => d._id === doctor._id) === index
      );
      
      setDoctors(uniqueDoctors);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bác sĩ:', error);
      message.error('Không thể tải danh sách bác sĩ');
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Tạo danh sách specializations từ doctors data
  const specializations = [
    { value: "all", label: "Tất cả chuyên khoa" },
    ...Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean))).map(spec => ({
      value: spec!,
      label: spec!
    }))
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
    { value: "name", label: "Tên A-Z" }
  ];

  // Filter and sort doctors
  const filteredDoctors = doctors
    .filter(doctor => {
      const matchesSearch = doctor.userId.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSpecialization = selectedSpecialization === "all" || 
                                   doctor.specialization === selectedSpecialization;
      // Tạm thời bỏ filter consultation type vì API chưa có field này
      return matchesSearch && matchesSpecialization;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "experience":
          return (b.experience || 0) - (a.experience || 0);
        case "name":
          return a.userId.fullName.localeCompare(b.userId.fullName);
        default:
          return 0;
      }
    });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchDoctors();
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleFavorite = (doctorId: string, e: React.MouseEvent) => {
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
    navigate(`/booking/consultation/${doctor._id}`);
  };

  const handleViewProfile = (doctor: Doctor) => {
    // Scroll to top trước khi navigate
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Delay navigate để scroll hoàn thành
    setTimeout(() => {
      navigate(`/doctors/${doctor._id}`);
    }, 300);
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
            {loadingDoctors ? (
              // Loading skeleton
              [...Array(6)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <Card className="h-full border-0 shadow-lg transition-all duration-500 overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-16 bg-gray-200 rounded mb-4"></div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-10 bg-gray-200 rounded"></div>
                        <div className="flex-1 h-10 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              filteredDoctors.map((doctor, index) => (
                <motion.div
                  key={doctor._id}
                  layout
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="group"
                >
                <Card
                  className="h-full border-0 shadow-lg group-hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer"
                  onClick={() => handleViewProfile(doctor)}
                  cover={
                    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-[#0C3C54] to-[#2A7F9E]">
                      {/* Doctor Avatar */}
                      <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                        <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
                          <img
                            src={doctor.image || doctor.userId.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.userId.fullName}&backgroundColor=ffffff`}
                            alt={doctor.userId.fullName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      
                      {/* Rating Badge */}
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
                          <Star1 size={10} variant="Bold" />
                          {doctor.rating ? doctor.rating.toFixed(1) : '4.9'}
                        </div>
                      </div>

                      {/* Favorite Button */}
                      <div className="absolute top-4 right-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleFavorite(doctor._id, e)}
                          className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                            favoriteIds.has(doctor._id)
                              ? "bg-red-500 text-white"
                              : "bg-white/20 text-white hover:bg-red-500"
                          }`}
                        >
                          <Heart size={14} variant={favoriteIds.has(doctor._id) ? "Bold" : "Outline"} />
                        </motion.button>
                      </div>

                      {/* Doctor Name & Specialization on cover */}
                      <div className="absolute bottom-4 left-4 right-4 text-center text-white">
                        <h3 className="text-lg font-bold mb-1">
                          {doctor.userId.fullName}
                        </h3>
                        <p className="text-sm text-white/90">
                          {doctor.specialization || 'Bác sĩ chuyên khoa'}
                        </p>
                      </div>
                    </div>
                  }
                >
                  <div className="p-5">
                    {/* Education */}
                    <div className="mb-4">
                      <p className="text-gray-600 text-sm">
                        {doctor.education || 'Bác sĩ Y khoa'}
                      </p>
                    </div>

                    {/* Rating and Experience */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Rate disabled defaultValue={doctor.rating || 4.5} allowHalf className="text-sm" />
                        <span className="text-sm text-gray-600">
                          {doctor.rating ? doctor.rating.toFixed(1) : '4.8'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-[#0C3C54] font-medium">
                        <Award size={16} />
                        <span>{doctor.experience || 15} năm</span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {doctor.bio || 'Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm trong lĩnh vực chăm sóc sức khỏe giới tính và tư vấn chuyên môn.'}
                    </p>

                    {/* Certificate */}
                    {doctor.certificate && (
                      <div className="mb-4">
                        <Tag color="blue" className="text-xs">
                          {doctor.certificate}
                        </Tag>
                      </div>
                    )}

                    {/* Contact Info - Simplified */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-gray-600">
                      <div className="truncate">
                        📧 {doctor.userId.email}
                      </div>
                      <div>
                        📞 {doctor.userId.phone || '0901234567'}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        type="primary"
                        className="flex-1 bg-[#0C3C54] border-[#0C3C54] rounded-lg font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookConsultation(doctor);
                        }}
                        icon={<Calendar size={16} />}
                      >
                        Đặt lịch
                      </Button>
                      <Button
                        className="flex-1 border-[#0C3C54] text-[#0C3C54] rounded-lg font-medium hover:!bg-[#0C3C54] hover:!text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(doctor);
                        }}
                        icon={<User size={16} />}
                      >
                        Xem hồ sơ
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
              ))
            )}
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