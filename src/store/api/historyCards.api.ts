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

        }),
  overrideExisting: false,
    })

export const {
      useGetHistoryCardsChecklistQuery
    } = operationChecklistsApi