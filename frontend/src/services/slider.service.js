import api from './api'

export const sliderService = {
  getSliders: () => api.get('/sliders'),
}
