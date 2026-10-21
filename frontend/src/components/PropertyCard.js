
import { useState } from "react";
import "./PropertyCard.css";

// Safely extract the first photo URL from L_Photos.
function getFirstPhoto(rawPhotos) {
  if (!rawPhotos) return null;
  try {
    const photos =
      typeof rawPhotos === "string"
        ? JSON.parse(rawPhotos)
        : rawPhotos;

    if (!Array.isArray(photos) || photos.length === 0) {
      return null;
    }
    const firstPhoto = photos[0];
    return typeof firstPhoto === "string" &&
      /^https?:\/\//i.test(firstPhoto.trim())
      ? firstPhoto.trim()
      : null;
  } catch {
    return null;
  }
}

function PropertyCard({ property }) {
  const [imageFailed, setImageFailed] = useState(false);

  const photo = getFirstPhoto(property.L_Photos);

  const price = Number(property.L_SystemPrice);

  const formattedPrice =
    property.L_SystemPrice != null && Number.isFinite(price) && price > 0
      ? `$${price.toLocaleString("en-US")}`
      : "Price unavailable";

  const formatStat = (value, unit) =>
    value === null || value === undefined || value === ""
      ? `${unit} N/A`
      : `${Number(value).toLocaleString("en-US")} ${unit}`;

  const location =
    [property.L_City, property.L_State].filter(Boolean).join(", ") ||
    "Location unavailable";

  return (
    <article className="property-card">
      <div className="property-image">
        {photo && !imageFailed ? (
          <img
            src={photo}
            alt={property.L_Address || "Property"}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="photo-placeholder">
            No Photo Available
          </div>
        )}
      </div>

      <div className="property-info">
        <h2>{formattedPrice}</h2>

        <p className="property-address">
          {property.L_Address || "Address unavailable"}
        </p>

        <p className="property-location">{location}</p>

        <div className="property-stats">
          <span>{formatStat(property.L_Keyword2, "beds")}</span>
          <span>{formatStat(property.LM_Dec_3, "baths")}</span>
          <span>{formatStat(property.LM_Int2_3, "sqft")}</span>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;
