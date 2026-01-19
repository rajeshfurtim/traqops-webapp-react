import { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { domainName } from '../config/apiConfig'

export const useGetLocationList = () => {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    let isMounted = true
    let abortController = new AbortController()

    const fetchLocations = async () => {
      try {
        if (isMounted) {
          setLoading(true)
          setError(null)
        }
        
        const clientId = user?.client?.id || user?.clientId
        const domainNameParam = user?.domain?.name || domainName

        if (!clientId) {
          if (isMounted) {
            setLocations([])
            setLoading(false)
          }
          return
        }

        const response = await apiService.getLocationList({
          domainName: domainNameParam,
          clientId: clientId,
          pageNumber: 1,
          pageSize: 1000
        })

        if (isMounted && !abortController.signal.aborted) {
          if (response.success && response.data?.content) {
            // Store full location objects with id and name
            setLocations(response.data.content)
          } else {
            setError(response.message || 'Failed to fetch locations')
            setLocations([])
          }
          setLoading(false)
        }
      } catch (err) {
        if (isMounted && !abortController.signal.aborted) {
          setError(err.message || 'Failed to fetch locations')
          setLocations([])
          setLoading(false)
        }
      }
    }

    if (user?.client?.id || user?.clientId) {
      fetchLocations()
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

  return { locations, loading, error }
}

