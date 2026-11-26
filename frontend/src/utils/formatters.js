export function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "N/A";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString("en-US")
    : "N/A";
}

export function formatPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Price unavailable";
  }

  const price = Number(value);

  return Number.isFinite(price) && price > 0
    ? `$${price.toLocaleString("en-US")}`
    : "Price unavailable";
}

export function formatStat(value, unit) {
  const formatted = formatNumber(value);

  return formatted === "N/A"
    ? `${unit} N/A`
    : `${formatted} ${unit}`;
}
