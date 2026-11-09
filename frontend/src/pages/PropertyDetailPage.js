
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { fetchPropertyDetail } from "../api/client";
import PropertyImageGallery from "../components/PropertyImageGallery";
import PropertyMap from "../components/PropertyMap";
import PropertyOpenHouses from "../components/PropertyOpenHouses";

import "./PropertyDetailPage.css";

function PropertyDetailPage() {
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch property data when the listing ID changes.
  useEffect(() => {
    let ignore = false;

    async function loadProperty() {
      setLoading(true);
      setError("");
      setProperty(null);

      try {
        const data = await fetchPropertyDetail(id);

        if (!ignore) {
          setProperty(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProperty();

    return () => {
      ignore = true;
    };
  }, [id]);

  // Format numeric fields.
  const formatNumber = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "N/A";
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number.toLocaleString("en-US")
      : "N/A";
  };

  // Format property prices.
  const formatPrice = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "Price unavailable";
    }

    const price = Number(value);

    return Number.isFinite(price) && price > 0
      ? `$${price.toLocaleString("en-US")}`
      : "Price unavailable";
  };

  return (
    <main className="detail-page">
      <Link to="/" className="back-link">
        ← Back to Listings
      </Link>

      {loading ? (
        <p role="status">
          Loading property details...
        </p>
      ) : error ? (
        <div role="alert" className="detail-error">
          <h2>Unable to load property</h2>
          <p>{error}</p>
        </div>
      ) : !property ? (
        <p role="status">Property not found.</p>
      ) : (
        <>
          {/* Property header */}
          <header className="detail-header">
            <h1>
              {formatPrice(property.L_SystemPrice)}
            </h1>

            <p className="detail-address">
              {property.L_Address ||
                "Address unavailable"}
            </p>

            <p className="detail-location">
              {[
                property.L_City,
                property.L_State,
                property.L_Zip,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>

            <p className="listing-id">
              Listing ID: {property.L_ListingID}
            </p>
          </header>

          {/* Property image gallery */}
          <section aria-label="Property Photos">
            <PropertyImageGallery
              key={property.L_ListingID}
              rawPhotos={property.L_Photos}
              alt={property.L_Address || "Property"}
            />
          </section>

          {/* Property overview */}
          <section className="detail-section">
            <h2>Property Overview</h2>

            <div className="detail-stats">
              <div className="stat-item">
                <strong>
                  {formatNumber(property.L_Keyword2)}
                </strong>
                <span>Bedrooms</span>
              </div>

              <div className="stat-item">
                <strong>
                  {formatNumber(property.LM_Dec_3)}
                </strong>
                <span>Bathrooms</span>
              </div>

              <div className="stat-item">
                <strong>
                  {formatNumber(property.LM_Int2_3)}
                </strong>
                <span>Sqft</span>
              </div>

              <div className="stat-item">
                <strong>
                  {formatNumber(property.YearBuilt)}
                </strong>
                <span>Year Built</span>
              </div>
            </div>
          </section>

          {/* Additional property details */}
          <section className="detail-section">
            <h2>Property Details</h2>

            <div className="detail-info-grid">
              <p>
                <strong>Listing ID:</strong>{" "}
                {property.L_ListingID}
              </p>

              <p>
                <strong>City:</strong>{" "}
                {property.L_City || "N/A"}
              </p>

              <p>
                <strong>State:</strong>{" "}
                {property.L_State || "N/A"}
              </p>

              <p>
                <strong>ZIP Code:</strong>{" "}
                {property.L_Zip || "N/A"}
              </p>

              <p>
                <strong>Lot Size:</strong>{" "}
                {formatNumber(property.LotSizeAcres)} acres
              </p>

              <p>
                <strong>Year Built:</strong>{" "}
                {formatNumber(property.YearBuilt)}
              </p>
            </div>
          </section>

          {/* Property description */}
          <section className="detail-section">
            <h2>Description</h2>

            <p className="property-description">
              {property.L_Remarks ||
                "No description available for this property."}
            </p>
          </section>

          {/* Google Maps property location */}
          <section className="detail-section">
            <h2>Property Location</h2>

            <PropertyMap
              latitude={property.LMD_MP_Latitude}
              longitude={property.LMD_MP_Longitude}
            />
          </section>

          {/* Property open house events */}
          <section className="detail-section">
            <h2>Open Houses</h2>

            <PropertyOpenHouses
              listingId={property.L_ListingID}
            />
          </section>
        </>
      )}
    </main>
  );
}

export default PropertyDetailPage;
