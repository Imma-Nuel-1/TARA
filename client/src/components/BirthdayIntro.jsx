import React, { useEffect, useRef, useState } from "react";

const LETTER_POOL = Array.from(
  "HAPPYBIRTHDAYTARABABEABCDEFGHIJKLMNOPQRSTUVWXYZ",
);
const RAIN_PHRASES = [
  "HAPPY BIRTHDAY TARA,",
  "HAPPY BIRTHDAY BABE",
  "HAPPY BIRTHDAY HALIMAH",
  "HAPPY BIRTHDAY IFE",
];

function toVerticalPhrase(phrase) {
  return phrase.replace(/\s+/g, " ").trim().split("").join("\n");
}

function BirthdayIntro({ onComplete }) {
  const [countdown, setCountdown] = useState(10);
  const [showMessage, setShowMessage] = useState(false);
  const [rainEnabled, setRainEnabled] = useState(false);
  const [phase, setPhase] = useState("countdown");
  const canvasRef = useRef(null);
  const rainLayerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let animationId = null;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let cellSize = 24;
    let grid = [];

    function randomChar() {
      return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
    }

    function resize() {
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cellSize = window.innerWidth < 768 ? 20 : 24;
      cols = Math.ceil(window.innerWidth / cellSize) + 1;
      rows = Math.ceil(window.innerHeight / cellSize) + 1;
      grid = Array.from({ length: rows * cols }, () => ({
        char: randomChar(),
        alpha: 0.08 + Math.random() * 0.24,
        hue: 310 + Math.random() * 40,
        glow: Math.random() < 0.06,
      }));
    }

    function draw(ts) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const now = ts * 0.001;
      ctx.font = `${Math.floor(cellSize * 0.75)}px "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const idx = row * cols + col;
          const cell = grid[idx];
          if (Math.random() < 0.016) cell.char = randomChar();
          if (Math.random() < 0.008) cell.glow = !cell.glow;

          const x = col * cellSize + cellSize / 2;
          const y = row * cellSize + cellSize / 2 + Math.sin(now * 0.8 + col * 0.3) * 2;
          const alpha = cell.glow
            ? Math.min(0.7, cell.alpha + 0.35)
            : cell.alpha;
          const sat = cell.glow ? 95 : 82;
          const light = cell.glow ? 72 : 58;

          ctx.fillStyle = `hsla(${cell.hue}, ${sat}%, ${light}%, ${alpha})`;
          ctx.fillText(cell.char, x, y);
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    resize();
    animationId = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    if (showMessage) return undefined;
    const tick = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(tick);
          setShowMessage(true);
          setPhase("message");
          return 1;
        }
        return current - 1;
      });
    }, 1200);

    return () => clearInterval(tick);
  }, [showMessage]);

  useEffect(() => {
    if (countdown <= 9) {
      setRainEnabled(true);
    }
  }, [countdown]);

  useEffect(() => {
    if (!showMessage) return undefined;

    const toHeart = setTimeout(() => {
      setPhase("heart");
    }, 1600);

    const toOpening = setTimeout(() => {
      setPhase("opening");
    }, 3000);

    const finish = setTimeout(() => {
      onComplete?.();
    }, 4300);

    return () => {
      clearTimeout(toHeart);
      clearTimeout(toOpening);
      clearTimeout(finish);
    };
  }, [onComplete, showMessage]);

  useEffect(() => {
    if (!rainEnabled) return undefined;

    const layer = rainLayerRef.current;
    if (!layer) return undefined;

    function spawnLetter() {
      const letter = document.createElement("span");
      const phrase =
        RAIN_PHRASES[Math.floor(Math.random() * RAIN_PHRASES.length)];
      const hue = Math.floor(Math.random() * 360);
      const duration = (2.2 + Math.random() * 2.2).toFixed(2);
      const drift = (-6 + Math.random() * 12).toFixed(1);
      const spacing = window.innerWidth < 768 ? 34 : 44;
      const cols = Math.max(6, Math.floor(window.innerWidth / spacing));
      const col = Math.floor(Math.random() * cols);
      const x = col * spacing + spacing / 2;

      letter.className = "intro-rain-letter";
      letter.textContent = toVerticalPhrase(phrase);
      letter.style.left = `${x}px`;
      letter.style.setProperty("--duration", `${duration}s`);
      letter.style.setProperty("--drift", `${drift}px`);
      letter.style.fontSize = `${1.06 + Math.random() * 0.58}rem`;
      letter.style.color = `hsl(${hue} 100% ${78 + Math.random() * 12}%)`;
      letter.addEventListener("animationend", () => letter.remove());

      layer.appendChild(letter);
      if (layer.childElementCount > 520) {
        layer.firstElementChild?.remove();
      }
    }

    for (let i = 0; i < 120; i += 1) {
      setTimeout(spawnLetter, i * 16);
    }

    const rain = setInterval(spawnLetter, 55);

    return () => {
      clearInterval(rain);
    };
  }, [rainEnabled]);

  return (
    <main className={`intro-root intro-phase-${phase}`} aria-live="polite">
      <canvas className="intro-bg" ref={canvasRef} aria-hidden="true" />
      <div className="intro-glow" aria-hidden="true" />
      <div className="intro-rain-layer" ref={rainLayerRef} aria-hidden="true" />

      {showMessage && (
        <section
          className={`intro-heart-stage${phase === "opening" ? " intro-heart-opening" : ""}`}
          aria-hidden="true"
        >
          <svg className="intro-heart-svg" viewBox="0 0 300 280" role="presentation">
            <defs>
              <clipPath id="heart-left-clip">
                <rect x="0" y="0" width="150" height="280" />
              </clipPath>
              <clipPath id="heart-right-clip">
                <rect x="150" y="0" width="150" height="280" />
              </clipPath>
            </defs>

            <path
              className="intro-heart-half intro-heart-left"
              clipPath="url(#heart-left-clip)"
              d="M150 265 L26 140 A68 68 0 1 1 150 78 A68 68 0 1 1 274 140 Z"
            />
            <path
              className="intro-heart-half intro-heart-right"
              clipPath="url(#heart-right-clip)"
              d="M150 265 L26 140 A68 68 0 1 1 150 78 A68 68 0 1 1 274 140 Z"
            />
          </svg>
        </section>
      )}

      {!showMessage ? (
        <section className="intro-screen intro-screen-visible">
          <h1 key={countdown} className="intro-countdown intro-gradient-text">
            {countdown}
          </h1>
        </section>
      ) : (
        <section className="intro-screen intro-screen-visible">
          <h2 className="intro-message intro-gradient-text">
            Happy Birthday Tara! {"\u{1F495}"}
          </h2>
        </section>
      )}
    </main>
  );
}

export default BirthdayIntro;
