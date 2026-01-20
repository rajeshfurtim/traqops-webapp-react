import { baseApi } from './baseApi'

/**
 * Reports API endpoints
 */
export const reportsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Daily Attendance Reports
    getDailyLocationReport: build.query({
      query: (params) => {
        const { date, locationId, userTypeId, clientId } = params

        if (!clientId) {
          throw new Error('ClientId is required for getDailyLocationReport')
        }

        if (!date) {
          throw new Error('Date is required for getDailyLocationReport')
        }

        const queryParams = {
          date,
          clientId: clientId.toString(),
          ...(locationId !== undefined && locationId !== null && { locationId: locationId.toString() }),
          ...(userTypeId !== undefined && userTypeId !== null && { userTypeId: userTypeId.toString() }),
        }

        return {
          url: '/secure/report/dailylocationreport',
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),
  }),
  overrideExisting: false,
})

export const { useGetDailyLocationReportQuery } = reportsApi
