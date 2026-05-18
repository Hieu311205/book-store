const getPaginationItems = (page, totalPages) => {
  const current = Math.min(Math.max(Number(page) || 1, 1), totalPages)
  const pages = new Set([1, totalPages, current - 1, current, current + 1])
  const visiblePages = Array.from(pages)
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b)

  return visiblePages.reduce((items, item, index) => {
    const previous = visiblePages[index - 1]
    if (previous && item - previous > 1) {
      items.push(`ellipsis-${previous}-${item}`)
    }
    items.push(item)
    return items
  }, [])
}

const PaginationNumbers = ({ page, totalPages, onPageChange }) => {
  const items = getPaginationItems(page, totalPages)

  return items.map((item) => {
    if (typeof item === 'string') {
      return (
        <span key={item} className="px-2 text-sm text-gray-500 select-none">
          ...
        </span>
      )
    }

    return (
      <button
        key={item}
        onClick={() => onPageChange(item)}
        className={`btn btn-sm px-3 ${item === page ? 'btn-primary' : 'btn-outline'}`}
      >
        {item}
      </button>
    )
  })
}

export default PaginationNumbers
