export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      console.error('Error saving to localStorage')
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      console.error('Error removing from localStorage')
    }
  },

  clear: () => {
    try {
      localStorage.clear()
    } catch {
      console.error('Error clearing localStorage')
    }
  },
}

// Generate session ID for guest cart
export const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId')
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
    localStorage.setItem('sessionId', sessionId)
  }
  return sessionId
}
