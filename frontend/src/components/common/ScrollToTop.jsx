import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Tự động cuộn về đầu trang mỗi khi route thay đổi
const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default ScrollToTop
