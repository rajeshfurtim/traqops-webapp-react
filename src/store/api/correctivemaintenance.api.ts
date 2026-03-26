import { baseApi, API_BASE_URL } from './baseApi'

export const correctiveApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Daily Attendance Reports
    GetcorrectivemaintenanceCountList: build.query({
      query: (params) => {
        const { fromdate, todate, locationId } = params

        // if (!clientId) {
        //   throw new Error('ClientId is required for getDailyLocationReport')
        // }
        const queryParams = {
          fromDate: fromdate,
          toDate: todate,
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
        const { fromdate, todate, locationId, clientId, statusId } = params

        // if (!clientId) {
        //   throw new Error('ClientId is required for getDailyLocationReport')
        // }
        const queryParams = {
          fromDate: fromdate,
          toDate: todate,
          clientId: clientId,
          ...(locationId !== undefined && locationId !== null && { locationId: locationId.toString() }),
          statusId: statusId,
          pn: 1,
          ps: 1000000

        }

        return {
          url: `${API_BASE_URL}/bmrcl/cmtasklist/bystatus/andlocation`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

    getmaximumsequence: build.query({
      query: ({ clientId }) => ({
        url: `${API_BASE_URL}/cm/getsequelnumber/maximum/${clientId}`,
        method: 'GET',
      }),
      providesTags: ['Report'],
    }),


    Getcategory: build.query({
      query: (params) => {
        const { clientId, system } = params

        const queryParams = {
          clientId: clientId,
          system: system
        }

        return {
          url: `${API_BASE_URL}/bmrcl/getsystem/categorys`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

    GetLocationwisedata: build.query({
      query: (params) => {
        const { categoryId, locationId } = params
        const queryParams = {
          categoryId: categoryId,
          locationId: locationId
        }

        return {
          url: `${API_BASE_URL}/assetslist/locationwise`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),


    GetbyFaultid: build.query({
      query: (params) => {
        const { faultCategoryId } = params
        const queryParams = {
          faultCategoryId: faultCategoryId,
          pn: '1',
          ps: '1000'
        }

        return {
          url: `${API_BASE_URL}/getfaultsubcategory/byfaultcategory`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

    GetallfaultcategoryList: build.query({
      query: (params) => {
        const { domainName, clientId, pn, ps } = params
        const queryParams = {
          domainName: domainName,
          clientId: clientId,
          pn: '1',
          ps: '1000'
        }

        return {
          url: `${API_BASE_URL}/faultcategory/getallfaultcategorylist`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),


    ByfaultcategoryList: build.query({
      query: (params) => {
        const { faultCategoryId } = params
        const queryParams = {
          faultCategoryId: faultCategoryId,
          pn: '1',
          ps: '1000'
        }

        return {
          url: `${API_BASE_URL}/getfaultsubcategory/byfaultcategory`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

    GetlistbyUser: build.query({
      query: (params) => {
        const { LocationId } = params
        const queryParams = {
          locationId: LocationId,
        }

        return {
          url: `${API_BASE_URL}/breakdown/assignedto/getlistbyuser`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

    Getallpriority: build.query({
      query: (params) => {
        const { domainName, clientId } = params
        const queryParams = {
          domainName: domainName,
          clientId: clientId,
          pn: '1',
          ps: '1000'
        }

        return {
          url: `${API_BASE_URL}/priority/getallprioritylist`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

    AddOrUpdateBreakdown: build.mutation({
      query: (formData) => ({
        url: `${API_BASE_URL}/bmrcl/cm/addorupdate`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Report'],
    }),


    deleteBreakdown: build.mutation({
      query: (id) => {
        const idParam = Array.isArray(id) ? id.join(',') : id

        return {
          url: `${API_BASE_URL}/breakdown/delete?id=${idParam}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Report'],
    }),


  }),
  overrideExisting: false,
})

export const {
  useGetcorrectivemaintenanceCountListQuery,
  useGetcorrectivemaintenanceQuery,
  useGetmaximumsequenceQuery,
  useGetcategoryQuery,
  useGetLocationwisedataQuery,
  useByfaultcategoryListQuery,
  useGetallpriorityQuery,
  useAddOrUpdateBreakdownMutation,
  useDeleteBreakdownMutation



} = correctiveApi