import React from "react";

const LoveLetterSection = ({ content }) => {
  return (
    <section id="love-letter" className="section active">
      <div className="love-letter-container">
        <h1 className="letter-title">{content?.heading}</h1>
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
