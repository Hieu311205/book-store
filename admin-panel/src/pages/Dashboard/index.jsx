import { useQuery } from '@tanstack/react-query'
import { FiAlertCircle, FiArrowRight, FiBarChart2, FiDollarSign, FiPackage, FiShoppingCart, FiTrendingUp, FiUsers } from 'react-icons/fi'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/admin.service'
import { aiService } from '../../services/ai.service'
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

const normalizeSalesData = (aiOverview, phpSalesData) => {
  if (aiOverview?.daily_data?.length) {
    return aiOverview.daily_data.map((item) => ({
      date: item.date,
      total: Number(item.revenue || 0),
      orders: Number(item.orders || 0),
    }))
  }

  return phpSalesData || []
}

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

  const { data: aiOverview, isError: aiOverviewError } = useQuery({
    queryKey: ['ai-sales-overview', 30],
    queryFn: () => aiService.getSalesOverview(30),
    retry: false,
  })

  const { data: aiTopProducts = [], isError: aiTopProductsError } = useQuery({
    queryKey: ['ai-top-products', 5],
    queryFn: () => aiService.getTopProducts(5),
    retry: false,
  })

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: adminService.getRecentOrders,
    select: (res) => res.data,
    staleTime: 0,
  })

  const chartData = normalizeSalesData(aiOverview, salesData)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Dashboard dùng PHP API cho vận hành chính và Python AI service cho phân tích doanh thu, top sản phẩm.
        </p>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
        <div className="card p-6">
          <div className="flex items-center gap-3 text-green-600 mb-4">
            <FiTrendingUp size={20} />
            <h3 className="font-medium">doanh thu 30 ngày</h3>
          </div>
          <p className="text-3xl font-bold">{formatPrice(aiOverview?.total_revenue)} đ</p>
          <p className="text-gray-500 text-sm mt-1">
            {aiOverviewError ? 'Python service chưa chạy' : `${aiOverview?.total_orders || 0} đơn đã thanh toán`}
          </p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 text-primary-600 mb-4">
            <FiBarChart2 size={20} />
            <h3 className="font-medium">top sản phẩm</h3>
          </div>
          <p className="text-3xl font-bold">{aiTopProducts.length}</p>
          <p className="text-gray-500 text-sm mt-1">
            {aiTopProductsError ? 'Python service chưa chạy' : 'Sản phẩm bán chạy được phân tích'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold">Biểu đồ doanh thu</h3>
              <p className="text-sm text-gray-500 mt-1">
                {aiOverview?.daily_data?.length ? 'Dữ liệu lấy từ Python AI analytics service' : 'Đang dùng dữ liệu PHP dashboard'}
              </p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${formatPrice(value)} đ`, 'Doanh thu']} />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold mb-2">Top sản phẩm bán chạy</h3>
          <div className="space-y-3">
            {aiTopProducts.map((product, index) => (
              <div key={`${product.product_id}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border dark:border-gray-700 p-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{index + 1}. {product.product_title}</p>
                  <p className="text-xs text-gray-500">ID: {product.product_id}</p>
                </div>
                <span className="badge badge-success whitespace-nowrap">{product.sold || 0} bán</span>
              </div>
            ))}
            {!aiTopProducts.length && (
              <p className="text-sm text-gray-500">
                {aiTopProductsError ? 'Chưa lấy được dữ liệu từ Python service.' : 'Chưa có dữ liệu bán chạy.'}
              </p>
            )}
          </div>
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
