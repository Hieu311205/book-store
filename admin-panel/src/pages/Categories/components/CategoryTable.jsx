import { useMemo, useState } from 'react'
import { FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import PaginationNumbers from '../../../components/common/PaginationNumbers'
import CategoryActions from './CategoryActions'

const getVisibleCategories = (categories, expandedIds) => (
  categories.filter((item) => {
    if (!item.parent_id) return true
    let parentId = Number(item.parent_id)
    while (parentId) {
      if (!expandedIds.has(parentId)) return false
      const parent = categories.find((category) => Number(category.id) === parentId)
      parentId = parent?.parent_id ? Number(parent.parent_id) : 0
    }
    return true
  })
)

const TreeMarker = ({ item, hasChildren, expanded, onToggle }) => {
  const depth = Number(item.depth || 0)
  if (depth >= 2) {
    return <span className="h-px w-3 bg-gray-400" />
  }
  if (hasChildren) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex h-5 w-5 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        title={expanded ? 'Thu gọn' : 'Mở rộng'}
      >
        <FiChevronDown size={14} className={`text-gray-400 transition-transform ${expanded ? '' : '-rotate-90'}`} />
      </button>
    )
  }
  return <span className="h-px w-3 bg-gray-400" />
}

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
}) => {
  const childCountByParent = useMemo(() => (
    categories.reduce((map, item) => {
      if (item.parent_id) {
        const parentId = Number(item.parent_id)
        map[parentId] = (map[parentId] || 0) + 1
      }
      return map
    }, {})
  ), [categories])

  const [expandedIds, setExpandedIds] = useState(() => new Set())

  const visibleCategories = useMemo(
    () => getVisibleCategories(categories, expandedIds),
    [categories, expandedIds]
  )

  const toggleExpanded = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      const value = Number(id)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  return (
    <div className="card">
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên danh mục</th>
              <th>Sách</th>
              <th>Trạng thái</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8">Đang tải...</td></tr>
            ) : visibleCategories.length ? visibleCategories.map((item) => {
            const depth = Number(item.depth || 0)
            const hasChildren = Boolean(childCountByParent[Number(item.id)])
            const expanded = expandedIds.has(Number(item.id))
            return (
              <tr key={item.id}>
                <td>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-14 w-14 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-[10px] text-gray-400 dark:border-gray-700 dark:bg-gray-800">
                      Không ảnh
                    </div>
                  )}
                </td>
                <td>
                  <div className="flex items-center gap-2 font-medium" style={{ paddingLeft: `${depth * 24}px` }}>
                    <TreeMarker
                      item={item}
                      hasChildren={hasChildren}
                      expanded={expanded}
                      onToggle={() => toggleExpanded(item.id)}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.name_en && <div className="text-xs text-gray-500" style={{ paddingLeft: `${depth * 24 + 22}px` }}>{item.name_en}</div>}
                </td>
                <td>{item.product_count || 0}</td>
                <td>
                  <span className={`badge ${Number(item.is_active) ? 'badge-success' : 'badge-danger'}`}>
                    {Number(item.is_active) ? 'Hiện' : 'Ẩn'}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end">
                    <CategoryActions item={item} onEdit={onEdit} onDelete={onDelete} isDeleting={isDeleting} />
                  </div>
                </td>
              </tr>
            )
            }) : (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
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
}

export default CategoryTable
