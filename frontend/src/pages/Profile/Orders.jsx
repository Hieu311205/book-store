import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { orderService } from '../../services/order.service'
import { formatPrice } from '../../utils/formatPrice'

const statusText = {
  pending: 'Chờ xử lý',
  paid: 'Đã thanh toán',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
}

const ProfileOrders = () => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderService.getOrders({ page: 1, limit: 50 }),
    select: (res) => res.data,
  })

  const cancelMutation = useMutation({
    mutationFn: orderService.cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['my-orders'])
      toast.success('Đã hủy đơn hàng')
    },
    onError: (error) => toast.error(error.message || 'Không thể hủy đơn hàng'),
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Đơn hàng của tôi</h2>
      {isLoading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : data?.orders?.length ? (
        <div className="space-y-3">
          {data.orders.map((order) => (
            <div key={order.id} className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{order.order_number}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">{formatPrice(order.total_amount)}</p>
                  <p className="text-sm text-gray-500">{statusText[order.status] || order.status}</p>
                </div>
              </div>
              {['pending', 'paid'].includes(order.status) && (
                <button
                  onClick={() => cancelMutation.mutate(order.id)}
                  className="mt-3 text-sm text-red-500 hover:text-red-600"
                >
                  Hủy đơn hàng
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Chưa có đơn hàng</p>
      )}
    </div>
  )
}

export default ProfileOrders
