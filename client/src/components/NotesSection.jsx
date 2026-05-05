import React from "react";

const NotesSection = ({
  notes = [],
  adminMessage = null,
  title = "Messages From Friends",
  emptyText = "No messages yet",
  emptyHint = "Birthday wishes from friends will appear here",
}) => {
  if (!notes || (notes.length === 0 && !adminMessage)) {
    return (
      <section id="notes" className="section active">
        <div className="notes-container">
          <h2 className="section-title">{title}</h2>
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p className="empty-state-text">{emptyText}</p>
            <p className="empty-state-hint">{emptyHint}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="notes" className="section active">
      <div className="notes-container">
        <h2 className="section-title">{title}</h2>
        <div className="friend-notes-grid">
          {/* PINNED ADMIN MESSAGE */}
          {adminMessage && (
            <article className="friend-card admin-message-card">
              <div
                className="friend-header"
                style={{
                  borderBottom: "3px solid #d4af37",
                  paddingBottom: "1rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                {adminMessage.imageUrl && adminMessage.imageMediaType !== "video" && (
                  <img
                    src={adminMessage.imageUrl}
                    alt="host avatar"
                    loading="eager"
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      border: "2px solid #d4af37",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div
                  className="friend-info"
                  style={{ flex: 1 }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
                      color: "#333",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "8px",
                      fontSize: "0.7rem",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      border: "2px solid #d4af37",
                      marginBottom: "0.5rem",
                      display: "block",
                      width: "fit-content",
                    }}
                  >
                    ✨ From Host ✨
                  </span>
                  <h3 className="friend-name" style={{ color: "#d4af37", margin: "0.5rem 0 0 0" }}>
                    📌 Special Message
                  </h3>
                </div>
              </div>
              <p
                className="friend-message"
                style={{
                  whiteSpace: "pre-wrap",
                  color: "#2b1f0f",
                  lineHeight: 1.7,
                  fontSize: "1rem",
                  textShadow: "0 1px 0 rgba(255,255,255,0.45)",
                  margin: 0,
                }}
              >
                {adminMessage.text}
              </p>
            </article>
          )}

          {/* GUEST MESSAGES */}
          {notes.map((note, index) => (
            <article key={`${note.name}-${index}`} className="friend-card">
              <div className="friend-header">
                <img
                  src={note.avatarUrl}
                  alt={note.name}
                  className="friend-avatar"
                />
                <div className="friend-info">
                  <h3 className="friend-name">{note.name}</h3>
                  <p className="friend-role">{note.role}</p>
                </div>
              </div>
              <p className="friend-message">{note.message}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NotesSection;
