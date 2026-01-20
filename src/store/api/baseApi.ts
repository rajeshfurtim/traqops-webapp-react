import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { apiBaseUrl } from '../../config/apiConfig'

/**
 * Base API configuration for RTK Query
 * All API endpoints extend from this base
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers, { getState }) => {
      // Get JWT token from localStorage
      const jwt = localStorage.getItem('jwt')
      if (jwt) {
        headers.set('authorization', `Bearer ${jwt}`)
      }
      // Set content type
      headers.set('content-type', 'application/json')
      return headers
    },
  }),
  tagTypes: [
    'Auth',
    'UserRole',
    'Location',
    'ScheduleMaintenance',
    'CorrectiveMaintenance',
    'Inventory',
    'Category',
    'Checklist',
    'Frequency',
    'Shift',
    'CustomFrequency',
    'Client',
    'UserType',
    'Report',
    'Document',
    'MasterSettings',
  ],
  endpoints: () => ({}),
})
