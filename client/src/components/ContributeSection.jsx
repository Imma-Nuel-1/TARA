import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ContributeSection = () => {
  const [activeForm, setActiveForm] = useState("message");
  const [messageForm, setMessageForm] = useState({
    name: "",
    message: "",
  });
  const [imageForm, setImageForm] = useState({
    name: "",
    imageUrl: "",
    caption: "",
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (!messageForm.name || !messageForm.message) {
      setStatus("Please fill in all fields");
      return;
    }

    setLoading(true);
    setStatus("Submitting your message...");

    try {
      const res = await fetch(`${API_BASE}/api/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "message",
          title: `Message from ${messageForm.name}`,
          data: messageForm.message,
          createdBy: messageForm.name,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("✅ Message submitted! It will appear after admin approval.");
        setMessageForm({ name: "", message: "" });
      } else {
        setStatus(`❌ Failed to submit: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      setStatus("❌ Connection error. Please try again.");
    }

    setLoading(false);
  };

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    if (!imageForm.name || !imageForm.imageUrl || !imageForm.caption) {
      setStatus("Please fill in all fields");
      return;
    }

    setLoading(true);
    setStatus("Submitting your photo...");

    try {
      const res = await fetch(`${API_BASE}/api/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "image",
          title: `Photo from ${imageForm.name}`,
          data: {
            url: imageForm.imageUrl,
            caption: imageForm.caption,
          },
          createdBy: imageForm.name,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("✅ Photo submitted! It will appear after admin approval.");
        setImageForm({ name: "", imageUrl: "", caption: "" });
      } else {
        setStatus(`❌ Failed to submit: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      setStatus("❌ Connection error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <section id="contribute" className="section active">
      <div className="contribute-container">
        <h2 className="section-title">Leave Your Mark</h2>
        <p className="contribute-subtitle">
          Share a birthday message or photo memory!
        </p>

        {/* Tab Switcher */}
        <div className="contribute-tabs">
          <button
            type="button"
            className={`contribute-tab ${activeForm === "message" ? "active" : ""}`}
            onClick={() => {
              setActiveForm("message");
              setStatus("");
            }}
          >
            💌 Leave a Message
          </button>
          <button
            type="button"
            className={`contribute-tab ${activeForm === "image" ? "active" : ""}`}
            onClick={() => {
              setActiveForm("image");
              setStatus("");
            }}
          >
            📸 Share a Photo
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
                value={messageForm.name}
                onChange={(e) =>
                  setMessageForm({ ...messageForm, name: e.target.value })
                }
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
              {loading ? "Submitting..." : "Submit Message 💌"}
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
                value={imageForm.name}
                onChange={(e) =>
                  setImageForm({ ...imageForm, name: e.target.value })
                }
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="image-url">Photo URL</label>
              <input
                id="image-url"
                type="url"
                placeholder="https://example.com/your-photo.jpg"
                value={imageForm.imageUrl}
                onChange={(e) =>
                  setImageForm({ ...imageForm, imageUrl: e.target.value })
                }
                disabled={loading}
                required
              />
              <small className="form-hint">
                Upload your photo to a service like Imgur, Google Photos, or
                Dropbox and paste the link here
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="image-caption">Caption</label>
              <input
                id="image-caption"
                type="text"
                placeholder="Describe the memory or moment"
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
              {loading ? "Submitting..." : "Submit Photo 📸"}
            </button>
          </form>
        )}

        {/* Status Message */}
        {status && (
          <div
            className={`contribute-status ${
              status.includes("✅") ? "success" : "error"
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
