
import PropertyCard from "../components/PropertyCard";
import PropertyFilters from "../components/PropertyFilters";
import Pagination from "../components/Pagination";
import usePropertySearch from "../hooks/usePropertySearch";
import "./ListingsPage.css";

function ListingsPage() {
  const {
    properties,
    total,
    loading,
    error,
    currentPage,
    totalPages,
    startItem,
    endItem,
    handleSearch,
    handleClear,
    handlePageChange,
  } = usePropertySearch();

  function handlePaginationChange(newPage) {
    if (handlePageChange(newPage)) {
      window.scrollTo(0, 0);
    }
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
                  onPageChange={handlePaginationChange}
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
