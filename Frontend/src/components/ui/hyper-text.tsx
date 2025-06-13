"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface HyperTextProps {
  children: string;
  className?: string;
  duration?: number;
  framerProps?: any;
  animateOnLoad?: boolean;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function HyperText({
  children,
  className,
  duration = 800,
  framerProps = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 3 },
  },
  animateOnLoad = true,
}: HyperTextProps) {
  const [displayText, setDisplayText] = useState(children.split(""));
  const [trigger, setTrigger] = useState(false);
  const interationsRef = useRef(0);
  const isFirstRender = useRef(true);

  const triggerAnimation = () => {
    interationsRef.current = 0;
    setTrigger(true);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!trigger && !animateOnLoad) return;

      if (interationsRef.current < children.length) {
        setDisplayText((t) =>
          t.map((l, i) => {
            if (l === " ") {
              return l;
            }

            if (i <= interationsRef.current) {
              return children[i];
            }

            return alphabet[Math.floor(Math.random() * 26)];
          }),
        );
        interationsRef.current = interationsRef.current + 0.1;
      } else {
        setTrigger(false);
        clearInterval(interval);
      }
    }, duration / (children.length * 10));

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [children, duration, trigger, animateOnLoad]);

  useEffect(() => {
    if (animateOnLoad && isFirstRender.current) {
      triggerAnimation();
      isFirstRender.current = false;
    }
  }, [animateOnLoad]);

  return (
    <motion.div
      className={cn(
        "cursor-pointer font-mono inline-block",
        className,
      )}
      onClick={triggerAnimation}
      {...framerProps}
    >
      {displayText.map((letter, index) => (
        <motion.span
          key={index}
          className="transition-colors duration-100"
          animate={{
            color: index <= interationsRef.current ? "#000" : "#888",
          }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
} 