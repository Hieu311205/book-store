import { Link } from 'react-router-dom'
import { FiBookOpen } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '../../services/category.service'

const FEATURED_CATEGORY_LIMIT = 8

const CategoryGrid = () => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
    select: (res) => res.data,
  })

  const featuredCategories = categories.slice(0, FEATURED_CATEGORY_LIMIT)

  if (isLoading) {
    return (
      <section className="store-category-section">
        <div className="store-section-heading">
          <span className="store-section-kicker">Tủ sách</span>
          <h2>Danh mục sách</h2>
        </div>
        <div className="store-category-grid">
          {Array.from({ length: FEATURED_CATEGORY_LIMIT }).map((_, index) => (
            <div key={index} className="store-category-skeleton" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="store-category-section">
      <div className="store-section-top">
        <div className="store-section-heading">
          <span className="store-section-kicker">Tủ sách</span>
          <h2>Danh mục sách</h2>
        </div>
        {categories.length > FEATURED_CATEGORY_LIMIT && (
          <Link to="/products" className="store-view-all">Xem tất cả</Link>
        )}
      </div>
      <div className="store-category-grid">
        {featuredCategories.map((cat) => (
          <Link key={cat.id} to={`/products?category=${cat.slug || cat.id}`} className="store-category-tile">
            <span className="store-category-icon">{cat.icon || <FiBookOpen />}</span>
            <strong>{cat.name}</strong>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default CategoryGrid
