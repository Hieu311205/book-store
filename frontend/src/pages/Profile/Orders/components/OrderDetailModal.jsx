import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { orderService } from '../../../../services/order.service'
import { formatPrice } from '../../../../utils/formatPrice'
import { paymentMethodText } from '../utils/orderStatus'
import { OrderStatusBadge, PaymentStatusText } from './OrderStatusBadge'

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
              <div className="flex justify-between"><span className="text-gray-500">Mã đơn hàng</span><span className="font-semibold">{order.order_number}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Ngày đặt</span><span>{new Date(order.created_at).toLocaleString('vi-VN')}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Trạng thái</span><OrderStatusBadge status={order.status} /></div>
              <div className="flex justify-between"><span className="text-gray-500">Thanh toán</span><PaymentStatusText status={order.payment_status} /></div>
              <div className="flex justify-between"><span className="text-gray-500">Phương thức</span><span>{paymentMethodText[order.payment_method] || order.payment_method}</span></div>
            </div>

            {['shipped', 'delivered'].includes(order.status) && (
              <Link to={`/shipping?order_id=${order.id}`} className="btn btn-outline btn-sm w-full justify-center">
                Theo dõi đơn hàng
              </Link>
            )}

            {order.status === 'cancelled' && order.admin_note && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                <p className="font-semibold">Đơn hàng bị hủy từ shop</p>
                <p>{order.admin_note}</p>
              </div>
            )}

            <div className="border-t dark:border-gray-700 pt-4">
              <p className="font-semibold mb-3 text-sm">Địa chỉ giao hàng</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{order.shipping_name} - {order.shipping_phone}</p>
              <p className="text-sm text-gray-500">{order.shipping_address}, {order.shipping_city}, {order.shipping_province}</p>
            </div>

            <div className="border-t dark:border-gray-700 pt-4">
              <p className="font-semibold mb-3 text-sm">Sản phẩm ({order.items?.length || 0})</p>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center text-sm">
                    {item.product_image && <img src={item.product_image} alt={item.product_title} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product_title}</p>
                      <p className="text-gray-500">{formatPrice(item.price)} đ x {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-right flex-shrink-0">{formatPrice(item.total)} đ</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500"><span>Tạm tính</span><span>{formatPrice(order.subtotal)} đ</span></div>
              <div className="flex justify-between text-gray-500"><span>Vận chuyển</span><span>{formatPrice(order.shipping_cost)} đ</span></div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-green-600"><span>Giảm giá {order.coupon_code && `(${order.coupon_code})`}</span><span>-{formatPrice(order.discount_amount)} đ</span></div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t dark:border-gray-700"><span>Tổng cộng</span><span className="text-primary-600">{formatPrice(order.total_amount)} đ</span></div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">Không tìm thấy đơn hàng</div>
        )}
      </div>
    </div>
  )
}

export default OrderDetailModal
