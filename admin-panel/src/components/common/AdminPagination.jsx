import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import PaginationNumbers from './PaginationNumbers'

const AdminPagination = ({ page, totalPages, onPageChange }) => {
  const safeTotalPages = Math.max(1, Number(totalPages || 1))
  const currentPage = Math.min(Math.max(Number(page || 1), 1), safeTotalPages)

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(1)}
        className="btn btn-outline btn-sm px-2"
        title="Trang đầu"
      >
        «
      </button>
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange((value) => Math.max(1, value - 1))}
        className="btn btn-outline btn-sm flex items-center gap-1"
      >
        <FiChevronLeft size={14} /> Trước
      </button>
      <PaginationNumbers page={currentPage} totalPages={safeTotalPages} onPageChange={onPageChange} />
      <button
        type="button"
        disabled={currentPage >= safeTotalPages}
        onClick={() => onPageChange((value) => Math.min(safeTotalPages, value + 1))}
        className="btn btn-outline btn-sm flex items-center gap-1"
      >
        Sau <FiChevronRight size={14} />
      </button>
      <button
        type="button"
        disabled={currentPage >= safeTotalPages}
        onClick={() => onPageChange(safeTotalPages)}
        className="btn btn-outline btn-sm px-2"
        title="Trang cuối"
      >
        »
      </button>
    </div>
  )
}

export default AdminPagination
