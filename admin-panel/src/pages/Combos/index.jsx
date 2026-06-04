import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiEdit2, FiPercent, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { adminService } from '../../services/admin.service'

const emptyForm = { name: '', description: '', discount_type: 'percentage', discount_value: '', product_ids: [], is_active: 1 }

const ComboFormModal = ({ form, setForm, editingId, onSubmit, onClose, isSaving, products }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{editingId ? 'Sửa combo' : 'Thêm combo mới'}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiX size={18} /></button>
      </div>

      <div className="p-6 space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Tên combo <span className="text-red-500">*</span></span>
          <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: Bộ Harry Potter 7 tập" />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Mô tả</span>
          <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm font-medium">Loại giảm giá</span>
            <select className="input" value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}>
              <option value="percentage">Phần trăm (%)</option>
              <option value="fixed">Số tiền cố định (đ)</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Giá trị giảm</span>
            <input className="input" type="number" min="0" value={form.discount_value}
              onChange={e => setForm({ ...form, discount_value: e.target.value })}
              placeholder={form.discount_type === 'percentage' ? '10 (%)' : '50000 (đ)'} />
          </label>
        </div>

        <div className="space-y-1">
          <span className="text-sm font-medium">Sản phẩm trong bộ</span>
          <p className="text-xs text-gray-400 mb-2">Chọn ít nhất 2 sản phẩm. Khách sẽ được giảm khi mua đủ tất cả.</p>
          <div className="max-h-48 overflow-y-auto border dark:border-gray-700 rounded-lg p-2 space-y-1">
            {products.map(p => (
              <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={form.product_ids.includes(p.id)}
                  onChange={e => {
                    const ids = e.target.checked
                      ? [...form.product_ids, p.id]
                      : form.product_ids.filter(id => id !== p.id)
                    setForm({ ...form, product_ids: ids })
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm flex-1">{p.title}</span>
                <span className="text-xs text-gray-400">{new Intl.NumberFormat('vi-VN').format(p.price)}đ</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400">Đã chọn: {form.product_ids.length} sản phẩm</p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={Boolean(form.is_active)} onChange={e => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} className="w-4 h-4" />
          <span className="text-sm">Kích hoạt (áp dụng ngay)</span>
        </label>
      </div>

      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
        <button onClick={onClose} className="btn btn-secondary">Hủy</button>
        <button onClick={onSubmit} disabled={isSaving} className="btn btn-primary min-w-28">
          {isSaving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm combo'}
        </button>
      </div>
    </div>
  </div>
)

const Combos = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  const { data: combos = [], isLoading } = useQuery({
    queryKey: ['admin-combos'],
    queryFn: adminService.getCombos,
    select: res => res.data || [],
  })

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products-all'],
    queryFn: () => adminService.getProducts({ limit: 200 }),
    select: res => res.data?.products || [],
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-combos'] })

  const createMutation = useMutation({ mutationFn: adminService.createCombo, onSuccess: () => { invalidate(); close_(); toast.success('Đã tạo combo') }, onError: e => toast.error(e.message || 'Lỗi') })
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => adminService.updateCombo(id, data), onSuccess: () => { invalidate(); close_(); toast.success('Đã cập nhật') }, onError: e => toast.error(e.message || 'Lỗi') })
  const deleteMutation = useMutation({ mutationFn: adminService.deleteCombo, onSuccess: () => { invalidate(); toast.success('Đã xóa') }, onError: e => toast.error(e.message || 'Lỗi') })

  const close_ = () => { setIsOpen(false); setEditingId(null); setForm(emptyForm) }

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setIsOpen(true) }

  const openEdit = (combo) => {
    setForm({ name: combo.name, description: combo.description || '', discount_type: combo.discount_type, discount_value: String(combo.discount_value), product_ids: combo.product_ids || [], is_active: combo.is_active })
    setEditingId(combo.id)
    setIsOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên combo')
    if (form.product_ids.length < 2) return toast.error('Combo cần ít nhất 2 sản phẩm')
    const payload = { ...form, discount_value: parseFloat(form.discount_value) || 0 }
    editingId ? updateMutation.mutate({ id: editingId, data: payload }) : createMutation.mutate(payload)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Combo khuyến mãi</h1>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <FiPlus size={16} /> Thêm combo
        </button>
      </div>

      {isOpen && (
        <ComboFormModal
          form={form} setForm={setForm} editingId={editingId}
          onSubmit={handleSubmit} onClose={close_}
          isSaving={isSaving} products={products}
        />
      )}

      {isLoading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : combos.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <FiPercent size={40} className="mx-auto mb-3 opacity-30" />
          <p>Chưa có combo nào. Tạo combo để khuyến khích mua trọn bộ sách.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combos.map(combo => (
            <div key={combo.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{combo.name}</h3>
                  {combo.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{combo.description}</p>}
                </div>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${combo.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {combo.is_active ? 'Đang dùng' : 'Tắt'}
                </span>
              </div>

              <div className="text-sm text-primary-600 font-semibold mb-3">
                Giảm {combo.discount_type === 'percentage' ? `${combo.discount_value}%` : `${new Intl.NumberFormat('vi-VN').format(combo.discount_value)}đ`} khi mua cả bộ
              </div>

              <div className="text-xs text-gray-500 mb-3">
                {combo.product_ids?.length || 0} sản phẩm:&nbsp;
                <span className="text-gray-700 dark:text-gray-300">
                  {(combo.product_titles || []).slice(0, 2).join(', ')}
                  {(combo.product_titles || []).length > 2 ? ` +${combo.product_titles.length - 2} nữa` : ''}
                </span>
              </div>

              <div className="flex gap-2 justify-end">
                <button onClick={() => openEdit(combo)} className="btn btn-outline btn-sm flex items-center gap-1">
                  <FiEdit2 size={13} /> Sửa
                </button>
                <button
                  onClick={() => { if (window.confirm(`Xóa combo "${combo.name}"?`)) deleteMutation.mutate(combo.id) }}
                  className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 flex items-center gap-1"
                >
                  <FiTrash2 size={13} /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Combos
