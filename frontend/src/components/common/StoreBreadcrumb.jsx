import { Link, useLocation } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'

const routeLabels = {
  cart: 'Giỏ hàng',
  checkout: 'Thanh toán',
  search: 'Tìm kiếm',
  login: 'Đăng nhập',
  register: 'Đăng ký',
  profile: 'Tài khoản',
  orders: 'Đơn hàng',
  wishlist: 'Yêu thích',
  addresses: 'Địa chỉ',
  settings: 'Cài đặt',
}

const getProductsLabel = (search) => {
  const params = new URLSearchParams(search)
  if (params.get('sort') === 'newest') return 'SÁCH MỚI PHÁT HÀNH'
  if (params.get('bestseller') === 'true') return 'SÁCH BÁN CHẠY'
  if (params.get('featured') === 'true') return 'SÁCH NỔI BẬT'
  return 'Tất cả sách'
}

const StoreBreadcrumb = () => {
  const location = useLocation()

  if (location.pathname === '/' || location.pathname.startsWith('/product/')) {
    return null
  }

  const segments = location.pathname.split('/').filter(Boolean)
  if (!segments.length) return null

  const crumbs = segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`
    const label = segment === 'products' ? getProductsLabel(location.search) : routeLabels[segment] || segment
    return { path, label }
  })

  return (
    <nav className="store-global-breadcrumb" aria-label="Đường dẫn trang">
      <Link to="/">Trang chủ</Link>
      {crumbs.map((crumb, index) => (
        <span className="store-breadcrumb-item" key={`${crumb.path}-${index}`}>
          <FiChevronRight />
          {index === crumbs.length - 1 ? (
            <span>{crumb.label}</span>
          ) : (
            <Link to={crumb.path}>{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  )
}

export default StoreBreadcrumb
