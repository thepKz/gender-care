"use client";

import { motion, Variants } from "framer-motion";
import { cn } from "../../utils/cn";

interface TextAnimateProps {
  children: string;
  className?: string;
  animation?: "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "fadeIn" | "blurInUp" | "blurInDown";
  by?: "word" | "character";
  delay?: number;
  duration?: number;
}

const animationVariants: Record<string, Variants> = {
  slideUp: {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  },
  slideDown: {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  },
  slideLeft: {
    hidden: { x: 20, opacity: 0 },
    visible: { x: 0, opacity: 1 },
  },
  slideRight: {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  blurInUp: {
    hidden: { y: 20, opacity: 0, filter: "blur(4px)" },
    visible: { y: 0, opacity: 1, filter: "blur(0px)" },
  },
  blurInDown: {
    hidden: { y: -20, opacity: 0, filter: "blur(4px)" },
    visible: { y: 0, opacity: 1, filter: "blur(0px)" },
  },
};

export function TextAnimate({
  children,
  className,
  animation = "slideUp",
  by = "word",
  delay = 0,
  duration = 0.5,
}: TextAnimateProps) {
  // Clean and normalize the text to ensure proper spacing
  const cleanedText = children.replace(/\s+/g, ' ').trim();
  const segments = by === "word" ? cleanedText.split(" ") : cleanedText.split("");
  const variants = animationVariants[animation];

  return (
    <motion.div
      className={cn("inline-block whitespace-normal", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ staggerChildren: 0.1, delayChildren: delay }}
      style={{ 
        wordSpacing: 'normal',
        letterSpacing: 'normal',
        whiteSpace: by === "word" ? 'normal' : 'nowrap'
      }}
    >
      {segments.map((segment, index) => (
        <motion.span
          key={index}
          className={cn(
            "inline-block",
            by === "word" ? "mr-1" : ""
          )}
          variants={variants}
          transition={{ duration, ease: "easeOut" }}
          style={{
            marginRight: by === "word" && index < segments.length - 1 ? '0.25rem' : '0',
            whiteSpace: by === "word" ? 'nowrap' : 'normal'
          }}
        >
          {segment}
        </motion.span>
      ))}
    </motion.div>
  );
} 