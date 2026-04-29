import ProductCard from './ProductCard'
import { ProductGridSkeleton } from '../common/Loading'

const ProductGrid = ({ products, isLoading, columns = 4 }) => {
  if (isLoading) {
    return <ProductGridSkeleton count={8} />
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Không tìm thấy sách</p>
      </div>
    )
  }

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  }

  return (
    <div className={`grid ${gridCols[columns] || gridCols[4]} gap-4`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default ProductGrid
