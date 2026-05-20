import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { orderService } from '../../services/order.service'
import { formatPrice } from '../../utils/formatPrice'

const returnStatusText = {
  pending: 'Đang chờ xử lý',
  approved: 'Đã duyệt - chờ hoàn tất',
  rejected: 'Đã từ chối',
  completed: 'Đã hoàn tất',
}

const Returns = () => {
  const queryClient = useQueryClient()
  const [returnOrder, setReturnOrder] = useState(null)
  const [returnType, setReturnType] = useState('return')
  const [returnReason, setReturnReason] = useState('')
  const [returnNote, setReturnNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', 'returns'],
    queryFn: () => orderService.getOrders({ page: 1, limit: 100 }),
    select: (res) => res.data,
    staleTime: 0,
  })

  const returnMutation = useMutation({
    mutationFn: ({ id, payload }) => orderService.requestReturn(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      queryClient.invalidateQueries({ queryKey: ['my-orders', 'returns'] })
      toast.success('Đã gửi yêu cầu đổi trả')
      setReturnOrder(null)
      setReturnType('return')
      setReturnReason('')
      setReturnNote('')
    },
    onError: (error) => toast.error(error.message || 'Không thể gửi yêu cầu đổi trả'),
  })

  const deliveredOrders = data?.orders?.filter((order) => order.status === 'delivered') || []

  return (
    <div className="space-y-6">
      <section className="store-card p-6 md:p-8">
        <p className="text-sm font-semibold text-primary-600 mb-2">Hỗ trợ sau mua hàng</p>
        <h1 className="text-3xl font-bold mb-3">Đổi trả và hoàn tiền</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
          Chọn đơn hàng đã giao thành công bên dưới để gửi yêu cầu đổi trả. Yêu cầu sẽ được chuyển sang shop xử lý.
        </p>
      </section>

      <section className="store-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Đơn có thể đổi trả</h2>
          <Link to="/profile/orders" className="btn btn-outline btn-sm">Xem tất cả đơn</Link>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Đang tải đơn hàng...</p>
        ) : deliveredOrders.length ? (
          <div className="space-y-3">
            {deliveredOrders.map((order) => {
              const hasActiveReturn = ['pending', 'approved', 'completed'].includes(order.return_status || '')
              return (
                <div key={order.id} className="border dark:border-gray-700 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{order.order_number}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')} · {formatPrice(order.total_amount)} đ
                    </p>
                    {order.return_status && (
                      <p className="text-sm text-orange-600 mt-1">
                        Đổi trả: {returnStatusText[order.return_status] || order.return_status}
                      </p>
                    )}
                  </div>
                  <button
                    disabled={hasActiveReturn}
                    onClick={() => setReturnOrder(order)}
                    className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {hasActiveReturn ? 'Đang xử lý' : 'Yêu cầu đổi trả'}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-3">Bạn chưa có đơn đã giao để đổi trả.</p>
            <Link to="/profile/orders" className="btn btn-primary btn-sm">Xem đơn hàng</Link>
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="store-card p-5">
          <h2 className="font-bold text-lg mb-2">1. Đã nhận hàng</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Đơn phải ở trạng thái “Đã giao” trước khi gửi yêu cầu đổi trả.
          </p>
        </div>
        <div className="store-card p-5">
          <h2 className="font-bold text-lg mb-2">2. Gửi yêu cầu</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Chọn đơn, nhập loại yêu cầu và lý do để shop có thông tin xử lý.
          </p>
        </div>
        <div className="store-card p-5">
          <h2 className="font-bold text-lg mb-2">3. Shop xử lý</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Shop duyệt yêu cầu, sau đó hoàn tất đổi hàng hoặc hoàn tiền khi shop đã xử lý xong.
          </p>
        </div>
      </section>

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
            <input
              className="input w-full"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Lý do đổi trả"
            />
            <textarea
              className="input w-full min-h-28"
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="Mô tả thêm tình trạng sản phẩm"
            />
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
                    payload: { type: returnType, reason: returnReason, note: returnNote },
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

export default Returns
