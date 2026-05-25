import { FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import OrderDetailModal from './components/OrderDetailModal'
import OrderFilters from './components/OrderFilters'
import OrderTable from './components/OrderTable'
import { useAdminOrders } from './hooks/useAdminOrders'
import { shippingProviderOptions } from './utils/orderStatus'

export { default as StatusBadge } from './components/OrderStatusBadge'

const Orders = () => {
  const orders = useAdminOrders()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
      </div>

      <OrderFilters
        filters={orders.filters}
        setters={orders.setters}
        showAdvanced={orders.showAdvanced}
        setShowAdvanced={orders.setShowAdvanced}
        hasFilters={orders.hasFilters}
        totalItems={orders.totalItems}
        totalPages={orders.totalPages}
        page={orders.page}
        isFetching={orders.isFetching}
        refetch={orders.refetch}
        resetFilters={orders.resetFilters}
      />

      <OrderTable
        orders={orders.data?.orders || []}
        isLoading={orders.isLoading}
        hasFilters={orders.hasFilters}
        page={orders.page}
        setPage={orders.setPage}
        totalPages={orders.totalPages}
        totalItems={orders.totalItems}
        onStatusChange={orders.handleStatusChange}
        onView={orders.setSelectedOrder}
        onTracking={orders.openTrackingForm}
      />

      <OrderDetailModal
        order={orders.selectedOrder}
        onClose={() => orders.setSelectedOrder(null)}
        onStatusChange={orders.handleStatusChange}
        setSelectedOrder={orders.setSelectedOrder}
      />

      {orders.trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md m-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Mã vận đơn - {orders.trackingOrder.order_number}</h3>
              <button onClick={() => orders.setTrackingOrder(null)} className="text-gray-500 hover:text-gray-700 p-1">
                <FiX size={20} />
              </button>
            </div>
            <input
              className="input w-full mb-4"
              placeholder="Nhập mã vận đơn"
              value={orders.trackingCode}
              onChange={(e) => orders.setTrackingCode(e.target.value)}
            />
            <select
              className="input w-full mb-4"
              value={orders.shippingProvider}
              onChange={(e) => orders.setShippingProvider(e.target.value)}
            >
              {shippingProviderOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              className="input w-full mb-4"
              type="number"
              min="0"
              placeholder="Phí vận chuyển"
              value={orders.shippingFee}
              onChange={(e) => orders.setShippingFee(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => orders.setTrackingOrder(null)} className="btn btn-outline">Hủy</button>
              <button
                onClick={() => {
                  if (!orders.trackingCode.trim()) {
                    toast.error('Nhập mã vận đơn')
                    return
                  }
                  if (!orders.shippingProvider) {
                    toast.error('Chọn đơn vị vận chuyển')
                    return
                  }
                  orders.addTrackingMutation.mutate({
                    id: orders.trackingOrder.id,
                    tracking_code: orders.trackingCode,
                    shipping_provider: orders.shippingProvider,
                    shipping_fee: orders.shippingFee,
                  })
                }}
                disabled={orders.addTrackingMutation.isPending}
                className="btn btn-primary"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {orders.cancelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Hủy đơn {orders.cancelOrder.order_number}</h3>
              <button onClick={() => orders.setCancelOrder(null)} className="text-gray-500 hover:text-gray-700 p-1">
                <FiX size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Lý do này sẽ hiển thị cho người dùng và ghi nhận là đơn bị hủy từ shop.
              {orders.cancelOrder.status === 'shipped' && ' Nếu đơn đã thanh toán, hệ thống sẽ không hoàn tiền vì xử lý theo trường hợp khách không nhận hàng sau hạn.'}
            </p>
            <textarea
              className="input w-full min-h-28 mb-4"
              value={orders.cancelReason}
              onChange={(e) => orders.setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy đơn từ shop..."
            />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => orders.setCancelOrder(null)} className="btn btn-outline">
                Đóng
              </button>
              <button
                type="button"
                onClick={orders.submitCancelOrder}
                disabled={orders.updateStatusMutation.isPending}
                className="btn btn-danger"
              >
                Xác nhận hủy đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
