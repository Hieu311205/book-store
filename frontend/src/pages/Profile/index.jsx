import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom'
import { FiUser, FiShoppingBag, FiHeart, FiMapPin, FiSettings, FiLogOut, FiCreditCard } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { orderService } from '../../services/order.service'
import { userService } from '../../services/user.service'

const money = (value) => new Intl.NumberFormat('vi-VN').format(value || 0)
const userInitial = (user) => (user?.first_name || user?.email || 'A').charAt(0).toUpperCase()

const Profile = () => {
  const location = useLocation()
  const { user, isAuthenticated, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500">
        Đang tải tài khoản...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  const menuItems = [
    { to: '/profile', icon: FiUser, label: 'Tổng quan', end: true },
    { to: '/profile/orders', icon: FiShoppingBag, label: 'Đơn hàng' },
    { to: '/profile/wallet', icon: FiCreditCard, label: 'Ví điện tử' },
    { to: '/profile/wishlist', icon: FiHeart, label: 'Yêu thích' },
    { to: '/profile/addresses', icon: FiMapPin, label: 'Địa chỉ' },
    { to: '/profile/settings', icon: FiSettings, label: 'Cài đặt' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <aside className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <div className="text-center pb-6 border-b dark:border-gray-700">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user?.first_name || 'Avatar'}
                className="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-700 mx-auto mb-4"
              />
            ) : (
              <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-primary-600">
                  {userInitial(user)}
                </span>
              </div>
            )}
            <h3 className="font-bold">{user?.first_name} {user?.last_name}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          <nav className="mt-6 space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`
                }
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <FiLogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </nav>
        </div>
      </aside>

      <main className="lg:col-span-3">
        <Outlet />
      </main>
    </div>
  )
}

export const ProfileDashboard = () => {
  const { user } = useAuth()
  const { data: ordersCount = 0 } = useQuery({
    queryKey: ['profile-orders-count'],
    queryFn: () => orderService.getOrders({ page: 1, limit: 1 }),
    select: (res) => res.data?.pagination?.totalItems || 0,
  })
  const { data: wishlistCount = 0 } = useQuery({
    queryKey: ['profile-wishlist-count'],
    queryFn: userService.getWishlist,
    select: (res) => res.data?.length || 0,
  })
  const { data: addressCount = 0 } = useQuery({
    queryKey: ['profile-address-count'],
    queryFn: userService.getAddresses,
    select: (res) => res.data?.length || 0,
  })
  const { data: walletBalance = 0 } = useQuery({
    queryKey: ['profile-wallet-balance'],
    queryFn: userService.getWallet,
    select: (res) => Number(res.data?.wallet?.balance || 0),
  })

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Tổng quan</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Xin chào {user?.first_name}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-primary-600">{ordersCount}</div>
          <div className="text-gray-500 mt-1">Đơn hàng</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-primary-600">{wishlistCount}</div>
          <div className="text-gray-500 mt-1">Yêu thích</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-primary-600">{addressCount}</div>
          <div className="text-gray-500 mt-1">Địa chỉ</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-primary-600">{money(walletBalance)} đ</div>
          <div className="text-gray-500 mt-1">Ví điện tử</div>
        </div>
      </div>
    </div>
  )
}

export default Profile
