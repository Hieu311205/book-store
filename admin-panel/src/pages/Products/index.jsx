import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminService } from '../../services/admin.service'

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0)

const emptyForm = {
  title: '',
  category_id: '',
  author_id: '',
  publisher_id: '',
  price: '',
  compare_price: '',
  stock: 0,
  sku: '',
  isbn: '',
  pages: '',
  publish_year: '',
  language: 'Vietnamese',
  format: 'paperback',
  short_description: '',
  description: '',
  image_url: '',
  is_active: 1,
  is_featured: 0,
  is_bestseller: 0,
}

const numberOrNull = (value) => (value === '' || value === null || value === undefined ? null : Number(value))

const buildPayload = (form) => ({
  ...form,
  category_id: numberOrNull(form.category_id),
  author_id: numberOrNull(form.author_id),
  publisher_id: numberOrNull(form.publisher_id),
  price: Number(form.price || 0),
  compare_price: numberOrNull(form.compare_price),
  stock: Number(form.stock || 0),
  pages: numberOrNull(form.pages),
  publish_year: numberOrNull(form.publish_year),
  is_active: Number(form.is_active),
  is_featured: Number(form.is_featured),
  is_bestseller: Number(form.is_bestseller),
})

const Products = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', { page, search }],
    queryFn: () => adminService.getProducts({ page, limit: 20, search }),
    select: (res) => res.data,
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

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingProduct(null)
    setForm(emptyForm)
  }

  const createMutation = useMutation({
    mutationFn: adminService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      closeForm()
      toast.success('Da them sach')
    },
    onError: (error) => toast.error(error.message || 'Them sach that bai'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      closeForm()
      toast.success('Da cap nhat sach')
    },
    onError: (error) => toast.error(error.message || 'Cap nhat sach that bai'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success('Da xoa sach')
    },
    onError: (error) => toast.error(error.message || 'Xoa that bai'),
  })

  const openCreateForm = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  const openEditForm = (product) => {
    setEditingProduct(product)
    setForm({
      ...emptyForm,
      title: product.title || '',
      category_id: product.category_id || '',
      author_id: product.author_id || '',
      publisher_id: product.publisher_id || '',
      price: product.price || '',
      compare_price: product.compare_price || '',
      stock: product.stock || 0,
      sku: product.sku || '',
      isbn: product.isbn || '',
      pages: product.pages || '',
      publish_year: product.publish_year || '',
      language: product.language || 'Vietnamese',
      format: product.format || 'paperback',
      short_description: product.short_description || '',
      description: product.description || '',
      image_url: product.images?.[0]?.image_url || '',
      is_active: Number(product.is_active ?? 1),
      is_featured: Number(product.is_featured ?? 0),
      is_bestseller: Number(product.is_bestseller ?? 0),
    })
    setIsFormOpen(true)
  }

  const handleDelete = (id, title) => {
    if (window.confirm(`Ban co chac muon xoa "${title}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = buildPayload(form)

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quan ly sach</h1>
        <button onClick={openCreateForm} className="btn btn-primary">
          <FiPlus />
          Them sach
        </button>
      </div>

      <div className="card p-4">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Tim sach..."
              className="input pr-10"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Anh</th>
                <th>Ten sach</th>
                <th>Danh muc</th>
                <th>Gia</th>
                <th>Ton kho</th>
                <th>Trang thai</th>
                <th>Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : data?.products?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Khong co sach
                  </td>
                </tr>
              ) : (
                data?.products?.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="w-12 h-14 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        <img
                          src={product.images?.[0]?.image_url || '/placeholder.jpg'}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td>
                      <p className="font-medium">{product.title}</p>
                      <p className="text-xs text-gray-500">{product.author_name}</p>
                    </td>
                    <td>{product.category_name || '-'}</td>
                    <td>
                      <p>{formatPrice(product.price)} d</p>
                      {Number(product.compare_price) > Number(product.price) && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrice(product.compare_price)}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className={product.stock < 10 ? 'text-red-500' : ''}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {product.is_active ? 'Dang ban' : 'An'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(product)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Sua sach"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.title)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded"
                          title="Xoa sach"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t dark:border-gray-700">
            {Array.from({ length: data.pagination.totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded ${
                  page === i + 1
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSubmit} className="card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between border-b dark:border-gray-700 p-4">
              <h2 className="text-lg font-semibold">{editingProduct ? 'Sua sach' : 'Them sach'}</h2>
              <button type="button" onClick={closeForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <FiX />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">Ten sach *</span>
                <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">Danh muc</span>
                <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Chua chon</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">Tac gia</span>
                <select className="input" value={form.author_id} onChange={(e) => setForm({ ...form, author_id: e.target.value })}>
                  <option value="">Chua chon</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>{author.name}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">Nha xuat ban</span>
                <select className="input" value={form.publisher_id} onChange={(e) => setForm({ ...form, publisher_id: e.target.value })}>
                  <option value="">Chua chon</option>
                  {publishers.map((publisher) => (
                    <option key={publisher.id} value={publisher.id}>{publisher.name}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">Gia *</span>
                <input className="input" type="number" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">Gia so sanh</span>
                <input className="input" type="number" min="0" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">Ton kho</span>
                <input className="input" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">SKU</span>
                <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">ISBN</span>
                <input className="input" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">Link anh bia</span>
                <input className="input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">So trang</span>
                <input className="input" type="number" min="0" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">Nam xuat ban</span>
                <input className="input" type="number" min="0" value={form.publish_year} onChange={(e) => setForm({ ...form, publish_year: e.target.value })} />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">Ngon ngu</span>
                <input className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">Dinh dang</span>
                <select className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                  <option value="paperback">Paperback</option>
                  <option value="hardcover">Hardcover</option>
                  <option value="ebook">Ebook</option>
                </select>
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium">Mo ta ngan</span>
                <input className="input" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium">Mo ta</span>
                <textarea className="input min-h-28" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} />
                  <span>Dang ban</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={Boolean(form.is_featured)} onChange={(e) => setForm({ ...form, is_featured: e.target.checked ? 1 : 0 })} />
                  <span>Noi bat</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={Boolean(form.is_bestseller)} onChange={(e) => setForm({ ...form, is_bestseller: e.target.checked ? 1 : 0 })} />
                  <span>Ban chay</span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 flex justify-end gap-3 border-t dark:border-gray-700 p-4">
              <button type="button" onClick={closeForm} className="btn btn-secondary">Huy</button>
              <button disabled={isSaving} className="btn btn-primary">
                {isSaving ? 'Dang luu...' : editingProduct ? 'Cap nhat' : 'Them sach'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Products
