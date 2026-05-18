import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiChevronLeft, FiChevronRight, FiEdit2, FiFilter, FiPlus, FiRefreshCw, FiSave, FiSearch, FiTrash2, FiX } from 'react-icons/fi'
import { adminService } from '../../services/admin.service'
import PaginationNumbers from '../../components/common/PaginationNumbers'

const emptyForm = {
  name: '',
  name_en: '',
  parent_id: '',
  description: '',
  image_url: '',
  icon: '',
  sort_order: 0,
  is_active: 1,
}

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Hiện' },
  { value: 'inactive', label: 'Ẩn' },
]

const parentFilterOptions = [
  { value: '', label: 'Tất cả cấp danh mục' },
  { value: 'root', label: 'Danh mục gốc' },
  { value: 'child', label: 'Danh mục con' },
]

const sortOptions = [
  { value: 'sort_order', label: 'Thứ tự hiển thị' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'name_asc', label: 'Tên A - Z' },
  { value: 'products_desc', label: 'Nhiều sách nhất' },
]

const LIMIT = 10

const normalizeCategoryPayload = (form) => ({
  name: form.name.trim(),
  name_en: form.name_en.trim(),
  parent_id: form.parent_id || '',
  description: form.description.trim(),
  image_url: form.image_url.trim(),
  icon: form.icon.trim(),
  sort_order: Number(form.sort_order || 0),
  is_active: Number(form.is_active),
})

const Categories = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [parentFilter, setParentFilter] = useState('')
  const [sort, setSort] = useState('sort_order')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [page, setPage] = useState(1)

  const hasFilters = !!(search || status || parentFilter)
  const queryParams = {
    page,
    limit: LIMIT,
    search: search || undefined,
    status: status || undefined,
    parent: parentFilter || undefined,
    sort,
  }

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-categories', queryParams],
    queryFn: () => adminService.getCategories(queryParams),
    select: (res) => res.data,
  })

  const { data: allCategories = [] } = useQuery({
    queryKey: ['admin-categories-all'],
    queryFn: () => adminService.getCategories(),
    select: (res) => res.data || [],
  })

  const refreshCategories = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    queryClient.invalidateQueries({ queryKey: ['admin-categories-all'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setIsFormOpen(false)
  }

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setParentFilter('')
    setSort('sort_order')
    setPage(1)
  }

  const createMutation = useMutation({
    mutationFn: adminService.createCategory,
    onSuccess: () => {
      refreshCategories()
      resetForm()
      toast.success('Đã thêm danh mục')
    },
    onError: (error) => toast.error(error.message || 'Không thể thêm danh mục'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => adminService.updateCategory(id, payload),
    onSuccess: () => {
      refreshCategories()
      resetForm()
      toast.success('Đã cập nhật danh mục')
    },
    onError: (error) => toast.error(error.message || 'Không thể cập nhật danh mục'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteCategory,
    onSuccess: () => {
      refreshCategories()
      toast.success('Đã xóa danh mục')
    },
    onError: (error) => toast.error(error.message || 'Không thể xóa danh mục'),
  })

  const submit = (event) => {
    event.preventDefault()
    const payload = normalizeCategoryPayload(form)
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm({
      name: item.name || '',
      name_en: item.name_en || '',
      parent_id: item.parent_id ? String(item.parent_id) : '',
      description: item.description || '',
      image_url: item.image_url || '',
      icon: item.icon || '',
      sort_order: item.sort_order ?? 0,
      is_active: Number(item.is_active ?? 1),
    })
    setIsFormOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  const parentOptions = allCategories.filter((item) => Number(item.id) !== Number(editingId))
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const categories = data?.categories || []
  const totalPages = data?.pagination?.totalPages || 1
  const totalItems = data?.pagination?.totalItems ?? categories.length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Danh mục</h1>
        <button type="button" onClick={openCreate} className="btn btn-primary">
          <FiPlus /> Thêm danh mục
        </button>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tên danh mục, tên tiếng Anh..."
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
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium"
            >
              <FiX size={14} /> Xóa bộ lọc
            </button>
          )}
        </div>

        {showAdvanced && (
          <div className="flex flex-wrap gap-4 items-end pt-3 border-t dark:border-gray-700">
            <div className="flex flex-col gap-1 min-w-44">
              <span className="text-xs font-medium text-gray-500">Cấp danh mục</span>
              <select value={parentFilter} onChange={(e) => { setParentFilter(e.target.value); setPage(1) }} className="input text-sm">
                {parentFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 pt-1">
          <span>
            {isFetching ? 'Đang tải...' : `${totalItems} danh mục`}
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
                <th>Tên</th>
                <th>Danh mục cha</th>
                <th>Thứ tự</th>
                <th>Sách</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8">Đang tải...</td></tr>
              ) : categories.length ? categories.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="font-medium">{item.name}</div>
                    {item.name_en && <div className="text-xs text-gray-500">{item.name_en}</div>}
                  </td>
                  <td>{item.parent_name || '-'}</td>
                  <td>{item.sort_order}</td>
                  <td>{item.product_count || 0}</td>
                  <td>
                    <span className={`badge ${Number(item.is_active) ? 'badge-success' : 'badge-danger'}`}>
                      {Number(item.is_active) ? 'Hiện' : 'Ẩn'}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => startEdit(item)} className="text-blue-500 hover:text-blue-600" title="Sửa">
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-500 hover:text-red-600 disabled:opacity-50"
                        title="Xóa"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    {hasFilters ? 'Không tìm thấy danh mục phù hợp với bộ lọc' : 'Chưa có danh mục'}
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
              &nbsp;·&nbsp;{totalItems} danh mục
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

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingId ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h2>
              <button type="button" onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <FiX size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Thông tin cơ bản</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Tên danh mục <span className="text-red-500">*</span></span>
                    <input
                      className="input"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Tên tiếng Anh</span>
                    <input
                      className="input"
                      value={form.name_en}
                      onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Danh mục cha</span>
                    <select
                      className="input"
                      value={form.parent_id}
                      onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                    >
                      <option value="">Không có danh mục cha</option>
                      {parentOptions.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Trạng thái</span>
                    <select
                      className="input"
                      value={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.value })}
                    >
                      <option value={1}>Hiện</option>
                      <option value={0}>Ẩn</option>
                    </select>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Hiển thị</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Thứ tự</span>
                    <input
                      className="input"
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Icon</span>
                    <input
                      className="input"
                      placeholder="book, star..."
                      value={form.icon}
                      onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1 md:col-span-1">
                    <span className="text-sm font-medium">Ảnh danh mục URL</span>
                    <input
                      className="input"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    />
                  </label>
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-medium">Mô tả</span>
                <textarea
                  className="input min-h-28"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="btn btn-secondary">Hủy</button>
              <button className="btn btn-primary min-w-32" disabled={isSubmitting}>
                {editingId ? <FiSave /> : <FiPlus />}
                {isSubmitting ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm danh mục'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Categories
