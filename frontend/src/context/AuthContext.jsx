/**
 * AuthContext.jsx — Quản lý trạng thái xác thực (auth state) toàn cục cho toàn bộ React app.
 *
 * VAI TRÒ TRONG KIẾN TRÚC:
 *   Tầng state management cho domain "người dùng". Là nguồn sự thật duy nhất (single source
 *   of truth) về: ai đang đăng nhập, token JWT, và quyền admin. Mọi component cần thông tin
 *   user đều dùng hook useAuth() thay vì đọc localStorage trực tiếp.
 *
 * LUỒNG DỮ LIỆU KHI KHỞI ĐỘNG APP:
 *   localStorage('token') + localStorage('user')
 *     → [có token] setUser(storedUser) ngay lập tức (UI không bị flash)
 *     → authService.getMe()  [gọi backend xác minh token còn hợp lệ]
 *       → thành công: cập nhật user với dữ liệu mới nhất từ server
 *       → thất bại:   xóa token + user khỏi localStorage, setUser(null)
 *     → setLoading(false)   [app mới bắt đầu render các protected route]
 *
 * LUỒNG ĐĂNG NHẬP (login / loginWithGoogle / register):
 *   Component gọi login(email, password)
 *     → authService.login() → backend trả { token, user }
 *     → queryClient.clear()   [xóa cache cũ của React Query để tránh dữ liệu chồng chéo]
 *     → lưu token + user vào localStorage
 *     → setUser(user)  [trigger re-render toàn bộ component dùng useAuth()]
 *
 * LUỒNG ĐĂNG XUẤT:
 *   logout()
 *     → xóa token, sessionId, user khỏi localStorage
 *     → queryClient.clear()  [xóa toàn bộ cache React Query]
 *     → getSessionId()       [tạo sessionId mới cho guest cart]
 *     → setUser(null)
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authService } from '../services/auth.service'
import { getSessionId, storage } from '../utils/storage'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  // loading=true trong khi đang xác minh token với backend; dùng để chặn render các protected route
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Flag tránh setState sau khi component unmount (race condition khi hot-reload)
    let isMounted = true
    const token = localStorage.getItem('token')
    const storedUser = storage.get('user')

    // Hiển thị user đã lưu ngay lập tức để tránh flash "chưa đăng nhập" khi tải trang
    if (token && storedUser) {
      setUser(storedUser)
    }

    // Không có token → chắc chắn chưa đăng nhập, dừng sớm để không gọi API không cần thiết
    if (!token) {
      setLoading(false)
      return () => {
        isMounted = false
      }
    }

    // Gọi /auth/me để xác minh token còn sống và lấy dữ liệu user mới nhất từ DB
    authService.getMe()
      .then((response) => {
        if (!isMounted) return
        const freshUser = response.data.user
        // Đồng bộ localStorage với dữ liệu mới nhất (ví dụ: tên/avatar vừa đổi trên thiết bị khác)
        storage.set('user', freshUser)
        setUser(freshUser)
      })
      .catch(() => {
        if (!isMounted) return
        // Token hết hạn hoặc bị thu hồi → dọn sạch phiên làm việc cũ
        localStorage.removeItem('token')
        storage.remove('user')
        setUser(null)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  /**
   * Đăng nhập bằng email/password.
   * Input:  email, password (string)
   * Output: Promise<response> — caller có thể đọc response.success để điều hướng
   * Side-effect: cập nhật localStorage và React state; xóa toàn bộ React Query cache
   */
  const login = async (email, password) => {
    const response = await authService.login({ email, password })
    if (response.success) {
      // Xóa cache cũ trước khi set user mới — tránh component khác thấy dữ liệu của user cũ
      queryClient.clear()
      localStorage.setItem('token', response.data.token)
      storage.set('user', response.data.user)
      setUser(response.data.user)
    }
    return response
  }

  /**
   * Đăng nhập bằng Google OAuth (Google One Tap hoặc Sign-In button).
   * Input:  credential — JWT token do Google cấp sau khi user chọn tài khoản Google
   * Output: Promise<response>
   * Side-effect: tương tự login() — backend xác minh credential với Google API rồi trả token nội bộ
   */
  const loginWithGoogle = async (credential) => {
    const response = await authService.googleLogin({ credential })
    if (response.success) {
      queryClient.clear()
      localStorage.setItem('token', response.data.token)
      storage.set('user', response.data.user)
      setUser(response.data.user)
    }
    return response
  }

  /**
   * Đăng ký tài khoản mới.
   * Input:  data — { name, email, password, ... }
   * Output: Promise<response>
   * Side-effect: backend tạo user và trả token ngay → tự động đăng nhập sau khi register
   */
  const register = async (data) => {
    const response = await authService.register(data)
    if (response.success) {
      queryClient.clear()
      localStorage.setItem('token', response.data.token)
      storage.set('user', response.data.user)
      setUser(response.data.user)
    }
    return response
  }

  /**
   * Đăng xuất — xóa toàn bộ phiên làm việc phía client.
   * Side-effect:
   *   - Xóa token, sessionId, user khỏi localStorage
   *   - Clear React Query cache (tránh dữ liệu private còn sót trong bộ nhớ)
   *   - Tạo sessionId mới cho guest cart (user tiếp tục mua hàng mà không cần đăng nhập)
   *   - setUser(null) → trigger redirect về trang công khai
   */
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('sessionId')
    storage.remove('user')
    queryClient.clear()
    // Khởi tạo sessionId mới ngay để guest cart hoạt động sau khi logout
    getSessionId()
    setUser(null)
  }

  /**
   * Cập nhật thông tin user trong state và localStorage (dùng sau khi user chỉnh sửa profile).
   * Input:  updatedUser — object user mới (đã được merge bởi caller)
   * Side-effect: đồng bộ localStorage để tránh mất dữ liệu khi refresh trang
   */
  const updateUser = (updatedUser) => {
    storage.set('user', updatedUser)
    setUser(updatedUser)
  }

  const value = {
    user,
    loading,
    // Computed shortcuts để component không phải tự kiểm tra !!user hay user?.role
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook tiện ích để các component con truy cập auth context.
 * Ném lỗi nếu dùng ngoài AuthProvider — phát hiện sớm lỗi cấu trúc component tree.
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth phải được dùng trong AuthProvider')
  }
  return context
}
