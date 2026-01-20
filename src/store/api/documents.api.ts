import { baseApi } from './baseApi'

/**
 * Documents API endpoints
 */
export const documentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Add document endpoints here when available
  }),
  overrideExisting: false,
})

// Export hooks when endpoints are added
// export const { useGetDocumentsQuery } = documentsApi
