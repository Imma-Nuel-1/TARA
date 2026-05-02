const countdownScreen = document.getElementById("countdown-screen");
const countdownNumber = document.getElementById("countdown-number");
const messageScreen = document.getElementById("message-screen");
const rainLayer = document.getElementById("rain-layer");
const bgCanvas = document.getElementById("bg-letters");

const phraseChars = Array.from("HAPPY BIRTHDAY TARA BABE \u{1F495}").filter(
  (char) => char !== " "
);
const matrixChars = Array.from("HAPPYBIRTHDAYTARABABEABCDEFGHIJKLMNOPQRSTUVWXYZ");

let rainIntervalId = null;
let countdownValue = 5;

// Build a subtle glowing letter matrix background.
function createLetterField(canvas) {
  const ctx = canvas.getContext("2d");
  let dpr = window.devicePixelRatio || 1;
  let cols = 0;
  let rows = 0;
  let cellSize = 26;
  let grid = [];

  function randomChar() {
    return matrixChars[Math.floor(Math.random() * matrixChars.length)];
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cellSize = window.innerWidth < 780 ? 20 : 26;
    cols = Math.ceil(window.innerWidth / cellSize) + 1;
    rows = Math.ceil(window.innerHeight / cellSize) + 1;

    grid = Array.from({ length: rows * cols }, () => ({
      char: randomChar(),
      alpha: 0.09 + Math.random() * 0.24,
      hue: 310 + Math.random() * 40,
      glow: Math.random() < 0.06,
    }));
  }

  function draw(timestamp) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const now = timestamp * 0.001;
    ctx.font = `${Math.floor(cellSize * 0.78)}px "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const idx = row * cols + col;
        const cell = grid[idx];

        if (Math.random() < 0.017) {
          cell.char = randomChar();
        }

        if (Math.random() < 0.009) {
          cell.glow = !cell.glow;
        }

        const x = col * cellSize + cellSize / 2;
        const waveY = Math.sin(now * 0.8 + col * 0.38) * 2.2;
        const y = row * cellSize + cellSize / 2 + waveY;
        const alpha = cell.glow ? Math.min(0.68, cell.alpha + 0.34) : cell.alpha;
        const sat = cell.glow ? 97 : 82;
        const light = cell.glow ? 72 : 58;

        ctx.fillStyle = `hsla(${cell.hue}, ${sat}%, ${light}%, ${alpha})`;
        ctx.fillText(cell.char, x, y);
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  requestAnimationFrame(draw);
  window.addEventListener("resize", resize);
}

function updateCountdownNumber(value) {
  countdownNumber.textContent = value;

  // Restart pulse animation for each number.
  countdownNumber.classList.remove("pulse");
  void countdownNumber.offsetWidth;
  countdownNumber.classList.add("pulse");
}

function revealBirthdayMessage() {
  countdownScreen.classList.add("hidden");

  setTimeout(() => {
    countdownScreen.classList.remove("visible");
    messageScreen.classList.add("visible");
  }, 760);
}

function startCountdown() {
  countdownScreen.classList.add("visible");
  updateCountdownNumber(countdownValue);

  const timer = setInterval(() => {
    countdownValue -= 1;

    if (countdownValue > 0) {
      updateCountdownNumber(countdownValue);
      return;
    }

    clearInterval(timer);
    revealBirthdayMessage();
    startTextRain();
  }, 1000);
}

function spawnRainLetter() {
  const letter = document.createElement("span");
  const char = phraseChars[Math.floor(Math.random() * phraseChars.length)];
  const hue = Math.floor(Math.random() * 360);
  const duration = (4.2 + Math.random() * 4.2).toFixed(2);
  const drift = (-48 + Math.random() * 96).toFixed(1);

  letter.className = "rain-letter";
  letter.textContent = char;
  letter.style.left = `${Math.random() * 100}vw`;
  letter.style.setProperty("--duration", `${duration}s`);
  letter.style.setProperty("--drift", `${drift}px`);
  letter.style.fontSize = `${1 + Math.random() * 1.4}rem`;
  letter.style.color = `hsl(${hue} 95% 72%)`;

  letter.addEventListener("animationend", () => {
    letter.remove();
  });

  rainLayer.appendChild(letter);

  if (rainLayer.childElementCount > 180) {
    rainLayer.firstElementChild?.remove();
  }
}

function startTextRain() {
  if (rainIntervalId) {
    return;
  }

  for (let i = 0; i < 24; i += 1) {
    setTimeout(spawnRainLetter, i * 70);
  }

  rainIntervalId = setInterval(spawnRainLetter, 180);
}


document.addEventListener("DOMContentLoaded", () => {
  createLetterField(bgCanvas);
  startCountdown();
});
