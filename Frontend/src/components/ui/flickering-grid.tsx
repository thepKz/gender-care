"use client";

import { useEffect, useRef } from "react";
import { cn } from "../../utils/cn";

interface FlickeringGridProps {
  className?: string;
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  maxOpacity?: number;
  width?: number;
  height?: number;
}

export function FlickeringGrid({
  className,
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "#6B7280",
  maxOpacity = 0.3,
  width,
  height,
}: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = width || rect.width;
      canvas.height = height || rect.height;
    };

    updateCanvasSize();

    const cols = Math.floor(canvas.width / (squareSize + gridGap));
    const rows = Math.floor(canvas.height / (squareSize + gridGap));

    const squares = Array.from({ length: cols * rows }, () => ({
      opacity: Math.random() * maxOpacity,
      targetOpacity: Math.random() * maxOpacity,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < squares.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const square = squares[i];

        // Randomly change target opacity
        if (Math.random() < flickerChance) {
          square.targetOpacity = Math.random() * maxOpacity;
        }

        // Smoothly transition to target opacity
        square.opacity += (square.targetOpacity - square.opacity) * 0.1;

        if (square.opacity > 0.01) {
          ctx.fillStyle = `${color}${Math.floor(square.opacity * 255).toString(16).padStart(2, '0')}`;
          ctx.fillRect(
            col * (squareSize + gridGap),
            row * (squareSize + gridGap),
            squareSize,
            squareSize
          );
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [squareSize, gridGap, flickerChance, color, maxOpacity, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 pointer-events-none", className)}
      style={{ width: "100%", height: "100%" }}
    />
  );
} 