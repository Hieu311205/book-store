import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiArrowLeft } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminService } from '../../services/admin.service'

const ProductForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    title: '',
    title_en: '',
    description: '',
    short_description: '',
    isbn: '',
    price: '',
    compare_price: '',
    discount_percent: 0,
    stock: '',
    category_id: '',
    author_id: '',
    publisher_id: '',
    pages: '',
    publish_year: new Date().getFullYear(),
    language: 'Vietnamese',
    translator: '',
    edition: '',
    format: 'paperback',
    sku: '',
    weight: '',
    meta_title: '',
    meta_description: '',
    is_active: 1,
    is_featured: 0,
    is_bestseller: 0,
  })

  // Fetch product data if editing
  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminService.getProduct?.(id) || Promise.resolve({ data: null }),
    enabled: isEditing,
    select: (res) => res.data,
  })

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => adminService.getCategories(),
    select: (res) => res.data || [],
  })

  // Fetch authors
  const { data: authorsData } = useQuery({
    queryKey: ['authors'],
    queryFn: () => adminService.getAuthors(),
    select: (res) => res.data || [],
  })

  // Fetch publishers
  const { data: publishersData } = useQuery({
    queryKey: ['publishers'],
    queryFn: () => adminService.getPublishers(),
    select: (res) => res.data || [],
  })

  // Populate form with product data when editing
  useEffect(() => {
    if (productData) {
      setFormData(productData)
    }
  }, [productData])

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing
        ? adminService.updateProduct(id, data)
        : adminService.createProduct(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-products'])
      toast.success(isEditing ? 'Cập nhật sách thành công' : 'Thêm sách thành công')
      navigate('/products')
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra'
      toast.error(message)
    },
  })

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value === '' ? '' : isNaN(value) ? value : Number(value),
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title || !formData.price || !formData.stock || !formData.category_id) {
      toast.error('Vui lòng điền các trường bắt buộc')
      return
    }

    mutation.mutate(formData)
  }

  if (isEditing && isLoadingProduct) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/products')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Chỉnh sửa sách' : 'Thêm sách mới'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin cơ bản */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Tên sách tiếng Việt"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tiêu đề (Anh)</label>
              <input
                type="text"
                name="title_en"
                value={formData.title_en}
                onChange={handleChange}
                placeholder="English title"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ISBN</label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                placeholder="978-3-16-148410"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="SKU001"
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
              <textarea
                name="short_description"
                value={formData.short_description}
                onChange={handleChange}
                placeholder="Mô tả ngắn (tối đa 500 ký tự)"
                className="input"
                maxLength={500}
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Mô tả chi tiết</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả chi tiết về sách"
                className="input"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Chi tiết sách */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Chi tiết sách</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Danh mục *</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">-- Chọn danh mục --</option>
                {categoriesData?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tác giả</label>
              <select
                name="author_id"
                value={formData.author_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">-- Không chọn --</option>
                {authorsData?.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nhà xuất bản</label>
              <select
                name="publisher_id"
                value={formData.publisher_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">-- Không chọn --</option>
                {publishersData?.map((publisher) => (
                  <option key={publisher.id} value={publisher.id}>
                    {publisher.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số trang</label>
              <input
                type="number"
                name="pages"
                value={formData.pages}
                onChange={handleChange}
                placeholder="256"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Năm xuất bản</label>
              <input
                type="number"
                name="publish_year"
                value={formData.publish_year}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngôn ngữ</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="input"
              >
                <option value="Vietnamese">Tiếng Việt</option>
                <option value="English">English</option>
                <option value="Chinese">中文</option>
                <option value="French">Français</option>
                <option value="German">Deutsch</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dịch giả</label>
              <input
                type="text"
                name="translator"
                value={formData.translator}
                onChange={handleChange}
                placeholder="Tên dịch giả"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phiên bản</label>
              <input
                type="text"
                name="edition"
                value={formData.edition}
                onChange={handleChange}
                placeholder="Lần thứ 1"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Định dạng</label>
              <select
                name="format"
                value={formData.format}
                onChange={handleChange}
                className="input"
              >
                <option value="paperback">Bìa mềm</option>
                <option value="hardcover">Bìa cứng</option>
                <option value="ebook">E-book</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cân nặng (gram)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="250"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Giá & Kho */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Giá & Kho</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Giá gốc (VND) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="99000"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giá so sánh (VND)</label>
              <input
                type="number"
                name="compare_price"
                value={formData.compare_price}
                onChange={handleChange}
                placeholder="129000"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Chiết khấu (%)</label>
              <input
                type="number"
                name="discount_percent"
                value={formData.discount_percent}
                onChange={handleChange}
                min="0"
                max="100"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số lượng kho *</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="100"
                className="input"
                required
              />
            </div>
          </div>
        </div>

        {/* SEO & Trạng thái */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">SEO & Trạng thái</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Meta Title</label>
              <input
                type="text"
                name="meta_title"
                value={formData.meta_title}
                onChange={handleChange}
                placeholder="Tiêu đề SEO"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Meta Description</label>
              <textarea
                name="meta_description"
                value={formData.meta_description}
                onChange={handleChange}
                placeholder="Mô tả cho SEO"
                className="input"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-sm">Hiển thị sách</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-sm">Sách nổi bật</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_bestseller"
                  checked={formData.is_bestseller}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-sm">Bestseller</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn btn-primary"
          >
            {mutation.isPending
              ? 'Đang lưu...'
              : isEditing
              ? 'Cập nhật sách'
              : 'Thêm sách'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="btn btn-secondary"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductForm
