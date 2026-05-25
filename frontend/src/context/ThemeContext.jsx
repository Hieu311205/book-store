/**
 * ThemeContext.jsx — Quản lý theme sáng/tối (light/dark mode) toàn cục.
 *
 * VAI TRÒ TRONG KIẾN TRÚC:
 *   Lớp state management đơn giản cho UI theme. Được đặt ở gốc component tree
 *   để mọi component đều có thể đọc theme hiện tại và trigger toggle mà không cần
 *   prop drilling. Tailwind CSS đọc class 'dark' trên <html> để áp dụng dark variant.
 *
 * LUỒNG DỮ LIỆU:
 *   [Khởi tạo]
 *     localStorage('theme')
 *       → có giá trị: dùng theme đã lưu (ưu tiên lựa chọn của user)
 *       → không có:   đọc window.matchMedia('prefers-color-scheme') → theo cài đặt OS
 *     → useState(theme)
 *
 *   [Khi theme thay đổi — useEffect]
 *     theme state
 *       → xóa class 'light'/'dark' cũ khỏi <html>
 *       → thêm class mới (ví dụ: 'dark') lên <html> element
 *         [Tailwind đọc class này để kích hoạt tất cả dark: variant trong toàn bộ CSS]
 *       → localStorage.setItem('theme', theme)
 *         [lưu lại để lần sau tải trang đúng theme, không bị flash]
 *
 *   [Khi user bấm toggle]
 *     toggleTheme() → setTheme('dark' | 'light') → trigger useEffect ở trên
 */

import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  // Lazy initializer — chỉ chạy một lần khi mount, tránh đọc localStorage mỗi render
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored
    // Không có preference đã lưu → theo cài đặt hệ điều hành của user
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement // element <html>
    // Xóa class cũ trước khi thêm mới — tránh tồn tại cả 'light' lẫn 'dark' cùng lúc
    root.classList.remove('light', 'dark')
    // Thêm class vào <html>; Tailwind CSS dùng selector html.dark để kích hoạt dark mode
    root.classList.add(theme)
    // Lưu vào localStorage để lần tải trang tiếp theo khởi tạo đúng theme (tránh flash)
    localStorage.setItem('theme', theme)
  }, [theme])

  /**
   * Chuyển đổi qua lại giữa light và dark theme.
   * Side-effect: cập nhật state → trigger useEffect → thay class trên <html> → lưu localStorage
   */
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook tiện ích để component đọc theme hiện tại và gọi toggleTheme.
 * Trả về: { theme: 'light'|'dark', toggleTheme: () => void }
 */
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
