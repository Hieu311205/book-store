import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import ProductGrid from '../product/ProductGrid'

const ProductSection = ({ eyebrow, title, products, isLoading, link, linkText = 'Xem tất cả' }) => {
  return (
    <section className="store-section">
      <div className="store-section-top">
        <div className="store-section-heading">
          {eyebrow && <span className="store-section-kicker">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        {link && (
          <Link to={link} className="store-view-all">
            {linkText}
            <FiArrowRight />
          </Link>
        )}
      </div>
      <ProductGrid products={products} isLoading={isLoading} />
    </section>
  )
}

export default ProductSection
