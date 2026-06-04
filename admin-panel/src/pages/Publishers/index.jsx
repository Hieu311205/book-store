import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiEdit2, FiExternalLink, FiPlus, FiSearch, FiTrash2, FiX } from 'react-icons/fi'
import { adminService } from '../../services/admin.service'

const emptyForm = { name: '', name_en: '', logo_url: '', website: '' }

const PubFormModal = ({ form, setForm, editingId, onSubmit, onClose, isSaving }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl">
      <div className="border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{editingId ? 'Sửa nhà xuất bản' : 'Thêm nhà xuất bản'}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiX size={18} /></button>
      </div>
      <div className="p-6 space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Tên NXB <span className="text-red-500">*</span></span>
          <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Tên tiếng Anh</span>
          <input className="input" value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">URL logo</span>
          <input className="input" placeholder="https://..." value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Website</span>
          <input className="input" placeholder="https://nxb.com.vn" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
        </label>
      </div>
      <div className="border-t dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
        <button onClick={onClose} className="btn btn-secondary">Hủy</button>
        <button onClick={onSubmit} disabled={isSaving} className="btn btn-primary min-w-28">
          {isSaving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm NXB'}
        </button>
      </div>
    </div>
  </div>
)

const Publishers = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-publishers-list', search, page],
    queryFn: () => adminService.getAdminPublishers({ search, page, limit: 20 }),
    select: res => res.data,
  })

  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ['admin-publishers-list'] }); queryClient.invalidateQueries({ queryKey: ['admin-publishers'] }) }
  const close_ = () => { setIsOpen(false); setEditingId(null); setForm(emptyForm) }

  const createMutation = useMutation({ mutationFn: adminService.createPublisher, onSuccess: () => { invalidate(); close_(); toast.success('Đã thêm NXB') }, onError: e => toast.error(e.message) })
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => adminService.updatePublisher(id, data), onSuccess: () => { invalidate(); close_(); toast.success('Đã cập nhật') }, onError: e => toast.error(e.message) })
  const deleteMutation = useMutation({ mutationFn: adminService.deletePublisher, onSuccess: () => { invalidate(); toast.success('Đã xóa') }, onError: e => toast.error(e.message || 'Không thể xóa') })

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setIsOpen(true) }
  const openEdit = (p) => { setForm({ name: p.name, name_en: p.name_en || '', logo_url: p.logo_url || '', website: p.website || '' }); setEditingId(p.id); setIsOpen(true) }
  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên nhà xuất bản')
    editingId ? updateMutation.mutate({ id: editingId, data: form }) : createMutation.mutate(form)
  }

  const publishers = data?.publishers || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nhà xuất bản</h1>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <FiPlus size={16} /> Thêm NXB
        </button>
      </div>

      {isOpen && <PubFormModal form={form} setForm={setForm} editingId={editingId} onSubmit={handleSubmit} onClose={close_} isSaving={createMutation.isPending || updateMutation.isPending} />}

      <div className="card">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="relative max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input className="input pl-9 py-2 text-sm" placeholder="Tìm nhà xuất bản..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : publishers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Không có nhà xuất bản nào</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Nhà xuất bản</th>
                  <th>Tên tiếng Anh</th>
                  <th>Website</th>
                  <th className="text-center">Số sách</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {publishers.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {p.logo_url && <img src={p.logo_url} alt={p.name} className="w-8 h-8 rounded object-contain bg-gray-50" />}
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-500 text-sm">{p.name_en || '—'}</td>
                    <td>
                      {p.website ? (
                        <a href={p.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-sm">
                          <FiExternalLink size={12} /> {p.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="text-center">
                      <span className="badge badge-blue">{p.product_count || 0}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="btn btn-outline btn-sm flex items-center gap-1"><FiEdit2 size={13} /> Sửa</button>
                        <button
                          onClick={() => { if (window.confirm(`Xóa "${p.name}"?`)) deleteMutation.mutate(p.id) }}
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
            <span className="text-gray-500">Tổng {pagination.totalItems} nhà xuất bản</span>
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

export default Publishers
