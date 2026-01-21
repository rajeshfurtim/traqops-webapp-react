import { baseApi, API_BASE_URL } from './baseApi'
import { domainName } from '../../config/apiConfig'

/**
 * Maintenance API endpoints
 * Handles scheduled and corrective maintenance
 */
export const maintenanceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Scheduled Maintenance
    getAllScheduleMaintenanceTasks: build.query({
      query: (params) => {
        const {
          domainName: domainNameParam,
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getAllScheduleMaintenanceTasks')
        }

        return {
          url: `${API_BASE_URL}/schedulemaintenance/getalltask`,
          method: 'GET',
          params: {
            domainName: domainNameParam || domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['ScheduleMaintenance'],
    }),

    createScheduleMaintenance: build.mutation({
      query: (payload) => ({
        url: `${API_BASE_URL}/schedulemaintenance/create`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['ScheduleMaintenance'],
    }),

    updateScheduleMaintenance: build.mutation({
      query: (payload) => ({
        url: `${API_BASE_URL}/schedulemaintenance/update`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['ScheduleMaintenance'],
    }),

    createOrUpdateScheduleMaintenance: build.mutation({
      query: (payload) => ({
        url: `${API_BASE_URL}/schedulemaintenance/addorupdate`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['ScheduleMaintenance'],
    }),

    // Frequency & Schedule Helpers
    getAllFrequency: build.query({
      query: () => ({
        url: '/unsecure/frequency/getallfrequency',
        method: 'GET',
      }),
      providesTags: ['Frequency'],
    }),

    getScheduleMonthList: build.query({
      query: () => ({
        url: '/unsecure/month/getschedulemonth',
        method: 'GET',
      }),
      providesTags: ['Frequency'],
    }),

    getAllShiftList: build.query({
      query: (params) => {
        const {
          domainName: domainNameParam,
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getAllShiftList')
        }

        return {
          url: `${API_BASE_URL}/shift/getallshift`,
          method: 'GET',
          params: {
            domainName: domainNameParam || domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['Shift'],
    }),

    getAllCustomFrequencyList: build.query({
      query: (params = {}) => {
        const { pageNumber = 1, pageSize = 1000 } = params
        return {
          url: `${API_BASE_URL}/customfrequency/getalllist`,
          method: 'GET',
          params: {
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['CustomFrequency'],
    }),

    // Category & Checklist
    getAllCategoryList: build.query({
      query: (params) => {
        const {
          domainName: domainNameParam,
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getAllCategoryList')
        }

        return {
          url: `${API_BASE_URL}/category/getallcategorylist`,
          method: 'GET',
          params: {
            domainName: domainNameParam || domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['Category'],
    }),

    getChecklistByAssetCategory: build.query({
      query: (params) => {
        const { assetsCategoryId } = params

        if (!assetsCategoryId) {
          throw new Error('assetsCategoryId is required for getChecklistByAssetCategory')
        }

        return {
          url: `${API_BASE_URL}/assets/getchecklist/byassetcategory`,
          method: 'GET',
          params: {
            assetsCategoryId: assetsCategoryId.toString(),
          },
        }
      },
      providesTags: ['Checklist'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetAllScheduleMaintenanceTasksQuery,
  useCreateScheduleMaintenanceMutation,
  useUpdateScheduleMaintenanceMutation,
  useCreateOrUpdateScheduleMaintenanceMutation,
  useGetAllFrequencyQuery,
  useGetScheduleMonthListQuery,
  useGetAllShiftListQuery,
  useGetAllCustomFrequencyListQuery,
  useGetAllCategoryListQuery,
  useGetChecklistByAssetCategoryQuery,
} = maintenanceApi
