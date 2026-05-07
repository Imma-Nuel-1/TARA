import React, { useState, useRef } from "react";

const questions = [
  {
    id: 1,
    text: "Hey…\nbefore you go any further…\ncan I have just a few seconds of your time?",
    yesText: "Yes, you can 💖",
    noText: "No 😒",
    evasion: "moves",
  },
  {
    id: 2,
    text: "There's something I've been meaning to do…\nsomething I couldn't just say normally.\n\nSo I tried to create it instead.",
    yesText: "I'm listening 💖",
    noText: "Hmm 😒",
    evasion: "moves",
  },
  {
    id: 3,
    text: "This might look simple…\nbut every part of it carries a piece of how I feel about you.\n\nSo please… don't rush it.",
    yesText: "I won't 💖",
    noText: "I might 😒",
    evasion: "movesFaster",
  },
  {
    id: 4,
    text: "I don't always say things perfectly…\nbut if there's one thing I'm sure of—\n\nit's how much you mean to me.",
    yesText: "I feel it 💖",
    noText: "Hmm 😒",
    evasion: "barely",
  },
  {
    id: 5,
    text: "So…\nare you ready to see something made just for you…\nfrom my heart?",
    yesText: "Yes… show me 💖",
    noText: "No 😒",
    evasion: "disappears",
  },
];

const CodeIntro = ({ onComplete, onStartMusic }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMusicGate, setShowMusicGate] = useState(false);
  const [musicError, setMusicError] = useState("");
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 });
  const noButtonRef = useRef(null);

  const currentQuestion = questions[stepIndex];

  const handleYes = () => {
    if (stepIndex < questions.length - 1) {
      setStepIndex(stepIndex + 1);
      setNoButtonPos({ x: 0, y: 0 });
    } else {
      setIsSubmitting(true);
      handleFinalSubmit();
    }
  };

  const handleNoHover = () => {
    if (!noButtonRef.current) return;

    const evasionType = currentQuestion.evasion;

    if (evasionType === "moves") {
      const x = (Math.random() - 0.5) * 150;
      const y = (Math.random() - 0.5) * 100;
      setNoButtonPos({ x, y });
    } else if (evasionType === "movesFaster") {
      const x = (Math.random() - 0.5) * 250;
      const y = (Math.random() - 0.5) * 200;
      setNoButtonPos({ x, y });
    } else if (evasionType === "barely") {
      const x = (Math.random() - 0.5) * 300;
      const y = (Math.random() - 0.5) * 250;
      setNoButtonPos({ x, y });
    } else if (evasionType === "disappears") {
      setNoButtonPos({ x: 9999, y: 9999 });
    }
  };

  const handleFinalSubmit = () => {
    setShowMusicGate(true);
    setMusicError("");
  };

  const handleUserPlay = () => {
    if (!onStartMusic) {
      onComplete?.();
      return;
    }

    onStartMusic()
      .then(() => {
        onComplete?.();
      })
      .catch(() => {
        setMusicError("Playback was blocked by the browser.");
        onComplete?.();
      });
  };

  return (
    <div className="code-intro-root">
      <div className="code-intro-bg" />
      
      {/* Floating Emoji Layer */}
      <div className="code-intro-floating-emojis">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="floating-emoji"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
              fontSize: `${1.5 + Math.random() * 1.5}rem`,
            }}
          >
            {["💖", "💕", "💝", "🌹", "🌺", "✨", "🎀", "💫"][Math.floor(Math.random() * 8)]}
          </div>
        ))}
      </div>

      <div className="code-intro-container">
        {!showMusicGate ? (
          <div className="code-intro-card">
            {/* Progress indicator */}
            <div className="code-progress">
              <div className="code-progress-bar">
                <div
                  className="code-progress-fill"
                  style={{ width: `${((stepIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
              <p className="code-progress-text">
                {stepIndex + 1} of {questions.length}
              </p>
            </div>

            {/* Question - styled with line breaks preserved */}
            <div className="code-question-container">
              <h2 className="code-question">{currentQuestion.text}</h2>
            </div>

            {/* YES/NO Buttons */}
            <div className="code-button-group-yesno">
              <button
                className="code-btn-yes"
                onClick={handleYes}
                disabled={isSubmitting}
                aria-label={currentQuestion.yesText}
              >
                {currentQuestion.yesText}
              </button>

              <button
                ref={noButtonRef}
                className={`code-btn-no code-btn-no-${currentQuestion.evasion}`}
                onMouseEnter={handleNoHover}
                onTouchStart={handleNoHover}
                onClick={handleNoHover}
                disabled={isSubmitting}
                style={{
                  transform: `translate(${noButtonPos.x}px, ${noButtonPos.y}px)`,
                  transition: "transform 0.12s ease-out",
                  position: noButtonPos.x === 9999 ? "fixed" : "relative",
                }}
                aria-label={currentQuestion.noText}
              >
                {currentQuestion.noText}
              </button>
            </div>
          </div>
        ) : (
          <div className="code-music-container">
            <div className="code-music-header">
              <h2 className="code-music-title">Press play to start the music 💘</h2>
            </div>

            <p className="code-music-helper">
              This uses your site audio file at <strong>/music/track.mp3</strong> and loops across the whole app.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className="code-music-play-btn"
                onClick={handleUserPlay}
              >
                ▶ Play music and enter
              </button>
              {musicError && (
                <button
                  type="button"
                  className="code-music-play-btn"
                  onClick={() => onComplete?.()}
                >
                  Continue without music
                </button>
              )}
            </div>

            {musicError && <p className="error-message gate-error-message">{musicError}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeIntro;
