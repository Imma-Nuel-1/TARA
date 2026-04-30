import React, { useState } from "react";
import LoveLetterSection from "./components/LoveLetterSection";
import MusicSection from "./components/MusicSection";
import NotesSection from "./components/NotesSection";
import GallerySection from "./components/GallerySection";
import ContributeSection from "./components/ContributeSection";

const NAV_SECTIONS = [
  { id: "love-letter", icon: "❤️", text: "Love Letter" },
  { id: "music", icon: "🎵", text: "Music" },
  { id: "notes", icon: "📝", text: "Notes" },
  { id: "gallery", icon: "🌷", text: "Gallery" },
  { id: "contribute", icon: "✨", text: "Contribute" },
];

const MainScreen = ({ content }) => {
  const [activeSection, setActiveSection] = useState("love-letter");

  return (
    <div id="main-screen" className="screen active">
      <div className="bg-gradient"></div>
      <header className="site-hero-banner">
        <p className="site-eyebrow">Celebration Experience</p>
        <h1 className="site-title type-serif">
          {content?.title || "Happy Birthday"}
        </h1>
        <p className="site-subtitle">
          A curated memory space with music, stories, and love notes.
        </p>
      </header>
      <nav className="top-nav">
        {NAV_SECTIONS.map((section) => (
          <button
            key={section.id}
            className={`nav-btn${activeSection === section.id ? " active" : ""}`}
            data-section={section.id}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="nav-icon">{section.icon}</span>
            <span className="nav-text">{section.text}</span>
          </button>
        ))}
      </nav>
      <main className="content-wrapper">
        {activeSection === "love-letter" && (
          <LoveLetterSection content={content?.loveLetter} />
        )}
        {activeSection === "music" && (
          <MusicSection playlist={content?.playlist || []} />
        )}
        {activeSection === "notes" && (
          <NotesSection notes={content?.notes || []} />
        )}
        {activeSection === "gallery" && (
          <GallerySection gallery={content?.gallery || []} />
        )}
        {activeSection === "contribute" && <ContributeSection />}
      </main>
      <footer className="site-footer">
        <div className="footer-content">
          <p className="footer-love">Made with ❤️ by Adesa</p>
          <p className="footer-year">&copy; {new Date().getFullYear()}</p>
          <p className="footer-message">
            Every moment with you is a treasure 💫
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainScreen;
