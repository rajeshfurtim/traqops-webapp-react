import { useGetAllUserTypeQuery } from '../store/api/masterSettings.api'
import { useAuth } from '../context/AuthContext'
import { domainName } from '../config/apiConfig'

export const useGetAllUserType = () => {
  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId
  const domainNameParam = user?.domain?.name || domainName

  const {
    data: response,
    isLoading: loading,
    error: queryError,
  } = useGetAllUserTypeQuery(
    {
      domainName: domainNameParam,
      clientId: clientId,
      pageNumber: 1,
      pageSize: 1000,
    },
    {
      skip: !clientId, // Skip query if no clientId
    }
  )

  const userTypes = response?.success && response?.data?.content ? response.data.content : []
  const error = queryError ? (queryError.message || 'Failed to fetch user types') : null

  return { userTypes, loading, error }
}

