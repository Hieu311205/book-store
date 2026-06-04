import { NavLink } from 'react-router-dom'
import {
  FiBook,
  FiBookOpen,
  FiBox,
  FiHome,
  FiPackage,
  FiFolder,
  FiGift,
  FiShoppingCart,
  FiCreditCard,
  FiActivity,
  FiUsers,
  FiTag,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { adminService } from '../../services/admin.service'

// superOnly: chỉ super_admin
// warehouseAccess: warehouse_staff + admin + super_admin
// contentAccess: content_editor + admin + super_admin
const menuItems = [
  { to: '/', icon: FiHome,        label: 'Tổng quan',       end: true },
  { to: '/products',   icon: FiPackage,  label: 'Sách',            contentAccess: true },
  { to: '/authors',    icon: FiBook,     label: 'Tác giả',         contentAccess: true },
  { to: '/publishers', icon: FiBookOpen, label: 'Nhà xuất bản',    contentAccess: true },
  { to: '/inventory',  icon: FiBox,      label: 'Quản lý kho',     warehouseAccess: true },
  { to: '/categories', icon: FiFolder,   label: 'Danh mục',        contentAccess: true },
  { to: '/orders',     icon: FiShoppingCart, label: 'Đơn hàng',    warehouseAccess: true },
  { to: '/wallets',    icon: FiCreditCard,   label: 'Ví điện tử' },
  { to: '/payments',   icon: FiActivity,     label: 'Thanh toán' },
  { to: '/combos',     icon: FiGift,     label: 'Combo khuyến mãi', contentAccess: true },
  { to: '/users',      icon: FiUsers,    label: 'Người dùng',      superOnly: true },
  { to: '/coupons',    icon: FiTag,      label: 'Mã giảm giá',     superOnly: true },
  { to: '/settings',   icon: FiSettings, label: 'Cài đặt',         superOnly: true },
]

const roleBadge = {
  super_admin:      { label: 'Quản trị cấp cao', color: 'bg-red-600' },
  admin:            { label: 'Quản trị viên',     color: 'bg-primary-600' },
  warehouse_staff:  { label: 'Nhân viên kho',     color: 'bg-yellow-600' },
  content_editor:   { label: 'Biên tập viên',     color: 'bg-blue-600' },
}

const Sidebar = () => {
  const { logout, isSuperAdmin, isWarehouseStaff, isContentEditor, user } = useAuth()
  const isAdmin = !isWarehouseStaff && !isContentEditor

  const visibleItems = menuItems.filter((item) => {
    if (item.superOnly)      return isSuperAdmin
    if (item.warehouseAccess) return isAdmin || isWarehouseStaff
    if (item.contentAccess)   return isAdmin || isContentEditor
    // items without flags: visible to admin only (not warehouse/content)
    return isAdmin
  })

  const { data: settings = {} } = useQuery({
    queryKey: ['admin-public-settings'],
    queryFn: adminService.getPublicSettings,
    select: (res) => res.data || {},
  })

  const badge = roleBadge[user?.role] || { label: user?.role, color: 'bg-gray-600' }

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col z-40">
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-xl font-bold">Quản trị</h1>
        {settings.site_name && <p className="text-gray-400 text-sm mt-0.5">{settings.site_name}</p>}
        {user && (
          <div className="mt-2">
            <p className="text-xs text-gray-300 truncate">{user.first_name} {user.last_name}</p>
            <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full text-white ${badge.color}`}>
              {badge.label}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {visibleItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <FiLogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
