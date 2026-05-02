import React from "react";

const NotesSection = ({
  notes = [],
  title = "Messages From Friends",
  emptyText = "No messages yet",
  emptyHint = "Birthday wishes from friends will appear here",
}) => {
  if (!notes || notes.length === 0) {
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
