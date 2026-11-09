
import {
  render,
  screen,
  fireEvent,
  act,
} from "@testing-library/react";

import { MemoryRouter } from "react-router";
import ListingsPage from "./ListingsPage";
import { fetchProperties } from "../api/client";

jest.mock("../api/client", () => ({
  fetchProperties: jest.fn(),
}));

function renderListingsPage() {
  return render(
    <MemoryRouter>
      <ListingsPage />
    </MemoryRouter>
  );
}

// Create a Promise that we can resolve manually.
function deferred() {
  let resolve;

  const promise = new Promise((r) => {
    resolve = r;
  });

  return { promise, resolve };
}

describe("ListingsPage Async Request Handling", () => {
  beforeEach(() => {
    fetchProperties.mockReset();
  });

  test("ignores stale responses after Search, Clear, Search", async () => {
    const firstSearch = deferred();
    const clearSearch = deferred();
    const latestSearch = deferred();

    fetchProperties
      .mockResolvedValueOnce({
        total: 1,
        results: [
          {
            L_ListingID: "1",
            L_Address: "Initial Home",
          },
        ],
      })
      .mockImplementationOnce(() => firstSearch.promise)
      .mockImplementationOnce(() => clearSearch.promise)
      .mockImplementationOnce(() => latestSearch.promise);

    renderListingsPage();

    expect(
      await screen.findByText("Initial Home")
    ).toBeInTheDocument();

    // Search for Irvine.
    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "Irvine" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Search" })
    );

    // Clear the filters.
    fireEvent.click(
      screen.getByRole("button", { name: "Clear Filters" })
    );

    // Search for Pasadena.
    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "Pasadena" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Search" })
    );

    expect(fetchProperties).toHaveBeenCalledTimes(4);

    // The old Irvine request finishes first.
    await act(async () => {
      firstSearch.resolve({
        total: 1,
        results: [
          {
            L_ListingID: "2",
            L_Address: "Old Irvine Home",
          },
        ],
      });
    });

    // Old results must never appear.
    expect(
      screen.queryByText("Old Irvine Home")
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("Loading properties...")
    ).toBeInTheDocument();

    // The Clear request finishes next.
    await act(async () => {
      clearSearch.resolve({
        total: 1,
        results: [
          {
            L_ListingID: "3",
            L_Address: "Cleared Home",
          },
        ],
      });
    });

    expect(
      screen.queryByText("Cleared Home")
    ).not.toBeInTheDocument();

    // Only the latest Pasadena request may update the UI.
    await act(async () => {
      latestSearch.resolve({
        total: 1,
        results: [
          {
            L_ListingID: "4",
            L_Address: "Latest Pasadena Home",
          },
        ],
      });
    });

    expect(
      screen.getByText("Latest Pasadena Home")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Old Irvine Home")
    ).not.toBeInTheDocument();
  });
});


describe("ListingsPage Pagination Integration", () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    fetchProperties.mockReset();
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
  });

  // Generate mock properties for a given page.
  function mockResponse(params, total = 45) {
    const { city, offset = 0 } = params;
    const count = Math.max(0, Math.min(20, total - offset));
    const label = city || "All";

    return {
      total,
      limit: 20,
      offset,
      results: Array.from({ length: count }, (_, i) => ({
        L_ListingID: String(offset + i + 1),
        L_Address: `${label} Home ${offset + i + 1}`,
        L_Photos: "[]",
      })),
    };
  }

  // Test 1: Pagination requests the correct offset.
  test("fetches the correct properties when changing pages", async () => {
    fetchProperties.mockImplementation(async (params) =>
      mockResponse(params)
    );

    renderListingsPage();

    expect(
      await screen.findByText("All Home 1")
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "2" })
    );

    expect(
      await screen.findByText("All Home 21")
    ).toBeInTheDocument();

    expect(fetchProperties).toHaveBeenLastCalledWith({
      limit: 20,
      offset: 20,
    });

    expect(
      screen.getByText("Showing 21-40 of 45 properties")
    ).toBeInTheDocument();

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);

    fireEvent.click(
      screen.getByRole("button", { name: "3" })
    );

    expect(
      await screen.findByText("All Home 41")
    ).toBeInTheDocument();

    expect(fetchProperties).toHaveBeenLastCalledWith({
      limit: 20,
      offset: 40,
    });

    expect(
      screen.getByText("Showing 41-45 of 45 properties")
    ).toBeInTheDocument();
  });

  // Test 2: Active filters are preserved when changing pages.
  test("preserves filters across page changes", async () => {
    fetchProperties.mockImplementation(async (params) =>
      mockResponse(params)
    );

    renderListingsPage();

    await screen.findByText("All Home 1");

    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "Irvine" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Search" })
    );

    await screen.findByText("Irvine Home 1");

    fireEvent.click(
      screen.getByRole("button", { name: "2" })
    );

    expect(
      await screen.findByText("Irvine Home 21")
    ).toBeInTheDocument();

    expect(fetchProperties).toHaveBeenLastCalledWith({
      city: "Irvine",
      limit: 20,
      offset: 20,
    });
  });

  // Test 3: New filters reset pagination to page 1.
  test("resets to page 1 when applying new filters", async () => {
    fetchProperties.mockImplementation(async (params) =>
      mockResponse(params, params.city === "Pasadena" ? 12 : 45)
    );

    renderListingsPage();

    await screen.findByText("All Home 1");

    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "Irvine" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Search" })
    );

    await screen.findByText("Irvine Home 1");

    fireEvent.click(
      screen.getByRole("button", { name: "2" })
    );

    await screen.findByText("Irvine Home 21");

    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "Pasadena" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Search" })
    );

    expect(
      await screen.findByText("Pasadena Home 1")
    ).toBeInTheDocument();

    expect(fetchProperties).toHaveBeenLastCalledWith({
      city: "Pasadena",
      limit: 20,
      offset: 0,
    });

    expect(
      screen.getByText("Showing 1-12 of 12 properties")
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("navigation", { name: "Pagination" })
    ).not.toBeInTheDocument();
  });

  // Test 4: Clearing filters resets page and query.
  test("resets pagination when clearing filters", async () => {
    fetchProperties.mockImplementation(async (params) =>
      mockResponse(params)
    );

    renderListingsPage();

    await screen.findByText("All Home 1");

    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "Irvine" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Search" })
    );

    await screen.findByText("Irvine Home 1");

    fireEvent.click(
      screen.getByRole("button", { name: "2" })
    );

    await screen.findByText("Irvine Home 21");

    fireEvent.click(
      screen.getByRole("button", { name: "Clear Filters" })
    );

    expect(
      await screen.findByText("All Home 1")
    ).toBeInTheDocument();

    expect(fetchProperties).toHaveBeenLastCalledWith({
      limit: 20,
      offset: 0,
    });

    expect(screen.getByLabelText("City")).toHaveValue("");

    expect(
      screen.getByText("Showing 1-20 of 45 properties")
    ).toBeInTheDocument();
  });
});
