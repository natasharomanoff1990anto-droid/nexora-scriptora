import React, { useEffect, useRef } from 'react';

export const DeepSpaceBG = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: any[] = [];
    const numStars = 400;

    const initStars = () => {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.width,
          z: Math.random() * canvas.width,
          o: Math.random()
        });
      }
    };

    const update = () => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < numStars; i++) {
        let star = stars[i];
        star.z -= 0.5;
        if (star.z <= 0) star.z = canvas.width;

        let sx = (star.x - canvas.width / 2) * (canvas.width / star.z) + canvas.width / 2;
        let sy = (star.y - canvas.height / 2) * (canvas.width / star.z) + canvas.height / 2;
        let size = (1 - star.z / canvas.width) * 3;

        ctx.fillStyle = `rgba(255, 255, 255, ${1 - star.z / canvas.width})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(update);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    update();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" />;
};
