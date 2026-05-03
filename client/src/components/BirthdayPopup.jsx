import React, { useEffect } from "react";

const BirthdayPopup = ({ open, onClose, title }) => {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="birthday-popup show">
      <div className="birthday-content">
        <div className="birthday-icon" aria-hidden="true">🎉</div>
        <div className="birthday-eyebrow">Welcome</div>
        <h1>{title || "Happy Birthday!"}</h1>
        <p className="birthday-copy">You are absolutely beautiful and deeply loved.</p>
        <div className="birthday-sparkles" aria-hidden="true">
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
        </div>
        <button type="button" className="popup-close-btn" onClick={onClose}>
          Let's Continue
        </button>
      </div>
    </div>
  );
};

export default BirthdayPopup;
