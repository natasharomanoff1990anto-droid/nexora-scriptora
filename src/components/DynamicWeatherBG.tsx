import React, { useEffect, useState } from 'react';

export const DynamicWeatherBG = ({ mood = 'noir' }) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 0.1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const themes = {
    noir: "linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #0a0a0a 100%)",
    storm: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #020617 100%)",
    heat: "linear-gradient(135deg, #1a0f0f 0%, #2d1a1a 50%, #000000 100%)",
  };

  return (
    <div 
      className="fixed inset-0 -z-10 transition-all duration-1000 ease-in-out"
      style={{
        background: themes[mood as keyof typeof themes],
        filter: "contrast(1.2) brightness(0.8)"
      }}
    >
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("https://www.transparenttextures.com/patterns/asfalt-dark.png")`,
          transform: `scale(1.5) rotate(${offset}deg)`,
          transition: "transform 10s linear"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
    </div>
  );
};
