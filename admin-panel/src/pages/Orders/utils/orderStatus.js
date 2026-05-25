export const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0)

export const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'processing', label: 'Đang chuẩn bị hàng' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Hủy đơn' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
]

export const statusLabels = {
  pending: { label: 'Chờ xác nhận', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  confirmed: { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  paid: { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  processing: { label: 'Đang chuẩn bị hàng', cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  shipped: { label: 'Đang giao', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  delivered: { label: 'Đã giao', cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Hủy đơn', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  refunded: { label: 'Đã hoàn tiền', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
}

export const paymentMethodLabels = {
  cod: 'COD',
  bank_transfer: 'Chuyển khoản',
  card: 'Thẻ',
  wallet: 'Ví điện tử',
}

export const paymentMethodOptions = [
  { value: '', label: 'Tất cả phương thức' },
  { value: 'cod', label: 'COD' },
  { value: 'bank_transfer', label: 'Chuyển khoản' },
  { value: 'card', label: 'Thẻ' },
  { value: 'wallet', label: 'Ví điện tử' },
]

export const shippingProviderOptions = [
  { value: 'giao_hang_tiet_kiem', label: 'Giao hàng tiết kiệm' },
  { value: 'ghn', label: 'GHN' },
  { value: 'viettel_post', label: 'Viettel Post' },
  { value: 'jt', label: 'J&T' },
  { value: 'shop_delivery', label: 'Shop tự giao' },
]

export const shippingProviderLabels = {
  giao_hang_tiet_kiem: 'Giao hàng tiết kiệm',
  ghn: 'GHN',
  viettel_post: 'Viettel Post',
  jt: 'J&T',
  shop_delivery: 'Shop tự giao',
  standard: 'Tiêu chuẩn',
  express: 'Nhanh',
}

export const paymentStatusOptions = [
  { value: '', label: 'Tất cả thanh toán' },
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
]

export const paymentStatusLabels = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
}

export const paymentStatusClass = {
  pending: 'text-yellow-500',
  paid: 'text-green-500',
  failed: 'text-red-500',
  cancelled: 'text-red-500',
  refunded: 'text-gray-400',
}

export const returnTypeLabels = {
  return: 'Trả hàng / hoàn tiền',
  exchange: 'Đổi hàng',
}

export const returnStatusLabels = {
  pending: 'Đang chờ xử lý',
  approved: 'Đã duyệt - chờ hoàn tất',
  rejected: 'Đã từ chối',
  completed: 'Đã hoàn tất',
}

export const ESTIMATED_DELIVERY_DAYS = 4
export const ADMIN_AFTER_ESTIMATE_DAYS = 5
export const ADMIN_DELIVERY_RESOLUTION_DAYS = ESTIMATED_DELIVERY_DAYS + ADMIN_AFTER_ESTIMATE_DAYS

export const getDaysSince = (date) => {
  if (!date) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)))
}

export const getEstimatedDeliveryDate = (date) => {
  if (!date) return null
  const estimated = new Date(date)
  estimated.setDate(estimated.getDate() + ESTIMATED_DELIVERY_DAYS)
  return estimated
}

export const orderStatusFlow = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  refunded: [],
}

export const getOrderStatusOptions = (orderOrStatus) => {
  const currentStatus = typeof orderOrStatus === 'string' ? orderOrStatus : orderOrStatus?.status
  const nextStatuses = orderStatusFlow[currentStatus] || []
  const values = [currentStatus, ...nextStatuses]
  return statusOptions.filter((option) => values.includes(option.value))
}

export const isFinalOrderStatus = (status) => !((orderStatusFlow[status] || []).length)

export const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'amount_desc', label: 'Giá trị cao nhất' },
  { value: 'amount_asc', label: 'Giá trị thấp nhất' },
]

export const LIMIT = 20

export const getCustomerName = (order) =>
  order.first_name || order.last_name
    ? `${order.first_name || ''} ${order.last_name || ''}`.trim()
    : order.shipping_name || '—'
