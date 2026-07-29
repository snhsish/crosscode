"use client";

import { useEffect, useRef } from "react";

export function FlickeringGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const gridSize = 40;
    const cells: { x: number; y: number; opacity: number; targetOpacity: number }[] = [];
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        cells.push({ x, y, opacity: 0, targetOpacity: 0 });
      }
    }

    const flickerInterval = setInterval(() => {
      cells.forEach((cell) => {
        if (Math.random() < 0.02) {
          cell.targetOpacity = Math.random() * 0.5 + 0.1;
        } else if (Math.random() < 0.05) {
          cell.targetOpacity = 0;
        }
        cell.opacity += (cell.targetOpacity - cell.opacity) * 0.1;
      });
    }, 100);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 0.5;

      cells.forEach((cell) => {
        if (cell.opacity > 0.01) {
          ctx.fillStyle = `rgba(255, 255, 255, ${cell.opacity})`;
          ctx.fillRect(cell.x, cell.y, gridSize - 1, gridSize - 1);
        }
        ctx.strokeRect(cell.x, cell.y, gridSize, gridSize);
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      clearInterval(flickerInterval);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.4 }}
    />
  );
}
