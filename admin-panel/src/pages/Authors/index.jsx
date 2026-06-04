import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiEdit2, FiPlus, FiRefreshCw, FiSearch, FiTrash2, FiUpload, FiX } from 'react-icons/fi'
import { adminService } from '../../services/admin.service'
import AdminPagination from '../../components/common/AdminPagination'

const LIMIT = 10

const emptyForm = {
  name: '',
  name_en: '',
  country: '',
  bio: '',
  image_url: '',
  is_active: 1,
}

const Authors = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const imageInputRef = useRef(null)

  const params = {
    page,
    limit: LIMIT,
    search: search || undefined,
    status: status || undefined,
    sort,
  }

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-authors', params],
    queryFn: () => adminService.getAdminAuthors(params),
    select: (res) => res.data,
  })

  const authors = data?.authors || []
  const totalPages = data?.pagination?.totalPages || 1
  const totalItems = data?.pagination?.totalItems ?? 0

  const closeForm = () => {
    setForm(emptyForm)
    setEditing(null)
    setIsFormOpen(false)
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditing(null)
    setIsFormOpen(true)
  }

  const openEdit = (item) => {
    setForm({
      name: item.name || '',
      name_en: item.name_en || '',
      country: item.country || '',
      bio: item.bio || '',
      image_url: item.image_url || '',
      is_active: Number(item.is_active ?? 1),
    })
    setEditing(item)
    setIsFormOpen(true)
  }

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => id ? adminService.updateAuthor(id, payload) : adminService.createAuthor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-authors'] })
      toast.success(editing ? 'Đã cập nhật tác giả' : 'Đã thêm tác giả')
      closeForm()
    },
    onError: (error) => toast.error(error.message || 'Không thể lưu tác giả'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteAuthor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-authors'] })
      toast.success('Đã xóa tác giả')
    },
    onError: (error) => toast.error(error.message || 'Không thể xóa tác giả'),
  })

  const uploadImageMutation = useMutation({
    mutationFn: (file) => {
      const data = new FormData()
      data.append('image', file)
      return adminService.uploadCatalogImage('author', data)
    },
    onSuccess: (res) => {
      const imageUrl = res.data?.image_url || ''
      if (!imageUrl) return
      setForm((current) => ({ ...current, image_url: imageUrl }))
      toast.success('Đã tải ảnh đại diện')
    },
    onError: (error) => toast.error(error.message || 'Không thể tải ảnh đại diện'),
  })

  const uploadImage = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    uploadImageMutation.mutate(file)
  }

  const submit = (event) => {
    event.preventDefault()
    mutation.mutate({
      id: editing?.id,
      payload: { ...form, is_active: Number(form.is_active) },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Quản lý tác giả</h1>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Thêm tác giả
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            className="input pl-9"
            placeholder="Tìm tên tác giả, tiểu sử..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hiện</option>
          <option value="inactive">Ẩn</option>
        </select>
        <select className="input w-auto" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}>
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="name_asc">Tên A - Z</option>
          <option value="books_desc">Nhiều sách nhất</option>
        </select>
        <button type="button" className="btn btn-outline" onClick={() => refetch()} disabled={isFetching}>
          <FiRefreshCw className={isFetching ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tác giả</th>
                <th>Quốc gia</th>
                <th>Sách</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="text-center py-8">Đang tải...</td></tr>
              ) : authors.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">Chưa có tác giả</td></tr>
              ) : authors.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-14 w-14 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-xs text-gray-400 dark:border-gray-700 dark:bg-gray-800">
                        Không ảnh
                      </div>
                    )}
                  </td>
                  <td>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.name_en || item.slug || '-'}</p>
                  </td>
                  <td>{item.country || '-'}</td>
                  <td className="font-semibold">{Number(item.product_count || 0)}</td>
                  <td>
                    <span className={`badge ${Number(item.is_active ?? 1) ? 'badge-success' : 'badge-gray'}`}>
                      {Number(item.is_active ?? 1) ? 'Hiện' : 'Ẩn'}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button type="button" className="text-primary-500 hover:text-primary-400" onClick={() => openEdit(item)}>
                        <FiEdit2 />
                      </button>
                      <button type="button" className="text-red-500 hover:text-red-400" onClick={() => {
                        if (window.confirm(`Xóa tác giả "${item.name}"?`)) deleteMutation.mutate(item.id)
                      }}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-gray-500">Trang {page} / {totalPages} · {totalItems} tác giả</span>
          <div className="flex items-center gap-2">
            <AdminPagination page={page} totalPages={totalPages} totalItems={totalItems} label="tác giả" onPageChange={setPage} />
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={submit} className="card w-full max-w-2xl shadow-2xl">
            <div className="border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? 'Sửa tác giả' : 'Thêm tác giả'}</h2>
              <button type="button" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={closeForm}>
                <FiX />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">Tên tác giả</span>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Tên tiếng Anh</span>
                <input className="input" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Quốc gia</span>
                <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Trạng thái</span>
                <select className="input" value={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
                  <option value={1}>Hiện</option>
                  <option value={0}>Ẩn</option>
                </select>
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium">Ảnh đại diện URL</span>
                <button type="button" className="btn btn-outline w-fit" onClick={() => imageInputRef.current?.click()} disabled={uploadImageMutation.isPending}>
                  <FiUpload /> Chọn ảnh đại diện
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={uploadImage}
                />
                <input className="input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium">Tiểu sử</span>
                <textarea className="input min-h-28" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </label>
            </div>
            <div className="border-t dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button type="button" className="btn btn-outline" onClick={closeForm}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                {editing ? 'Lưu thay đổi' : 'Thêm tác giả'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Authors
