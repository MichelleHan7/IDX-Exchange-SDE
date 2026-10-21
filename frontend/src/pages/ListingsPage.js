
import { useEffect, useState } from "react";
import { fetchProperties } from "../api/client";
import PropertyCard from "../components/PropertyCard";
import "./ListingsPage.css";

function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadProperties() {
      try {
        const data = await fetchProperties({
          limit: 20,
          offset: 0,
        });

        if (!ignore) {
          setProperties(data.results);
          setTotal(data.total);
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

    loadProperties();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="listings-page">
      <header className="listings-header">
        <h1>IDX Exchange Property Listings</h1>
        <p>Explore homes across California</p>
      </header>

      <div className="listings-content">
        {loading ? (
          <p role="status">Loading properties...</p>
        ) : error ? (
          <p role="alert" className="error-message">
            Error: {error}
          </p>
        ) : (
          <>
            <h2 className="results-summary">
              Showing {properties.length} of {total} properties
            </h2>

            {properties.length === 0 ? (
              <p>No properties found.</p>
            ) : (
              <div className="property-grid">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.L_ListingID}
                    property={property}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default ListingsPage;
