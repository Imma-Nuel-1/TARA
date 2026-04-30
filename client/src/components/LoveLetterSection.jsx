import React from "react";

const LoveLetterSection = ({ content }) => {
  const hasContent =
    content?.heading || (content?.paragraphs && content.paragraphs.length > 0);

  if (!hasContent) {
    return (
      <section id="love-letter" className="section active">
        <div className="love-letter-container">
          <div className="empty-state">
            <div className="empty-state-icon">💌</div>
            <p className="empty-state-text">No love letter yet</p>
            <p className="empty-state-hint">
              The birthday letter will appear here soon
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="love-letter" className="section active">
      <div className="love-letter-container">
        <h1 className="letter-title">
          {content?.heading || "My Dearest Temini"}
        </h1>
        <div className="letter-content">
          {(content?.paragraphs || []).map((paragraph, index) => (
            <p key={index} className="love-message">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LoveLetterSection;
