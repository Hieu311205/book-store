import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiRefreshCw,
  FiShield,
  FiSmartphone,
  FiXCircle,
} from 'react-icons/fi'
import { adminService } from '../../services/admin.service'

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
  : '—'

const formatTimestamp = (timestamp, fallback) => timestamp
  ? formatDate(Number(timestamp) * 1000)
  : formatDate(fallback)

const Payments = () => {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [gateway, setGateway] = useState('')

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => adminService.getPayments({}),
    select: (res) => res.data,
  })

  const payments = data?.payments || []
  const visiblePayments = useMemo(() => payments.filter((payment) => (
    (!status || payment.status === status) && (!gateway || payment.gateway === gateway)
  )), [gateway, payments, status])

  const summary = useMemo(() => {
    const totalPaid = payments
      .filter((payment) => payment.status === 'paid')
      .reduce((total, payment) => total + Number(payment.amount || 0), 0)
    const pending = payments.filter((payment) => payment.status === 'pending')
    const expiringQr = pending.filter((payment) => payment.gateway === 'bank_transfer' && payment.expires_at)

    return {
      totalPaid,
      paidCount: payments.filter((payment) => payment.status === 'paid').length,
      pendingCount: pending.length,
      failedCount: payments.filter((payment) => ['failed', 'expired'].includes(payment.status)).length,
      expiringQrCount: expiringQr.length,
    }
  }, [payments])

  const methodStats = useMemo(() => Object.keys(gatewayLabels).map((method) => ({
    method,
    count: payments.filter((payment) => payment.gateway === method).length,
  })), [payments])

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
              <p className="mt-2 text-3xl font-bold">{formatPrice(summary.totalPaid)}</p>
              <div className="mt-6 flex items-end justify-between text-xs text-gray-300">
                <span>{summary.paidCount} giao dịch thành công</span>
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
            <p className="mt-1 text-3xl font-bold">{summary.pendingCount}</p>
            <p className="mt-2 text-xs text-gray-500">{summary.expiringQrCount} giao dịch QR có thời hạn 15 phút</p>
          </div>
        </section>

        <section className="card flex min-h-52 flex-col justify-between p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
            <FiXCircle size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Thất bại hoặc hết hạn</p>
            <p className="mt-1 text-3xl font-bold">{summary.failedCount}</p>
            <p className="mt-2 text-xs text-gray-500">Cần kiểm tra trước khi khách tạo đơn mới</p>
          </div>
        </section>
      </div>

      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Phương thức thanh toán</h2>
            <p className="mt-1 text-xs text-gray-500">Số giao dịch phát sinh theo từng hình thức.</p>
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

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-5 dark:border-gray-600">
          <div>
            <h2 className="font-bold">Lịch sử thanh toán</h2>
            <p className="mt-1 text-xs text-gray-500">{visiblePayments.length} giao dịch phù hợp bộ lọc</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="input w-auto" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select className="input w-auto" value={gateway} onChange={(event) => setGateway(event.target.value)}>
              <option value="">Tất cả phương thức</option>
              {Object.entries(gatewayLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
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
              {visiblePayments.map((payment) => {
                const MethodIcon = gatewayIcons[payment.gateway] || FiActivity
                return (
                  <tr key={payment.id}>
                    <td>
                      <p className="font-mono text-xs font-semibold">{payment.order_number || '—'}</p>
                      <p className="mt-1 text-xs text-gray-500">{payment.transaction_id || 'Chưa có mã giao dịch'}</p>
                    </td>
                    <td>
                      <p className="font-medium">{`${payment.first_name || ''} ${payment.last_name || ''}`.trim() || '—'}</p>
                      <p className="mt-1 text-xs text-gray-500">{payment.email || '—'}</p>
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
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
              {!isLoading && !visiblePayments.length && (
                <tr><td colSpan={7} className="py-10 text-center text-gray-500">Chưa có giao dịch phù hợp</td></tr>
              )}
              {isLoading && (
                <tr><td colSpan={7} className="py-10 text-center text-gray-500">Đang tải dữ liệu thanh toán...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Payments
