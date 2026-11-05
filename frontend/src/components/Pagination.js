
import "./Pagination.css";

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  // Hide pagination when there is only one page.
  if (totalPages <= 1) {
    return null;
  }

  // Always include the first and last pages.
  const pageSet = new Set([1, totalPages]);

  // Include the current page and its neighbors.
  for (
    let page = Math.max(1, currentPage - 1);
    page <= Math.min(totalPages, currentPage + 1);
    page++
  ) {
    pageSet.add(page);
  }

  // Sort page numbers in ascending order.
  const sortedPages = [...pageSet].sort((a, b) => a - b);

  // Insert ellipses or missing page numbers.
  const pages = [];

  sortedPages.forEach((page, index) => {
    if (index > 0) {
      const previous = sortedPages[index - 1];
      const gap = page - previous;

      if (gap === 2) {
        pages.push(previous + 1);
      } else if (gap > 2) {
        pages.push("...");
      }
    }

    pages.push(page);
  });

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>

      {pages.map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="pagination-ellipsis"
            >
              ...
            </span>
          );
        }

        return (
          <button
            type="button"
            key={page}
            className={page === currentPage ? "active" : ""}
            aria-current={page === currentPage ? "page" : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </nav>
  );
}

export default Pagination;
