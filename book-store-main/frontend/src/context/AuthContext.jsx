import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/auth.service'
import { storage } from '../utils/storage'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = storage.get('user')

    if (token && storedUser) {
      setUser(storedUser)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const response = await authService.login({ email, password })
    if (response.success) {
      localStorage.setItem('token', response.data.token)
      storage.set('user', response.data.user)
      setUser(response.data.user)
    }
    return response
  }

  const register = async (data) => {
    const response = await authService.register(data)
    if (response.success) {
      localStorage.setItem('token', response.data.token)
      storage.set('user', response.data.user)
      setUser(response.data.user)
    }
    return response
  }

  const logout = () => {
    localStorage.removeItem('token')
    storage.remove('user')
    setUser(null)
  }

  const updateUser = (updatedUser) => {
    storage.set('user', updatedUser)
    setUser(updatedUser)
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth phải được dùng trong AuthProvider')
  }
  return context
}
