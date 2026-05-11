import api from './api'

export const cartService = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart/add', data),
  updateCartItem: (data) => api.put('/cart/update', data),
  removeFromCart: (itemId) => api.delete(`/cart/remove/${itemId}`),
  clearCart: () => api.delete('/cart/clear'),
  getCoupons: () => api.get('/cart/coupons'),
  applyCoupon: (code) => api.post('/cart/apply-coupon', { code }),
}
