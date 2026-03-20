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
  }),
  overrideExisting: false,
})

export const { useLazyGetFailureRateSystemQuery, useLazyGetTopAssetsFailureQuery } = dashboardApi

