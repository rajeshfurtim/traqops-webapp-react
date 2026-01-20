import { baseApi } from './baseApi'
import { domainName } from '../../config/apiConfig'

/**
 * Master Settings API endpoints
 */
export const masterSettingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLocationList: build.query({
      query: (params) => {
        const {
          domainName: domainNameParam,
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getLocationList')
        }

        return {
          url: '/secure/location/getlocationlist',
          method: 'GET',
          params: {
            domainName: domainNameParam || domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['Location'],
    }),

    getAllUserType: build.query({
      query: (params) => {
        const {
          domainName: domainNameParam,
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getAllUserType')
        }

        return {
          url: '/secure/usertype/getallusertype',
          method: 'GET',
          params: {
            domainName: domainNameParam || domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['UserType'],
    }),

    getAllClientList: build.query({
      query: (params = {}) => {
        const { domainName: domainNameParam, pageNumber = 1, pageSize = 1000 } = params

        return {
          url: '/secure/client/getallclientlist',
          method: 'GET',
          params: {
            domainName: domainNameParam || domainName,
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['Client'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetLocationListQuery,
  useGetAllUserTypeQuery,
  useGetAllClientListQuery,
} = masterSettingsApi
