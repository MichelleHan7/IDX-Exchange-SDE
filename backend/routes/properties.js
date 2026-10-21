const express = require("express");
const pool = require("../db"); // MySQL connection pool

const router = express.Router();

/**
 * Check whether a query parameter is a valid non-negative number.
 *
 * Examples:
 * undefined -> valid (parameter was not provided)
 * "0"       -> valid
 * "2.5"     -> valid
 * "500000"  -> valid
 * "-1"      -> invalid
 * "abc"     -> invalid
 * ""         -> invalid
 */
function isNonNegativeNumber(value) {
  if (value === undefined) {
    return true;
  }

  if (value === "" || !Number.isFinite(Number(value))) {
    return false;
  }

  return Number(value) >= 0;
}

router.get("/", async (req, res) => {
  // --------------------------------------------------
  // 1. Read query parameters
  // --------------------------------------------------

  const limitRaw = req.query.limit ?? "20";
  const offsetRaw = req.query.offset ?? "0";

  const city = req.query.city?.trim();
  const zipcode = req.query.zipcode?.trim();

  const minPriceRaw = req.query.minPrice;
  const maxPriceRaw = req.query.maxPrice;
  const bedsRaw = req.query.beds;
  const bathsRaw = req.query.baths;

  // --------------------------------------------------
  // 2. Validate pagination
  // --------------------------------------------------

  if (!/^\d+$/.test(limitRaw)) {
    return res.status(400).json({
      error: "limit must be a positive integer",
    });
  }

  if (!/^\d+$/.test(offsetRaw)) {
    return res.status(400).json({
      error: "offset must be a non-negative integer",
    });
  }

  const limit = Number(limitRaw);
  const offset = Number(offsetRaw);

  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      error: "limit must be between 1 and 100",
    });
  }

  // --------------------------------------------------
  // 3. Validate numeric filters
  // --------------------------------------------------

  if (!isNonNegativeNumber(minPriceRaw)) {
    return res.status(400).json({
      error: "minPrice must be a non-negative number",
    });
  }

  if (!isNonNegativeNumber(maxPriceRaw)) {
    return res.status(400).json({
      error: "maxPrice must be a non-negative number",
    });
  }

  if (!isNonNegativeNumber(bathsRaw)) {
    return res.status(400).json({
      error: "baths must be a non-negative number",
    });
  }

  // Bedrooms should be a non-negative integer.
  if (
    bedsRaw !== undefined &&
    (!/^\d+$/.test(bedsRaw) || Number(bedsRaw) < 0)
  ) {
    return res.status(400).json({
      error: "beds must be a non-negative integer",
    });
  }

  // --------------------------------------------------
  // 4. Convert validated numeric values
  // --------------------------------------------------

  const minPrice =
    minPriceRaw !== undefined ? Number(minPriceRaw) : undefined;

  const maxPrice =
    maxPriceRaw !== undefined ? Number(maxPriceRaw) : undefined;

  const beds =
    bedsRaw !== undefined ? Number(bedsRaw) : undefined;

  const baths =
    bathsRaw !== undefined ? Number(bathsRaw) : undefined;

  // minPrice should not be larger than maxPrice.
  if (
    minPrice !== undefined &&
    maxPrice !== undefined &&
    minPrice > maxPrice
  ) {
    return res.status(400).json({
      error: "minPrice cannot be greater than maxPrice",
    });
  }

  // --------------------------------------------------
  // 5. Dynamically build filter conditions
  // --------------------------------------------------

  const conditions = [];
  const values = [];

  // City filter
  if (city !== undefined) {
    if (city.length === 0) {
      return res.status(400).json({
        error: "city cannot be empty",
      });
    }

    conditions.push(
      "LOWER(TRIM(L_City)) = LOWER(TRIM(?))"
    );
    values.push(city);
  }

  // ZIP code filter
  if (zipcode !== undefined) {
    if (zipcode.length === 0) {
      return res.status(400).json({
        error: "zipcode cannot be empty",
      });
    }

    conditions.push("L_Zip = ?");
    values.push(zipcode);
  }

  // Minimum price filter
  if (minPrice !== undefined) {
    conditions.push("L_SystemPrice >= ?");
    values.push(minPrice);
  }

  // Maximum price filter
  if (maxPrice !== undefined) {
    conditions.push("L_SystemPrice <= ?");
    values.push(maxPrice);
  }

  // Bedrooms filter
  if (beds !== undefined) {
    conditions.push("L_Keyword2 = ?");
    values.push(beds);
  }

  // Bathrooms filter
  if (baths !== undefined) {
    conditions.push("LM_Dec_3 = ?");
    values.push(baths);
  }

  // --------------------------------------------------
  // 6. Build WHERE clause
  // --------------------------------------------------

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  // --------------------------------------------------
  // 7. Query database
  // --------------------------------------------------

  try {
    // Count all properties matching the filters.
    const [countRows] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM rets_property
      ${whereClause}
      `,
      values
    );

    // Fetch only the requested page.
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

    // --------------------------------------------------
    // 8. Return API response
    // --------------------------------------------------

    return res.status(200).json({
      total: countRows[0].total,
      limit,
      offset,
      results: properties,
    });
  } catch (error) {
    console.error("Failed to fetch properties:", error);

    return res.status(500).json({
      error: "Failed to fetch properties",
    });
  }
});

function isValidListingId(id) {
  return /^\d{1,10}$/.test(id);
}

// GET /api/properties/:id/openhouses
router.get("/:id/openhouses", async (req, res) => {
  const { id } = req.params;

  if (!isValidListingId(id)) {
    return res.status(400).json({
      error: "Listing ID must contain 1 to 10 digits",
    });
  }

  try {
    // First verify that the property exists.
    const [properties] = await pool.query(
      `
      SELECT L_ListingID
      FROM rets_property
      WHERE L_ListingID = ?
      LIMIT 1
      `,
      [id]
    );

    if (properties.length === 0) {
      return res.status(404).json({
        error: "Property not found",
      });
    }

    const [openhouses] = await pool.query(
      `
      SELECT *
      FROM rets_openhouse
      WHERE L_ListingID = ?
      ORDER BY OpenHouseDate ASC, OH_StartTime ASC
      `,
      [id]
    );

    return res.status(200).json(openhouses);
  } catch (error) {
    console.error("Failed to fetch open houses:", error);

    return res.status(500).json({
      error: "Failed to fetch open houses",
    });
  }
});

// GET /api/properties/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!isValidListingId(id)) {
    return res.status(400).json({
      error: "Listing ID must contain 1 to 10 digits",
    });
  }

  try {
    const [properties] = await pool.query(
      `
      SELECT *
      FROM rets_property
      WHERE L_ListingID = ?
      LIMIT 1
      `,
      [id]
    );

    if (properties.length === 0) {
      return res.status(404).json({
        error: "Property not found",
      });
    }

    return res.status(200).json(properties[0]);
  } catch (error) {
    console.error("Failed to fetch property:", error);

    return res.status(500).json({
      error: "Failed to fetch property",
    });
  }
});

module.exports = router;