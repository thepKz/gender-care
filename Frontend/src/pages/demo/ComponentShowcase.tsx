import { motion } from 'framer-motion';
import {
    Activity,
    Award,
    Calendar,
    Call,
    Heart,
    Home,
    Shield,
    Star1,
    TickCircle,
    VideoPlay
} from 'iconsax-react';
import React, { useState } from 'react';
import Image1 from '../../assets/images/image1.jpg';
import Image2 from '../../assets/images/image2.jpg';
import Image3 from '../../assets/images/image3.jpg';
import ModernButton from '../../components/ui/ModernButton';
import ModernCard from '../../components/ui/ModernCard';

const ComponentShowcase: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Component Showcase
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Khám phá các component UI hiện đại với thiết kế đẹp mắt và animations mượt mà
          </p>
        </motion.div>

        {/* Modern Buttons Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Modern Buttons
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Primary Buttons */}
            <ModernCard variant="default" size="medium">
              <h3 className="text-xl font-semibold mb-4">Primary Variants</h3>
              <div className="space-y-4">
                <ModernButton variant="primary" icon={<Calendar size={20} />}>
                  Đặt lịch ngay
                </ModernButton>
                <ModernButton variant="primary" size="large" glow>
                  Button với Glow
                </ModernButton>
                <ModernButton 
                  variant="primary" 
                  loading={loading}
                  onClick={handleLoadingDemo}
                >
                  {loading ? 'Đang xử lý...' : 'Test Loading'}
                </ModernButton>
              </div>
            </ModernCard>

            {/* Gradient Buttons */}
            <ModernCard variant="glass">
              <h3 className="text-xl font-semibold mb-4 text-white">Gradient & Glass</h3>
              <div className="space-y-4">
                <ModernButton variant="gradient" icon={<Heart size={20} />}>
                  Gradient Button
                </ModernButton>
                <ModernButton variant="glass" icon={<Star1 size={20} />}>
                  Glass Button
                </ModernButton>
                <ModernButton variant="gradient" size="xl" glow>
                  XL với Glow
                </ModernButton>
              </div>
            </ModernCard>

            {/* Other Variants */}
            <ModernCard variant="medical">
              <h3 className="text-xl font-semibold mb-4">Other Variants</h3>
              <div className="space-y-4">
                <ModernButton variant="outline" icon={<Activity size={20} />}>
                  Outline Button
                </ModernButton>
                <ModernButton variant="success" icon={<TickCircle size={20} />}>
                  Success Button
                </ModernButton>
                <ModernButton variant="danger" icon={<Shield size={20} />}>
                  Danger Button
                </ModernButton>
              </div>
            </ModernCard>
          </div>
        </motion.section>

        {/* Modern Cards Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Modern Cards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Default Card */}
            <ModernCard variant="default">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Activity size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Default Card</h3>
                  <p className="text-gray-600">Thiết kế cơ bản</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Card với thiết kế cơ bản, shadow mềm mại và hover effects tự nhiên.
              </p>
              <ModernButton variant="primary" size="small" fullWidth>
                Tìm hiểu thêm
              </ModernButton>
            </ModernCard>

            {/* Glass Card */}
            <ModernCard variant="glass">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Shield size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Glass Card</h3>
                  <p className="text-white/80">Glassmorphism</p>
                </div>
              </div>
              <p className="text-white/90 mb-4">
                Card với hiệu ứng kính mờ, backdrop blur và độ trong suốt hiện đại.
              </p>
              <ModernButton variant="glass" size="small" fullWidth>
                Khám phá
              </ModernButton>
            </ModernCard>

            {/* Gradient Card */}
            <ModernCard 
              variant="gradient" 
              gradient="from-purple-500 via-pink-500 to-red-500"
              glow
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Award size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Gradient Card</h3>
                  <p className="text-white/90">Với Glow Effect</p>
                </div>
              </div>
              <p className="text-white/90 mb-4">
                Card với gradient đẹp mắt và hiệu ứng glow ấn tượng.
              </p>
              <ModernButton variant="glass" size="small" fullWidth>
                Tuyệt vời!
              </ModernButton>
            </ModernCard>
          </div>
        </motion.section>

        {/* Image Cards Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Image Cards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                image: Image1,
                title: "Tư vấn sức khỏe",
                description: "Dịch vụ tư vấn chuyên nghiệp với đội ngũ bác sĩ giàu kinh nghiệm",
                icon: <Heart size={24} />
              },
              {
                image: Image2,
                title: "Xét nghiệm hiện đại",
                description: "Công nghệ xét nghiệm tiên tiến, kết quả chính xác và nhanh chóng",
                icon: <Activity size={24} />
              },
             
            ].map((item, index) => (
              <ModernCard
                key={index}
                variant="default"
                image={item.image}
                overlay
                className="h-80"
              >
                <div className="h-full flex flex-col justify-end">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-white/90 mb-4 text-sm">
                    {item.description}
                  </p>
                  <ModernButton variant="glass" size="small">
                    Tìm hiểu thêm
                  </ModernButton>
                </div>
              </ModernCard>
            ))}
          </div>
        </motion.section>

        {/* Interactive Demo */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Interactive Demo
          </h2>
          
          <ModernCard variant="elevated" size="large" className="max-w-4xl mx-auto">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Trải nghiệm Component UI
              </h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Các component được thiết kế với animation mượt mà, hiệu ứng hover ấn tượng 
                và trải nghiệm người dùng tối ưu. Hãy thử tương tác với chúng!
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <ModernButton 
                  variant="primary" 
                  size="large"
                  icon={<Calendar size={24} />}
                  glow
                >
                  Đặt lịch tư vấn
                </ModernButton>
                <ModernButton 
                  variant="gradient" 
                  size="large"
                  icon={<VideoPlay size={24} />}
                >
                  Xem demo
                </ModernButton>
                <ModernButton 
                  variant="outline" 
                  size="large"
                  icon={<Call size={24} />}
                >
                  Liên hệ ngay
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        </motion.section>
      </div>
    </div>
  );
};

export default ComponentShowcase; 