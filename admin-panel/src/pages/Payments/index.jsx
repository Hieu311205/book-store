import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FiActivity,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiSmartphone,
  FiX,
  FiXCircle,
} from 'react-icons/fi'
import { adminService } from '../../services/admin.service'
import PaginationNumbers from '../../components/common/PaginationNumbers'

const LIMIT = 10

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
]

const gatewayOptions = [
  { value: '', label: 'Tất cả phương thức' },
  { value: 'cod', label: 'Thanh toán khi nhận hàng' },
  { value: 'bank_transfer', label: 'Chuyển khoản QR' },
  { value: 'card_test', label: 'Thẻ ngân hàng' },
  { value: 'wallet', label: 'Ví Book Store' },
]

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'amount_desc', label: 'Số tiền cao nhất' },
  { value: 'amount_asc', label: 'Số tiền thấp nhất' },
]

const statusLabels = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  expired: 'Hết hạn',
  refunded: 'Đã hoàn tiền',
}

const statusClasses = {
  pending: 'badge-warning',
  paid: 'badge-success',
  failed: 'badge-danger',
  expired: 'badge-gray',
  refunded: 'badge-info',
}

const gatewayLabels = {
  cod: 'Thanh toán khi nhận hàng',
  bank_transfer: 'Chuyển khoản QR',
  card_test: 'Thẻ ngân hàng',
  wallet: 'Ví Book Store',
}

const gatewayIcons = {
  cod: FiDollarSign,
  bank_transfer: FiActivity,
  card_test: FiCreditCard,
  wallet: FiSmartphone,
}

const formatPrice = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`

const formatDate = (value) => value
  ? new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
  : '-'

const formatTimestamp = (timestamp, fallback) => timestamp
  ? formatDate(Number(timestamp) * 1000)
  : formatDate(fallback)

const Payments = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [gateway, setGateway] = useState('')
  const [sort, setSort] = useState('newest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [page, setPage] = useState(1)

  const hasFilters = Boolean(search || status || gateway || dateFrom || dateTo)
  const queryParams = {
    page,
    limit: LIMIT,
    search: search || undefined,
    status: status || undefined,
    gateway: gateway || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    sort,
  }

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-payments', queryParams],
    queryFn: () => adminService.getPayments(queryParams),
    select: (res) => res.data,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  })

  const payments = data?.payments || []
  const stats = data?.stats || {}
  const totalPages = data?.pagination?.totalPages || 1
  const totalItems = data?.pagination?.totalItems ?? 0

  const methodStats = useMemo(() => {
    const countMap = Object.fromEntries((data?.methodStats || []).map((item) => [item.method, item.count]))
    return Object.keys(gatewayLabels).map((method) => ({
      method,
      count: Number(countMap[method] || 0),
    }))
  }, [data?.methodStats])

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setGateway('')
    setDateFrom('')
    setDateTo('')
    setSort('newest')
    setPage(1)
  }

  const updateDateFrom = (value) => {
    setDateFrom(value)
    setPage(1)
    if (value && dateTo) {
      const from = new Date(`${value}T00:00:00`)
      const to = new Date(`${dateTo}T00:00:00`)
      const maxTo = new Date(from)
      maxTo.setMonth(maxTo.getMonth() + 1)
      if (to > maxTo) {
        setDateTo('')
        toast.error('Khoảng lọc không được quá 1 tháng')
      }
    }
  }

  const updateDateTo = (value) => {
    if (dateFrom && value) {
      const from = new Date(`${dateFrom}T00:00:00`)
      const to = new Date(`${value}T00:00:00`)
      const maxTo = new Date(from)
      maxTo.setMonth(maxTo.getMonth() + 1)
      if (to > maxTo) {
        toast.error('Khoảng lọc không được quá 1 tháng')
        return
      }
      if (to < from) {
        toast.error('Ngày kết thúc không được nhỏ hơn ngày bắt đầu')
        return
      }
    }
    setDateTo(value)
    setPage(1)
  }

  const simulateMutation = useMutation({
    mutationFn: ({ id, result }) => adminService.simulatePaymentWebhook(id, result),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Đã cập nhật kết quả thanh toán mô phỏng')
    },
    onError: (error) => toast.error(error.message || 'Không thể mô phỏng thanh toán'),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-primary-600">Quản lý giao dịch</p>
          <h1 className="mt-1 text-2xl font-bold">Thanh toán</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Theo dõi dòng tiền và xử lý giao dịch chuyển khoản QR.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => refetch()} disabled={isFetching}>
          <FiRefreshCw className={isFetching ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr_1fr]">
        <section className="relative min-h-52 overflow-hidden rounded-lg bg-gray-950 p-6 text-white shadow-sm">
          <div className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-l from-primary-800/80 to-transparent" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <FiShield />
                BOOK STORE
              </div>
              <FiCreditCard size={25} className="text-primary-300" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Tổng tiền đã thanh toán</p>
              <p className="mt-2 text-3xl font-bold">{formatPrice(stats.totalPaid)}</p>
              <div className="mt-6 flex items-end justify-between text-xs text-gray-300">
                <span>{stats.paidCount || 0} giao dịch thành công</span>
                <span>ADMIN BILLING</span>
              </div>
            </div>
          </div>
        </section>

        <section className="card flex min-h-52 flex-col justify-between p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <FiClock size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Đang chờ thanh toán</p>
            <p className="mt-1 text-3xl font-bold">{stats.pendingCount || 0}</p>
            <p className="mt-2 text-xs text-gray-500">{stats.expiringQrCount || 0} giao dịch QR có thời hạn 15 phút</p>
          </div>
        </section>

        <section className="card flex min-h-52 flex-col justify-between p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
            <FiXCircle size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Thất bại hoặc hết hạn</p>
            <p className="mt-1 text-3xl font-bold">{stats.failedCount || 0}</p>
            <p className="mt-2 text-xs text-gray-500">Cần kiểm tra trước khi khách tạo đơn mới</p>
          </div>
        </section>
      </div>

      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Phương thức thanh toán</h2>
            <p className="mt-1 text-xs text-gray-500">Số giao dịch phát sinh theo từng hình thức trong bộ lọc hiện tại.</p>
          </div>
          <FiCreditCard className="text-primary-600" size={20} />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {methodStats.map(({ method, count }) => {
            const Icon = gatewayIcons[method]
            return (
              <div key={method} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-600">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{gatewayLabels[method]}</p>
                  <p className="text-xs text-gray-500">{count} giao dịch</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1) }}
              placeholder="Mã đơn, email, tên khách, mã giao dịch..."
              className="input pl-9 text-sm"
            />
          </div>

          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="input w-auto text-sm">
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }} className="input w-auto text-sm">
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            className={`btn text-sm gap-1.5 ${showAdvanced ? 'btn-primary' : 'btn-outline'}`}
          >
            <FiFilter size={14} /> Nâng cao
          </button>

          <button type="button" onClick={() => refetch()} disabled={isFetching} className="btn btn-outline text-sm gap-1.5">
            <FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Làm mới
          </button>

          {hasFilters && (
            <button type="button" onClick={resetFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium">
              <FiX size={14} /> Xóa bộ lọc
            </button>
          )}
        </div>

        {showAdvanced && (
          <div className="flex flex-wrap gap-4 items-end pt-3 border-t dark:border-gray-700">
            <div className="flex flex-col gap-1 min-w-44">
              <span className="text-xs font-medium text-gray-500">Phương thức</span>
              <select value={gateway} onChange={(event) => { setGateway(event.target.value); setPage(1) }} className="input text-sm">
                {gatewayOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 min-w-40">
              <span className="text-xs font-medium text-gray-500">Từ ngày</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => updateDateFrom(event.target.value)}
                className="input text-sm"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-40">
              <span className="text-xs font-medium text-gray-500">Đến ngày</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => updateDateTo(event.target.value)}
                className="input text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 pt-1">
          <span>
            {isFetching ? 'Đang tải...' : `${totalItems} giao dịch thanh toán`}
            {hasFilters && <span className="ml-2 text-primary-600 font-medium">(đang lọc)</span>}
          </span>
          {totalPages > 1 && <span>Trang {page} / {totalPages}</span>}
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-gray-200 p-5 dark:border-gray-600">
          <h2 className="font-bold">Lịch sử thanh toán</h2>
          <p className="mt-1 text-xs text-gray-500">{totalItems} giao dịch phù hợp bộ lọc</p>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Đơn hàng</th>
                <th>Khách hàng</th>
                <th>Phương thức</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-10 text-center text-gray-500">Đang tải dữ liệu thanh toán...</td></tr>
              ) : payments.length ? payments.map((payment) => {
                const MethodIcon = gatewayIcons[payment.gateway] || FiActivity
                return (
                  <tr key={payment.id}>
                    <td>
                      <p className="font-mono text-xs font-semibold">{payment.order_number || '-'}</p>
                      <p className="mt-1 text-xs text-gray-500">{payment.transaction_id || 'Chưa có mã giao dịch'}</p>
                    </td>
                    <td>
                      <p className="font-medium">{`${payment.first_name || ''} ${payment.last_name || ''}`.trim() || '-'}</p>
                      <p className="mt-1 text-xs text-gray-500">{payment.email || '-'}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <MethodIcon className="text-primary-600" />
                        <span>{gatewayLabels[payment.gateway] || payment.gateway}</span>
                      </div>
                    </td>
                    <td className="font-semibold">{formatPrice(payment.amount)}</td>
                    <td><span className={`badge ${statusClasses[payment.status] || 'badge-gray'}`}>{statusLabels[payment.status] || payment.status}</span></td>
                    <td>
                      <p>Tạo lúc: {formatTimestamp(payment.created_at_unix, payment.created_at)}</p>
                      {payment.verified_at && (
                        <p className="mt-1 text-xs font-semibold text-green-600">
                          Thanh toán lúc: {formatTimestamp(payment.verified_at_unix, payment.verified_at)}
                        </p>
                      )}
                      {payment.gateway === 'bank_transfer' && payment.expires_at && (
                        <p className="mt-1 text-xs text-gray-500">QR hết hạn: {formatTimestamp(payment.expires_at_unix, payment.expires_at)}</p>
                      )}
                    </td>
                    <td>
                      {data?.isDevelopment && payment.gateway === 'bank_transfer' && payment.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            disabled={simulateMutation.isPending}
                            onClick={() => simulateMutation.mutate({ id: payment.id, result: 'paid' })}
                          >
                            <FiCheckCircle />
                            Thành công
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={simulateMutation.isPending}
                            onClick={() => simulateMutation.mutate({ id: payment.id, result: 'failed' })}
                          >
                            <FiXCircle />
                            Thất bại
                          </button>
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                )
              }) : (
                <tr><td colSpan={7} className="py-10 text-center text-gray-500">Chưa có giao dịch phù hợp</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Trang <span className="font-medium text-gray-800 dark:text-gray-100">{page}</span> / {totalPages}
              &nbsp;·&nbsp;{totalItems} giao dịch
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(1)} className="btn btn-outline btn-sm px-2" title="Trang đầu">«</button>
              <button disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="btn btn-outline btn-sm flex items-center gap-1">
                <FiChevronLeft size={14} /> Trước
              </button>
              <PaginationNumbers page={page} totalPages={totalPages} onPageChange={setPage} />
              <button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="btn btn-outline btn-sm flex items-center gap-1">
                Sau <FiChevronRight size={14} />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="btn btn-outline btn-sm px-2" title="Trang cuối">»</button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default Payments
