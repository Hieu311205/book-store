import api from './api'

export const userService = {
  // Addresses
  getAddresses: () => api.get('/users/addresses'),
  createAddress: (data) => api.post('/users/addresses', data),
  updateAddress: (id, data) => api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
  setDefaultAddress: (id) => api.put(`/users/addresses/${id}/set-default`),

  // Wishlist
  getWishlist: () => api.get('/users/wishlist'),
  addToWishlist: (productId) => api.post(`/users/wishlist/add/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/users/wishlist/remove/${productId}`),
}
