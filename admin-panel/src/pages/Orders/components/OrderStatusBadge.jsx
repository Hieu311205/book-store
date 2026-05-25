import { statusLabels } from '../utils/orderStatus'

const OrderStatusBadge = ({ status }) => {
  const s = statusLabels[status]
  if (!s) return <span className="text-gray-400 text-xs">{status}</span>

  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  )
}

export default OrderStatusBadge
