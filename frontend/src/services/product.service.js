/**
 * product.service.js — Tập hợp các hàm gọi API sản phẩm.
 *
 * VAI TRÒ TRONG KIẾN TRÚC:
 *   Lớp service cho domain "sản phẩm". Được gọi bởi các component trang sản phẩm
 *   và React Query hooks. Không giữ state — chỉ là lớp ánh xạ URL thuần túy.
 *
 * LUỒNG DỮ LIỆU:
 *   Component / React Query hook
 *     → productService.xxx(params)
 *       → api.get('/products/...')   [api.js tự gắn JWT + sessionId]
 *         → Backend → truy vấn DB → JSON { data: [...], meta: {...} }
 *       → Promise<response.data>
 *     → React Query cache lưu kết quả, component re-render với data mới
 */

import api from './api'

export const productService = {
  // Lấy danh sách sản phẩm có phân trang + lọc; params có thể chứa: page, limit, category, sort, price_min/max
  getProducts: (params) => api.get('/products', { params }),

  // Lấy chi tiết một sản phẩm theo ID (dùng nội bộ / admin)
  getProductById: (id) => api.get(`/products/${id}`),

  // Lấy chi tiết sản phẩm theo slug thân thiện URL (dùng trên trang chi tiết công khai)
  getProductBySlug: (slug) => api.get(`/products/slug/${slug}`),

  // Lấy danh sách sản phẩm nổi bật (có flag featured=true trong DB), giới hạn số lượng
  getFeaturedProducts: (limit = 8) => api.get('/products/featured', { params: { limit } }),

  // Lấy sản phẩm bán chạy nhất, sắp xếp theo tổng số lượng đã bán
  getBestsellers: (limit = 8) => api.get('/products/bestsellers', { params: { limit } }),

  // Lấy sản phẩm mới nhập, sắp xếp theo ngày tạo giảm dần
  getNewArrivals: (limit = 8) => api.get('/products/new-arrivals', { params: { limit } }),

  // Lấy sản phẩm thuộc một danh mục cụ thể; params hỗ trợ phân trang và lọc thêm
  getProductsByCategory: (categoryId, params) => api.get(`/products/category/${categoryId}`, { params }),

  // Tìm kiếm sản phẩm đầy đủ — trả về danh sách có phân trang, dùng cho trang kết quả tìm kiếm
  searchProducts: (q, params) => api.get('/products/search', { params: { q, ...params } }),

  // Gợi ý sản phẩm nhanh cho autocomplete — chỉ trả về tên + ảnh thumbnail, không phân trang.
  // Được gọi khi user gõ vào ô tìm kiếm (debounced) để hiển thị dropdown gợi ý tức thì.
  // Khác searchProducts ở chỗ: payload nhỏ hơn và endpoint tối ưu cho latency thấp.
  suggestProducts: (q) => api.get('/products/suggest', { params: { q } }),
}
