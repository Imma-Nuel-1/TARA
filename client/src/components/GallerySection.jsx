import React, { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

const isVideoItem = (item = {}) => {
  if (item.mediaType === "video") return true;
  const src = (item.imageUrl || "").toLowerCase();
  return /(\.mp4|\.mov|\.webm|\.m4v)(\?|$)/.test(src);
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

  const visibleItems = useMemo(
    () => gallery.slice(0, visibleCount),
    [gallery, visibleCount],
  );
  const hasMore = visibleCount < gallery.length;

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

    const activeItem = lightboxIndex >= 0 ? visibleItems[lightboxIndex] : null;
    const showingVideo = Boolean(activeItem && isVideoItem(activeItem));

    if (showingVideo) {
      if (!pausedByVideoRef.current) {
        musicWasPlayingRef.current = !music.paused;
      }

      if (musicWasPlayingRef.current && !music.paused) {
        music.pause();
      }

      pausedByVideoRef.current = true;
      return;
    }

    if (pausedByVideoRef.current) {
      pausedByVideoRef.current = false;
      if (musicWasPlayingRef.current) {
        music.play().catch(() => {});
      }
      musicWasPlayingRef.current = false;
    }
  }, [lightboxIndex, musicRef, visibleItems]);

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
              onClick={() => setLightboxIndex(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") setLightboxIndex(index);
              }}
            >
              {isVideoItem(item) ? (
                <video src={item.imageUrl} muted playsInline preload="metadata" />
              ) : (
                <img src={item.imageUrl} alt={item.caption} />
              )}
              <div className="gallery-overlay">
                <p>{item.caption}</p>
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
              onClick={() => setLightboxIndex(-1)}
            >
              <div
                className="lightbox-content"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="lightbox-close"
                  onClick={() => setLightboxIndex(-1)}
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
