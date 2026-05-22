// frontend/src/services/aiApi.js
const AI_API_BASE = '/ai';

// Hàm gọi API lấy gợi ý cho user
export const getUserRecommendations = async (token, limit = 6) => {
  const res = await fetch(`${AI_API_BASE}/recommendations/user/?limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};

// Hàm lấy tổng quan doanh thu (admin)
export const getSalesOverview = async (token, days = 30) => {
  const res = await fetch(`${AI_API_BASE}/analytics/overview/?days=${days}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};

// Hàm lấy top sản phẩm bán chạy
export const getTopProducts = async (token, limit = 5) => {
  const res = await fetch(`${AI_API_BASE}/analytics/top-products/?limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};