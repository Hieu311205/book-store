import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Pagination from '../../../components/common/Pagination'
import { orderService } from '../../../services/order.service'
import OrderCard from './components/OrderCard'
import OrderDetailModal from './components/OrderDetailModal'
import { getDaysSince } from './utils/orderStatus'

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
        <input className="input w-full" type="month" value={month} onChange={(e) => updateFilter(setMonth, e.target.value)} />
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
            <OrderCard
              key={order.id}
              order={order}
              onView={setSelectedOrderId}
              onCancel={(id) => cancelMutation.mutate(id)}
              cancelPending={cancelMutation.isPending}
              onReturn={setReturnOrder}
            />
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
