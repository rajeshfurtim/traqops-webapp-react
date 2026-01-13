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
    const fetchLocations = async () => {
      try {
        setLoading(true)
        setError(null)
        const clientId = user?.client?.id || user?.clientId
        const domainNameParam = user?.domain?.name || domainName

        if (!clientId) {
          console.warn('ClientId not found in user context')
          setLocations([])
          setLoading(false)
          return
        }

        const response = await apiService.getLocationList({
          domainName: domainNameParam,
          clientId: clientId,
          pageNumber: 1,
          pageSize: 1000
        })

        if (response.success && response.data?.content) {
          const locationNames = response.data.content.map(location => location.name)
          setLocations(locationNames)
        } else {
          setError(response.message || 'Failed to fetch locations')
          setLocations([])
        }
      } catch (err) {
        console.error('Error fetching locations:', err)
        setError(err.message || 'Failed to fetch locations')
        setLocations([])
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchLocations()
    } else {
      setLoading(false)
    }
  }, [user])

  return { locations, loading, error }
}

