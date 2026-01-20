import { baseApi } from './baseApi'
import { domainName } from '../../config/apiConfig'

/**
 * User Role API endpoints
 */
export const userRoleApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUserRoleList: build.query({
      query: (params) => {
        const {
          domainName: domainNameParam,
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getUserRoleList')
        }

        return {
          url: '/secure/userrole/getuserrolelist',
          method: 'GET',
          params: {
            domainName: domainNameParam || domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['UserRole'],
    }),
  }),
  overrideExisting: false,
})

export const { useGetUserRoleListQuery } = userRoleApi
