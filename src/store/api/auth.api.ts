import { baseApi } from './baseApi'
import { domainName } from '../../config/apiConfig'

/**
 * Authentication API endpoints
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation({
      query: (credentials) => ({
        url: '/unsecure/domainlogin',
        method: 'POST',
        body: {
          email: credentials.email,
          password: credentials.password,
          domainName: domainName,
          emailLogin: true,
        },
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
  overrideExisting: false,
})

export const { useLoginMutation } = authApi
