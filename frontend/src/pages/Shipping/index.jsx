import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { orderService } from '../../services/order.service'
import { formatPrice } from '../../utils/formatPrice'

const shippingProviderText = {
  giao_hang_tiet_kiem: 'Giao hàng tiết kiệm',
  ghn: 'GHN',
  viettel_post: 'Viettel Post',
  jt: 'J&T',
  shop_delivery: 'Shop tự giao',
  standard: 'Tiêu chuẩn',
  express: 'Nhanh',
}

const paymentStatusText = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  expired: 'Đã hết hạn',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
}

const orderStatusText = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  paid: 'Đã xác nhận',
  processing: 'Đang chuẩn bị hàng',
  shipped: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
}

const progressStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
const progressLabels = ['Chờ xác nhận', 'Đã xác nhận', 'Chuẩn bị hàng', 'Đang giao', 'Đã giao']

const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const shortDate = (date) => new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })

const getDaysSince = (date) => {
  if (!date) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)))
}

const TrackingProgress = ({ status }) => {
  const normalizedStatus = status === 'paid' ? 'confirmed' : status
  const activeIndex = Math.max(0, progressStatuses.indexOf(normalizedStatus))
  const isStopped = ['cancelled', 'refunded'].includes(status)

  return (
    <div className="grid grid-cols-5 gap-1 text-center text-xs">
      {progressLabels.map((label, index) => {
        const active = !isStopped && index <= activeIndex
        return (
          <div key={label} className="relative">
            {index < progressLabels.length - 1 && (
              <div className={`absolute top-4 left-1/2 w-full h-0.5 ${index < activeIndex ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            )}
            <div className={`relative z-10 mx-auto w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              active ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-400'
            }`}>
              {index + 1}
            </div>
            <p className={`mt-2 ${active ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>{label}</p>
          </div>
        )
      })}
    </div>
  )
}

const ShippingTracker = ({ order, onConfirmReceived, confirmPending }) => {
  const provider = shippingProviderText[order.shipping_provider || order.shipping_method] || order.shipping_provider || order.shipping_method || 'Đơn vị vận chuyển'
  const shippedAt = order.shipped_at
  const estimateStart = shippedAt ? addDays(shippedAt, 2) : null
  const estimateEnd = shippedAt ? addDays(shippedAt, 4) : null
  const daysSinceShipped = getDaysSince(shippedAt)
  const isStopped = ['cancelled', 'refunded'].includes(order.status)
  const events = [
    { status: 'pending', label: 'Đơn hàng đã được tạo', time: order.created_at },
    { status: 'confirmed', label: 'Shop đã xác nhận đơn hàng', time: null },
    { status: 'processing', label: 'Đơn hàng đang được chuẩn bị', time: null },
    { status: 'shipped', label: 'Đơn vị vận chuyển đã lấy hàng', time: order.shipped_at },
    { status: 'delivered', label: 'Đơn hàng đã giao thành công', time: order.delivered_at },
  ]
  const currentProgressIndex = progressStatuses.indexOf(order.status === 'paid' ? 'confirmed' : order.status)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Đơn {order.order_number}</p>
          <h1 className="text-2xl font-bold mt-1">{orderStatusText[order.status] || order.status}</h1>
          {!isStopped && (
            <p className="text-emerald-600 font-semibold mt-3">
              Ngày giao hàng dự kiến: {estimateStart && estimateEnd ? `${shortDate(estimateStart)} - ${shortDate(estimateEnd)}` : 'Đang cập nhật'}
            </p>
          )}
        </div>
        <Link to="/profile/orders" className="btn btn-outline btn-sm">Quay lại đơn hàng</Link>
      </div>

      <TrackingProgress status={order.status} />

      {isStopped && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          <p className="font-semibold">{order.status === 'refunded' ? 'Đơn hàng đã hoàn tiền' : 'Đơn hàng đã bị hủy'}</p>
          {order.admin_note && <p className="mt-1">{order.admin_note}</p>}
        </div>
      )}

      {order.status === 'shipped' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
          <p className="font-semibold">Nhắc xác nhận nhận hàng</p>
          <p className="mt-1">
            Đơn đã được vận chuyển {daysSinceShipped} ngày. Nếu bạn đã nhận được hàng, hãy bấm “Đã nhận hàng” để shop hoàn tất đơn.
          </p>
        </div>
      )}

      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/50 p-4">
        <div className="grid md:grid-cols-3 gap-4 items-center">
          <div>
            <p className="text-xs text-gray-500">Đơn vị vận chuyển</p>
            <p className="font-bold">{provider}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Mã vận đơn</p>
            <p className="font-mono font-bold">{order.tracking_code || 'Đang cập nhật'}</p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              navigator.clipboard?.writeText(order.tracking_code || '')
              toast.success('Đã sao chép mã vận đơn')
            }}
            disabled={!order.tracking_code}
          >
            Sao chép mã
          </button>
        </div>
      </div>

      <div className="rounded-xl border dark:border-gray-700 p-4 space-y-4">
        {events.map((event, index) => {
          const reached = !isStopped && index <= currentProgressIndex
          return (
            <div key={event.status} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`w-3 h-3 rounded-full mt-1 ${reached ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                {index < events.length - 1 && <span className={`w-0.5 flex-1 min-h-8 ${reached ? 'bg-emerald-200 dark:bg-emerald-900' : 'bg-gray-200 dark:bg-gray-700'}`} />}
              </div>
              <div>
                <p className={reached ? 'font-semibold text-emerald-600' : 'font-semibold text-gray-500'}>{event.label}</p>
                <p className="text-sm text-gray-500">{event.time ? new Date(event.time).toLocaleString('vi-VN') : 'Chưa cập nhật'}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-3 text-sm border-t dark:border-gray-700 pt-4">
        <div><span className="text-gray-500">Phí ship: </span><span className="font-semibold">{formatPrice(order.shipping_cost)} đ</span></div>
        <div><span className="text-gray-500">Thanh toán: </span><span className="font-semibold">{paymentStatusText[order.payment_status] || order.payment_status || 'Chờ thanh toán'}</span></div>
        <div><span className="text-gray-500">Tổng tiền: </span><span className="font-semibold text-primary-600">{formatPrice(order.total_amount)} đ</span></div>
      </div>

      {order.status === 'shipped' && (
        <button className="btn btn-primary w-full md:w-auto" disabled={confirmPending} onClick={() => onConfirmReceived(order.id)}>
          Đã nhận hàng
        </button>
      )}
    </div>
  )
}

const Shipping = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [selectedOrderId, setSelectedOrderId] = useState(searchParams.get('order_id') || '')

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', 'shipping'],
    queryFn: () => orderService.getOrders({ page: 1, limit: 100 }),
    select: (res) => res.data,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })

  const confirmMutation = useMutation({
    mutationFn: orderService.confirmReceived,
    onSuccess: () => {
      toast.success('Đã xác nhận nhận hàng')
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      queryClient.invalidateQueries({ queryKey: ['my-orders', 'shipping'] })
    },
    onError: (error) => toast.error(error.message || 'Không thể xác nhận nhận hàng'),
  })

  const trackableOrders = useMemo(
    () => data?.orders || [],
    [data],
  )
  const selectedOrder = trackableOrders.find((order) => String(order.id) === String(selectedOrderId))

  useEffect(() => {
    const orderId = searchParams.get('order_id') || ''
    if (orderId !== selectedOrderId) setSelectedOrderId(orderId)
  }, [searchParams, selectedOrderId])

  const chooseOrder = (value) => {
    setSelectedOrderId(value)
    if (value) setSearchParams({ order_id: value })
    else setSearchParams({})
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
        <h1 className="text-2xl font-bold">Theo dõi đơn hàng</h1>
        <p className="text-gray-500 mt-2">Chọn đơn hàng để xem toàn bộ tiến trình xử lý và vận chuyển.</p>

        <div className="mt-4">
          <select className="input w-full" value={selectedOrderId} onChange={(event) => chooseOrder(event.target.value)}>
            <option value="">-- Chọn đơn hàng --</option>
            {trackableOrders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.order_number} - {formatPrice(order.total_amount)} đ - {orderStatusText[order.status] || order.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center text-gray-500">Đang tải...</div>
      ) : selectedOrder ? (
        <ShippingTracker
          order={selectedOrder}
          onConfirmReceived={(id) => confirmMutation.mutate(id)}
          confirmPending={confirmMutation.isPending}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center text-gray-500">
          {trackableOrders.length ? 'Vui lòng chọn một đơn hàng để theo dõi.' : 'Bạn chưa có đơn hàng.'}
        </div>
      )}
    </div>
  )
}

export default Shipping
