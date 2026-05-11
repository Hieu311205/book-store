import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiEye, FiTruck, FiX, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminService } from '../../services/admin.service'

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price)

export const statusOptions = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
]

export const statusLabels = {
  pending:    { label: 'Chờ xử lý',    cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  paid:       { label: 'Đã thanh toán', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  processing: { label: 'Đang xử lý',   cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  shipped:    { label: 'Đang giao',     cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  delivered:  { label: 'Đã giao',      cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled:  { label: 'Đã hủy',       cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  refunded:   { label: 'Đã hoàn tiền', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
}

export const StatusBadge = ({ status }) => {
  const s = statusLabels[status]
  if (!s) return <span className="text-gray-400 text-xs">{status}</span>
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  )
}

const paymentMethodLabels = {
  cod: 'COD',
  bank_transfer: 'Chuyển khoản',
  card: 'Thẻ',
}

const Orders = () => {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [trackingCode, setTrackingCode] = useState('')

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-orders', { page, status }],
    queryFn: () => adminService.getOrders({ page, limit: 20, status: status || undefined }),
    select: (res) => res.data,
    staleTime: 0,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    queryClient.invalidateQueries({ queryKey: ['recent-orders'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  }

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => adminService.updateOrderStatus(id, { status }),
    onSuccess: () => {
      invalidateAll()
      toast.success('Đã cập nhật trạng thái')
    },
    onError: (error) => toast.error(error.message || 'Có lỗi xảy ra'),
  })

  const addTrackingMutation = useMutation({
    mutationFn: ({ id, tracking_code }) => adminService.addTrackingCode(id, { tracking_code }),
    onSuccess: () => {
      invalidateAll()
      toast.success('Đã cập nhật mã vận đơn')
      setTrackingOrder(null)
      setTrackingCode('')
    },
    onError: (error) => toast.error(error.message || 'Có lỗi xảy ra'),
  })

  const customerName = (order) =>
    order.first_name || order.last_name
      ? `${order.first_name || ''} ${order.last_name || ''}`.trim()
      : order.shipping_name || '—'

  const totalPages = data?.pagination?.totalPages || 1

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>

      <div className="card p-4 flex gap-4 flex-wrap items-center justify-between">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="input w-auto"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Tổng: {data?.pagination?.totalItems ?? 0} đơn
          </span>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-sm btn btn-outline"
          >
            <FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : !data?.orders?.length ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Không có đơn hàng
                  </td>
                </tr>
              ) : (
                data.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">{order.order_number}</td>
                    <td>
                      <p>{customerName(order)}</p>
                      <p className="text-xs text-gray-500">{order.email || order.shipping_phone}</p>
                    </td>
                    <td className="font-medium">{formatPrice(order.total_amount)} đ</td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatusMutation.mutate({ id: order.id, status: e.target.value })}
                        className={`text-xs border rounded px-2 py-1 font-medium cursor-pointer ${statusLabels[order.status]?.cls || ''}`}
                      >
                        {statusOptions.slice(1).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Xem chi tiết"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => { setTrackingOrder(order); setTrackingCode(order.tracking_code || '') }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Mã vận đơn"
                        >
                          <FiTruck size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn btn-outline btn-sm">Trước</button>
            <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn btn-outline btn-sm">Sau</button>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg">{selectedOrder.order_number}</h3>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700 p-1">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Khách hàng</p>
                  <p className="font-medium">{customerName(selectedOrder)}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Số điện thoại</p>
                  <p>{selectedOrder.shipping_phone || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Email</p>
                  <p>{selectedOrder.email || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Phương thức thanh toán</p>
                  <p>{paymentMethodLabels[selectedOrder.payment_method] || selectedOrder.payment_method || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 mb-1">Địa chỉ giao hàng</p>
                  <p>{selectedOrder.shipping_address}, {selectedOrder.shipping_city}, {selectedOrder.shipping_province}</p>
                </div>
                {selectedOrder.tracking_code && (
                  <div>
                    <p className="text-gray-500 mb-1">Mã vận đơn</p>
                    <p className="font-mono font-medium">{selectedOrder.tracking_code}</p>
                  </div>
                )}
                {selectedOrder.coupon_code && (
                  <div>
                    <p className="text-gray-500 mb-1">Mã giảm giá</p>
                    <p>{selectedOrder.coupon_code} (-{formatPrice(selectedOrder.discount_amount)} đ)</p>
                  </div>
                )}
              </div>

              <div className="border-t dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold">Sản phẩm</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Cập nhật trạng thái:</span>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        updateStatusMutation.mutate({ id: selectedOrder.id, status: e.target.value })
                        setSelectedOrder({ ...selectedOrder, status: e.target.value })
                      }}
                      className={`text-xs border rounded px-2 py-1 font-medium cursor-pointer ${statusLabels[selectedOrder.status]?.cls || ''}`}
                    >
                      {statusOptions.slice(1).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <OrderItems orderId={selectedOrder.id} />
              </div>

              <div className="border-t dark:border-gray-700 pt-4 text-sm space-y-1">
                <div className="flex justify-between text-gray-500">
                  <span>Tạm tính</span><span>{formatPrice(selectedOrder.subtotal)} đ</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Vận chuyển</span><span>{formatPrice(selectedOrder.shipping_cost)} đ</span>
                </div>
                {Number(selectedOrder.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span><span>-{formatPrice(selectedOrder.discount_amount)} đ</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t dark:border-gray-700">
                  <span>Tổng cộng</span>
                  <span className="text-primary-600">{formatPrice(selectedOrder.total_amount)} đ</span>
                </div>
              </div>

              {selectedOrder.customer_note && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-sm">
                  <p className="text-gray-500 mb-1">Ghi chú</p>
                  <p>{selectedOrder.customer_note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tracking code modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md m-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Mã vận đơn — {trackingOrder.order_number}</h3>
              <button onClick={() => setTrackingOrder(null)} className="text-gray-500 hover:text-gray-700 p-1">
                <FiX size={20} />
              </button>
            </div>
            <input
              className="input w-full mb-4"
              placeholder="Nhập mã vận đơn"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setTrackingOrder(null)} className="btn btn-outline">Hủy</button>
              <button
                onClick={() => addTrackingMutation.mutate({ id: trackingOrder.id, tracking_code: trackingCode })}
                disabled={addTrackingMutation.isPending}
                className="btn btn-primary"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const OrderItems = ({ orderId }) => {
  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order-detail', orderId],
    queryFn: () => adminService.getOrderById(orderId),
    select: (res) => res.data,
    staleTime: 0,
  })

  if (isLoading) return <p className="text-sm text-gray-400">Đang tải...</p>

  return (
    <div className="space-y-2">
      {order?.items?.map((item) => (
        <div key={item.id} className="flex items-center gap-3 text-sm">
          {item.product_image && (
            <img src={item.product_image} alt={item.product_title} className="w-10 h-10 object-cover rounded" />
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium">{item.product_title}</p>
            <p className="text-gray-500">{formatPrice(item.price)} đ × {item.quantity}</p>
          </div>
          <p className="font-semibold whitespace-nowrap">{formatPrice(item.total)} đ</p>
        </div>
      ))}
    </div>
  )
}

export default Orders