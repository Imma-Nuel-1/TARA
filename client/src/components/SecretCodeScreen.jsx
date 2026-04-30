import React, { useState } from "react";

const SecretCodeScreen = ({ onSuccess, secretCode = "26022002" }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleInput = (e) => {
    setCode(e.target.value);
    setError("");
  };

  const handleSubmit = () => {
    if (code === secretCode) {
      onSuccess();
    } else {
      setError("Incorrect code. Try again!");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div id="secret-code-screen" className="screen active">
      <div className="secret-code-card">
        <div className="floating-hearts-small"></div>
        <h1 className="secret-title">✨ Enter the Secret Code ✨</h1>
        <p className="secret-subtitle">Only for someone special...</p>
        <div className="input-group">
          <input
            type="password"
            id="code-input"
            className="code-input"
            placeholder="• • • • • •"
            maxLength={8}
            value={code}
            onChange={handleInput}
            onKeyPress={handleKeyPress}
          />
          <button id="code-btn" className="btn-enter" onClick={handleSubmit}>
            Enter
          </button>
        </div>
        <p id="error-message" className="error-message">
          {error}
        </p>
        <p className="hint-text">💡 Hint: Our special date</p>
      </div>
    </div>
  );
};

export default SecretCodeScreen;
