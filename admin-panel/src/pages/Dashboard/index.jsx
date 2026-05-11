import { useQuery } from '@tanstack/react-query'
import { FiDollarSign, FiShoppingCart, FiUsers, FiPackage, FiAlertCircle, FiArrowRight } from 'react-icons/fi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/admin.service'
import { StatusBadge } from '../Orders'

const formatPrice = (price) => {
  if (!price) return '0'
  return new Intl.NumberFormat('vi-VN').format(price)
}

const StatCard = ({ icon: Icon, label, value, color, suffix }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between">
      <div>
        <p className="stat-card-label">{label}</p>
        <p className="stat-card-value">{value}{suffix}</p>
      </div>
      <div className={`stat-card-icon ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
)

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminService.getDashboardStats,
    select: (res) => res.data,
    staleTime: 0,
  })

  const { data: salesData } = useQuery({
    queryKey: ['sales-report'],
    queryFn: () => adminService.getSalesReport('7days'),
    select: (res) => res.data,
  })

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: adminService.getRecentOrders,
    select: (res) => res.data,
    staleTime: 0,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tổng quan</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiDollarSign}
          label="Doanh thu hôm nay"
          value={formatPrice(stats?.todaySales)}
          suffix=" đ"
          color="bg-green-500"
        />
        <StatCard
          icon={FiShoppingCart}
          label="Tổng đơn hàng"
          value={stats?.totalOrders || 0}
          color="bg-blue-500"
        />
        <StatCard
          icon={FiUsers}
          label="Người dùng"
          value={stats?.totalUsers || 0}
          color="bg-purple-500"
        />
        <StatCard
          icon={FiPackage}
          label="Sách"
          value={stats?.totalProducts || 0}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 text-orange-600 mb-4">
            <FiAlertCircle size={20} />
            <h3 className="font-medium">Đơn chờ xử lý</h3>
          </div>
          <p className="text-3xl font-bold">{stats?.pendingOrders || 0}</p>
          <p className="text-gray-500 text-sm mt-1">Đơn hàng cần kiểm tra</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <FiAlertCircle size={20} />
            <h3 className="font-medium">Sắp hết hàng</h3>
          </div>
          <p className="text-3xl font-bold">{stats?.lowStockProducts || 0}</p>
          <p className="text-gray-500 text-sm mt-1">Sách còn dưới 10 cuốn</p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-bold mb-6">Biểu đồ doanh thu tuần</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value) => [formatPrice(value) + ' đ', 'Doanh thu']}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold">Đơn hàng gần đây</h3>
          <Link to="/orders" className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
            Xem tất cả <FiArrowRight size={14} />
          </Link>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders?.map((order) => (
                <tr key={order.id}>
                  <td className="font-medium">{order.order_number}</td>
                  <td>
                    {order.first_name || order.last_name
                      ? `${order.first_name || ''} ${order.last_name || ''}`.trim()
                      : order.shipping_name || '—'}
                  </td>
                  <td>{formatPrice(order.total_amount)} đ</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td className="text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
              {(!recentOrders || recentOrders.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    Không có đơn hàng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
