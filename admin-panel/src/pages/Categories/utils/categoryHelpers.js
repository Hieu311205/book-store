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
  { value: 'level_2', label: 'Danh mục cấp 2' },
  { value: 'level_3', label: 'Danh mục cấp 3' },
]

export const sortOptions = [
  { value: 'sort_order', label: 'Thứ tự hiển thị' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'name_asc', label: 'Tên A - Z' },
  { value: 'products_desc', label: 'Nhiều sách nhất' },
]

export const LIMIT = 10

export const getCategoryLabel = (category) => category.category_path || category.name

export const flattenCategoryTree = (items = [], parentId = null, depth = 0, parentPath = '') => {
  const children = items
    .filter((item) => {
      const itemParent = item.parent_id === null || item.parent_id === undefined || item.parent_id === '' ? null : Number(item.parent_id)
      return itemParent === parentId
    })
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || String(a.name || '').localeCompare(String(b.name || '')))

  return children.flatMap((item) => {
    const path = parentPath ? `${parentPath} > ${item.name}` : item.name
    const node = {
      ...item,
      depth,
      level: depth + 1,
      category_path: item.category_path || path,
    }
    return [node, ...flattenCategoryTree(items, Number(item.id), depth + 1, path)]
  })
}

export const getDescendantIds = (items = [], categoryId) => {
  const targetId = Number(categoryId)
  const descendants = new Set()
  const collect = (parentId) => {
    items
      .filter((item) => Number(item.parent_id || 0) === Number(parentId))
      .forEach((child) => {
        descendants.add(Number(child.id))
        collect(child.id)
      })
  }
  if (targetId) collect(targetId)
  return descendants
}

export const getValidParentOptions = (items = [], editingId = null) => {
  const blockedIds = new Set()
  if (editingId) {
    blockedIds.add(Number(editingId))
    getDescendantIds(items, editingId).forEach((id) => blockedIds.add(id))
  }
  return flattenCategoryTree(items).filter((item) => Number(item.level || 1) < 3 && !blockedIds.has(Number(item.id)))
}

export const getParentPreview = (items = [], parentId, name = '') => {
  const cleanName = name.trim() || '[Tên danh mục mới]'
  if (!parentId) {
    return {
      level: 1,
      path: cleanName,
    }
  }

  const parent = flattenCategoryTree(items).find((item) => Number(item.id) === Number(parentId))
  if (!parent) {
    return {
      level: 1,
      path: cleanName,
    }
  }

  return {
    level: Math.min(Number(parent.level || 1) + 1, 3),
    path: `${parent.category_path || parent.name} > ${cleanName}`,
  }
}

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
