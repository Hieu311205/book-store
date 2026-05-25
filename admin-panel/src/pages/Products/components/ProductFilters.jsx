import { FiFilter, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi'
import { sortOptions, statusOptions } from '../utils/productHelpers'

const ProductFilters = ({
  filters,
  setters,
  categories,
  authors,
  publishers,
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
      <div className="relative flex-1 min-w-52">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => { setters.setSearch(e.target.value); setters.setPage(1) }}
          placeholder="Tên sách, tác giả, ISBN..."
          className="input pl-9 text-sm"
        />
      </div>

      <select value={filters.category} onChange={(e) => { setters.setCategory(e.target.value); setters.setPage(1) }} className="input w-auto text-sm">
        <option value="">Tất cả danh mục</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>

      <select value={filters.status} onChange={(e) => { setters.setStatus(e.target.value); setters.setPage(1) }} className="input w-auto text-sm">
        {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>

      <select value={filters.sort} onChange={(e) => { setters.setSort(e.target.value); setters.setPage(1) }} className="input w-auto text-sm">
        {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>

      <button onClick={() => setShowAdvanced((current) => !current)} className={`btn text-sm gap-1.5 ${showAdvanced ? 'btn-primary' : 'btn-outline'}`}>
        <FiFilter size={14} /> Nâng cao
      </button>

      <button onClick={() => refetch()} disabled={isFetching} className="btn btn-outline text-sm gap-1.5">
        <FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Làm mới
      </button>

      {hasFilters && (
        <button onClick={resetFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium">
          <FiX size={14} /> Xóa bộ lọc
        </button>
      )}
    </div>

    {showAdvanced && (
      <div className="flex flex-wrap gap-4 items-end pt-3 border-t dark:border-gray-700">
        <div className="flex flex-col gap-1 min-w-40">
          <span className="text-xs font-medium text-gray-500">Tác giả</span>
          <select value={filters.author} onChange={(e) => { setters.setAuthor(e.target.value); setters.setPage(1) }} className="input text-sm">
            <option value="">Tất cả tác giả</option>
            {authors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-40">
          <span className="text-xs font-medium text-gray-500">Nhà xuất bản</span>
          <select value={filters.publisher} onChange={(e) => { setters.setPublisher(e.target.value); setters.setPage(1) }} className="input text-sm">
            <option value="">Tất cả NXB</option>
            {publishers.map((publisher) => <option key={publisher.id} value={publisher.id}>{publisher.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Giá từ (đ)</span>
          <input type="number" min="0" value={filters.priceMin} onChange={(e) => { setters.setPriceMin(e.target.value); setters.setPage(1) }} placeholder="Tối thiểu" className="input text-sm w-36" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Giá đến (đ)</span>
          <input type="number" min="0" value={filters.priceMax} onChange={(e) => { setters.setPriceMax(e.target.value); setters.setPage(1) }} placeholder="Tối đa" className="input text-sm w-36" />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none self-end pb-2">
          <input type="checkbox" checked={filters.isFeatured} onChange={(e) => { setters.setIsFeatured(e.target.checked); setters.setPage(1) }} className="rounded w-4 h-4" />
          <span className="text-sm">Chỉ sách nổi bật</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none self-end pb-2">
          <input type="checkbox" checked={filters.isBestseller} onChange={(e) => { setters.setIsBestseller(e.target.checked); setters.setPage(1) }} className="rounded w-4 h-4" />
          <span className="text-sm">Chỉ sách bán chạy</span>
        </label>
      </div>
    )}

    <div className="flex items-center justify-between text-sm text-gray-500 pt-1">
      <span>
        {isFetching ? 'Đang tải...' : `${totalItems} sách`}
        {hasFilters && <span className="ml-2 text-primary-600 font-medium">(đang lọc)</span>}
      </span>
      {totalPages > 1 && <span>Trang {page} / {totalPages}</span>}
    </div>
  </div>
)

export default ProductFilters
