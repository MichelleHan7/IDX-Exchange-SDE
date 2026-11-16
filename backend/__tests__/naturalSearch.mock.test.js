
const request = require("supertest");

jest.mock("../db", () => ({
  query: jest.fn(),
}));

jest.mock("@anthropic-ai/sdk", () => jest.fn());

const pool = require("../db");
const Anthropic = require("@anthropic-ai/sdk");
const app = require("../server");

const mockCreate = jest.fn();

function mockClaudeResponse(filters) {
  mockCreate.mockResolvedValueOnce({
    stop_reason: "end_turn",
    content: [
      {
        type: "text",
        text: JSON.stringify(filters),
      },
    ],
  });
}

beforeEach(() => {
  jest.clearAllMocks();

  process.env.ANTHROPIC_API_KEY = "test-api-key";

  Anthropic.mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  }));
});

describe("POST /api/search/natural", () => {
  test("extracts filters and returns property results", async () => {
    mockClaudeResponse({
      city: " Irvine ",
      zipcode: null,
      minPrice: null,
      maxPrice: 500000,
      beds: 3,
      baths: null,
      minYearBuilt: null,
      maxYearBuilt: null,
    });

    const properties = [
      {
        L_ListingID: "101",
        L_City: "Irvine",
        L_SystemPrice: 450000,
        L_Keyword2: 3,
      },
    ];

    pool.query
      .mockResolvedValueOnce([[{ total: 1 }], []])
      .mockResolvedValueOnce([properties, []]);

    const response = await request(app)
      .post("/api/search/natural")
      .send({
        query: "3 bedroom house in Irvine under $500k",
      });

    expect(response.status).toBe(200);

    expect(response.body.filters).toEqual({
      city: "Irvine",
      maxPrice: 500000,
      beds: 3,
    });

    expect(response.body.total).toBe(1);
    expect(response.body.results).toEqual(properties);

    expect(pool.query).toHaveBeenCalledTimes(2);

    const [countSql, values] = pool.query.mock.calls[0];

    expect(countSql).toContain("LOWER(TRIM(L_City))");
    expect(countSql).toContain("L_SystemPrice <= ?");
    expect(countSql).toContain("L_Keyword2 >= ?");

    expect(values).toEqual([
      "Irvine",
      500000,
      3,
    ]);
  });

  test("rejects missing query", async () => {
    const response = await request(app)
      .post("/api/search/natural")
      .send({});

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("handles vague search without querying MySQL", async () => {
    mockClaudeResponse({
      city: null,
      zipcode: null,
      minPrice: null,
      maxPrice: null,
      beds: null,
      baths: null,
      minYearBuilt: null,
      maxYearBuilt: null,
    });

    const response = await request(app)
      .post("/api/search/natural")
      .send({
        query: "cheap houses with lots of space",
      });

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(0);
    expect(response.body.results).toEqual([]);
    expect(response.body.message).toBeDefined();

    expect(pool.query).not.toHaveBeenCalled();
  });

  test("rejects invalid AI output before SQL", async () => {
    mockClaudeResponse({
      city: "Irvine",
      maxPrice: "cheap",
      beds: null,
    });

    const response = await request(app)
      .post("/api/search/natural")
      .send({
        query: "cheap houses in Irvine",
      });

    expect(response.status).toBe(422);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("handles invalid JSON from Claude", async () => {
    mockCreate.mockResolvedValueOnce({
      stop_reason: "end_turn",
      content: [
        {
          type: "text",
          text: "not valid json",
        },
      ],
    });

    const response = await request(app)
      .post("/api/search/natural")
      .send({
        query: "3 bedrooms in Irvine",
      });

    expect(response.status).toBe(422);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("handles Claude API errors with 503", async () => {
    mockCreate.mockRejectedValueOnce(
      new Error("Rate limit exceeded")
    );

    const response = await request(app)
      .post("/api/search/natural")
      .send({
        query: "3 bedrooms in Irvine",
      });

    expect(response.status).toBe(503);
    expect(response.body.error).toBeDefined();
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("handles database failures with 500", async () => {
    mockClaudeResponse({
      city: "Irvine",
      beds: 3,
    });

    pool.query.mockRejectedValueOnce(
      new Error("Database unavailable")
    );

    const response = await request(app)
      .post("/api/search/natural")
      .send({
        query: "3 bedrooms in Irvine",
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      "Failed to search properties."
    );
  });
});
