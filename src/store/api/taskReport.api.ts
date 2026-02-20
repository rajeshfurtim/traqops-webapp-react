import { baseApi, API_BASE_URL } from './baseApi'

export const taskReportApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFrequencyCount: build.query({
      query: (params) => {
        const { fromDate, toDate, locationId, frequencyId, clientId } = params

        if (!clientId) {
          throw new Error('ClientId is required for getFrequencyCount')
        }
        if (!fromDate || !toDate) {
          throw new Error('FromDate and ToDate are required for getFrequencyCount')
        }

        const queryParams = {
          fromDate,
          toDate,
          ...(locationId != null && { locationId: locationId.toString() }),
          ...(frequencyId != null && { frequencyId: frequencyId.toString() }),
           clientId: clientId.toString(),
        }

        return {
          url: `${API_BASE_URL}/pmreport/summary/getfrequencycount/bylocation`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),
  }),
  overrideExisting: false,
})

export const { useGetFrequencyCountQuery } = taskReportApi