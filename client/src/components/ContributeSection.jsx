import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const RELATIONSHIP_OPTIONS = [
  "Friend",
  "Sister",
  "Brother",
  "Close Friend",
  "Cousin",
  "Classmate",
  "Family",
  "Other",
];

const ContributeSection = ({ onContributionSaved, enforcedStep = "free" }) => {
  const [activeForm, setActiveForm] = useState(
    enforcedStep === "image" ? "image" : "message",
  );
  const [messageForm, setMessageForm] = useState({
    name: "",
    role: "Friend",
    otherRole: "",
    message: "",
    avatarFileData: null,
    avatarFileName: "",
  });
  const [imageForm, setImageForm] = useState({
    name: "",
    caption: "",
    files: [], // Array of {fileData, fileName}
  });
  const [messageErrors, setMessageErrors] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (enforcedStep === "message") {
      setActiveForm("message");
      return;
    }

    if (enforcedStep === "image") {
      setActiveForm("image");
    }
  }, [enforcedStep]);

  const successMessage = (label) =>
    `${label} received. Thank you for your wishes and for sharing a memory.`;

  const validateMessageForm = () => {
    const errors = {};

    if (!messageForm.name.trim()) errors.name = true;
    if (!messageForm.role) errors.role = true;
    if (messageForm.role === "Other" && !messageForm.otherRole.trim()) {
      errors.otherRole = true;
    }
    if (!messageForm.message.trim()) errors.message = true;
    if (!messageForm.avatarFileData) errors.avatarFile = true;

    return errors;
  };

  const validateImageForm = () => {
    const errors = {};

    if (!imageForm.name.trim()) errors.name = true;
    if (imageForm.files.length === 0) errors.fileData = true;
    if (!imageForm.caption.trim()) errors.caption = true;

    return errors;
  };

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    const errors = validateMessageForm();
    setMessageErrors(errors);
    if (Object.keys(errors).length > 0) {
      setStatus("Please fill in all fields before submitting.");
      return;
    }

    setLoading(true);
    setStatus("Submitting your message...");

    try {
      let uploadedAvatarUrl = "";

      setStatus("Uploading profile image...");
      const uploadRes = await fetch(`${API_BASE}/api/media/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: messageForm.avatarFileData,
          filename: messageForm.avatarFileName,
        }),
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.message || "Profile image upload failed");
      }

      uploadedAvatarUrl = uploadData.url;

      const resolvedRole =
        messageForm.role === "Other"
          ? messageForm.otherRole.trim()
          : messageForm.role;

      const res = await fetch(`${API_BASE}/api/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "message",
          title: `Message from ${messageForm.name}`,
          data: {
            message: messageForm.message,
            role: resolvedRole,
            avatarUrl: uploadedAvatarUrl,
          },
          createdBy: messageForm.name,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(successMessage("Your message"));
        onContributionSaved?.({
          type: "message",
          note: {
            name: messageForm.name,
            role: resolvedRole,
            avatarUrl: uploadedAvatarUrl,
            message: messageForm.message,
          },
        });
        setImageForm((prev) => ({ ...prev, name: messageForm.name }));
        setActiveForm("image");
        setMessageForm({
          name: "",
          role: "Friend",
          otherRole: "",
          message: "",
          avatarFileData: null,
          avatarFileName: "",
        });
        setMessageErrors({});
      } else {
        setStatus(`Failed to submit: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      setStatus(`Failed: ${err.message || "Connection error"}`);
    }

    setLoading(false);
  };

  const handleFileChange = (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles = [];
    let filesProcessed = 0;

    Array.from(selectedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newFiles.push({
          fileData: reader.result,
          fileName: file.name,
        });
        filesProcessed++;

        if (filesProcessed === selectedFiles.length) {
          setImageForm((prev) => ({
            ...prev,
            files: [...prev.files, ...newFiles],
          }));
          setImageErrors((prev) => ({ ...prev, fileData: false }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setImageForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleMessageAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setMessageForm((prev) => ({
        ...prev,
        avatarFileData: reader.result,
        avatarFileName: file.name,
      }));
      setMessageErrors((prev) => ({ ...prev, avatarFile: false }));
    };
    reader.readAsDataURL(file);
  };

  const detectMediaType = (fileData) => {
    if (fileData && typeof fileData === "string") {
      return fileData.startsWith("data:video/") ? "video" : "image";
    }
    return "image";
  };

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    const errors = validateImageForm();
    setImageErrors(errors);
    if (Object.keys(errors).length > 0) {
      setStatus("Please fill in all fields before submitting.");
      return;
    }

    setLoading(true);
    setStatus(`Uploading ${imageForm.files.length} file(s)...`);

    try {
      for (let i = 0; i < imageForm.files.length; i++) {
        const file = imageForm.files[i];
        let uploadedUrl = "";

        setStatus(`Uploading file ${i + 1} of ${imageForm.files.length}...`);
        const uploadRes = await fetch(`${API_BASE}/api/media/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: file.fileData, filename: file.fileName }),
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.message || "Upload failed");
        }

        uploadedUrl = uploadData.url;

        const res = await fetch(`${API_BASE}/api/content`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "image",
            title: `Photo from ${imageForm.name}`,
            data: {
              url: uploadedUrl,
              caption: imageForm.caption,
              mediaType: detectMediaType(file.fileData),
            },
            createdBy: imageForm.name,
            createdByRole: "user",
          }),
        });

        const data = await res.json();

        if (res.ok) {
          onContributionSaved?.({
            type: "image",
            galleryItem: {
              imageUrl: uploadedUrl,
              caption: imageForm.caption,
              mediaType: detectMediaType(file.fileData),
            },
          });
        } else {
          throw new Error(data.message || "Failed to save");
        }
      }

      setStatus(successMessage("Your uploads"));
      setImageForm({ name: "", caption: "", files: [] });
      setImageErrors({});
      setActiveForm("message");
    } catch (err) {
      setStatus(`Failed: ${err.message || "Connection error"}`);
    }

    setLoading(false);
  };

  return (
    <section id="contribute" className="section active">
      <div className="contribute-container">
        <h2 className="section-title">Leave Your Mark</h2>
        <p className="contribute-subtitle">
          Share a birthday message or photo memory! You can contribute as many times as you'd like.
        </p>

        {enforcedStep === "message" && (
          <p className="contribute-step-note">
            Step 1 of 2: Submit your message first. Once done, you will move to
            upload.
          </p>
        )}

        {enforcedStep === "image" && (
          <p className="contribute-step-note">
            Step 2 of 2: Upload at least one photo or video to unlock all
            messages and uploads.
          </p>
        )}

        {/* Tab Switcher */}
        <div className="contribute-tabs">
          <button
            type="button"
            className={`contribute-tab ${activeForm === "message" ? "active" : ""}`}
            onClick={() => {
              if (enforcedStep === "image") return;
              setActiveForm("message");
              setStatus("");
            }}
            disabled={enforcedStep === "image"}
          >
            Leave a Message
          </button>
          <button
            type="button"
            className={`contribute-tab ${activeForm === "image" ? "active" : ""}`}
            onClick={() => {
              if (enforcedStep === "message") return;
              setActiveForm("image");
              setStatus("");
            }}
            disabled={enforcedStep === "message"}
          >
            Share a Photo or Video
          </button>
        </div>

        {/* Message Form */}
        {activeForm === "message" && (
          <form className="contribute-form" onSubmit={handleMessageSubmit}>
            <div className="form-group">
              <label htmlFor="message-name">Your Name</label>
              <input
                id="message-name"
                type="text"
                placeholder="Enter your name"
                className={messageErrors.name ? "input-error" : ""}
                value={messageForm.name}
                onChange={(e) =>
                  setMessageForm({ ...messageForm, name: e.target.value })
                }
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message-role">Relationship</label>
              <select
                id="message-role"
                className={messageErrors.role ? "input-error" : ""}
                value={messageForm.role}
                onChange={(e) =>
                  setMessageForm({
                    ...messageForm,
                    role: e.target.value,
                    otherRole: e.target.value === "Other" ? messageForm.otherRole : "",
                  })
                }
                disabled={loading}
                required
              >
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {messageForm.role === "Other" && (
              <div className="form-group">
                <label htmlFor="message-other-role">Type your relationship</label>
                <input
                  id="message-other-role"
                  type="text"
                  placeholder="e.g. Mentor"
                  className={messageErrors.otherRole ? "input-error" : ""}
                  value={messageForm.otherRole}
                  onChange={(e) =>
                    setMessageForm({ ...messageForm, otherRole: e.target.value })
                  }
                  disabled={loading}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="message-avatar-file">Profile Image</label>
              <input
                id="message-avatar-file"
                type="file"
                accept="image/*,image/png,image/jpeg,image/webp"
                className={messageErrors.avatarFile ? "input-error" : ""}
                onChange={handleMessageAvatarChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message-text">Your Birthday Message</label>
              <textarea
                id="message-text"
                rows={6}
                placeholder="Write your heartfelt birthday message here..."
                className={messageErrors.message ? "input-error" : ""}
                value={messageForm.message}
                onChange={(e) =>
                  setMessageForm({ ...messageForm, message: e.target.value })
                }
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="contribute-submit-btn"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Message"}
            </button>
          </form>
        )}

        {/* Image Form */}
        {activeForm === "image" && (
          <form className="contribute-form" onSubmit={handleImageSubmit}>
            <div className="form-group">
              <label htmlFor="image-name">Your Name</label>
              <input
                id="image-name"
                type="text"
                placeholder="Enter your name"
                className={imageErrors.name ? "input-error" : ""}
                value={imageForm.name}
                onChange={(e) =>
                  setImageForm({ ...imageForm, name: e.target.value })
                }
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="media-file">Upload from your device</label>
              <input
                id="media-file"
                type="file"
                multiple
                accept="image/*,video/*,image/png,image/jpeg,video/mp4,video/quicktime,.pjmat"
                className={imageErrors.fileData ? "input-error" : ""}
                onChange={handleFileChange}
                disabled={loading}
              />
              <small className="form-hint">
                Upload multiple images or videos. Supported: PNG, JPG, MP4, MOV, etc.
              </small>
              
              {imageForm.files.length > 0 && (
                <div className="file-list" style={{ marginTop: "1rem" }}>
                  <p style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                    Selected files: {imageForm.files.length}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {imageForm.files.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "rgba(255,182,193,0.2)",
                          padding: "0.75rem",
                          borderRadius: "8px",
                          fontSize: "0.9rem",
                        }}
                      >
                        <span>{file.fileName}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          disabled={loading}
                          style={{
                            background: "#ff6b6b",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            padding: "0.4rem 0.8rem",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="image-caption">Caption</label>
              <input
                id="image-caption"
                type="text"
                placeholder="Describe the memory or moment"
                className={imageErrors.caption ? "input-error" : ""}
                value={imageForm.caption}
                onChange={(e) =>
                  setImageForm({ ...imageForm, caption: e.target.value })
                }
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="contribute-submit-btn"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        )}

        {/* Status Message */}
        {status && (
          <div
            className={`contribute-status ${
                  status.toLowerCase().includes("submitted") ? "success" : "error"
                }`}
          >
            {status}
          </div>
        )}
      </div>
    </section>
  );
};

export default ContributeSection;
