
import "./PropertyMap.css";

function PropertyMap({ latitude, longitude }) {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Validate coordinates before displaying the map.
  const isMissing = (value) =>
    value === null ||
    value === undefined ||
    String(value).trim() === "";

  if (isMissing(latitude) || isMissing(longitude)) {
    return (
      <p className="map-message">
        Location unavailable for this property.
      </p>
    );
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  // Reject invalid or placeholder coordinates.
  const validCoordinates =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    lat !== 0 &&
    lng !== 0;

  if (!validCoordinates) {
    return (
      <p className="map-message">
        Location unavailable for this property.
      </p>
    );
  }

  if (!apiKey) {
    return (
      <p className="map-message">
        Google Maps API key is not configured.
      </p>
    );
  }

  // Use the property's latitude and longitude.
  const coordinates = `${lat},${lng}`;

  // Google Maps Embed API URL.
  const embedUrl =
    "https://www.google.com/maps/embed/v1/place" +
    `?key=${encodeURIComponent(apiKey)}` +
    `&q=${encodeURIComponent(coordinates)}` +
    "&zoom=15";

  // External Google Maps directions URL.
  const directionsUrl =
    "https://www.google.com/maps/dir/?api=1" +
    `&destination=${encodeURIComponent(coordinates)}`;

  return (
    <div className="property-map">
      <iframe
        title="Property Location Map"
        src={embedUrl}
        width="100%"
        height="400"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />

      <div className="map-footer">
        <span className="map-coordinates">
          Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
        </span>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="directions-link"
        >
          Get Directions ↗
        </a>
      </div>
    </div>
  );
}

export default PropertyMap;
