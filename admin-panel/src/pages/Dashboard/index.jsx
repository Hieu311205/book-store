import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { Link } from 'react-router-dom'
import {
  FiDollarSign, FiShoppingCart, FiUsers, FiPackage,
  FiAlertCircle, FiArrowRight,
} from 'react-icons/fi'
import { adminService } from '../../services/admin.service'
import { aiService } from '../../services/ai.service'
import { StatusBadge } from '../Orders'

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (price) => {
  if (!price) return '0'
  return new Intl.NumberFormat('vi-VN').format(price)
}

const fmtShort = (v) => {
  if (!v) return '0'
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)} tỷ`
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(2)} tr`
  return new Intl.NumberFormat('vi-VN').format(v)
}

const fmtFull = (v) => {
  if (!v) return '0'
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)} tỷđ`
  if (v >= 1_000_000)     return `${Math.round(v / 1_000_000)} triệu đ`
  return new Intl.NumberFormat('vi-VN').format(v) + ' đ'
}

const COLORS = [
  '#4472C4','#ED7D31','#A9D18E','#FF4444',
  '#FFC000','#5B9BD5','#70AD47','#7030A0','#00B0F0','#FF7F7F',
]

const YEARS  = [2022, 2023, 2024, 2025]
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

// ── Sub-components ────────────────────────────────────────────────────────────
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

const FilterSelect = ({ label, value, onChange, children }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
      {label}
    </span>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs
                 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100
                 focus:outline-none focus:ring-1 focus:ring-blue-400"
    >
      {children}
    </select>
  </div>
)

const PieLabel = ({ cx, cy, midAngle, outerRadius, percent }) => {
  if (percent < 0.04) return null
  const RADIAN = Math.PI / 180
  const r = outerRadius + 20
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#555" textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central" fontSize={10}>
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const now = new Date()
  const [year,      setYear]      = useState(now.getFullYear())
  const [month,     setMonth]     = useState(now.getMonth() + 1)
  const [catFilter, setCatFilter] = useState('Tất cả')

  // ── Queries ────────────────────────────────────────────────────────────────
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

  const { data: inventory } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: adminService.getInventoryReport,
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

  const chartData = aiOverview?.daily_data?.length
    ? aiOverview.daily_data.map((item) => ({ date: item.date, total: Number(item.revenue || 0), orders: Number(item.orders || 0) }))
    : (salesData || [])

  // ── Inventory data từ API ──────────────────────────────────────────────────
  const byCategory = inventory?.byCategory || []
  const byAuthor   = inventory?.byAuthor   || []

  const catOptions = useMemo(
    () => ['Tất cả', ...byCategory.map(c => c.name)],
    [byCategory]
  )

  const allTopProducts = inventory?.topProducts || []

  const filteredProducts = useMemo(() => {
    if (catFilter === 'Tất cả') return allTopProducts
    return allTopProducts.filter(p => p.category_name === catFilter)
  }, [allTopProducts, catFilter])

  const totalInvUnits = filteredProducts.reduce((s, p) => s + (p.stock || 0), 0)
  const totalInvValue = filteredProducts.reduce((s, p) => s + (p.inventory_value || 0), 0)

  const invValueByCat = useMemo(
    () => byCategory.slice(0, 5).map(c => ({ name: c.name, value: c.totalValue })),
    [byCategory]
  )

  // ── KPI từ API ─────────────────────────────────────────────────────────────
  const totalRevenue  = inventory?.totalRevenue  ?? 0
  const netProfit     = inventory?.netProfit     ?? 0
  const revenueGrowth = inventory?.revenueGrowth ?? 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tổng quan</h1>

      {/* ── 1. Stat cards (OLD) ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={FiDollarSign} label="Doanh thu hôm nay"
          value={formatPrice(stats?.todaySales)} suffix=" đ" color="bg-green-500" />
        <StatCard icon={FiShoppingCart} label="Tổng đơn hàng"
          value={stats?.totalOrders || 0} color="bg-blue-500" />
        <StatCard icon={FiUsers} label="Người dùng"
          value={stats?.totalUsers || 0} color="bg-purple-500" />
        <StatCard icon={FiPackage} label="Sách"
          value={stats?.totalProducts || 0} color="bg-orange-500" />
      </div>

      {/* ── 2. Alert cards (OLD) ────────────────────────────────────────── */}
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

      {/* ── 3. Inventory filters ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-gray-800
                      px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
        <FilterSelect label="Năm" value={year} onChange={v => setYear(+v)}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </FilterSelect>
        <FilterSelect label="Tháng" value={month} onChange={v => setMonth(+v)}>
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </FilterSelect>
        <FilterSelect label="Danh mục" value={catFilter} onChange={setCatFilter}>
          {catOptions.map(c => <option key={c}>{c}</option>)}
        </FilterSelect>
      </div>

      {/* ── 4. Pie × 2  +  KPI  (NEW – từ ảnh) ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Pie – by category */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold mb-1">
            Số đơn vị tồn kho theo danh mục
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name"
                   cx="42%" cy="50%" outerRadius={78}
                   labelLine={false} label={PieLabel}>
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v + ' đơn vị', n]} />
              <Legend layout="vertical" align="right" verticalAlign="middle"
                      iconType="circle" iconSize={8}
                      formatter={v => <span style={{ fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pie – by author */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold mb-1">
            Số đơn vị tồn kho theo tác giả
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={byAuthor} dataKey="value" nameKey="name"
                   cx="42%" cy="50%" outerRadius={78}
                   labelLine={false} label={PieLabel}>
                {byAuthor.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v + ' đơn vị', n]} />
              <Legend layout="vertical" align="right" verticalAlign="middle"
                      iconType="circle" iconSize={8}
                      formatter={v => <span style={{ fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* KPI cards */}
        <div className="flex flex-col gap-4">
          <div className="card p-6 flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng doanh thu</p>
            <p className="text-3xl font-bold text-blue-600 mt-2 leading-tight">
              {fmtFull(totalRevenue)}
            </p>
            <p className={`text-sm mt-2 flex items-center gap-1 ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              <span>{revenueGrowth >= 0 ? '▲' : '▼'} {Math.abs(revenueGrowth).toFixed(2)}%</span>
              <span className="text-gray-400 text-xs">So với tháng trước</span>
            </p>
          </div>
          <div className="card p-6 flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Lợi nhuận ròng</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 leading-tight">
              {fmtFull(netProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* ── 5. Inventory table  +  Bar  +  H-Bar  (NEW – từ ảnh) ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Inventory table */}
        <div className="card overflow-hidden">
          <div className="max-h-72 overflow-y-auto">
            <table className="table text-xs">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th>Sản phẩm</th>
                  <th className="text-right whitespace-nowrap">Số ĐV tồn kho</th>
                  <th className="text-right whitespace-nowrap">Giá trị tồn kho</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span className="line-clamp-1 block max-w-[130px]">
                        {p.title}
                      </span>
                    </td>
                    <td className="text-right">{p.stock || 0}</td>
                    <td className="text-right">{fmtShort(p.inventory_value)} đ</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-gray-50 dark:bg-gray-700">
                  <td>Tổng</td>
                  <td className="text-right">{totalInvUnits}</td>
                  <td className="text-right">{fmtShort(totalInvValue)} đ</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bar – inventory units by category */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold mb-2">
            Số đơn vị tồn kho theo danh mục
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={byCategory.slice(0, 5)}
              margin={{ top: 5, right: 10, bottom: 45, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30}
                     textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => [v + ' đơn vị', 'Tồn kho']} />
              <Bar dataKey="value" fill="#4472C4" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Horizontal bar – inventory value by category */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold mb-2">Giá trị hàng tồn kho</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={invValueByCat}
              layout="vertical"
              margin={{ top: 5, right: 55, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }}
                     tickFormatter={fmtShort} />
              <YAxis dataKey="name" type="category"
                     tick={{ fontSize: 10 }} width={70} />
              <Tooltip formatter={v => [fmtFull(v), 'Giá trị']} />
              <Bar dataKey="value" fill="#4472C4" radius={[0, 3, 3, 0]}
                   label={{ position: 'right', fontSize: 10, formatter: fmtShort }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 6. Weekly revenue line chart (OLD – giữ lại) ─────────────────── */}
      <div className="card p-6">
        <h3 className="font-bold mb-6">Biểu đồ doanh thu tuần</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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

      {/* ── 7. Recent orders table (OLD – giữ lại) ───────────────────────── */}
      <div className="card">
        <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold">Đơn hàng gần đây</h3>
          <Link to="/orders"
                className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
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
