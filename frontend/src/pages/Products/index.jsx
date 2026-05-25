import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { FiFilter, FiX, FiBookOpen } from 'react-icons/fi'
import ProductGrid from '../../components/product/ProductGrid'
import Pagination from '../../components/common/Pagination'
import { productService } from '../../services/product.service'
import { categoryService } from '../../services/category.service'

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'popular', label: 'Phổ biến nhất' },
]

const flattenCategories = (items = [], depth = 0) =>
  items.flatMap((item) => [
    { ...item, depth },
    ...flattenCategories(item.children || [], depth + 1),
  ])

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  // State cục bộ cho price inputs — đồng bộ từ URL, debounce khi gõ
  const [localMin, setLocalMin] = useState(searchParams.get('min_price') || '')
  const [localMax, setLocalMax] = useState(searchParams.get('max_price') || '')
  const priceTimer = useRef(null)

  // Đồng bộ local price state khi URL thay đổi từ bên ngoài (e.g. clearFilters)
  useEffect(() => {
    setLocalMin(searchParams.get('min_price') || '')
    setLocalMax(searchParams.get('max_price') || '')
  }, [searchParams.get('min_price'), searchParams.get('max_price')])

  const params = {
    page: searchParams.get('page') || 1,
    limit: 12,
    sort: searchParams.get('sort') || 'newest',
    category: searchParams.get('category') || undefined,
    min_price: searchParams.get('min_price') || undefined,
    max_price: searchParams.get('max_price') || undefined,
    in_stock: searchParams.get('in_stock') === 'true' || undefined,
    featured: searchParams.get('featured') === 'true' || undefined,
    bestseller: searchParams.get('bestseller') === 'true' || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getProducts(params),
    select: (res) => res.data,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
    select: (res) => res.data,
  })

  const filterCategories = flattenCategories(categories)

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    if (key !== 'page') newParams.delete('page')
    setSearchParams(newParams)
  }

  const handlePriceChange = (key, value, setter) => {
    setter(value)
    clearTimeout(priceTimer.current)
    priceTimer.current = setTimeout(() => updateParam(key, value), 600)
  }

  const clearFilters = () => {
    setLocalMin('')
    setLocalMax('')
    setSearchParams({})
  }

  const hasFilters = searchParams.toString().length > 0

  // Tính danh sách filter đang active để hiển thị chip
  const activeCat = filterCategories.find(
    (c) => String(c.id) === params.category || c.slug === params.category
  )
  const activeFilterList = [
    activeCat && { key: 'category', label: activeCat.name },
    params.min_price && { key: 'min_price', label: `Từ ${Number(params.min_price).toLocaleString('vi-VN')}đ` },
    params.max_price && { key: 'max_price', label: `Đến ${Number(params.max_price).toLocaleString('vi-VN')}đ` },
    params.in_stock && { key: 'in_stock', label: 'Còn hàng' },
    params.featured && { key: 'featured', label: 'Sách nổi bật' },
    params.bestseller && { key: 'bestseller', label: 'Bán chạy' },
  ].filter(Boolean)

  const filterPanel = (
    <>
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Bộ lọc</h3>
        {hasFilters && (
          <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-600">
            Xóa tất cả
          </button>
        )}
      </div>

      <div>
        <h4 className="font-medium mb-3">Danh mục</h4>
        <div className="space-y-2">
          {filterCategories.map((cat) => {
            const value = cat.slug || String(cat.id)
            return (
              <label
                key={cat.id}
                className="flex items-center gap-2 cursor-pointer"
                style={{ paddingLeft: `${cat.depth * 12}px` }}
              >
                <input
                  type="radio"
                  name="category"
                  checked={params.category === value}
                  onChange={() => updateParam('category', params.category === value ? '' : value)}
                  className="text-primary-600"
                />
                <span className="text-sm">{cat.name}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Khoảng giá</h4>
        <div className="space-y-2">
          <input
            type="number"
            placeholder="Tối thiểu"
            value={localMin}
            onChange={(e) => handlePriceChange('min_price', e.target.value, setLocalMin)}
            className="input text-sm"
          />
          <input
            type="number"
            placeholder="Tối đa"
            value={localMax}
            onChange={(e) => handlePriceChange('max_price', e.target.value, setLocalMax)}
            className="input text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={params.in_stock || false}
          onChange={(e) => updateParam('in_stock', e.target.checked ? 'true' : '')}
          className="text-primary-600 rounded"
        />
        <span className="text-sm">Chỉ sách còn hàng</span>
      </label>

      <div>
        <h4 className="font-medium mb-3">Nổi bật</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={params.featured || false}
              onChange={(e) => updateParam('featured', e.target.checked ? 'true' : '')}
              className="text-primary-600 rounded"
            />
            <span className="text-sm">Sách nổi bật</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={params.bestseller || false}
              onChange={(e) => updateParam('bestseller', e.target.checked ? 'true' : '')}
              className="text-primary-600 rounded"
            />
            <span className="text-sm">Sách bán chạy</span>
          </label>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex gap-6">
      {/* Sidebar filter — desktop */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-xl p-4 space-y-6">
          {filterPanel}
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Toolbar: count + sort */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowFilters(true)} className="lg:hidden btn btn-secondary">
              <FiFilter />
              Bộ lọc
            </button>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {isLoading ? '...' : `${data?.pagination?.totalItems || 0} cuốn sách`}
            </p>
          </div>

          <select
            value={params.sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="input w-auto"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Active filter chips */}
        {activeFilterList.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFilterList.map((f) => (
              <button
                key={f.key}
                onClick={() => updateParam(f.key, '')}
                className="store-filter-chip"
              >
                {f.label}
                <FiX size={12} />
              </button>
            ))}
            {activeFilterList.length > 1 && (
              <button onClick={clearFilters} className="store-filter-chip store-filter-chip-clear">
                Xóa tất cả
              </button>
            )}
          </div>
        )}

        <ProductGrid products={data?.products} isLoading={isLoading} />

        {/* Empty state khi không có kết quả */}
        {!isLoading && data?.products?.length === 0 && (
          <div className="store-empty-state py-16 flex-col gap-4">
            <FiBookOpen size={48} className="text-gray-300" />
            <p className="text-gray-500">Không tìm thấy sách phù hợp với bộ lọc này.</p>
            {hasFilters && (
              <button onClick={clearFilters} className="btn btn-outline mt-2">
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {data?.pagination && data.pagination.totalPages > 1 && (
          <Pagination
            currentPage={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPageChange={(nextPage) => {
              updateParam('page', String(nextPage))
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        )}
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilters(false)}>
          <div
            className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Bộ lọc</h3>
              <button onClick={() => setShowFilters(false)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="space-y-6">
              {filterPanel}
              <button onClick={() => setShowFilters(false)} className="btn btn-primary w-full">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
