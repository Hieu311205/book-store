import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiEdit2, FiGlobe, FiPlus, FiRefreshCw, FiSearch, FiTrash2, FiUpload, FiX } from 'react-icons/fi'
import { adminService } from '../../services/admin.service'
import AdminPagination from '../../components/common/AdminPagination'

const LIMIT = 10

const emptyForm = {
  name: '',
  name_en: '',
  website: '',
  email: '',
  phone: '',
  address: '',
  contact_name: '',
  logo_url: '',
  is_active: 1,
}

const Publishers = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const logoInputRef = useRef(null)

  const params = {
    page,
    limit: LIMIT,
    search: search || undefined,
    status: status || undefined,
    sort,
  }

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-publishers', params],
    queryFn: () => adminService.getAdminPublishers(params),
    select: (res) => res.data,
  })

  const publishers = data?.publishers || []
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
      website: item.website || '',
      email: item.email || '',
      phone: item.phone || '',
      address: item.address || '',
      contact_name: item.contact_name || '',
      logo_url: item.logo_url || '',
      is_active: Number(item.is_active ?? 1),
    })
    setEditing(item)
    setIsFormOpen(true)
  }

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => id ? adminService.updatePublisher(id, payload) : adminService.createPublisher(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-publishers'] })
      toast.success(editing ? 'Đã cập nhật nhà xuất bản' : 'Đã thêm nhà xuất bản')
      closeForm()
    },
    onError: (error) => toast.error(error.message || 'Không thể lưu nhà xuất bản'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deletePublisher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-publishers'] })
      toast.success('Đã xóa nhà xuất bản')
    },
    onError: (error) => toast.error(error.message || 'Không thể xóa nhà xuất bản'),
  })

  const uploadLogoMutation = useMutation({
    mutationFn: (file) => {
      const data = new FormData()
      data.append('image', file)
      return adminService.uploadCatalogImage('publisher', data)
    },
    onSuccess: (res) => {
      const imageUrl = res.data?.image_url || ''
      if (!imageUrl) return
      setForm((current) => ({ ...current, logo_url: imageUrl }))
      toast.success('Đã tải logo')
    },
    onError: (error) => toast.error(error.message || 'Không thể tải logo'),
  })

  const uploadLogo = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    uploadLogoMutation.mutate(file)
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
        <h1 className="text-2xl font-bold">Quản lý nhà xuất bản</h1>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Thêm NXB
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            className="input pl-9"
            placeholder="Tìm tên NXB, website..."
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
                <th>Nhà xuất bản</th>
                <th>Liên hệ</th>
                <th>Địa chỉ</th>
                <th>Sách</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-8">Đang tải...</td></tr>
              ) : publishers.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">Chưa có nhà xuất bản</td></tr>
              ) : publishers.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.logo_url ? (
                      <img
                        src={item.logo_url}
                        alt={item.name}
                        className="h-12 w-16 rounded-lg object-contain bg-white p-1 border border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-[10px] text-gray-400 dark:border-gray-700 dark:bg-gray-800">
                        Không ảnh
                      </div>
                    )}
                  </td>
                  <td>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.name_en || item.slug || '-'}</p>
                    {item.website && (
                      <a className="inline-flex items-center gap-1 text-xs text-primary-500 mt-1" href={item.website} target="_blank" rel="noreferrer">
                        <FiGlobe /> Website
                      </a>
                    )}
                  </td>
                  <td>
                    <p>{item.contact_name || '-'}</p>
                    <p className="text-xs text-gray-500">{item.email || item.phone || '-'}</p>
                  </td>
                  <td>
                    <p className="max-w-56 truncate text-sm text-gray-500" title={item.address || ''}>
                      {item.address || '-'}
                    </p>
                  </td>
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
                        if (window.confirm(`Xóa nhà xuất bản "${item.name}"?`)) deleteMutation.mutate(item.id)
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
          <span className="text-sm text-gray-500">Trang {page} / {totalPages} · {totalItems} nhà xuất bản</span>
          <div className="flex items-center gap-2">
            <AdminPagination page={page} totalPages={totalPages} totalItems={totalItems} label="nhà xuất bản" onPageChange={setPage} />
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={submit} className="card w-full max-w-3xl shadow-2xl">
            <div className="border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? 'Sửa nhà xuất bản' : 'Thêm nhà xuất bản'}</h2>
              <button type="button" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={closeForm}>
                <FiX />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">Tên NXB</span>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Tên tiếng Anh</span>
                <input className="input" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Người liên hệ</span>
                <input className="input" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Trạng thái</span>
                <select className="input" value={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
                  <option value={1}>Hiện</option>
                  <option value={0}>Ẩn</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Email</span>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Số điện thoại</span>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium">Website</span>
                <input className="input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium">Logo URL</span>
                <button type="button" className="btn btn-outline w-fit" onClick={() => logoInputRef.current?.click()} disabled={uploadLogoMutation.isPending}>
                  <FiUpload /> Chọn logo
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={uploadLogo}
                />
                <input className="input" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium">Địa chỉ</span>
                <textarea className="input min-h-20" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </label>
            </div>
            <div className="border-t dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button type="button" className="btn btn-outline" onClick={closeForm}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                {editing ? 'Lưu thay đổi' : 'Thêm NXB'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Publishers
