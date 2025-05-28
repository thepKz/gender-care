import { motion } from 'framer-motion';
import {
    ArrowRight,
    Calendar,
    DocumentText,
    Heart,
    Star1
} from 'iconsax-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModernButton from '../../components/ui/ModernButton';
import ModernCard from '../../components/ui/ModernCard';

const DemoIndex: React.FC = () => {
  const navigate = useNavigate();

  const demoPages = [
    {
      id: 'components',
      title: 'Component Showcase',
      description: 'Khám phá các UI components hiện đại với animations đẹp mắt',
      path: '/demo/components',
      icon: <Star1 size={32} variant="Bold" />,
      gradient: 'from-blue-500 via-purple-500 to-pink-500',
      features: ['ModernButton', 'ModernCard', 'Animations', 'Interactive Demo']
    },
    {
      id: 'booking',
      title: 'Booking System',
      description: 'Hệ thống đặt lịch với multi-step form và validation',
      path: '/booking',
      icon: <Calendar size={32} variant="Bold" />,
      gradient: 'from-green-500 via-teal-500 to-blue-500',
      features: ['Multi-step Form', 'Service Selection', 'Validation', 'Responsive Design']
    },
    {
      id: 'booking-history',
      title: 'Booking History',
      description: 'Quản lý lịch sử đặt lịch với filter và search',
      path: '/booking-history',
      icon: <DocumentText size={32} variant="Bold" />,
      gradient: 'from-purple-500 via-indigo-500 to-blue-500',
      features: ['Data Management', 'Filtering', 'Search', 'Status Tracking']
    },
    {
      id: 'feedback',
      title: 'Feedback System',
      description: 'Hệ thống đánh giá với emoji selection và rating',
      path: '/feedback',
      icon: <Heart size={32} variant="Bold" />,
      gradient: 'from-pink-500 via-rose-500 to-red-500',
      features: ['Rating System', 'Emoji Selection', 'Image Upload', 'Progress Tracking']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Demo Showcase
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Khám phá các tính năng và components được xây dựng với thiết kế hiện đại, 
              animations mượt mà và trải nghiệm người dùng tối ưu
            </p>
          </motion.div>
        </div>
      </div>

      {/* Demo Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {demoPages.map((demo, index) => (
            <motion.div
              key={demo.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="h-full"
            >
              <ModernCard
                variant="default"
                className="h-full cursor-pointer group overflow-hidden"
                onClick={() => navigate(demo.path)}
              >
                {/* Header với Gradient */}
                <div className={`h-32 bg-gradient-to-br ${demo.gradient} relative overflow-hidden mb-6`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      {demo.icon}
                    </motion.div>
                  </div>
                  
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "linear",
                        repeatDelay: 2
                      }}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {demo.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {demo.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Tính năng nổi bật:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {demo.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-gray-600"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <ModernButton
                    variant="primary"
                    fullWidth
                    icon={<ArrowRight size={20} />}
                    iconPosition="right"
                    className="group-hover:shadow-lg transition-shadow"
                  >
                    Khám phá ngay
                  </ModernButton>
                </div>
              </ModernCard>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <ModernCard variant="gradient" gradient="from-blue-600 via-purple-600 to-pink-600" size="large">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-4">
                Công nghệ sử dụng
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                Được xây dựng với các công nghệ hiện đại nhất để đảm bảo hiệu suất và trải nghiệm tốt nhất
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { name: 'React 18', desc: 'UI Framework' },
                  { name: 'TypeScript', desc: 'Type Safety' },
                  { name: 'Framer Motion', desc: 'Animations' },
                  { name: 'Tailwind CSS', desc: 'Styling' }
                ].map((tech, index) => (
                  <motion.div
                    key={tech.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-lg font-bold mb-1">{tech.name}</div>
                    <div className="text-sm text-blue-200">{tech.desc}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </ModernCard>
        </motion.div>
      </div>
    </div>
  );
};

export default DemoIndex; 