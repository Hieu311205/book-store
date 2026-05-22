import api from './api'

export const categoryService = {
  getCategories: () => api.get('/categories'),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  getCategoryBySlug: (slug) => api.get(`/categories/slug/${slug}`),
  getSubcategories: (id) => api.get(`/categories/${id}/subcategories`),
}
