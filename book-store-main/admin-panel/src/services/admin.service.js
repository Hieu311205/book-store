import api from './api'

export const adminService = {
  // Auth
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getPublicSettings: () => api.get('/settings'),

  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getSalesReport: (period) => api.get('/admin/dashboard/sales', { params: { period } }),
  getRecentOrders: () => api.get('/admin/dashboard/recent-orders'),
  getNotifications: () => api.get('/admin/dashboard/notifications'),
  getContactMessages: () => api.get('/admin/contact-messages'),
  markContactMessageRead: (id) => api.put(`/admin/contact-messages/${id}/read`),
  deleteContactMessage: (id) => api.delete(`/admin/contact-messages/${id}`),

  // Products
  getProducts: (params) => api.get('/admin/products', { params }),
  getProduct: (id) => api.get(`/admin/products/${id}`),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  updateProductStock: (id, stock) => api.put(`/admin/products/${id}/stock`, { stock }),

  // Categories
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // Authors
  getAuthors: () => api.get('/authors'),
  
  // Publishers
  getPublishers: () => api.get('/publishers'),

  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  addTrackingCode: (id, data) => api.put(`/admin/orders/${id}/tracking`, data),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  blockUser: (id) => api.put(`/admin/users/${id}/block`),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),

  // Coupons
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data) => api.post('/admin/coupons', data),
  updateCoupon: (id, data) => api.put(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),

  // Sliders
  getSliders: () => api.get('/admin/sliders'),
  createSlider: (data) => api.post('/admin/sliders', data),
  updateSlider: (id, data) => api.put(`/admin/sliders/${id}`, data),
  deleteSlider: (id) => api.delete(`/admin/sliders/${id}`),

  // Settings
  getSettings: () => api.get('/admin/settings'),
  createSetting: (data) => api.post('/admin/settings', data),
  updateSetting: (id, data) => api.put(`/admin/settings/${id}`, data),
  deleteSetting: (id) => api.delete(`/admin/settings/${id}`),
}
