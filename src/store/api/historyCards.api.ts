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

        getDocumentFoldersList: build.query({
              query: (params) => {
                const {
                    pn,
                    ps,
                  clientId
                } = params
        
                if (!clientId) {
                  throw new Error('ClientId is required for getDocumentFoldersList')
                }
        
                return {
                  url: `${API_BASE_URL}/getfilefolder`,
                  method: 'GET',
                  params: {
                    pn: pn,
                    ps: ps,
                    clientId: clientId.toString()
                  },
                }
              },
              providesTags: ['Folders'],
            }),

            addFolders: build.mutation({
              query: (payload) => {
                if (!payload?.clientId) {
                  throw new Error("clientId is required for add folders");
                }
            
                return {
                  url: `${API_BASE_URL}/add/filefolder/poov`,
                  method: "POST",
                  body: payload,
                };
              },
              invalidatesTags: (result, error) =>
                error ? [] :["Folders"], 
            }),
            
            deleteFolders: build.mutation({
              query: (queryString) => ({
                url: `${API_BASE_URL}/delete/filefolder/poov?${queryString}`,
                method: "DELETE"
              }),
              invalidatesTags: (result, error) =>
                error ? [] :["Folders"],
            }),

            addFiles: build.mutation({
              query: (payload) => {
                if (!payload?.clientId) {
                  throw new Error("clientId is required for add folders");
                }
            
                return {
                  url: `${API_BASE_URL}/filemap/uploadfiles/poov`,
                  method: "POST",
                  body: payload,
                };
              },
              invalidatesTags: (result, error) =>
                error ? [] :["Folders"], 
            }),
            
            deleteFiles: build.mutation({
              query: (queryString) => ({
                url: `${API_BASE_URL}/delete/filemap/byfiles/poov?${queryString}`,
                method: "DELETE"
              }),
              invalidatesTags: (result, error) =>
                error ? [] :["Folders"],
            }),

        }),
  overrideExisting: false,
    })

export const {
      useGetHistoryCardsChecklistQuery,
      useGetCmrlAppReportListQuery,
      useGetDocumentFoldersListQuery,
      useAddFoldersMutation,
      useDeleteFoldersMutation,
      useAddFilesMutation,
      useDeleteFilesMutation
    } = operationChecklistsApi