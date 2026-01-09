import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ClientProvider } from '../context/ClientContext'
import { ProtectedRoute } from '../components/ProtectedRoute'
import PageTitle from '../components/PageTitle'
import ErrorBoundary from '../components/ErrorBoundary'
import Login from '../pages/Login'
import ForgotPassword from '../pages/ForgotPassword'
import DashboardLayout from '../components/layout/DashboardLayout'
import Dashboard from '../pages/Dashboard'
import CorrectiveMaintenance from '../pages/CorrectiveMaintenance'
import ScheduledMaintenance from '../pages/ScheduledMaintenance'
import Inventory from '../pages/Inventory'
import ReportsIndex from '../pages/Reports/index'
// Daily Reports
import DailyReportsIndex from '../pages/Reports/Daily/index'
import EnergyConsumption from '../pages/Reports/Daily/EnergyConsumption'
import EquipmentRunStatus from '../pages/Reports/Daily/EquipmentRunStatus'
import ChillerRunHour from '../pages/Reports/Daily/ChillerRunHour'
import TemperatureRunStatus from '../pages/Reports/Daily/TemperatureRunStatus'
// Attendance Reports
import DailyAttendanceReport from '../pages/Reports/Attendance/Daily'
import MonthlyAttendanceReport from '../pages/Reports/Attendance/Monthly'
import MonthlyEmployeeAttendanceReport from '../pages/Reports/Attendance/MonthlyEmployee'
import MonthlyDailyAttendanceReport from '../pages/Reports/Attendance/MonthlyDaily'
import TimesheetReport from '../pages/Reports/Attendance/Timesheet'
import ConsolidatedManpowerReport from '../pages/Reports/Attendance/ConsolidatedManpower'
// Task Reports
import TasksIndex from '../pages/Reports/Tasks/index'
import ScheduledMaintenanceReports from '../pages/Reports/Tasks/Scheduled'
import ScheduledMaintenanceDetailsReports from '../pages/Reports/Tasks/ScheduledDetails'
import ConsolidatedScheduledMaintenanceReport from '../pages/Reports/Tasks/ScheduledConsolidated'
import CorrectiveMaintenanceReports from '../pages/Reports/Tasks/Corrective'
import CorrectiveMaintenanceDetailsReports from '../pages/Reports/Tasks/CorrectiveDetails'
// Inventory Reports
import InventoryReportsIndex from '../pages/Reports/Inventory/index'
import QuantityReports from '../pages/Reports/Inventory/Quantity'
import SpareUsageReports from '../pages/Reports/Inventory/SpareUsage'
import AssetHistoryReports from '../pages/Reports/Inventory/AssetHistory'
// Evaluation Reports
import EvaluationReportsIndex from '../pages/Reports/Evaluation/index'
import PenaltySummary from '../pages/Reports/Evaluation/PenaltySummary'
import PenaltyDetails from '../pages/Reports/Evaluation/PenaltyDetails'
// Legacy reports (keep for backward compatibility)
import DailyReports from '../pages/Reports/DailyReports'
import AttendanceReport from '../pages/Reports/AttendanceReport'
import TaskReport from '../pages/Reports/TaskReport'
import AuditReport from '../pages/Reports/AuditReport'
import InventoryReport from '../pages/Reports/InventoryReport'
import ToolsReport from '../pages/Reports/ToolsReport'
import MaintenanceChecklist from '../pages/Reports/MaintenanceChecklist'
import OperationChecklist from '../pages/Reports/OperationChecklist'
import HistoryCards from '../pages/Reports/HistoryCards'
import EvaluationPenalty from '../pages/Reports/EvaluationPenalty'
import CmrlAppReports from '../pages/Reports/CmrlAppReports'
import Invoices from '../pages/Invoices'
import Documents from '../pages/Documents'
// Master Settings
import MasterSettingsIndex from '../pages/MasterSettings/index'
import UserMaster from '../pages/MasterSettings/User'
import LocationMaster from '../pages/MasterSettings/Location'
import ShiftsMaster from '../pages/MasterSettings/Shifts'
import AssetsMaster from '../pages/MasterSettings/Assets'
import InventoryMaster from '../pages/MasterSettings/Inventory'
import ToolsMaster from '../pages/MasterSettings/Tools'
import ChecklistMaster from '../pages/MasterSettings/Checklist'
import CMConfiguration from '../pages/MasterSettings/CMConfiguration'
import KPIsMaster from '../pages/MasterSettings/KPIs'
// Legacy MasterSettings (keep for backward compatibility)
import MasterSettings from '../pages/MasterSettings'
// Profile and Settings
import Profile from '../pages/Profile'
import Settings from '../pages/Settings'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ClientProvider>
          <PageTitle />
          <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="corrective-maintenance" element={<CorrectiveMaintenance />} />
          <Route path="scheduled-maintenance" element={<ScheduledMaintenance />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="reports" element={<ReportsIndex />} />
          {/* Daily Reports nested routes */}
          <Route path="reports/daily" element={<DailyReportsIndex />} />
          <Route path="reports/daily/energy-consumption" element={<EnergyConsumption />} />
          <Route path="reports/daily/equipment-run-status" element={<EquipmentRunStatus />} />
          <Route path="reports/daily/chiller-run-hour" element={<ChillerRunHour />} />
          <Route path="reports/daily/temperature-run-status" element={<TemperatureRunStatus />} />
          {/* Attendance Reports nested routes */}
          <Route path="reports/attendance/daily" element={<DailyAttendanceReport />} />
          <Route path="reports/attendance/monthly" element={<MonthlyAttendanceReport />} />
          <Route path="reports/attendance/monthly-employee" element={<MonthlyEmployeeAttendanceReport />} />
          <Route path="reports/attendance/monthly-daily" element={<MonthlyDailyAttendanceReport />} />
          <Route path="reports/attendance/timesheet" element={<TimesheetReport />} />
          <Route path="reports/attendance/consolidated-manpower" element={<ConsolidatedManpowerReport />} />
          {/* Task Reports nested routes */}
          <Route path="reports/tasks" element={<TasksIndex />} />
          <Route path="reports/tasks/scheduled" element={<ScheduledMaintenanceReports />} />
          <Route path="reports/tasks/scheduled-details" element={<ScheduledMaintenanceDetailsReports />} />
          <Route path="reports/tasks/scheduled-consolidated" element={<ConsolidatedScheduledMaintenanceReport />} />
          <Route path="reports/tasks/corrective" element={<CorrectiveMaintenanceReports />} />
          <Route path="reports/tasks/corrective-details" element={<CorrectiveMaintenanceDetailsReports />} />
          {/* Catch-all for task reports - redirect to scheduled */}
          <Route path="reports/tasks/*" element={<Navigate to="/reports/tasks/scheduled" replace />} />
          {/* Inventory Reports nested routes */}
          <Route path="reports/inventory" element={<InventoryReportsIndex />} />
          <Route path="reports/inventory/quantity" element={<QuantityReports />} />
          <Route path="reports/inventory/spare-usage" element={<SpareUsageReports />} />
          <Route path="reports/inventory/asset-history" element={<AssetHistoryReports />} />
          {/* Catch-all for inventory reports - redirect to quantity */}
          <Route path="reports/inventory/*" element={<Navigate to="/reports/inventory/quantity" replace />} />
          {/* Evaluation Reports nested routes */}
          <Route path="reports/evaluation" element={<EvaluationReportsIndex />} />
          <Route path="reports/evaluation/penalty-summary" element={<PenaltySummary />} />
          <Route path="reports/evaluation/penalty-details" element={<PenaltyDetails />} />
          {/* Catch-all for evaluation reports - redirect to penalty-summary */}
          <Route path="reports/evaluation/*" element={<Navigate to="/reports/evaluation/penalty-summary" replace />} />
          {/* Legacy report routes (backward compatibility) */}
          <Route path="reports/daily-old" element={<DailyReports />} />
          <Route path="reports/attendance" element={<AttendanceReport />} />
          <Route path="reports/tasks-old" element={<TaskReport />} />
          <Route path="reports/audit" element={<AuditReport />} />
          <Route path="reports/inventory-old" element={<InventoryReport />} />
          <Route path="reports/tools" element={<ToolsReport />} />
          <Route path="reports/maintenance-checklist" element={<MaintenanceChecklist />} />
          <Route path="reports/operation-checklist" element={<OperationChecklist />} />
          <Route path="reports/history-cards" element={<HistoryCards />} />
          <Route path="reports/evaluation-penalty" element={<EvaluationPenalty />} />
          <Route path="reports/cmrl-app" element={<CmrlAppReports />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="documents" element={<Documents />} />
          {/* Master Settings nested routes */}
          <Route path="master-settings" element={<MasterSettingsIndex />} />
          <Route path="master-settings/user" element={<UserMaster />} />
          <Route path="master-settings/location" element={<LocationMaster />} />
          <Route path="master-settings/shifts" element={<ShiftsMaster />} />
          <Route path="master-settings/assets" element={<AssetsMaster />} />
          <Route path="master-settings/inventory" element={<InventoryMaster />} />
          <Route path="master-settings/tools" element={<ToolsMaster />} />
          <Route path="master-settings/checklist" element={<ChecklistMaster />} />
          <Route path="master-settings/cm-configuration" element={<CMConfiguration />} />
          <Route path="master-settings/kpis" element={<KPIsMaster />} />
          {/* Catch-all for master settings - redirect to user */}
          <Route path="master-settings/*" element={<Navigate to="/master-settings/user" replace />} />
          {/* Legacy master settings (backward compatibility) */}
          <Route path="master-settings-old" element={<MasterSettings />} />
        </Route>
      </Routes>
        </ClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

