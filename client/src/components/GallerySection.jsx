import React, { useMemo, useState } from "react";

const GallerySection = ({ gallery = [] }) => {
  const [visibleCount, setVisibleCount] = useState(6);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const visibleItems = useMemo(
    () => gallery.slice(0, visibleCount),
    [gallery, visibleCount],
  );
  const hasMore = visibleCount < gallery.length;

  if (!gallery || gallery.length === 0) {
    return (
      <section id="gallery" className="section active">
        <div className="gallery-container">
          <h2 className="section-title">Our Memories</h2>
          <div className="empty-state">
            <div className="empty-state-icon">🌷</div>
            <p className="empty-state-text">No photos in the gallery yet</p>
            <p className="empty-state-hint">
              Beautiful memories will be displayed here soon
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="section active">
      <div className="gallery-container">
        <h2 className="section-title">Our Memories</h2>

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
              <img src={item.imageUrl} alt={item.caption} />
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

        {lightboxIndex >= 0 && (
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
              <img
                className="lightbox-image"
                src={visibleItems[lightboxIndex]?.imageUrl}
                alt={visibleItems[lightboxIndex]?.caption}
              />
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
          </div>
        )}
      </div>
    </section>
  );
};

export default GallerySection;
