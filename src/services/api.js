import axios from 'axios'
import dayjs from 'dayjs'

// Mock data imports
import dashboardData from '../mock/dashboard.json'
import correctiveMaintenanceData from '../mock/correctiveMaintenance.json'
import scheduledMaintenanceData from '../mock/scheduledMaintenance.json'
import inventoryData from '../mock/inventory.json'
import reportsData from '../mock/reports.json'
import invoicesData from '../mock/invoices.json'
import documentsData from '../mock/documents.json'
import documentsFoldersData from '../mock/documentsFolders.json'
import masterSettingsData from '../mock/masterSettings.json'
// Report data imports
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
// Daily Reports
import energyConsumptionData from '../mock/reports/daily/energyConsumption.json'
import equipmentRunStatusData from '../mock/reports/daily/equipmentRunStatus.json'
import chillerRunHourData from '../mock/reports/daily/chillerRunHour.json'
import temperatureRunStatusData from '../mock/reports/daily/temperatureRunStatus.json'

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Create axios instance (for future real API integration)
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Mock API service
export const mockApi = {
  // Dashboard
  getDashboardData: async () => {
    await delay(300)
    return { data: dashboardData }
  },

  // Corrective Maintenance
  getCorrectiveMaintenanceTickets: async (filters = {}) => {
    await delay(400)
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

  // Scheduled Maintenance
  getScheduledMaintenance: async () => {
    await delay(300)
    return { data: scheduledMaintenanceData }
  },

  // Inventory
  getInventoryData: async () => {
    await delay(300)
    return { data: inventoryData }
  },

  // Reports
  getReportsData: async (filters = {}) => {
    await delay(400)
    return { data: reportsData }
  },

  // Invoices
  getInvoices: async () => {
    await delay(300)
    return { data: invoicesData }
  },

  updateInvoiceStatus: async (id, status) => {
    await delay(500)
    return { data: { id, status, updatedAt: new Date().toISOString() } }
  },

  // Documents
  getDocuments: async (category = 'All') => {
    await delay(300)
    let documents = [...documentsData.documents]
    if (category !== 'All') {
      documents = documents.filter(d => d.category === category)
    }
    return { data: { documents, categories: documentsData.categories } }
  },

  // Document Folders (new folder-based structure)
  getDocumentFolders: async () => {
    await delay(300)
    return { data: documentsFoldersData.folders }
  },

  getDocumentsByFolder: async (folderId) => {
    await delay(300)
    const files = documentsFoldersData.files[folderId] || []
    return { data: files }
  },

  uploadDocument: async (folderId, file) => {
    await delay(500)
    // Mock: create a new file entry
    const newFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      type: file.type || 'PDF',
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      uploadedAt: new Date().toISOString()
    }
    // In real implementation, this would add to the files object
    return { data: newFile }
  },

  deleteDocument: async (folderId, fileId) => {
    await delay(500)
    // Mock: file deletion
    return { data: { id: fileId, deleted: true } }
  },

  // Master Settings
  getMasterSettings: async () => {
    await delay(300)
    return { data: masterSettingsData }
  },

  updateCategory: async (id, data) => {
    await delay(500)
    return { data: { id, ...data } }
  },

  createCategory: async (data) => {
    await delay(500)
    return { data: { id: Date.now(), ...data } }
  },

  deleteCategory: async (id) => {
    await delay(500)
    return { data: { id } }
  },

  // Reports
  getDailyReports: async (filters = {}) => {
    await delay(400)
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
    await delay(400)
    let reports = [...attendanceReportData.reports]
    if (filters.dateFrom && filters.dateTo) {
      reports = reports.filter(r => {
        const reportDate = new Date(r.date)
        return reportDate >= new Date(filters.dateFrom) && reportDate <= new Date(filters.dateTo)
      })
    }
    if (filters.depot) {
      reports = reports.filter(r => r.depot === filters.depot)
    }
    if (filters.status) {
      reports = reports.filter(r => r.status === filters.status)
    }
    return { data: { reports } }
  },

  getTaskReport: async (filters = {}) => {
    await delay(400)
    let reports = [...taskReportData.reports]
    if (filters.depot) {
      reports = reports.filter(r => r.depot === filters.depot)
    }
    if (filters.status) {
      reports = reports.filter(r => r.status === filters.status)
    }
    return { data: { reports } }
  },

  getAuditReport: async (filters = {}) => {
    await delay(400)
    let reports = [...auditReportData.reports]
    if (filters.depot) {
      reports = reports.filter(r => r.depot === filters.depot)
    }
    if (filters.complianceStatus) {
      reports = reports.filter(r => r.complianceStatus === filters.complianceStatus)
    }
    return { data: { reports } }
  },

  getInventoryReport: async (filters = {}) => {
    await delay(400)
    let reports = [...inventoryReportData.reports]
    if (filters.depot) {
      reports = reports.filter(r => r.depot === filters.depot)
    }
    return { data: { reports } }
  },

  getToolsReport: async (filters = {}) => {
    await delay(400)
    let reports = [...toolsReportData.reports]
    if (filters.depot) {
      reports = reports.filter(r => r.depot === filters.depot)
    }
    if (filters.returnStatus) {
      reports = reports.filter(r => r.returnStatus === filters.returnStatus)
    }
    return { data: { reports } }
  },

  getMaintenanceChecklist: async (filters = {}) => {
    await delay(400)
    let reports = [...maintenanceChecklistData.reports]
    if (filters.depot) {
      reports = reports.filter(r => r.depot === filters.depot)
    }
    if (filters.status) {
      reports = reports.filter(r => r.status === filters.status)
    }
    return { data: { reports } }
  },

  getOperationChecklist: async (filters = {}) => {
    await delay(400)
    let reports = [...operationChecklistData.reports]
    if (filters.depot) {
      reports = reports.filter(r => r.depot === filters.depot)
    }
    if (filters.checklistStatus) {
      reports = reports.filter(r => r.checklistStatus === filters.checklistStatus)
    }
    return { data: { reports } }
  },

  getHistoryCards: async (filters = {}) => {
    await delay(400)
    let reports = [...historyCardsData.reports]
    if (filters.depot) {
      reports = reports.filter(r => r.depot === filters.depot)
    }
    if (filters.status) {
      reports = reports.filter(r => r.status === filters.status)
    }
    return { data: { reports } }
  },

  getEvaluationPenalty: async (filters = {}) => {
    await delay(400)
    let reports = [...evaluationPenaltyData.reports]
    if (filters.depot) {
      reports = reports.filter(r => r.depot === filters.depot)
    }
    if (filters.penaltyType) {
      reports = reports.filter(r => r.penaltyType === filters.penaltyType)
    }
    return { data: { reports } }
  },

  getCmrlAppReports: async (filters = {}) => {
    await delay(400)
    let reports = [...cmrlAppReportsData.reports]
    if (filters.depot) {
      reports = reports.filter(r => r.depot === filters.depot)
    }
    return { data: { reports } }
  },

  // Daily Reports nested
  getEnergyConsumption: async (filters = {}) => {
    await delay(400)
    let reports = [...energyConsumptionData.reports]
    if (filters.dateFrom && filters.dateTo) {
      reports = reports.filter(r => {
        const reportDate = new Date(r.date)
        return reportDate >= new Date(filters.dateFrom) && reportDate <= new Date(filters.dateTo)
      })
    }
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    if (filters.location) reports = reports.filter(r => r.location.includes(filters.location))
    return { data: { reports } }
  },

  getEquipmentRunStatus: async (filters = {}) => {
    await delay(400)
    let reports = [...equipmentRunStatusData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    if (filters.runStatus) reports = reports.filter(r => r.runStatus === filters.runStatus)
    return { data: { reports } }
  },

  getChillerRunHour: async (filters = {}) => {
    await delay(400)
    let reports = [...chillerRunHourData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    return { data: { reports } }
  },

  getTemperatureRunStatus: async (filters = {}) => {
    await delay(400)
    let reports = [...temperatureRunStatusData.reports]
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    if (filters.status) reports = reports.filter(r => r.status === filters.status)
    return { data: { reports } }
  },

  // Attendance Reports
  getDailyAttendanceReport: async (filters = {}) => {
    await delay(400)
    const locations = ['STI', 'SAT', 'SAE', 'SSN', 'SPC', 'SKM', 'SNP', 'SEG', 'SCC', 'Depot A', 'Depot B', 'Station Central']
    const statuses = ['Present', 'Absent', 'Late', 'On Leave']
    
    const mockReports = Array.from({ length: 50 }, (_, i) => {
      const date = filters.date ? dayjs(filters.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
      const status = statuses[i % statuses.length]
      const isPresent = status === 'Present' || status === 'Late'
      const checkInTime = isPresent 
        ? dayjs(date).hour(8 + Math.floor(Math.random() * 2)).minute(Math.floor(Math.random() * 60))
        : null
      const checkOutTime = isPresent
        ? dayjs(date).hour(17 + Math.floor(Math.random() * 2)).minute(Math.floor(Math.random() * 60))
        : null
      
      return {
        id: i + 1,
        date: date,
        employeeId: `EMP${String(i + 1).padStart(4, '0')}`,
        employeeName: `Employee ${i + 1}`,
        location: locations[i % locations.length],
        shift: ['Morning', 'Afternoon', 'Night'][i % 3],
        inTime: checkInTime ? checkInTime.format('HH:mm') : '-',
        outTime: checkOutTime ? checkOutTime.format('HH:mm') : '-',
        status: status
      }
    })
    
    let reports = [...mockReports]
    
    // Filter by date (single date)
    if (filters.date) {
      const filterDate = dayjs(filters.date).format('YYYY-MM-DD')
      reports = reports.filter(r => r.date === filterDate)
    } else {
      // Default to today if no date filter
      const today = dayjs().format('YYYY-MM-DD')
      reports = reports.filter(r => r.date === today)
    }
    
    // Filter by location
    if (filters.location) {
      reports = reports.filter(r => r.location === filters.location)
    }
    
    // Filter by type (status)
    if (filters.type && filters.type !== 'All') {
      reports = reports.filter(r => r.status === filters.type)
    }
    
    return { data: { reports } }
  },

  getMonthlyAttendanceReport: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      month: dayjs().subtract(i, 'months').format('YYYY-MM'),
      department: ['Operations', 'Maintenance', 'Administration'][i % 3],
      totalEmployees: 50 + Math.floor(Math.random() * 20),
      presentDays: 20 + Math.floor(Math.random() * 8),
      absentDays: Math.floor(Math.random() * 5),
      leaveDays: Math.floor(Math.random() * 3),
      attendancePercent: 85 + Math.floor(Math.random() * 15)
    }))
    let reports = [...mockReports]
    if (filters.month) reports = reports.filter(r => r.month === filters.month)
    if (filters.department) reports = reports.filter(r => r.department === filters.department)
    return { data: { reports } }
  },

  getMonthlyEmployeeAttendanceReport: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      employeeId: `EMP${String(i + 1).padStart(4, '0')}`,
      employeeName: `Employee ${i + 1}`,
      department: ['Operations', 'Maintenance', 'Administration'][i % 3],
      month: dayjs().format('YYYY-MM'),
      workingDays: 22,
      presentDays: 18 + Math.floor(Math.random() * 4),
      absentDays: Math.floor(Math.random() * 3),
      leaveDays: Math.floor(Math.random() * 2),
      attendancePercent: 80 + Math.floor(Math.random() * 20)
    }))
    let reports = [...mockReports]
    if (filters.month) reports = reports.filter(r => r.month === filters.month)
    if (filters.employeeId) reports = reports.filter(r => r.employeeId === filters.employeeId)
    if (filters.department) reports = reports.filter(r => r.department === filters.department)
    return { data: { reports } }
  },

  getMonthlyDailyAttendanceReport: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      date: dayjs().subtract(i, 'days').format('YYYY-MM-DD'),
      totalEmployees: 50 + Math.floor(Math.random() * 20),
      present: 40 + Math.floor(Math.random() * 10),
      absent: Math.floor(Math.random() * 5),
      onLeave: Math.floor(Math.random() * 3),
      attendancePercent: 85 + Math.floor(Math.random() * 15)
    }))
    let reports = [...mockReports]
    if (filters.month) {
      const monthStart = dayjs(filters.month).startOf('month')
      const monthEnd = dayjs(filters.month).endOf('month')
      reports = reports.filter(r => {
        const reportDate = dayjs(r.date)
        return reportDate.isAfter(monthStart.subtract(1, 'day')) && reportDate.isBefore(monthEnd.add(1, 'day'))
      })
    }
    if (filters.department) reports = reports.filter(r => r.department === filters.department)
    return { data: { reports } }
  },

  getTimesheetReport: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      employeeId: `EMP${String((i % 30) + 1).padStart(4, '0')}`,
      employeeName: `Employee ${(i % 30) + 1}`,
      date: dayjs().subtract(i % 30, 'days').format('YYYY-MM-DD'),
      checkIn: dayjs().subtract(i % 30, 'days').hour(8).minute(Math.floor(Math.random() * 30)).format('YYYY-MM-DD HH:mm'),
      checkOut: dayjs().subtract(i % 30, 'days').hour(17).minute(Math.floor(Math.random() * 30)).format('YYYY-MM-DD HH:mm'),
      hoursWorked: (8 + Math.random() * 2).toFixed(1),
      status: ['Present', 'Late', 'Early Leave'][i % 3]
    }))
    let reports = [...mockReports]
    if (filters.month) {
      const monthStart = dayjs(filters.month).startOf('month')
      const monthEnd = dayjs(filters.month).endOf('month')
      reports = reports.filter(r => {
        const reportDate = dayjs(r.date)
        return reportDate.isAfter(monthStart.subtract(1, 'day')) && reportDate.isBefore(monthEnd.add(1, 'day'))
      })
    }
    if (filters.employeeId) reports = reports.filter(r => r.employeeId === filters.employeeId)
    if (filters.department) reports = reports.filter(r => r.department === filters.department)
    return { data: { reports } }
  },

  getConsolidatedManpowerReport: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      department: ['Operations', 'Maintenance', 'Administration', 'Security', 'IT'][i % 5],
      month: dayjs().subtract(i, 'months').format('YYYY-MM'),
      totalManpower: 50 + Math.floor(Math.random() * 30),
      activeEmployees: 45 + Math.floor(Math.random() * 10),
      onLeave: Math.floor(Math.random() * 5),
      absent: Math.floor(Math.random() * 3),
      utilizationPercent: 85 + Math.floor(Math.random() * 15)
    }))
    let reports = [...mockReports]
    if (filters.month) reports = reports.filter(r => r.month === filters.month)
    if (filters.department) reports = reports.filter(r => r.department === filters.department)
    return { data: { reports } }
  },

  // Task Reports
  getScheduledMaintenanceReports: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      taskId: `TASK${String(i + 1).padStart(4, '0')}`,
      taskName: `Scheduled Maintenance Task ${i + 1}`,
      asset: `Asset ${String.fromCharCode(65 + (i % 5))}-${i + 1}`,
      scheduledDate: dayjs().subtract(i % 30, 'days').format('YYYY-MM-DD'),
      completedDate: i % 3 === 0 ? dayjs().subtract(i % 30, 'days').add(1, 'day').format('YYYY-MM-DD') : null,
      status: ['Completed', 'Pending', 'Overdue', 'In Progress'][i % 4],
      assignedTo: `Technician ${(i % 10) + 1}`,
      depot: ['Depot A', 'Depot B', 'Depot C'][i % 3]
    }))
    let reports = [...mockReports]
    if (filters.dateFrom && filters.dateTo) {
      reports = reports.filter(r => r.scheduledDate >= filters.dateFrom && r.scheduledDate <= filters.dateTo)
    }
    if (filters.status) reports = reports.filter(r => r.status === filters.status)
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    return { data: { reports } }
  },

  getScheduledMaintenanceDetailsReports: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      taskId: `TASK${String((i % 20) + 1).padStart(4, '0')}`,
      taskName: `Scheduled Maintenance Task ${(i % 20) + 1}`,
      asset: `Asset ${String.fromCharCode(65 + (i % 5))}-${(i % 20) + 1}`,
      checklistItem: `Checklist Item ${(i % 10) + 1}`,
      status: i % 2 === 0 ? 'Completed' : 'Pending',
      remarks: i % 2 === 0 ? 'All checks completed successfully' : 'Pending review',
      completedBy: i % 2 === 0 ? `Technician ${(i % 10) + 1}` : null,
      completedDate: i % 2 === 0 ? dayjs().subtract(i % 30, 'days').format('YYYY-MM-DD HH:mm') : null
    }))
    let reports = [...mockReports]
    if (filters.dateFrom && filters.dateTo) {
      reports = reports.filter(r => {
        const reportDate = dayjs(r.completedDate || r.taskId).format('YYYY-MM-DD')
        return reportDate >= filters.dateFrom && reportDate <= filters.dateTo
      })
    }
    if (filters.taskId) reports = reports.filter(r => r.taskId === filters.taskId)
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    return { data: { reports } }
  },

  getConsolidatedScheduledMaintenanceReport: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 36 }, (_, i) => ({
      id: i + 1,
      month: dayjs().subtract(i % 12, 'months').format('YYYY-MM'),
      depot: ['Depot A', 'Depot B', 'Depot C'][i % 3],
      totalTasks: 50 + Math.floor(Math.random() * 30),
      completed: 40 + Math.floor(Math.random() * 20),
      pending: Math.floor(Math.random() * 10),
      overdue: Math.floor(Math.random() * 5),
      completionPercent: 75 + Math.floor(Math.random() * 25)
    }))
    let reports = [...mockReports]
    if (filters.month) reports = reports.filter(r => r.month === filters.month)
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    return { data: { reports } }
  },

  getCorrectiveMaintenanceReports: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      issueId: `ISSUE${String(i + 1).padStart(4, '0')}`,
      issueDescription: `Corrective Maintenance Issue ${i + 1}`,
      asset: `Asset ${String.fromCharCode(65 + (i % 5))}-${i + 1}`,
      reportedDate: dayjs().subtract(i % 30, 'days').format('YYYY-MM-DD'),
      resolvedDate: i % 2 === 0 ? dayjs().subtract(i % 30, 'days').add(1, 'day').format('YYYY-MM-DD') : null,
      status: ['Resolved', 'Open', 'In Progress', 'Pending'][i % 4],
      priority: ['High', 'Medium', 'Low'][i % 3],
      assignedTo: `Technician ${(i % 10) + 1}`,
      depot: ['Depot A', 'Depot B', 'Depot C'][i % 3]
    }))
    let reports = [...mockReports]
    if (filters.dateFrom && filters.dateTo) {
      reports = reports.filter(r => r.reportedDate >= filters.dateFrom && r.reportedDate <= filters.dateTo)
    }
    if (filters.status) reports = reports.filter(r => r.status === filters.status)
    if (filters.priority) reports = reports.filter(r => r.priority === filters.priority)
    if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    return { data: { reports } }
  },

  getCorrectiveMaintenanceDetailsReports: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      issueId: `ISSUE${String((i % 20) + 1).padStart(4, '0')}`,
      issueDescription: `Corrective Maintenance Issue ${(i % 20) + 1}`,
      asset: `Asset ${String.fromCharCode(65 + (i % 5))}-${(i % 20) + 1}`,
      actionTaken: ['Replaced component', 'Repaired circuit', 'Cleaned and serviced', 'Adjusted settings'][i % 4],
      partsUsed: i % 2 === 0 ? `Part-${(i % 10) + 1}` : 'No parts required',
      status: i % 3 === 0 ? 'Resolved' : i % 3 === 1 ? 'Open' : 'In Progress',
      resolvedBy: i % 3 === 0 ? `Technician ${(i % 10) + 1}` : null,
      resolvedDate: i % 3 === 0 ? dayjs().subtract(i % 30, 'days').format('YYYY-MM-DD HH:mm') : null,
      timeTaken: i % 3 === 0 ? (2 + Math.random() * 6).toFixed(1) : null
    }))
    let reports = [...mockReports]
    if (filters.dateFrom && filters.dateTo) {
      reports = reports.filter(r => {
        const reportDate = dayjs(r.resolvedDate || r.issueId).format('YYYY-MM-DD')
        return reportDate >= filters.dateFrom && reportDate <= filters.dateTo
      })
    }
    if (filters.issueId) reports = reports.filter(r => r.issueId === filters.issueId)
    if (filters.status) reports = reports.filter(r => r.status === filters.status)
      if (filters.depot) reports = reports.filter(r => r.depot === filters.depot)
    return { data: { reports } }
  },

  // Inventory Reports
  getQuantityReports: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      itemCode: `ITEM${String(i + 1).padStart(4, '0')}`,
      itemName: `Inventory Item ${i + 1}`,
      category: ['Spare Parts', 'Tools', 'Consumables', 'Equipment'][i % 4],
      location: ['Warehouse A', 'Warehouse B', 'Depot A', 'Depot B'][i % 4],
      currentQuantity: 50 + Math.floor(Math.random() * 200),
      minimumQuantity: 20,
      maximumQuantity: 300,
      unit: ['Pcs', 'Kg', 'Liters', 'Units'][i % 4],
      status: i % 3 === 0 ? 'In Stock' : i % 3 === 1 ? 'Low Stock' : 'Out of Stock',
      lastUpdated: dayjs().subtract(i % 30, 'days').format('YYYY-MM-DD')
    }))
    let reports = [...mockReports]
    if (filters.dateFrom && filters.dateTo) {
      reports = reports.filter(r => r.lastUpdated >= filters.dateFrom && r.lastUpdated <= filters.dateTo)
    }
    if (filters.location) reports = reports.filter(r => r.location === filters.location)
    if (filters.category) reports = reports.filter(r => r.category === filters.category)
    if (filters.asset) reports = reports.filter(r => r.itemCode.includes(filters.asset) || r.itemName.includes(filters.asset))
    return { data: { reports } }
  },

  getSpareUsageReports: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      partCode: `PART${String(i + 1).padStart(4, '0')}`,
      partName: `Spare Part ${i + 1}`,
      asset: `Asset ${String.fromCharCode(65 + (i % 5))}-${(i % 10) + 1}`,
      location: ['Warehouse A', 'Warehouse B', 'Depot A', 'Depot B'][i % 4],
      quantityUsed: 1 + Math.floor(Math.random() * 5),
      unit: 'Pcs',
      usageDate: dayjs().subtract(i % 30, 'days').format('YYYY-MM-DD'),
      usedBy: `Technician ${(i % 10) + 1}`,
      workOrder: `WO${String((i % 20) + 1).padStart(4, '0')}`,
      purpose: ['Maintenance', 'Repair', 'Replacement', 'Installation'][i % 4]
    }))
    let reports = [...mockReports]
    if (filters.dateFrom && filters.dateTo) {
      reports = reports.filter(r => r.usageDate >= filters.dateFrom && r.usageDate <= filters.dateTo)
    }
    if (filters.location) reports = reports.filter(r => r.location === filters.location)
    if (filters.asset) reports = reports.filter(r => r.asset.includes(filters.asset))
    if (filters.partCode) reports = reports.filter(r => r.partCode.includes(filters.partCode))
    return { data: { reports } }
  },

  getAssetHistoryReports: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      assetId: `ASSET${String(i + 1).padStart(4, '0')}`,
      assetName: `Asset ${i + 1}`,
      eventType: ['Maintenance', 'Repair', 'Installation', 'Relocation', 'Inspection', 'Decommission'][i % 6],
      eventDate: dayjs().subtract(i % 30, 'days').format('YYYY-MM-DD'),
      location: ['Warehouse A', 'Warehouse B', 'Depot A', 'Depot B'][i % 4],
      description: `Event description for ${['Maintenance', 'Repair', 'Installation', 'Relocation', 'Inspection', 'Decommission'][i % 6]} of Asset ${i + 1}`,
      performedBy: `Technician ${(i % 10) + 1}`,
      cost: i % 2 === 0 ? (100 + Math.random() * 500) : null
    }))
    let reports = [...mockReports]
    if (filters.dateFrom && filters.dateTo) {
      reports = reports.filter(r => r.eventDate >= filters.dateFrom && r.eventDate <= filters.dateTo)
    }
    if (filters.location) reports = reports.filter(r => r.location === filters.location)
    if (filters.asset) reports = reports.filter(r => r.assetId.includes(filters.asset) || r.assetName.includes(filters.asset))
    if (filters.eventType) reports = reports.filter(r => r.eventType === filters.eventType)
    return { data: { reports } }
  },

  // Evaluation Reports
  getPenaltySummary: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      period: dayjs().subtract(i % 12, 'months').format('YYYY-MM'),
      location: ['Depot A', 'Depot B', 'Depot C', 'Warehouse A'][i % 4],
      department: ['Operations', 'Maintenance', 'Administration', 'Security'][i % 4],
      penaltyType: ['Performance', 'Quality', 'Safety', 'Compliance', 'Timeliness'][i % 5],
      totalPenalties: 5 + Math.floor(Math.random() * 20),
      totalAmount: (500 + Math.random() * 2000).toFixed(2),
      averagePenalty: (50 + Math.random() * 150).toFixed(2),
      status: ['Resolved', 'Pending', 'Under Review'][i % 3]
    }))
    let reports = [...mockReports]
    if (filters.dateFrom && filters.dateTo) {
      reports = reports.filter(r => {
        const periodDate = dayjs(r.period).startOf('month')
        return periodDate.isAfter(dayjs(filters.dateFrom).subtract(1, 'day')) && 
               periodDate.isBefore(dayjs(filters.dateTo).add(1, 'day'))
      })
    }
    if (filters.location) reports = reports.filter(r => r.location === filters.location)
    if (filters.department) reports = reports.filter(r => r.department === filters.department)
    if (filters.penaltyType) reports = reports.filter(r => r.penaltyType === filters.penaltyType)
    return { data: { reports } }
  },

  getPenaltyDetails: async (filters = {}) => {
    await delay(400)
    const mockReports = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      penaltyId: `PEN${String(i + 1).padStart(4, '0')}`,
      date: dayjs().subtract(i % 30, 'days').format('YYYY-MM-DD'),
      location: ['Depot A', 'Depot B', 'Depot C', 'Warehouse A'][i % 4],
      department: ['Operations', 'Maintenance', 'Administration', 'Security'][i % 4],
      penaltyType: ['Performance', 'Quality', 'Safety', 'Compliance', 'Timeliness'][i % 5],
      description: `Penalty description for ${['Performance', 'Quality', 'Safety', 'Compliance', 'Timeliness'][i % 5]} issue ${i + 1}`,
      amount: (50 + Math.random() * 200).toFixed(2),
      severity: ['High', 'Medium', 'Low'][i % 3],
      assignedTo: `Manager ${(i % 5) + 1}`,
      status: ['Resolved', 'Pending', 'Under Review'][i % 3]
    }))
    let reports = [...mockReports]
    if (filters.dateFrom && filters.dateTo) {
      reports = reports.filter(r => r.date >= filters.dateFrom && r.date <= filters.dateTo)
    }
    if (filters.location) reports = reports.filter(r => r.location === filters.location)
    if (filters.department) reports = reports.filter(r => r.department === filters.department)
    if (filters.penaltyType) reports = reports.filter(r => r.penaltyType === filters.penaltyType)
    if (filters.penaltyId) reports = reports.filter(r => r.penaltyId.includes(filters.penaltyId))
    return { data: { reports } }
  },

  // Master Settings APIs
  getUsers: async () => {
    await delay(400)
    const users = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      userId: `USER${String(i + 1).padStart(4, '0')}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@traqops.com`,
      role: ['Admin', 'Manager', 'Technician', 'Operator'][i % 4],
      department: ['Operations', 'Maintenance', 'Administration'][i % 3],
      status: i % 5 === 0 ? 'Inactive' : 'Active'
    }))
    return { data: { users } }
  },

  getLocations: async () => {
    await delay(400)
    const locations = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      locationId: `LOC${String(i + 1).padStart(4, '0')}`,
      name: `Location ${i + 1}`,
      address: `${100 + i} Main Street`,
      city: ['City A', 'City B', 'City C'][i % 3],
      status: i % 3 === 0 ? 'Inactive' : 'Active'
    }))
    return { data: { locations } }
  },

  getShifts: async () => {
    await delay(400)
    const shifts = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      shiftId: `SHIFT${String(i + 1).padStart(2, '0')}`,
      name: ['Morning', 'Afternoon', 'Night', 'Flexible', '24/7'][i],
      startTime: ['06:00', '14:00', '22:00', '00:00', '00:00'][i],
      endTime: ['14:00', '22:00', '06:00', '23:59', '23:59'][i],
      duration: [8, 8, 8, 24, 24][i],
      status: 'Active'
    }))
    return { data: { shifts } }
  },

  getAssets: async () => {
    await delay(400)
    const assets = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      assetId: `ASSET${String(i + 1).padStart(4, '0')}`,
      name: `Asset ${i + 1}`,
      category: ['Equipment', 'Vehicle', 'Building', 'IT'][i % 4],
      location: ['Depot A', 'Depot B', 'Warehouse A'][i % 3],
      status: i % 4 === 0 ? 'Inactive' : 'Active'
    }))
    return { data: { assets } }
  },

  getInventoryItems: async () => {
    await delay(400)
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      itemCode: `ITEM${String(i + 1).padStart(4, '0')}`,
      name: `Inventory Item ${i + 1}`,
      category: ['Spare Parts', 'Tools', 'Consumables', 'Equipment'][i % 4],
      unit: ['Pcs', 'Kg', 'Liters', 'Units'][i % 4],
      status: i % 5 === 0 ? 'Inactive' : 'Active'
    }))
    return { data: { items } }
  },

  getTools: async () => {
    await delay(400)
    const tools = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      toolId: `TOOL${String(i + 1).padStart(4, '0')}`,
      name: `Tool ${i + 1}`,
      category: ['Hand Tools', 'Power Tools', 'Measuring', 'Safety'][i % 4],
      status: i % 3 === 0 ? 'In Use' : 'Available'
    }))
    return { data: { tools } }
  },

  getChecklists: async () => {
    await delay(400)
    const checklists = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      checklistId: `CHK${String(i + 1).padStart(4, '0')}`,
      name: `Checklist ${i + 1}`,
      type: ['Maintenance', 'Operation', 'Safety', 'Inspection'][i % 4],
      itemsCount: 5 + Math.floor(Math.random() * 15),
      status: i % 4 === 0 ? 'Inactive' : 'Active'
    }))
    return { data: { checklists } }
  },

  getCMConfigurations: async () => {
    await delay(400)
    const configs = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      configId: `CONFIG${String(i + 1).padStart(4, '0')}`,
      name: `Configuration ${i + 1}`,
      category: ['System', 'Workflow', 'Notification', 'Integration'][i % 4],
      value: `Value ${i + 1}`,
      status: i % 5 === 0 ? 'Inactive' : 'Active'
    }))
    return { data: { configs } }
  },

  getKPIs: async () => {
    await delay(400)
    const kpis = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      kpiId: `KPI${String(i + 1).padStart(4, '0')}`,
      name: `KPI ${i + 1}`,
      category: ['Performance', 'Quality', 'Safety', 'Efficiency'][i % 4],
      targetValue: (50 + Math.random() * 50).toFixed(1),
      unit: ['%', 'Count', 'Hours', 'Days'][i % 4],
      status: i % 4 === 0 ? 'Inactive' : 'Active'
    }))
    return { data: { kpis } }
  },

  // Update APIs for Master Settings
  updateUser: async (id, data) => {
    await delay(500)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },

  updateLocation: async (id, data) => {
    await delay(500)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },

  updateShift: async (id, data) => {
    await delay(500)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },

  updateAsset: async (id, data) => {
    await delay(500)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },

  updateInventoryItem: async (id, data) => {
    await delay(500)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },

  updateTool: async (id, data) => {
    await delay(500)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },

  updateChecklist: async (id, data) => {
    await delay(500)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },

  updateCMConfiguration: async (id, data) => {
    await delay(500)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },

  updateKPI: async (id, data) => {
    await delay(500)
    return { data: { id, ...data, updatedAt: new Date().toISOString() } }
  },

  // Create APIs for Master Settings
  createUser: async (data) => {
    await delay(500)
    const newId = Date.now()
    return { data: { id: newId, userId: `USER${String(newId).slice(-4)}`, ...data, createdAt: new Date().toISOString() } }
  },

  createLocation: async (data) => {
    await delay(500)
    const newId = Date.now()
    return { data: { id: newId, locationId: `LOC${String(newId).slice(-4)}`, ...data, createdAt: new Date().toISOString() } }
  },

  createShift: async (data) => {
    await delay(500)
    const newId = Date.now()
    return { data: { id: newId, shiftId: `SHIFT${String(newId).slice(-2)}`, ...data, createdAt: new Date().toISOString() } }
  },

  createAsset: async (data) => {
    await delay(500)
    const newId = Date.now()
    return { data: { id: newId, assetId: `ASSET${String(newId).slice(-4)}`, ...data, createdAt: new Date().toISOString() } }
  },

  createInventoryItem: async (data) => {
    await delay(500)
    const newId = Date.now()
    return { data: { id: newId, itemCode: `ITEM${String(newId).slice(-4)}`, ...data, createdAt: new Date().toISOString() } }
  },

  createTool: async (data) => {
    await delay(500)
    const newId = Date.now()
    return { data: { id: newId, toolId: `TOOL${String(newId).slice(-4)}`, ...data, createdAt: new Date().toISOString() } }
  },

  createChecklist: async (data) => {
    await delay(500)
    const newId = Date.now()
    return { data: { id: newId, checklistId: `CHK${String(newId).slice(-4)}`, itemsCount: 0, ...data, createdAt: new Date().toISOString() } }
  },

  createCMConfiguration: async (data) => {
    await delay(500)
    const newId = Date.now()
    return { data: { id: newId, configId: `CFG${String(newId).slice(-4)}`, ...data, createdAt: new Date().toISOString() } }
  },

  createKPI: async (data) => {
    await delay(500)
    const newId = Date.now()
    return { data: { id: newId, kpiId: `KPI${String(newId).slice(-4)}`, ...data, createdAt: new Date().toISOString() } }
  }
}

export default api

