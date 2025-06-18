import React from 'react';
import { motion } from 'framer-motion';

interface CardBoxProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * CardBox – hộp thẻ cơ bản thay thế antd Card.
 * – Nền trắng, bo góc lớn, đổ bóng nhẹ.
 * – Hover nâng nhẹ và đổ bóng sâu hơn.
 */
const CardBox: React.FC<CardBoxProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default CardBox; 