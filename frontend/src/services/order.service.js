import api from './api'

export const orderService = {
  createOrder: (data) => api.post('/orders', data),
  getOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  trackOrder: (id) => api.get(`/orders/${id}/track`),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
  confirmReceived: (id) => api.post(`/orders/${id}/confirm-received`),
  requestReturn: (id, data) => api.post(`/orders/${id}/return-request`, data),
}
