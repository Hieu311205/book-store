import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiXCircle,
} from 'react-icons/fi'
import { adminService } from '../../services/admin.service'
import PaginationNumbers from '../../components/common/PaginationNumbers'

const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0))

const LIMIT = 10

const typeOptions = [
  { value: '', label: 'Tất cả loại' },
  { value: 'credit', label: 'Cộng tiền' },
  { value: 'debit', label: 'Trừ tiền' },
]

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'rejected', label: 'Từ chối' },
]

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'amount_desc', label: 'Số tiền cao nhất' },
  { value: 'amount_asc', label: 'Số tiền thấp nhất' },
]

const statusLabels = {
  pending: { label: 'Chờ xử lý', cls: 'badge-warning' },
  completed: { label: 'Hoàn tất', cls: 'badge-success' },
  rejected: { label: 'Từ chối', cls: 'badge-danger' },
}

const typeLabels = {
  credit: { label: 'Cộng tiền', cls: 'text-green-500' },
  debit: { label: 'Trừ tiền', cls: 'text-red-500' },
}

const Wallets = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [page, setPage] = useState(1)

  const hasFilters = Boolean(search || type || status || dateFrom || dateTo)
  const queryParams = {
    page,
    limit: LIMIT,
    search: search || undefined,
    type: type || undefined,
    status: status || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    sort,
  }

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-wallets', queryParams],
    queryFn: () => adminService.getWalletTransactions(queryParams),
    select: (res) => res.data,
  })

  const transactions = data?.transactions || []
  const stats = data?.stats || {}
  const totalPages = data?.pagination?.totalPages || 1
  const totalItems = data?.pagination?.totalItems ?? 0

  const updateMutation = useMutation({
    mutationFn: ({ id, status: nextStatus, admin_note }) =>
      adminService.updateWalletTransaction(id, { status: nextStatus, admin_note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] })
      toast.success('Đã cập nhật giao dịch ví')
    },
    onError: (error) => toast.error(error.message || 'Không thể cập nhật giao dịch ví'),
  })

  const resetFilters = () => {
    setSearch('')
    setType('')
    setStatus('')
    setDateFrom('')
    setDateTo('')
    setSort('newest')
    setPage(1)
  }

  const isDateRangeTooLong = () => {
    if (!dateFrom || !dateTo) return false
    const from = new Date(`${dateFrom}T00:00:00`)
    const to = new Date(`${dateTo}T00:00:00`)
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return false
    const maxTo = new Date(from)
    maxTo.setMonth(maxTo.getMonth() + 1)
    return to > maxTo
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

  const handleWithdraw = (transaction, nextStatus) => {
    const message = nextStatus === 'completed'
      ? 'Xác nhận đã chuyển tiền cho yêu cầu rút này?'
      : 'Từ chối yêu cầu rút và hoàn lại tiền vào ví?'
    if (!window.confirm(message)) return

    updateMutation.mutate({
      id: transaction.id,
      status: nextStatus,
      admin_note: nextStatus === 'completed' ? 'Đã chuyển tiền về ngân hàng' : 'Admin từ chối yêu cầu rút tiền',
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý ví điện tử</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Tổng số dư ví</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">{formatPrice(stats.totalBalance)} đ</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Yêu cầu rút chờ xử lý</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.pendingWithdrawals || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Tiền rút đang chờ</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{formatPrice(stats.pendingWithdrawAmount)} đ</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Ngân hàng đã liên kết</p>
          <p className="text-2xl font-bold mt-1">{stats.linkedBanks || 0}</p>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1) }}
              placeholder="Tên, email, ngân hàng, số tài khoản..."
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
            <div className="flex flex-col gap-1 min-w-40">
              <span className="text-xs font-medium text-gray-500">Loại giao dịch</span>
              <select value={type} onChange={(event) => { setType(event.target.value); setPage(1) }} className="input text-sm">
                {typeOptions.map((option) => (
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
            {isFetching ? 'Đang tải...' : `${totalItems} giao dịch ví`}
            {hasFilters && <span className="ml-2 text-primary-600 font-medium">(đang lọc)</span>}
          </span>
          {totalPages > 1 && <span>Trang {page} / {totalPages}</span>}
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Loại</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Ngân hàng</th>
                <th>Nội dung</th>
                <th>Ngày</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-8">Đang tải...</td></tr>
              ) : transactions.length ? transactions.map((item) => {
                const statusInfo = statusLabels[item.status] || { label: item.status, cls: 'badge' }
                const typeInfo = typeLabels[item.type] || { label: item.type, cls: 'text-gray-500' }
                const isPendingWithdraw = item.type === 'debit' && item.status === 'pending' && item.reference_type === 'wallet_withdraw'

                return (
                  <tr key={item.id}>
                    <td>
                      <p className="font-semibold">{item.first_name} {item.last_name}</p>
                      <p className="text-xs text-gray-500">{item.email}</p>
                      <p className="text-xs text-gray-500">Ví: {formatPrice(item.balance)} đ</p>
                    </td>
                    <td><span className={`font-semibold ${typeInfo.cls}`}>{typeInfo.label}</span></td>
                    <td className="font-semibold">{item.type === 'credit' ? '+' : '-'}{formatPrice(item.amount)} đ</td>
                    <td><span className={`badge ${statusInfo.cls}`}>{statusInfo.label}</span></td>
                    <td>
                      {item.bank_name ? (
                        <div className="text-sm">
                          <p className="font-medium">{item.bank_name}</p>
                          <p className="text-gray-500">{item.bank_account_name}</p>
                          <p className="font-mono text-xs text-gray-500">{item.bank_account_number}</p>
                        </div>
                      ) : item.linked_bank_name ? (
                        <div className="text-sm">
                          <p className="font-medium">{item.linked_bank_name}</p>
                          <p className="font-mono text-xs text-gray-500">{item.linked_bank_account_number}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="max-w-xs">
                      <p className="line-clamp-2">{item.description || '-'}</p>
                      {item.reference_type && <p className="text-xs text-gray-500">{item.reference_type} #{item.reference_id || '-'}</p>}
                    </td>
                    <td>{new Date(item.created_at).toLocaleDateString('vi-VN')}</td>
                    <td>
                      {isPendingWithdraw ? (
                        <div className="flex items-center gap-2">
                          <button
                            className="btn btn-sm btn-primary gap-1"
                            disabled={updateMutation.isPending}
                            onClick={() => handleWithdraw(item, 'completed')}
                          >
                            <FiCheck size={14} /> Duyệt
                          </button>
                          <button
                            className="btn btn-sm btn-outline text-red-500 gap-1"
                            disabled={updateMutation.isPending}
                            onClick={() => handleWithdraw(item, 'rejected')}
                          >
                            <FiXCircle size={14} /> Từ chối
                          </button>
                        </div>
                      ) : (
                        <FiCreditCard className="text-gray-400" />
                      )}
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    {hasFilters ? 'Không tìm thấy giao dịch ví phù hợp với bộ lọc' : 'Chưa có giao dịch ví'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Trang <span className="font-medium text-gray-800 dark:text-gray-100">{page}</span> / {totalPages}
              &nbsp;-&nbsp;{totalItems} giao dịch ví
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(1)} className="btn btn-outline btn-sm px-2" title="Trang đầu">«</button>
              <button
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                className="btn btn-outline btn-sm flex items-center gap-1"
              >
                <FiChevronLeft size={14} /> Trước
              </button>
              <PaginationNumbers page={page} totalPages={totalPages} onPageChange={setPage} />
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="btn btn-outline btn-sm flex items-center gap-1"
              >
                Sau <FiChevronRight size={14} />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="btn btn-outline btn-sm px-2" title="Trang cuối">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Wallets
