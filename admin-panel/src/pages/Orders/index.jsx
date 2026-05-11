import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiEye, FiTruck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminService } from '../../services/admin.service'

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price)

const statusOptions = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
]

const statusLabels = {
  pending: { label: 'Chờ xử lý', class: 'badge-warning' },
  paid: { label: 'Đã thanh toán', class: 'badge-info' },
  processing: { label: 'Đang xử lý', class: 'badge-info' },
  shipped: { label: 'Đang giao', class: 'badge-info' },
  delivered: { label: 'Đã giao', class: 'badge-success' },
  cancelled: { label: 'Đã hủy', class: 'badge-danger' },
  refunded: { label: 'Đã hoàn tiền', class: 'badge-danger' },
}

const Orders = () => {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', { page, status }],
    queryFn: () => adminService.getOrders({ page, limit: 20, status: status || undefined }),
    select: (res) => res.data,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => adminService.updateOrderStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders'])
      toast.success('Đã cập nhật trạng thái')
    },
    onError: (error) => toast.error(error.message || 'Có lỗi xảy ra'),
  })

  const handleStatusChange = (orderId, newStatus) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>

      <div className="card p-4">
        <div className="flex gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input w-auto"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Thanh toán</th>
                <th>Ngày</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : data?.orders?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Không có đơn hàng
                  </td>
                </tr>
              ) : (
                data?.orders?.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">{order.order_number}</td>
                    <td>
                      <p>{order.first_name} {order.last_name}</p>
                      <p className="text-xs text-gray-500">{order.email}</p>
                    </td>
                    <td>{formatPrice(order.total_amount)} đ</td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1 bg-transparent"
                      >
                        {statusOptions.slice(1).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                      </span>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Xem"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Thêm mã vận đơn"
                        >
                          <FiTruck size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold">Chi tiết đơn hàng {selectedOrder.order_number}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">
                X
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Khách hàng:</p>
                  <p>{selectedOrder.first_name} {selectedOrder.last_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Số điện thoại:</p>
                  <p>{selectedOrder.shipping_phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Địa chỉ:</p>
                  <p>{selectedOrder.shipping_province} - {selectedOrder.shipping_city} - {selectedOrder.shipping_address}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tổng tiền:</p>
                  <p className="font-bold text-primary-600">{formatPrice(selectedOrder.total_amount)} đ</p>
                </div>
                <div>
                  <p className="text-gray-500">Mã vận đơn:</p>
                  <p>{selectedOrder.tracking_code || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
