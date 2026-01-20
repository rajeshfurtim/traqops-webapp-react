import { baseApi } from './baseApi'

/**
 * Inventory API endpoints
 */
export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Add inventory endpoints here when available
  }),
  overrideExisting: false,
})

// Export hooks when endpoints are added
// export const { useGetInventoryQuery } = inventoryApi
