import { Spin } from 'antd';
import { motion } from 'framer-motion';
import React, { useState } from 'react';

interface ModernButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'gradient' | 'glass' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onClick?: () => void;
  className?: string;
  ripple?: boolean;
  glow?: boolean;
  type?: 'button' | 'submit' | 'reset';
  htmlType?: 'button' | 'submit' | 'reset';
}

const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  className = '',
  ripple = true,
  glow = false,
  type = 'button'
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Ripple effect
    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { id: Date.now(), x, y };
      
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    onClick?.();
  };

  // Base styles
  const baseStyles = `
    relative overflow-hidden font-semibold transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 transform
    active:scale-95 disabled:cursor-not-allowed disabled:opacity-50
    ${fullWidth ? 'w-full' : ''}
  `;

  // Size variants
  const sizeStyles = {
    small: 'px-4 py-2 text-sm rounded-lg',
    medium: 'px-6 py-3 text-base rounded-xl',
    large: 'px-8 py-4 text-lg rounded-xl',
    xl: 'px-10 py-5 text-xl rounded-2xl'
  };

  // Color variants
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-blue-500 to-blue-600 text-white
      hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/25
      focus:ring-blue-500 border-0
      ${glow ? 'shadow-lg shadow-blue-500/50' : ''}
    `,
    secondary: `
      bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800
      hover:from-gray-200 hover:to-gray-300 hover:shadow-lg
      focus:ring-gray-400 border border-gray-300
    `,
    gradient: `
      bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white
      hover:from-purple-600 hover:via-pink-600 hover:to-red-600
      hover:shadow-lg hover:shadow-purple-500/25
      focus:ring-purple-500 border-0
      ${glow ? 'shadow-lg shadow-purple-500/50' : ''}
    `,
    glass: `
      bg-white/20 backdrop-blur-md text-white border border-white/30
      hover:bg-white/30 hover:shadow-lg hover:shadow-white/10
      focus:ring-white/50
    `,
    outline: `
      bg-transparent border-2 border-blue-500 text-blue-500
      hover:bg-blue-500 hover:text-white hover:shadow-lg hover:shadow-blue-500/25
      focus:ring-blue-500
    `,
    ghost: `
      bg-transparent text-gray-600 border-0
      hover:bg-gray-100 hover:text-gray-800
      focus:ring-gray-400
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 text-white
      hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/25
      focus:ring-red-500 border-0
      ${glow ? 'shadow-lg shadow-red-500/50' : ''}
    `,
    success: `
      bg-gradient-to-r from-green-500 to-green-600 text-white
      hover:from-green-600 hover:to-green-700 hover:shadow-lg hover:shadow-green-500/25
      focus:ring-green-500 border-0
      ${glow ? 'shadow-lg shadow-green-500/50' : ''}
    `
  };

  const buttonClasses = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${className}
  `;

  return (
    <motion.button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Ripple Effects */}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ))}

      {/* Shimmer Effect */}
      <div className="absolute inset-0 -top-px overflow-hidden rounded-xl">
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

      {/* Content */}
      <div className="relative flex items-center justify-center gap-2">
        {loading && (
          <Spin 
            size="small" 
            className="text-current"
            style={{ color: 'currentColor' }}
          />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <motion.span
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.span>
        )}
        
        <span className={loading ? 'opacity-70' : ''}>
          {children}
        </span>
        
        {!loading && icon && iconPosition === 'right' && (
          <motion.span
            initial={{ rotate: 0 }}
            whileHover={{ rotate: -5 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.span>
        )}
      </div>

      {/* Glow Effect */}
      {glow && !disabled && (
        <div className="absolute inset-0 rounded-xl opacity-75 blur-xl -z-10 bg-gradient-to-r from-current to-current" />
      )}
    </motion.button>
  );
};

export default ModernButton; 