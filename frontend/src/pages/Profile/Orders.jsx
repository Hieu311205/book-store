import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { orderService } from '../../services/order.service'
import { formatPrice } from '../../utils/formatPrice'

// Đồng bộ với admin-panel/src/pages/Orders/index.jsx — statusLabels
const statusLabels = {
  pending:    { label: 'Chờ xử lý',    cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  paid:       { label: 'Đã thanh toán', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  processing: { label: 'Đang xử lý',   cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  shipped:    { label: 'Đang giao',     cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  delivered:  { label: 'Đã giao',      cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled:  { label: 'Đã hủy',       cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  refunded:   { label: 'Đã hoàn tiền', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
}

const StatusBadge = ({ status }) => {
  const s = statusLabels[status]
  if (!s) return <span className="text-gray-400 text-xs">{status}</span>
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  )
}

const paymentStatusLabels = {
  pending:  { label: 'Chờ thanh toán', cls: 'text-yellow-600' },
  paid:     { label: 'Đã thanh toán',  cls: 'text-green-600 font-semibold' },
  failed:   { label: 'Thất bại',       cls: 'text-red-600' },
  refunded: { label: 'Đã hoàn tiền',   cls: 'text-gray-500' },
}

const PaymentStatusText = ({ status }) => {
  const s = paymentStatusLabels[status]
  return <span className={s?.cls || 'text-gray-500'}>{s?.label || status}</span>
}

const paymentMethodText = {
  cod:          'COD (tiền mặt khi nhận)',
  bank_transfer:'Chuyển khoản ngân hàng',
  card:         'Thẻ tín dụng/ghi nợ',
}

const OrderDetailModal = ({ orderId, onClose }) => {
  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    select: (res) => res.data,
    staleTime: 0,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 pt-5 pb-3 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-lg">Chi tiết đơn hàng</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : order ? (
          <div className="p-6 space-y-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã đơn hàng</span>
                <span className="font-semibold">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày đặt</span>
                <span>{new Date(order.created_at).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Trạng thái</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thanh toán</span>
                <PaymentStatusText status={order.payment_status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phương thức</span>
                <span>{paymentMethodText[order.payment_method] || order.payment_method}</span>
              </div>
              {order.tracking_code && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Mã vận đơn</span>
                  <span className="font-mono font-medium">{order.tracking_code}</span>
                </div>
              )}
            </div>

            <div className="border-t dark:border-gray-700 pt-4">
              <p className="font-semibold mb-3 text-sm">Địa chỉ giao hàng</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {order.shipping_name} — {order.shipping_phone}
              </p>
              <p className="text-sm text-gray-500">{order.shipping_address}, {order.shipping_city}, {order.shipping_province}</p>
            </div>

            <div className="border-t dark:border-gray-700 pt-4">
              <p className="font-semibold mb-3 text-sm">Sản phẩm ({order.items?.length || 0})</p>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center text-sm">
                    {item.product_image && (
                      <img src={item.product_image} alt={item.product_title} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product_title}</p>
                      <p className="text-gray-500">{formatPrice(item.price)} đ × {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-right flex-shrink-0">{formatPrice(item.total)} đ</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Tạm tính</span><span>{formatPrice(order.subtotal)} đ</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Vận chuyển</span><span>{formatPrice(order.shipping_cost)} đ</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá {order.coupon_code && `(${order.coupon_code})`}</span>
                  <span>-{formatPrice(order.discount_amount)} đ</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t dark:border-gray-700">
                <span>Tổng cộng</span>
                <span className="text-primary-600">{formatPrice(order.total_amount)} đ</span>
              </div>
            </div>

            {order.customer_note && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-sm">
                <span className="text-gray-500">Ghi chú: </span>{order.customer_note}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">Không tìm thấy đơn hàng</div>
        )}
      </div>
    </div>
  )
}

const ProfileOrders = () => {
  const queryClient = useQueryClient()
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderService.getOrders({ page: 1, limit: 50 }),
    select: (res) => res.data,
    staleTime: 0,
  })

  const cancelMutation = useMutation({
    mutationFn: orderService.cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      toast.success('Đã hủy đơn hàng')
    },
    onError: (error) => toast.error(error.message || 'Không thể hủy đơn hàng'),
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Đơn hàng của tôi</h2>

      {isLoading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : data?.orders?.length ? (
        <div className="space-y-4">
          {data.orders.map((order) => (
            <div key={order.id} className="border dark:border-gray-700 rounded-xl p-4 space-y-3 hover:border-primary-400 transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <button
                    onClick={() => setSelectedOrderId(order.id)}
                    className="font-semibold text-primary-600 hover:underline text-left"
                  >
                    {order.order_number}
                  </button>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {paymentMethodText[order.payment_method] || order.payment_method}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-primary-600">{formatPrice(order.total_amount)} đ</p>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm border-t dark:border-gray-700 pt-3">
                <div>
                  <span className="text-gray-500">Phí ship: </span>
                  <span>{formatPrice(order.shipping_cost)} đ</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="text-green-600">
                    <span>Giảm: </span>
                    <span>-{formatPrice(order.discount_amount)} đ</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Thanh toán: </span>
                  <PaymentStatusText status={order.payment_status} />
                </div>
                {order.tracking_code && (
                  <div>
                    <span className="text-gray-500">Vận đơn: </span>
                    <span className="font-mono font-medium">{order.tracking_code}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-1">
                <button
                  onClick={() => setSelectedOrderId(order.id)}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Xem chi tiết
                </button>
                {['pending', 'paid'].includes(order.status) && (
                  <button
                    onClick={() => cancelMutation.mutate(order.id)}
                    disabled={cancelMutation.isPending}
                    className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50"
                  >
                    Hủy đơn
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <p className="mb-3">Bạn chưa có đơn hàng nào.</p>
          <a href="/products" className="btn btn-primary btn-sm">Mua sắm ngay</a>
        </div>
      )}

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  )
}

export default ProfileOrders
