import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Environment-based API base URL
// .env.development → VITE_API_BASE_URL=/secure
// .env.production  → VITE_API_BASE_URL=https://voltas.traqops.com/secure
// Default to '/secure' so local dev still works even if env is missing.
// Some environments accidentally set VITE_API_BASE_URL with `/secure/secure`.
// Normalize to avoid double-prefix 404s like: `/secure/secure/...`.
const rawApiBaseUrl = (import.meta as any).env.VITE_API_BASE_URL || '/secure'
export const API_BASE_URL = String(rawApiBaseUrl)
  .replace(/\/+$/, '')
  .replace(/\/secure\/secure\//g, '/secure/')
  .replace(/\/secure\/secure$/g, '/secure')

/**
 * Base API configuration for RTK Query
 * All API endpoints extend from this base
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '',
    prepareHeaders: (headers, { getState }) => {
      // Get JWT token from localStorage
      const jwt = localStorage.getItem('jwt')
      if (jwt) {
        headers.set('authorization', `Bearer ${jwt}`)
      }
      // Set content type
      headers.set('content-type', 'application/json')
      return headers
    },
  }),
  tagTypes: [
    'Auth',
    'UserRole',
    'Location',
    'ScheduleMaintenance',
    'CorrectiveMaintenance',
    'Inventory',
    'StockIndent',
    'Category',
    'Checklist',
    'Frequency',
    'Shift',
    'CustomFrequency',
    'Client',
    'UserType',
    'Report',
    'Document',
    'MasterSettings',
    'UserInfo',
    'Department',
    'Skill',
    'SkillLevel',
    'Mobile',
    'LocationGroup',
    'Area',
    'SubArea',
    'ShiftLocationMapping',
    'CheckList',
    'Assets',
    'InventoryCategory',
    'Tools',
    'CheckListType',
    'ElementsCheckList',
    'FaultCategory',
    'FaultSubCategory',
    'ExternalVendor',
    'Priority',
    'KPIsType',
    'KPIsCategory',
    'KPIs',
    'Type',
    'QuantityReports',
    'PenaltyCategory',
    'EvaluationPenaltys',
    'EvaluationElementsPenaltys',
    'Penalty',
    'InvoiceGenerate',
    'AssetsList',
    'Voltas',
    'OneApp',
    'Folders'
  ],
  endpoints: () => ({}),
})
