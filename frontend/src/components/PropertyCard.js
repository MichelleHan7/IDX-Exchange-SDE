
import { Link } from "react-router";
import PropertyImageCarousel from "./PropertyImageCarousel";
import "./PropertyCard.css";

function PropertyCard({ property }) {
  const price = Number(property.L_SystemPrice);

  const formattedPrice =
    property.L_SystemPrice != null &&
    Number.isFinite(price) &&
    price > 0
      ? `$${price.toLocaleString("en-US")}`
      : "Price unavailable";

  const formatStat = (value, unit) =>
    value === null || value === undefined || value === ""
      ? `${unit} N/A`
      : `${Number(value).toLocaleString("en-US")} ${unit}`;

  const location =
    [property.L_City, property.L_State]
      .filter(Boolean)
      .join(", ") || "Location unavailable";

  return (
    <article className="property-card">

      {/* Clickable overlay for property detail navigation */}
      <Link
        to={`/property/${property.L_ListingID}`}
        className="property-card-link"
        aria-label={`View details for ${
          property.L_Address || "property"
        }`}
      />

      {/* Multiple property photos */}
      <div className="property-image">
        <PropertyImageCarousel
          rawPhotos={property.L_Photos}
          alt={property.L_Address || "Property"}
        />
      </div>

      <div className="property-info">
        <h2>{formattedPrice}</h2>

        <p className="property-address">
          {property.L_Address || "Address unavailable"}
        </p>

        <p className="property-location">
          {location}
        </p>

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
