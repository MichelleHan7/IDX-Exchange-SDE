
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "./Pagination";

describe("Pagination Component", () => {
  let mockPageChange;

  beforeEach(() => {
    mockPageChange = jest.fn();
  });

  function renderPagination(currentPage, totalPages) {
    return render(
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={mockPageChange}
      />
    );
  }

  // Test 1: Hide pagination when only one page exists
  test("hides pagination when there is only one page", () => {
    renderPagination(1, 1);

    expect(
      screen.queryByRole("navigation", { name: "Pagination" })
    ).not.toBeInTheDocument();
  });

  // Test 2: Previous is disabled on the first page
  test("disables Previous on the first page", () => {
    renderPagination(1, 10);

    expect(
      screen.getByRole("button", { name: "Previous" })
    ).toBeDisabled();

    expect(
      screen.getByRole("button", { name: "Next" })
    ).toBeEnabled();
  });

  // Test 3: Next is disabled on the last page
  test("disables Next on the last page", () => {
    renderPagination(10, 10);

    expect(
      screen.getByRole("button", { name: "Next" })
    ).toBeDisabled();

    expect(
      screen.getByRole("button", { name: "Previous" })
    ).toBeEnabled();
  });

  // Test 4: Clicking Next changes to the next page
  test("calls onPageChange when Next is clicked", () => {
    renderPagination(3, 10);

    fireEvent.click(
      screen.getByRole("button", { name: "Next" })
    );

    expect(mockPageChange).toHaveBeenCalledWith(4);
    expect(mockPageChange).toHaveBeenCalledTimes(1);
  });

  // Test 5: Clicking Previous changes to the previous page
  test("calls onPageChange when Previous is clicked", () => {
    renderPagination(3, 10);

    fireEvent.click(
      screen.getByRole("button", { name: "Previous" })
    );

    expect(mockPageChange).toHaveBeenCalledWith(2);
  });

  // Test 6: Clicking a page number navigates correctly
  test("calls onPageChange when a page number is clicked", () => {
    renderPagination(5, 24);

    fireEvent.click(
      screen.getByRole("button", { name: "6" })
    );

    expect(mockPageChange).toHaveBeenCalledWith(6);
  });

  // Test 7: Ellipses appear in the middle
  test("renders ellipses for large page counts", () => {
    renderPagination(5, 24);

    expect(
      screen.getByRole("button", { name: "1" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "4" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "5" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "6" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "24" })
    ).toBeInTheDocument();

    expect(screen.getAllByText("...")).toHaveLength(2);
  });

  // Test 8: No ellipses for a small number of pages
  test("shows all page numbers when there are few pages", () => {
    renderPagination(3, 5);

    for (let page = 1; page <= 5; page++) {
      expect(
        screen.getByRole("button", { name: String(page) })
      ).toBeInTheDocument();
    }

    expect(screen.queryByText("...")).not.toBeInTheDocument();
  });

  // Test 9: No duplicate last page near the end
  test("does not duplicate page numbers near the last page", () => {
    renderPagination(23, 24);

    expect(
      screen.getAllByRole("button", { name: "24" })
    ).toHaveLength(1);

    expect(
      screen.getAllByRole("button", { name: "23" })
    ).toHaveLength(1);

    expect(screen.getAllByText("...")).toHaveLength(1);
  });

  // Test 10: Current page is marked correctly
  test("marks the current page with aria-current", () => {
    renderPagination(5, 24);

    const currentButton = screen.getByRole("button", {
      name: "5",
    });

    expect(currentButton).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  // Test 11: Page numbers remain unique on the last page
  test("does not duplicate numbers on the last page", () => {
    renderPagination(24, 24);

    const page24Buttons = screen.getAllByRole("button", {
      name: "24",
    });

    expect(page24Buttons).toHaveLength(1);

    expect(
      screen.getByRole("button", { name: "Next" })
    ).toBeDisabled();
  });
});
