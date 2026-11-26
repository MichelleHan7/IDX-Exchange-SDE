
import { useEffect, useMemo, useRef, useState } from "react";
import { getPhotoUrls } from "../utils/photoUtils";
import "./PropertyImageGallery.css";

function PropertyImageGallery({ rawPhotos, alt = "Property" }) {
  const photos = useMemo(
    () => getPhotoUrls(rawPhotos),
    [rawPhotos]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [failedPhotos, setFailedPhotos] = useState([]);

  const closeButtonRef = useRef(null);

  const totalPhotos = photos.length;

  const currentIndex =
    totalPhotos > 0
      ? Math.min(selectedIndex, totalPhotos - 1)
      : 0;

  const currentPhoto =
    totalPhotos > 0 ? photos[currentIndex] : null;

  const imageFailed =
    currentPhoto && failedPhotos.includes(currentPhoto);

  function handleImageError() {
    if (!currentPhoto) return;

    setFailedPhotos((previous) =>
      previous.includes(currentPhoto)
        ? previous
        : [...previous, currentPhoto]
    );
  }

  function changePhoto(direction) {
    if (totalPhotos <= 1) return;

    setSelectedIndex((previous) =>
      (previous + direction + totalPhotos) % totalPhotos
    );
  }

  function openLightbox() {
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      }

      if (event.key === "ArrowRight" && totalPhotos > 1) {
        event.preventDefault();

        setSelectedIndex((previous) =>
          (previous + 1) % totalPhotos
        );
      }

      if (event.key === "ArrowLeft" && totalPhotos > 1) {
        event.preventDefault();

        setSelectedIndex((previous) =>
          (previous - 1 + totalPhotos) % totalPhotos
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxOpen, totalPhotos]);

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeLightbox();
    }
  }

  if (totalPhotos === 0) {
    return (
      <div className="property-gallery">
        <div className="gallery-empty">
          No Photos Available
        </div>
      </div>
    );
  }

  return (
    <div className="property-gallery">
      <button
        type="button"
        className="gallery-main-button"
        onClick={openLightbox}
        aria-label="Open full-screen photo gallery"
      >
        {imageFailed ? (
          <div className="gallery-placeholder">
            Image Unavailable
          </div>
        ) : (
          <img
            src={currentPhoto}
            alt={`${alt} - view ${currentIndex + 1}`}
            onError={handleImageError}
          />
        )}

        <span className="gallery-expand-hint">
          Click to enlarge
        </span>
      </button>

      <div className="gallery-counter">
        {currentIndex + 1} / {totalPhotos} Photos
      </div>

      {totalPhotos > 1 && (
        <div
          className="gallery-thumbnails"
          aria-label="Property photo thumbnails"
        >
          {photos.map((photo, index) => (
            <button
              key={`${photo}-${index}`}
              type="button"
              className={`gallery-thumbnail ${
                index === currentIndex ? "active" : ""
              }`}
              onClick={() => setSelectedIndex(index)}
              aria-label={`Show photo ${index + 1} of ${totalPhotos}`}
              aria-pressed={index === currentIndex}
            >
              {failedPhotos.includes(photo) ? (
                <span className="thumbnail-placeholder">
                  Unavailable
                </span>
              ) : (
                <img
                  src={photo}
                  alt=""
                  loading="lazy"
                  onError={() =>
                    setFailedPhotos((previous) =>
                      previous.includes(photo)
                        ? previous
                        : [...previous, photo]
                    )
                  }
                />
              )}
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Full-screen property photos"
          onClick={handleBackdropClick}
        >
          <div className="gallery-lightbox-content">
            <button
              ref={closeButtonRef}
              type="button"
              className="lightbox-close"
              onClick={closeLightbox}
              aria-label="Close photo gallery"
            >
              ×
            </button>

            {totalPhotos > 1 && (
              <button
                type="button"
                className="lightbox-arrow lightbox-prev"
                onClick={() => changePhoto(-1)}
                aria-label="Previous full-screen photo"
              >
                &#10094;
              </button>
            )}

            <div className="lightbox-image-container">
              {imageFailed ? (
                <div className="lightbox-placeholder">
                  Image Unavailable
                </div>
              ) : (
                <img
                  src={currentPhoto}
                  alt={`${alt} - view ${currentIndex + 1}`}
                  onError={handleImageError}
                />
              )}
            </div>

            {totalPhotos > 1 && (
              <button
                type="button"
                className="lightbox-arrow lightbox-next"
                onClick={() => changePhoto(1)}
                aria-label="Next full-screen photo"
              >
                &#10095;
              </button>
            )}

            <div className="lightbox-counter">
              {currentIndex + 1} / {totalPhotos}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyImageGallery;
