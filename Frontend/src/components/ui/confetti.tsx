"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "../../utils/cn";

interface ConfettiProps {
  className?: string;
  /**
   * The id of the canvas element
   * @default "confetti"
   */
  id?: string;
  /**
   * The number of confetti pieces
   * @default 50
   */
  particleCount?: number;
  /**
   * The colors of the confetti pieces
   * @default ["#f43f5e", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"]
   */
  colors?: string[];
  /**
   * The speed of the confetti pieces
   * @default 1
   */
  speed?: number;
  /**
   * Whether the confetti should be infinite
   * @default false
   */
  infinite?: boolean;
  /**
   * The gravity of the confetti pieces
   * @default 0.1
   */
  gravity?: number;
  /**
   * The wind speed
   * @default 0
   */
  wind?: number;
}

export default function Confetti({
  className,
  id = "confetti",
  particleCount = 50,
  colors = ["#f43f5e", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"],
  speed = 1,
  infinite = false,
  gravity = 0.1,
  wind = 0,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiParticles = useRef<any[]>([]);
  const animationId = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Confetti particle class
    class ConfettiParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      shape: "square" | "circle";
      size: number;
      rotation: number;
      rotationSpeed: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = -10;
        this.vx = (Math.random() - 0.5) * 6 * speed + wind;
        this.vy = Math.random() * 3 + 1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.shape = Math.random() > 0.5 ? "square" : "circle";
        this.size = Math.random() * 8 + 4;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 6;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += gravity;
        this.rotation += this.rotationSpeed;

        // Reset particle if it goes off screen
        if (this.y > canvas!.height + 10) {
          if (infinite) {
            this.y = -10;
            this.x = Math.random() * canvas!.width;
            this.vy = Math.random() * 3 + 1;
          } else {
            // Remove particle
            const index = confettiParticles.current.indexOf(this);
            if (index > -1) {
              confettiParticles.current.splice(index, 1);
            }
          }
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;

        if (this.shape === "square") {
          ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      confettiParticles.current.push(new ConfettiParticle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      confettiParticles.current.forEach((particle) => {
        particle.update();
        particle.draw(ctx);
      });

      if (confettiParticles.current.length > 0 || infinite) {
        animationId.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, [particleCount, colors, speed, infinite, gravity, wind]);

  return (
    <canvas
      ref={canvasRef}
      id={id}
      className={cn("pointer-events-none fixed inset-0 z-50", className)}
    />
  );
} 