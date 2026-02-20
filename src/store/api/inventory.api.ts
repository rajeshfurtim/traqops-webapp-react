import { baseApi, API_BASE_URL } from './baseApi'

/** Params for getIndentFilter */
export interface GetIndentFilterParams {
  clientId: string
  fromDate: string
  toDate: string
  pn: number
  ps: number
  type: 'INWARD' | 'OUTWARD'
}

/**
 * Inventory API endpoints
 */
export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getIndentFilter: build.query({
      query: (params: GetIndentFilterParams) => ({
        url: `${API_BASE_URL}/stockindent/inward/getIndentfilter`,
        method: 'GET',
        params: {
          clientId: params.clientId,
          fromDate: params.fromDate,
          toDate: params.toDate,
          pn: String(params.pn),
          ps: String(params.ps),
          type: params.type,
        },
      }),
      providesTags: ['StockIndent'],
    }),
  }),
  overrideExisting: false,
})

export const { useGetIndentFilterQuery, useLazyGetIndentFilterQuery } = inventoryApi
