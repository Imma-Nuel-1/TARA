import React, { useEffect, useState } from "react";
import "./App.css";
import MainScreen from "./MainScreen";
import SecretCodeScreen from "./components/SecretCodeScreen";
import FloatingHearts from "./components/FloatingHearts";
import BirthdayPopup from "./components/BirthdayPopup";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import PreviewPage from "./components/PreviewPage";
import BirthdayIntro from "./components/BirthdayIntro";
import { useSiteContent } from "./hooks/useSiteContent";

const UNLOCK_STORAGE_KEY = "birthday_site_unlocked";

function App() {
  const path = window.location.pathname;
  const isAdminLoginRoute = path === "/admin/login";
  const isAdminDashboardRoute = path === "/admin/dashboard";
  const isAdminRootRoute = path === "/admin";
  const isPreviewRoute = path.startsWith("/preview/");

  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem(UNLOCK_STORAGE_KEY) === "true",
  );
  const [showPopup, setShowPopup] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [siteEnter, setSiteEnter] = useState(false);
  const { data: content, isLoading, isError, error } = useSiteContent();

  const onUnlock = () => {
    localStorage.setItem(UNLOCK_STORAGE_KEY, "true");
    setUnlocked(true);
    setShowPopup(true);
  };

  useEffect(() => {
    if (isAdminRootRoute) {
      window.location.href = "/admin/dashboard";
    }
  }, [isAdminRootRoute]);

  if (isPreviewRoute) {
    return <PreviewPage />;
  }

  if (isAdminLoginRoute) {
    return <AdminLogin />;
  }

  if (isAdminDashboardRoute) {
    return <AdminDashboard />;
  }

  if (isLoading) {
    return (
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
    );
  }

  if (isError) {
    return (
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
    );
  }

  const mainContent = (
    <div className={`site-shell${siteEnter ? " site-shell-enter" : ""}`}>
      <FloatingHearts />
      {!unlocked ? (
        <SecretCodeScreen
          onSuccess={onUnlock}
          secretCode={content?.secretCode}
        />
      ) : (
        <MainScreen content={content} />
      )}
      <BirthdayPopup
        open={showPopup}
        onClose={() => setShowPopup(false)}
        title={content?.title}
      />
    </div>
  );

  return (
    <div>
      {mainContent}
      {showIntro && (
        <BirthdayIntro
          onComplete={() => {
            setShowIntro(false);
            setSiteEnter(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
