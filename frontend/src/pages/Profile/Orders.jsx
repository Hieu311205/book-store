import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { orderService } from '../../services/order.service'
import { formatPrice } from '../../utils/formatPrice'
import Pagination from '../../components/common/Pagination'

const statusLabels = {
  pending: { label: 'Chờ xác nhận', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  confirmed: { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  paid: { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  processing: { label: 'Đang chuẩn bị hàng', cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  shipped: { label: 'Đang giao', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  delivered: { label: 'Đã giao', cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Đã hủy', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  refunded: { label: 'Đã hoàn tiền', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
}

const paymentStatusLabels = {
  pending: { label: 'Chờ thanh toán', cls: 'text-yellow-600' },
  paid: { label: 'Đã thanh toán', cls: 'text-green-600 font-semibold' },
  failed: { label: 'Thất bại', cls: 'text-red-600' },
  cancelled: { label: 'Đã hủy', cls: 'text-red-600' },
  refunded: { label: 'Đã hoàn tiền', cls: 'text-gray-500' },
}

const paymentMethodText = {
  cod: 'COD (tiền mặt khi nhận)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  card: 'Thẻ tín dụng/ghi nợ',
  wallet: 'Ví điện tử Book Store',
}

const returnStatusText = {
  pending: 'Đang chờ xử lý',
  approved: 'Đã duyệt - chờ hoàn tất',
  rejected: 'Đã từ chối',
  completed: 'Đã hoàn tất',
}

const getDaysSince = (date) => {
  if (!date) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)))
}

const StatusBadge = ({ status }) => {
  const s = statusLabels[status]
  if (!s) return <span className="text-gray-400 text-xs">{status}</span>
  return <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
}

const PaymentStatusText = ({ status }) => {
  const s = paymentStatusLabels[status]
  return <span className={s?.cls || 'text-gray-500'}>{s?.label || status}</span>
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
              <div className="flex justify-between"><span className="text-gray-500">Mã đơn hàng</span><span className="font-semibold">{order.order_number}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Ngày đặt</span><span>{new Date(order.created_at).toLocaleString('vi-VN')}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Trạng thái</span><StatusBadge status={order.status} /></div>
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

const ProfileOrders = () => {
  const queryClient = useQueryClient()
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [returnOrder, setReturnOrder] = useState(null)
  const [returnType, setReturnType] = useState('return')
  const [returnReason, setReturnReason] = useState('')
  const [returnNote, setReturnNote] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('')
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')

  const orderParams = {
    page,
    limit: 5,
    search: search || undefined,
    month: month || undefined,
    status: status || undefined,
    payment_status: paymentStatus || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', orderParams],
    queryFn: () => orderService.getOrders(orderParams),
    select: (res) => res.data,
    staleTime: 0,
  })

  const { data: shippedData } = useQuery({
    queryKey: ['my-orders', 'receipt-reminders'],
    queryFn: () => orderService.getOrders({ page: 1, limit: 100, status: 'shipped' }),
    select: (res) => res.data,
    staleTime: 0,
  })

  const shippedReminders = shippedData?.orders || []
  const urgentReceiptReminders = shippedReminders.filter((order) => getDaysSince(order.shipped_at || order.updated_at) >= 2)

  useEffect(() => {
    if (urgentReceiptReminders.length) {
      toast('Bạn có đơn đang giao cần xác nhận đã nhận hàng', { id: 'receipt-reminder' })
    }
  }, [urgentReceiptReminders.length])

  const updateFilter = (setter, value) => {
    setter(value)
    setPage(1)
  }

  const cancelMutation = useMutation({
    mutationFn: orderService.cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      toast.success('Đã hủy đơn hàng')
    },
    onError: (error) => toast.error(error.message || 'Không thể hủy đơn hàng'),
  })

  const confirmReceivedMutation = useMutation({
    mutationFn: orderService.confirmReceived,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      toast.success('Đã xác nhận nhận hàng')
    },
    onError: (error) => toast.error(error.message || 'Không thể xác nhận nhận hàng'),
  })

  const returnMutation = useMutation({
    mutationFn: ({ id, data }) => orderService.requestReturn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      toast.success('Đã gửi yêu cầu đổi trả')
      setReturnOrder(null)
      setReturnType('return')
      setReturnReason('')
      setReturnNote('')
    },
    onError: (error) => toast.error(error.message || 'Không thể gửi yêu cầu đổi trả'),
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold">Đơn hàng của tôi</h2>
          <p className="text-sm text-gray-500">{data?.pagination?.totalItems ?? 0} đơn hàng</p>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => {
            setSearch('')
            setMonth('')
            setStatus('')
            setPaymentStatus('')
            setPage(1)
          }}
        >
          Làm mới lọc
        </button>
      </div>

      {shippedReminders.length > 0 && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
          <p className="font-semibold">Bạn có {shippedReminders.length} đơn đang giao.</p>
          <p className="mt-1">
            Nếu đã nhận được hàng, hãy bấm “Đã nhận hàng” để hoàn tất đơn. Sau thời hạn quy định, hệ thống có thể tự xác nhận nếu không có khiếu nại.
          </p>
          <Link to={`/shipping${shippedReminders[0]?.id ? `?order_id=${shippedReminders[0].id}` : ''}`} className="mt-3 inline-flex text-primary-600 hover:underline">
            Theo dõi và xác nhận đơn hàng
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-3 mb-5">
        <input
          className="input w-full"
          value={search}
          onChange={(e) => updateFilter(setSearch, e.target.value)}
          placeholder="Tìm mã đơn, mã vận đơn..."
        />
        <input
          className="input w-full"
          type="month"
          value={month}
          onChange={(e) => updateFilter(setMonth, e.target.value)}
        />
        <select className="input w-full" value={status} onChange={(e) => updateFilter(setStatus, e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="processing">Đang chuẩn bị hàng</option>
          <option value="shipped">Đang giao</option>
          <option value="delivered">Đã giao</option>
          <option value="cancelled">Đã hủy</option>
          <option value="refunded">Đã hoàn tiền</option>
        </select>
        <select className="input w-full" value={paymentStatus} onChange={(e) => updateFilter(setPaymentStatus, e.target.value)}>
          <option value="">Tất cả thanh toán</option>
          <option value="pending">Chờ thanh toán</option>
          <option value="paid">Đã thanh toán</option>
          <option value="failed">Thất bại</option>
          <option value="cancelled">Đã hủy</option>
          <option value="refunded">Đã hoàn tiền</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : data?.orders?.length ? (
        <div className="space-y-4">
          {data.orders.map((order) => (
            <div key={order.id} className="border dark:border-gray-700 rounded-xl p-4 space-y-3 hover:border-primary-400 transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <button onClick={() => setSelectedOrderId(order.id)} className="font-semibold text-primary-600 hover:underline text-left">
                    {order.order_number}
                  </button>
                  <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{paymentMethodText[order.payment_method] || order.payment_method}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-primary-600">{formatPrice(order.total_amount)} đ</p>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm border-t dark:border-gray-700 pt-3">
                <div><span className="text-gray-500">Phí ship: </span><span>{formatPrice(order.shipping_cost)} đ</span></div>
                {Number(order.discount_amount) > 0 && <div className="text-green-600"><span>Giảm: </span><span>-{formatPrice(order.discount_amount)} đ</span></div>}
                <div><span className="text-gray-500">Thanh toán: </span><PaymentStatusText status={order.payment_status} /></div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <button onClick={() => setSelectedOrderId(order.id)} className="text-sm text-primary-600 hover:underline">Xem chi tiết</button>
                {['shipped', 'delivered'].includes(order.status) && (
                  <Link to={`/shipping?order_id=${order.id}`} className="text-sm text-primary-600 hover:underline">
                    Theo dõi đơn hàng
                  </Link>
                )}
                {['pending', 'confirmed'].includes(order.status) && (
                  <button onClick={() => cancelMutation.mutate(order.id)} disabled={cancelMutation.isPending} className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50">Hủy đơn</button>
                )}
                {order.status === 'delivered' && !['pending', 'approved', 'completed'].includes(order.return_status || '') && (
                  <button onClick={() => setReturnOrder(order)} className="text-sm text-orange-600 hover:text-orange-700">Yêu cầu đổi trả</button>
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
          ))}
          {data?.pagination && (
            <Pagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <p className="mb-3">{search || month || status || paymentStatus ? 'Không có đơn hàng phù hợp.' : 'Bạn chưa có đơn hàng nào.'}</p>
          <a href="/products" className="btn btn-primary btn-sm">Mua sắm ngay</a>
        </div>
      )}

      {selectedOrderId && <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />}

      {returnOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Yêu cầu đổi trả</h3>
              <button onClick={() => setReturnOrder(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <p className="text-sm text-gray-500">Đơn {returnOrder.order_number}</p>
            <select className="input w-full" value={returnType} onChange={(e) => setReturnType(e.target.value)}>
              <option value="return">Trả hàng / hoàn tiền</option>
              <option value="exchange">Đổi hàng</option>
            </select>
            <input className="input w-full" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Lý do đổi trả" />
            <textarea className="input w-full min-h-28" value={returnNote} onChange={(e) => setReturnNote(e.target.value)} placeholder="Mô tả thêm tình trạng sản phẩm" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setReturnOrder(null)} className="btn btn-outline">Hủy</button>
              <button
                disabled={returnMutation.isPending}
                onClick={() => {
                  if (!returnReason.trim()) {
                    toast.error('Nhập lý do đổi trả')
                    return
                  }
                  returnMutation.mutate({
                    id: returnOrder.id,
                    data: { type: returnType, reason: returnReason, note: returnNote },
                  })
                }}
                className="btn btn-primary"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileOrders
