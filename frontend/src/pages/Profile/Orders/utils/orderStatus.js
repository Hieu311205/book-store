export const statusLabels = {
  pending: { label: 'Chờ xác nhận', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  confirmed: { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  paid: { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  processing: { label: 'Đang chuẩn bị hàng', cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  shipped: { label: 'Đang giao', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  delivered: { label: 'Đã giao', cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Đã hủy', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  refunded: { label: 'Đã hoàn tiền', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
}

export const paymentStatusLabels = {
  pending: { label: 'Chờ thanh toán', cls: 'text-yellow-600' },
  paid: { label: 'Đã thanh toán', cls: 'text-green-600 font-semibold' },
  failed: { label: 'Thất bại', cls: 'text-red-600' },
  cancelled: { label: 'Đã hủy', cls: 'text-red-600' },
  refunded: { label: 'Đã hoàn tiền', cls: 'text-gray-500' },
}

export const paymentMethodText = {
  cod: 'COD (tiền mặt khi nhận)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  card: 'Thẻ tín dụng/ghi nợ',
  wallet: 'Ví điện tử Book Store',
}

export const returnStatusText = {
  pending: 'Đang chờ xử lý',
  approved: 'Đã duyệt - chờ hoàn tất',
  rejected: 'Đã từ chối',
  completed: 'Đã hoàn tất',
}

export const getDaysSince = (date) => {
  if (!date) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)))
}
