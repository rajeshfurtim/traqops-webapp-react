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
    getLocationwise: build.query({
      query: (params) => {
        const { fromDate, toDate, locationId, statusId, clientId } = params

        if (!clientId) {
          throw new Error('ClientId is required for getLocationwise')
        }
        if (!fromDate || !toDate) {
          throw new Error('FromDate and ToDate are required for getLocationwise')
        }

        return {
          url: `${API_BASE_URL}/pmtask/detailreport/locationwise`,
          method: 'GET',
          params: {
            fromDate,
            toDate,
            ...(locationId != null && { locationId: locationId.toString() }),
            ...(statusId != null && { statusId: statusId.toString() }),
            clientId: clientId.toString(),
          },
        }
      },
      providesTags: ['Report'],
    }),
  }),
  overrideExisting: false,
})

export const { useGetFrequencyCountQuery, useGetLocationwiseQuery } = taskReportApi