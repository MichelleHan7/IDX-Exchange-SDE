const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");

const { searchProperties } = require("../services/propertySearch");

const {
  FILTER_SCHEMA,
  SYSTEM_PROMPT,
  InvalidNaturalFiltersError,
  validateNaturalFilters,
} = require("../services/naturalFilters");

const router = express.Router();

// POST /api/search/natural
router.post("/natural", async (req, res) => {
  const query = req.body?.query;

  // ---------------------------------------------
  // 1. Validate user input
  // ---------------------------------------------

  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({
      error: "Please provide a non-empty search query.",
    });
  }

  if (query.length > 500) {
    return res.status(400).json({
      error: "Search query must be 500 characters or fewer.",
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: "AI search is not configured on this server.",
    });
  }

  // ---------------------------------------------
  // 2. Call Claude API
  // ---------------------------------------------

  let filters;

  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 20000,
      maxRetries: 0,
    });

    const message = await client.messages.create({
      model:
        process.env.ANTHROPIC_MODEL ||
        "claude-sonnet-4-6",

      max_tokens: 350,

      system: SYSTEM_PROMPT,

      messages: [
        {
          role: "user",
          content: query.trim(),
        },
      ],

      output_config: {
        format: {
          type: "json_schema",
          schema: FILTER_SCHEMA,
        },
      },
    });

    // Structured output can still be incomplete
    // if the model refuses or reaches its token limit.
    if (
      message.stop_reason === "refusal" ||
      message.stop_reason === "max_tokens"
    ) {
      return res.status(422).json({
        error:
          "Could not interpret this search. Please try rephrasing it.",
      });
    }

    const textBlock = message.content.find(
      (block) => block.type === "text"
    );

    if (!textBlock || !textBlock.text) {
      return res.status(422).json({
        error:
          "The AI did not return usable search filters.",
      });
    }

    const extracted = JSON.parse(textBlock.text);

    // IMPORTANT:
    // Never pass raw AI output directly to SQL.
    filters = validateNaturalFilters(extracted);
  } catch (error) {
    if (
      error instanceof InvalidNaturalFiltersError ||
      error instanceof SyntaxError
    ) {
      return res.status(422).json({
        error:
          "Could not interpret this search. Please try a more specific query.",
      });
    }

    console.error(
      "Claude API request failed:",
      error.message
    );

    return res.status(503).json({
      error:
        "AI search is temporarily unavailable. Please try again.",
    });
  }

  // ---------------------------------------------
  // 3. Handle vague queries
  // ---------------------------------------------

  if (Object.keys(filters).length === 0) {
    return res.status(200).json({
      message:
        "Please include a city, ZIP code, price, bedrooms, bathrooms, or year built.",
      filters: {},
      total: 0,
      limit: 20,
      offset: 0,
      results: [],
    });
  }

  // ---------------------------------------------
  // 4. Query the MySQL database
  // ---------------------------------------------

  try {
    const data = await searchProperties({
      ...filters,
      limit: 20,
      offset: 0,
      matchMinimumBedsAndBaths: true,
    });

    // -------------------------------------------
    // 5. Return results and interpreted filters
    // -------------------------------------------

    return res.status(200).json({
      filters,
      ...data,
    });
  } catch (error) {
    console.error(
      "Natural search database query failed:",
      error.message
    );

    return res.status(500).json({
      error: "Failed to search properties.",
    });
  }
});

module.exports = router;
