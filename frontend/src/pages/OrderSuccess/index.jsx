import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { formatPrice } from '../../utils/formatPrice'
import { settingsService } from '../../services/settings.service'

const paymentMethodText = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  card: 'Thẻ tín dụng / Thẻ ngân hàng',
  wallet: 'Ví điện tử Book Store',
}

const shippingProviderText = {
  giao_hang_tiet_kiem: 'Giao hàng tiết kiệm',
  ghn: 'GHN',
  viettel_post: 'Viettel Post',
  shop_delivery: 'Shop tự giao',
  standard: 'Tiêu chuẩn',
  express: 'Nhanh',
}

const CONFETTI_COLORS = ['#9f1f1f', '#d6a640', '#316b58', '#ff7a00', '#6366f1', '#ec4899']

const Confetti = () => {
  const [particles] = useState(() =>
    Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.7,
      size: Math.random() * 7 + 5,
      rot: Math.random() * 360,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }))
  )

  return (
    <div className="order-confetti-wrap" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="order-confetti-piece"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.shape === 'circle' ? p.size : p.size * 1.5,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            background: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  )
}

const OrderSuccess = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const order = location.state?.order
  const [showConfetti, setShowConfetti] = useState(true)

  const { data: shopSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: settingsService.getSettings,
    select: (res) => res.data,
    staleTime: 60000,
    enabled: order?.payment_method === 'bank_transfer',
  })

  useEffect(() => {
    if (!order) {
      navigate('/profile/orders', { replace: true })
    }
    const t = setTimeout(() => setShowConfetti(false), 3500)
    return () => clearTimeout(t)
  }, [order, navigate])

  if (!order) return null

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="order-success-card">
        {showConfetti && <Confetti />}

        {/* Animated checkmark */}
        <div className="order-success-icon">
          <svg viewBox="0 0 52 52" fill="none" className="order-success-svg">
            <circle cx="26" cy="26" r="24" stroke="currentColor" strokeWidth="2.5" className="order-success-circle" />
            <path d="M14 26l8 9L38 17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="order-success-check" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-1">Đặt hàng thành công!</h1>
        <p className="text-gray-500 mb-6">Cảm ơn bạn đã mua hàng. Đơn hàng đang được xử lý.</p>

        <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-5 text-left space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Mã đơn hàng</span>
            <span className="font-semibold font-mono">{order.order_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Phương thức thanh toán</span>
            <span>{paymentMethodText[order.payment_method] || order.payment_method}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Vận chuyển</span>
            <span>{shippingProviderText[order.shipping_provider || order.shipping_method] || order.shipping_method}</span>
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
            <p className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Hướng dẫn chuyển khoản</p>
            {(shopSettings?.bank_qr_image || shopSettings?.bank_account_number) && (
              <div className="flex flex-col sm:flex-row gap-4 items-center mb-3">
                {shopSettings?.bank_qr_image && (
                  <img
                    src={shopSettings.bank_qr_image}
                    alt="QR chuyển khoản"
                    className="w-40 h-40 object-contain rounded-lg border border-yellow-300 dark:border-yellow-600 bg-white"
                  />
                )}
                <div className="space-y-1 text-yellow-800 dark:text-yellow-300">
                  {shopSettings?.bank_name && <p>Ngân hàng: <strong>{shopSettings.bank_name}</strong></p>}
                  {shopSettings?.bank_account_number && <p>Số TK: <strong className="font-mono">{shopSettings.bank_account_number}</strong></p>}
                  {shopSettings?.bank_account_name && <p>Chủ TK: <strong>{shopSettings.bank_account_name}</strong></p>}
                  <p>Số tiền: <strong>{formatPrice(order.total_amount)} đ</strong></p>
                  <p>Nội dung CK: <strong className="font-mono">{order.order_number}</strong></p>
                </div>
              </div>
            )}
            <p className="text-yellow-700 dark:text-yellow-300">
              {!shopSettings?.bank_account_number && (
                <>Vui lòng chuyển khoản số tiền <strong>{formatPrice(order.total_amount)} đ</strong> đến tài khoản của shop và ghi nội dung: <strong>{order.order_number}</strong>.<br /></>
              )}
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

        {order.payment_method === 'wallet' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 text-sm text-left mb-6">
            <p className="font-semibold text-green-800 dark:text-green-400 mb-1">Đã thanh toán bằng ví</p>
            <p className="text-green-700 dark:text-green-300">
              Số tiền <strong>{formatPrice(order.total_amount)} đ</strong> đã được trừ từ ví Book Store cho đơn <strong>{order.order_number}</strong>.
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
