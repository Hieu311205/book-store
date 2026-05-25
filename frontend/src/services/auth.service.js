/**
 * auth.service.js — Tập hợp các hàm gọi API xác thực người dùng.
 *
 * VAI TRÒ TRONG KIẾN TRÚC:
 *   Lớp service mỏng (thin service layer) nằm giữa AuthContext và tầng HTTP (api.js).
 *   AuthContext gọi các hàm này để thực hiện đăng nhập, đăng ký, lấy thông tin user, v.v.
 *   Mỗi hàm ánh xạ 1-1 với một endpoint REST của backend.
 *
 * LUỒNG DỮ LIỆU:
 *   AuthContext / Component
 *     → authService.xxx(data)
 *       → api.post/get/put('/auth/...')   [api.js thêm JWT header tự động nếu có]
 *         → Backend PHP router → Controller → Response JSON
 *       → Promise<response.data>          [api.js đã unwrap AxiosResponse]
 *     → AuthContext cập nhật state (user, token trong localStorage)
 */

import api from './api'

export const authService = {
  // Đăng nhập bằng email + password; backend trả về { token, user }
  login: (data) => api.post('/auth/login', data),

  // Đăng nhập bằng Google OAuth — gửi Google credential token lên backend để xác minh
  googleLogin: (data) => api.post('/auth/google', data),

  // Đăng ký tài khoản mới; backend tạo user và trả về token ngay (auto-login sau register)
  register: (data) => api.post('/auth/register', data),

  // Đăng xuất — backend hủy refresh token / session phía server nếu có
  logout: () => api.post('/auth/logout'),

  // Lấy thông tin user hiện tại từ JWT trong header; dùng khi khởi động app
  // để xác nhận token còn hợp lệ và lấy dữ liệu user mới nhất
  getMe: () => api.get('/auth/me'),

  // Cập nhật thông tin cá nhân (tên, ảnh đại diện, …); gửi chỉ các trường thay đổi
  updateMe: (data) => api.put('/auth/me', data),

  // Đổi mật khẩu — yêu cầu gửi kèm mật khẩu cũ để xác minh danh tính
  changePassword: (data) => api.put('/auth/password', data),

  // Bước 1 của "quên mật khẩu": gửi email reset link đến địa chỉ email
  forgotPassword: (data) => api.post('/auth/forgot-password', data),

  // Bước 2 của "quên mật khẩu": đặt mật khẩu mới bằng token từ email reset link
  resetPassword: (data) => api.post('/auth/reset-password', data),
}
