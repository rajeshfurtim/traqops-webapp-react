export const APP_CONFIG = {
  name: 'TraqOps',
  tagline: 'Asset & Maintenance Management System',
  fullName: 'TraqOps | Asset & Maintenance Management',
  description: 'TraqOps is an enterprise asset, maintenance, inventory, and operations management platform.',
  company: 'TraqOps Team',
  keywords: 'asset management, maintenance management, inventory system, operations dashboard, TraqOps'
}

export const PAGE_TITLES = {
  dashboard: 'Dashboard',
  'corrective-maintenance': 'Corrective Maintenance',
  'scheduled-maintenance': 'Scheduled Maintenance',
  inventory: 'Inventory Management',
  reports: 'Reports',
  // Daily Reports
  'reports/daily': 'Daily Reports',
  'reports/daily/energy-consumption': 'Energy Consumption Details',
  'reports/daily/equipment-run-status': 'Equipment Run Status',
  'reports/daily/chiller-run-hour': 'Chiller Run Hour',
  'reports/daily/temperature-run-status': 'Temperature Run Status',
  // Attendance Reports
  'reports/attendance': 'Attendance Reports',
  'reports/attendance/daily': 'Daily Attendance Report',
  'reports/attendance/monthly': 'Monthly Attendance Report',
  'reports/attendance/monthly-employee': 'Monthly Employee Attendance Report',
  'reports/attendance/monthly-daily': 'Monthly Daily Attendance Report',
  'reports/attendance/timesheet': 'Monthly Attendance Timesheet Report',
  'reports/attendance/consolidated-manpower': 'Consolidated Manpower Report',
  // Task Reports
  'reports/tasks': 'Task Reports',
  'reports/tasks/scheduled': 'Scheduled Maintenance Reports',
  'reports/tasks/scheduled-details': 'Scheduled Maintenance Details Reports',
  'reports/tasks/scheduled-consolidated': 'Consolidated Scheduled Maintenance Report',
  'reports/tasks/corrective': 'Corrective Maintenance Reports',
  'reports/tasks/corrective-details': 'Corrective Maintenance Details Reports',
  // Inventory Reports
  'reports/inventory': 'Inventory Reports',
  'reports/inventory/quantity': 'Quantity Reports',
  'reports/inventory/spare-usage': 'Spare Usage Reports',
  'reports/inventory/asset-history': 'Asset History Reports',
  // Evaluation & Penalty
  'reports/evaluation': 'Evaluation & Penalty',
  'reports/evaluation/penalty-summary': 'Penalty Summary',
  'reports/evaluation/penalty-details': 'Penalty Details',
  // Legacy report routes (keep for backward compatibility)
  'reports/attendance-old': 'Attendance Report',
  'reports/tasks-old': 'Task Report',
  'reports/audit': 'Audit Report',
  'reports/tools': 'Tools Report',
  'reports/maintenance-checklist': 'Maintenance Checklist',
  'reports/operation-checklist': 'Operation Checklist',
  'reports/history-cards': 'History Cards',
  'reports/evaluation-penalty': 'Evaluation & Penalty',
  'reports/cmrl-app': 'CMRL App Reports',
  invoices: 'Invoice Management',
  documents: 'Document Management',
  'master-settings': 'Master Settings',
  'master-settings/user': 'User Management',
  'master-settings/location': 'Location Management',
  'master-settings/shifts': 'Shifts Management',
  'master-settings/assets': 'Assets Management',
  'master-settings/inventory': 'Inventory Management',
  'master-settings/tools': 'Tools Management',
  'master-settings/checklist': 'Checklist Management',
  'master-settings/cm-configuration': 'CM Configuration',
  'master-settings/kpis': 'KPIs Management',
  profile: 'Profile',
  settings: 'Settings',
  login: 'Login',
  'forgot-password': 'Forgot Password'
}

export const getPageTitle = (route) => {
  const pageName = PAGE_TITLES[route] || 'TraqOps'
  return `${APP_CONFIG.name} | ${pageName}`
}

