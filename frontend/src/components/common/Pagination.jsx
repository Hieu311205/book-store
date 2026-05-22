import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  if (totalPages <= 1) return null

  const page = Number(currentPage)
  const total = Number(totalPages)

  const getPages = () => {
    const pages = new Set([1, total, page - 1, page, page + 1])

    const sorted = Array.from(pages)
      .filter((item) => item >= 1 && item <= total)
      .sort((a, b) => a - b)

    return sorted.reduce((result, item, index) => {
      if (index > 0 && item - sorted[index - 1] > 1) {
        result.push(`ellipsis-${sorted[index - 1]}-${item}`)
      }
      result.push(item)
      return result
    }, [])
  }

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > total || nextPage === page) return
    onPageChange(nextPage)
  }

  return (
    <nav className="store-pagination" aria-label="Phân trang">
      <button
        type="button"
        className="store-pagination-arrow"
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        aria-label="Trang trước"
      >
        <FiChevronLeft />
      </button>

      {getPages().map((item) =>
        typeof item === 'string' ? (
          <span className="store-pagination-ellipsis" key={item}>...</span>
        ) : (
          <button
            type="button"
            key={item}
            onClick={() => goToPage(item)}
            className={item === page ? 'store-pagination-page is-active' : 'store-pagination-page'}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="store-pagination-arrow"
        onClick={() => goToPage(page + 1)}
        disabled={page >= total}
        aria-label="Trang sau"
      >
        <FiChevronRight />
      </button>
    </nav>
  )
}

export default Pagination
