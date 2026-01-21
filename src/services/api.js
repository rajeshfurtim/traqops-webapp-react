import dayjs from 'dayjs'

import dashboardData from '../mock/dashboard.json'
import correctiveMaintenanceData from '../mock/correctiveMaintenance.json'
import inventoryData from '../mock/inventory.json'
import reportsData from '../mock/reports.json'
import invoicesData from '../mock/invoices.json'
import documentsData from '../mock/documents.json'
import documentsFoldersData from '../mock/documentsFolders.json'
import masterSettingsData from '../mock/masterSettings.json'

import dailyReportsData from '../mock/reports/dailyReports.json'
import attendanceReportData from '../mock/reports/attendanceReport.json'
import taskReportData from '../mock/reports/taskReport.json'
import auditReportData from '../mock/reports/auditReport.json'
import inventoryReportData from '../mock/reports/inventoryReport.json'
import toolsReportData from '../mock/reports/toolsReport.json'
import maintenanceChecklistData from '../mock/reports/maintenanceChecklist.json'
import operationChecklistData from '../mock/reports/operationChecklist.json'
import historyCardsData from '../mock/reports/historyCards.json'
import evaluationPenaltyData from '../mock/reports/evaluationPenalty.json'
import cmrlAppReportsData from '../mock/reports/cmrlAppReports.json'
import energyConsumptionData from '../mock/reports/daily/energyConsumption.json'
import equipmentRunStatusData from '../mock/reports/daily/equipmentRunStatus.json'
import chillerRunHourData from '../mock/reports/daily/chillerRunHour.json'
import temperatureRunStatusData from '../mock/reports/daily/temperatureRunStatus.json'

// Simple async delay to simulate network latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const mockApi = {
  // Dashboard
  getDashboardData: async () => {
    await delay(300)
    return { data: dashboardData }
  },

  // Corrective Maintenance
  getCorrectiveMaintenanceTickets: async (filters = {}) => {
    await delay(300)
    let tickets = [...correctiveMaintenanceData.tickets]

    if (filters.status) {
      tickets = tickets.filter(t => t.status === filters.status)
    }
    if (filters.priority) {
      tickets = tickets.filter(t => t.priority === filters.priority)
    }
    if (filters.dateFrom && filters.dateTo) {
      tickets = tickets.filter(t => {
        const ticketDate = new Date(t.createdAt)
        return ticketDate >= new Date(filters.dateFrom) && ticketDate <= new Date(filters.dateTo)
      })
    }

    return { data: { tickets } }
  },

  getCorrectiveMaintenanceTicket: async (id) => {
    await delay(200)
    const ticket = correctiveMaintenanceData.tickets.find(t => t.id === id)
    return { data: ticket }
  },

  // Inventory
  getInventoryData: async () => {
    await delay(300)
    return { data: inventoryData }
  },

  // Reports (overview page)
  getReportsData: async () => {
    await delay(300)
    return { data: reportsData }
  },

  // Invoices
  getInvoices: async () => {
    await delay(300)
    return { data: invoicesData }
  },

  updateInvoiceStatus: async (id, status) => {
    await delay(200)
    return { data: { id, status, updatedAt: new Date().toISOString() } }
  },

  // Documents
  getDocumentFolders: async () => {
    await delay(300)
    return { data: documentsFoldersData.folders || [] }
  },

  getDocumentsByFolder: async (folderId) => {
    await delay(300)
    const filesByFolder = documentsFoldersData.files || {}
    const files = filesByFolder[folderId] || []
    return { data: files }
  },

  uploadDocument: async (folderId, file) => {
    await delay(300)
    return {
      data: {
        id: `file-${Date.now()}`,
        name: file.name,
        type: file.type || 'PDF',
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        uploadedAt: new Date().toISOString()
      }
    }
  },

  deleteDocument: async (folderId, fileId) => {
    await delay(200)
    return { data: { id: fileId, deleted: true } }
  },

  // Master Settings (simple passthrough to JSON)
  getMasterSettings: async () => {
    await delay(300)
    return { data: masterSettingsData }
  },

  deleteCategory: async (id) => {
    await delay(200)
    return { data: { id } }
  },

  updateCategory: async (id, data) => {
    await delay(200)
    return { data: { id, ...data } }
  },

  createCategory: async (data) => {
    await delay(200)
    return { data: { id: Date.now(), ...data } }
  },

  // High-level reports (filtering kept minimal; uses existing JSON)
  getDailyReports: async (filters = {}) => {
    await delay(300)
    let reports = [...dailyReportsData.reports]
    if (filters.dateFrom && filters.dateTo) {
      reports = reports.filter(r => {
        const reportDate = new Date(r.date)
        return reportDate >= new Date(filters.dateFrom) && reportDate <= new Date(filters.dateTo)
      })
    }
    if (filters.depot) {
      reports = reports.filter(r => r.depot === filters.depot)
    }
    return { data: { reports } }
  },

  getAttendanceReport: async (filters = {}) => {
    await delay(300)
    let reports = [...attendanceReportData.reports]
    if (filters.dateFrom && filters.dateTo) {
      reports = reports.filter(r => {
        const reportDate = new Date(r.date)
        return reportDate >= new Date(filters.dateFrom) && reportDate <= new Date(filters.dateTo)
      })
    }
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    if (filters.status) reports = reports.filter(r => r.status === filters.status)
    return { data: { reports } }
  },

  getTaskReport: async (filters = {}) => {
    await delay(300)
    let reports = [...taskReportData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    if (filters.status) reports = reports.filter(r => r.status === filters.status)
    return { data: { reports } }
  },

  getAuditReport: async (filters = {}) => {
    await delay(300)
    let reports = [...auditReportData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    if (filters.complianceStatus) reports = reports.filter(r => r.complianceStatus === filters.complianceStatus)
    return { data: { reports } }
  },

  getInventoryReport: async (filters = {}) => {
    await delay(300)
    let reports = [...inventoryReportData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    return { data: { reports } }
  },

  getToolsReport: async (filters = {}) => {
    await delay(300)
    let reports = [...toolsReportData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    if (filters.returnStatus) reports = reports.filter(r => r.returnStatus === filters.returnStatus)
    return { data: { reports } }
  },

  getMaintenanceChecklist: async (filters = {}) => {
    await delay(300)
    let reports = [...maintenanceChecklistData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    if (filters.status) reports = reports.filter(r => r.status === filters.status)
    return { data: { reports } }
  },

  getOperationChecklist: async (filters = {}) => {
    await delay(300)
    let reports = [...operationChecklistData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    if (filters.checklistStatus) reports = reports.filter(r => r.checklistStatus === filters.checklistStatus)
    return { data: { reports } }
  },

  getHistoryCards: async (filters = {}) => {
    await delay(300)
    let reports = [...historyCardsData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    if (filters.status) reports = reports.filter(r => r.status === filters.status)
    return { data: { reports } }
  },

  getEvaluationPenalty: async (filters = {}) => {
    await delay(300)
    let reports = [...evaluationPenaltyData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    if (filters.penaltyType) reports = reports.filter(r => r.penaltyType === filters.penaltyType)
    return { data: { reports } }
  },

  getCmrlAppReports: async (filters = {}) => {
    await delay(300)
    let reports = [...cmrlAppReportsData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    return { data: { reports } }
  },

  // Daily nested reports
  getEnergyConsumption: async (filters = {}) => {
    await delay(300)
    let reports = [...energyConsumptionData.reports]
    if (filters.dateFrom && filters.dateTo) {
      reports = reports.filter(r => r.date >= filters.dateFrom && r.date <= filters.dateTo)
    }
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    if (filters.location) reports = reports.filter(r => r.location.includes(filters.location))
    return { data: { reports } }
  },

  getEquipmentRunStatus: async (filters = {}) => {
    await delay(300)
    let reports = [...equipmentRunStatusData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    if (filters.runStatus) reports = reports.filter(r => r.runStatus === filters.runStatus)
    return { data: { reports } }
  },

  getChillerRunHour: async (filters = {}) => {
    await delay(300)
    let reports = [...chillerRunHourData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    return { data: { reports } }
  },

  getTemperatureRunStatus: async (filters = {}) => {
    await delay(300)
    let reports = [...temperatureRunStatusData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    if (filters.status) reports = reports.filter(r => r.status === filters.status)
    return { data: { reports } }
  },

  // Master settings mock lists (simple, non-persistent)
  getUsers: async () => {
    await delay(300)
    return { data: masterSettingsData.users || [] }
  },

  getLocations: async () => {
    await delay(300)
    return { data: masterSettingsData.locations || [] }
  },

  getShifts: async () => {
    await delay(300)
    return { data: masterSettingsData.shifts || [] }
  },

  getAssets: async () => {
    await delay(300)
    return { data: masterSettingsData.assets || [] }
  },

  getInventoryItems: async () => {
    await delay(300)
    return { data: masterSettingsData.inventoryItems || [] }
  },

  getTools: async () => {
    await delay(300)
    return { data: masterSettingsData.tools || [] }
  },

  getChecklists: async () => {
    await delay(300)
    return { data: masterSettingsData.checklists || [] }
  },

  getCMConfigurations: async () => {
    await delay(300)
    return { data: masterSettingsData.cmConfigurations || [] }
  },

  getKPIs: async () => {
    await delay(300)
    return { data: masterSettingsData.kpis || [] }
  },

  // Simple update/create mocks for master settings
  updateUser: async (id, data) => {
    await delay(200)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },
  updateLocation: async (id, data) => {
    await delay(200)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },
  updateShift: async (id, data) => {
    await delay(200)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },
  updateAsset: async (id, data) => {
    await delay(200)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },
  updateInventoryItem: async (id, data) => {
    await delay(200)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },
  updateTool: async (id, data) => {
    await delay(200)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },
  updateChecklist: async (id, data) => {
    await delay(200)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },
  updateCMConfiguration: async (id, data) => {
    await delay(200)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },
  updateKPI: async (id, data) => {
    await delay(200)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },

  createUser: async (data) => {
    await delay(200)
    const id = Date.now()
    return { data: { id, ...data, createdAt: new Date().toISOString() } }
  },
  createLocation: async (data) => {
    await delay(200)
    const id = Date.now()
    return { data: { id, ...data, createdAt: new Date().toISOString() } }
  },
  createShift: async (data) => {
    await delay(200)
    const id = Date.now()
    return { data: { id, ...data, createdAt: new Date().toISOString() } }
  },
  createAsset: async (data) => {
    await delay(200)
    const id = Date.now()
    return { data: { id, ...data, createdAt: new Date().toISOString() } }
  },
  createInventoryItem: async (data) => {
    await delay(200)
    const id = Date.now()
    return { data: { id, ...data, createdAt: new Date().toISOString() } }
  },
  createTool: async (data) => {
    await delay(200)
    const id = Date.now()
    return { data: { id, ...data, createdAt: new Date().toISOString() } }
  },
  createChecklist: async (data) => {
    await delay(200)
    const id = Date.now()
    return { data: { id, ...data, createdAt: new Date().toISOString() } }
  },
  createCMConfiguration: async (data) => {
    await delay(200)
    const id = Date.now()
    return { data: { id, ...data, createdAt: new Date().toISOString() } }
  },
  createKPI: async (data) => {
    await delay(200)
    const id = Date.now()
    return { data: { id, ...data, createdAt: new Date().toISOString() } }
  },
}

