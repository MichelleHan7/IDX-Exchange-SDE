import { useEffect, useRef, useState } from "react";
import { fetchProperties } from "../api/client";
import PropertyCard from "../components/PropertyCard";
import PropertyFilters from "../components/PropertyFilters";
import "./ListingsPage.css";

function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});

  // Track the latest search request version.
  const requestVersion = useRef(0);

  useEffect(() => {
    let ignore = false;
    const currentVersion = requestVersion.current;

    async function loadProperties() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchProperties({
          ...appliedFilters,
          limit: 20,
          offset: 0,
        });

        if (!ignore && currentVersion === requestVersion.current) {
          setProperties(data.results);
          setTotal(data.total);
        }
      } catch (err) {
        if (!ignore && currentVersion === requestVersion.current) {
          setError(err.message);
          setProperties([]);
          setTotal(0);
        }
      } finally {
        if (!ignore && currentVersion === requestVersion.current) {
          setLoading(false);
        }
      }
    }

    loadProperties();

    return () => {
      ignore = true;
    };
  }, [appliedFilters]);

  function handleSearch(filters) {
    // Invalidate all previous requests immediately.
    requestVersion.current += 1;

    setLoading(true);
    setError("");
    setProperties([]);
    setTotal(0);
    setAppliedFilters({ ...filters });
  }

  function handleClear() {
    // Invalidate all previous requests immediately.
    requestVersion.current += 1;

    setLoading(true);
    setError("");
    setProperties([]);
    setTotal(0);
    setAppliedFilters({});
  }

  return (
    <main className="listings-page">
      <header className="listings-header">
        <h1>IDX Exchange Property Listings</h1>
        <p>Explore homes across California</p>
      </header>

      <div className="listings-content">
        <PropertyFilters
          onSearch={handleSearch}
          onClear={handleClear}
        />

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
              <p role="status">
                No properties found. Try adjusting your filters.
              </p>
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
