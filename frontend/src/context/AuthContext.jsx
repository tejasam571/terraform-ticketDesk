import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('tickette_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('tickette_token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user)
        localStorage.setItem('tickette_user', JSON.stringify(data.user))
      })
      .catch(() => {
        localStorage.removeItem('tickette_token')
        localStorage.removeItem('tickette_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('tickette_token', data.token)
    localStorage.setItem('tickette_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('tickette_token')
    localStorage.removeItem('tickette_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
