import { useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import PaginationNumbers from '../../../components/common/PaginationNumbers'
import { formatPrice } from '../utils/productHelpers'
import ProductActions from './ProductActions'

const ProductImageCell = ({ product }) => {
  const images = [
    product.images?.[0]?.image_url || '/placeholder.jpg',
    ...(product.preview_images || []).map((preview) => preview.image_url),
  ].filter(Boolean)
  const uniqueImages = [...new Set(images)]
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedImage = uniqueImages[selectedIndex] || '/placeholder.jpg'
  const previewImages = uniqueImages.slice(1)
  const visiblePreviews = previewImages.slice(0, 2)
  const hiddenPreviewCount = Math.max(0, previewImages.length - visiblePreviews.length)

  const cycleHiddenPreview = () => {
    if (!previewImages.length) return
    const nextIndex = selectedIndex <= 0 || selectedIndex >= uniqueImages.length - 1 ? 1 : selectedIndex + 1
    setSelectedIndex(nextIndex >= uniqueImages.length ? 1 : nextIndex)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => uniqueImages.length > 1 && setSelectedIndex((selectedIndex + 1) % uniqueImages.length)}
        className="w-10 h-14 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0"
        title={uniqueImages.length > 1 ? 'Bam de chuyen anh' : 'Anh bia'}
      >
        <img src={selectedImage} alt="" className="w-full h-full object-cover" />
      </button>
      {previewImages.length > 0 && (
        <div className="flex items-center gap-1">
          {visiblePreviews.map((imageUrl, index) => {
            const imageIndex = index + 1
            return (
              <button
                key={imageUrl}
                type="button"
                onClick={() => setSelectedIndex(imageIndex)}
                title="Xem anh doc thu"
                className={`block h-7 w-5 overflow-hidden rounded border bg-gray-100 ${
                  selectedIndex === imageIndex ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              </button>
            )
          })}
          {hiddenPreviewCount > 0 && (
            <button
              type="button"
              onClick={cycleHiddenPreview}
              className="inline-flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-[10px] font-bold text-white hover:bg-primary-600"
              title="Chuyen anh doc thu tiep theo"
            >
              +{hiddenPreviewCount}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const ProductTable = ({
  products,
  isLoading,
  hasFilters,
  page,
  setPage,
  totalPages,
  totalItems,
  onEdit,
  onDelete,
}) => (
  <div className="card">
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th className="w-12">Ảnh</th>
            <th>Tên sách</th>
            <th>Danh mục</th>
            <th>Tác giả</th>
            <th>Nhà xuất bản</th>
            <th className="text-right">Giá bán</th>
            <th className="text-center">Tồn kho</th>
            <th className="text-center">Nhãn</th>
            <th className="text-center w-20">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={9} className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </td>
            </tr>
          ) : !products?.length ? (
            <tr>
              <td colSpan={9} className="py-12 text-center text-gray-400">
                {hasFilters ? 'Không tìm thấy sách phù hợp với bộ lọc' : 'Chưa có sách nào'}
              </td>
            </tr>
          ) : products.map((product) => (
            <tr key={product.id}>
              <td>
                <ProductImageCell product={product} />
              </td>
              <td>
                <p className="font-medium text-sm leading-snug">{product.title}</p>
                {product.isbn && <p className="text-xs text-gray-400">ISBN: {product.isbn}</p>}
              </td>
              <td className="text-sm text-gray-500">{product.category_name || '—'}</td>
              <td className="text-sm text-gray-500">{product.author_name || '—'}</td>
              <td className="text-sm text-gray-500">{product.publisher_name || '—'}</td>
              <td className="text-right">
                <p className="font-semibold text-sm whitespace-nowrap">{formatPrice(product.price)} đ</p>
                {Number(product.compare_price) > Number(product.price) && (
                  <p className="text-xs text-gray-400 line-through">{formatPrice(product.compare_price)}</p>
                )}
              </td>
              <td className="text-center">
                <span className={`text-sm font-semibold ${product.stock === 0 ? 'text-red-500' : product.stock < 10 ? 'text-orange-500' : ''}`}>
                  {product.stock}
                </span>
              </td>
              <td className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className={`badge ${product.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {product.is_active ? 'Đang bán' : 'Ẩn'}
                  </span>
                  {Boolean(product.is_featured) && <span className="badge badge-info">Nổi bật</span>}
                  {Number(product.sales_count) > 0 && <span className="badge badge-warning">Bán chạy</span>}
                </div>
              </td>
              <td>
                <ProductActions product={product} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {totalPages > 0 && (
      <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
        <p className="text-sm text-gray-500">
          Trang <span className="font-medium text-gray-800 dark:text-gray-100">{page}</span> / {totalPages}
          &nbsp;·&nbsp;{totalItems} sách
        </p>
        <div className="flex items-center gap-1">
          <button disabled={page === 1} onClick={() => setPage(1)} className="btn btn-outline btn-sm px-2" title="Trang đầu">«</button>
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn btn-outline btn-sm flex items-center gap-1">
            <FiChevronLeft size={14} /> Trước
          </button>
          <PaginationNumbers page={page} totalPages={totalPages} onPageChange={setPage} />
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn btn-outline btn-sm flex items-center gap-1">
            Sau <FiChevronRight size={14} />
          </button>
          <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="btn btn-outline btn-sm px-2" title="Trang cuối">»</button>
        </div>
      </div>
    )}
  </div>
)

export default ProductTable
