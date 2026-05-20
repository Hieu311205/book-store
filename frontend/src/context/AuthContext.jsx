import { createContext, useContext, useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authService } from '../services/auth.service'
import { getSessionId, storage } from '../utils/storage'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const token = localStorage.getItem('token')
    const storedUser = storage.get('user')

    if (token && storedUser) {
      setUser(storedUser)
    }

    if (!token) {
      setLoading(false)
      return () => {
        isMounted = false
      }
    }

    authService.getMe()
      .then((response) => {
        if (!isMounted) return
        const freshUser = response.data.user
        storage.set('user', freshUser)
        setUser(freshUser)
      })
      .catch(() => {
        if (!isMounted) return
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

  const login = async (email, password) => {
    const response = await authService.login({ email, password })
    if (response.success) {
      queryClient.clear()
      localStorage.setItem('token', response.data.token)
      storage.set('user', response.data.user)
      setUser(response.data.user)
    }
    return response
  }

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

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('sessionId')
    storage.remove('user')
    queryClient.clear()
    getSessionId()
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
    loginWithGoogle,
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
