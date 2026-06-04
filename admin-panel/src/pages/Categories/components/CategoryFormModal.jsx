import { FiPlus, FiSave, FiX } from 'react-icons/fi'

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
  if (!isOpen) return null

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
              <label className="space-y-1">
                <span className="text-sm font-medium">Danh mục cha</span>
                <select className="input" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
                  <option value="">Không có (cấp 1 — gốc)</option>
                  {parentOptions.map((item) => {
                    const depth = item._depth || 0
                    const indent = '──'.repeat(depth) + (depth > 0 ? ' ' : '')
                    return (
                      <option key={item.id} value={item.id}>
                        {indent}{item.name} {item._depth ? `(cấp ${item._depth + 1})` : '(cấp 1)'}
                      </option>
                    )
                  })}
                </select>
                <p className="text-xs text-gray-400 mt-1">Chọn danh mục cha để tạo phân loại sâu hơn (tối đa 3 cấp khuyến nghị)</p>
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
                <input className="input" placeholder="book, star..." value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
              </label>
              <label className="space-y-1 md:col-span-1">
                <span className="text-sm font-medium">Ảnh danh mục URL</span>
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
