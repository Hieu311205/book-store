import { Link } from 'react-router-dom'
import { FiArrowUpRight, FiSearch } from 'react-icons/fi'

const searches = [
  { label: 'Sách bán chạy', to: '/products?bestseller=true' },
  { label: 'Sách mới xuất bản', to: '/products?sort=newest' },
  { label: 'Sách thiếu nhi', to: '/search?q=thiếu nhi' },
  { label: 'Sách hư cấu', to: '/search?q=hư cấu' },
  { label: 'Sách phi hư cấu', to: '/search?q=phi hư cấu' },
  { label: 'Kỹ năng sống', to: '/search?q=kỹ năng' },
]

const PopularSearches = () => {
  return (
    <section className="store-popular-searches">
      <div className="store-section-heading">
        <span className="store-section-kicker">Có thể bạn đang tìm kiếm</span>
        <h2>Khám phá nhanh</h2>
      </div>

      <div className="store-search-card-grid">
        {searches.map((item) => (
          <Link to={item.to} className="store-search-card" key={item.label}>
            <span><FiSearch /></span>
            <strong>{item.label}</strong>
            <FiArrowUpRight className="store-search-card-arrow" />
          </Link>
        ))}
      </div>
    </section>
  )
}

export default PopularSearches
