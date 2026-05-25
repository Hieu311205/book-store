import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import PaginationNumbers from '../../../components/common/PaginationNumbers'
import CategoryActions from './CategoryActions'

const CategoryTable = ({
  categories,
  isLoading,
  hasFilters,
  page,
  setPage,
  totalPages,
  totalItems,
  onEdit,
  onDelete,
  isDeleting,
}) => (
  <div className="card">
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Danh mục cha</th>
            <th>Thứ tự</th>
            <th>Sách</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={6} className="text-center py-8">Đang tải...</td></tr>
          ) : categories.length ? categories.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="font-medium">{item.name}</div>
                {item.name_en && <div className="text-xs text-gray-500">{item.name_en}</div>}
              </td>
              <td>{item.parent_name || '-'}</td>
              <td>{item.sort_order}</td>
              <td>{item.product_count || 0}</td>
              <td>
                <span className={`badge ${Number(item.is_active) ? 'badge-success' : 'badge-danger'}`}>
                  {Number(item.is_active) ? 'Hiện' : 'Ẩn'}
                </span>
              </td>
              <td>
                <CategoryActions item={item} onEdit={onEdit} onDelete={onDelete} isDeleting={isDeleting} />
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-500">
                {hasFilters ? 'Không tìm thấy danh mục phù hợp với bộ lọc' : 'Chưa có danh mục'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {totalPages > 0 && (
      <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
        <p className="text-sm text-gray-500">
          Trang <span className="font-medium text-gray-800 dark:text-gray-100">{page}</span> / {totalPages}
          &nbsp;·&nbsp;{totalItems} danh mục
        </p>
        <div className="flex items-center gap-1">
          <button disabled={page === 1} onClick={() => setPage(1)} className="btn btn-outline btn-sm px-2" title="Trang đầu">«</button>
          <button disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="btn btn-outline btn-sm flex items-center gap-1">
            <FiChevronLeft size={14} /> Trước
          </button>
          <PaginationNumbers page={page} totalPages={totalPages} onPageChange={setPage} />
          <button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="btn btn-outline btn-sm flex items-center gap-1">
            Sau <FiChevronRight size={14} />
          </button>
          <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="btn btn-outline btn-sm px-2" title="Trang cuối">»</button>
        </div>
      </div>
    )}
  </div>
)

export default CategoryTable
