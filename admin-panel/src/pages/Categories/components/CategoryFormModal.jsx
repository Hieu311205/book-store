import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiChevronDown, FiPlus, FiSave, FiUpload, FiX } from 'react-icons/fi'
import { getParentPreview } from '../utils/categoryHelpers'
import { adminService } from '../../../services/admin.service'

const getVisibleParentOptions = (options, expandedIds) => (
  options.filter((item) => {
    if (!item.parent_id) return true
    let parentId = Number(item.parent_id)
    while (parentId) {
      if (!expandedIds.has(parentId)) return false
      const parent = options.find((category) => Number(category.id) === parentId)
      parentId = parent?.parent_id ? Number(parent.parent_id) : 0
    }
    return true
  })
)

const ParentCategoryPicker = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState(() => new Set())

  const childCountByParent = useMemo(() => (
    options.reduce((map, item) => {
      if (item.parent_id) {
        const parentId = Number(item.parent_id)
        map[parentId] = (map[parentId] || 0) + 1
      }
      return map
    }, {})
  ), [options])

  useEffect(() => {
    const rootWithChildren = options
      .filter((item) => !item.parent_id && childCountByParent[Number(item.id)])
      .map((item) => Number(item.id))
    setExpandedIds(new Set(rootWithChildren))
  }, [options, childCountByParent])

  const selected = options.find((item) => Number(item.id) === Number(value))
  const visibleOptions = getVisibleParentOptions(options, expandedIds)

  const toggleExpanded = (event, id) => {
    event.stopPropagation()
    setExpandedIds((current) => {
      const next = new Set(current)
      const value = Number(id)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const selectValue = (nextValue) => {
    onChange(nextValue)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="input flex items-center justify-between text-left"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{selected ? selected.category_path || selected.name : 'Không có danh mục cha'}</span>
        <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${!value ? 'font-semibold text-primary-600' : ''}`}
            onClick={() => selectValue('')}
          >
            Không có danh mục cha
          </button>

          {visibleOptions.map((item) => {
            const hasChildren = Boolean(childCountByParent[Number(item.id)])
            const expanded = expandedIds.has(Number(item.id))
            const depth = Number(item.level || 1) - 1
            const selectedItem = Number(item.id) === Number(value)

            return (
              <button
                key={item.id}
                type="button"
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedItem ? 'font-semibold text-primary-600' : ''}`}
                style={{ paddingLeft: `${12 + depth * 22}px` }}
                onClick={() => selectValue(String(item.id))}
              >
                {hasChildren ? (
                  <span
                    role="button"
                    tabIndex={-1}
                    className="flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={(event) => toggleExpanded(event, item.id)}
                  >
                    <FiChevronDown size={14} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} />
                  </span>
                ) : (
                  <span className="mx-1 h-px w-3 bg-gray-400" />
                )}
                <span>{item.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const CategoryFormModal = ({
  isOpen,
  editingId,
  form,
  setForm,
  parentOptions,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const iconInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const uploadMutation = useMutation({
    mutationFn: ({ type, file }) => {
      const data = new FormData()
      data.append('image', file)
      return adminService.uploadCatalogImage(type, data)
    },
    onSuccess: (res, variables) => {
      const imageUrl = res.data?.image_url || ''
      if (!imageUrl) return
      setForm((current) => ({ ...current, [variables.field]: imageUrl }))
      toast.success('Đã tải ảnh lên')
    },
    onError: (error) => toast.error(error.message || 'Không thể tải ảnh lên'),
  })

  const uploadFile = (event, type, field) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    uploadMutation.mutate({ type, file, field })
  }

  if (!isOpen) return null

  const preview = getParentPreview(parentOptions, form.parent_id, form.name)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editingId ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <FiX size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Thông tin cơ bản</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">Tên danh mục <span className="text-red-500">*</span></span>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Tên tiếng Anh</span>
                <input className="input" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Danh mục cha</span>
                <ParentCategoryPicker
                  value={form.parent_id}
                  options={parentOptions}
                  onChange={(parentId) => setForm({ ...form, parent_id: parentId })}
                />
                <p className="text-xs text-gray-500">Không cho chọn danh mục cấp 3 làm cha.</p>
                <div className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700 dark:border-primary-900/60 dark:bg-primary-900/20 dark:text-primary-300">
                  <p>Danh mục mới sẽ được tạo ở: Cấp {preview.level}</p>
                  <p className="mt-1">Đường dẫn: {preview.path}</p>
                </div>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Trạng thái</span>
                <select className="input" value={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
                  <option value={1}>Hiện</option>
                  <option value={0}>Ẩn</option>
                </select>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Hiển thị</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">Thứ tự</span>
                <input className="input" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Icon</span>
                <button type="button" className="btn btn-outline w-fit" onClick={() => iconInputRef.current?.click()} disabled={uploadMutation.isPending}>
                  <FiUpload /> Chọn icon
                </button>
                <input
                  ref={iconInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => uploadFile(event, 'category-icon', 'icon')}
                />
                <input className="input" placeholder="/images/categories/icons/icon.jpg" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
              </label>
              <label className="space-y-1 md:col-span-1">
                <span className="text-sm font-medium">Ảnh danh mục URL</span>
                <button type="button" className="btn btn-outline w-fit" onClick={() => imageInputRef.current?.click()} disabled={uploadMutation.isPending}>
                  <FiUpload /> Chọn ảnh danh mục
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => uploadFile(event, 'category', 'image_url')}
                />
                <input className="input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </label>
            </div>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Mô tả</span>
            <textarea className="input min-h-28" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
          <button className="btn btn-primary min-w-32" disabled={isSubmitting}>
            {editingId ? <FiSave /> : <FiPlus />}
            {isSubmitting ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm danh mục'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CategoryFormModal
