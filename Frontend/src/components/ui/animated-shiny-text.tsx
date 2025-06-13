"use client";

import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface AnimatedShinyTextProps {
  children: string;
  className?: string;
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
}: AnimatedShinyTextProps) {
  return (
    <motion.p
      className={cn(
        "mx-auto max-w-md text-neutral-600/70 dark:text-neutral-400/70",
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        ease: "easeInOut",
      }}
    >
      <span
        className={cn(
          "inline-block bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-900 bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent [--bg-size:300%] dark:from-neutral-100 dark:via-neutral-100 dark:to-neutral-100",
          "animate-pulse", // Add a subtle pulse animation
        )}
        style={{
          backgroundImage: `linear-gradient(
            90deg,
            transparent,
            transparent 40%,
            white 50%,
            transparent 60%,
            transparent
          ), linear-gradient(90deg, currentColor, currentColor)`,
          backgroundSize: `${shimmerWidth}% 100%, 100% 100%`,
          backgroundRepeat: "no-repeat",
          animation: "shimmer 3s infinite",
        }}
      >
        {children}
      </span>
      
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -100% 0, 0 0;
          }
          100% {
            background-position: 100% 0, 0 0;
          }
        }
      `}</style>
    </motion.p>
  );
} 