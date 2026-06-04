import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiX } from 'react-icons/fi'
import { adminService } from '../../services/admin.service'

const emptyForm = { name: '', name_en: '', bio: '', image_url: '' }

const AuthorFormModal = ({ form, setForm, editingId, onSubmit, onClose, isSaving }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl">
      <div className="border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{editingId ? 'Sửa tác giả' : 'Thêm tác giả mới'}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiX size={18} /></button>
      </div>
      <div className="p-6 space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Tên tác giả <span className="text-red-500">*</span></span>
          <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Tên tiếng Anh</span>
          <input className="input" value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Tiểu sử</span>
          <textarea className="input min-h-24 resize-y" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">URL ảnh đại diện</span>
          <input className="input" placeholder="https://..." value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
        </label>
      </div>
      <div className="border-t dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
        <button onClick={onClose} className="btn btn-secondary">Hủy</button>
        <button onClick={onSubmit} disabled={isSaving} className="btn btn-primary min-w-28">
          {isSaving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm tác giả'}
        </button>
      </div>
    </div>
  </div>
)

const Authors = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-authors-list', search, page],
    queryFn: () => adminService.getAdminAuthors({ search, page, limit: 20 }),
    select: res => res.data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-authors-list'] })
  const close_ = () => { setIsOpen(false); setEditingId(null); setForm(emptyForm) }

  const createMutation = useMutation({ mutationFn: adminService.createAuthor, onSuccess: () => { invalidate(); queryClient.invalidateQueries(['admin-authors']); close_(); toast.success('Đã thêm tác giả') }, onError: e => toast.error(e.message) })
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => adminService.updateAuthor(id, data), onSuccess: () => { invalidate(); queryClient.invalidateQueries(['admin-authors']); close_(); toast.success('Đã cập nhật') }, onError: e => toast.error(e.message) })
  const deleteMutation = useMutation({
    mutationFn: adminService.deleteAuthor,
    onSuccess: () => { invalidate(); queryClient.invalidateQueries(['admin-authors']); toast.success('Đã xóa') },
    onError: e => toast.error(e.message || 'Không thể xóa'),
  })

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setIsOpen(true) }
  const openEdit = (a) => { setForm({ name: a.name, name_en: a.name_en || '', bio: a.bio || '', image_url: a.image_url || '' }); setEditingId(a.id); setIsOpen(true) }
  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên tác giả')
    editingId ? updateMutation.mutate({ id: editingId, data: form }) : createMutation.mutate(form)
  }

  const authors = data?.authors || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tác giả</h1>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <FiPlus size={16} /> Thêm tác giả
        </button>
      </div>

      {isOpen && <AuthorFormModal form={form} setForm={setForm} editingId={editingId} onSubmit={handleSubmit} onClose={close_} isSaving={createMutation.isPending || updateMutation.isPending} />}

      <div className="card">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="relative max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input className="input pl-9 py-2 text-sm" placeholder="Tìm tác giả..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : authors.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Không có tác giả nào</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Tác giả</th>
                  <th>Tên tiếng Anh</th>
                  <th className="text-center">Số sách</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {authors.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {a.image_url && <img src={a.image_url} alt={a.name} className="w-8 h-8 rounded-full object-cover" />}
                        <span className="font-medium">{a.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-500 text-sm">{a.name_en || '—'}</td>
                    <td className="text-center">
                      <span className="badge badge-blue">{a.product_count || 0}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(a)} className="btn btn-outline btn-sm flex items-center gap-1"><FiEdit2 size={13} /> Sửa</button>
                        <button
                          onClick={() => { if (window.confirm(`Xóa tác giả "${a.name}"?`)) deleteMutation.mutate(a.id) }}
                          className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 flex items-center gap-1"
                        ><FiTrash2 size={13} /> Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 flex items-center justify-between border-t dark:border-gray-700 text-sm">
            <span className="text-gray-500">Tổng {pagination.totalItems} tác giả</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-outline btn-sm">Trước</button>
              <span className="px-3 py-1">{page}/{pagination.totalPages}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-outline btn-sm">Tiếp</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Authors
