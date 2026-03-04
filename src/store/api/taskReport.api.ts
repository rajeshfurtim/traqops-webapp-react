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


    getLocationwiseSheduled: build.query({
      query: (params) => {
        const { clientId, locationId, pn, ps } = params

        if (!clientId) {
          throw new Error('ClientId is required for getLocationwiseSheduled')
        }
        if (!locationId) {
          throw new Error('LocationId is required for getLocationwiseSheduled')
        }

        return {
          url: `${API_BASE_URL}/assets/getassetsfilter/locationwise`,
          method: 'GET',
          params: {
            locationId: Array.isArray(locationId) ? locationId.join(',') : locationId.toString(),
            clientId: clientId.toString(),
            ...(pn != null && { pn: pn.toString() }),
            ...(ps != null && { ps: ps.toString() }),
          },
        }
      },
      providesTags: ['Report'],
    }),


    getconsolitadeReport: build.query({
      query: (params) => {
        const { fromDate, toDate, locationId } = params
        if (!fromDate || !toDate) {
          throw new Error('FromDate and ToDate are required for getconsolitadeReport')
        } 
        if (!locationId) {
          throw new Error('LocationId is required for getconsolitadeReport')
        }


        return {
          url: `${API_BASE_URL}/pmtask/consolidatereport/locationwise`,
          method: 'GET',
          params: {
            fromDate,
            toDate,
            ...(locationId != null && { locationId: locationId.toString() }),
          },
        }
      },
      providesTags: ['Report'],
    }),

    getCmReportSummary: build.query({
      query: (params) => {
        const { fromDate, toDate, locationId } = params
        if (!fromDate || !toDate) {
          throw new Error('FromDate and ToDate are required for getCmReportSummary')
        }
        if (!locationId) {
          throw new Error('LocationId is required for getCmReportSummary')
        }

        return {
          url: `${API_BASE_URL}/breakdown/summaryreport/bylocation`,
          method: 'GET',
          params: {
            fromDate,
            toDate,
            ...(locationId != null && { locationId: locationId.toString() }),
          },
        }
      },
      providesTags: ['Report'],
    })


  }),
  overrideExisting: false,
})

export const {
  useGetFrequencyCountQuery,
  useGetLocationwiseQuery,
  useGetLocationwiseSheduledQuery,
  useGetconsolitadeReportQuery,
  useGetCmReportSummaryQuery
} = taskReportApi