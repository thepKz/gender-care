import { motion } from 'framer-motion';
import React from 'react';

interface ModernCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'gradient' | 'elevated' | 'bordered' | 'medical';
  size?: 'small' | 'medium' | 'large';
  hover?: boolean;
  glow?: boolean;
  className?: string;
  onClick?: () => void;
  gradient?: string;
  image?: string;
  overlay?: boolean;
}

const ModernCard: React.FC<ModernCardProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  hover = true,
  glow = false,
  className = '',
  onClick,
  gradient,
  image,
  overlay = false
}) => {
  // Base styles
  const baseStyles = `
    relative overflow-hidden transition-all duration-300 ease-out
    ${onClick ? 'cursor-pointer' : ''}
  `;

  // Size variants
  const sizeStyles = {
    small: 'p-4 rounded-lg',
    medium: 'p-6 rounded-xl',
    large: 'p-8 rounded-2xl'
  };

  // Variant styles
  const variantStyles = {
    default: `
      bg-white shadow-lg border border-gray-200
      ${hover ? 'hover:shadow-xl hover:shadow-gray-200/50' : ''}
    `,
    glass: `
      bg-white/20 backdrop-blur-md border border-white/30 shadow-lg
      ${hover ? 'hover:bg-white/30 hover:shadow-xl hover:shadow-white/10' : ''}
    `,
    gradient: `
      bg-gradient-to-br ${gradient || 'from-blue-500 via-purple-500 to-pink-500'} text-white shadow-lg
      ${hover ? 'hover:shadow-xl hover:shadow-purple-500/25' : ''}
    `,
    elevated: `
      bg-white shadow-2xl border-0
      ${hover ? 'hover:shadow-3xl hover:-translate-y-1' : ''}
    `,
    bordered: `
      bg-white border-2 border-gray-300 shadow-sm
      ${hover ? 'hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10' : ''}
    `,
    medical: `
      bg-white border-l-4 border-l-green-500 shadow-lg
      ${hover ? 'hover:shadow-xl hover:border-l-green-600' : ''}
    `
  };

  const cardClasses = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${className}
  `;

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: hover ? { 
      y: -5,
      scale: 1.02,
      transition: { type: "spring", stiffness: 400, damping: 17 }
    } : {}
  };

  return (
    <motion.div
      className={cardClasses}
      onClick={onClick}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      transition={{ duration: 0.3 }}
    >
      {/* Background Image */}
      {image && (
        <div className="absolute inset-0">
          <img
            src={image}
            alt="Card background"
            className="w-full h-full object-cover"
          />
          {overlay && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
          )}
        </div>
      )}

      {/* Glow Effect */}
      {glow && (
        <div className="absolute inset-0 rounded-xl opacity-75 blur-xl -z-10 bg-gradient-to-r from-blue-500 to-purple-500" />
      )}

      {/* Shimmer Effect */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: "linear",
            repeatDelay: 3
          }}
        />
      </div>

      {/* Content */}
      <div className={`relative z-10 ${image ? 'text-white' : ''}`}>
        {children}
      </div>

      {/* Hover Border Effect */}
      {hover && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-transparent"
          whileHover={{
            borderColor: variant === 'gradient' ? 'rgba(255,255,255,0.3)' : 'rgba(59,130,246,0.3)',
            transition: { duration: 0.2 }
          }}
        />
      )}
    </motion.div>
  );
};

export default ModernCard; 