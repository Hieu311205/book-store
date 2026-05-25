import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import PaginationNumbers from '../../../components/common/PaginationNumbers'
import {
  formatPrice,
  getCustomerName,
  getEstimatedDeliveryDate,
  getOrderStatusOptions,
  isFinalOrderStatus,
  paymentMethodLabels,
  paymentStatusClass,
  paymentStatusLabels,
  returnStatusLabels,
  returnTypeLabels,
  statusLabels,
} from '../utils/orderStatus'
import OrderActions from './OrderActions'

const OrderTable = ({
  orders,
  isLoading,
  hasFilters,
  page,
  setPage,
  totalPages,
  totalItems,
  onStatusChange,
  onView,
  onTracking,
}) => (
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
          ) : !orders?.length ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-gray-500">
                {hasFilters ? 'Không tìm thấy đơn hàng phù hợp với bộ lọc' : 'Không có đơn hàng'}
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id}>
                <td className="font-medium">{order.order_number}</td>
                <td>
                  <p>{getCustomerName(order)}</p>
                  <p className="text-xs text-gray-500">{order.email || order.shipping_phone}</p>
                </td>
                <td className="font-medium">{formatPrice(order.total_amount)} đ</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => onStatusChange(order, e.target.value)}
                    className={`text-xs border rounded px-2 py-1 font-medium cursor-pointer ${statusLabels[order.status]?.cls || ''}`}
                    disabled={isFinalOrderStatus(order.status)}
                  >
                    {getOrderStatusOptions(order).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {order.status === 'shipped' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Dự kiến nhận: {getEstimatedDeliveryDate(order.shipped_at)?.toLocaleDateString('vi-VN') || 'Đang cập nhật'}
                    </p>
                  )}
                  {order.return_status && (
                    <div className="mt-1">
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        Đổi trả: {returnStatusLabels[order.return_status] || order.return_status}
                      </span>
                      {order.return_type && (
                        <p className="text-xs text-gray-500 mt-1">{returnTypeLabels[order.return_type] || order.return_type}</p>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`text-xs font-semibold ${paymentStatusClass[order.payment_status] || 'text-gray-500'}`}>
                    {paymentStatusLabels[order.payment_status] || order.payment_status || '—'}
                  </span>
                  <p className="text-xs text-gray-500">{paymentMethodLabels[order.payment_method] || order.payment_method || '—'}</p>
                </td>
                <td className="text-gray-500 text-sm">
                  {new Date(order.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td>
                  <OrderActions order={order} onView={onView} onTracking={onTracking} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {totalPages > 0 && (
      <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
        <p className="text-sm text-gray-500">
          Trang <span className="font-medium text-gray-800 dark:text-gray-100">{page}</span> / {totalPages}
          &nbsp;·&nbsp;{totalItems} đơn hàng
        </p>
        <div className="flex items-center gap-1">
          <button disabled={page === 1} onClick={() => setPage(1)} className="btn btn-outline btn-sm px-2" title="Trang đầu">«</button>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn btn-outline btn-sm flex items-center gap-1"
          >
            <FiChevronLeft size={14} /> Trước
          </button>
          <PaginationNumbers page={page} totalPages={totalPages} onPageChange={setPage} />
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn btn-outline btn-sm flex items-center gap-1"
          >
            Sau <FiChevronRight size={14} />
          </button>
          <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="btn btn-outline btn-sm px-2" title="Trang cuối">»</button>
        </div>
      </div>
    )}
  </div>
)

export default OrderTable
