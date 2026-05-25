const AI_API_BASE = '/ai'

const parseJson = async (response) => {
  if (!response.ok) {
    throw new Error('Không thể tải dữ liệu AI service')
  }
  return response.json()
}

export const aiService = {
  getSalesOverview: async (days = 30) => {
    const response = await fetch(`${AI_API_BASE}/analytics/overview/?days=${days}`)
    const payload = await parseJson(response)
    return payload.data
  },

  getTopProducts: async (limit = 5) => {
    const response = await fetch(`${AI_API_BASE}/analytics/top-products/?limit=${limit}`)
    const payload = await parseJson(response)
    return payload.data || []
  },
}
