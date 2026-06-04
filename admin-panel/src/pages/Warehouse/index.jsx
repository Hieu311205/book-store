import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FiArchive,
  FiArrowDown,
  FiArrowUp,
  FiBox,
  FiRefreshCw,
  FiSearch,
} from 'react-icons/fi'
import { adminService } from '../../services/admin.service'
import AdminPagination from '../../components/common/AdminPagination'

const LIMIT = 10

const movementLabels = {
  import: 'Nhập kho',
  export: 'Xuất kho',
  adjustment: 'Điều chỉnh',
}

const movementClasses = {
  import: 'badge-success',
  export: 'badge-danger',
  adjustment: 'badge-info',
}

const emptyForm = {
  product_id: '',
  type: 'import',
  quantity: '',
  after_stock: '',
  unit_cost: '',
  note: '',
}

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0))
const formatDate = (value) => value ? new Date(value).toLocaleString('vi-VN') : '-'

const Warehouse = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(emptyForm)

  const params = {
    page,
    limit: LIMIT,
    search: search || undefined,
    type: type || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  }

  const { data: summary = {}, isFetching: isSummaryFetching } = useQuery({
    queryKey: ['admin-warehouse-summary'],
    queryFn: adminService.getWarehouseSummary,
    select: (res) => res.data,
  })

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-stock-movements', params],
    queryFn: () => adminService.getStockMovements(params),
    select: (res) => res.data,
  })

  const { data: productsData } = useQuery({
    queryKey: ['admin-products-for-warehouse'],
    queryFn: () => adminService.getProducts({ limit: 100, sort: 'name_asc' }),
    select: (res) => res.data,
  })

  const movements = data?.movements || []
  const products = productsData?.products || []
  const selectedProduct = products.find((product) => Number(product.id) === Number(form.product_id))
  const totalPages = data?.pagination?.totalPages || 1
  const totalItems = data?.pagination?.totalItems ?? 0

  const mutation = useMutation({
    mutationFn: adminService.createStockMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['admin-warehouse-summary'] })
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      setForm(emptyForm)
      toast.success('Đã ghi nhận phiếu kho')
    },
    onError: (error) => toast.error(error.message || 'Không thể tạo phiếu kho'),
  })

  const submit = (event) => {
    event.preventDefault()
    if (form.type === 'export' && selectedProduct && Number(form.quantity || 0) > Number(selectedProduct.stock || 0)) {
      toast.error(`Tồn kho chỉ còn ${formatNumber(selectedProduct.stock)} cuốn, không thể xuất ${formatNumber(form.quantity)} cuốn`)
      return
    }

    const payload = {
      product_id: Number(form.product_id),
      type: form.type,
      quantity: Number(form.quantity || 0),
      after_stock: form.after_stock === '' ? undefined : Number(form.after_stock),
      unit_cost: form.type === 'import' && form.unit_cost !== '' ? Number(form.unit_cost) : null,
      note: form.note || null,
    }
    mutation.mutate(payload)
  }

  const resetFilters = () => {
    setSearch('')
    setType('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Quản lý kho</h1>
        <button type="button" className="btn btn-outline" onClick={() => refetch()} disabled={isFetching || isSummaryFetching}>
          <FiRefreshCw className={(isFetching || isSummaryFetching) ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="stat-card-label">Tổng tồn kho</div>
          <div className="stat-card-value">{formatNumber(summary.total_stock)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Sắp hết hàng</div>
          <div className="stat-card-value text-yellow-500">{formatNumber(summary.low_stock)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Hết hàng</div>
          <div className="stat-card-value text-red-500">{formatNumber(summary.out_of_stock)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Nhập 30 ngày</div>
          <div className="stat-card-value text-green-500">{formatNumber(summary.imports_30d)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Xuất 30 ngày</div>
          <div className="stat-card-value text-primary-500">{formatNumber(summary.exports_30d)}</div>
        </div>
      </div>

      <form onSubmit={submit} className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FiBox className="text-primary-500" />
          <h2 className="font-semibold">Tạo phiếu kho</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium">Sách</span>
            <select className="input" required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
              <option value="">Chọn sách</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title} - tồn {product.stock}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Loại phiếu</span>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="import">Nhập kho</option>
              <option value="export">Xuất kho</option>
              <option value="adjustment">Điều chỉnh tồn</option>
            </select>
          </label>
          {form.type === 'adjustment' ? (
            <label className="space-y-1">
              <span className="text-sm font-medium">Tồn kho mới</span>
              <input className="input" type="number" min="0" required value={form.after_stock} onChange={(e) => setForm({ ...form, after_stock: e.target.value })} />
            </label>
          ) : (
            <label className="space-y-1">
              <span className="text-sm font-medium">Số lượng</span>
              <input className="input" type="number" min="1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </label>
          )}
          <label className={`space-y-1 ${form.type === 'import' ? '' : 'hidden'}`}>
            <span className="text-sm font-medium">Giá nhập/đơn vị</span>
            <input className={`input ${form.type === 'import' ? '' : 'hidden'}`} type="number" min="0" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
          </label>
          <label className="space-y-1 md:col-span-3">
            <span className="text-sm font-medium">Ghi chú</span>
            <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="VD: nhập từ NXB, xuất kiểm kê, điều chỉnh sai lệch..." />
          </label>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {form.type === 'import' ? <FiArrowDown /> : <FiArrowUp />} Ghi nhận phiếu
          </button>
        </div>
      </form>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            className="input pl-9"
            placeholder="Tìm sách, SKU, ghi chú..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="input w-auto" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }}>
          <option value="">Tất cả phiếu</option>
          <option value="import">Nhập kho</option>
          <option value="export">Xuất kho</option>
          <option value="adjustment">Điều chỉnh</option>
        </select>
        <input className="input w-auto" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} />
        <input className="input w-auto" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} />
        <button type="button" className="btn btn-outline" onClick={resetFilters}>Xóa lọc</button>
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Sách</th>
                <th>Loại</th>
                <th>Số lượng</th>
                <th>Tồn trước/sau</th>
                <th>Người tạo</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-8">Đang tải...</td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">Chưa có phiếu kho</td></tr>
              ) : movements.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap">{formatDate(item.created_at)}</td>
                  <td>
                    <p className="font-semibold">{item.product_title}</p>
                    <p className="text-xs text-gray-500">{item.sku || '-'}</p>
                  </td>
                  <td>
                    <span className={`badge ${movementClasses[item.type] || 'badge-gray'}`}>
                      {movementLabels[item.type] || item.type}
                    </span>
                  </td>
                  <td className="font-semibold">{formatNumber(item.quantity)}</td>
                  <td>{formatNumber(item.before_stock)} → {formatNumber(item.after_stock)}</td>
                  <td>
                    <p>{item.created_by_name?.trim() || '-'}</p>
                    <p className="text-xs text-gray-500">{item.created_by_email || ''}</p>
                  </td>
                  <td className="max-w-xs">{item.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-gray-500">Trang {page} / {totalPages} · {totalItems} phiếu kho</span>
          <div className="flex items-center gap-2">
            <AdminPagination page={page} totalPages={totalPages} totalItems={totalItems} label="phiếu kho" onPageChange={setPage} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Warehouse
