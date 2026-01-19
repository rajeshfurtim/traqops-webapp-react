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
    let isMounted = true
    let abortController = new AbortController()

    const fetchUserTypes = async () => {
      try {
        if (isMounted) {
          setLoading(true)
          setError(null)
        }

        // Get clientId from user context
        const clientId = user?.client?.id || user?.clientId

        // Get domainName from user context or use default from config
        const domainNameParam = user?.domain?.name || domainName

        if (!clientId) {
          if (isMounted) {
            setUserTypes([])
            setLoading(false)
          }
          return
        }

        const response = await apiService.getAllUserType({
          domainName: domainNameParam,
          clientId: clientId,
          pageNumber: 1,
          pageSize: 1000
        })

        if (isMounted && !abortController.signal.aborted) {
          if (response.success && response.data?.content) {
            // Store full user type objects with id and name
            setUserTypes(response.data.content)
          } else {
            setError(response.message || 'Failed to fetch user types')
            setUserTypes([])
          }
          setLoading(false)
        }
      } catch (err) {
        if (isMounted && !abortController.signal.aborted) {
          setError(err.message || 'Failed to fetch user types')
          setUserTypes([])
          setLoading(false)
        }
      }
    }

    if (user?.client?.id || user?.clientId) {
      fetchUserTypes()
    } else {
      if (isMounted) {
        setLoading(false)
      }
    }

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [user?.client?.id, user?.clientId, user?.domain?.name])

  return { userTypes, loading, error }
}

