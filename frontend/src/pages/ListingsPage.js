
import { useEffect, useRef, useState } from "react";
import { fetchProperties } from "../api/client";
import PropertyCard from "../components/PropertyCard";
import PropertyFilters from "../components/PropertyFilters";
import Pagination from "../components/Pagination";
import "./ListingsPage.css";

function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

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
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
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
  }, [appliedFilters, currentPage, itemsPerPage]);

  function handleSearch(filters) {
    // Invalidate all previous requests immediately.
    requestVersion.current += 1;

    setLoading(true);
    setError("");
    setProperties([]);
    setTotal(0);
    setCurrentPage(1);
    setAppliedFilters({ ...filters });
  }

  function handleClear() {
    // Invalidate all previous requests immediately.
    requestVersion.current += 1;

    setLoading(true);
    setError("");
    setProperties([]);
    setTotal(0);
    setCurrentPage(1);
    setAppliedFilters({});
  }

  function handlePageChange(newPage) {
    const maxPage = Math.ceil(total / itemsPerPage);

    if (
      newPage < 1 ||
      newPage > maxPage ||
      newPage === currentPage ||
      loading
    ) {
      return;
    }

    // Invalidate previous API requests.
    requestVersion.current += 1;

    setLoading(true);
    setError("");
    setProperties([]);

    // Trigger a new API request via useEffect.
    setCurrentPage(newPage);

    // Scroll to the top of the page.
    window.scrollTo(0, 0);
  }

  // Calculate pagination information.
  const totalPages = Math.ceil(total / itemsPerPage);

  const startItem =
    total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(
    (currentPage - 1) * itemsPerPage + properties.length,
    total
  );

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
              {total === 0
                ? "Showing 0 of 0 properties"
                : `Showing ${startItem}-${endItem} of ${total} properties`}
            </h2>

            {properties.length === 0 ? (
              <p role="status">
                No properties found. Try adjusting your filters.
              </p>
            ) : (
              <>
                <div className="property-grid">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.L_ListingID}
                      property={property}
                    />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default ListingsPage;
