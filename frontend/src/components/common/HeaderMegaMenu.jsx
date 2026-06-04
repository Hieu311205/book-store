import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronDown, FiGrid } from 'react-icons/fi'

const categoryLink = (category) => `/products?category=${category.slug || category.id}`

const renderChildren = (items, closeMenu, expandedIds, toggleExpanded, level = 1) => {
  const activeItems = (items || []).filter((cat) => Number(cat.is_active) !== 0)
  if (!activeItems.length) return null

  return (
    <ul>
      {activeItems.map((cat) => {
        const hasChildren = (cat.children || []).some((child) => Number(child.is_active) !== 0)
        const expanded = expandedIds.has(Number(cat.id))

        return (
          <li key={cat.id}>
            <div className="store-mega-node" style={{ paddingLeft: level > 1 ? `${level * 10}px` : undefined }}>
              {hasChildren ? (
                <button
                  type="button"
                  className="store-mega-toggle"
                  onClick={() => toggleExpanded(cat.id)}
                  aria-label={expanded ? 'Thu gọn danh mục' : 'Mở danh mục'}
                >
                  <FiChevronDown className={expanded ? '' : '-rotate-90'} />
                </button>
              ) : (
                <span className="store-mega-leaf" />
              )}
              <Link to={categoryLink(cat)} onClick={closeMenu}>{cat.name}</Link>
            </div>
            {hasChildren && expanded && renderChildren(cat.children, closeMenu, expandedIds, toggleExpanded, level + 1)}
          </li>
        )
      })}
    </ul>
  )
}

const HeaderMegaMenu = ({ categories = [] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const menuRef = useRef(null)
  const visibleGroups = categories.filter((cat) => Number(cat.is_active) !== 0)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
        setExpandedIds(new Set())
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const closeMenu = () => {
    setIsOpen(false)
    setExpandedIds(new Set())
  }

  const toggleMenu = () => {
    setIsOpen((current) => {
      if (!current) {
        setExpandedIds(new Set())
      }
      return !current
    })
  }

  const toggleExpanded = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      const value = Number(id)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  return (
    <div className={isOpen ? 'store-mega is-open' : 'store-mega'} ref={menuRef}>
      <button
        type="button"
        className="store-nav-link store-mega-trigger"
        onClick={toggleMenu}
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
            const hasChildren = (group.children || []).some((child) => Number(child.is_active) !== 0)
            const expanded = expandedIds.has(Number(group.id))

            return (
              <div className="store-mega-group" key={group.id}>
                <h3>
                  {hasChildren ? (
                    <button
                      type="button"
                      className="store-mega-toggle"
                      onClick={() => toggleExpanded(group.id)}
                      aria-label={expanded ? 'Thu gọn danh mục' : 'Mở danh mục'}
                    >
                      <FiChevronDown className={expanded ? '' : '-rotate-90'} />
                    </button>
                  ) : (
                    <span className="store-mega-leaf" />
                  )}
                  <Link to={categoryLink(group)} onClick={closeMenu}>{group.name}</Link>
                </h3>
                {hasChildren && expanded && renderChildren(group.children, closeMenu, expandedIds, toggleExpanded)}
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
