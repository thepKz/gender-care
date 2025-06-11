import { motion, MotionProps, useAnimation, Variants } from 'framer-motion';
import React, { ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';

interface AnimatedSectionProps extends MotionProps {
  children: ReactNode;
  variants?: Variants;
  className?: string;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
  animation?: 'fadeIn' | 'slideUp' | 'slideRight' | 'slideLeft' | 'zoomIn' | 'rotateIn' | 'bounce' | 'custom';
  hoverEffect?: 'zoom' | 'glow' | 'float' | 'pulse' | 'tilt' | 'none';
  once?: boolean; // Để kiểm soát nếu animation chỉ chạy một lần
}

// Các animation variants mặc định phong cách GenKiKoi
const animationVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  },
  slideUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  },
  slideRight: {
    hidden: { opacity: 0, x: -30 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  },
  slideLeft: {
    hidden: { opacity: 0, x: 30 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  },
  zoomIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  },
  rotateIn: {
    hidden: { opacity: 0, rotate: -5, scale: 0.95 },
    visible: { 
      opacity: 1, 
      rotate: 0,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  },
  bounce: {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 15 
      } 
    }
  }
};

// Các hiệu ứng hover phong cách GenKiKoi
const getHoverEffects = (effect: string) => {
  switch (effect) {
    case 'zoom':
      return { scale: 1.05, transition: { duration: 0.3 } };
    case 'glow':
      return { 
        boxShadow: "0 0 15px rgba(255, 255, 255, 0.5)",
        transition: { duration: 0.3 } 
      };
    case 'float':
      return { y: -10, transition: { duration: 0.4, yoyo: Infinity, repeat: 1 } };
    case 'pulse':
      return { 
        scale: [1, 1.03, 1],
        transition: { duration: 1.2, repeat: Infinity } 
      };
    case 'tilt':
      return { rotate: 1, transition: { duration: 0.2 } };
    default:
      return {};
  }
};

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ 
  children, 
  variants, 
  className = "w-full", 
  delay = 0,
  duration,
  style,
  animation = 'slideUp',
  hoverEffect = 'none',
  once = true,
  ...props
}) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: once,
    threshold: 0.1,
  });

  React.useEffect(() => {
    if (inView) {
      controls.start("visible");
    } else if (!once) {
      controls.start("hidden");
    }
  }, [controls, inView, once]);

  // Chọn variants dựa vào animation type
  let selectedVariants = variants;
  if (!variants && animation !== 'custom') {
    selectedVariants = animationVariants[animation];
  }

  // Tạo một bản sao của variants để tránh mutation
  const customVariants = selectedVariants ? JSON.parse(JSON.stringify(selectedVariants)) : undefined;
  
  // Thêm delay hoặc duration nếu được cung cấp
  if (customVariants && (delay > 0 || duration)) {
    // Đảm bảo visible và transition tồn tại
    if (!customVariants.visible) {
      customVariants.visible = {};
    }
    
    if (!customVariants.visible.transition) {
      customVariants.visible.transition = {};
    }
    
    if (delay > 0) {
      customVariants.visible.transition.delay = delay;
    }
    
    if (duration) {
      customVariants.visible.transition.duration = duration;
    }
  }

  // Xác định hiệu ứng hover
  const hoverStyles = getHoverEffects(hoverEffect);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={customVariants}
      className={className}
      style={style}
      whileHover={hoverEffect !== 'none' ? hoverStyles : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;
