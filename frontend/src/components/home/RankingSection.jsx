import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import { formatPrice } from '../../utils/formatPrice'

const RankingSection = ({ products = [], isLoading }) => {
  const rankedProducts = products.slice(0, 10)

  return (
    <section className="store-ranking-section">
      <div className="store-ranking-copy">
        <span className="store-section-kicker">Sách được yêu thích</span>
        <h2>Bảng xếp hạng sách được độc giả quan tâm</h2>
        <p>Dựa trên nhóm sách bán chạy hiện có trong hệ thống, giúp khách chọn nhanh những đầu sách đáng đọc.</p>
        <Link to="/products?bestseller=true">
          Xem bảng sách bán chạy
          <FiArrowRight />
        </Link>
      </div>

      <div className="store-ranking-list">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => <div className="store-ranking-skeleton" key={index} />)
          : rankedProducts.map((product, index) => (
              <Link to={`/product/${product.slug}`} className="store-ranking-item" key={product.id}>
                <span className="store-ranking-number">{String(index + 1).padStart(2, '0')}</span>
                <img src={product.images?.[0]?.image_url || product.primary_image || '/images/placeholder-book.jpg'} alt={product.title} />
                <span className="store-ranking-info">
                  <strong>{product.title}</strong>
                  {product.author_name && <small>{product.author_name}</small>}
                  <b>{formatPrice(product.price)}</b>
                </span>
              </Link>
            ))}
      </div>
    </section>
  )
}

export default RankingSection
