"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "../../utils/cn";

interface BoxRevealProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  width?: "fit-content" | "100%";
  boxColor?: string;
  align?: "left" | "center" | "right";
}

export function BoxReveal({
  children,
  className,
  duration = 0.5,
  delay = 0,
  width = "fit-content",
  boxColor = "#0C3C54",
  align = "left",
}: BoxRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const alignmentClasses = {
    left: "mx-0",
    center: "mx-auto",
    right: "ml-auto mr-0"
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden",
        alignmentClasses[align],
        className
      )}
      style={{ width }}
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
        transition={{
          duration: duration,
          delay: delay + 0.3,
          ease: "easeOut",
        }}
        className={align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"}
      >
        {children}
      </motion.div>
      
      <motion.div
        className="absolute left-0 top-0 z-10 h-full w-full"
        style={{ 
          backgroundColor: boxColor,
          transformOrigin: "right",
        }}
        initial={{ scaleX: 1 }}
        animate={isInView ? { scaleX: 0 } : { scaleX: 1 }}
        transition={{
          duration: duration,
          delay: delay,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export default BoxReveal; 