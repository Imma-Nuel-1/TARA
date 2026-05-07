import React, { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

const isVideoItem = (item = {}) => {
  if (item.mediaType === "video") return true;
  const src = (item.imageUrl || "").toLowerCase();
  if (src.includes("/video/upload/")) return true;
  return /(\.mp4|\.mov|\.webm|\.m4v|\.mkv)(\?|$)/.test(src);
};

const GallerySection = ({
  gallery = [],
  musicRef,
  title = "Our Memories",
  emptyText = "No photos in the gallery yet",
  emptyHint = "Beautiful memories will be displayed here soon",
}) => {
  const [visibleCount, setVisibleCount] = useState(6);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const musicWasPlayingRef = useRef(false);
  const pausedByVideoRef = useRef(false);
  const scrollYRef = useRef(0);
  const prevLightboxIndexRef = useRef(lightboxIndex);

  const visibleItems = useMemo(
    () => gallery.slice(0, visibleCount),
    [gallery, visibleCount],
  );
  const hasMore = visibleCount < gallery.length;

  useEffect(() => {
    setVisibleCount((current) => Math.max(current, gallery.length || 6));
  }, [gallery.length]);

  const getItemLabel = (item = {}) => {
    const label = item.originalFileName || item.caption || "Shared memory";
    return label.replace(/\.[^/.]+$/, "");
  };

  const handleOpenLightbox = (index) => {
    const nextItem = visibleItems[index];
    const music = musicRef?.current;

    if (music && isVideoItem(nextItem)) {
      musicWasPlayingRef.current = !music.paused;
      pausedByVideoRef.current = true;
      if (!music.paused) {
        music.pause();
      }
    }

    setLightboxIndex(index);
  };

  const handleCloseLightbox = () => {
    const music = musicRef?.current;

    if (music && pausedByVideoRef.current) {
      if (musicWasPlayingRef.current) {
        music.play().catch(() => {});
      }
      musicWasPlayingRef.current = false;
      pausedByVideoRef.current = false;
    }

    setLightboxIndex(-1);
  };

  const onLightboxVideoPlay = () => {
    const music = musicRef?.current;
    if (!music) return;
    // Don't overwrite the original "was playing" flag set when opening the lightbox.
    // Only pause the music if it's currently playing and mark that we paused it.
    if (!music.paused) {
      musicWasPlayingRef.current = true;
      pausedByVideoRef.current = true;
      music.pause();
    } else {
      pausedByVideoRef.current = true;
    }
  };

  const onLightboxVideoPauseOrEnded = () => {
    const music = musicRef?.current;
    if (!music) return;
    if (pausedByVideoRef.current && musicWasPlayingRef.current) {
      music.play().catch(() => {});
    }
    musicWasPlayingRef.current = false;
    pausedByVideoRef.current = false;
  };

  // Hide navbar when lightbox is open
  useEffect(() => {
    const navbar = document.querySelector(".top-nav");
    if (!navbar) return;

    if (lightboxIndex >= 0) {
      scrollYRef.current = window.scrollY || window.pageYOffset || 0;
      navbar.style.visibility = "hidden";
      navbar.style.opacity = "0";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      navbar.style.visibility = "visible";
      navbar.style.opacity = "1";
      const restoreScrollY = Math.abs(parseInt(document.body.style.top || "0", 10)) || scrollYRef.current;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, restoreScrollY);
    }

    return () => {
      navbar.style.visibility = "visible";
      navbar.style.opacity = "1";
      const restoreScrollY = Math.abs(parseInt(document.body.style.top || "0", 10)) || scrollYRef.current;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, restoreScrollY);
    };
  }, [lightboxIndex]);

  useEffect(() => {
    const music = musicRef?.current;
    if (!music) return;

    if (lightboxIndex < 0 && pausedByVideoRef.current) {
      if (musicWasPlayingRef.current) {
        music.play().catch(() => {});
      }
      musicWasPlayingRef.current = false;
      pausedByVideoRef.current = false;
    }
  }, [lightboxIndex, musicRef, visibleItems]);

  // Handle switching between items inside the lightbox: if we move away from a video
  // to a non-video item, resume background music if we paused it; if we move into a video,
  // pause background music.
  useEffect(() => {
    const prevIndex = prevLightboxIndexRef.current;
    if (prevIndex === lightboxIndex) return;

    const prevItem = prevIndex >= 0 ? visibleItems[prevIndex] : null;
    const currItem = lightboxIndex >= 0 ? visibleItems[lightboxIndex] : null;
    const music = musicRef?.current;

    // switched away from video to non-video while still in lightbox
    if (prevItem && isVideoItem(prevItem) && !(currItem && isVideoItem(currItem))) {
      if (music && pausedByVideoRef.current) {
        if (musicWasPlayingRef.current) {
          music.play().catch(() => {});
        }
        musicWasPlayingRef.current = false;
        pausedByVideoRef.current = false;
      }
    }

    // switched into a video from a non-video while still in lightbox
    if (currItem && isVideoItem(currItem) && !(prevItem && isVideoItem(prevItem))) {
      if (music) {
        if (!music.paused) {
          musicWasPlayingRef.current = true;
          pausedByVideoRef.current = true;
          music.pause();
        } else {
          pausedByVideoRef.current = true;
        }
      }
    }

    prevLightboxIndexRef.current = lightboxIndex;
  }, [lightboxIndex, visibleItems, musicRef]);

  if (!gallery || gallery.length === 0) {
    return (
      <section id="gallery" className="section active">
        <div className="gallery-container">
          <h2 className="section-title">{title}</h2>
          <div className="empty-state">
            <div className="empty-state-icon">🌷</div>
            <p className="empty-state-text">{emptyText}</p>
            <p className="empty-state-hint">{emptyHint}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="section active">
      <div className="gallery-container">
        <h2 className="section-title">{title}</h2>

        <div className="gallery-grid">
          {visibleItems.map((item, index) => (
            <div
              key={`${item.caption}-${index}`}
              className="gallery-item"
              onClick={() => handleOpenLightbox(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleOpenLightbox(index);
              }}
            >
              {isVideoItem(item) ? (
                <video src={item.imageUrl} muted playsInline preload="metadata" />
              ) : (
                <img src={item.imageUrl} alt={item.caption} />
              )}
              <div className="gallery-overlay">
                <p>{item.caption}</p>
                {item.originalFileName && (
                  <span style={{ display: "block", fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                    {item.originalFileName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="load-more-container">
            <button
              type="button"
              className="load-more-btn"
              onClick={() => setVisibleCount((count) => count + 6)}
            >
              Load More Photos
            </button>
          </div>
        )}

        {lightboxIndex >= 0 &&
          createPortal(
            <div
              className="lightbox-modal show"
              onClick={handleCloseLightbox}
            >
              <div
                className="lightbox-content"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="lightbox-close"
                  onClick={handleCloseLightbox}
                >
                  x
                </button>
                <button
                  type="button"
                  className="lightbox-prev"
                  onClick={() =>
                    setLightboxIndex(
                      (idx) =>
                        (idx - 1 + visibleItems.length) % visibleItems.length,
                    )
                  }
                >
                  ❮
                </button>
                {isVideoItem(visibleItems[lightboxIndex]) ? (
                  <video
                    className="lightbox-image"
                    src={visibleItems[lightboxIndex]?.imageUrl}
                    controls
                    playsInline
                    autoPlay
                    onPlay={onLightboxVideoPlay}
                    onPause={onLightboxVideoPauseOrEnded}
                    onEnded={onLightboxVideoPauseOrEnded}
                  />
                ) : (
                  <img
                    className="lightbox-image"
                    src={visibleItems[lightboxIndex]?.imageUrl}
                    alt={visibleItems[lightboxIndex]?.caption}
                  />
                )}
                <button
                  type="button"
                  className="lightbox-next"
                  onClick={() =>
                    setLightboxIndex((idx) => (idx + 1) % visibleItems.length)
                  }
                >
                  ❯
                </button>
                <div className="lightbox-caption">
                  {visibleItems[lightboxIndex]?.caption}
                  {visibleItems[lightboxIndex]?.originalFileName && (
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                      {getItemLabel(visibleItems[lightboxIndex])}
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </section>
  );
};

export default GallerySection;
