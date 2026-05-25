const Loading = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`${sizeClasses[size]} border-4 border-gray-200 dark:border-gray-700 border-t-primary-600 rounded-full animate-spin`}
      />
    </div>
  )
}

export const PageLoading = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <Loading size="lg" />
  </div>
)

// Skeleton khớp với tỉ lệ thực của store-book-card (3:4 cover + info)
export const ProductCardSkeleton = () => (
  <div className="store-book-card">
    <div className="skeleton" style={{ aspectRatio: '3/4', width: '100%', borderRadius: 0 }} />
    <div className="store-book-info">
      <div className="skeleton rounded mb-2" style={{ height: '0.9rem', width: '100%' }} />
      <div className="skeleton rounded mb-3" style={{ height: '0.8rem', width: '70%' }} />
      <div className="skeleton rounded mb-3" style={{ height: '0.75rem', width: '45%' }} />
      <div className="skeleton rounded" style={{ height: '1.1rem', width: '55%' }} />
    </div>
  </div>
)

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
)

// Skeleton cho trang chi tiết sản phẩm — khớp layout 2 cột
export const ProductDetailSkeleton = () => (
  <div className="store-product-detail-page">
    <div className="store-detail-breadcrumb">
      <div className="skeleton rounded" style={{ height: '1rem', width: '18rem' }} />
    </div>

    <div className="store-detail-layout">
      {/* Gallery */}
      <div className="store-detail-gallery">
        <div className="skeleton rounded-lg" style={{ minHeight: '36rem' }} />
        <div className="store-detail-thumbs">
          {[0, 1, 2].map((i) => (
            <div key={i} className="store-detail-thumb skeleton" style={{ border: 'none' }} />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="store-detail-info" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div className="skeleton rounded" style={{ height: '2.2rem', width: '85%' }} />
        <div className="skeleton rounded" style={{ height: '1rem', width: '60%' }} />
        <div className="skeleton rounded" style={{ height: '1rem', width: '55%' }} />
        <div className="skeleton rounded" style={{ height: '1rem', width: '48%' }} />
        <div className="skeleton rounded" style={{ height: '2.5rem', width: '40%' }} />
        <div className="skeleton rounded" style={{ height: '2.75rem', width: '9rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          <div className="skeleton rounded" style={{ height: '4.4rem' }} />
          <div className="skeleton rounded" style={{ height: '4.4rem' }} />
          <div className="skeleton rounded" style={{ height: '3rem' }} />
          <div className="skeleton rounded" style={{ height: '3rem' }} />
        </div>
      </div>
    </div>
  </div>
)

export default Loading
