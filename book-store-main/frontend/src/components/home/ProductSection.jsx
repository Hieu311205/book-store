import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import ProductGrid from '../product/ProductGrid'

const ProductSection = ({ title, products, isLoading, link, linkText = 'Xem tất cả' }) => {
  return (
    <section className="my-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{title}</h2>
        {link && (
          <Link to={link} className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm">
            {linkText}
            <FiArrowLeft />
          </Link>
        )}
      </div>
      <ProductGrid products={products} isLoading={isLoading} />
    </section>
  )
}

export default ProductSection
