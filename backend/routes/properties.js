const express = require("express");
const pool = require("../db"); // MySQL connection pool
const { searchProperties } = require("../services/propertySearch");

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
 * ""        -> invalid
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

// GET /api/properties
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

  if (!Number.isSafeInteger(offset)) {
    return res.status(400).json({
      error: "offset must be a non-negative safe integer",
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
    minPriceRaw !== undefined
      ? Number(minPriceRaw)
      : undefined;

  const maxPrice =
    maxPriceRaw !== undefined
      ? Number(maxPriceRaw)
      : undefined;

  const beds =
    bedsRaw !== undefined
      ? Number(bedsRaw)
      : undefined;

  const baths =
    bathsRaw !== undefined
      ? Number(bathsRaw)
      : undefined;

  // Validate price range.
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
  // 5. Validate text filters
  // --------------------------------------------------

  if (city !== undefined && city.length === 0) {
    return res.status(400).json({
      error: "city cannot be empty",
    });
  }

  if (zipcode !== undefined && zipcode.length === 0) {
    return res.status(400).json({
      error: "zipcode cannot be empty",
    });
  }

  // --------------------------------------------------
  // 6. Search properties using the shared service
  // --------------------------------------------------

  try {
    const data = await searchProperties({
      city,
      zipcode,
      minPrice,
      maxPrice,
      beds,
      baths,
      limit,
      offset,
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Failed to fetch properties:", error);

    return res.status(500).json({
      error: "Failed to fetch properties",
    });
  }
});

// --------------------------------------------------
// 7. Validate listing ID
// --------------------------------------------------

function isValidListingId(id) {
  return /^\d{1,10}$/.test(id);
}

// --------------------------------------------------
// 8. GET /api/properties/:id/openhouses
// --------------------------------------------------

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

    // Fetch open house events ordered by date and time.
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

// --------------------------------------------------
// 9. GET /api/properties/:id
// --------------------------------------------------

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
