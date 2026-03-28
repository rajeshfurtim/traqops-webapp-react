import { PartyModeSharp } from '@mui/icons-material'
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
        const { fromDate, toDate, locationId, statusId, clientId,system } = params

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
            ...(system != null && { system: system.toString()})

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
            locationId: Array.isArray(locationId)
              ? locationId.join(',')
              : locationId.toString(),
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
            locationId: locationId.toString(),
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
            locationId: locationId.toString(),
          },
        }
      },
      providesTags: ['Report'],
    }),

    gettaskReportSummarycm: build.query({
      query: (params) => {
        const { fromDate, toDate, locationId, statusId, system, categoryId, pn, ps, clientId } = params

        if (!fromDate || !toDate) {
          throw new Error('FromDate and ToDate are required')
        }
        if (!locationId) {
          throw new Error('LocationId is required')
        }

        return {
          url: `${API_BASE_URL}/reports/breakdown/taskreports`,
          method: 'GET',
          params: {
            fromDate,
            toDate,
            locationId: locationId.toString(),
            ...(statusId != null && { statusId: statusId.toString() }),
            ...(categoryId != null && { categoryId: categoryId.toString() }),
            ...(system != null && { system: system }),
            ...(pn != null && { pn: pn.toString() }),
            ...(ps != null && { ps: ps.toString() }),
            clientId: clientId.toString(),
          },
        }
      },
      providesTags: ['Report'],
    }),

    getbyfrequency: build.query({
      query: (params) => {
        const { fromDate, toDate, locationId, statusId, frequencyId, pn, ps, clientId } = params

        return {
          url: `${API_BASE_URL}/reports/pmtask/getlocation/byfrequency`,
          method: 'GET',
          params: {
            fromDate,
            toDate,
            ...(locationId != null && { locationId: locationId.toString() }),
            ...(statusId != null && { statusId: statusId.toString() }),
            ...(frequencyId != null && { frequencyId: frequencyId.toString() }),
            ...(pn != null && { pn: pn.toString() }),
            ...(ps != null && { ps: ps.toString() }),
            clientId: clientId.toString(),
          },
        }
      },
      providesTags: ['Report'],
    }),

    getallpmtasklist: build.query({
      query: (params) => {
        const { id } = params || {}

        return {
          url: `${API_BASE_URL}/pmtask/getallpmtasklist`,
          method: 'GET',
          params: {
            ...(id != null && { id: id.toString() }),
          },
        }
      },
      providesTags: ['Report'],
    }),


    bypmtaskid: build.query({
      query: (params) => {
        const { pmtaskId } = params || {}

        return {
          url: `${API_BASE_URL}/pmtaskdetails/bypmtaskid`,
          method: 'GET',
          params: {
            ...(pmtaskId != null && { pmtaskId: pmtaskId.toString() }),
          },
        }
      },
      providesTags: ['Report'],
    }),

    getElementsByCheckListId: build.query({
      query: (params) => {
        const { checkListId } = params || {}

        return {
          url: `${API_BASE_URL}/checklist/getelements/bychecklistid`,
          method: 'GET',
          params: {
             checkListId: checkListId.toString(),
          },
        }
      },
      providesTags: ['Report'],
    }),

    getPmCheckList: build.query({
      query: (params) => {
        const { pmTaskId } = params || {}

        return {
          url: `${API_BASE_URL}/getpmchecklist/bypmtask`,
          method: 'GET',
          params: {
             pmTaskId: pmTaskId.toString(),
          },
        }
      },
      providesTags: ['Report'],
    }),

    getSystemCategorys: build.query({
      query: (params) => {
        const { clientId, system } = params || {}

        return {
          url: `${API_BASE_URL}/bmrcl/getsystem/categorys`,
          method: 'GET',
          params: {
            clientId: clientId.toString(),
            system: system.toString(),
          },
        }
      },
      providesTags: ['BMRCL'],
    }),

    getTaskDetailedReport: build.query({
      query: (params) => {
        const { system, categoryId, locationId, fromDate, toDate } = params || {}

        return {
          url: `${API_BASE_URL}/bmrcl/gettask/detailedreports`,
          method: 'GET',
          params: {
            system: system.toString(),
            ...(categoryId != null && { categoryId: categoryId.toString() }),
            locationId: locationId.toString(),
            fromDate: fromDate.toString(),
            toDate: toDate.toString(),
          },
        }
      },
      providesTags: ['BMRCL'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetFrequencyCountQuery,
  useGetLocationwiseQuery,
  useGetLocationwiseSheduledQuery,
  useGetconsolitadeReportQuery,
  useGetCmReportSummaryQuery,
  useGettaskReportSummarycmQuery,
  useGetbyfrequencyQuery,
  useGetallpmtasklistQuery,
  useBypmtaskidQuery,
  useGetElementsByCheckListIdQuery,
  useGetPmCheckListQuery,
  useGetSystemCategorysQuery,
  useGetTaskDetailedReportQuery
} = taskReportApi