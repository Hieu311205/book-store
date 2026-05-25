import api from './api'

export const aiService = {
  getRecommendations: (userId) => api.post('/api/v2/recommend', { user_id: userId }),
  getAnalytics: () => api.get('/api/v2/analytics'),
}