import { FiEye, FiTruck } from 'react-icons/fi'

const OrderActions = ({ order, onView, onTracking }) => (
  <div className="flex gap-2">
    <button
      onClick={() => onView(order)}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
      title="Xem chi tiết"
    >
      <FiEye size={16} />
    </button>
    <button
      onClick={() => onTracking(order)}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
      title="Mã vận đơn"
    >
      <FiTruck size={16} />
    </button>
  </div>
)

export default OrderActions
