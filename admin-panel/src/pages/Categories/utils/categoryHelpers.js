export const emptyForm = {
  name: '',
  name_en: '',
  parent_id: '',
  description: '',
  image_url: '',
  icon: '',
  sort_order: 0,
  is_active: 1,
}

export const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Hiện' },
  { value: 'inactive', label: 'Ẩn' },
]

export const parentFilterOptions = [
  { value: '', label: 'Tất cả cấp danh mục' },
  { value: 'root', label: 'Danh mục gốc' },
  { value: 'child', label: 'Danh mục con' },
]

export const sortOptions = [
  { value: 'sort_order', label: 'Thứ tự hiển thị' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'name_asc', label: 'Tên A - Z' },
  { value: 'products_desc', label: 'Nhiều sách nhất' },
]

export const LIMIT = 10

export const normalizeCategoryPayload = (form) => ({
  name: form.name.trim(),
  name_en: form.name_en.trim(),
  parent_id: form.parent_id || '',
  description: form.description.trim(),
  image_url: form.image_url.trim(),
  icon: form.icon.trim(),
  sort_order: Number(form.sort_order || 0),
  is_active: Number(form.is_active),
})
