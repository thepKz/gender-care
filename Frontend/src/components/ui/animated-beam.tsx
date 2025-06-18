"use client";

import { cn } from "../../utils/cn";
import { motion } from "framer-motion";
import React, { forwardRef, useRef } from "react";

export interface AnimatedBeamProps {
  className?: string;
  containerRef: React.RefObject<HTMLElement>; // Container ref
  fromRef: React.RefObject<HTMLElement>;
  toRef: React.RefObject<HTMLElement>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false, // Include the reverse prop
  duration = Math.random() * 3 + 4,
  delay = 0,
  pathColor = "gray",
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = "#18ccfc",
  gradientStopColor = "#6344f5",
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}) => {
  const id = React.useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  React.useEffect(() => {
    if (fromRef.current && toRef.current) {
      const calculatePath = () => {
        const containerElement = containerRef.current;
        const fromElement = fromRef.current;
        const toElement = toRef.current;

        if (!containerElement || !fromElement || !toElement) {
          return "";
        }

        const containerRect = containerElement.getBoundingClientRect();
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();

        const relativeFrom = {
          top: fromRect.top - containerRect.top,
          left: fromRect.left - containerRect.left,
          width: fromRect.width,
          height: fromRect.height,
        };

        const relativeTo = {
          top: toRect.top - containerRect.top,
          left: toRect.left - containerRect.left,
          width: toRect.width,
          height: toRect.height,
        };

        const startX = relativeFrom.left + relativeFrom.width / 2 + startXOffset;
        const startY = relativeFrom.top + relativeFrom.height / 2 + startYOffset;

        const endX = relativeTo.left + relativeTo.width / 2 + endXOffset;
        const endY = relativeTo.top + relativeTo.height / 2 + endYOffset;

        const controlPointX = (startX + endX) / 2;
        const controlPointY = (startY + endY) / 2 - curvature;

        return `M ${startX},${startY} Q ${controlPointX},${controlPointY} ${endX},${endY}`;
      };

      // Set the initial path
      const pathData = calculatePath();
      if (pathRef.current) {
        pathRef.current.setAttribute("d", pathData);
      }

      // Update the path when the window resizes
      const resizeObserver = new ResizeObserver(() => {
        const pathData = calculatePath();
        if (pathRef.current) {
          pathRef.current.setAttribute("d", pathData);
        }
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [
    fromRef,
    toRef,
    containerRef,
    curvature,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
  ]);

  return (
    <svg
      ref={svgRef}
      fill="none"
      width="100%"
      height="100%"
      className={cn(
        "pointer-events-none absolute left-0 top-0 transform-gpu stroke-2",
        className,
      )}
      viewBox="0 0 100% 100%"
    >
      <defs>
        <motion.linearGradient
          className="transform-gpu"
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{
            x1: "0%",
            x2: "0%",
            y1: "0%",
            y2: "0%",
          }}
          animate={{
            x1: "0%",
            x2: "100%",
            y1: "0%",
            y2: "0%",
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1], // https://easings.net/#easeOutExpo
            repeat: Infinity,
            repeatDelay: 0,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0"></stop>
          <stop stopColor={gradientStartColor}></stop>
          <stop offset="32.5%" stopColor={gradientStopColor}></stop>
          <stop
            offset="100%"
            stopColor={gradientStopColor}
            stopOpacity="0"
          ></stop>
        </motion.linearGradient>
      </defs>
      <path
        ref={pathRef}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        fill="none"
      ></path>
      <path
        stroke={`url(#${id})`}
        strokeWidth={pathWidth}
        fill="none"
        strokeLinecap="round"
        pathLength="100%"
        className="transform-gpu"
      ></path>
    </svg>
  );
};

AnimatedBeam.displayName = "AnimatedBeam"; 