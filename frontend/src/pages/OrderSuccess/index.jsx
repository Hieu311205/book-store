import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { formatPrice } from '../../utils/formatPrice'

const paymentMethodText = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  card: 'Thẻ tín dụng / Thẻ ngân hàng',
}

const OrderSuccess = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const order = location.state?.order

  useEffect(() => {
    if (!order) {
      navigate('/profile/orders', { replace: true })
    }
  }, [order, navigate])

  if (!order) return null

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-1">Đặt hàng thành công!</h1>
        <p className="text-gray-500 mb-6">Cảm ơn bạn đã mua hàng. Đơn hàng đang được xử lý.</p>

        <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-5 text-left space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Mã đơn hàng</span>
            <span className="font-semibold">{order.order_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Phương thức thanh toán</span>
            <span>{paymentMethodText[order.payment_method] || order.payment_method}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Vận chuyển</span>
            <span>{order.shipping_method === 'express' ? 'Nhanh' : 'Tiêu chuẩn'}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Giảm giá ({order.coupon_code})</span>
              <span>-{formatPrice(order.discount_amount)} đ</span>
            </div>
          )}
          <div className="border-t dark:border-gray-600 pt-3 flex justify-between font-bold">
            <span>Tổng thanh toán</span>
            <span className="text-primary-600 text-lg">{formatPrice(order.total_amount)} đ</span>
          </div>
        </div>

        {order.payment_method === 'bank_transfer' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-sm text-left mb-6">
            <p className="font-semibold text-yellow-800 dark:text-yellow-400 mb-1">Hướng dẫn chuyển khoản</p>
            <p className="text-yellow-700 dark:text-yellow-300">
              Vui lòng chuyển khoản số tiền <strong>{formatPrice(order.total_amount)} đ</strong> đến tài khoản của shop và ghi nội dung: <strong>{order.order_number}</strong>.
              Đơn hàng sẽ được xử lý sau khi chúng tôi xác nhận thanh toán.
            </p>
          </div>
        )}

        {order.payment_method === 'card' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 text-sm text-left mb-6">
            <p className="font-semibold text-blue-800 dark:text-blue-400 mb-1">Thanh toán thẻ</p>
            <p className="text-blue-700 dark:text-blue-300">
              Bộ phận hỗ trợ sẽ liên hệ với bạn để hướng dẫn thanh toán qua thẻ cho đơn <strong>{order.order_number}</strong>.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Link to="/profile/orders" className="btn btn-primary flex-1">
            Xem đơn hàng
          </Link>
          <Link to="/products" className="btn btn-outline flex-1">
            Tiếp tục mua
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccess