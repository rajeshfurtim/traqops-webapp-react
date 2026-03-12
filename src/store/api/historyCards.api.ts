import { baseApi, API_BASE_URL } from './baseApi'

export const operationChecklistsApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getHistoryCardsChecklist: build.query({
              query: (params) => {
                const {
                    fromDate,
                    toDate,
                  locationId,
                  scheduledId
                } = params
        
                if (!locationId) {
                  throw new Error('LocationId is required for getHistoryCardsChecklist')
                }
        
                return {
                  url: `${API_BASE_URL}/reports/historycard/getchecklistreports`,
                  method: 'GET',
                  params: {
                    fromDate: fromDate,
                    toDate: toDate,
                    locationId: locationId.toString(),
                    scheduledId: Array.isArray(scheduledId) ? scheduledId.join(',') : scheduledId?.toString(),
                  },
                }
              },
              providesTags: ['Report'],
            }),

        getCmrlAppReportList: build.query({
              query: (params) => {
                const {
                    fromDate,
                    toDate,
                  locationId,
                  statusId,
                  departmentId
                } = params
        
                if (!departmentId) {
                  throw new Error('DepartmentId is required for getCmrlAppReportList')
                }
        
                return {
                  url: `http://voltas.local.site:4200/oneapp/report/faultlist`,
                  method: 'GET',
                  params: {
                    start_date: fromDate,
                    end_date: toDate,
                    status: statusId.toString(),
                    dept_id: departmentId.toString(),
                  },
                }
              },
              providesTags: ['OneApp'],
            }),

        }),
  overrideExisting: false,
    })

export const {
      useGetHistoryCardsChecklistQuery,
      useGetCmrlAppReportListQuery
    } = operationChecklistsApi