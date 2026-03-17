import { baseApi, API_BASE_URL } from './baseApi'

export const correctiveApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Daily Attendance Reports
    GetcorrectivemaintenanceCountList: build.query({
      query: (params) => {
        const { fromdate, todate,locationId } = params

        // if (!clientId) {
        //   throw new Error('ClientId is required for getDailyLocationReport')
        // }
        const queryParams = {
          fromDate:fromdate,
          toDate:todate,
          ...(locationId !== undefined && locationId !== null && { locationId: locationId.toString() }),
        }

        return {
          url: `${API_BASE_URL}/breakdown/summaryreport/bylocation`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),
      Getcorrectivemaintenance: build.query({
      query: (params) => {
        const { fromdate, todate,locationId,clientId,statusId } = params

        // if (!clientId) {
        //   throw new Error('ClientId is required for getDailyLocationReport')
        // }
        const queryParams = {
          fromDate:fromdate,
          toDate:todate,
          clientId:clientId,
          ...(locationId !== undefined && locationId !== null && { locationId: locationId.toString() }),
          statusId:statusId,
          pn:1,
          ps:1000000

        }

        return {
          url: `${API_BASE_URL}/cmtask/getlist/bystatus`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),



  }),
  overrideExisting: false,
})

export const {
  useGetcorrectivemaintenanceCountListQuery,useGetcorrectivemaintenanceQuery
 
} = correctiveApi