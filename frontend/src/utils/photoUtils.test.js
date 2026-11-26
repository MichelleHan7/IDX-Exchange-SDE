
import { getPhotoUrls } from "./photoUtils";

describe("getPhotoUrls", () => {
  test("parses a valid JSON array of photo URLs", () => {
    const rawPhotos = JSON.stringify([
      "https://example.com/photo1.jpg",
      "https://example.com/photo2.jpg",
    ]);

    expect(getPhotoUrls(rawPhotos)).toEqual([
      "https://example.com/photo1.jpg",
      "https://example.com/photo2.jpg",
    ]);
  });

  test("accepts an existing array of photo URLs", () => {
    expect(
      getPhotoUrls(["https://example.com/photo.jpg"])
    ).toEqual(["https://example.com/photo.jpg"]);
  });

  test("returns an empty array for missing photos", () => {
    expect(getPhotoUrls(null)).toEqual([]);
    expect(getPhotoUrls(undefined)).toEqual([]);
    expect(getPhotoUrls("")).toEqual([]);
    expect(getPhotoUrls([])).toEqual([]);
  });

  test("returns an empty array for malformed JSON", () => {
    expect(getPhotoUrls("invalid json")).toEqual([]);
  });

  test("returns an empty array for non-array JSON", () => {
    expect(getPhotoUrls('{"photo":"example.jpg"}')).toEqual([]);
    expect(getPhotoUrls("null")).toEqual([]);
    expect(getPhotoUrls("123")).toEqual([]);
  });

  test("filters invalid entries and trims valid URLs", () => {
    const rawPhotos = [
      null,
      123,
      "",
      "invalid-url",
      "ftp://example.com/photo.jpg",
      " https://example.com/photo1.jpg ",
      "http://example.com/photo2.jpg",
      "https://example.com/invalid photo.jpg",
    ];

    expect(getPhotoUrls(rawPhotos)).toEqual([
      "https://example.com/photo1.jpg",
      "http://example.com/photo2.jpg",
    ]);
  });
});
