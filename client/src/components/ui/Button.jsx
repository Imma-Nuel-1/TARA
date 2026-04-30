import React from "react";
import "./Button.css";

const Button = ({ children, variant = "primary", ...props }) => {
  return (
    <button type="button" className={`ui-btn ui-btn-${variant}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
