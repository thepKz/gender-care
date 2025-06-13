"use client";

import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface WarpBackgroundProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function WarpBackground({ children, className, onClick }: WarpBackgroundProps) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg transition-all duration-300 hover:shadow-2xl",
        className
      )}
      whileHover={{
        scale: 1.02,
        rotateX: 2,
        rotateY: 2,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      onClick={onClick}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-gray-100/30 pointer-events-none" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" 
             style={{
               animation: "shimmer 2s ease-in-out infinite",
             }} />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
      `}</style>
    </motion.div>
  );
} 