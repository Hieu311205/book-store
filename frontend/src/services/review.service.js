/**
 * review.service.js — Tập hợp các hàm gọi API đánh giá sản phẩm.
 *
 * VAI TRÒ TRONG KIẾN TRÚC:
 *   Lớp service cho domain "đánh giá". Nằm giữa các component review UI và
 *   tầng HTTP (api.js). Kết hợp với React Query: các hàm get* dùng làm
 *   queryFn, các hàm thay đổi dữ liệu (submitReview, markHelpful) dùng làm mutationFn.
 *
 * LUỒNG DỮ LIỆU (ví dụ luồng viết đánh giá):
 *   Trang chi tiết sản phẩm
 *     → reviewService.checkCanReview(productId)
 *         Backend kiểm tra: user đã mua và đã nhận sản phẩm này chưa
 *         → { canReview: true/false, reason: '...' }
 *     → [Nếu canReview] Hiện form đánh giá
 *     → reviewService.submitReview(data)
 *         data: { product_id, rating, comment }
 *         → Backend lưu review → cập nhật rating trung bình sản phẩm
 *     → React Query invalidate cache 'reviews' → danh sách review tự refresh
 */

import api from './api'

export const reviewService = {
  // Lấy danh sách đánh giá của một sản phẩm; params hỗ trợ: page, limit, sort (newest/helpful)
  getProductReviews: (productId, params) =>
    api.get(`/reviews/product/${productId}`, { params }),

  // Kiểm tra user hiện tại có quyền đánh giá sản phẩm không.
  // Điều kiện backend: user đã đặt đơn hàng chứa sản phẩm này VÀ đơn đã ở trạng thái "hoàn thành".
  // Dùng để ẩn/hiện nút "Viết đánh giá" mà không cần đợi lỗi từ submitReview.
  checkCanReview: (productId) =>
    api.get(`/reviews/check/${productId}`),

  // Lấy tất cả đánh giá mà user hiện tại đã viết (dùng trên trang "Đánh giá của tôi")
  getMyReviews: () =>
    api.get('/reviews/my'),

  // Gửi đánh giá mới; data gồm: product_id, rating (1-5), comment (text), images (tùy chọn)
  // Side-effect: backend cập nhật lại rating trung bình và số lượng đánh giá của sản phẩm
  submitReview: (data) =>
    api.post('/reviews', data),

  // Đánh dấu một review là "hữu ích" (helpful vote).
  // Dùng để sắp xếp review: review nhiều vote hữu ích hiển thị lên trên.
  // Backend ngăn user vote chính review của mình và vote nhiều lần.
  markHelpful: (reviewId) =>
    api.post(`/reviews/${reviewId}/helpful`),
}
