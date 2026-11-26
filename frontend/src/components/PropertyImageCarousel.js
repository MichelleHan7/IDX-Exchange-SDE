
import { useState } from "react";
import { getPhotoUrls } from "../utils/photoUtils";
import "./PropertyImageCarousel.css";

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

  function handlePrevious(event) {
    event.preventDefault();
    event.stopPropagation();

    setCurrentIndex((previous) =>
      (previous - 1 + totalPhotos) % totalPhotos
    );
  }

  function handleNext(event) {
    event.preventDefault();
    event.stopPropagation();

    setCurrentIndex((previous) =>
      (previous + 1) % totalPhotos
    );
  }

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
      {currentPhoto && !imageFailed ? (
        <img
          src={currentPhoto}
          alt={`${alt || "Property"} - view ${safeIndex + 1}`}
          loading="lazy"
          onError={handleImageError}
        />
      ) : (
        <div className="photo-placeholder">
          No Photo Available
        </div>
      )}

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

      {totalPhotos > 0 && (
        <span className="carousel-counter">
          {safeIndex + 1} / {totalPhotos}
        </span>
      )}
    </div>
  );
}

export default PropertyImageCarousel;
