"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "../../utils/cn";

interface SparklesTextProps {
  children: string;
  className?: string;
  colors?: { first: string; second: string };
  sparklesCount?: number;
}

export function SparklesText({ 
  children, 
  className, 
  colors = { first: "#9CA3AF", second: "#6B7280" }, 
  sparklesCount = 10 
}: SparklesTextProps) {
  const sparkles = useMemo(() => {
    return Array.from({ length: sparklesCount }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 2,
      animationDuration: Math.random() * 1 + 1,
    }));
  }, [sparklesCount]);

  return (
    <span className={cn("relative inline-block", className)}>
      {/* Sparkles */}
      {sparkles.map((sparkle) => (
        <motion.span
          key={sparkle.id}
          className="absolute pointer-events-none"
          style={{
            left: `${sparkle.left}%`,
            top: `${sparkle.top}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.8, 1.2, 0.8],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: sparkle.animationDuration,
            delay: sparkle.animationDelay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            style={{
              width: "100%",
              height: "100%",
              fill: Math.random() > 0.5 ? colors.first : colors.second,
            }}
          >
            <path d="M12 0l1.5 6.5L20 8l-6.5 1.5L12 16l-1.5-6.5L4 8l6.5-1.5L12 0z" />
          </svg>
        </motion.span>
      ))}
      
      {/* Text with gradient */}
      <span
        className="bg-gradient-to-r bg-clip-text text-transparent"
        style={{
          backgroundImage: `linear-gradient(90deg, ${colors.first} 0%, ${colors.second} 100%)`,
        }}
      >
        {children}
      </span>
    </span>
  );
} 