import { baseApi, API_BASE_URL } from './baseApi'

export const operationChecklistsApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getAssetListLocationWise: build.query({
              query: (params) => {
                const {
                  locationId,
                  categoryId
                } = params
        
                if (!locationId) {
                  throw new Error('LocationId is required for getAssetListLocationWise')
                }
        
                return {
                  url: `${API_BASE_URL}/assetslist/locationwise`,
                  method: 'GET',
                  params: {
                    locationId: locationId.toString(),
                    categoryId: categoryId.toString(),
                  },
                }
              },
              providesTags: ['AssetsList'],
            }),

        getChillerMonitoringChecklist: build.query({
              query: (params) => {
                const {
                  date,
                  locationId,
                  assetId,
                  checklistId
                } = params
        
                if (!checklistId) {
                  throw new Error('ChecklistId is required for getChillerMonitoringChecklist')
                }
        
                return {
                  url: `${API_BASE_URL}/voltas/report/operational`,
                  method: 'GET',
                  params: {
                    date: date,
                    locationId: locationId.toString(),
                    assetId: assetId.toString(),
                    checklistId: checklistId.toString()
                  },
                }
              },
              providesTags: ['Voltas'],
            }),

        getDailyChecksChecklist: build.query({
              query: (params) => {
                const {
                  fromDate,
                  toDate,
                  locationId,
                  assetId,
                  checklistId
                } = params
        
                if (!checklistId) {
                  throw new Error('ChecklistId is required for getDailyChecksChecklist')
                }
        
                return {
                  url: `${API_BASE_URL}/voltas/report/operational/bydates`,
                  method: 'GET',
                  params: {
                    fromDate: fromDate,
                    toDate: toDate,
                    locationId: locationId.toString(),
                    assetId: assetId.toString(),
                    checklistId: checklistId.toString()
                  },
                }
              },
              providesTags: ['Voltas'],
            }),

        getDailyChecksChecklistByCategory: build.query({
              query: (params) => {
                const {
                  date,
                  locationId,
                  assetCategoryId,
                  checklistId
                } = params
        
                if (!checklistId) {
                  throw new Error('ChecklistId is required for getDailyChecksChecklistByCategory')
                }
        
                return {
                  url: `${API_BASE_URL}/voltas/report/operational/bycategory`,
                  method: 'GET',
                  params: {
                    date: date,
                    locationId: locationId.toString(),
                    assetCategoryId: Array.isArray(assetCategoryId) ? assetCategoryId.join(',') : assetCategoryId?.toString(),
                    checklistId: checklistId.toString()
                  },
                }
              },
              providesTags: ['Voltas'],
            }),

        }),
  overrideExisting: false,
    })

export const {
      useGetAssetListLocationWiseQuery,
      useGetChillerMonitoringChecklistQuery,
      useGetDailyChecksChecklistQuery,
      useGetDailyChecksChecklistByCategoryQuery
    } = operationChecklistsApi