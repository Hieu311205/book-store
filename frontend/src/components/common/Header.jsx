import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiSearch, FiShoppingCart, FiUser, FiHeart, FiMenu, FiX, FiSun, FiMoon } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useTheme } from '../../context/ThemeContext'
import { categoryService } from '../../services/category.service'
import { settingsService } from '../../services/settings.service'

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
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setIsMenuOpen(false)
    }
  }

  const categoryLink = (cat) => `/products?category=${cat.slug || cat.id}`
  const visibleCategories = categories.slice(0, 5)
  const currentParams = new URLSearchParams(location.search)
  const currentCategory = currentParams.get('category')
  const isProductsPage = location.pathname === '/products'
  const isBestsellerActive = isProductsPage && currentParams.get('bestseller') === 'true'
  const isAllProductsActive = isProductsPage && !location.search
  const navClass = (active) =>
    active ? 'text-primary-600 font-semibold' : 'hover:text-primary-600'
  const bestsellerClass = isBestsellerActive
    ? 'text-red-500 font-semibold'
    : 'hover:text-red-500'

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="hidden md:flex items-center justify-between py-2 text-sm border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            {settings.contact_phone && (
              <span className="text-gray-600 dark:text-gray-400">Lien he: {settings.contact_phone}</span>
            )}
            {settings.header_notice && (
              <span className="text-gray-600 dark:text-gray-400">{settings.header_notice}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-1 hover:text-primary-600">
              {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="hover:text-primary-600">Tai khoan</Link>
                <button onClick={logout} className="hover:text-primary-600">Dang xuat</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-primary-600">Dang nhap</Link>
                <Link to="/register" className="hover:text-primary-600">Dang ky</Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between py-4">
          <Link to="/" className="text-xl font-bold text-primary-600">{settings.site_name || ' '}</Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tim sach, tac gia..."
                className="input pl-10"
              />
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600">
                <FiSearch size={20} />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="md:hidden p-2 hover:text-primary-600">
              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            {isAuthenticated && (
              <Link to="/profile/wishlist" className="hidden md:block p-2 hover:text-primary-600">
                <FiHeart size={22} />
              </Link>
            )}
            <button onClick={openCart} className="p-2 hover:text-primary-600 relative">
              <FiShoppingCart size={22} />
              {summary.item_count > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {summary.item_count}
                </span>
              )}
            </button>
            <Link to={isAuthenticated ? '/profile' : '/login'} className="hidden md:block p-2 hover:text-primary-600">
              <FiUser size={22} />
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2">
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        <nav className="hidden md:block border-t border-gray-100 dark:border-gray-700">
          <ul className="flex items-center gap-6 py-3">
            <li><Link to="/products" className={navClass(isAllProductsActive)}>Tat ca sach</Link></li>
            {visibleCategories.map((cat) => (
              <li key={cat.id}>
                <Link
                  to={categoryLink(cat)}
                  className={navClass(currentCategory === String(cat.slug || cat.id))}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            <li><Link to="/products?bestseller=true" className={bestsellerClass}>Ban chay</Link></li>
          </ul>
        </nav>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSearch} className="p-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tim kiem..."
                className="input pl-10"
              />
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2"><FiSearch /></button>
            </div>
          </form>
          <ul className="px-4 pb-4 space-y-2">
            <li><Link to="/products" className="block py-2 hover:text-primary-600" onClick={() => setIsMenuOpen(false)}>Tat ca sach</Link></li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link to={categoryLink(cat)} className="block py-2 hover:text-primary-600" onClick={() => setIsMenuOpen(false)}>
                  {cat.name}
                </Link>
              </li>
            ))}
            {isAuthenticated ? (
              <>
                <li><Link to="/profile" className="block py-2 hover:text-primary-600" onClick={() => setIsMenuOpen(false)}>Tai khoan</Link></li>
                <li><Link to="/profile/wishlist" className="block py-2 hover:text-primary-600" onClick={() => setIsMenuOpen(false)}>Yeu thich</Link></li>
                <li><button onClick={() => { logout(); setIsMenuOpen(false) }} className="block py-2 text-red-500">Dang xuat</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login" className="block py-2 hover:text-primary-600" onClick={() => setIsMenuOpen(false)}>Dang nhap</Link></li>
                <li><Link to="/register" className="block py-2 hover:text-primary-600" onClick={() => setIsMenuOpen(false)}>Dang ky</Link></li>
              </>
            )}
          </ul>
        </div>
      )}
    </header>
  )
}

export default Header
