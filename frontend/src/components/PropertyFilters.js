
import { useState } from "react";
import "./PropertyFilters.css";

const emptyFilters = {
  city: "",
  zipcode: "",
  minPrice: "",
  maxPrice: "",
  beds: "",
  baths: "",
};

function PropertyFilters({ onSearch, onClear }) {
  const [filters, setFilters] = useState({ ...emptyFilters });
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (
      filters.minPrice !== "" &&
      filters.maxPrice !== "" &&
      Number(filters.minPrice) > Number(filters.maxPrice)
    ) {
      setError("Minimum price cannot exceed maximum price.");
      return;
    }

    const cleanedFilters = Object.fromEntries(
      Object.entries(filters)
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => value !== "")
    );

    onSearch(cleanedFilters);
  }

  function handleClear() {
    setFilters({ ...emptyFilters });
    setError("");
    onClear();
  }

  return (
    <form className="property-filters" onSubmit={handleSubmit}>
      <h2>Search Properties</h2>

      <div className="filter-grid">
        <label>
          City
          <input
            name="city"
            type="text"
            placeholder="e.g. Irvine"
            value={filters.city}
            onChange={handleChange}
          />
        </label>

        <label>
          ZIP Code
          <input
            name="zipcode"
            type="text"
            placeholder="e.g. 92618"
            value={filters.zipcode}
            onChange={handleChange}
          />
        </label>

        <label>
          Min Price
          <input
            name="minPrice"
            type="number"
            min="0"
            placeholder="Minimum price"
            value={filters.minPrice}
            onChange={handleChange}
          />
        </label>

        <label>
          Max Price
          <input
            name="maxPrice"
            type="number"
            min="0"
            placeholder="Maximum price"
            value={filters.maxPrice}
            onChange={handleChange}
          />
        </label>

        <label>
          Bedrooms
          <select
            name="beds"
            value={filters.beds}
            onChange={handleChange}
          >
            <option value="">Any</option>
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label>
          Bathrooms
          <select
            name="baths"
            value={filters.baths}
            onChange={handleChange}
          >
            <option value="">Any</option>
            {[1, 1.5, 2, 2.5, 3, 3.5, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p role="alert">{error}</p>}

      <div className="filter-actions">
        <button type="submit">Search</button>
        <button type="button" onClick={handleClear}>
          Clear Filters
        </button>
      </div>
    </form>
  );
}

export default PropertyFilters;
