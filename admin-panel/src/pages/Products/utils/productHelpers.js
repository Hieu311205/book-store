export const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0)

export const emptyForm = {
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
}

export const numberOrNull = (value) => (
  value === '' || value === null || value === undefined ? null : Number(value)
)

export const buildPayload = (form) => ({
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
})

export const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang bán' },
  { value: 'inactive', label: 'Đã ẩn' },
  { value: 'low_stock', label: 'Sắp hết hàng (< 10)' },
  { value: 'out_of_stock', label: 'Hết hàng' },
]

export const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'name_asc', label: 'Tên A → Z' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'stock_asc', label: 'Tồn kho tăng dần' },
  { value: 'stock_desc', label: 'Tồn kho giảm dần' },
  { value: 'bestseller', label: 'Bán chạy nhất' },
]
