import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { formatPrice } from '../../utils/formatPrice'
import { settingsService } from '../../services/settings.service'
import { orderService } from '../../services/order.service'

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

const getExpiryTime = (payment) => {
  if (payment?.expires_at_unix) return Number(payment.expires_at_unix) * 1000
  if (payment?.expires_at) return new Date(payment.expires_at).getTime()
  return 0
}

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
  const [showQrModal, setShowQrModal] = useState(() => order?.payment_method === 'bank_transfer')
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    return Math.max(0, Math.floor((getExpiryTime(order?.payment) - Date.now()) / 1000))
  })

  const { data: refreshedOrder } = useQuery({
    queryKey: ['order-success', order?.id],
    queryFn: () => orderService.getOrderById(order.id),
    select: (res) => res.data,
    enabled: Boolean(order?.id && order?.payment_method === 'bank_transfer'),
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  })
  const activeOrder = refreshedOrder || order

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

  useEffect(() => {
    if (!getExpiryTime(activeOrder?.payment) || activeOrder.payment_method !== 'bank_transfer') return
    const timer = setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.floor((getExpiryTime(activeOrder.payment) - Date.now()) / 1000)))
    }, 1000)
    return () => clearInterval(timer)
  }, [activeOrder])

  useEffect(() => {
    if (activeOrder?.payment_status && activeOrder.payment_status !== 'pending') {
      setShowQrModal(false)
    }
  }, [activeOrder?.payment_status])

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

        {activeOrder.payment_method === 'bank_transfer' && activeOrder.payment_status === 'pending' && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left text-sm dark:border-blue-700 dark:bg-blue-900/20">
            <p className="font-semibold text-blue-800 dark:text-blue-300">Thanh toán bằng chuyển khoản QR</p>
            <p className="mt-1 text-blue-700 dark:text-blue-300">Đơn hàng sẽ được xử lý sau khi shop xác nhận thanh toán.</p>
            <button type="button" className="btn btn-primary mt-3" onClick={() => setShowQrModal(true)}>Mở mã QR thanh toán</button>
          </div>
        )}

        {activeOrder.payment_method === 'bank_transfer' && activeOrder.payment_status === 'paid' && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-left text-sm dark:border-green-700 dark:bg-green-900/20">
            <p className="font-semibold text-green-800 dark:text-green-300">Đã thanh toán thành công</p>
            <p className="mt-1 text-green-700 dark:text-green-300">Shop đã xác nhận khoản chuyển tiền. Đơn hàng đang được xử lý.</p>
          </div>
        )}

        {activeOrder.payment_method === 'bank_transfer' && ['failed', 'expired'].includes(activeOrder.payment_status) && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm dark:border-red-700 dark:bg-red-900/20">
            <p className="font-semibold text-red-700 dark:text-red-300">Thanh toán không thành công</p>
            <p className="mt-1 text-red-600 dark:text-red-300">Mã QR không còn hiệu lực. Vui lòng tạo đơn mới nếu bạn vẫn muốn mua sách.</p>
          </div>
        )}

        {order.payment_method === 'card' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 text-sm text-left mb-6">
            <p className="font-semibold text-blue-800 dark:text-blue-400 mb-1">Đã thanh toán bằng thẻ test</p>
            <p className="text-blue-700 dark:text-blue-300">
              Cổng thanh toán mô phỏng đã xác nhận giao dịch cho đơn <strong>{order.order_number}</strong>. Thông tin thẻ và CVV không được lưu.
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

      {showQrModal && activeOrder.payment_method === 'bank_transfer' && activeOrder.payment_status === 'pending' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(event) => event.target === event.currentTarget && setShowQrModal(false)}
        >
          <section className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-800">
            <header className="relative border-b border-gray-200 px-5 py-4 text-center dark:border-gray-700">
              <h2 className="font-bold">Mã QR thanh toán</h2>
              <button
                type="button"
                className="absolute right-4 top-3 text-2xl leading-none text-gray-400 hover:text-gray-700 dark:hover:text-white"
                aria-label="Đóng"
                onClick={() => setShowQrModal(false)}
              >
                ×
              </button>
            </header>

            <div className="p-5">
              <div className="rounded-lg border-4 border-blue-100 bg-white p-4 text-gray-700">
                <p className="mb-3 text-center text-xs font-semibold text-gray-500">Mở ứng dụng ngân hàng để quét mã QR</p>
                {shopSettings?.bank_qr_image ? (
                  <img
                    src={shopSettings.bank_qr_image}
                    alt="Mã QR chuyển khoản"
                    className="mx-auto h-52 w-52 object-contain"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center text-center text-sm text-gray-500">
                    Chưa cấu hình ảnh QR trong phần cài đặt.
                  </div>
                )}

                <dl className="mt-4 space-y-2 text-sm">
                  {shopSettings?.bank_name && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Ngân hàng:</dt>
                      <dd className="font-bold">{shopSettings.bank_name}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Số tiền:</dt>
                    <dd className="font-bold">{formatPrice(activeOrder.total_amount)} đ</dd>
                  </div>
                  {shopSettings?.bank_account_name && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Tên chủ TK:</dt>
                      <dd className="text-right font-bold">{shopSettings.bank_account_name}</dd>
                    </div>
                  )}
                  {shopSettings?.bank_account_number && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Số TK:</dt>
                      <dd className="font-mono font-bold">{shopSettings.bank_account_number}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Nội dung CK:</dt>
                    <dd className="font-mono font-bold">{activeOrder.order_number}</dd>
                  </div>
                </dl>
              </div>

              <p className={`mt-4 text-center text-sm font-semibold ${remainingSeconds > 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-600'}`}>
                {remainingSeconds > 0
                  ? `QR hết hạn sau ${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`
                  : 'QR đã hết hạn. Vui lòng tạo đơn mới nếu chưa chuyển khoản.'}
              </p>
              {getExpiryTime(activeOrder.payment) > 0 && (
                <p className="mt-1 text-center text-xs text-gray-500">
                  Thời hạn thanh toán: {new Date(getExpiryTime(activeOrder.payment)).toLocaleString('vi-VN')}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default OrderSuccess
