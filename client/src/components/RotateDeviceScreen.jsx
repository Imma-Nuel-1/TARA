import React from "react";

const RotateDeviceScreen = () => {
  return (
    <div id="rotate-device-screen" className="screen active">
      <div className="rotate-card">
        <div className="rotate-icon" aria-hidden="true">
          ↻
        </div>
        <h1 className="rotate-title">Please rotate your device</h1>
        <p className="rotate-copy">
          This experience starts in landscape mode. Rotate your phone or tablet,
          then the site will load automatically.
        </p>
        <div className="rotate-device-illustration" aria-hidden="true">
          <div className="rotate-frame rotate-frame-phone" />
          <div className="rotate-frame rotate-frame-landscape" />
        </div>
      </div>
    </div>
  );
};

export default RotateDeviceScreen;