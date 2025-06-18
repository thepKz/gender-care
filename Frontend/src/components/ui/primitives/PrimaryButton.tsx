import React from 'react';
import { motion } from 'framer-motion';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'outline';
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ children, onClick, icon, variant = 'primary', className='', disabled = false, fullWidth=false, type='button' }) => {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-full transition px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const styles = variant === 'outline'
    ? 'border border-[#0C3C54] text-[#0C3C54] hover:bg-[#0C3C54]/10'
    : 'bg-[#0C3C54] text-white hover:bg-[#0a3246]';

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      type={type}
      className={`${base} ${styles} ${fullWidth ? 'w-full justify-center' : ''} ${className} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {icon && icon}
      <span>{children}</span>
    </motion.button>
  );
};

export default PrimaryButton;
