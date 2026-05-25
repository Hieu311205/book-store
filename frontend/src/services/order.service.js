/**
 * order.service.js — Tập hợp các hàm gọi API đơn hàng.
 *
 * VAI TRÒ TRONG KIẾN TRÚC:
 *   Lớp service cho domain "đơn hàng". Được gọi bởi các component thanh toán,
 *   lịch sử đơn hàng và luồng OTP xác minh. Mọi request đều yêu cầu JWT
 *   (người dùng phải đăng nhập) — api.js tự gắn header.
 *
 * LUỒNG DỮ LIỆU (ví dụ checkout flow với OTP):
 *   CheckoutPage
 *     → orderService.sendOtp()          [bước 1: yêu cầu mã OTP qua email/SMS]
 *       → Backend gửi OTP → hộp thư user
 *     → user nhập OTP vào form
 *     → orderService.createOrder(data)  [bước 2: gửi đơn kèm OTP để xác minh]
 *       → Backend xác minh OTP → tạo đơn → trả về { order_id, ... }
 *     → redirect sang trang xác nhận đơn hàng
 */

import api from './api'

export const orderService = {
  // Tạo đơn hàng mới; data gồm: items, shipping_address, payment_method, otp (nếu bắt buộc)
  createOrder: (data) => api.post('/orders', data),

  // Lấy danh sách đơn hàng của user hiện tại; params hỗ trợ: page, limit, status filter
  getOrders: (params) => api.get('/orders', { params }),

  // Lấy chi tiết một đơn hàng theo ID (bao gồm items, timeline trạng thái, thông tin giao hàng)
  getOrderById: (id) => api.get(`/orders/${id}`),

  // Theo dõi trạng thái giao hàng theo thời gian thực; trả về timeline các mốc vận chuyển
  trackOrder: (id) => api.get(`/orders/${id}/track`),

  // Hủy đơn hàng — chỉ được phép khi đơn ở trạng thái chờ xử lý (pending/processing)
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),

  // Xác nhận đã nhận hàng — chuyển trạng thái từ "đang giao" sang "hoàn thành"
  // Side-effect: mở khóa chức năng đánh giá sản phẩm cho đơn này
  confirmReceived: (id) => api.post(`/orders/${id}/confirm-received`),

  // Gửi yêu cầu trả hàng/hoàn tiền; data gồm: reason, images (bằng chứng), items muốn trả
  requestReturn: (id, data) => api.post(`/orders/${id}/return-request`, data),

  // Bước đầu tiên trong OTP flow trước khi đặt hàng:
  // Backend tạo mã OTP ngẫu nhiên, lưu vào DB có TTL, gửi qua GmailSmtp đến email user.
  // Mã OTP sau đó được user nhập và gửi kèm trong createOrder() để xác minh thanh toán.
  sendOtp: () => api.post('/otp/send'),
}
