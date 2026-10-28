
import { render, screen } from "@testing-library/react";
import App from "./App";
import { fetchProperties } from "./api/client";

jest.mock("./api/client", () => ({
  fetchProperties: jest.fn(),
}));

test("renders the property listings application", async () => {
  fetchProperties.mockResolvedValue({
    total: 0,
    limit: 20,
    offset: 0,
    results: [],
  });

  render(<App />);

  expect(
    screen.getByText("IDX Exchange Property Listings")
  ).toBeInTheDocument();

  expect(
    screen.getByText("Search Properties")
  ).toBeInTheDocument();

  expect(
    await screen.findByText("Showing 0 of 0 properties")
  ).toBeInTheDocument();
});
