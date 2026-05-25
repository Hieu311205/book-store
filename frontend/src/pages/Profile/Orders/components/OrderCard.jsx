import { Link } from 'react-router-dom'
import { formatPrice } from '../../../../utils/formatPrice'
import { paymentMethodText, returnStatusText } from '../utils/orderStatus'
import { OrderStatusBadge, PaymentStatusText } from './OrderStatusBadge'

const OrderCard = ({
  order,
  onView,
  onCancel,
  cancelPending,
  onReturn,
  onReview,
}) => (
  <div className="border dark:border-gray-700 rounded-xl p-4 space-y-3 hover:border-primary-400 transition-colors">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <button onClick={() => onView(order.id)} className="font-semibold text-primary-600 hover:underline text-left">
          {order.order_number}
        </button>
        <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
        <p className="text-sm text-gray-500 mt-0.5">{paymentMethodText[order.payment_method] || order.payment_method}</p>
      </div>
      <div className="text-right space-y-1">
        <p className="font-bold text-primary-600">{formatPrice(order.total_amount)} đ</p>
        <OrderStatusBadge status={order.status} />
      </div>
    </div>

    <div className="flex flex-wrap gap-4 text-sm border-t dark:border-gray-700 pt-3">
      <div><span className="text-gray-500">Phí ship: </span><span>{formatPrice(order.shipping_cost)} đ</span></div>
      {Number(order.discount_amount) > 0 && <div className="text-green-600"><span>Giảm: </span><span>-{formatPrice(order.discount_amount)} đ</span></div>}
      <div><span className="text-gray-500">Thanh toán: </span><PaymentStatusText status={order.payment_status} /></div>
    </div>

    <div className="flex flex-wrap gap-4 pt-1">
      <button onClick={() => onView(order.id)} className="text-sm text-primary-600 hover:underline">Xem chi tiết</button>
      {['shipped', 'delivered'].includes(order.status) && (
        <Link to={`/shipping?order_id=${order.id}`} className="text-sm text-primary-600 hover:underline">
          Theo dõi đơn hàng
        </Link>
      )}
      {['pending', 'confirmed'].includes(order.status) && (
        <button onClick={() => onCancel(order.id)} disabled={cancelPending} className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50">Hủy đơn</button>
      )}
      {order.status === 'delivered' && (
        <button onClick={() => onReview(order.id)} className="text-sm text-primary-600 hover:underline font-medium">
          ⭐ Đánh giá
        </button>
      )}
      {order.status === 'delivered' && !['pending', 'approved', 'completed'].includes(order.return_status || '') && (
        <button onClick={() => onReturn(order)} className="text-sm text-orange-600 hover:text-orange-700">Yêu cầu đổi trả</button>
      )}
      {order.return_status && <span className="text-sm text-gray-500">Đổi trả: {returnStatusText[order.return_status] || order.return_status}</span>}
    </div>
    {order.status === 'cancelled' && order.admin_note && (
      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
        <p className="font-semibold">Đơn hàng bị hủy từ shop</p>
        <p>{order.admin_note}</p>
      </div>
    )}
  </div>
)

export default OrderCard
