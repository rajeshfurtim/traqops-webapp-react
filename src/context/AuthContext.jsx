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
    // Call real API with domainName automatically included
    const response = await apiService.login(credentials)
    
    // Check if login was successful - this is the critical check
    if (!response.success) {
      const errorMessage = response.message || 'Login failed'
      throw new Error(errorMessage)
    }
    
    // Extract user data from API response structure
    const userInfo = response.data?.userInfo || {}
    const jwt = response.data?.jwt
    const domainModules = response.data?.domainModules || []
    
    // Store JWT token
    if (jwt) {
      localStorage.setItem('jwt', jwt)
    }
    
    // Build user data object
    const userData = {
      id: userInfo.id || response.data?.id || 1,
      userId: userInfo.userCode || userInfo.userName || 'USER0001',
      name: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || userInfo.userName || 'User',
      email: userInfo.email || credentials.email,
      userName: userInfo.userName,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      role: userInfo.userRole?.name || 'User',
      userRole: userInfo.userRole,
      department: userInfo.department,
      location: userInfo.location,
      domain: userInfo.domain,
      client: userInfo.client,
      userMappedLocations: userInfo.userMappedLocations || [],
      domainModules: domainModules,
      jwt: jwt,
      ...userInfo, // Include all userInfo fields
      ...response.data // Include any additional fields from API response
    }
    
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    return Promise.resolve(userData)
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

