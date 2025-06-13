"use client";

import { cn } from "../../utils/cn";

interface InteractiveGridPatternProps {
  className?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  squares?: [number, number][];
  strokeDasharray?: number | string;
  numSquares?: number;
  maxOpacity?: number;
}

export function InteractiveGridPattern({
  className,
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 50,
  maxOpacity = 0.5,
  squares,
  ...props
}: InteractiveGridPatternProps) {
  const id = crypto.randomUUID();

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/20 stroke-gray-400/20",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      <svg x={x} y={y} className="overflow-visible">
        {squares?.map(([x, y]) => (
          <rect
            strokeWidth="0"
            key={`${x}-${y}`}
            width={width - 1}
            height={height - 1}
            x={x * width + 1}
            y={y * height + 1}
            fill="currentColor"
            fillOpacity={maxOpacity}
          />
        ))}
      </svg>
    </svg>
  );
} 