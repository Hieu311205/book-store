import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiFilter, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminService } from '../../services/admin.service'

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0)

const emptyForm = {
  title: '', category_id: '', author_id: '', publisher_id: '',
  price: '', compare_price: '', stock: 0, sku: '', isbn: '',
  pages: '', publish_year: '', language: 'Vietnamese', format: 'paperback',
  short_description: '', description: '', image_url: '',
  is_active: 1, is_featured: 0, is_bestseller: 0,
}

const numberOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

const buildPayload = (form) => ({
  ...form,
  category_id:   numberOrNull(form.category_id),
  author_id:     numberOrNull(form.author_id),
  publisher_id:  numberOrNull(form.publisher_id),
  price:         Number(form.price || 0),
  compare_price: numberOrNull(form.compare_price),
  stock:         Number(form.stock || 0),
  pages:         numberOrNull(form.pages),
  publish_year:  numberOrNull(form.publish_year),
  is_active:     Number(form.is_active),
  is_featured:   Number(form.is_featured),
  is_bestseller: Number(form.is_bestseller),
})

const statusOptions = [
  { value: '',             label: 'Tất cả trạng thái' },
  { value: 'active',       label: 'Đang bán' },
  { value: 'inactive',     label: 'Đã ẩn' },
  { value: 'low_stock',    label: 'Sắp hết hàng (< 10)' },
  { value: 'out_of_stock', label: 'Hết hàng' },
]

const sortOptions = [
  { value: 'newest',     label: 'Mới nhất' },
  { value: 'oldest',     label: 'Cũ nhất' },
  { value: 'name_asc',   label: 'Tên A → Z' },
  { value: 'price_asc',  label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'stock_asc',  label: 'Tồn kho tăng dần' },
  { value: 'stock_desc', label: 'Tồn kho giảm dần' },
  { value: 'bestseller', label: 'Bán chạy nhất' },
]

const Products = () => {
  const queryClient = useQueryClient()

  // ── Filters ──────────────────────────────────────────────────
  const [search,       setSearch]       = useState('')
  const [category,     setCategory]     = useState('')
  const [author,       setAuthor]       = useState('')
  const [status,       setStatus]       = useState('')
  const [sort,         setSort]         = useState('newest')
  const [priceMin,     setPriceMin]     = useState('')
  const [priceMax,     setPriceMax]     = useState('')
  const [isFeatured,   setIsFeatured]   = useState(false)
  const [isBestseller, setIsBestseller] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [page,         setPage]         = useState(1)

  // ── Form ─────────────────────────────────────────────────────
  const [isFormOpen,     setIsFormOpen]     = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form,           setForm]           = useState(emptyForm)

  const hasFilters = !!(category || author || status || priceMin || priceMax || isFeatured || isBestseller)

  const queryParams = {
    page, limit: 20,
    search:        search || undefined,
    category:      category || undefined,
    author:        author || undefined,
    status:        status || undefined,
    sort,
    price_min:     priceMin || undefined,
    price_max:     priceMax || undefined,
    is_featured:   isFeatured ? 1 : undefined,
    is_bestseller: isBestseller ? 1 : undefined,
  }

  const resetFilters = () => {
    setSearch(''); setCategory(''); setAuthor(''); setStatus('')
    setSort('newest'); setPriceMin(''); setPriceMax('')
    setIsFeatured(false); setIsBestseller(false); setPage(1)
  }

  // ── Queries ──────────────────────────────────────────────────
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-products', queryParams],
    queryFn: () => adminService.getProducts(queryParams),
    select: (res) => res.data,
    staleTime: 0,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminService.getCategories,
    select: (res) => res.data,
  })

  const { data: authors = [] } = useQuery({
    queryKey: ['admin-authors'],
    queryFn: adminService.getAuthors,
    select: (res) => res.data,
  })

  const { data: publishers = [] } = useQuery({
    queryKey: ['admin-publishers'],
    queryFn: adminService.getPublishers,
    select: (res) => res.data,
  })

  // ── Mutations ────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-products'] })

  const createMutation = useMutation({
    mutationFn: adminService.createProduct,
    onSuccess: () => { invalidate(); closeForm(); toast.success('Đã thêm sách') },
    onError: (e) => toast.error(e.message || 'Thêm sách thất bại'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateProduct(id, data),
    onSuccess: () => { invalidate(); closeForm(); toast.success('Đã cập nhật sách') },
    onError: (e) => toast.error(e.message || 'Cập nhật sách thất bại'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteProduct,
    onSuccess: () => { invalidate(); toast.success('Đã xóa sách') },
    onError: (e) => toast.error(e.message || 'Xóa thất bại'),
  })

  // ── Form helpers ─────────────────────────────────────────────
  const closeForm = () => { setIsFormOpen(false); setEditingProduct(null); setForm(emptyForm) }

  const openCreate = () => { setEditingProduct(null); setForm(emptyForm); setIsFormOpen(true) }

  const openEdit = (product) => {
    setEditingProduct(product)
    setForm({
      ...emptyForm,
      title:             product.title || '',
      category_id:       product.category_id || '',
      author_id:         product.author_id || '',
      publisher_id:      product.publisher_id || '',
      price:             product.price || '',
      compare_price:     product.compare_price || '',
      stock:             product.stock || 0,
      sku:               product.sku || '',
      isbn:              product.isbn || '',
      pages:             product.pages || '',
      publish_year:      product.publish_year || '',
      language:          product.language || 'Vietnamese',
      format:            product.format || 'paperback',
      short_description: product.short_description || '',
      description:       product.description || '',
      image_url:         product.images?.[0]?.image_url || '',
      is_active:         Number(product.is_active ?? 1),
      is_featured:       Number(product.is_featured ?? 0),
      is_bestseller:     Number(product.is_bestseller ?? 0),
    })
    setIsFormOpen(true)
  }

  const handleDelete = (id, title) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${title}"?`)) deleteMutation.mutate(id)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = buildPayload(form)
    if (editingProduct) updateMutation.mutate({ id: editingProduct.id, data: payload })
    else createMutation.mutate(payload)
  }

  const isSaving    = createMutation.isPending || updateMutation.isPending
  const totalPages  = data?.pagination?.totalPages || 1

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý sách</h1>
        <button onClick={openCreate} className="btn btn-primary">
          <FiPlus size={16} /> Thêm sách
        </button>
      </div>

      {/* ── Filter card ── */}
      <div className="card p-4 space-y-3">
        {/* Row 1: primary filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tên sách, tác giả, ISBN..."
              className="input pl-9 text-sm"
            />
          </div>

          <select value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className="input w-auto text-sm">
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="input w-auto text-sm">
            {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1) }}
            className="input w-auto text-sm">
            {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <button
            onClick={() => setShowAdvanced((p) => !p)}
            className={`btn text-sm gap-1.5 ${showAdvanced ? 'btn-primary' : 'btn-outline'}`}
          >
            <FiFilter size={14} /> Nâng cao
          </button>

          <button onClick={() => refetch()} disabled={isFetching}
            className="btn btn-outline text-sm gap-1.5">
            <FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Làm mới
          </button>

          {hasFilters && (
            <button onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium">
              <FiX size={14} /> Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Row 2: advanced filters (collapsible) */}
        {showAdvanced && (
          <div className="flex flex-wrap gap-4 items-end pt-3 border-t dark:border-gray-700">
            <div className="flex flex-col gap-1 min-w-40">
              <span className="text-xs font-medium text-gray-500">Tác giả</span>
              <select value={author}
                onChange={(e) => { setAuthor(e.target.value); setPage(1) }}
                className="input text-sm">
                <option value="">Tất cả tác giả</option>
                {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Giá từ (đ)</span>
              <input type="number" min="0" value={priceMin}
                onChange={(e) => { setPriceMin(e.target.value); setPage(1) }}
                placeholder="Tối thiểu" className="input text-sm w-36" />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Giá đến (đ)</span>
              <input type="number" min="0" value={priceMax}
                onChange={(e) => { setPriceMax(e.target.value); setPage(1) }}
                placeholder="Tối đa" className="input text-sm w-36" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none self-end pb-2">
              <input type="checkbox" checked={isFeatured}
                onChange={(e) => { setIsFeatured(e.target.checked); setPage(1) }}
                className="rounded w-4 h-4" />
              <span className="text-sm">Chỉ sách nổi bật</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none self-end pb-2">
              <input type="checkbox" checked={isBestseller}
                onChange={(e) => { setIsBestseller(e.target.checked); setPage(1) }}
                className="rounded w-4 h-4" />
              <span className="text-sm">Chỉ sách bán chạy</span>
            </label>
          </div>
        )}

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-1">
          <span>
            {isFetching
              ? 'Đang tải...'
              : `${data?.pagination?.totalItems ?? 0} sách`}
            {hasFilters && <span className="ml-2 text-primary-600 font-medium">(đang lọc)</span>}
          </span>
          {totalPages > 1 && <span>Trang {page} / {totalPages}</span>}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12">Ảnh</th>
                <th>Tên sách</th>
                <th>Danh mục</th>
                <th className="text-right">Giá bán</th>
                <th className="text-center">Tồn kho</th>
                <th className="text-center">Nhãn</th>
                <th className="text-center w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : !data?.products?.length ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    {hasFilters ? 'Không tìm thấy sách phù hợp với bộ lọc' : 'Chưa có sách nào'}
                  </td>
                </tr>
              ) : data.products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="w-10 h-14 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                      <img src={p.images?.[0]?.image_url || '/placeholder.jpg'} alt=""
                        className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td>
                    <p className="font-medium text-sm leading-snug">{p.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.author_name || '—'}</p>
                    {p.isbn && <p className="text-xs text-gray-400">ISBN: {p.isbn}</p>}
                  </td>
                  <td className="text-sm text-gray-500">{p.category_name || '—'}</td>
                  <td className="text-right">
                    <p className="font-semibold text-sm whitespace-nowrap">{formatPrice(p.price)} đ</p>
                    {Number(p.compare_price) > Number(p.price) && (
                      <p className="text-xs text-gray-400 line-through">{formatPrice(p.compare_price)}</p>
                    )}
                  </td>
                  <td className="text-center">
                    <span className={`text-sm font-semibold ${
                      p.stock === 0 ? 'text-red-500' : p.stock < 10 ? 'text-orange-500' : ''
                    }`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {p.is_active ? 'Đang bán' : 'Ẩn'}
                      </span>
                      {Boolean(p.is_featured)   && <span className="badge badge-info">Nổi bật</span>}
                      {Boolean(p.is_bestseller) && <span className="badge badge-warning">Bán chạy</span>}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(p)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Sửa">
                        <FiEdit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.title)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded"
                        title="Xóa">
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t dark:border-gray-700">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="btn btn-outline btn-sm">Trước</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const n = totalPages <= 7 ? i + 1
                : page <= 4 ? i + 1
                : page >= totalPages - 3 ? totalPages - 6 + i
                : page - 3 + i
              return (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded text-sm font-medium ${
                    page === n ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}>{n}</button>
              )
            })}
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="btn btn-outline btn-sm">Sau</button>
          </div>
        )}
      </div>

      {/* ── Add / Edit modal ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">

            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingProduct ? 'Sửa thông tin sách' : 'Thêm sách mới'}</h2>
              <button type="button" onClick={closeForm}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <FiX size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Thông tin cơ bản */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Thông tin cơ bản</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium">Tên sách <span className="text-red-500">*</span></span>
                    <input className="input" required value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Danh mục</span>
                    <select className="input" value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                      <option value="">Chưa chọn</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Tác giả</span>
                    <select className="input" value={form.author_id}
                      onChange={(e) => setForm({ ...form, author_id: e.target.value })}>
                      <option value="">Chưa chọn</option>
                      {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Nhà xuất bản</span>
                    <select className="input" value={form.publisher_id}
                      onChange={(e) => setForm({ ...form, publisher_id: e.target.value })}>
                      <option value="">Chưa chọn</option>
                      {publishers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Hình thức bìa</span>
                    <select className="input" value={form.format}
                      onChange={(e) => setForm({ ...form, format: e.target.value })}>
                      <option value="paperback">Bìa mềm (Paperback)</option>
                      <option value="hardcover">Bìa cứng (Hardcover)</option>
                      <option value="ebook">Ebook</option>
                    </select>
                  </label>
                </div>
              </section>

              {/* Giá & Kho */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Giá & Tồn kho</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Giá bán <span className="text-red-500">*</span></span>
                    <input className="input" type="number" min="0" required value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Giá gốc</span>
                    <input className="input" type="number" min="0" value={form.compare_price}
                      onChange={(e) => setForm({ ...form, compare_price: e.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Tồn kho</span>
                    <input className="input" type="number" min="0" value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">SKU</span>
                    <input className="input" value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                  </label>
                </div>
              </section>

              {/* Chi tiết sách */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Chi tiết sách</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="space-y-1">
                    <span className="text-sm font-medium">ISBN</span>
                    <input className="input" value={form.isbn}
                      onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Số trang</span>
                    <input className="input" type="number" min="0" value={form.pages}
                      onChange={(e) => setForm({ ...form, pages: e.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Năm xuất bản</span>
                    <input className="input" type="number" min="1900" max="2099" value={form.publish_year}
                      onChange={(e) => setForm({ ...form, publish_year: e.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Ngôn ngữ</span>
                    <input className="input" value={form.language}
                      onChange={(e) => setForm({ ...form, language: e.target.value })} />
                  </label>
                </div>
              </section>

              {/* Ảnh & Mô tả */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Ảnh & Mô tả</p>
                <div className="space-y-4">
                  <label className="space-y-1">
                    <span className="text-sm font-medium">URL ảnh bìa</span>
                    <input className="input" placeholder="https://..." value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Mô tả ngắn</span>
                    <input className="input" value={form.short_description}
                      onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">Mô tả đầy đủ</span>
                    <textarea className="input min-h-28 resize-y" value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </label>
                </div>
              </section>

              {/* Cài đặt hiển thị */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Cài đặt hiển thị</p>
                <div className="flex flex-wrap gap-6">
                  {[
                    { key: 'is_active',     label: 'Đang bán (hiển thị cho khách)' },
                    { key: 'is_featured',   label: 'Sách nổi bật (trang chủ)' },
                    { key: 'is_bestseller', label: 'Sách bán chạy (trang chủ)' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={Boolean(form[key])}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked ? 1 : 0 })}
                        className="w-4 h-4 rounded" />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button type="button" onClick={closeForm} className="btn btn-secondary">Hủy</button>
              <button disabled={isSaving} className="btn btn-primary min-w-28">
                {isSaving ? 'Đang lưu...' : editingProduct ? 'Lưu thay đổi' : 'Thêm sách'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Products