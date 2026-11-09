
export async function fetchProperties(params = {}) {
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  }

  const queryString = queryParams.toString();
  const url = `/api/properties${queryString ? `?${queryString}` : ""}`;

  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error("Unable to connect to the server.");
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error("The server returned an invalid JSON response.");
  }

  if (!response.ok) {
    throw new Error(
      data.error || `Failed to fetch properties: HTTP ${response.status}`
    );
  }

  return data;
}


// Fetch a single property by listing ID.
export async function fetchPropertyDetail(id) {
  if (!id) {
    throw new Error("Listing ID is missing.");
  }

  const url = `/api/properties/${encodeURIComponent(id)}`;

  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error("Unable to connect to the server.");
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error("The server returned an invalid JSON response.");
  }

  if (!response.ok) {
    throw new Error(
      data.error || `Failed to fetch property: HTTP ${response.status}`
    );
  }

  return data;
}


// Fetch open house events for a specific property.
export async function fetchPropertyOpenHouses(id) {
  if (!id) {
    throw new Error("Listing ID is missing.");
  }

  const url =
    `/api/properties/${encodeURIComponent(id)}/openhouses`;

  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error("Unable to connect to the server.");
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error("The server returned an invalid JSON response.");
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
        `Failed to fetch open houses: HTTP ${response.status}`
    );
  }

  if (!Array.isArray(data)) {
    throw new Error("Unexpected open house response format.");
  }

  return data;
}
