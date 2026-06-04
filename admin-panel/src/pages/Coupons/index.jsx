import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiChevronLeft, FiChevronRight, FiEdit2, FiFilter, FiPlus, FiRefreshCw, FiSearch, FiTrash2, FiX } from 'react-icons/fi'
import { adminService } from '../../services/admin.service'
import PaginationNumbers from '../../components/common/PaginationNumbers'

const emptyForm = {
  code: '',
  type: 'percentage',
  value: '',
  min_purchase: 0,
  max_discount: '',
  usage_limit: '',
  is_active: 1,
}

const LIMIT = 10

const typeOptions = [
  { value: '', label: 'Tất cả loại' },
  { value: 'percentage', label: 'Phần trăm' },
  { value: 'fixed', label: 'Số tiền' },
]

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Bật' },
  { value: 'inactive', label: 'Tắt' },
  { value: 'exhausted', label: 'Hết lượt' },
  { value: 'expired', label: 'Hết hạn' },
]

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'code_asc', label: 'Code A - Z' },
  { value: 'value_desc', label: 'Giá trị cao nhất' },
  { value: 'used_desc', label: 'Dùng nhiều nhất' },
]

const getCouponStatus = (item) => {
  if (item.effective_status === 'exhausted') {
    return { label: 'Hết lượt', cls: 'badge-danger', toggleable: false }
  }
  if (item.effective_status === 'expired') {
    return { label: 'Hết hạn', cls: 'badge-danger', toggleable: false }
  }
  if (item.effective_status === 'scheduled') {
    return { label: 'Chưa tới hạn', cls: 'badge-warning', toggleable: true }
  }
  if (Number(item.is_active)) {
    return { label: 'Bật', cls: 'badge-success', toggleable: true }
  }
  return { label: 'Tắt', cls: 'badge-danger', toggleable: true }
}

const Coupons = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [page, setPage] = useState(1)

  const hasFilters = !!(search || type || status)
  const queryParams = {
    page,
    limit: LIMIT,
    search: search || undefined,
    type: type || undefined,
    status: status || undefined,
    sort,
  }

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-coupons', queryParams],
    queryFn: () => adminService.getCoupons(queryParams),
    select: (res) => res.data,
  })

  const coupons = data?.coupons || []
  const totalPages = data?.pagination?.totalPages || 1
  const totalItems = data?.pagination?.totalItems ?? 0

  const resetFilters = () => {
    setSearch('')
    setType('')
    setStatus('')
    setSort('newest')
    setPage(1)
  }

  const createMutation = useMutation({
    mutationFn: adminService.createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      setForm(emptyForm)
      setEditingCoupon(null)
      setIsFormOpen(false)
      toast.success('Đã tạo mã giảm giá')
    },
    onError: (error) => toast.error(error.message || 'Không thể tạo mã'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      setForm(emptyForm)
      setEditingCoupon(null)
      setIsFormOpen(false)
      toast.success('Cập nhật mã giảm giá thành công')
    },
    onError: (error) => toast.error(error.message || 'Không thể cập nhật mã'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteCoupon,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
  })

  const toggleCouponStatus = (item) => {
    const statusInfo = getCouponStatus(item)
    if (!statusInfo.toggleable) {
      toast.error('Mã đã hết lượt hoặc hết hạn. Hãy tăng giới hạn hoặc chỉnh hạn dùng trước khi bật lại.')
      return
    }
    updateMutation.mutate({
      id: item.id,
      data: { is_active: Number(item.is_active) ? 0 : 1 },
    })
  }

  const openCreateForm = () => {
    setForm(emptyForm)
    setEditingCoupon(null)
    setIsFormOpen(true)
  }

  const openEditForm = (item) => {
    setForm({
      code: item.code || '',
      type: item.type || 'percentage',
      value: item.value ?? '',
      min_purchase: item.min_purchase ?? 0,
      max_discount: item.max_discount ?? '',
      usage_limit: item.usage_limit ?? '',
      is_active: Number(item.is_active),
    })
    setEditingCoupon(item)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setForm(emptyForm)
    setEditingCoupon(null)
    setIsFormOpen(false)
  }

  const submit = (event) => {
    event.preventDefault()
    const payload = {
      ...form,
      value: Number(form.value),
      min_purchase: Number(form.min_purchase || 0),
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      is_active: Number(form.is_active),
    }

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Mã giảm giá</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateForm}
        >
          <FiPlus /> Thêm mã
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl shadow-2xl">
            <div className="border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingCoupon ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá'}</h2>
              <button type="button" onClick={closeForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <FiX size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">Code</span>
                <input className="input" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Loại mã</span>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="percentage">Phần trăm</option>
                  <option value="fixed">Số tiền</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Giá trị</span>
                <input className="input" type="number" min="0" required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Đơn tối thiểu</span>
                <input className="input" type="number" min="0" value={form.min_purchase} onChange={(e) => setForm({ ...form, min_purchase: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Giảm tối đa</span>
                <input className="input" type="number" min="0" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Lượt dùng</span>
                <input className="input" type="number" min="0" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium">Trạng thái</span>
                <select className="input" value={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
                  <option value={1}>Kích hoạt</option>
                  <option value={0}>Tắt</option>
                </select>
              </label>
            </div>

            <div className="border-t dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button type="button" onClick={closeForm} className="btn btn-secondary">Hủy</button>
              <button className="btn btn-primary min-w-28" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingCoupon
                  ? (updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi')
                  : (createMutation.isPending ? 'Đang thêm...' : 'Thêm mã')}
              </button>
            </div>
          </form>
        </div>
      )}

      <form onSubmit={submit} className="hidden">
        <input className="input" placeholder="Code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="percentage">Phần trăm</option>
          <option value="fixed">Số tiền</option>
        </select>
        <input className="input" type="number" placeholder="Giá trị" required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        <input className="input" type="number" placeholder="Đơn tối thiểu" value={form.min_purchase} onChange={(e) => setForm({ ...form, min_purchase: e.target.value })} />
        <input className="input" type="number" placeholder="Giảm tối đa" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} />
        <input className="input" type="number" placeholder="Lượt dùng" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
        <select className="input" value={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
          <option value={1}>Kích hoạt</option>
          <option value={0}>Tắt</option>
        </select>
        <button className="btn btn-primary" disabled={createMutation.isPending}><FiPlus /> Thêm</button>
      </form>

      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm mã giảm giá..."
              className="input pl-9 text-sm"
            />
          </div>

          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="input w-auto text-sm">
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }} className="input w-auto text-sm">
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
              <span className="text-xs font-medium text-gray-500">Loại mã</span>
              <select value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} className="input text-sm">
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 pt-1">
          <span>
            {isFetching ? 'Đang tải...' : `${totalItems} mã giảm giá`}
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
                <th>Code</th>
                <th>Loại</th>
                <th>Giá trị</th>
                <th>Đơn tối thiểu</th>
                <th>Đã dùng</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8">Đang tải...</td></tr>
              ) : coupons.length ? coupons.map((item) => {
                const statusInfo = getCouponStatus(item)
                return (
                <tr key={item.id}>
                  <td className="font-medium">{item.code}</td>
                  <td>{item.type === 'percentage' ? 'Phần trăm' : 'Số tiền'}</td>
                  <td>{item.type === 'percentage' ? `${item.value}%` : Number(item.value).toLocaleString('vi-VN')}</td>
                  <td>{Number(item.min_purchase || 0).toLocaleString('vi-VN')}</td>
                  <td>{item.used_count || 0}/{item.usage_limit || '-'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleCouponStatus(item)}
                      disabled={updateMutation.isPending}
                      className={`badge cursor-pointer ${statusInfo.cls}`}
                      title={Number(item.is_active) ? 'Tắt mã giảm giá' : 'Bật mã giảm giá'}
                    >
                      {statusInfo.label}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEditForm(item)}
                        className="text-primary-500 hover:text-primary-400 disabled:opacity-50"
                        title="Sửa mã giảm giá"
                      >
                        <FiEdit2 />
                      </button>
                      <button onClick={() => deleteMutation.mutate(item.id)} disabled={deleteMutation.isPending} className="text-red-500 disabled:opacity-50" title="Xóa mã giảm giá">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
                )
              }) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    {hasFilters ? 'Không tìm thấy mã phù hợp với bộ lọc' : 'Chưa có mã'}
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
              &nbsp;·&nbsp;{totalItems} mã giảm giá
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

export default Coupons
