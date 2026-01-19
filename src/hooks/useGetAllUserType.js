import { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { domainName } from '../config/apiConfig'

export const useGetAllUserType = () => {
  const [userTypes, setUserTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get clientId from user context
        const clientId = user?.client?.id || user?.clientId

        // Get domainName from user context or use default from config
        const domainNameParam = user?.domain?.name || domainName

        if (!clientId) {
          console.warn('ClientId not found in user context')
          setUserTypes([])
          setLoading(false)
          return
        }

        const response = await apiService.getAllUserType({
          domainName: domainNameParam,
          clientId: clientId,
          pageNumber: 1,
          pageSize: 1000
        })

        if (response.success && response.data?.content) {
          // Store full user type objects with id and name
          setUserTypes(response.data.content)
        } else {
          setError(response.message || 'Failed to fetch user types')
          setUserTypes([])
        }
      } catch (err) {
        console.error('Error fetching user types:', err)
        setError(err.message || 'Failed to fetch user types')
        setUserTypes([])
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchUserTypes()
    } else {
      setLoading(false)
    }
  }, [user])

  return { userTypes, loading, error }
}

