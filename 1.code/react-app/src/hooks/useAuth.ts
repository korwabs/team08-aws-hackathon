import { useState, useEffect } from 'react'

export function useAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      setIsAuthenticated(true)
    }
  }, [])

  const login = (newToken: string) => {
    setToken(newToken)
    setIsAuthenticated(true)
    localStorage.setItem('token', newToken)
  }

  const logout = () => {
    setToken(null)
    setIsAuthenticated(false)
    localStorage.removeItem('token')
  }

  return { token, isAuthenticated, login, logout }
}
