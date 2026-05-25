/**
 * CartContext.jsx — Quản lý trạng thái giỏ hàng toàn cục.
 *
 * VAI TRÒ TRONG KIẾN TRÚC:
 *   Tầng state management cho domain "giỏ hàng". Kết hợp React Context (để chia sẻ state)
 *   với React Query (để cache + sync dữ liệu từ server). Mọi component cần đọc/thao tác
 *   giỏ hàng dùng hook useCart() — không gọi cartService trực tiếp.
 *
 * CHIẾN LƯỢC NHẬN DIỆN USER vs GUEST:
 *   - User đã đăng nhập: backend nhận diện qua JWT header → giỏ hàng gắn với user_id trong DB
 *   - Khách chưa đăng nhập: backend nhận diện qua header 'x-session-id' → giỏ gắn với session_id
 *     Session ID được tạo ngẫu nhiên, lưu localStorage, và gắn vào mọi request qua api.js interceptor.
 *     Khi guest đăng nhập, backend tự động merge giỏ khách vào giỏ tài khoản.
 *
 * LUỒNG DỮ LIỆU (data flow):
 *   [Khởi tạo] getSessionId() → tạo/đọc sessionId từ localStorage
 *   [Đọc giỏ]  React Query → cartService.getCart() → backend → { items, summary }
 *              kết quả cache theo key ['cart'], tự động refetch khi stale
 *   [Thêm/Sửa/Xóa]
 *     Component gọi addToCart / updateQuantity / removeFromCart
 *       → useMutation → cartService.xxx()
 *         → backend cập nhật DB → trả về cart mới
 *       → onSuccess: queryClient.setQueryData(['cart'], res)
 *         [cập nhật cache trực tiếp thay vì refetch — giảm latency, UI phản hồi ngay]
 *       → toast thông báo cho user
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { cartService } from '../services/cart.service'
import { getSessionId } from '../utils/storage'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const queryClient = useQueryClient()
  // isOpen kiểm soát trạng thái mở/đóng của cart drawer/sidebar
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Đảm bảo sessionId tồn tại trong localStorage ngay khi app load —
    // cần thiết để backend nhận diện guest cart ngay từ request đầu tiên
    getSessionId()
  }, [])

  // Truy vấn giỏ hàng hiện tại; React Query tự cache và refetch khi dữ liệu stale.
  // select: chỉ lấy phần data từ response, tránh component phải drill vào res.data
  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
    select: (res) => res.data,
  })

  // Mutation thêm sản phẩm vào giỏ — cập nhật cache trực tiếp (optimistic-like)
  // thay vì invalidate + refetch để tránh delay thấy giỏ bị reset tạm thời
  const addToCartMutation = useMutation({
    mutationFn: cartService.addToCart,
    onSuccess: (res) => {
      queryClient.setQueryData(['cart'], res)
      toast.success('Đã thêm vào giỏ hàng')
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể thêm vào giỏ hàng')
    },
  })

  // Mutation cập nhật số lượng; không toast khi thành công vì UI stepper đã phản hồi trực quan
  const updateCartMutation = useMutation({
    mutationFn: cartService.updateCartItem,
    onSuccess: (res) => {
      queryClient.setQueryData(['cart'], res)
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể cập nhật giỏ hàng')
    },
  })

  // Mutation xóa một sản phẩm khỏi giỏ
  const removeFromCartMutation = useMutation({
    mutationFn: cartService.removeFromCart,
    onSuccess: (res) => {
      queryClient.setQueryData(['cart'], res)
      toast.success('Đã xóa khỏi giỏ hàng')
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể xóa sản phẩm')
    },
  })

  // Mutation xóa toàn bộ giỏ hàng; được gọi sau khi đặt hàng thành công
  const clearCartMutation = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: (res) => {
      queryClient.setQueryData(['cart'], res)
    },
  })

  /**
   * Thêm sản phẩm vào giỏ hàng.
   * Input:  productId — ID sản phẩm; quantity — số lượng (mặc định 1)
   * Output: Promise — resolve với cart data mới; reject nếu hết hàng hoặc lỗi server
   */
  const addToCart = (productId, quantity = 1) => {
    return addToCartMutation.mutateAsync({ product_id: productId, quantity })
  }

  /**
   * Cập nhật số lượng một sản phẩm trong giỏ.
   * Input:  productId — ID sản phẩm; quantity — số lượng mới (nếu = 0, backend tự xóa item)
   */
  const updateQuantity = (productId, quantity) => {
    updateCartMutation.mutate({ product_id: productId, quantity })
  }

  /**
   * Xóa một sản phẩm khỏi giỏ hàng.
   * Input:  productId — ID sản phẩm cần xóa
   */
  const removeFromCart = (productId) => {
    removeFromCartMutation.mutate(productId)
  }

  /**
   * Xóa toàn bộ giỏ hàng.
   * Input:  showToast — có hiện thông báo xác nhận không (false khi gọi sau checkout)
   * Output: Promise — await để đảm bảo giỏ đã trống trước khi redirect
   */
  const clearCart = async (showToast = false) => {
    await clearCartMutation.mutateAsync()
    if (showToast) toast.success('Đã xóa toàn bộ giỏ hàng')
  }

  // Kiểm soát trạng thái cart drawer (sidebar trượt ra từ phải)
  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)

  const value = {
    // Fallback về mảng/object rỗng để component không phải kiểm tra null
    items: cartData?.items || [],
    summary: cartData?.summary || { subtotal: 0, discount: 0, total: 0, item_count: 0 },
    isLoading,
    isOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    openCart,
    closeCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

/**
 * Hook tiện ích để các component con truy cập cart context.
 * Ném lỗi nếu dùng ngoài CartProvider — giúp phát hiện lỗi cấu trúc sớm.
 */
export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart phải được dùng trong CartProvider')
  }
  return context
}
