import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiHeart, FiMapPin, FiMenu, FiMoon, FiSearch, FiShoppingCart, FiSun, FiUser, FiX } from 'react-icons/fi'
import HeaderMegaMenu from './HeaderMegaMenu'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useTheme } from '../../context/ThemeContext'
import { categoryService } from '../../services/category.service'
import { settingsService } from '../../services/settings.service'

const popularTerms = [
  { label: 'Sách mới', to: '/products?sort=newest' },
  { label: 'Sách bán chạy', to: '/products?bestseller=true' },
  { label: 'Thiếu nhi', to: '/search?q=thi%E1%BA%BFu%20nhi' },
  { label: 'Kỹ năng', to: '/search?q=k%E1%BB%B9%20n%C4%83ng' },
  { label: 'Văn học', to: '/search?q=v%C4%83n%20h%E1%BB%8Dc' },
]

const flattenCategories = (items = [], depth = 0) =>
  items.flatMap((item) => [
    { ...item, depth },
    ...flattenCategories(item.children || [], depth + 1),
  ])

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, logout } = useAuth()
  const { summary, openCart } = useCart()
  const { theme, toggleTheme } = useTheme()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
    select: (res) => res.data,
  })

  const { data: settings = {} } = useQuery({
    queryKey: ['public-settings'],
    queryFn: settingsService.getSettings,
    select: (res) => res.data || {},
  })

  const handleSearch = (event) => {
    event.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setIsMenuOpen(false)
    }
  }

  const goToSearchTerm = (term) => {
    navigate(term.to)
    setIsMenuOpen(false)
  }

  const categoryLink = (cat) => `/products?category=${cat.slug || cat.id}`
  const activeCategories = categories.filter((cat) => Number(cat.is_active) !== 0)
  const visibleCategories = activeCategories.slice(0, 6)
  const mobileCategories = flattenCategories(activeCategories).filter((cat) => Number(cat.is_active) !== 0)
  const currentParams = new URLSearchParams(location.search)
  const currentCategory = currentParams.get('category')
  const isProductsPage = location.pathname === '/products'
  const isBestsellerActive = isProductsPage && currentParams.get('bestseller') === 'true'
  const isAllProductsActive = isProductsPage && !location.search
  const navClass = (active) => (active ? 'store-nav-link is-active' : 'store-nav-link')

  return (
    <header className="store-header sticky top-0 z-50">
      <div className="store-topbar">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
            <div className="flex items-center gap-4 text-gray-600">
              <Link to="/products?sort=newest" className="hover:text-red-700">Sách mới</Link>
              <Link to="/products?bestseller=true" className="hover:text-red-700">Sách bán chạy</Link>
              <Link to="/products?featured=true" className="hover:text-red-700">Ấn phẩm nổi bật</Link>
            </div>
            <div className="hidden md:flex items-center gap-4 text-gray-600">
              {settings.contact_phone && <span>Hotline: {settings.contact_phone}</span>}
              <Link to="/contact" className="inline-flex items-center gap-1 hover:text-red-700">
                <FiMapPin /> Hệ thống cửa hàng
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="store-mainbar">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-4">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden store-icon-button" aria-label="Mở menu">
              {isMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>

            <Link to="/" className="store-logo">
              <span>{settings.site_name || 'Book Store'}</span>
              <small>Bởi vì sách là thế giới</small>
            </Link>

            <div className="hidden md:block max-w-2xl w-full justify-self-center">
              <form onSubmit={handleSearch}>
                <div className="store-search">
                  <FiSearch size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm sách, tác giả, thể loại..."
                  />
                  <button type="submit">Tìm kiếm</button>
                </div>
              </form>
              <div className="store-search-tags" aria-label="Từ khóa được tìm kiếm nhiều">
                <span>Được tìm kiếm nhiều:</span>
                {popularTerms.map((term) => (
                  <button key={term.label} type="button" onClick={() => goToSearchTerm(term)}>
                    {term.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button onClick={toggleTheme} className="store-icon-button" title="Đổi giao diện">
                {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
              </button>
              {isAuthenticated && (
                <Link to="/profile/wishlist" className="hidden sm:inline-flex store-icon-button" title="Yêu thích">
                  <FiHeart size={20} />
                </Link>
              )}
              <button onClick={openCart} className="store-icon-button relative" title="Giỏ hàng">
                <FiShoppingCart size={21} />
                {summary.item_count > 0 && <span className="store-count-badge">{summary.item_count}</span>}
              </button>
              <Link to={isAuthenticated ? '/profile' : '/login'} className="hidden sm:inline-flex store-icon-button" title="Tài khoản">
                <FiUser size={21} />
              </Link>
            </div>
          </div>

          <form onSubmit={handleSearch} className="md:hidden pb-4">
            <div className="store-search">
              <FiSearch size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sách..."
              />
              <button type="submit">Tìm</button>
            </div>
          </form>
        </div>
      </div>

      <nav className="hidden md:block store-nav">
        <div className="container mx-auto px-4">
          <ul className="store-nav-list flex items-center gap-1 py-3">
            <li><HeaderMegaMenu categories={categories} /></li>
            <li><Link to="/products" className={navClass(isAllProductsActive)}>Tất cả sách</Link></li>
            {visibleCategories.map((cat) => (
              <li key={cat.id}>
                <Link to={categoryLink(cat)} className={navClass(currentCategory === String(cat.slug || cat.id))}>
                  {cat.name}
                </Link>
              </li>
            ))}
            <li><Link to="/products?bestseller=true" className={navClass(isBestsellerActive)}>Bán chạy</Link></li>
          </ul>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="md:hidden store-mobile-menu">
          <div className="container mx-auto px-4 py-4">
            <ul className="grid gap-2">
              <li><Link to="/products" className="store-mobile-link" onClick={() => setIsMenuOpen(false)}>Tất cả sách</Link></li>
              {mobileCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={categoryLink(cat)}
                    className="store-mobile-link"
                    style={{ paddingLeft: `${0.8 + cat.depth * 1}rem` }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              {isAuthenticated ? (
                <>
                  <li><Link to="/profile" className="store-mobile-link" onClick={() => setIsMenuOpen(false)}>Tài khoản</Link></li>
                  <li><Link to="/profile/wishlist" className="store-mobile-link" onClick={() => setIsMenuOpen(false)}>Yêu thích</Link></li>
                  <li><button onClick={() => { logout(); setIsMenuOpen(false) }} className="store-mobile-link text-left text-red-700">Đăng xuất</button></li>
                </>
              ) : (
                <>
                  <li><Link to="/login" className="store-mobile-link" onClick={() => setIsMenuOpen(false)}>Đăng nhập</Link></li>
                  <li><Link to="/register" className="store-mobile-link" onClick={() => setIsMenuOpen(false)}>Đăng ký</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
