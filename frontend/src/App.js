import { BrowserRouter, Link, Routes, Route } from "react-router";

import ListingsPage from "./pages/ListingsPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import NaturalSearchPage from "./pages/NaturalSearchPage";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <BrowserRouter>
      <nav
        aria-label="Main navigation"
        style={{
          display: "flex",
          gap: "24px",
          padding: "16px 8%",
          background: "#102a43",
        }}
      >
        <Link to="/" style={{ color: "#ffffff" }}>
          Property Listings
        </Link>

        <Link
          to="/search/natural"
          style={{ color: "#ffffff" }}
        >
          AI Property Search
        </Link>
      </nav>

      <ErrorBoundary>
        <Routes>
          <Route
            path="/"
            element={<ListingsPage />}
          />

          <Route
            path="/property/:id"
            element={<PropertyDetailPage />}
          />

          <Route
            path="/search/natural"
            element={<NaturalSearchPage />}
          />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
