import { baseApi, API_BASE_URL } from './baseApi'

export interface GetFailureRateSystemParams {
  system: string
  fromDate: string
  toDate: string
  locationId: string | number | Array<string | number>
}

export interface GetTopAssetsFailureParams {
  system: string
  fromDate: string
  toDate: string
  locationId: string | number | Array<string | number>
}

export interface GetTopUsedSparesParams {
  fromDate: string
  toDate: string
  locationIds: string | number | Array<string | number>
}

export interface GetSpareConsumptionByLocationTrendParams {
  fromDate: string
  toDate: string
  locationIds: string | number | Array<string | number>
}

export interface GetLowStockSparesParams {
  locationId: string | number | Array<string | number>
}

export interface GetPmCountByFrequencyParams {
  fromDate: string
  toDate: string
  locationId: string | number | Array<string | number>
  frequencyId: string | number
}

export interface GetCmGraphCountParams {
  clientId: string | number
  locationId: string | number | Array<string | number>
  statusId: string | number
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFailureRateSystem: build.query({
      query: (params: GetFailureRateSystemParams) => {
        const { system, fromDate, toDate, locationId } = params

        if (!system) throw new Error('system is required for getFailureRateSystem')
        if (!fromDate) throw new Error('fromDate is required for getFailureRateSystem')
        if (!toDate) throw new Error('toDate is required for getFailureRateSystem')
        if (!locationId || (Array.isArray(locationId) && locationId.length === 0)) {
          throw new Error('locationId is required for getFailureRateSystem')
        }

        return {
          url: `${API_BASE_URL}/bmrcl/getecsandtvs/failurerateSystem`,
          method: 'GET',
          params: {
            system,
            fromDate,
            toDate,
            locationId: Array.isArray(locationId) ? locationId.join(',') : locationId.toString(),
          },
        }
      },
      providesTags: ['Report'],
    }),

    getTopAssetsFailure: build.query({
      query: (params: GetTopAssetsFailureParams) => {
        const { system, fromDate, toDate, locationId } = params

        if (!system) throw new Error('system is required for getTopAssetsFailure')
        if (!fromDate) throw new Error('fromDate is required for getTopAssetsFailure')
        if (!toDate) throw new Error('toDate is required for getTopAssetsFailure')
        if (!locationId || (Array.isArray(locationId) && locationId.length === 0)) {
          throw new Error('locationId is required for getTopAssetsFailure')
        }

        return {
          url: `${API_BASE_URL}/bmrcl/getecsandtvs/topassetsfailure`,
          method: 'GET',
          params: {
            system,
            fromDate,
            toDate,
            locationId: Array.isArray(locationId) ? locationId.join(',') : locationId.toString(),
          },
        }
      },
      providesTags: ['Report'],
    }),

    getTopUsedSpares: build.query({
      query: (params: GetTopUsedSparesParams) => {
        const { fromDate, toDate, locationIds } = params

        if (!fromDate) throw new Error('fromDate is required for getTopUsedSpares')
        if (!toDate) throw new Error('toDate is required for getTopUsedSpares')
        if (!locationIds || (Array.isArray(locationIds) && locationIds.length === 0)) {
          throw new Error('locationIds is required for getTopUsedSpares')
        }

        return {
          url: `${API_BASE_URL}/bmrcl/gettop/usedspares`,
          method: 'GET',
          params: {
            fromDate,
            toDate,
            locationIds: Array.isArray(locationIds) ? locationIds.join(',') : locationIds.toString(),
          },
        }
      },
      providesTags: ['Report'],
    }),

    getSpareConsumptionByLocationTrend: build.query({
      query: (params: GetSpareConsumptionByLocationTrendParams) => {
        const { fromDate, toDate, locationIds } = params

        if (!fromDate) throw new Error('fromDate is required for getSpareConsumptionByLocationTrend')
        if (!toDate) throw new Error('toDate is required for getSpareConsumptionByLocationTrend')
        if (!locationIds || (Array.isArray(locationIds) && locationIds.length === 0)) {
          throw new Error('locationIds is required for getSpareConsumptionByLocationTrend')
        }

        return {
          url: `${API_BASE_URL}/bmrcl/getspare/consumption/bylocation`,
          method: 'GET',
          params: {
            fromDate,
            toDate,
            locationIds: Array.isArray(locationIds) ? locationIds.join(',') : locationIds.toString(),
          },
        }
      },
      providesTags: ['Report'],
    }),

    getLowStockSpares: build.query({
      query: (params: GetLowStockSparesParams) => {
        const { locationId } = params

        if (!locationId || (Array.isArray(locationId) && locationId.length === 0)) {
          throw new Error('locationId is required for getLowStockSpares')
        }

        return {
          url: `${API_BASE_URL}/bmrcl/getlowstock/spares`,
          method: 'GET',
          params: {
            locationId: Array.isArray(locationId) ? locationId.join(',') : locationId.toString(),
          },
        }
      },
      providesTags: ['Report'],
    }),

    getPmCountByFrequency: build.query({
      query: (params: GetPmCountByFrequencyParams) => {
        const { fromDate, toDate, locationId, frequencyId } = params

        if (!fromDate) throw new Error('fromDate is required for getPmCountByFrequency')
        if (!toDate) throw new Error('toDate is required for getPmCountByFrequency')
        if (!frequencyId && frequencyId !== 0) throw new Error('frequencyId is required for getPmCountByFrequency')
        if (!locationId || (Array.isArray(locationId) && locationId.length === 0)) {
          throw new Error('locationId is required for getPmCountByFrequency')
        }

        return {
          url: `${API_BASE_URL}/dashboard/getpmcount/byfrequency`,
          method: 'GET',
          params: {
            fromDate,
            toDate,
            locationId: Array.isArray(locationId) ? locationId.join(',') : locationId.toString(),
            frequencyId: frequencyId.toString(),
          },
        }
      },
      providesTags: ['Report'],
    }),

    getCmGraphCount: build.query({
      query: (params: GetCmGraphCountParams) => {
        const { clientId, locationId, statusId } = params

        if (!clientId && clientId !== 0) throw new Error('clientId is required for getCmGraphCount')
        if (!statusId && statusId !== 0) throw new Error('statusId is required for getCmGraphCount')
        if (!locationId || (Array.isArray(locationId) && locationId.length === 0)) {
          throw new Error('locationId is required for getCmGraphCount')
        }

        return {
          url: `${API_BASE_URL}/consolidate/cmgraphcount`,
          method: 'GET',
          params: {
            clientId: clientId.toString(),
            locationId: Array.isArray(locationId) ? locationId.join(',') : locationId.toString(),
            statusId: statusId.toString(),
          },
        }
      },
      providesTags: ['Report'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useLazyGetFailureRateSystemQuery,
  useLazyGetTopAssetsFailureQuery,
  useLazyGetTopUsedSparesQuery,
  useLazyGetSpareConsumptionByLocationTrendQuery,
  useLazyGetLowStockSparesQuery,
  useLazyGetPmCountByFrequencyQuery,
  useLazyGetCmGraphCountQuery,
} = dashboardApi

