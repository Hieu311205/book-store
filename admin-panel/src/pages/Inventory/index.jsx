import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FiAlertCircle, FiCheckSquare, FiDownload, FiPlus, FiRefreshCw, FiSave, FiSearch
} from 'react-icons/fi'
import { adminService } from '../../services/admin.service'

// ── Import modal: nhập hàng nhiều sản phẩm ────────────────────────────────
const ImportModal = ({ onClose, onSuccess }) => {
  const [note, setNote] = useState('')
  const [rows, setRows] = useState([{ product_id: '', quantity: 1, title: '' }])
  const [importing, setImporting] = useState(false)

  const { data: allProducts = [] } = useQuery({
    queryKey: ['admin-products-all'],
    queryFn: () => adminService.getProducts({ limit: 200 }),
    select: res => res.data?.products || [],
  })

  const addRow = () => setRows(r => [...r, { product_id: '', quantity: 1, title: '' }])
  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i))
  const updateRow = (i, field, val) => setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row))

  const handleProductChange = (i, pid) => {
    const p = allProducts.find(p => p.id === +pid)
    updateRow(i, 'product_id', pid)
    if (p) updateRow(i, 'title', p.title)
  }

  const handleSubmit = async () => {
    const items = rows.filter(r => r.product_id && r.quantity > 0).map(r => ({ product_id: +r.product_id, quantity: +r.quantity }))
    if (!items.length) return toast.error('Chưa có sản phẩm nào')
    setImporting(true)
    try {
      await adminService.importStock({ items, note })
      toast.success(`Đã nhập hàng cho ${items.length} sản phẩm`)
      onSuccess()
      onClose()
    } catch (e) {
      toast.error(e.message || 'Lỗi nhập hàng')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nhập hàng vào kho</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Ghi chú (nhà cung cấp, số hóa đơn...)</span>
            <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="VD: Nhập từ NXB Kim Đồng, HĐ #12345" />
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium">Danh sách sản phẩm nhập</p>
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_32px] gap-2 items-center">
                <select
                  className="input text-sm"
                  value={row.product_id}
                  onChange={e => handleProductChange(i, e.target.value)}
                >
                  <option value="">-- Chọn sách --</option>
                  {allProducts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <input
                  className="input text-sm text-center"
                  type="number" min="1"
                  value={row.quantity}
                  onChange={e => updateRow(i, 'quantity', e.target.value)}
                  placeholder="SL"
                />
                <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
              </div>
            ))}
            <button onClick={addRow} className="btn btn-outline btn-sm flex items-center gap-1 mt-2">
              <FiPlus size={13} /> Thêm dòng
            </button>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">Hủy</button>
          <button onClick={handleSubmit} disabled={importing} className="btn btn-primary min-w-32 flex items-center gap-2">
            <FiDownload size={14} /> {importing ? 'Đang nhập...' : 'Xác nhận nhập hàng'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Inventory page ───────────────────────────────────────────────────────
const Inventory = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [editedStock, setEditedStock] = useState({}) // { productId: newStock }
  const [showImport, setShowImport] = useState(false)

  const queryKey = ['admin-inventory', search, lowOnly, page]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => adminService.getInventory({ search, low_stock: lowOnly ? 1 : undefined, page, limit: 50 }),
    select: res => res.data,
  })

  const bulkMutation = useMutation({
    mutationFn: adminService.bulkUpdateStock,
    onSuccess: (_, items) => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] })
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      setEditedStock({})
      toast.success(`Đã lưu ${items.length} sản phẩm`)
    },
    onError: e => toast.error(e.message || 'Lỗi cập nhật'),
  })

  const products = data?.products || []
  const pagination = data?.pagination
  const changedCount = Object.keys(editedStock).length

  const handleSave = () => {
    const items = Object.entries(editedStock).map(([id, stock]) => ({ product_id: +id, stock: +stock }))
    if (!items.length) return toast.error('Chưa có thay đổi nào')
    bulkMutation.mutate(items)
  }

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-inventory'] })
    queryClient.invalidateQueries({ queryKey: ['admin-products'] })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý kho</h1>
        <div className="flex gap-2">
          {changedCount > 0 && (
            <button onClick={handleSave} disabled={bulkMutation.isPending} className="btn btn-primary flex items-center gap-2">
              <FiSave size={15} /> Lưu {changedCount} thay đổi
            </button>
          )}
          <button onClick={() => setShowImport(true)} className="btn btn-secondary flex items-center gap-2">
            <FiDownload size={15} /> Nhập hàng
          </button>
        </div>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} onSuccess={handleImportSuccess} />}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-48">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input className="input pl-9 py-2 text-sm" placeholder="Tìm theo tên, SKU, ISBN..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={lowOnly} onChange={e => { setLowOnly(e.target.checked); setPage(1) }} className="w-4 h-4" />
          <FiAlertCircle size={14} className="text-red-500" />
          Chỉ sắp hết hàng (&lt;10)
        </label>
        {changedCount > 0 && (
          <button onClick={() => setEditedStock({})} className="btn btn-outline btn-sm flex items-center gap-1 text-gray-500">
            <FiRefreshCw size={13} /> Huỷ thay đổi
          </button>
        )}
      </div>

      {/* Bulk save hint */}
      {changedCount > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <FiCheckSquare size={15} />
          Đã chỉnh {changedCount} sản phẩm. Nhấn <strong className="mx-1">Lưu thay đổi</strong> để áp dụng.
        </div>
      )}

      {/* Table */}
      <div className="card">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Không có sản phẩm nào</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>SKU / ISBN</th>
                  <th>Danh mục</th>
                  <th className="text-center w-40">Tồn kho hiện tại</th>
                  <th className="text-center w-40">Điều chỉnh</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const currentStock = p.stock
                  const edited = editedStock[p.id]
                  const displayStock = edited !== undefined ? edited : currentStock
                  const isChanged = edited !== undefined && +edited !== currentStock
                  return (
                    <tr key={p.id} className={isChanged ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}>
                      <td>
                        <div className="flex items-center gap-2">
                          {p.image_url && <img src={p.image_url} alt="" className="w-8 h-10 object-cover rounded" />}
                          <span className="font-medium text-sm line-clamp-2 max-w-[200px]">{p.title}</span>
                        </div>
                      </td>
                      <td className="text-xs text-gray-500">
                        {p.sku && <div>SKU: {p.sku}</div>}
                        {p.isbn && <div>ISBN: {p.isbn}</div>}
                      </td>
                      <td className="text-sm text-gray-500">{p.category_name || '—'}</td>
                      <td className="text-center">
                        <span className={`font-semibold ${currentStock === 0 ? 'text-red-500' : currentStock < 10 ? 'text-orange-500' : 'text-green-600'}`}>
                          {currentStock}
                        </span>
                        {currentStock === 0 && <span className="ml-1 text-xs text-red-400">Hết hàng</span>}
                        {currentStock > 0 && currentStock < 10 && <span className="ml-1 text-xs text-orange-400">Sắp hết</span>}
                      </td>
                      <td className="text-center">
                        <input
                          type="number" min="0"
                          value={displayStock}
                          onChange={e => setEditedStock(prev => ({ ...prev, [p.id]: e.target.value }))}
                          className={`w-24 text-center border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 ${isChanged ? 'border-blue-400 ring-1 ring-blue-300' : 'border-gray-300 dark:border-gray-600'}`}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 flex items-center justify-between border-t dark:border-gray-700 text-sm">
            <span className="text-gray-500">Tổng {pagination.totalItems} sản phẩm</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-outline btn-sm">Trước</button>
              <span className="px-3 py-1">{page}/{pagination.totalPages}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-outline btn-sm">Tiếp</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Inventory
