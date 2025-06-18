"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  className?: string;
  delay?: number;
  decimalPlaces?: number;
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [currentValue, setCurrentValue] = useState(direction === "down" ? value : 0);

  useEffect(() => {
    const controls = setTimeout(() => {
      setCurrentValue(direction === "down" ? 0 : value);
    }, delay * 1000);

    return () => clearTimeout(controls);
  }, [delay, value, direction]);

  useEffect(() => {
    const startValue = direction === "down" ? value : 0;
    const endValue = direction === "down" ? 0 : value;
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    const updateNumber = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentNumber = startValue + (endValue - startValue) * easeOutQuart;
      setCurrentValue(currentNumber);

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      } else {
        setCurrentValue(endValue);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(updateNumber);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [value, direction, delay]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(num);
  };

  return (
    <span
      className={cn(
        "inline-block tabular-nums text-black dark:text-white tracking-wider",
        className,
      )}
      ref={ref}
    >
      {formatNumber(currentValue)}
    </span>
  );
} 