import ListingsPage from "./pages/ListingsPage";
import { BrowserRouter, Routes, Route } from "react-router";
import PropertyDetailPage from "./pages/PropertyDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ListingsPage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;