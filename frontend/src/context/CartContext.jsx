import { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { cartService } from '../services/cart.service'
import { getSessionId } from '../utils/storage'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    getSessionId()
  }, [])

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
    select: (res) => res.data,
  })

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

  const updateCartMutation = useMutation({
    mutationFn: cartService.updateCartItem,
    onSuccess: (res) => {
      queryClient.setQueryData(['cart'], res)
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể cập nhật giỏ hàng')
    },
  })

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

  const clearCartMutation = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: (res) => {
      queryClient.setQueryData(['cart'], res)
      toast.success('Đã xóa toàn bộ giỏ hàng')
    },
  })

  const addToCart = (productId, quantity = 1) => {
    addToCartMutation.mutate({ product_id: productId, quantity })
  }

  const updateQuantity = (productId, quantity) => {
    updateCartMutation.mutate({ product_id: productId, quantity })
  }

  const removeFromCart = (productId) => {
    removeFromCartMutation.mutate(productId)
  }

  const clearCart = () => {
    clearCartMutation.mutate()
  }

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)

  const value = {
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

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart phải được dùng trong CartProvider')
  }
  return context
}
