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
  toggleWishlistNotify: (productId) => api.put(`/users/wishlist/notify/${productId}`),

  // Wallet
  getWallet: (params) => api.get('/wallet', { params }),
  linkBankAccount: (data) => api.post('/wallet/bank-accounts', data),
  deleteBankAccount: (id) => api.delete(`/wallet/bank-accounts/${id}`),
  depositWallet: (data) => api.post('/wallet/deposit', data),
  withdrawWallet: (data) => api.post('/wallet/withdraw', data),
  sendWalletOtp: (purpose) => api.post('/otp/send', { purpose }),
}
