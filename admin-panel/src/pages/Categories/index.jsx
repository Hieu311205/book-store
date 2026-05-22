import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiX } from 'react-icons/fi'
import { adminService } from '../../services/admin.service'

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

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminService.getCategories,
    select: (res) => res.data || [],
  })

  const refreshCategories = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setIsFormOpen(false)
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

  const parentOptions = data.filter((item) => Number(item.id) !== Number(editingId))
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Danh mục</h1>
        <button type="button" onClick={openCreate} className="btn btn-primary">
          <FiPlus /> Thêm danh mục
        </button>
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
              ) : data.length ? data.map((item) => (
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
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Chưa có danh mục</td></tr>
              )}
            </tbody>
          </table>
        </div>
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
