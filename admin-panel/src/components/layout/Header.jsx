import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiBell, FiUser, FiSun, FiMoon } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { adminService } from '../../services/admin.service'

const Header = ({ theme, toggleTheme }) => {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const { data: notifications = { count: 0, items: [] } } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: adminService.getNotifications,
    select: (res) => res.data || { count: 0, items: [] },
    refetchInterval: 30000,
  })

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-medium">Xin chao, {user?.first_name}</h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen((value) => !value)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative"
          >
            <FiBell size={20} />
            {notifications.count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.count > 99 ? '99+' : notifications.count}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-50">
              <div className="p-4 border-b dark:border-gray-700 font-semibold">Thong bao</div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.items.length ? notifications.items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.message}</p>
                  </Link>
                )) : (
                  <p className="p-4 text-sm text-gray-500">Khong co thong bao moi</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pr-4 border-r dark:border-gray-700">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <FiUser className="text-primary-600" size={16} />
          </div>
          <div className="text-sm">
            <p className="font-medium">{user?.first_name} {user?.last_name}</p>
            <p className="text-gray-500 text-xs">{user?.role === 'super_admin' ? 'Quan tri cap cao' : 'Quan tri vien'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
