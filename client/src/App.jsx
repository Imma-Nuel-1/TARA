import React, { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import MainScreen from "./MainScreen";
import AccessGateScreen from "./components/AccessGateScreen";
import FloatingHearts from "./components/FloatingHearts";
import BirthdayPopup from "./components/BirthdayPopup";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import PreviewPage from "./components/PreviewPage";
import BirthdayIntro from "./components/BirthdayIntro";
import RotateDeviceScreen from "./components/RotateDeviceScreen";
import CodeIntro from "./components/CodeIntro";
import { useSiteContent } from "./hooks/useSiteContent";

const ACCESS_MODE_STORAGE_KEY = "birthday_site_access_mode";
const GUEST_CONTENT_STORAGE_KEY = "birthday_site_guest_content";
const GUEST_PROGRESS_STORAGE_KEY = "birthday_site_guest_progress";

const isReloadNavigation = (() => {
  try {
    const entry = window.performance?.getEntriesByType?.("navigation")?.[0];
    return entry?.type === "reload" || window.performance?.navigation?.type === 1;
  } catch {
    return false;
  }
})();

function readGuestContent() {
  try {
    const raw = localStorage.getItem(GUEST_CONTENT_STORAGE_KEY);
    if (!raw) return { notes: [], gallery: [] };
    const parsed = JSON.parse(raw);
    return {
      notes: Array.isArray(parsed?.notes) ? parsed.notes : [],
      gallery: Array.isArray(parsed?.gallery) ? parsed.gallery : [],
    };
  } catch {
    return { notes: [], gallery: [] };
  }
}

function readGuestProgress() {
  try {
    const raw = localStorage.getItem(GUEST_PROGRESS_STORAGE_KEY);
    if (!raw) return { messageDone: false, imageDone: false };
    const parsed = JSON.parse(raw);
    return {
      messageDone: Boolean(parsed?.messageDone),
      imageDone: Boolean(parsed?.imageDone),
    };
  } catch {
    return { messageDone: false, imageDone: false };
  }
}

function serializeNote(note = {}) {
  return [
    note.name || "",
    note.role || "",
    note.message || "",
    note.avatarUrl || "",
  ].join("|");
}

function serializeGalleryItem(item = {}) {
  return [
    item.imageUrl || "",
    item.caption || "",
    item.mediaType || "image",
  ].join("|");
}

function App() {
  const [accessMode, setAccessMode] = useState(() => {
    if (isReloadNavigation) {
      localStorage.removeItem(ACCESS_MODE_STORAGE_KEY);
      return "";
    }

    return localStorage.getItem(ACCESS_MODE_STORAGE_KEY) === "guest" ? "guest" : "";
  });
  const [guestContent, setGuestContent] = useState(() => readGuestContent());
  const [guestProgress, setGuestProgress] = useState(() => readGuestProgress());
  const [guestUnlockTick, setGuestUnlockTick] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [siteEnter, setSiteEnter] = useState(false);
  const [codeIntroCompleted, setCodeIntroCompleted] = useState(false);
  const musicRef = useRef(null);
  const [isLandscape, setIsLandscape] = useState(() =>
    window.innerWidth >= window.innerHeight,
  );
  // Only enforce landscape orientation on tablet+ devices.
  const [enforceLandscape, setEnforceLandscape] = useState(() =>
    window.innerWidth >= 768,
  );
  const { data: content, isLoading, isError, error } = useSiteContent();

  useEffect(() => {
    const updateOrientation = () => {
      setIsLandscape(window.innerWidth >= window.innerHeight);
      setEnforceLandscape(window.innerWidth >= 768);
    };

    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);

    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  useEffect(() => {
    if (!content) return;

    const serverNotes = new Set((content.notes || []).map(serializeNote));
    const serverGallery = new Set((content.gallery || []).map(serializeGalleryItem));

    queueMicrotask(() => {
      setGuestContent((current) => {
        const currentNotes = Array.isArray(current?.notes) ? current.notes : [];
        const currentGallery = Array.isArray(current?.gallery) ? current.gallery : [];

        const nextNotes = currentNotes.filter((note) =>
          serverNotes.has(serializeNote(note)),
        );
        const nextGallery = currentGallery.filter((item) =>
          serverGallery.has(serializeGalleryItem(item)),
        );

        const changed =
          nextNotes.length !== currentNotes.length ||
          nextGallery.length !== currentGallery.length;

        if (!changed) {
          return current;
        }

        const nextContent = {
          notes: nextNotes,
          gallery: nextGallery,
        };

        localStorage.setItem(GUEST_CONTENT_STORAGE_KEY, JSON.stringify(nextContent));

        if (nextNotes.length === 0 && nextGallery.length === 0) {
          const resetProgress = { messageDone: false, imageDone: false };
          setGuestProgress(resetProgress);
          localStorage.setItem(
            GUEST_PROGRESS_STORAGE_KEY,
            JSON.stringify(resetProgress),
          );
        }

        return nextContent;
      });
    });
  }, [content]);

  const persistAccessMode = (mode) => {
    if (mode === "guest") {
      localStorage.setItem(ACCESS_MODE_STORAGE_KEY, "guest");
      setShowPopup(true);
    } else {
      localStorage.removeItem(ACCESS_MODE_STORAGE_KEY);
    }

    setAccessMode(mode);
  };

  const handleCodeIntroComplete = () => {
    setCodeIntroCompleted(true);
  };

  const handleMusicStart = async () => {
    const audio = musicRef.current;
    if (!audio) {
      throw new Error("Music player is not available.");
    }

    audio.loop = true;
    audio.preload = "auto";
    audio.currentTime = 10;

    try {
      await audio.play();
    } catch (err) {
      // AbortError can occur when interrupting or changing sources
      // This is not a critical error, just log and continue
      if (err.name !== 'AbortError') {
        console.warn('Music playback warning:', err.message);
      }
    }
  };


  const handleContributionSaved = (item) => {
    if (!item) return;

    setGuestContent((current) => {
      const nextContent = { ...current };

      if (item.type === "message" && item.note) {
        nextContent.notes = [item.note, ...(current.notes || [])];
      }

      if (item.type === "image" && item.galleryItem) {
        nextContent.gallery = [item.galleryItem, ...(current.gallery || [])];
      }

      localStorage.setItem(GUEST_CONTENT_STORAGE_KEY, JSON.stringify(nextContent));
      return nextContent;
    });

    if (accessMode === "guest") {
      setGuestProgress((current) => {
        const nextProgress = { ...current };

        if (item.type === "message") nextProgress.messageDone = true;
        if (item.type === "image") nextProgress.imageDone = true;

        if (item.type === "image" && current.messageDone && !current.imageDone) {
          setGuestUnlockTick((value) => value + 1);
        }

        localStorage.setItem(
          GUEST_PROGRESS_STORAGE_KEY,
          JSON.stringify(nextProgress),
        );
        return nextProgress;
      });
    }
  };

  const mainContent = (
    <div className={`site-shell${siteEnter ? " site-shell-enter" : ""}`}>
      <audio ref={musicRef} src="/music/track.mp3" preload="auto" loop />
      <FloatingHearts />
      {!accessMode ? (
        <AccessGateScreen
          onAllowFullAccess={() => persistAccessMode("full")}
          onAllowGuestAccess={() => persistAccessMode("guest")}
        />
      ) : accessMode === "full" && !codeIntroCompleted ? (
        <CodeIntro onComplete={handleCodeIntroComplete} onStartMusic={handleMusicStart} />
      ) : (
        <MainScreen
          content={content}
          viewerMode={accessMode}
          guestContent={guestContent}
          guestProgress={guestProgress}
          guestUnlockTick={guestUnlockTick}
          musicRef={musicRef}
          onContributionSaved={handleContributionSaved}
          hideContribute={accessMode === "full"}
        />
      )}
    </div>
  );

  return (
    <Routes>
      <Route path="/preview/:previewId" element={<PreviewPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        path="*"
        element={
          <div>
            {enforceLandscape && !isLandscape && <RotateDeviceScreen />}
            {isLoading ? (
              <main className="app-state">
                <div className="loading-container">
                  <div className="loading-hearts">
                    <span>❤️</span>
                    <span>💕</span>
                    <span>💖</span>
                  </div>
                  <p className="loading-text">Loading something special...</p>
                </div>
              </main>
            ) : isError ? (
              <main className="app-state">
                <div className="error-container">
                  <div className="error-icon">⚠️</div>
                  <h2>Oops! Couldn't load the content</h2>
                  <p>{error.message}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="error-retry-btn"
                  >
                    Try Again
                  </button>
                </div>
              </main>
            ) : (
              mainContent
            )}
            <BirthdayPopup
              open={showPopup}
              onClose={() => setShowPopup(false)}
              title={content?.title}
            />
            {showIntro && (!enforceLandscape || isLandscape) && (
              <BirthdayIntro
                onComplete={() => {
                  setShowIntro(false);
                  setSiteEnter(true);
                }}
              />
            )}
          </div>
        }
      />
    </Routes>
  );
}

export default App;
