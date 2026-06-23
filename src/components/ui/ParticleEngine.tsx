import React, { useEffect, useRef } from 'react';

export const ParticleEngine: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Handle resize
    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    setSize();
    window.addEventListener('resize', setSize);

    const chars = ['∑', 'π', '√', '%', '+', '-', '0', '1', '4', '7', '9'];
    const particlesArray: Particle[] = [];
    const numberOfParticles = Math.min(width / 20, 100);

    class Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      char: string;
      opacity: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 20 + 10;
        this.speedY = Math.random() * -1 - 0.5; // move up
        this.speedX = Math.random() * 0.4 - 0.2; // slight horizontal drift
        this.char = chars[Math.floor(Math.random() * chars.length)];
        this.opacity = Math.random() * 0.2 + 0.05; // 0.05 to 0.25
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;

        // Reset to bottom if it floats out of view
        if (this.y < -50) {
          this.y = height + 50;
          this.x = Math.random() * width;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(44, 62, 80, ${this.opacity})`;
        ctx.font = `${this.size}px 'Inter', sans-serif`;
        ctx.fillText(this.char, this.x, this.y);
      }
    }

    // Init
    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push(new Particle());
    }

    // Animate
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none', // Allow clicking through the canvas
      }}
    />
  );
};
