import React, { useEffect, useMemo, useState } from "react";
import LoveLetterSection from "./components/LoveLetterSection";
import NotesSection from "./components/NotesSection";
import GallerySection from "./components/GallerySection";
import ContributeSection from "./components/ContributeSection";
import GuestCodeUpgrade from "./components/GuestCodeUpgrade";

const NAV_SECTIONS = [
  { id: "love-letter", icon: "❤️", text: "Love Letter" },
  { id: "notes", icon: "📝", text: "Notes" },
  { id: "gallery", icon: "🌷", text: "Gallery" },
  { id: "contribute", icon: "✨", text: "Contribute" },
];

const GUEST_NAV_SECTIONS = [
  { id: "notes", icon: "📝", text: "All Messages" },
  { id: "gallery", icon: "🌷", text: "All Gallery" },
  { id: "contribute", icon: "✨", text: "Contribute" },
];

const MainScreen = ({
  content,
  viewerMode = "full",
  guestContent,
  guestProgress,
  guestUnlockTick = 0,
  musicRef,
  onContributionSaved,
  onGuestUpgradeRequest,
  hideContribute = false,
}) => {
  const isGuestMode = viewerMode === "guest";
  const guestUnlocked =
    !isGuestMode || (guestProgress?.messageDone && guestProgress?.imageDone);
  
  // Filter out contribute section if hideContribute is true
  const fullNavSections = hideContribute
    ? NAV_SECTIONS.filter(s => s.id !== "contribute")
    : NAV_SECTIONS;
  const guestNavSections = hideContribute
    ? GUEST_NAV_SECTIONS.filter(s => s.id !== "contribute")
    : GUEST_NAV_SECTIONS;
  
  const navSections =
    isGuestMode && !guestUnlocked
      ? [{ id: "contribute", icon: "✨", text: "Contribute" }]
      : isGuestMode
        ? guestNavSections
        : fullNavSections;
  
  const [activeSection, setActiveSection] = useState(
    isGuestMode ? "contribute" : "love-letter",
  );
  const [showCodeUpgrade, setShowCodeUpgrade] = useState(false);

  useEffect(() => {
    if (isGuestMode && !guestUnlocked) {
      setActiveSection("contribute");
    }
  }, [isGuestMode, guestUnlocked]);

  useEffect(() => {
    if (isGuestMode && guestUnlockTick > 0) {
      setActiveSection("notes");
    }
  }, [isGuestMode, guestUnlockTick]);

  const guestStep = useMemo(() => {
    if (!isGuestMode || guestUnlocked) return "free";
    return guestProgress?.messageDone ? "image" : "message";
  }, [isGuestMode, guestUnlocked, guestProgress]);

  const notes = useMemo(() => {
    const publicNotes = content?.notes || [];
    const personalNotes = guestContent?.notes || [];

    if (!isGuestMode) return publicNotes;
    if (!guestUnlocked) return personalNotes;

    const seen = new Set();
    const merged = [];
    [...personalNotes, ...publicNotes].forEach((note) => {
      const key = `${note?.name || ""}|${note?.message || ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(note);
      }
    });
    return merged;
  }, [isGuestMode, guestUnlocked, guestContent, content]);

  const gallery = useMemo(() => {
    const publicGallery = content?.gallery || [];
    const personalGallery = guestContent?.gallery || [];

    if (!isGuestMode) return publicGallery;
    if (!guestUnlocked) return personalGallery;

    const seen = new Set();
    const merged = [];
    [...personalGallery, ...publicGallery].forEach((item) => {
      const key = `${item?.imageUrl || ""}|${item?.caption || ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    });
    return merged;
  }, [isGuestMode, guestUnlocked, guestContent, content]);

  return (
    <div id="main-screen" className="screen active">
      <div className="bg-gradient"></div>
      <header className="site-hero-banner">
        <p className="site-eyebrow">
          {isGuestMode ? "Guest Access" : "Celebration Experience"}
        </p>
        <h1 className="site-title type-serif">
          {content?.title || "Happy Birthday"}
        </h1>
        <p className="site-subtitle">
          {isGuestMode
            ? guestUnlocked
              ? "You can now view everyone's messages and uploads, including yours."
              : guestStep === "message"
                ? "Step 1 of 2: Submit your message first to continue."
                : "Step 2 of 2: Upload at least one photo or video to unlock the full gallery and messages."
            : "A curated memory space with music, stories, and love notes."}
        </p>
        {isGuestMode && (
          <button 
            className="guest-code-btn"
            onClick={() => setShowCodeUpgrade(true)}
            title="Enter code to unlock full access"
          >
            🔑 Have a code?
          </button>
        )}
      </header>
      <nav className="top-nav">
        {navSections.map((section) => (
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
        {activeSection === "notes" && (
          guestUnlocked ? (
            <NotesSection
              notes={notes}
              title={isGuestMode ? "All Messages" : "Messages From Friends"}
              emptyText={isGuestMode ? "No messages yet" : "No messages yet"}
              emptyHint={
                isGuestMode
                  ? "All birthday messages, including yours, will appear here"
                  : "Birthday wishes from friends will appear here"
              }
            />
          ) : (
            <div className="locked-section-card">
              <h2 className="section-title">Messages Unlocked After Contribution</h2>
              <p>Complete your message and upload first to unlock this area.</p>
            </div>
          )
        )}
        {activeSection === "gallery" && (
          guestUnlocked ? (
            <GallerySection
              gallery={gallery}
              musicRef={musicRef}
              title={isGuestMode ? "All Gallery" : "Our Memories"}
              emptyText={isGuestMode ? "No photos yet" : "No photos in the gallery yet"}
              emptyHint={
                isGuestMode
                  ? "All shared photos and videos, including yours, will appear here"
                  : "Beautiful memories will be displayed here soon"
              }
            />
          ) : (
            <div className="locked-section-card">
              <h2 className="section-title">Gallery Unlocked After Contribution</h2>
              <p>Complete your message and upload first to unlock this area.</p>
            </div>
          )
        )}
        {activeSection === "contribute" && !hideContribute && (
          <ContributeSection
            onContributionSaved={onContributionSaved}
            enforcedStep={guestStep}
          />
        )}
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

      <GuestCodeUpgrade 
        isOpen={showCodeUpgrade}
        onClose={() => setShowCodeUpgrade(false)}
        onUpgrade={() => {
          setShowCodeUpgrade(false);
          onGuestUpgradeRequest?.();
        }}
      />
    </div>
  );
};

export default MainScreen;
