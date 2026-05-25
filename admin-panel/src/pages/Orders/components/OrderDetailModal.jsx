import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminService } from '../../../services/admin.service'
import {
  formatPrice,
  getCustomerName,
  getOrderStatusOptions,
  isFinalOrderStatus,
  paymentMethodLabels,
  paymentStatusLabels,
  returnStatusLabels,
  returnTypeLabels,
  shippingProviderLabels,
  statusLabels,
} from '../utils/orderStatus'
import OrderStatusBadge from './OrderStatusBadge'

const OrderItems = ({ orderId }) => {
  const queryClient = useQueryClient()
  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order-detail', orderId],
    queryFn: () => adminService.getOrderById(orderId),
    select: (res) => res.data,
    staleTime: 0,
  })

  const updateReturnMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateReturnRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', orderId] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Đã cập nhật yêu cầu đổi trả')
    },
    onError: (error) => toast.error(error.message || 'Không thể cập nhật yêu cầu đổi trả'),
  })

  if (isLoading) return <p className="text-sm text-gray-400">Đang tải...</p>

  return (
    <div className="space-y-4">
      {order?.return_request && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm dark:border-orange-900/40 dark:bg-orange-900/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-orange-700 dark:text-orange-300">Yêu cầu đổi trả</p>
              <p>Loại: {returnTypeLabels[order.return_request.type] || order.return_request.type}</p>
              <p>Lý do: {order.return_request.reason}</p>
              {order.return_request.note && <p>Ghi chú: {order.return_request.note}</p>}
              <p>Trạng thái: {returnStatusLabels[order.return_request.status] || order.return_request.status}</p>
            </div>
            {order.return_request.status === 'pending' && (
              <div className="flex flex-col gap-2">
                <button
                  className="btn btn-primary btn-sm"
                  disabled={updateReturnMutation.isPending}
                  onClick={() => updateReturnMutation.mutate({
                    id: order.return_request.id,
                    data: {
                      status: 'approved',
                      admin_note: order.return_request.type === 'return' ? 'Đã duyệt yêu cầu trả hàng' : 'Đã duyệt đổi hàng',
                    },
                  })}
                >
                  {order.return_request.type === 'return' ? 'Duyệt trả hàng' : 'Duyệt đổi hàng'}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={updateReturnMutation.isPending}
                  onClick={() => updateReturnMutation.mutate({
                    id: order.return_request.id,
                    data: { status: 'rejected', admin_note: 'Yêu cầu không được chấp nhận' },
                  })}
                >
                  Từ chối
                </button>
              </div>
            )}
            {order.return_request.status === 'approved' && (
              <div className="flex flex-col gap-2">
                <button
                  className="btn btn-primary btn-sm"
                  disabled={updateReturnMutation.isPending}
                  onClick={() => updateReturnMutation.mutate({
                    id: order.return_request.id,
                    data: {
                      status: 'completed',
                      admin_note: order.return_request.type === 'return'
                        ? 'Đã nhận hàng trả và hoàn tiền'
                        : 'Đã hoàn tất đổi hàng',
                    },
                  })}
                >
                  {order.return_request.type === 'return' ? 'Hoàn tất hoàn tiền' : 'Hoàn tất đổi hàng'}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={updateReturnMutation.isPending}
                  onClick={() => updateReturnMutation.mutate({
                    id: order.return_request.id,
                    data: { status: 'rejected', admin_note: 'Yêu cầu không được chấp nhận' },
                  })}
                >
                  Từ chối
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {order?.items?.map((item) => (
        <div key={item.id} className="flex items-center gap-3 text-sm">
          {item.product_image && (
            <img src={item.product_image} alt={item.product_title} className="w-10 h-10 object-cover rounded" />
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium">{item.product_title}</p>
            <p className="text-gray-500">{formatPrice(item.price)} đ x {item.quantity}</p>
          </div>
          <p className="font-semibold whitespace-nowrap">{formatPrice(item.total)} đ</p>
        </div>
      ))}
    </div>
  )
}

const OrderDetailModal = ({ order, onClose, onStatusChange, setSelectedOrder }) => {
  if (!order) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4">
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg">{order.order_number}</h3>
            <OrderStatusBadge status={order.status} />
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
            <FiX size={20} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Khách hàng</p>
              <p className="font-medium">{getCustomerName(order)}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Số điện thoại</p>
              <p>{order.shipping_phone || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Email</p>
              <p>{order.email || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Phương thức thanh toán</p>
              <p>{paymentMethodLabels[order.payment_method] || order.payment_method || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Trạng thái thanh toán</p>
              <p>{paymentStatusLabels[order.payment_status] || order.payment_status || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Đơn vị vận chuyển</p>
              <p>{shippingProviderLabels[order.shipping_provider || order.shipping_method] || order.shipping_provider || order.shipping_method || '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 mb-1">Địa chỉ giao hàng</p>
              <p>{order.shipping_address}, {order.shipping_city}, {order.shipping_province}</p>
            </div>
            {order.tracking_code && (
              <div>
                <p className="text-gray-500 mb-1">Mã vận đơn</p>
                <p className="font-mono font-medium">{order.tracking_code}</p>
              </div>
            )}
            {order.coupon_code && (
              <div>
                <p className="text-gray-500 mb-1">Mã giảm giá</p>
                <p>{order.coupon_code} (-{formatPrice(order.discount_amount)} đ)</p>
              </div>
            )}
          </div>

          <div className="border-t dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">Sản phẩm</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Cập nhật trạng thái:</span>
                <select
                  value={order.status}
                  onChange={(e) => {
                    const changed = onStatusChange(order, e.target.value)
                    if (changed) {
                      setSelectedOrder({ ...order, status: e.target.value })
                    }
                  }}
                  className={`text-xs border rounded px-2 py-1 font-medium cursor-pointer ${statusLabels[order.status]?.cls || ''}`}
                  disabled={isFinalOrderStatus(order.status)}
                >
                  {getOrderStatusOptions(order).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <OrderItems orderId={order.id} />
          </div>

          <div className="border-t dark:border-gray-700 pt-4 text-sm space-y-1">
            <div className="flex justify-between text-gray-500">
              <span>Tạm tính</span><span>{formatPrice(order.subtotal)} đ</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Vận chuyển</span><span>{formatPrice(order.shipping_cost)} đ</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá</span><span>-{formatPrice(order.discount_amount)} đ</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t dark:border-gray-700">
              <span>Tổng cộng</span>
              <span className="text-primary-600">{formatPrice(order.total_amount)} đ</span>
            </div>
          </div>

          {order.customer_note && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-sm">
              <p className="text-gray-500 mb-1">Ghi chú</p>
              <p>{order.customer_note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetailModal
