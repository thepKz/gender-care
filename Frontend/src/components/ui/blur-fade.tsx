"use client";

import { motion, useInView, Variant } from "framer-motion";
import { useRef } from "react";
import { cn } from "../../utils/cn";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: {
    hidden: { y?: number; opacity?: number; filter?: string; scale?: number };
    visible: { y?: number; opacity?: number; filter?: string; scale?: number };
  };
  duration?: number;
  delay?: number;
  yOffset?: number;
  inView?: boolean;
  inViewMargin?: string;
  blur?: string;
  direction?: "up" | "down" | "left" | "right";
}

type AnimationVariant = Variant & {
  filter?: string;
  y?: number;
  x?: number;
  opacity?: number;
  scale?: number;
};

export function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  inView = false,
  inViewMargin = "-50px",
  blur = "6px",
  direction = "up",
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin as any });
  const isInView = !inView || inViewResult;

  const getVariants = () => {
    if (variant) return variant;

    const directionOffset = {
      up: { y: yOffset },
      down: { y: -yOffset },
      left: { x: yOffset },
      right: { x: -yOffset },
    };

    const hidden: AnimationVariant = {
      ...directionOffset[direction],
      opacity: 0,
      filter: `blur(${blur})`,
    };

    const visible: AnimationVariant = {
      y: 0,
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
    };

    return { hidden, visible };
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      exit="hidden"
      variants={getVariants()}
      transition={{
        delay: delay,
        duration: duration,
        ease: "easeOut",
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
} 