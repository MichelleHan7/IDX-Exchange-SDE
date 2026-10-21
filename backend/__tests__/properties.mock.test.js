const request = require("supertest");

jest.mock("../db", () => ({
  query: jest.fn(),
}));

const pool = require("../db");
const app = require("../server");

beforeEach(() => {
  pool.query.mockReset();
});

describe("GET /api/properties", () => {
  test("returns properties with the default pagination", async () => {
    const properties = [
      {
        L_ListingID: "101",
        L_City: "Irvine",
      },
      {
        L_ListingID: "102",
        L_City: "Irvine",
      },
    ];

    pool.query
      .mockResolvedValueOnce([
        [{ total: 2 }],
        [],
      ])
      .mockResolvedValueOnce([
        properties,
        [],
      ]);

    const response = await request(app)
      .get("/api/properties");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      total: 2,
      limit: 20,
      offset: 0,
      results: properties,
    });

    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  test("uses the requested pagination values", async () => {
    pool.query
      .mockResolvedValueOnce([
        [{ total: 50 }],
        [],
      ])
      .mockResolvedValueOnce([
        [{ L_ListingID: "121" }],
        [],
      ]);

    const response = await request(app)
      .get("/api/properties")
      .query({
        limit: 10,
        offset: 20,
      });

    expect(response.status).toBe(200);
    expect(response.body.limit).toBe(10);
    expect(response.body.offset).toBe(20);

    expect(
      pool.query.mock.calls[1][1]
    ).toEqual([
      10,
      20,
    ]);
  });

  test.each([
    [
      "city",
      "Irvine",
      "LOWER(TRIM(L_City)) = LOWER(TRIM(?))",
      ["Irvine"],
    ],
    [
      "zipcode",
      "92618",
      "L_Zip = ?",
      ["92618"],
    ],
    [
      "minPrice",
      "300000",
      "L_SystemPrice >= ?",
      [300000],
    ],
    [
      "maxPrice",
      "900000",
      "L_SystemPrice <= ?",
      [900000],
    ],
    [
      "beds",
      "3",
      "L_Keyword2 = ?",
      [3],
    ],
    [
      "baths",
      "2.5",
      "LM_Dec_3 = ?",
      [2.5],
    ],
  ])(
    "applies the %s filter",
    async (
      name,
      value,
      sqlFragment,
      expectedValues
    ) => {
      pool.query
        .mockResolvedValueOnce([
          [{ total: 1 }],
          [],
        ])
        .mockResolvedValueOnce([
          [{ L_ListingID: "101" }],
          [],
        ]);

      const response = await request(app)
        .get("/api/properties")
        .query({
          [name]: value,
        });

      expect(response.status).toBe(200);

      const [countSql, countValues] =
        pool.query.mock.calls[0];

      const [dataSql, dataValues] =
        pool.query.mock.calls[1];

      expect(countSql).toContain(
        sqlFragment
      );

      expect(dataSql).toContain(
        sqlFragment
      );

      expect(countValues).toEqual(
        expectedValues
      );

      expect(dataValues).toEqual([
        ...expectedValues,
        20,
        0,
      ]);
    }
  );

  test(
    "keeps minPrice and beds parameters in the correct order",
    async () => {
      pool.query
        .mockResolvedValueOnce([
          [{ total: 3 }],
          [],
        ])
        .mockResolvedValueOnce([
          [{ L_ListingID: "101" }],
          [],
        ]);

      const response = await request(app)
        .get("/api/properties")
        .query({
          minPrice: 500000,
          beds: 3,
        });

      expect(response.status).toBe(200);

      expect(
        pool.query.mock.calls[0][1]
      ).toEqual([
        500000,
        3,
      ]);

      expect(
        pool.query.mock.calls[1][1]
      ).toEqual([
        500000,
        3,
        20,
        0,
      ]);
    }
  );

  test.each([
    [
      { minPrice: "abc" },
      "minPrice must be a non-negative number",
    ],
    [
      { maxPrice: "-1" },
      "maxPrice must be a non-negative number",
    ],
    [
      { baths: "abc" },
      "baths must be a non-negative number",
    ],
    [
      { beds: "2.5" },
      "beds must be a non-negative integer",
    ],
    [
      { limit: "0" },
      "limit must be between 1 and 100",
    ],
    [
      { limit: "200" },
      "limit must be between 1 and 100",
    ],
    [
      { limit: "abc" },
      "limit must be a positive integer",
    ],
    [
      { offset: "-1" },
      "offset must be a non-negative integer",
    ],
    [
      {
        minPrice: "900000",
        maxPrice: "500000",
      },
      "minPrice cannot be greater than maxPrice",
    ],
    [
      { city: "" },
      "city cannot be empty",
    ],
    [
      { zipcode: "" },
      "zipcode cannot be empty",
    ],
  ])(
    "rejects invalid query %#",
    async (query, message) => {
      const response = await request(app)
        .get("/api/properties")
        .query(query);

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        error: message,
      });

      expect(
        pool.query
      ).not.toHaveBeenCalled();
    }
  );

  test(
    "returns 500 when the property query fails",
    async () => {
      pool.query.mockRejectedValueOnce(
        new Error("database unavailable")
      );

      const response = await request(app)
        .get("/api/properties");

      expect(response.status).toBe(500);

      expect(response.body).toEqual({
        error: "Failed to fetch properties",
      });
    }
  );
});

describe("GET /api/properties/:id", () => {
  test("returns one property", async () => {
    const property = {
      L_ListingID: "123456",
      L_Address: "1 Test St",
    };

    pool.query.mockResolvedValueOnce([
      [property],
      [],
    ]);

    const response = await request(app)
      .get("/api/properties/123456");

    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      property
    );

    expect(
      pool.query.mock.calls[0][1]
    ).toEqual([
      "123456",
    ]);
  });

  test(
    "returns 404 for an unknown property",
    async () => {
      pool.query.mockResolvedValueOnce([
        [],
        [],
      ]);

      const response = await request(app)
        .get("/api/properties/999999");

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        error: "Property not found",
      });
    }
  );

  test.each([
    "abc",
    "12345678901",
  ])(
    "returns 400 for invalid listing ID %s",
    async (id) => {
      const response = await request(app)
        .get(`/api/properties/${id}`);

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        error:
          "Listing ID must contain 1 to 10 digits",
      });

      expect(
        pool.query
      ).not.toHaveBeenCalled();
    }
  );

  test(
    "returns 500 when the property lookup fails",
    async () => {
      pool.query.mockRejectedValueOnce(
        new Error("database unavailable")
      );

      const response = await request(app)
        .get("/api/properties/123456");

      expect(response.status).toBe(500);

      expect(response.body).toEqual({
        error: "Failed to fetch property",
      });
    }
  );
});

describe(
  "GET /api/properties/:id/openhouses",
  () => {
    test(
      "returns open houses for an existing property",
      async () => {
        const openhouses = [
          {
            L_ListingID: "123456",
            OpenHouseDate: "2026-10-10",
            OH_StartTime: "10:00:00",
          },
          {
            L_ListingID: "123456",
            OpenHouseDate: "2026-10-10",
            OH_StartTime: "13:00:00",
          },
        ];

        pool.query
          .mockResolvedValueOnce([
            [
              {
                L_ListingID: "123456",
              },
            ],
            [],
          ])
          .mockResolvedValueOnce([
            openhouses,
            [],
          ]);

        const response = await request(app)
          .get(
            "/api/properties/123456/openhouses"
          );

        expect(response.status).toBe(200);

        expect(response.body).toEqual(
          openhouses
        );

        expect(
          pool.query
        ).toHaveBeenCalledTimes(2);

        expect(
          pool.query.mock.calls[1][0]
        ).toContain(
          "ORDER BY OpenHouseDate ASC, OH_StartTime ASC"
        );

        expect(
          pool.query.mock.calls[1][1]
        ).toEqual([
          "123456",
        ]);
      }
    );

    test(
      "returns an empty array when there are no open houses",
      async () => {
        pool.query
          .mockResolvedValueOnce([
            [
              {
                L_ListingID: "123456",
              },
            ],
            [],
          ])
          .mockResolvedValueOnce([
            [],
            [],
          ]);

        const response = await request(app)
          .get(
            "/api/properties/123456/openhouses"
          );

        expect(response.status).toBe(200);

        expect(response.body).toEqual([]);
      }
    );

    test(
      "returns 404 when the property does not exist",
      async () => {
        pool.query.mockResolvedValueOnce([
          [],
          [],
        ]);

        const response = await request(app)
          .get(
            "/api/properties/999999/openhouses"
          );

        expect(response.status).toBe(404);

        expect(response.body).toEqual({
          error: "Property not found",
        });

        expect(
          pool.query
        ).toHaveBeenCalledTimes(1);
      }
    );

    test.each([
      "abc",
      "12345678901",
    ])(
      "returns 400 for invalid listing ID %s",
      async (id) => {
        const response = await request(app)
          .get(
            `/api/properties/${id}/openhouses`
          );

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
          error:
            "Listing ID must contain 1 to 10 digits",
        });

        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "returns 500 when the open house lookup fails",
      async () => {
        pool.query
          .mockResolvedValueOnce([
            [
              {
                L_ListingID: "123456",
              },
            ],
            [],
          ])
          .mockRejectedValueOnce(
            new Error("database unavailable")
          );

        const response = await request(app)
          .get(
            "/api/properties/123456/openhouses"
          );

        expect(response.status).toBe(500);

        expect(response.body).toEqual({
          error:
            "Failed to fetch open houses",
        });
      }
    );
  }
);