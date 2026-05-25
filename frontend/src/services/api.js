/**
 * api.js — Axios instance trung tâm, dùng chung cho toàn bộ frontend.
 *
 * VAI TRÒ TRONG KIẾN TRÚC:
 *   Tầng giao tiếp HTTP duy nhất giữa React app và backend REST API (/api/v1).
 *   Tất cả service file (auth.service, product.service, order.service, …) đều
 *   import instance này thay vì tạo axios riêng — đảm bảo mọi request đều
 *   đi qua cùng một điểm interceptor.
 *
 * LUỒNG DỮ LIỆU (data flow):
 *
 *   [Service gọi api.get/post]
 *     → Request interceptor
 *         đọc localStorage('token')    → gắn header Authorization: Bearer <JWT>
 *         đọc localStorage('sessionId') → gắn header x-session-id (nhận diện giỏ hàng khách)
 *     → HTTP request đến /api/v1/...
 *     → Response interceptor
 *         thành công  → unwrap response.data (caller nhận trực tiếp phần data, không phải AxiosResponse)
 *         lỗi 401     → xóa token + user khỏi localStorage, redirect về /login
 *         lỗi khác    → chuẩn hóa message lỗi (kèm debug info nếu có), reject Promise
 */

import axios from 'axios'

const API_URL = '/api/v1'

// Tạo instance riêng thay vì dùng axios global — tránh ảnh hưởng đến các thư viện
// bên thứ ba cũng dùng axios trong cùng bundle
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request interceptor ────────────────────────────────────────────────────
// Chạy trước MỖI request; mục đích: tự động gắn thông tin xác thực mà không cần
// từng service phải truyền token thủ công.
api.interceptors.request.use(
  (config) => {
    // Nếu user đã đăng nhập, gắn JWT vào header — backend dùng để xác minh danh tính
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // session_id định danh giỏ hàng của khách chưa đăng nhập (guest cart).
    // Khi user đăng nhập, backend sẽ merge giỏ khách vào giỏ của tài khoản.
    const sessionId = localStorage.getItem('sessionId')
    if (sessionId) {
      config.headers['x-session-id'] = sessionId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ─── Response interceptor ───────────────────────────────────────────────────
// Chạy sau KHI nhận response; mục đích: chuẩn hóa dữ liệu trả về và xử lý
// các lỗi HTTP toàn cục thay vì xử lý rải rác trong từng component.
api.interceptors.response.use(
  // Unwrap AxiosResponse: caller nhận thẳng response.data thay vì phải gọi res.data mỗi lần
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ → xóa thông tin đăng nhập cục bộ
      // và ép user về trang login để lấy token mới
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    const data = error.response?.data || {}
    // In development: append debug info to message so devs can see the root cause
    // data.debug chỉ có trong môi trường dev; production backend không trả về trường này
    const message = data.debug
      ? `${data.message || 'Lỗi máy chủ'}: ${data.debug}`
      : data.message || error.message
    // Trả về object lỗi chuẩn hóa — caller chỉ cần đọc .message và .status
    return Promise.reject({
      ...data,
      message,
      status: error.response?.status,
      originalError: error,
    })
  }
)

export default api
