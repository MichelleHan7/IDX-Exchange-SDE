const request = require("supertest");
const app = require("../server");
const pool = require("../db");

afterAll(async () => {
  await pool.end();
});

test("minPrice + beds returns the correct total and matching results", async () => {
  const minPrice = 500000;
  const beds = 3;

  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM rets_property
    WHERE L_SystemPrice >= ?
      AND L_Keyword2 = ?
    `,
    [minPrice, beds]
  );

  const expectedTotal = rows[0].total;

  const response = await request(app)
    .get("/api/properties")
    .query({
      minPrice,
      beds,
      limit: 20,
      offset: 0,
    });

  expect(response.status).toBe(200);

  expect(response.body.total).toBe(expectedTotal);

  expect(
    response.body.results.every(
      (property) =>
        Number(property.L_SystemPrice) >= minPrice &&
        Number(property.L_Keyword2) === beds
    )
  ).toBe(true);
});