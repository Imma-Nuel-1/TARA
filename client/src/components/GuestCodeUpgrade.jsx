import React, { useState } from "react";

const GuestCodeUpgrade = ({ isOpen, onClose, onUpgrade }) => {
  const validCodes = ["010522", "180904"];
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (validCodes.includes(code.trim())) {
      onUpgrade?.();
      setCode("");
      setError("");
      return;
    }
    setError("That code is not correct.");
  };

  if (!isOpen) return null;

  return (
    <div className="guest-code-upgrade-overlay" onClick={onClose}>
      <div className="guest-code-upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <button className="upgrade-close-btn" onClick={onClose}>✕</button>
        
        <div className="upgrade-modal-content">
          <h2 className="upgrade-title">Have a Code?</h2>
          <p className="upgrade-subtitle">
            Enter your code to unlock full access to all memories and content.
          </p>

          <div className="upgrade-input-group">
            <input
              type="password"
              className="upgrade-code-input"
              placeholder="Enter 6-digit code"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              autoFocus
            />
            <button 
              type="button" 
              className="upgrade-submit-btn"
              onClick={handleSubmit}
            >
              Unlock
            </button>
          </div>

          {error && (
            <p className="upgrade-error-message">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestCodeUpgrade;
