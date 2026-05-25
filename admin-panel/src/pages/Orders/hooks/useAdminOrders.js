import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { adminService } from '../../../services/admin.service'
import {
  ADMIN_AFTER_ESTIMATE_DAYS,
  ADMIN_DELIVERY_RESOLUTION_DAYS,
  LIMIT,
  getDaysSince,
  orderStatusFlow,
} from '../utils/orderStatus'

export const useAdminOrders = () => {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [sort, setSort] = useState('newest')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [page, setPage] = useState(1)

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [trackingCode, setTrackingCode] = useState('')
  const [shippingProvider, setShippingProvider] = useState('giao_hang_tiet_kiem')
  const [shippingFee, setShippingFee] = useState('')
  const [cancelOrder, setCancelOrder] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  const hasFilters = !!(search || status || paymentStatus || paymentMethod || minAmount || maxAmount || dateFrom || dateTo)
  const queryParams = {
    page,
    limit: LIMIT,
    search: search || undefined,
    status: status || undefined,
    payment_status: paymentStatus || undefined,
    payment_method: paymentMethod || undefined,
    min_amount: minAmount || undefined,
    max_amount: maxAmount || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    sort,
  }

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setPaymentStatus('')
    setPaymentMethod('')
    setSort('newest')
    setMinAmount('')
    setMaxAmount('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-orders', queryParams],
    queryFn: () => adminService.getOrders(queryParams),
    select: (res) => res.data,
    staleTime: 0,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    queryClient.invalidateQueries({ queryKey: ['recent-orders'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  }

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, admin_note }) => adminService.updateOrderStatus(id, { status, admin_note }),
    onSuccess: () => {
      invalidateAll()
      setCancelOrder(null)
      setCancelReason('')
      toast.success('Đã cập nhật trạng thái')
    },
    onError: (error) => toast.error(error.message || 'Có lỗi xảy ra'),
  })

  const addTrackingMutation = useMutation({
    mutationFn: ({ id, tracking_code, shipping_provider, shipping_fee }) =>
      adminService.addTrackingCode(id, { tracking_code, shipping_provider, shipping_fee }),
    onSuccess: () => {
      invalidateAll()
      toast.success('Đã cập nhật mã vận đơn')
      setTrackingOrder(null)
      setTrackingCode('')
      setShippingProvider('giao_hang_tiet_kiem')
      setShippingFee('')
    },
    onError: (error) => toast.error(error.message || 'Có lỗi xảy ra'),
  })

  const openTrackingForm = (order) => {
    if (!['processing', 'shipped'].includes(order.status)) {
      toast.error('Đơn hàng phải đang chuẩn bị hàng trước khi nhập vận chuyển')
      return
    }
    setTrackingOrder(order)
    setTrackingCode(order.tracking_code || '')
    setShippingProvider(order.shipping_provider || order.shipping_method || 'giao_hang_tiet_kiem')
    setShippingFee(order.shipping_cost || '')
  }

  const handleStatusChange = (order, nextStatus) => {
    const allowedStatuses = orderStatusFlow[order.status] || []
    if (nextStatus !== order.status && !allowedStatuses.includes(nextStatus)) {
      toast.error('Không thể chuyển trạng thái ngược hoặc bỏ qua quy trình')
      return false
    }
    if (nextStatus === 'cancelled') {
      if (order.status === 'shipped') {
        const daysSinceShipped = getDaysSince(order.shipped_at)
        if (['pending', 'approved'].includes(order.return_status || '')) {
          toast.error('Đơn đang có yêu cầu đổi trả/khiếu nại, chưa thể hủy do khách chưa nhận')
          return false
        }
        if (daysSinceShipped < ADMIN_DELIVERY_RESOLUTION_DAYS) {
          toast.error(`Chỉ được hủy đơn đang giao sau ${ADMIN_AFTER_ESTIMATE_DAYS} ngày kể từ ngày nhận dự kiến`)
          return false
        }
      }
      setCancelOrder(order)
      setCancelReason('')
      return false
    }
    if (nextStatus === 'shipped' && (!order.tracking_code || !order.shipping_provider)) {
      openTrackingForm(order)
      toast.error('Nhập thông tin vận chuyển trước khi chuyển sang đang giao')
      return false
    }
    if (nextStatus === 'delivered') {
      const daysSinceShipped = getDaysSince(order.shipped_at)
      if (['pending', 'approved'].includes(order.return_status || '')) {
        toast.error('Đơn đang có yêu cầu đổi trả/khiếu nại, chưa thể xác nhận đã giao')
        return false
      }
      if (daysSinceShipped < ADMIN_DELIVERY_RESOLUTION_DAYS) {
        toast.error(`Chỉ được xác nhận đã giao sau ${ADMIN_AFTER_ESTIMATE_DAYS} ngày kể từ ngày nhận dự kiến`)
        return false
      }
      if (!window.confirm('Khách chưa bấm đã nhận. Xác nhận đơn đã giao sau thời hạn quy định?')) {
        return false
      }
    }
    if (nextStatus === 'refunded') {
      toast.error('Hoàn tiền được xử lý tự động qua hủy đơn hoặc yêu cầu trả hàng')
      return false
    }
    updateStatusMutation.mutate({ id: order.id, status: nextStatus })
    return true
  }

  const submitCancelOrder = () => {
    if (!cancelOrder) return
    if (!cancelReason.trim()) {
      toast.error('Nhập lý do hủy đơn từ shop')
      return
    }
    updateStatusMutation.mutate({
      id: cancelOrder.id,
      status: 'cancelled',
      admin_note: `Shop hủy đơn: ${cancelReason.trim()}`,
    })
  }

  return {
    data,
    isLoading,
    isFetching,
    refetch,
    filters: { search, status, paymentStatus, paymentMethod, sort, minAmount, maxAmount, dateFrom, dateTo },
    setters: { setSearch, setStatus, setPaymentStatus, setPaymentMethod, setSort, setMinAmount, setMaxAmount, setDateFrom, setDateTo, setPage },
    showAdvanced,
    setShowAdvanced,
    page,
    setPage,
    hasFilters,
    resetFilters,
    selectedOrder,
    setSelectedOrder,
    trackingOrder,
    setTrackingOrder,
    trackingCode,
    setTrackingCode,
    shippingProvider,
    setShippingProvider,
    shippingFee,
    setShippingFee,
    cancelOrder,
    setCancelOrder,
    cancelReason,
    setCancelReason,
    addTrackingMutation,
    updateStatusMutation,
    openTrackingForm,
    handleStatusChange,
    submitCancelOrder,
    totalPages: data?.pagination?.totalPages || 1,
    totalItems: data?.pagination?.totalItems ?? 0,
  }
}
