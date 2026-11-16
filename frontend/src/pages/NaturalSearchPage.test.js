import {
  render,
  screen,
  fireEvent,
} from "@testing-library/react";

import { MemoryRouter } from "react-router";
import NaturalSearchPage from "./NaturalSearchPage";
import { fetchNaturalProperties } from "../api/client";

jest.mock("../api/client", () => ({
  fetchNaturalProperties: jest.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <NaturalSearchPage />
    </MemoryRouter>
  );
}

function enterQuery(query) {
  fireEvent.change(
    screen.getByLabelText("Describe your ideal home"),
    {
      target: { value: query },
    }
  );
}

function submitSearch() {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Search with AI",
    })
  );
}

describe("NaturalSearchPage", () => {
  beforeEach(() => {
    fetchNaturalProperties.mockReset();
  });

  test("renders the search form", () => {
    renderPage();

    expect(
      screen.getByRole("heading", {
        name: "AI Property Search",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Describe your ideal home")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Search with AI",
      })
    ).toBeInTheDocument();
  });

  test("submits natural language and displays properties", async () => {
    fetchNaturalProperties.mockResolvedValue({
      filters: {
        city: "Irvine",
        maxPrice: 500000,
        beds: 3,
      },
      total: 1,
      limit: 20,
      offset: 0,
      results: [
        {
          L_ListingID: "101",
          L_Address: "123 Test Street",
          L_City: "Irvine",
          L_State: "CA",
          L_SystemPrice: 450000,
          L_Keyword2: 3,
          LM_Dec_3: 2,
          LM_Int2_3: 1600,
          L_Photos: "[]",
        },
      ],
    });

    renderPage();

    enterQuery("3 bedrooms in Irvine under $500k");
    submitSearch();

    expect(fetchNaturalProperties).toHaveBeenCalledWith(
      "3 bedrooms in Irvine under $500k"
    );

    expect(
      await screen.findByText("123 Test Street")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Showing 1 of 1 properties")
    ).toBeInTheDocument();

    expect(
      screen.getByText("$500,000")
    ).toBeInTheDocument();

    expect(
      screen.getByText("3+")
    ).toBeInTheDocument();
  });

  test("rejects an empty query", () => {
    renderPage();

    submitSearch();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "Please describe the property you want."
    );

    expect(
      fetchNaturalProperties
    ).not.toHaveBeenCalled();
  });

  test("displays a helpful no-results message", async () => {
    fetchNaturalProperties.mockResolvedValue({
      filters: {
        city: "Irvine",
      },
      total: 0,
      limit: 20,
      offset: 0,
      results: [],
    });

    renderPage();

    enterQuery("homes in Irvine");
    submitSearch();

    expect(
      await screen.findByText(
        /No properties match your search/
      )
    ).toBeInTheDocument();
  });

  test("handles vague AI queries", async () => {
    fetchNaturalProperties.mockResolvedValue({
      message:
        "Please include a city, ZIP code, price, bedrooms, bathrooms, or year built.",
      filters: {},
      total: 0,
      limit: 20,
      offset: 0,
      results: [],
    });

    renderPage();

    enterQuery("cheap houses with lots of space");
    submitSearch();

    expect(
      await screen.findByText(
        /Please include a city/
      )
    ).toBeInTheDocument();
  });

  test("displays an API error", async () => {
    fetchNaturalProperties.mockRejectedValue(
      new Error(
        "AI search is temporarily unavailable."
      )
    );

    renderPage();

    enterQuery("3 bedrooms in Irvine");
    submitSearch();

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "AI search is temporarily unavailable."
    );
  });

  test("fills the form when an example is clicked", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "4 bedrooms in Beverly Hills",
      })
    );

    expect(
      screen.getByLabelText("Describe your ideal home")
    ).toHaveValue("4 bedrooms in Beverly Hills");
  });
});
