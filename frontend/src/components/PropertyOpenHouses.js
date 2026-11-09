
import { useEffect, useState } from "react";
import { fetchPropertyOpenHouses } from "../api/client";
import "./PropertyOpenHouses.css";

// Format MySQL dates without shifting calendar days
// because of timezone conversion.
function formatOpenHouseDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const text = String(value).trim();

  // Handles YYYY-MM-DD and ISO date strings.
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  return "Date unavailable";
}


// Format MySQL TIME values like "13:30:00"
// into a readable value like "1:30 PM".
function formatOpenHouseTime(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const text = String(value).trim();

  const match = text.match(
    /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/
  );

  if (!match) {
    return text;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return text;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}


// Extract OpenHouseRemarks from the all_data JSON field.
function getOpenHouseRemarks(rawData) {
  if (!rawData) {
    return null;
  }

  try {
    const parsed =
      typeof rawData === "string"
        ? JSON.parse(rawData)
        : rawData;

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    const remarks = parsed.OpenHouseRemarks;

    if (typeof remarks !== "string") {
      return null;
    }

    return remarks.trim() || null;
  } catch {
    return null;
  }
}


function PropertyOpenHouses({ listingId }) {
  const [openHouses, setOpenHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load open house events when the listing ID changes.
  useEffect(() => {
    let ignore = false;

    async function loadOpenHouses() {
      setLoading(true);
      setError("");
      setOpenHouses([]);

      try {
        const data = await fetchPropertyOpenHouses(listingId);

        if (!ignore) {
          setOpenHouses(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadOpenHouses();

    return () => {
      ignore = true;
    };
  }, [listingId]);

  // Loading state.
  if (loading) {
    return (
      <p role="status" className="openhouse-message">
        Loading open houses...
      </p>
    );
  }

  // Error state.
  if (error) {
    return (
      <p role="alert" className="openhouse-error">
        Unable to load open houses: {error}
      </p>
    );
  }

  // Empty state.
  if (openHouses.length === 0) {
    return (
      <p role="status" className="openhouse-message">
        No open houses scheduled
      </p>
    );
  }

  return (
    <div className="open-houses-list">
      {openHouses.map((openHouse, index) => {
        const date = formatOpenHouseDate(
          openHouse.OpenHouseDate
        );

        const startTime = formatOpenHouseTime(
          openHouse.OH_StartTime
        );

        const endTime = formatOpenHouseTime(
          openHouse.OH_EndTime
        );

        const remarks = getOpenHouseRemarks(
          openHouse.all_data
        );

        const timeRange =
          startTime && endTime
            ? `${startTime} – ${endTime}`
            : startTime
            ? `Starts at ${startTime}`
            : endTime
            ? `Ends at ${endTime}`
            : "Time unavailable";

        return (
          <article
            className="openhouse-card"
            key={`${openHouse.L_ListingID}-${openHouse.OpenHouseDate}-${openHouse.OH_StartTime}-${index}`}
          >
            <div className="openhouse-header">
              <div className="openhouse-date">
                <span className="openhouse-label">
                  Open House
                </span>

                <h3>{date}</h3>
              </div>

              <div className="openhouse-time">
                {timeRange}
              </div>
            </div>

            {remarks && (
              <div className="openhouse-remarks">
                <strong>Remarks</strong>
                <p>{remarks}</p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default PropertyOpenHouses;
