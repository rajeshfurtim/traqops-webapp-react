import { baseApi, API_BASE_URL } from './baseApi'
import { domainName } from '../../config/apiConfig'

/** Params for getIndentFilter */
export interface GetIndentFilterParams {
  clientId: string
  fromDate: string
  toDate: string
  pn: number
  ps: number
  type: 'INWARD' | 'OUTWARD'
}

export interface GetInventoryCategoryParams {
  clientId: string | number
  domainName?: string
  pageNumber?: number
  pageSize?: number
}

export interface GetInventoryByCategoryParams {
  categoryId: string | number
  locationId: string | number
}

export interface StockIndentItemDto {
  inventoryId: number
  quantity: number
  inventoryCategoryId: number
  units: string
}

export interface AddOrUpdateStockIndentInwardPayload {
  locationId: number
  indentNumber: string
  date: string
  fromType: number
  statusId: number
  inwardPassByName: string
  inwardPassDateTime: string
  passByRemarks: string
  supplier?: string | null
  address?: string | null
  reason?: string | null
  domainName: string
  clientId: string | number
  type: 'INWARD' | 'OUTWARD'
  outwardReferenceNumber?: string | null
  isReturnableFlag: 'Y' | 'N'
  sequelNumber: string
  stockIndentItemsDtos: StockIndentItemDto[]
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
    getInventoryCategoryList: build.query({
      query: (params: GetInventoryCategoryParams) => {
        const {
          clientId,
          domainName: domainNameParam,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getInventoryCategoryList')
        }

        return {
          url: `${API_BASE_URL}/inventorycatgegory/getallinventorycategory`,
          method: 'GET',
          params: {
            domainName: domainNameParam || domainName,
            clientId: String(clientId),
            pn: String(pageNumber),
            ps: String(pageSize),
          },
        }
      },
      providesTags: ['StockIndent'],
    }),
    getInventoryByCategory: build.query({
      query: (params: GetInventoryByCategoryParams) => ({
        url: `${API_BASE_URL}/category/getinventory/bycategory`,
        method: 'GET',
        params: {
          categoryId: String(params.categoryId),
          locationId: String(params.locationId),
        },
      }),
      providesTags: ['StockIndent'],
    }),
    addOrUpdateStockIndentInward: build.mutation({
      query: (payload: AddOrUpdateStockIndentInwardPayload) => ({
        url: `${API_BASE_URL}/stockIndent/inward/addorupdate`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['StockIndent'],
    }),
    deleteStockIndent: build.mutation({
      query: (id: number | string) => ({
        url: `${API_BASE_URL}/delete/stockindent/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StockIndent'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetIndentFilterQuery,
  useLazyGetIndentFilterQuery,
  useGetInventoryCategoryListQuery,
  useGetInventoryByCategoryQuery,
  useLazyGetInventoryByCategoryQuery,
  useAddOrUpdateStockIndentInwardMutation,
  useDeleteStockIndentMutation,
} = inventoryApi
