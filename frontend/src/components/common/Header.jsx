import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiHeart, FiMapPin, FiMenu, FiMoon, FiSearch, FiShoppingCart, FiSun, FiUser, FiX } from 'react-icons/fi'
import HeaderMegaMenu from './HeaderMegaMenu'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useTheme } from '../../context/ThemeContext'
import { categoryService } from '../../services/category.service'
import { settingsService } from '../../services/settings.service'
import { productService } from '../../services/product.service'
import { formatPrice } from '../../utils/formatPrice'

const popularTerms = [
  { label: 'Sách mới', to: '/products?sort=newest' },
  { label: 'Sách bán chạy', to: '/products?bestseller=true' },
  { label: 'Thiếu nhi', to: '/search?q=thi%E1%BA%BFu%20nhi' },
  { label: 'Kỹ năng', to: '/search?q=k%E1%BB%B9%20n%C4%83ng' },
  { label: 'Kinh tế', to: '/search?q=kinh%20t%E1%BA%BF' },
]

const flattenCategories = (items = [], depth = 0) =>
  items.flatMap((item) => [
    { ...item, depth },
    ...flattenCategories(item.children || [], depth + 1),
  ])

// ─── SearchBox với autocomplete ──────────────────────────────────────────────
const SearchBox = ({ placeholder = 'Tìm sách, tác giả, thể loại...', buttonLabel = 'Tìm kiếm', onSearch }) => {
  const navigate = useNavigate()
  const [query, setQuery]         = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [open, setOpen]           = useState(false)
  const [cursor, setCursor]       = useState(-1)
  const wrapperRef                = useRef(null)
  const inputRef                  = useRef(null)
  const timerRef                  = useRef(null)

  // Debounce 280ms
  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setCursor(-1)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedQ(val.trim()), 280)
    setOpen(true)
  }

  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggest', debouncedQ],
    queryFn: () => productService.suggestProducts(debouncedQ),
    select: (res) => res.data || [],
    enabled: debouncedQ.length >= 1,
    staleTime: 10_000,
  })

  const showDropdown = open && query.trim().length >= 1

  // Click outside đóng dropdown
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const goToProduct = useCallback((slug) => {
    setOpen(false)
    setQuery('')
    setDebouncedQ('')
    navigate(`/product/${slug}`)
  }, [navigate])

  const submitSearch = useCallback((q) => {
    const term = (q || query).trim()
    if (!term) return
    setOpen(false)
    setQuery('')
    setDebouncedQ('')
    onSearch?.()
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }, [query, navigate, onSearch])

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') { e.preventDefault(); submitSearch() }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (cursor >= 0 && suggestions[cursor]) goToProduct(suggestions[cursor].slug)
      else submitSearch()
    } else if (e.key === 'Escape') {
      setOpen(false)
      setCursor(-1)
    }
  }

  return (
    <div className="store-search-wrapper" ref={wrapperRef}>
      <form onSubmit={(e) => { e.preventDefault(); submitSearch() }}>
        <div className="store-search">
          <FiSearch size={20} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim().length >= 1 && setOpen(true)}
            placeholder={placeholder}
            autoComplete="off"
          />
          <button type="submit">{buttonLabel}</button>
        </div>
      </form>

      {showDropdown && (
        <div className="store-suggest-dropdown">
          {suggestions.length === 0 && debouncedQ === query.trim() && (
            <div className="store-suggest-empty">Không tìm thấy sách phù hợp</div>
          )}

          {suggestions.map((item, i) => (
            <div
              key={item.id}
              className={`store-suggest-item ${cursor === i ? 'is-active' : ''}`}
              onMouseEnter={() => setCursor(i)}
              onMouseDown={() => goToProduct(item.slug)}
            >
              <img
                className="store-suggest-thumb"
                src={item.image_url || '/images/placeholder-book.jpg'}
                alt={item.title}
                onError={(e) => { e.target.src = '/images/placeholder-book.jpg' }}
              />
              <div className="store-suggest-info">
                <div className="store-suggest-title">{item.title}</div>
                {item.author_name && (
                  <div className="store-suggest-author">{item.author_name}</div>
                )}
              </div>
              <div className="store-suggest-price">{formatPrice(item.price)}</div>
            </div>
          ))}

          {suggestions.length > 0 && (
            <div
              className="store-suggest-footer"
              onMouseDown={() => submitSearch()}
            >
              Xem tất cả kết quả cho &ldquo;{query}&rdquo; →
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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
              <SearchBox placeholder="Tìm sách, tác giả, thể loại..." buttonLabel="Tìm kiếm" />
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

          <div className="md:hidden pb-4">
            <SearchBox
              placeholder="Tìm sách..."
              buttonLabel="Tìm"
              onSearch={() => setIsMenuOpen(false)}
            />
          </div>
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
