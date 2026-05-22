import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronDown, FiGrid } from 'react-icons/fi'

const HeaderMegaMenu = ({ categories = [] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const visibleGroups = categories.filter((cat) => Number(cat.is_active) !== 0)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const closeMenu = () => setIsOpen(false)

  return (
    <div className={isOpen ? 'store-mega is-open' : 'store-mega'} ref={menuRef}>
      <button
        type="button"
        className="store-nav-link store-mega-trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <FiGrid />
        Danh mục
        <FiChevronDown size={15} />
      </button>

      <div className="store-mega-panel">
        <div className="store-mega-intro">
          <strong>Danh mục sách</strong>
          <span>Chọn nhanh tủ sách phù hợp với nhu cầu đọc của bạn.</span>
          <Link to="/products" onClick={closeMenu}>Xem toàn bộ sách</Link>
        </div>

        <div className="store-mega-groups">
          {visibleGroups.length > 0 ? visibleGroups.map((group) => {
            const children = Array.isArray(group.children)
              ? group.children.filter((cat) => Number(cat.is_active) !== 0)
              : []

            return (
              <div className="store-mega-group" key={group.id}>
                <h3>
                  <Link to={`/products?category=${group.slug || group.id}`} onClick={closeMenu}>{group.name}</Link>
                </h3>
                {children.length > 0 && (
                  <ul>
                    {children.map((cat) => (
                      <li key={cat.id}>
                        <Link to={`/products?category=${cat.slug || cat.id}`} onClick={closeMenu}>{cat.name}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          }) : (
            <div className="store-mega-group">
              <h3>Danh mục</h3>
              <ul>
                <li><Link to="/products" onClick={closeMenu}>Đang cập nhật</Link></li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HeaderMegaMenu
