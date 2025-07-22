import { motion } from "framer-motion";
import {
    Profile2User,
    SearchNormal1,
    Award,
    Star1,
} from "iconsax-react";
import { User } from "lucide-react";
// Custom components
import { ModernCounselorCard } from "../../components/ui/counselors/ModernCounselorCard";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doctorApi, type Doctor } from "../../api/endpoints/doctorApi";
import PrimaryButton from "../../components/ui/primitives/PrimaryButton";

// MagicUI Components
import { BlurFade } from "../../components/ui/blur-fade";
import { WarpBackground } from "../../components/ui/warp-background";
import { BoxReveal } from "../../components/ui/box-reveal";

const Counselors = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("all");
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
      console.error('Không thể tải danh sách bác sĩ');
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

  // Filter and sort doctors
  const filteredDoctors = doctors
    .filter(doctor => {
      // Check if userId exists before accessing fullName
      if (!doctor.userId) return false;
      
      const matchesSearch = doctor.userId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSpecialization = selectedSpecialization === "all" || 
                                   doctor.specialization === selectedSpecialization;
      return matchesSearch && matchesSpecialization;
    })
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchDoctors();
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // Loading spinner với MagicUI style
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0C3C54] relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/20"
              animate={{
                x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
                y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="relative z-10"
        >
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with FlickeringGrid effect */}
      <div className="relative pt-20 pb-20 overflow-hidden bg-[#0C3C54]">
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
              <Profile2User size={48} className="text-white" variant="Bold" />
            </motion.div>
          </BlurFade>
          
          <BlurFade delay={0.4} inView>
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Danh sách bác sĩ
            </motion.h1>
          </BlurFade>
          
          <BlurFade delay={0.6} inView>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 text-enhanced"
            >
              Chọn bác sĩ phù hợp và đặt lịch tư vấn ngay hôm nay
            </motion.div>
          </BlurFade>
          
          <BlurFade delay={0.8} inView>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <PrimaryButton
                  className="!bg-white !text-[#0C3C54] !font-bold !px-8 !py-6 !text-lg !shadow-2xl hover:!bg-gray-50"
                  onClick={() => document.getElementById('doctors')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Tìm bác sĩ
                </PrimaryButton>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <PrimaryButton
                  variant="outline"
                  className="!border-white !text-white !font-bold !px-8 !py-6 !text-lg hover:!bg-white hover:!text-[#0C3C54]"
                  onClick={() => navigate('/booking')}
                >
                  Đặt lịch ngay
                </PrimaryButton>
              </motion.div>
            </div>
          </BlurFade>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-12 bg-gray-50 relative">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} inView>
            <div className="text-center mb-12">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Tại sao chọn chúng tôi?
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto text-enhanced"
              >
                Đội ngũ bác sĩ giàu kinh nghiệm, được đào tạo bài bản với chuyên môn cao
              </motion.div>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Profile2User size={32} variant="Bold" />,
                title: `${doctors.length}+ Bác sĩ`,
                description: "Chuyên gia hàng đầu",
                color: "#0C3C54"
              },
              {
                icon: <Award size={32} variant="Bold" />,
                title: "10+ Năm",
                description: "Kinh nghiệm trung bình",
                color: "#2A7F9E"
              },
              {
                icon: <Star1 size={32} variant="Bold" />,
                title: "4.8/5",
                description: "Đánh giá từ bệnh nhân",
                color: "#4CAF50"
              }
            ].map((stat, index) => (
              <BlurFade key={index} delay={0.2 + index * 0.1} inView>
                <WarpBackground className="h-full group cursor-pointer">
                  <div className="p-8 text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <div style={{ color: stat.color }}>
                        {stat.icon}
                      </div>
                    </motion.div>
                    
                    <BoxReveal align="center">
                      <h4 className="text-2xl font-bold mb-2" style={{ color: stat.color }}>
                        {stat.title}
                      </h4>
                    </BoxReveal>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="text-gray-600 text-enhanced"
                    >
                      {stat.description}
                    </motion.div>
                  </div>
                </WarpBackground>
              </BlurFade>
            ))}
          </div>
        </div>
      </div>

      {/* Search Section with WarpBackground */}
      <div className="py-8 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <BlurFade delay={0.2} inView>
            <WarpBackground className="group">
              <div className="p-8">
                <div className="text-center mb-6">
                  <BoxReveal align="center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      Tìm bác sĩ phù hợp
                    </h3>
                  </BoxReveal>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-gray-600 text-enhanced"
                  >
                    Sử dụng bộ lọc để tìm chuyên gia phù hợp với nhu cầu của bạn
                  </motion.div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <SearchNormal1 size={20} />
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm kiếm bác sĩ..."
                      className="w-full border border-gray-300 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-[#0C3C54] focus:ring-2 focus:ring-[#0C3C54]/20 transition-all duration-300"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-[#0C3C54] focus:ring-2 focus:ring-[#0C3C54]/20 w-full sm:w-60 transition-all duration-300"
                    value={selectedSpecialization}
                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                  >
                    {specializations.map(spec => (
                      <option key={spec.value} value={spec.value}>{spec.label}</option>
                    ))}
                  </select>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-center text-gray-600 mt-6 text-enhanced"
                >
                  Tìm thấy <span className="font-semibold text-[#0C3C54]">{filteredDoctors.length}</span> bác sĩ phù hợp
                </motion.div>
              </div>
            </WarpBackground>
          </BlurFade>
        </div>
      </div>

      {/* Doctors Grid with enhanced animations */}
      <div id="doctors" className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} inView>
            <div className="text-center mb-8">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Danh sách bác sĩ
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto text-enhanced"
              >
                Chọn bác sĩ phù hợp và đặt lịch tư vấn ngay hôm nay
              </motion.div>
            </div>
          </BlurFade>

          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
          >
            {loadingDoctors ? (
              [...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 animate-pulse">
                  <div className="p-6 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="flex gap-3">
                      <div className="flex-1 h-12 bg-gray-200 rounded-xl"></div>
                      <div className="flex-1 h-12 bg-gray-200 rounded-xl"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              filteredDoctors.map((doctor, index) => (
                <ModernCounselorCard
                  key={doctor._id}
                  doctor={doctor}
                  index={index}
                  onBook={() => navigate(`/booking/consultation/${doctor._id}`)}
                  onView={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(() => {
                      navigate(`/doctors/${doctor._id}`);
                    }, 300);
                  }}
                />
              ))
            )}
          </motion.div>

          {/* Load More Button */}
          {filteredDoctors.length > 0 && (
            <BlurFade delay={0.5} inView>
              <div className="text-center mt-16">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <PrimaryButton
                    className="!bg-[#0C3C54] !text-white !font-bold !px-8 !py-6 !text-lg hover:!bg-[#2A7F9E] !shadow-2xl"
                  >
                    Xem thêm bác sĩ
                  </PrimaryButton>
                </motion.div>
              </div>
            </BlurFade>
          )}

          {/* No Results */}
          {filteredDoctors.length === 0 && !loadingDoctors && (
            <div className="col-span-full">
              <div className="text-center py-16 px-8 bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md mx-auto">
                <div className="text-gray-400 mb-6 flex justify-center">
                  <User size={64} />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Không tìm thấy bác sĩ phù hợp
                </h3>
                <p className="text-gray-500 mb-6">
                  Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc chuyên khoa
                </p>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedSpecialization("all");
                  }}
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Counselors; 