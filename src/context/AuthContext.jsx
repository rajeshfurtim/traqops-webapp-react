import { createContext, useContext, useState, useEffect } from 'react'
import { apiService } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (credentials) => {
    try {
      // Call real API with domainName automatically included
      const response = await apiService.login(credentials)
      
      // Extract user data from API response
      // Adjust these fields based on your actual API response structure
      const userData = {
        id: response.data?.id || response.data?.userId || 1,
        userId: response.data?.userId || 'USER0001',
        name: response.data?.name || response.data?.userName || 'User',
        email: credentials.email,
        role: response.data?.role || 'User',
        department: response.data?.department || 'General',
        status: response.data?.status || 'Active',
        ...response.data // Include any additional fields from API
      }
      
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return Promise.resolve(userData)
    } catch (error) {
      // If API call fails, fall back to mock login for development
      // Remove this fallback in production
      if (import.meta.env.DEV) {
        console.warn('API login failed, using mock login:', error)
        const mockUser = {
          id: 1,
          userId: 'USER0001',
          name: 'Admin User',
          email: credentials.email || 'admin@traqops.com',
          role: 'Admin',
          department: 'Administration',
          status: 'Active'
        }
        setUser(mockUser)
        localStorage.setItem('user', JSON.stringify(mockUser))
        return Promise.resolve(mockUser)
      }
      // In production, re-throw the error
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

