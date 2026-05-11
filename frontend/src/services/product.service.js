import api from './api'

export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getProductBySlug: (slug) => api.get(`/products/slug/${slug}`),
  getFeaturedProducts: (limit = 8) => api.get('/products/featured', { params: { limit } }),
  getBestsellers: (limit = 8) => api.get('/products/bestsellers', { params: { limit } }),
  getNewArrivals: (limit = 8) => api.get('/products/new-arrivals', { params: { limit } }),
  getProductsByCategory: (categoryId, params) => api.get(`/products/category/${categoryId}`, { params }),
  searchProducts: (q, params) => api.get('/products/search', { params: { q, ...params } }),
}
