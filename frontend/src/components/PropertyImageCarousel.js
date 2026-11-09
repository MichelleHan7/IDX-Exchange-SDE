
import { useState } from "react";
import "./PropertyImageCarousel.css";

// Safely parse photo URLs from the MLS JSON data.
function getPhotoUrls(rawPhotos) {
  if (!rawPhotos) return [];

  try {
    const parsed =
      typeof rawPhotos === "string"
        ? JSON.parse(rawPhotos)
        : rawPhotos;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((photo) => typeof photo === "string")
      .map((photo) => photo.trim())
      .filter((photo) => /^https?:\/\/\S+$/i.test(photo));
  } catch {
    return [];
  }
}

function PropertyImageCarousel({ rawPhotos, alt }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState([]);

  const photos = getPhotoUrls(rawPhotos);
  const totalPhotos = photos.length;

  const safeIndex =
    totalPhotos > 0 ? currentIndex % totalPhotos : 0;

  const currentPhoto =
    totalPhotos > 0 ? photos[safeIndex] : null;

  const imageFailed =
    currentPhoto && failedPhotos.includes(currentPhoto);

  // Navigate to the previous photo.
  function handlePrevious(event) {
    event.preventDefault();
    event.stopPropagation();

    setCurrentIndex((previous) =>
      (previous - 1 + totalPhotos) % totalPhotos
    );
  }

  // Navigate to the next photo.
  function handleNext(event) {
    event.preventDefault();
    event.stopPropagation();

    setCurrentIndex((previous) =>
      (previous + 1) % totalPhotos
    );
  }

  // Remember images that cannot be loaded.
  function handleImageError() {
    if (!currentPhoto) return;

    setFailedPhotos((previous) =>
      previous.includes(currentPhoto)
        ? previous
        : [...previous, currentPhoto]
    );
  }

  return (
    <div className="property-image-carousel">

      {/* Current property photo */}
      {currentPhoto && !imageFailed ? (
        <img
          src={currentPhoto}
          alt={`${alt || "Property"} - photo ${safeIndex + 1}`}
          loading="lazy"
          onError={handleImageError}
        />
      ) : (
        <div className="photo-placeholder">
          No Photo Available
        </div>
      )}

      {/* Navigation arrows for multiple photos */}
      {totalPhotos > 1 && (
        <>
          <button
            type="button"
            className="carousel-arrow carousel-prev"
            onClick={handlePrevious}
            aria-label="Previous photo"
          >
            &#10094;
          </button>

          <button
            type="button"
            className="carousel-arrow carousel-next"
            onClick={handleNext}
            aria-label="Next photo"
          >
            &#10095;
          </button>
        </>
      )}

      {/* Photo counter */}
      {totalPhotos > 0 && (
        <span className="carousel-counter">
          {safeIndex + 1} / {totalPhotos}
        </span>
      )}

    </div>
  );
}

export default PropertyImageCarousel;
