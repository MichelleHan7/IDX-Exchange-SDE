
import { render, screen, fireEvent } from "@testing-library/react";
import PropertyFilters from "./PropertyFilters";

describe("PropertyFilters Component", () => {
  let mockSearch;
  let mockClear;

  beforeEach(() => {
    mockSearch = jest.fn();
    mockClear = jest.fn();
  });

  function renderFilters() {
    render(
      <PropertyFilters
        onSearch={mockSearch}
        onClear={mockClear}
      />
    );
  }

  // Test 1: All six filters render correctly
  test("renders all six filter inputs", () => {
    renderFilters();

    expect(screen.getByLabelText("City")).toBeInTheDocument();
    expect(screen.getByLabelText("ZIP Code")).toBeInTheDocument();
    expect(screen.getByLabelText("Min Price")).toBeInTheDocument();
    expect(screen.getByLabelText("Max Price")).toBeInTheDocument();
    expect(screen.getByLabelText("Bedrooms")).toBeInTheDocument();
    expect(screen.getByLabelText("Bathrooms")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Search" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Clear Filters" })
    ).toBeInTheDocument();
  });

  // Test 2: Search sends the correct filters
  test("submits selected filters correctly", () => {
    renderFilters();

    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "Irvine" },
    });

    fireEvent.change(screen.getByLabelText("Min Price"), {
      target: { value: "300000" },
    });

    fireEvent.change(screen.getByLabelText("Bedrooms"), {
      target: { value: "3" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Search" })
    );

    expect(mockSearch).toHaveBeenCalledWith({
      city: "Irvine",
      minPrice: "300000",
      beds: "3",
    });
  });

  // Test 3: Empty filters are excluded
  test("does not submit empty filter values", () => {
    renderFilters();

    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "Los Angeles" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Search" })
    );

    expect(mockSearch).toHaveBeenCalledWith({
      city: "Los Angeles",
    });
  });

  // Test 4: Clear Filters resets the form
  test("clears filter inputs and calls onClear", () => {
    renderFilters();

    const cityInput = screen.getByLabelText("City");
    const bedsInput = screen.getByLabelText("Bedrooms");

    fireEvent.change(cityInput, {
      target: { value: "Irvine" },
    });

    fireEvent.change(bedsInput, {
      target: { value: "3" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Clear Filters" })
    );

    expect(cityInput).toHaveValue("");
    expect(bedsInput).toHaveValue("");
    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  // Test 5: Invalid price range is rejected
  test("rejects minimum price greater than maximum price", () => {
    renderFilters();

    fireEvent.change(screen.getByLabelText("Min Price"), {
      target: { value: "900000" },
    });

    fireEvent.change(screen.getByLabelText("Max Price"), {
      target: { value: "300000" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Search" })
    );

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "Minimum price cannot exceed maximum price."
    );

    expect(mockSearch).not.toHaveBeenCalled();
  });
});
