"use client";

import { AnimatePresence, Variants, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "../../utils/cn";

interface MorphingTextProps {
  children: string[];
  className?: string;
  framerProps?: Variants;
  morphTime?: number;
}

const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const getRandomInt = (max: number): number => Math.floor(Math.random() * max);

export default function MorphingText({
  children,
  className,
  framerProps = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 3 },
  },
  morphTime = 1,
}: MorphingTextProps) {
  const [displayText, setDisplayText] = useState(children[0]);
  const [targetText, setTargetText] = useState(children[0]);

  const morphText = () => {
    let currentIndex = 0;
    let currentText = displayText;
    let targetIndex = (children.indexOf(targetText) + 1) % children.length;
    let target = children[targetIndex];

    setTargetText(target);

    const morphingInterval = setInterval(() => {
      if (currentIndex < target.length) {
        if (currentIndex < currentText.length) {
          currentText =
            currentText.substring(0, currentIndex) +
            alphabets[getRandomInt(26)] +
            currentText.substring(currentIndex + 1);
        } else {
          currentText += alphabets[getRandomInt(26)];
        }
        setDisplayText(currentText);

        setTimeout(() => {
          currentText =
            target.substring(0, currentIndex + 1) +
            currentText.substring(currentIndex + 1);
          setDisplayText(currentText);
          currentIndex++;
        }, 50);
      } else {
        clearInterval(morphingInterval);
        setDisplayText(target);
      }
    }, 100);
  };

  useEffect(() => {
    const interval = setInterval(morphText, morphTime * 1000);
    return () => clearInterval(interval);
  }, [targetText, morphTime]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={displayText}
        className={cn("font-mono", className)}
        {...framerProps}
      >
        {displayText}
      </motion.span>
    </AnimatePresence>
  );
} 