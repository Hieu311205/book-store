import { NavLink } from 'react-router-dom'
import {
  FiHome,
  FiPackage,
  FiFolder,
  FiShoppingCart,
  FiUsers,
  FiTag,
  FiImage,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { adminService } from '../../services/admin.service'

const menuItems = [
  { to: '/', icon: FiHome, label: 'Tong quan', end: true },
  { to: '/products', icon: FiPackage, label: 'Sach' },
  { to: '/categories', icon: FiFolder, label: 'Danh muc' },
  { to: '/orders', icon: FiShoppingCart, label: 'Don hang' },
  { to: '/users', icon: FiUsers, label: 'Nguoi dung', superOnly: true },
  { to: '/coupons', icon: FiTag, label: 'Ma giam gia', superOnly: true },
  { to: '/sliders', icon: FiImage, label: 'Banner', superOnly: true },
  { to: '/settings', icon: FiSettings, label: 'Cai dat', superOnly: true },
]

const Sidebar = () => {
  const { logout, isSuperAdmin } = useAuth()
  const visibleItems = menuItems.filter((item) => !item.superOnly || isSuperAdmin)
  const { data: settings = {} } = useQuery({
    queryKey: ['admin-public-settings'],
    queryFn: adminService.getPublicSettings,
    select: (res) => res.data || {},
  })

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col z-40">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Quan tri</h1>
        {settings.site_name && <p className="text-gray-400 text-sm mt-1">{settings.site_name}</p>}
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
          <span>Dang xuat</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
