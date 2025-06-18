"use client";

import { Button, Empty, message, Spin } from 'antd';
import { motion } from 'framer-motion';
import {
  Award,
  ClipboardTick,
  Heart,
  HeartAdd,
  Hospital,
  MonitorMobbile,
  People,
  Profile2User,
  Shield,
  Star1
} from 'iconsax-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getServicePackages } from '../../api/endpoints/servicePackageApi';
import ServiceDisplayCard from '../../components/feature/medical/ServiceDisplayCard';
import ServicePackageDisplayCard from '../../components/feature/medical/ServicePackageDisplayCard';
import { useServicesData } from '../../hooks/useServicesData';
import { GetServicePackagesParams, ServicePackage } from '../../types';

// MagicUI Components
import { BlurFade } from '../../components/ui/blur-fade';
import { BoxReveal } from '../../components/ui/box-reveal';
import { WarpBackground } from '../../components/ui/warp-background';



const PublicServicesPage: React.FC = () => {
  const navigate = useNavigate();

  
  // Sử dụng custom hook cho services data
  const {
    services,
    loading,
    pagination,
    actions
  } = useServicesData({
    isPublicView: true,
    defaultPageSize: 12
  });

  // State cho service packages
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [searchText, setSearchText] = useState('');


  // Service highlights
  const highlights = [
    {
      icon: <Shield size={28} color="#0C3C54" variant="Bold" />,
      title: 'Trang thiết bị hiện đại',
      description: 'Đầu tư công nghệ y tế tiên tiến nhất hiện nay',
      color: '#0C3C54'
    },
    {
      icon: <Profile2User size={28} color="#2A7F9E" variant="Bold" />,
      title: 'Đội ngũ chuyên gia',
      description: 'Bác sĩ giàu kinh nghiệm và tận tâm',
      color: '#2A7F9E'
    },
    {
      icon: <ClipboardTick size={28} color="#4CAF50" variant="Bold" />,
      title: 'Quy trình chuẩn',
      description: 'Tuân thủ tiêu chuẩn y tế quốc tế',
      color: '#4CAF50'
    },
    {
      icon: <MonitorMobbile size={28} color="#FF9800" variant="Bold" />,
      title: 'Công nghệ số',
      description: 'Hệ thống quản lý và tư vấn trực tuyến',
      color: '#FF9800'
    }
  ];

  // Fetch service packages từ API
  const fetchServicePackages = useCallback(async () => {
    setPackagesLoading(true);
    try {
      const response = await getServicePackages({
        page: 1,
        limit: 6,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        isActive: true,
        ...(searchText && { search: searchText })
      } as GetServicePackagesParams);
      
      if (response.success) {
        setServicePackages(response.data.packages);
      }
    } catch (error: unknown) {
      console.error('Error fetching service packages:', error);
      message.error('Không thể tải danh sách gói dịch vụ');
    } finally {
      setPackagesLoading(false);
    }
  }, [searchText]);

  // Load service packages khi component mount
  useEffect(() => {
    fetchServicePackages();
  }, [fetchServicePackages]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle booking package
  const handleBookingPackage = (servicePackage: ServicePackage) => {
    console.log('Booking package:', servicePackage);
    navigate('/booking');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section với MagicUI */}
      <section className="relative pt-20 pb-20 overflow-hidden bg-[#0C3C54]">
        {/* Animated grid background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-30">
            {[...Array(120)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-px h-px bg-[#2A7F9E]"
                style={{
                  left: `${(i % 12) * 8.33}%`,
                  top: `${Math.floor(i / 12) * 10}%`,
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
              <Hospital size={48} className="text-white" variant="Bold" />
            </motion.div>
          </BlurFade>
          
                     <BlurFade delay={0.4} inView>
             <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
               Dịch vụ y tế hàng đầu
             </div>
           </BlurFade>
          
          <BlurFade delay={0.6} inView>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 text-enhanced"
            >
              Khám phá hệ thống dịch vụ chăm sóc sức khỏe toàn diện với công nghệ hiện đại và đội ngũ chuyên gia y tế hàng đầu Việt Nam
            </motion.div>
          </BlurFade>
          
          <BlurFade delay={0.8} inView>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate('/booking')}
                  className="!bg-white !text-[#0C3C54] !border-white !font-bold !px-8 !py-6 !text-lg !shadow-2xl hover:!bg-gray-50"
                >
                  <Heart className="mr-2" size={20} variant="Bold" />
                  Đặt lịch khám ngay
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="large"
                  onClick={() => navigate('/online-consultation')}
                  className="!bg-transparent !text-white !border-white !border-2 !font-bold !px-8 !py-6 !text-lg hover:!bg-white hover:!text-[#0C3C54] backdrop-blur-sm"
                >
                  <MonitorMobbile className="mr-2" size={20} />
                  Tư vấn trực tuyến
                </Button>
              </motion.div>
            </div>
          </BlurFade>
        </div>
      </section>
      {/* Highlights Section */}
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
                Tại sao chọn chúng tôi?
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto text-enhanced"
              >
                Những điểm vượt trội giúp chúng tôi trở thành lựa chọn hàng đầu
              </motion.div>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((highlight, index) => (
              <BlurFade key={index} delay={0.2 + index * 0.1} inView>
                <WarpBackground className="h-full group cursor-pointer">
                  <div className="p-8 text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                      style={{ backgroundColor: `${highlight.color}20` }}
                    >
                      {highlight.icon}
                    </motion.div>
                    
                    <BoxReveal align="center">
                      <h4 className="text-xl font-bold text-gray-800 mb-3">
                        {highlight.title}
                      </h4>
                    </BoxReveal>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="text-gray-600 text-sm leading-relaxed text-enhanced"
                    >
                      {highlight.description}
                    </motion.div>
                  </div>
                </WarpBackground>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

 

      {/* Individual Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} inView>
            <div className="text-center mb-16">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#2A7F9E] to-cyan-400 rounded-full mb-8 shadow-xl"
              >
                <HeartAdd size={40} className="text-white" variant="Bold" />
              </motion.div>
              
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Dịch vụ <span className="text-[#2A7F9E]">chuyên khoa</span>
              </motion.h2>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto text-enhanced"
              >
                Đa dạng các dịch vụ chăm sóc sức khỏe từ khám tổng quát đến chuyên khoa, đáp ứng mọi nhu cầu của bạn và gia đình
              </motion.div>
            </div>
          </BlurFade>

          <Spin spinning={loading} size="large">
            {services.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {services.map((service, index) => (
                    <BlurFade key={service._id} delay={0.2 + index * 0.1} inView>
                      <WarpBackground className="h-full group cursor-pointer">
                        <ServiceDisplayCard
                          service={service}
                          className="h-full border-0 shadow-none"
                        />
                      </WarpBackground>
                    </BlurFade>
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-16">
                    <div className="flex items-center gap-3">
                      {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((page) => (
                        <motion.div key={page} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            onClick={() => actions.handlePaginationChange(page)}
                            className={`!w-12 !h-12 !rounded-full !border-0 !font-semibold !text-lg !shadow-lg ${
                              page === pagination.current
                                ? '!bg-[#0C3C54] !text-white'
                                : '!bg-gray-100 !text-gray-600 hover:!bg-[#0C3C54] hover:!text-white'
                            }`}
                          >
                            {page}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span className="text-gray-500 text-xl">
                      {loading ? 'Đang tải dịch vụ...' : 'Không tìm thấy dịch vụ nào phù hợp'}
                    </span>
                  }
                />
              </div>
            )}
          </Spin>
        </div>
      </section>
     {/* Service Packages Section */}
      <section id="packages" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} inView>
            <div className="text-center mb-16">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0C3C54] to-[#2A7F9E] rounded-full mb-8 shadow-xl"
              >
                <ClipboardTick size={40} className="text-white" variant="Bold" />
              </motion.div>
              
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Gói dịch vụ <span className="text-[#2A7F9E]">khám sức khỏe</span>
              </motion.h2>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto text-enhanced"
              >
                Các gói khám sức khỏe được thiết kế phù hợp với từng độ tuổi và nhu cầu
              </motion.div>
            </div>
          </BlurFade>


          <Spin spinning={packagesLoading} size="large">
            {servicePackages.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {servicePackages.map((pkg, index) => (
                  <BlurFade key={pkg._id} delay={0.2 + index * 0.1} inView>
                    <WarpBackground className="h-full group cursor-pointer">
                                             <ServicePackageDisplayCard
                         servicePackage={pkg}
                         onBookingClick={handleBookingPackage}
                         className="h-full border-0 shadow-none"
                       />
                    </WarpBackground>
                  </BlurFade>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <h3 className="text-gray-500 text-xl mb-4">
                      {searchText ? 'Không tìm thấy gói dịch vụ phù hợp' : 'Hiện tại chưa có gói dịch vụ nào'}
                    </h3>
                  }
                />
                {searchText && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      type="primary"
                      onClick={() => {
                        setSearchText('');
                        fetchServicePackages();
                      }}
                      className="!bg-[#0C3C54] !border-[#0C3C54] !rounded-xl !px-8 !py-6 !text-lg !font-bold"
                    >
                      Xóa bộ lọc
                    </Button>
                  </motion.div>
                )}
              </div>
            )}
          </Spin>
        </div>
      </section>
      {/* Call to Action Section */}
      <section className="py-20 bg-[#0C3C54] relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-30">
            {[...Array(80)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-px h-px bg-[#2A7F9E]"
                style={{
                  left: `${(i % 10) * 10}%`,
                  top: `${Math.floor(i / 10) * 12.5}%`,
                }}
                animate={{
                  opacity: [0.2, 0.8, 0.2],
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
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full mb-10 backdrop-blur-sm border border-white/30"
            >
              <People size={48} className="text-white" variant="Bold" />
            </motion.div>
          </BlurFade>
          
          <BlurFade delay={0.4} inView>
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Bắt đầu hành trình chăm sóc{' '}
              <span className="bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">
                sức khỏe
              </span>
            </motion.h2>
          </BlurFade>
          
          <BlurFade delay={0.6} inView>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-16 leading-relaxed text-enhanced"
            >
              Liên hệ với chúng tôi ngay để được tư vấn và đặt lịch khám với đội ngũ chuyên gia hàng đầu. Sức khỏe của bạn là ưu tiên số một của chúng tôi.
            </motion.div>
          </BlurFade>
          
          <BlurFade delay={0.8} inView>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate('/booking')}
                  className="!bg-white !text-[#0C3C54] !border-white !font-bold !px-12 !py-7 !text-xl !shadow-2xl hover:!bg-gray-50"
                >
                  <Heart className="mr-3" size={24} variant="Bold" />
                  Đặt lịch khám ngay
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="large"
                  onClick={() => navigate('/online-consultation')}
                  className="!bg-white/10 !text-white !border-white !border-2 !font-bold !px-12 !py-7 !text-xl hover:!bg-white hover:!text-[#0C3C54] backdrop-blur-sm"
                >
                  <MonitorMobbile className="mr-3" size={24} />
                  Tư vấn trực tuyến
                </Button>
              </motion.div>
            </div>
          </BlurFade>
        </div>
      </section>
    </div>
  );
};

export default PublicServicesPage; 