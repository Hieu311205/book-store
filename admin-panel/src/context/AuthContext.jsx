import { createContext, useContext, useState, useEffect } from 'react'
import { adminService } from '../services/admin.service'
import { ROLE_GROUPS } from '../config/permissions'

const AuthContext = createContext(null)
const adminRoles = ROLE_GROUPS.adminPanel

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const storedUser = localStorage.getItem('admin_user')

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const response = await adminService.login({ email, password })
    if (response.success) {
      const { user, token } = response.data
      if (!adminRoles.includes(user.role)) {
        throw new Error('Bạn không có quyền truy cập')
      }
      localStorage.setItem('admin_token', token)
      localStorage.setItem('admin_user', JSON.stringify(user))
      setUser(user)
    }
    return response
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setUser(null)
  }

  const updateCurrentUser = (nextUser) => {
    localStorage.setItem('admin_user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: adminRoles.includes(user?.role),
    isSuperAdmin: user?.role === 'super_admin',
    login,
    logout,
    updateCurrentUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth phai duoc dung trong AuthProvider')
  return context
}
