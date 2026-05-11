import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronDown, FiGrid } from 'react-icons/fi'

const groupLabels = ['Hư cấu', 'Phi hư cấu', 'Thiếu nhi', 'Phân loại khác']

const HeaderMegaMenu = ({ categories = [] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const buckets = groupLabels.map((label, index) => ({
    label,
    items: categories.filter((_, itemIndex) => itemIndex % groupLabels.length === index).slice(0, 8),
  }))

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
          {buckets.map((group) => (
            <div className="store-mega-group" key={group.label}>
              <h3>{group.label}</h3>
              <ul>
                {group.items.length > 0 ? (
                  group.items.map((cat) => (
                    <li key={cat.id}>
                      <Link to={`/products?category=${cat.slug || cat.id}`} onClick={closeMenu}>{cat.name}</Link>
                    </li>
                  ))
                ) : (
                  <li><Link to="/products" onClick={closeMenu}>Đang cập nhật</Link></li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HeaderMegaMenu
