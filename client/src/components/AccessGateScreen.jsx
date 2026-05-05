import React, { useState } from "react";

const AccessGateScreen = ({
  onAllowFullAccess,
  onAllowGuestAccess,
}) => {
  const [step, setStep] = useState("choice");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  // Support multiple valid codes
  const validCodes = ["010522"];

  const handleYes = () => {
    setStep("code");
    setError("");
  };

  const handleNo = () => {
    onAllowGuestAccess?.();
  };

  const handleSubmit = () => {
    if (validCodes.includes(code.trim())) {
      onAllowFullAccess?.();
      return;
    }

    setError("That code is not correct. Please continue to contribution and wish Halimah.");
  };

  return (
    <div id="access-gate-screen" className="screen active">
      <div className="access-gate-panel">
        <div className="gate-badge">Halimah's Birthday Access</div>
        <div className="floating-hearts-small" aria-hidden="true" />
        <h1 className="gate-title">Choose your entry</h1>
        <p className="gate-copy">
          Use the private code to open the full site. If you do not have it,
          you can still leave a message and upload your own memory.
        </p>

        <div className="gate-points" aria-hidden="true">
          <span>Full access</span>
          <span>Guest uploads only</span>
          <span>Private memory space</span>
        </div>

        {step === "choice" ? (
          <div className="access-choice-row">
            <button type="button" className="btn-enter gate-choice-btn" onClick={handleYes}>
              Yes, I have a code
            </button>
            <button type="button" className="btn-enter gate-choice-btn gate-no-btn" onClick={handleNo}>
              No, continue as guest
            </button>
          </div>
        ) : (
          <>
            <div className="gate-code-box">
              <label htmlFor="access-code-input" className="gate-label">
                Enter our special number
              </label>
              <div className="input-group access-code-group">
                <input
                  type="password"
                  id="access-code-input"
                  className="code-input access-code-input"
                  placeholder="••••••"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  autoComplete="off"
                />
                <button type="button" className="btn-enter" onClick={handleSubmit}>
                  Unlock
                </button>
              </div>
            </div>
            <button type="button" className="gate-back-btn" onClick={() => setStep("choice") }>
              Back
            </button>
          </>
        )}

        {error && <p className="error-message gate-error-message">{error}</p>}

        {step === "code" && !error && (
          <p className="hint-text">A date that means everything to us 💕</p>
        )}

        {error && (
          <button type="button" className="gate-continue-btn" onClick={onAllowGuestAccess}>
            Continue to contribution
          </button>
        )}
      </div>
    </div>
  );
};

export default AccessGateScreen;