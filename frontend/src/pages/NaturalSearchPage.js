import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { fetchNaturalProperties } from "../api/client";
import PropertyCard from "../components/PropertyCard";
import "./NaturalSearchPage.css";

const EXAMPLE_QUERIES = [
  "3 bedrooms in Irvine under $500k",
  "2 bathrooms in Pasadena under $900k",
  "4 bedrooms in Beverly Hills",
];

const FILTER_LABELS = {
  city: "City",
  zipcode: "ZIP Code",
  minPrice: "Minimum price",
  maxPrice: "Maximum price",
  beds: "Bedrooms",
  baths: "Bathrooms",
  minYearBuilt: "Built from",
  maxYearBuilt: "Built through",
};

function formatFilter(key, value) {
  if (key === "minPrice" || key === "maxPrice") {
    return `$${Number(value).toLocaleString("en-US")}`;
  }

  if (key === "beds" || key === "baths") {
    return `${value}+`;
  }

  return String(value);
}

function NaturalSearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({});
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Prevent older requests from overwriting newer results.
  const requestVersion = useRef(0);

  useEffect(() => {
    return () => {
      requestVersion.current += 1;
    };
  }, []);

  async function handleSearch(event) {
    event.preventDefault();

    const cleanedQuery = query.trim();

    if (!cleanedQuery) {
      setError("Please describe the property you want.");
      return;
    }

    if (cleanedQuery.length > 500) {
      setError("Please use 500 characters or fewer.");
      return;
    }

    const currentVersion = ++requestVersion.current;

    setLoading(true);
    setError("");
    setMessage("");
    setProperties([]);
    setFilters({});
    setTotal(0);
    setHasSearched(true);

    try {
      const data = await fetchNaturalProperties(cleanedQuery);

      if (currentVersion !== requestVersion.current) {
        return;
      }

      setFilters(data.filters || {});
      setProperties(data.results || []);
      setTotal(Number(data.total) || 0);
      setMessage(data.message || "");
    } catch (err) {
      if (currentVersion !== requestVersion.current) {
        return;
      }

      setError(err.message);
    } finally {
      if (currentVersion === requestVersion.current) {
        setLoading(false);
      }
    }
  }

  const interpretedFilters = Object.entries(filters).filter(
    ([, value]) =>
      value !== null &&
      value !== undefined &&
      value !== ""
  );

  return (
    <main className="natural-search-page">
      <header className="natural-search-hero">
        <h1>AI Property Search</h1>
        <p>
          Describe your ideal home in everyday English.
          Our AI will turn your description into property filters.
        </p>
      </header>

      <div className="natural-search-content">
        <Link to="/" className="natural-back-link">
          ← Back to Listings
        </Link>

        <section className="natural-search-panel">
          <h2>Find your next home</h2>

          <form onSubmit={handleSearch}>
            <label htmlFor="natural-query">
              Describe your ideal home
            </label>

            <textarea
              id="natural-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. 3 bedrooms in Irvine under $500k"
              rows={3}
              maxLength={500}
            />

            <button
              type="submit"
              disabled={loading}
              className="natural-search-button"
            >
              {loading ? "Searching..." : "Search with AI"}
            </button>
          </form>

          <div className="natural-examples">
            <p>Try an example:</p>

            <div className="natural-example-list">
              {EXAMPLE_QUERIES.map((example) => (
                <button
                  type="button"
                  key={example}
                  disabled={loading}
                  onClick={() => setQuery(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </section>

        {loading && (
          <p role="status" className="natural-status">
            Interpreting your search and finding properties...
          </p>
        )}

        {error && (
          <div role="alert" className="natural-error">
            <strong>Search failed</strong>
            <p>{error}</p>
            <p>Please try again or use the regular filters.</p>
          </div>
        )}

        {!loading && !error && hasSearched && (
          <>
            {interpretedFilters.length > 0 && (
              <section className="natural-filter-panel">
                <h2>Interpreted Filters</h2>
                <p>Here's how AI understood your search:</p>

                <div className="natural-filter-tags">
                  {interpretedFilters.map(([key, value]) => (
                    <span key={key} className="natural-filter-tag">
                      <strong>
                        {FILTER_LABELS[key] || key}:
                      </strong>{" "}
                      {formatFilter(key, value)}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section
              className="natural-results"
              aria-label="Natural language search results"
            >
              <h2>Search Results</h2>

              {message ? (
                <p role="status">{message}</p>
              ) : (
                <>
                  <p className="natural-results-summary">
                    Showing {properties.length} of {total} properties
                  </p>

                  {properties.length === 0 ? (
                    <p role="status">
                      No properties match your search.
                      Try a higher budget or fewer restrictions.
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

                  {total > properties.length && (
                    <p className="natural-results-note">
                      Showing the first {properties.length} matches.
                      Refine your search for more specific results.
                    </p>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default NaturalSearchPage;
