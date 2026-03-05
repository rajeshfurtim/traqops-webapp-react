import { baseApi, API_BASE_URL } from './baseApi'

/**
 * Reports API endpoints
 */
export const reportsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Daily Attendance Reports
    getDailyLocationReport: build.query({
      query: (params) => {
        const { date, locationId, userTypeId, clientId } = params

        if (!clientId) {
          throw new Error('ClientId is required for getDailyLocationReport')
        }

        if (!date) {
          throw new Error('Date is required for getDailyLocationReport')
        }

        const queryParams = {
          date,
          clientId: clientId.toString(),
          ...(locationId !== undefined && locationId !== null && { locationId: locationId.toString() }),
          ...(userTypeId !== undefined && userTypeId !== null && { userTypeId: userTypeId.toString() }),
        }

        return {
          url: `${API_BASE_URL}/report/dailylocationreport`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

    getMonthlyEmployeeReport: build.query({
      query: (params) => {
        const { fromDate, toDate, locationId, userTypeId, clientId } = params

        if (!clientId) {
          throw new Error('ClientId is required for getMonthlyEmployeeReport')
        }

        if (!fromDate || !toDate) {
          throw new Error('Month is required for getMonthlyEmployeeReport')
        }

        const queryParams = {
          fromDate,
          toDate,
          clientId: clientId.toString(),
          locationId: Array.isArray(locationId) ? locationId.join(',') : locationId?.toString(),
          userTypeId: userTypeId?.toString() ?? '-1',
        }

        return {
          url: `${API_BASE_URL}/report/locationwise/monthlyreport`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

    getConsolidateManpowerReport: build.query({
      query: (params) => {
        const { fromDate, toDate, userTypeId, clientId } = params

        if (!clientId) {
          throw new Error('ClientId is required for getConsolidateManpowerReport')
        }

        if (!fromDate || !toDate) {
          throw new Error('From Date and To Date are required for getConsolidateManpowerReport')
        }

        const queryParams = {
          fromDate,
          toDate,
          clientId: clientId.toString(),
          userTypeId: userTypeId?.toString() ?? '-1',
        }

        return {
          url: `${API_BASE_URL}/reports/consolidatemanpower/byusertype`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),
    //daily Report Energy Consumption
     getEnergyConsumptionReport: build.query({
      query: (params) => {
        const { fromdate,todate, locationId} = params
        const queryParams = {
          fromdate,
          todate,
          locationId
          // clientId: clientId.toString(),
          // ...(locationId !== undefined && locationId !== null && { locationId: locationId.toString() }),
          // ...(userTypeId !== undefined && userTypeId !== null && { userTypeId: userTypeId.toString() }),
        }

        return {
          url: `${API_BASE_URL}/voltas/report/energyconsumption/bylocation`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),
     getEquipmentRunStatusReport: build.query({
      query: (params) => {
        const { fromdate,todate, locationId} = params
        const queryParams = {
          fromdate,
          todate,
          locationId
          // clientId: clientId.toString(),
          // ...(locationId !== undefined && locationId !== null && { locationId: locationId.toString() }),
          // ...(userTypeId !== undefined && userTypeId !== null && { userTypeId: userTypeId.toString() }),
        }

        return {
          url: `${API_BASE_URL}/voltas/report/equiprunstatus/bylocation`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),
     getTemperatureRunStatusReport: build.query({
      query: (params) => {
        const { fromdate,todate, locationId} = params
        const queryParams = {
          fromdate,
          todate,
          locationId
          // clientId: clientId.toString(),
          // ...(locationId !== undefined && locationId !== null && { locationId: locationId.toString() }),
          // ...(userTypeId !== undefined && userTypeId !== null && { userTypeId: userTypeId.toString() }),
        }

        return {
          url: `${API_BASE_URL}/voltas/report/tempstatus/bylocation`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),
     getTvsStatusReport: build.query({
      query: (params) => {
        const { fromdate,todate, locationId} = params
        const queryParams = {
          fromdate,
          todate,
          locationId
          // clientId: clientId.toString(),
          // ...(locationId !== undefined && locationId !== null && { locationId: locationId.toString() }),
          // ...(userTypeId !== undefined && userTypeId !== null && { userTypeId: userTypeId.toString() }),
        }

        return {
          url: `${API_BASE_URL}/voltas/report/tvsstatus/bylocation`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

    getToolsReport: build.query({
      query: (params) => {
        const { fromDate, toDate, locationId, pn, ps } = params

        if (!locationId) {
          throw new Error('LocationId is required for getToolsReport')
        }

        if (!fromDate || !toDate) {
          throw new Error('From Date and To Date are required for getToolsReport')
        }

        const queryParams = {
          fromDate,
          toDate,
          locationId: Array.isArray(locationId) ? locationId.join(',') : locationId?.toString(),
          pn: pn,
          ps: ps
        }

        return {
          url: `${API_BASE_URL}/reports/toolselements`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

    getQuantityReport: build.query({
      query: (params) => {
        const { locationId, InventoryCategoryId, pn, ps } = params

        if (!locationId) {
          throw new Error('LocationId is required for getQuantityReport')
        }

        if (!InventoryCategoryId) {
          throw new Error('InventoryCategoryId is required for getQuantityReport')
        }

        const queryParams = {
          locationId: Array.isArray(locationId) ? locationId.join(',') : locationId?.toString(),
          InventoryCategoryId: Array.isArray(InventoryCategoryId) ? InventoryCategoryId.join(',') : InventoryCategoryId?.toString(),
          pn: pn,
          ps: ps
        }

        return {
          url: `${API_BASE_URL}/quantityreports/bycategory/locationwise`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['QuantityReports'],
    }),

    getSpareUsageReport: build.query({
      query: (params) => {
        const { clientId, fromDate, toDate, locationId, inventoryId, pn, ps } = params

        if (!clientId) {
          throw new Error('clientId is required for getSpareUsageReport')
        }

        const queryParams = {
          clientId: clientId.toString(),
          fromDate,
          toDate,
          locationId: Array.isArray(locationId) ? locationId.join(',') : locationId?.toString(),
          inventoryId: Array.isArray(inventoryId) ? inventoryId.join(',') : inventoryId?.toString(),
          pn: pn,
          ps: ps
        }

        return {
          url: `${API_BASE_URL}/reports/spareusagereport/getbyinward`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

    getAssetHistoryReport: build.query({
      query: (params) => {
        const { clientId, fromDate, toDate, locationId, assetsId, pn, ps } = params

        if (!clientId) {
          throw new Error('clientId is required for getAssetHistoryReport')
        }

        const queryParams = {
          clientId: clientId.toString(),
          fromDate,
          toDate,
          locationId: Array.isArray(locationId) ? locationId.join(',') : locationId?.toString(),
          assetsId: Array.isArray(assetsId) ? assetsId.join(',') : assetsId?.toString(),
          pn: pn,
          ps: ps
        }

        return {
          url: `${API_BASE_URL}/reports/getassetmovements/byinwardoutward`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['Report'],
    }),

    getPenaltySummaryReport: build.query({
      query: (params) => {
        const { fromDate, toDate, kpiTypeId, penaltyCategoryId } = params

        if (!kpiTypeId) {
          throw new Error('kpiTypeId is required for getPenaltySummaryReport')
        }

        const queryParams = {
          fromDate,
          toDate,
          kpiTypeId: Array.isArray(kpiTypeId) ? kpiTypeId.join(',') : kpiTypeId?.toString(),
          penaltyCategoryId: Array.isArray(penaltyCategoryId) ? penaltyCategoryId.join(',') : penaltyCategoryId?.toString()
        }

        return {
          url: `${API_BASE_URL}/evaluationpenaltys/getbykpitype`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['EvaluationPenaltys'],
    }),

    getEvaluationElementsPenaltys: build.query({
      query: (params) => {
        const { fromDate, toDate, locationId, penaltyCategoryId, pn, ps } = params

        if (!locationId) {
          throw new Error('locationId is required for getEvaluationElementsPenaltys')
        }

        const queryParams = {
          fromDate,
          toDate,
          locationId: Array.isArray(locationId) ? locationId.join(',') : locationId?.toString(),
          penaltyCategoryId: Array.isArray(penaltyCategoryId) ? penaltyCategoryId.join(',') : penaltyCategoryId?.toString(),
          pn: pn,
          ps: ps
        }

        return {
          url: `${API_BASE_URL}/evaluationelementspenaltys/getbylocation`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['EvaluationElementsPenaltys'],
    }),

    addEvaluationPenalty: build.mutation({
      query: (payload) => {
        if (!payload?.locationId) {
          throw new Error("locationId is required for add evaluation penalty");
        }
    
        return {
          url: `${API_BASE_URL}/evaluationpenaltyelements/addorupdate/poov`,
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: (result, error) =>
        error ? [] :["EvaluationElementsPenaltys"], 
    }),

    getInvoiceSummary: build.query({
      query: (params) => {
        const { clientId, kpiTypeId, pn, ps } = params

        if (!clientId) {
          throw new Error('clientId is required for getInvoiceSummary')
        }

        const queryParams = {
         clientId: clientId.toString(),
         kpiTypeId: kpiTypeId.toString(),
          pn: pn,
          ps: ps
        }

        return {
          url: `${API_BASE_URL}/reports/getinvoice/bykpitypeid`,
          method: 'GET',
          params: queryParams,
        }
      },
      providesTags: ['InvoiceGenerate'],
    }),

    invoiceGenerate: build.mutation({
      query: (payload) => {
        if (!payload?.id) {
          throw new Error("id is required for invoice generate");
        }
    
        return {
          url: `${API_BASE_URL}/invoice/generate/poov`,
          method: "GET",
          params: payload,
        };
      },
      invalidatesTags: (result, error) =>
        error ? [] :["InvoiceGenerate"], 
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetDailyLocationReportQuery,
  useGetMonthlyEmployeeReportQuery,
  useGetConsolidateManpowerReportQuery,
  useGetEnergyConsumptionReportQuery,
  useGetEquipmentRunStatusReportQuery,
  useGetTemperatureRunStatusReportQuery,
  useGetTvsStatusReportQuery,
  useGetToolsReportQuery,
  useGetQuantityReportQuery,
  useGetSpareUsageReportQuery,
  useGetAssetHistoryReportQuery,
  useGetPenaltySummaryReportQuery,
  useGetEvaluationElementsPenaltysQuery,
  useAddEvaluationPenaltyMutation,
  useGetInvoiceSummaryQuery,
  useInvoiceGenerateMutation
} = reportsApi
