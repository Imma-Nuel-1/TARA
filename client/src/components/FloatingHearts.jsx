import React, { useEffect, useMemo, useState } from "react";

const EMOJIS = ["❤", "💕", "💖", "💗", "💓", "💞", "💘", "🌹", "✨", "⭐"];

const FloatingHearts = () => {
  const [items, setItems] = useState([]);
  const pool = useMemo(() => EMOJIS, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const id = `${Date.now()}-${Math.random()}`;
      const item = {
        id,
        emoji: pool[Math.floor(Math.random() * pool.length)],
        left: `${5 + Math.random() * 90}%`,
        duration: `${6 + Math.random() * 6}s`,
        size: `${1 + Math.random() * 1.2}rem`,
      };

      setItems((prev) => [...prev, item]);
      setTimeout(() => {
        setItems((prev) => prev.filter((heart) => heart.id !== id));
      }, 13000);
    }, 400);

    return () => clearInterval(interval);
  }, [pool]);

  return (
    <div id="hearts-container">
      {items.map((item) => (
        <div
          key={item.id}
          className="heart"
          style={{
            left: item.left,
            animationDuration: item.duration,
            fontSize: item.size,
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
};

export default FloatingHearts;
