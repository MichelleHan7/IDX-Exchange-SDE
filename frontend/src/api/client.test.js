
import { fetchProperties } from "./client";

describe("fetchProperties API Client", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  // Test 1: Successful API request
  test("returns property data successfully", async () => {
    const mockData = {
      total: 1,
      limit: 20,
      offset: 0,
      results: [{ L_ListingID: "123" }],
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const data = await fetchProperties();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/properties"
    );
    expect(data).toEqual(mockData);
  });

  // Test 2: Filters are correctly added to URL
  test("builds URL with multiple filters", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, results: [] }),
    });

    await fetchProperties({
      city: "Irvine",
      minPrice: 300000,
      beds: 3,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/properties?city=Irvine&minPrice=300000&beds=3"
    );
  });

  // Test 3: Empty filters are excluded
  test("does not send empty filter values", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, results: [] }),
    });

    await fetchProperties({
      city: "Irvine",
      zipcode: "",
      minPrice: null,
      maxPrice: undefined,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/properties?city=Irvine"
    );
  });

  // Test 4: HTTP error handling
  test("throws an error when API returns failure", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: "Invalid filter parameter",
      }),
    });

    await expect(fetchProperties()).rejects.toThrow(
      "Invalid filter parameter"
    );
  });

  // Test 5: Network error handling
  test("handles network connection errors", async () => {
    global.fetch.mockRejectedValue(
      new Error("Network failure")
    );

    await expect(fetchProperties()).rejects.toThrow(
      "Unable to connect to the server."
    );
  });
});
