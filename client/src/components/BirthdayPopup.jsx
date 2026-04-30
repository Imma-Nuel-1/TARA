import React from "react";

const BirthdayPopup = ({ open, onClose, title }) => {
  if (!open) return null;

  return (
    <div className="birthday-popup show">
      <div className="birthday-content">
        <h1>{title || "Happy Birthday!"}</h1>
        <p>You are absolutely beautiful and deeply loved.</p>
        <button type="button" className="popup-close-btn" onClick={onClose}>
          Let's Continue
        </button>
      </div>
    </div>
  );
};

export default BirthdayPopup;
