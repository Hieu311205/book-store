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

export const ProductCardSkeleton = () => (
  <div className="card p-4">
    <div className="skeleton h-48 w-full mb-4" />
    <div className="skeleton h-4 w-3/4 mb-2" />
    <div className="skeleton h-4 w-1/2 mb-4" />
    <div className="skeleton h-6 w-1/3" />
  </div>
)

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
)

export default Loading
