import { useEffect, useRef, useState } from "react";
import { fetchProperties } from "../api/client";

const ITEMS_PER_PAGE = 20;

export default function usePropertySearch() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const requestVersion = useRef(0);

  useEffect(() => {
    let ignore = false;
    const currentVersion = requestVersion.current;

    async function loadProperties() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchProperties({
          ...appliedFilters,
          limit: ITEMS_PER_PAGE,
          offset: (currentPage - 1) * ITEMS_PER_PAGE,
        });

        if (!ignore && currentVersion === requestVersion.current) {
          setProperties(data.results);
          setTotal(data.total);
        }
      } catch (err) {
        if (!ignore && currentVersion === requestVersion.current) {
          setError(err.message);
          setProperties([]);
          setTotal(0);
        }
      } finally {
        if (!ignore && currentVersion === requestVersion.current) {
          setLoading(false);
        }
      }
    }

    loadProperties();

    return () => {
      ignore = true;
    };
  }, [appliedFilters, currentPage]);

  function handleSearch(filters) {
    requestVersion.current += 1;

    setLoading(true);
    setError("");
    setProperties([]);
    setTotal(0);
    setCurrentPage(1);
    setAppliedFilters({ ...filters });
  }

  function handleClear() {
    handleSearch({});
  }

  function handlePageChange(newPage) {
    const maxPage = Math.ceil(total / ITEMS_PER_PAGE);

    if (
      newPage < 1 ||
      newPage > maxPage ||
      newPage === currentPage ||
      loading
    ) {
      return false;
    }

    requestVersion.current += 1;

    setLoading(true);
    setError("");
    setProperties([]);
    setCurrentPage(newPage);

    return true;
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const startItem =
    total === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(
    (currentPage - 1) * ITEMS_PER_PAGE + properties.length,
    total
  );

  return {
    properties,
    total,
    loading,
    error,
    currentPage,
    totalPages,
    startItem,
    endItem,
    handleSearch,
    handleClear,
    handlePageChange,
  };
}
