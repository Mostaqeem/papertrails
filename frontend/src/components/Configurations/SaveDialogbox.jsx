import React from "react";
import "./SaveDialogbox.css";

const SaveDialogbox = ({
  isOpen,
  title = "Success",
  subtitle = "",
  onClose,
}) => {
  // The component will not render at all if isOpen is false
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="saving-dialog">
        <div className="dialog-content">
          {/* Circular Success Icon with Tick Mark */}
          <div className="status-icon success-icon">
            <span>&#10003;</span>
          </div>

          <h1 className="dialog-title success-text">{title}</h1>
          <p className="dialog-subtitle">{subtitle}</p>

          {/* This button is the only way to trigger onClose */}
          <button className="action-btn success-bg" onClick={onClose}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveDialogbox;
