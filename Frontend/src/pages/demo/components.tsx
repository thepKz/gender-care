import { Card, Rate, Spin } from 'antd';
import { motion } from 'framer-motion';
import {
    Activity,
    ArrowRight,
    Calendar,
    Heart,
    People,
    Shield,
    Star1
} from 'iconsax-react';
import React, { useState } from 'react';
import Image1 from '../../assets/images/image1.jpg';
import Image2 from '../../assets/images/image2.jpg';
import Image3 from '../../assets/images/image3.jpg';
import ModernButton from '../../components/ui/ModernButton';
import ModernCard from '../../components/ui/ModernCard';

const ComponentShowcase: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleButtonClick = (buttonId: string) => {
    setLoadingStates(prev => ({ ...prev, [buttonId]: true }));
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [buttonId]: false }));
    }, 2000);
  };

  const buttonVariants = [
    { variant: 'primary' as const, label: 'Primary' },
    { variant: 'secondary' as const, label: 'Secondary' },
    { variant: 'gradient' as const, label: 'Gradient' },
    { variant: 'glass' as const, label: 'Glass' },
    { variant: 'outline' as const, label: 'Outline' },
    { variant: 'ghost' as const, label: 'Ghost' },
    { variant: 'danger' as const, label: 'Danger' },
    { variant: 'success' as const, label: 'Success' }
  ];

  const cardVariants = [
    { variant: 'default' as const, label: 'Default' },
    { variant: 'glass' as const, label: 'Glass' },
    { variant: 'gradient' as const, label: 'Gradient' },
    { variant: 'elevated' as const, label: 'Elevated' },
    { variant: 'bordered' as const, label: 'Bordered' },
    { variant: 'medical' as const, label: 'Medical' }
  ];

  const sizes = [
    { size: 'small' as const, label: 'Small' },
    { size: 'medium' as const, label: 'Medium' },
    { size: 'large' as const, label: 'Large' },
    { size: 'xl' as const, label: 'XL' }
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
              Component Showcase
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Khám phá các UI components hiện đại với animations đẹp mắt và tương tác mượt mà
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* ModernButton Showcase */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            ModernButton Components
          </h2>

          {/* Button Variants */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Variants</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {buttonVariants.map((btn) => (
                  <ModernButton
                    key={btn.variant}
                    variant={btn.variant}
                    loading={loadingStates[btn.variant]}
                    onClick={() => handleButtonClick(btn.variant)}
                    icon={<Star1 size={20} />}
                  >
                    {btn.label}
                  </ModernButton>
                ))}
              </div>
            </div>

            {/* Button Sizes */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Sizes</h3>
              <div className="flex flex-wrap gap-4 items-end">
                {sizes.map((size) => (
                  <ModernButton
                    key={size.size}
                    variant="primary"
                    size={size.size}
                    icon={<ArrowRight size={size.size === 'small' ? 16 : size.size === 'xl' ? 24 : 20} />}
                    iconPosition="right"
                  >
                    {size.label}
                  </ModernButton>
                ))}
              </div>
            </div>

            {/* Special Features */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Special Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ModernButton
                  variant="gradient"
                  glow
                  icon={<Shield size={20} />}
                >
                  Glow Effect
                </ModernButton>
                <ModernButton
                  variant="primary"
                  fullWidth
                  icon={<Calendar size={20} />}
                  iconPosition="right"
                >
                  Full Width
                </ModernButton>
                <ModernButton
                  variant="outline"
                  disabled
                  icon={<Heart size={20} />}
                >
                  Disabled
                </ModernButton>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ModernCard Showcase */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            ModernCard Components
          </h2>

          {/* Card Variants */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cardVariants.map((card, index) => (
              <motion.div
                key={card.variant}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <ModernCard
                  variant={card.variant}
                  gradient={card.variant === 'gradient' ? 'from-blue-500 to-purple-500' : undefined}
                  className="h-full"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="text-blue-500">
                        <Activity size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {card.label} Card
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Đây là một ví dụ về {card.label.toLowerCase()} card với nội dung mẫu để demo.
                    </p>
                    <div className="flex items-center justify-between">
                      <Rate disabled defaultValue={4} className="text-sm" />
                      <span className="text-sm text-gray-500">4.0/5</span>
                    </div>
                  </div>
                </ModernCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Interactive Examples */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Interactive Examples
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Loading States Demo */}
            <ModernCard variant="default" size="large">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Loading States
              </h3>
              <div className="space-y-4">
                <ModernButton
                  variant="primary"
                  fullWidth
                  loading={loadingStates['loading-demo']}
                  onClick={() => handleButtonClick('loading-demo')}
                  icon={<Spin size="small" />}
                >
                  {loadingStates['loading-demo'] ? 'Processing...' : 'Click to Load'}
                </ModernButton>
                <ModernButton
                  variant="gradient"
                  fullWidth
                  loading={loadingStates['gradient-loading']}
                  onClick={() => handleButtonClick('gradient-loading')}
                >
                  Gradient Loading
                </ModernButton>
              </div>
            </ModernCard>

            {/* Image Cards */}
            <ModernCard variant="default" size="large">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Image Cards
              </h3>
              <div className="space-y-4">
                {[Image1, Image2, Image3].map((image, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    className="relative h-24 rounded-xl overflow-hidden"
                  >
                    <img
                      src={image}
                      alt={`Demo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/80 to-purple-500/80" />
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center">
                        <People size={20} className="mx-auto mb-1" />
                        <div className="text-sm font-medium">Demo Image {index + 1}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ModernCard>
          </div>
        </motion.section>

        {/* Code Examples */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Usage Examples
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ModernCard variant="bordered" size="large">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ModernButton Usage
              </h3>
              <Card className="bg-gray-50">
                <pre className="text-sm text-gray-700 overflow-x-auto">
{`<ModernButton
  variant="primary"
  size="large"
  icon={<Star1 size={20} />}
  loading={loading}
  onClick={handleClick}
>
  Click Me
</ModernButton>`}
                </pre>
              </Card>
            </ModernCard>

            <ModernCard variant="bordered" size="large">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ModernCard Usage
              </h3>
              <Card className="bg-gray-50">
                <pre className="text-sm text-gray-700 overflow-x-auto">
{`<ModernCard
  variant="glass"
  size="large"
  className="backdrop-blur-md"
>
  <div>Card Content</div>
</ModernCard>`}
                </pre>
              </Card>
            </ModernCard>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default ComponentShowcase; 