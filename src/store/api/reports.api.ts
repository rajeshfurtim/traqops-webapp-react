import { baseApi, API_BASE_URL } from './baseApi'

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
          url: `${API_BASE_URL}/report/dailylocationreport`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

    getMonthlyEmployeeReport: build.query({
      query: (params) => {
        const { fromDate, toDate, locationId, userTypeId, clientId } = params

        if (!clientId) {
          throw new Error('ClientId is required for getMonthlyEmployeeReport')
        }

        if (!fromDate || !toDate) {
          throw new Error('Month is required for getMonthlyEmployeeReport')
        }

        const queryParams = {
          fromDate,
          toDate,
          clientId: clientId.toString(),
          locationId: Array.isArray(locationId) ? locationId.join(',') : locationId?.toString(),
          userTypeId: userTypeId?.toString() ?? '-1',
        }

        return {
          url: `${API_BASE_URL}/report/locationwise/monthlyreport`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

    getConsolidateManpowerReport: build.query({
      query: (params) => {
        const { fromDate, toDate, userTypeId, clientId } = params

        if (!clientId) {
          throw new Error('ClientId is required for getConsolidateManpowerReport')
        }

        if (!fromDate || !toDate) {
          throw new Error('From Date and To Date are required for getConsolidateManpowerReport')
        }

        const queryParams = {
          fromDate,
          toDate,
          clientId: clientId.toString(),
          userTypeId: userTypeId?.toString() ?? '-1',
        }

        return {
          url: `${API_BASE_URL}/reports/consolidatemanpower/byusertype`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

  }),
  overrideExisting: false,
})

export const { useGetDailyLocationReportQuery, useGetMonthlyEmployeeReportQuery, useGetConsolidateManpowerReportQuery } = reportsApi
