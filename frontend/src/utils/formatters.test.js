import {
  formatNumber,
  formatPrice,
  formatStat,
} from "./formatters";

describe("formatNumber", () => {
  test("formats numeric values with thousands separators", () => {
    expect(formatNumber(2500)).toBe("2,500");
  });

  test("accepts numeric strings", () => {
    expect(formatNumber("2500")).toBe("2,500");
  });

  test("preserves decimal values and zero", () => {
    expect(formatNumber(2.5)).toBe("2.5");
    expect(formatNumber(0)).toBe("0");
  });

  test("returns N/A for missing values", () => {
    expect(formatNumber(null)).toBe("N/A");
    expect(formatNumber(undefined)).toBe("N/A");
    expect(formatNumber("")).toBe("N/A");
  });

  test("returns N/A for invalid numeric values", () => {
    expect(formatNumber("invalid")).toBe("N/A");
    expect(formatNumber(NaN)).toBe("N/A");
    expect(formatNumber(Infinity)).toBe("N/A");
  });
});

describe("formatPrice", () => {
  test("formats positive prices", () => {
    expect(formatPrice(450000)).toBe("$450,000");
  });

  test("accepts numeric price strings", () => {
    expect(formatPrice("750000")).toBe("$750,000");
  });

  test("returns a fallback for missing prices", () => {
    expect(formatPrice(null)).toBe("Price unavailable");
    expect(formatPrice(undefined)).toBe("Price unavailable");
    expect(formatPrice("")).toBe("Price unavailable");
  });

  test("returns a fallback for invalid or nonpositive prices", () => {
    expect(formatPrice(0)).toBe("Price unavailable");
    expect(formatPrice(-100)).toBe("Price unavailable");
    expect(formatPrice("invalid")).toBe("Price unavailable");
    expect(formatPrice(Infinity)).toBe("Price unavailable");
  });
});

describe("formatStat", () => {
  test("formats valid property statistics with units", () => {
    expect(formatStat(3, "beds")).toBe("3 beds");
    expect(formatStat("2.5", "baths")).toBe("2.5 baths");
    expect(formatStat(2500, "sqft")).toBe("2,500 sqft");
  });

  test("returns a fallback for missing statistics", () => {
    expect(formatStat(null, "beds")).toBe("beds N/A");
    expect(formatStat(undefined, "baths")).toBe("baths N/A");
  });

  test("returns a fallback for invalid statistics", () => {
    expect(formatStat("invalid", "sqft")).toBe("sqft N/A");
    expect(formatStat(NaN, "beds")).toBe("beds N/A");
  });
});
