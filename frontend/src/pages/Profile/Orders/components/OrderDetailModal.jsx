import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { orderService } from '../../../../services/order.service'
import { settingsService } from '../../../../services/settings.service'
import { formatPrice } from '../../../../utils/formatPrice'
import { paymentMethodText } from '../utils/orderStatus'
import { OrderStatusBadge, PaymentStatusText } from './OrderStatusBadge'

const getExpiryTime = (payment) => {
  if (payment?.expires_at_unix) return Number(payment.expires_at_unix) * 1000
  if (payment?.expires_at) return new Date(payment.expires_at).getTime()
  return 0
}

const OrderDetailModal = ({ orderId, onClose }) => {
  const [showQrModal, setShowQrModal] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    select: (res) => res.data,
    staleTime: 0,
  })

  const canShowBankQr = order?.payment_method === 'bank_transfer' && order?.payment_status === 'pending'

  const { data: shopSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: settingsService.getSettings,
    select: (res) => res.data,
    staleTime: 60000,
    enabled: canShowBankQr,
  })

  useEffect(() => {
    if (!canShowBankQr) {
      setShowQrModal(false)
      return undefined
    }

    const updateRemaining = () => {
      const expiryTime = getExpiryTime(order?.payment)
      setRemainingSeconds(expiryTime ? Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)) : 0)
    }

    updateRemaining()
    const timer = setInterval(updateRemaining, 1000)
    return () => clearInterval(timer)
  }, [canShowBankQr, order?.payment])

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

            {canShowBankQr && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-700 dark:bg-blue-900/20">
                <p className="font-semibold text-blue-800 dark:text-blue-300">Thanh toán bằng chuyển khoản QR</p>
                <p className="mt-1 text-blue-700 dark:text-blue-300">Bạn có thể mở lại mã QR nếu chưa chuyển khoản cho đơn này.</p>
                <button type="button" className="btn btn-primary btn-sm mt-3 w-full justify-center" onClick={() => setShowQrModal(true)}>
                  Mở mã QR thanh toán
                </button>
              </div>
            )}

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

      {showQrModal && canShowBankQr && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
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
                &times;
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
                    <dd className="font-bold">{formatPrice(order.total_amount)} đ</dd>
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
                    <dd className="font-mono font-bold">{order.order_number}</dd>
                  </div>
                </dl>
              </div>

              <p className={`mt-4 text-center text-sm font-semibold ${remainingSeconds > 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-600'}`}>
                {remainingSeconds > 0
                  ? `QR hết hạn sau ${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`
                  : 'QR đã hết hạn. Vui lòng tạo đơn mới nếu chưa chuyển khoản.'}
              </p>
              {getExpiryTime(order.payment) > 0 && (
                <p className="mt-1 text-center text-xs text-gray-500">
                  Thời hạn thanh toán: {new Date(getExpiryTime(order.payment)).toLocaleString('vi-VN')}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default OrderDetailModal
