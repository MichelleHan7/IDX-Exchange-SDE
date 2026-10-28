
import {
  render,
  screen,
  fireEvent,
  act,
} from "@testing-library/react";

import ListingsPage from "./ListingsPage";
import { fetchProperties } from "../api/client";

jest.mock("../api/client", () => ({
  fetchProperties: jest.fn(),
}));

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

    render(<ListingsPage />);

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
