import PropTypes from "prop-types";
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
      <Link
        to={`/property/${property.L_ListingID}`}
        className="property-card-link"
        aria-label={`View details for ${
          property.L_Address || "property"
        }`}
      />

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

const numericPropType = PropTypes.oneOfType([
  PropTypes.number,
  PropTypes.string,
]);

PropertyCard.propTypes = {
  property: PropTypes.shape({
    L_ListingID: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]).isRequired,
    L_SystemPrice: numericPropType,
    L_Address: PropTypes.string,
    L_City: PropTypes.string,
    L_State: PropTypes.string,
    L_Keyword2: numericPropType,
    LM_Dec_3: numericPropType,
    LM_Int2_3: numericPropType,
    L_Photos: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
    ]),
  }).isRequired,
};

export default PropertyCard;
