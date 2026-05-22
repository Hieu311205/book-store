import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { FiFilter, FiX } from 'react-icons/fi'
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

  const clearFilters = () => setSearchParams({})
  const hasFilters = searchParams.toString().length > 0

  const filters = (
    <>
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Bộ lọc</h3>
        {hasFilters && (
          <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-600">
            Xóa
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
            value={params.min_price || ''}
            onChange={(e) => updateParam('min_price', e.target.value)}
            className="input text-sm"
          />
          <input
            type="number"
            placeholder="Tối đa"
            value={params.max_price || ''}
            onChange={(e) => updateParam('max_price', e.target.value)}
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
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-xl p-4 space-y-6">
          {filters}
        </div>
      </aside>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowFilters(true)} className="lg:hidden btn btn-secondary">
              <FiFilter />
              Bộ lọc
            </button>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {data?.pagination?.totalItems || 0} cuốn sách
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

        <ProductGrid products={data?.products} isLoading={isLoading} />

        {data?.pagination && (
          <Pagination
            currentPage={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPageChange={(nextPage) => updateParam('page', String(nextPage))}
          />
        )}
      </div>

      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
          <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Bộ lọc</h3>
              <button onClick={() => setShowFilters(false)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="space-y-6">
              {filters}
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
