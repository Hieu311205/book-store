import { paymentStatusLabels, statusLabels } from '../utils/orderStatus'

export const OrderStatusBadge = ({ status }) => {
  const item = statusLabels[status]
  if (!item) return <span className="text-gray-400 text-xs">{status}</span>
  return <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${item.cls}`}>{item.label}</span>
}

export const PaymentStatusText = ({ status }) => {
  const item = paymentStatusLabels[status]
  return <span className={item?.cls || 'text-gray-500'}>{item?.label || status}</span>
}
