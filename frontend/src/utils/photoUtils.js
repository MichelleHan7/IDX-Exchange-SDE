export function getPhotoUrls(rawPhotos) {
  if (!rawPhotos) return [];

  try {
    const parsed =
      typeof rawPhotos === "string"
        ? JSON.parse(rawPhotos)
        : rawPhotos;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((photo) => typeof photo === "string")
      .map((photo) => photo.trim())
      .filter((photo) => /^https?:\/\/\S+$/i.test(photo));
  } catch {
    return [];
  }
}
