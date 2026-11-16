import {
  render,
  screen,
  fireEvent,
} from "@testing-library/react";

import ErrorBoundary from "./ErrorBoundary";

describe("ErrorBoundary", () => {
  let consoleSpy;

  beforeEach(() => {
    // React logs expected render failures during this test.
    consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <p>Normal content</p>
      </ErrorBoundary>
    );

    expect(
      screen.getByText("Normal content")
    ).toBeInTheDocument();
  });

  test("shows recovery UI and retries after a render error", () => {
    let shouldThrow = true;

    function TestComponent() {
      if (shouldThrow) {
        throw new Error("Test rendering failure");
      }

      return <p>Recovered successfully</p>;
    }

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(
      screen.getByRole("heading", {
        name: "Something went wrong",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Return to Listings",
      })
    ).toHaveAttribute("href", "/");

    // Simulate the underlying problem being resolved.
    shouldThrow = false;

    fireEvent.click(
      screen.getByRole("button", {
        name: "Try Again",
      })
    );

    expect(
      screen.getByText("Recovered successfully")
    ).toBeInTheDocument();
  });
});
