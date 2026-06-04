import api from './api'

export const adminService = {
  // Auth
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getPublicSettings: () => api.get('/settings'),

  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getSalesReport: (params = {}) => api.get('/admin/dashboard/sales', {
    params: typeof params === 'string' ? { period: params } : params,
  }),
  getRecentOrders: () => api.get('/admin/dashboard/recent-orders'),
  getNotifications: () => api.get('/admin/dashboard/notifications'),
  getInventoryReport: (params = {}) => api.get('/admin/dashboard/inventory', { params }),
  getContactMessages: () => api.get('/admin/contact-messages'),
  markContactMessageRead: (id) => api.put(`/admin/contact-messages/${id}/read`),
  deleteContactMessage: (id) => api.delete(`/admin/contact-messages/${id}`),

  // Products
  getProducts: (params) => api.get('/admin/products', { params }),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  updateProductStock: (id, stock) => api.put(`/admin/products/${id}/stock`, { stock }),
  uploadProductPreviews: (id, data) => api.post(`/admin/products/${id}/previews`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateProductPreview: (productId, previewId, data) => api.put(`/admin/products/${productId}/previews/${previewId}`, data),
  deleteProductPreview: (productId, previewId) => api.delete(`/admin/products/${productId}/previews/${previewId}`),
  uploadProductCover: (data) => api.post('/admin/products/cover', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Categories
  getCategories: (params) => api.get('/admin/categories', { params }),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // Authors (public list for dropdowns)
  getAuthors: (params) => api.get('/authors', { params }),

  // Authors admin CRUD
  getAdminAuthors: (params) => api.get('/admin/authors', { params }),
  createAuthor: (data) => api.post('/admin/authors', data),
  updateAuthor: (id, data) => api.put(`/admin/authors/${id}`, data),
  deleteAuthor: (id) => api.delete(`/admin/authors/${id}`),

  // Publishers (public list for dropdowns)
  getPublishers: (params) => api.get('/publishers', { params }),

  // Publishers admin CRUD
  getAdminPublishers: (params) => api.get('/admin/publishers', { params }),
  createPublisher: (data) => api.post('/admin/publishers', data),
  updatePublisher: (id, data) => api.put(`/admin/publishers/${id}`, data),
  deletePublisher: (id) => api.delete(`/admin/publishers/${id}`),

  // Inventory
  getInventory: (params) => api.get('/admin/inventory', { params }),
  bulkUpdateStock: (items) => api.put('/admin/inventory/bulk', { items }),
  importStock: (data) => api.post('/admin/inventory/import', data),
  getImportHistory: (params) => api.get('/admin/inventory/history', { params }),

  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  updatePaymentStatus: (id, data) => api.put(`/admin/orders/${id}/payment-status`, data),
  addTrackingCode: (id, data) => api.put(`/admin/orders/${id}/tracking`, data),
  updateReturnRequest: (id, data) => api.put(`/admin/return-requests/${id}`, data),

  // Payment simulation
  getPayments: (params) => api.get('/admin/payments', { params }),
  simulatePaymentWebhook: (id, status) => api.post(`/admin/payments/${id}/simulate`, { status }),

  // Wallets
  getWalletTransactions: (params) => api.get('/admin/wallets', { params }),
  updateWalletTransaction: (id, data) => api.put(`/admin/wallets/transactions/${id}`, data),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  blockUser: (id) => api.put(`/admin/users/${id}/block`),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),

  // Coupons
  getCoupons: (params) => api.get('/admin/coupons', { params }),
  createCoupon: (data) => api.post('/admin/coupons', data),
  updateCoupon: (id, data) => api.put(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),

  // Sliders
  getSliders: () => api.get('/admin/sliders'),
  createSlider: (data) => api.post('/admin/sliders', data),
  updateSlider: (id, data) => api.put(`/admin/sliders/${id}`, data),
  deleteSlider: (id) => api.delete(`/admin/sliders/${id}`),

  // Combos
  getCombos: () => api.get('/admin/combos'),
  getCombo: (id) => api.get(`/admin/combos/${id}`),
  createCombo: (data) => api.post('/admin/combos', data),
  updateCombo: (id, data) => api.put(`/admin/combos/${id}`, data),
  deleteCombo: (id) => api.delete(`/admin/combos/${id}`),

  // Settings
  getSettings: () => api.get('/admin/settings'),
  createSetting: (data) => api.post('/admin/settings', data),
  updateSetting: (id, data) => api.put(`/admin/settings/${id}`, data),
  uploadBankQr: (data) => api.post('/admin/settings/qr', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteSetting: (id) => api.delete(`/admin/settings/${id}`),
}
