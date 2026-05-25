import { FiFilter, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi'
import { parentFilterOptions, sortOptions, statusOptions } from '../utils/categoryHelpers'

const CategoryFilters = ({
  filters,
  setters,
  showAdvanced,
  setShowAdvanced,
  hasFilters,
  isFetching,
  refetch,
  resetFilters,
  totalItems,
  totalPages,
  page,
}) => (
  <div className="card p-4 space-y-3">
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-64">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => { setters.setSearch(e.target.value); setters.setPage(1) }}
          placeholder="Tên danh mục, tên tiếng Anh..."
          className="input pl-9 text-sm"
        />
      </div>

      <select value={filters.status} onChange={(e) => { setters.setStatus(e.target.value); setters.setPage(1) }} className="input w-auto text-sm">
        {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>

      <select value={filters.sort} onChange={(e) => { setters.setSort(e.target.value); setters.setPage(1) }} className="input w-auto text-sm">
        {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>

      <button type="button" onClick={() => setShowAdvanced((current) => !current)} className={`btn text-sm gap-1.5 ${showAdvanced ? 'btn-primary' : 'btn-outline'}`}>
        <FiFilter size={14} /> Nâng cao
      </button>

      <button type="button" onClick={() => refetch()} disabled={isFetching} className="btn btn-outline text-sm gap-1.5">
        <FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Làm mới
      </button>

      {hasFilters && (
        <button type="button" onClick={resetFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium">
          <FiX size={14} /> Xóa bộ lọc
        </button>
      )}
    </div>

    {showAdvanced && (
      <div className="flex flex-wrap gap-4 items-end pt-3 border-t dark:border-gray-700">
        <div className="flex flex-col gap-1 min-w-44">
          <span className="text-xs font-medium text-gray-500">Cấp danh mục</span>
          <select value={filters.parentFilter} onChange={(e) => { setters.setParentFilter(e.target.value); setters.setPage(1) }} className="input text-sm">
            {parentFilterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </div>
    )}

    <div className="flex items-center justify-between text-sm text-gray-500 pt-1">
      <span>
        {isFetching ? 'Đang tải...' : `${totalItems} danh mục`}
        {hasFilters && <span className="ml-2 text-primary-600 font-medium">(đang lọc)</span>}
      </span>
      {totalPages > 1 && <span>Trang {page} / {totalPages}</span>}
    </div>
  </div>
)

export default CategoryFilters
