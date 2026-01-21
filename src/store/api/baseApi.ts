import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Environment-based API base URL
// .env.development → VITE_API_BASE_URL=/secure
// .env.production  → VITE_API_BASE_URL=https://voltas.traqops.com/secure
// Default to '/secure' so local dev still works even if env is missing
export const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || '/secure'

/**
 * Base API configuration for RTK Query
 * All API endpoints extend from this base
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '',
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
