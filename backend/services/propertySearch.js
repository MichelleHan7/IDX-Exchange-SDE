const pool = require("../db");

/**
 * Shared property search service.
 *
 * Used by:
 * 1. GET /api/properties
 * 2. POST /api/search/natural
 *
 * Regular search uses exact bed/bath matching.
 * Natural language search can use minimum matching.
 */
async function searchProperties(filters = {}) {
  const {
    city,
    zipcode,
    minPrice,
    maxPrice,
    beds,
    baths,
    minYearBuilt,
    maxYearBuilt,
    limit = 20,
    offset = 0,
    matchMinimumBedsAndBaths = false,
  } = filters;

  const conditions = [];
  const values = [];

  // City: case-insensitive and whitespace-insensitive.
  if (city !== undefined && city !== null) {
    conditions.push(
      "LOWER(TRIM(L_City)) = LOWER(TRIM(?))"
    );
    values.push(city.trim());
  }

  // ZIP code
  if (zipcode !== undefined && zipcode !== null) {
    conditions.push("L_Zip = ?");
    values.push(zipcode.trim());
  }

  // Price range
  if (minPrice !== undefined && minPrice !== null) {
    conditions.push("L_SystemPrice >= ?");
    values.push(minPrice);
  }

  if (maxPrice !== undefined && maxPrice !== null) {
    conditions.push("L_SystemPrice <= ?");
    values.push(maxPrice);
  }

  // Bedrooms
  if (beds !== undefined && beds !== null) {
    const operator = matchMinimumBedsAndBaths ? ">=" : "=";

    conditions.push(`L_Keyword2 ${operator} ?`);
    values.push(beds);
  }

  // Bathrooms
  if (baths !== undefined && baths !== null) {
    const operator = matchMinimumBedsAndBaths ? ">=" : "=";

    conditions.push(`LM_Dec_3 ${operator} ?`);
    values.push(baths);
  }

  // Year built
  if (minYearBuilt !== undefined && minYearBuilt !== null) {
    conditions.push("YearBuilt >= ?");
    values.push(minYearBuilt);
  }

  if (maxYearBuilt !== undefined && maxYearBuilt !== null) {
    conditions.push("YearBuilt <= ?");
    values.push(maxYearBuilt);
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  // Get the total number of matching properties.
  const [countRows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM rets_property
    ${whereClause}
    `,
    values
  );

  // Fetch the current page.
  const [properties] = await pool.query(
    `
    SELECT *
    FROM rets_property
    ${whereClause}
    ORDER BY L_ListingID
    LIMIT ?
    OFFSET ?
    `,
    [...values, limit, offset]
  );

  return {
    total: Number(countRows[0].total),
    limit,
    offset,
    results: properties,
  };
}

module.exports = {
  searchProperties,
};
