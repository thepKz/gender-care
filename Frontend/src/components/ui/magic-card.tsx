"use client";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { cn } from "../../utils/cn";

interface MousePosition {
  x: number;
  y: number;
}

function useMousePosition(): MousePosition {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleMouseMove = (event: globalThis.MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return mousePosition;
}

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
}

export default function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#262626",
  gradientOpacity = 0.8,
}: MagicCardProps) {
  const mousePosition = useMousePosition();
  const [localMousePosition, setLocalMousePosition] = useState<MousePosition>({
    x: -gradientSize,
    y: -gradientSize,
  });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setLocalMousePosition({ x: -gradientSize, y: -gradientSize });
  }, [gradientSize]);

  useEffect(() => {
    if (isHovering) {
      setLocalMousePosition({ x: mousePosition.x, y: mousePosition.y });
    }
  }, [mousePosition, isHovering]);

  return (
    <div
      className={cn("group relative flex size-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 border text-black dark:text-white", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(${gradientSize}px circle at ${localMousePosition.x}px ${localMousePosition.y}px, ${gradientColor}, transparent 100%)`,
          opacity: gradientOpacity,
        }}
      />
      {children}
    </div>
  );
} 