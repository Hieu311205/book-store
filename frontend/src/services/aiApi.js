const AI_API_BASE = '/ai'

const parseJson = async (response) => {
  if (!response.ok) {
    throw new Error('Không thể tải dữ liệu AI service')
  }
  return response.json()
}

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {})

export const getUserRecommendations = async ({ token, userId, limit = 6 }) => {
  const response = await fetch(`${AI_API_BASE}/recommendations/user/?user_id=${userId}&limit=${limit}`, {
    headers: authHeaders(token),
  })
  const payload = await parseJson(response)
  return payload.data || []
}

export const getSalesOverview = async (token, days = 30) => {
  const response = await fetch(`${AI_API_BASE}/analytics/overview/?days=${days}`, {
    headers: authHeaders(token),
  })
  const payload = await parseJson(response)
  return payload.data
}

export const getTopProducts = async (token, limit = 5) => {
  const response = await fetch(`${AI_API_BASE}/analytics/top-products/?limit=${limit}`, {
    headers: authHeaders(token),
  })
  const payload = await parseJson(response)
  return payload.data || []
}

export const getSupportFaq = async (limit) => {
  const params = limit ? `?limit=${limit}` : ''
  const response = await fetch(`${AI_API_BASE}/support/faq/${params}`)
  const payload = await parseJson(response)
  return payload.data || []
}
