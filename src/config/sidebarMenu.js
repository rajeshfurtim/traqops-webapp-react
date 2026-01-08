// Sidebar menu configuration
// Icons are referenced by name and resolved in the component to avoid build issues

export const sidebarMenuConfig = [
  {
    key: '/dashboard',
    icon: 'DashboardOutlined',
    label: 'Dashboard',
    path: '/dashboard'
  },
  {
    key: '/corrective-maintenance',
    icon: 'ToolOutlined',
    label: 'Corrective Maintenance',
    path: '/corrective-maintenance'
  },
  {
    key: '/scheduled-maintenance',
    icon: 'CalendarOutlined',
    label: 'Scheduled Maintenance',
    path: '/scheduled-maintenance'
  },
  {
    key: '/inventory',
    icon: 'DatabaseOutlined',
    label: 'Inventory',
    path: '/inventory'
  },
  {
    key: '/reports',
    icon: 'FileTextOutlined',
    label: 'Reports',
    path: '/reports',
    children: [
      {
        key: '/reports/daily',
        icon: 'FileTextOutlined',
        label: 'Daily Reports',
        path: '/reports/daily',
        children: [
          {
            key: '/reports/daily/energy-consumption',
            icon: 'ThunderboltOutlined',
            label: 'Energy Consumption Details',
            path: '/reports/daily/energy-consumption'
          },
          {
            key: '/reports/daily/equipment-run-status',
            icon: 'DesktopOutlined',
            label: 'Equipment Run Status',
            path: '/reports/daily/equipment-run-status'
          },
          {
            key: '/reports/daily/chiller-run-hour',
            icon: 'ClockCircleOutlined',
            label: 'Chiller Run Hour',
            path: '/reports/daily/chiller-run-hour'
          },
          {
            key: '/reports/daily/temperature-run-status',
            icon: 'LineChartOutlined',
            label: 'Temperature Run Status',
            path: '/reports/daily/temperature-run-status'
          }
        ]
      },
      {
        key: '/reports/attendance',
        icon: 'TeamOutlined',
        label: 'Attendance Reports',
        path: '/reports/attendance',
        children: [
          {
            key: '/reports/attendance/daily',
            icon: 'FileTextOutlined',
            label: 'Daily Attendance Report',
            path: '/reports/attendance/daily'
          },
          {
            key: '/reports/attendance/monthly',
            icon: 'FileTextOutlined',
            label: 'Monthly Attendance Report',
            path: '/reports/attendance/monthly'
          },
          {
            key: '/reports/attendance/monthly-employee',
            icon: 'UserOutlined',
            label: 'Monthly Employee Attendance Report',
            path: '/reports/attendance/monthly-employee'
          },
          {
            key: '/reports/attendance/monthly-daily',
            icon: 'FileTextOutlined',
            label: 'Monthly Daily Attendance Report',
            path: '/reports/attendance/monthly-daily'
          },
          {
            key: '/reports/attendance/timesheet',
            icon: 'ClockCircleOutlined',
            label: 'Monthly Attendance Timesheet Report',
            path: '/reports/attendance/timesheet'
          },
          {
            key: '/reports/attendance/consolidated-manpower',
            icon: 'TeamOutlined',
            label: 'Consolidated Manpower Report',
            path: '/reports/attendance/consolidated-manpower'
          }
        ]
      },
      {
        key: '/reports/tasks',
        icon: 'CheckCircleOutlined',
        label: 'Task Reports',
        path: '/reports/tasks',
        children: [
          {
            key: '/reports/tasks/scheduled',
            icon: 'ScheduleOutlined',
            label: 'Scheduled Maintenance Reports',
            path: '/reports/tasks/scheduled'
          },
          {
            key: '/reports/tasks/scheduled-details',
            icon: 'FileTextOutlined',
            label: 'Scheduled Maintenance Details Reports',
            path: '/reports/tasks/scheduled-details'
          },
          {
            key: '/reports/tasks/scheduled-consolidated',
            icon: 'BarChartOutlined',
            label: 'Consolidated Scheduled Maintenance Report',
            path: '/reports/tasks/scheduled-consolidated'
          },
          {
            key: '/reports/tasks/corrective',
            icon: 'BuildOutlined',
            label: 'Corrective Maintenance Reports',
            path: '/reports/tasks/corrective'
          },
          {
            key: '/reports/tasks/corrective-details',
            icon: 'FileTextOutlined',
            label: 'Corrective Maintenance Details Reports',
            path: '/reports/tasks/corrective-details'
          }
        ]
      },
      {
        key: '/reports/inventory',
        icon: 'ShoppingOutlined',
        label: 'Inventory Reports',
        path: '/reports/inventory',
        children: [
          {
            key: '/reports/inventory/quantity',
            icon: 'DatabaseOutlined',
            label: 'Quantity Reports',
            path: '/reports/inventory/quantity'
          },
          {
            key: '/reports/inventory/spare-usage',
            icon: 'ToolOutlined',
            label: 'Spare Usage Reports',
            path: '/reports/inventory/spare-usage'
          },
          {
            key: '/reports/inventory/asset-history',
            icon: 'FileTextOutlined',
            label: 'Asset History Reports',
            path: '/reports/inventory/asset-history'
          }
        ]
      },
      {
        key: '/reports/evaluation',
        icon: 'BarChartOutlined',
        label: 'Evaluation & Penalty',
        path: '/reports/evaluation',
        children: [
          {
            key: '/reports/evaluation/penalty-summary',
            icon: 'BarChartOutlined',
            label: 'Penalty Summary',
            path: '/reports/evaluation/penalty-summary'
          },
          {
            key: '/reports/evaluation/penalty-details',
            icon: 'FileTextOutlined',
            label: 'Penalty Details',
            path: '/reports/evaluation/penalty-details'
          }
        ]
      }
    ]
  },
  {
    key: '/invoices',
    icon: 'DollarOutlined',
    label: 'Invoices',
    path: '/invoices'
  },
  {
    key: '/documents',
    icon: 'FolderOpenOutlined',
    label: 'Documents',
    path: '/documents'
  },
  {
    type: 'divider'
  },
  {
    key: '/master-settings',
    icon: 'SettingOutlined',
    label: 'Master Settings',
    path: '/master-settings',
    children: [
      {
        key: '/master-settings/user',
        icon: 'UserOutlined',
        label: 'User',
        path: '/master-settings/user'
      },
      {
        key: '/master-settings/location',
        icon: 'EnvironmentOutlined',
        label: 'Location',
        path: '/master-settings/location'
      },
      {
        key: '/master-settings/shifts',
        icon: 'SwapOutlined',
        label: 'Shifts',
        path: '/master-settings/shifts'
      },
      {
        key: '/master-settings/assets',
        icon: 'DatabaseOutlined',
        label: 'Assets',
        path: '/master-settings/assets'
      },
      {
        key: '/master-settings/inventory',
        icon: 'DatabaseOutlined',
        label: 'Inventory',
        path: '/master-settings/inventory'
      },
      {
        key: '/master-settings/tools',
        icon: 'ToolOutlined',
        label: 'Tools',
        path: '/master-settings/tools'
      },
      {
        key: '/master-settings/checklist',
        icon: 'UnorderedListOutlined',
        label: 'Check List',
        path: '/master-settings/checklist'
      },
      {
        key: '/master-settings/cm-configuration',
        icon: 'ApiOutlined',
        label: 'CM Configuration',
        path: '/master-settings/cm-configuration'
      },
      {
        key: '/master-settings/kpis',
        icon: 'LineChartOutlined',
        label: 'KPIs',
        path: '/master-settings/kpis'
      }
    ]
  }
]

// Helper function to get breadcrumbs from menu config
export const getBreadcrumbsFromPath = (pathname, menuConfig = sidebarMenuConfig) => {
  const breadcrumbs = [{ label: 'Home', path: '/dashboard' }]
  
  const findPath = (items, targetPath, currentPath = []) => {
    for (const item of items) {
      if (item.path === targetPath) {
        return [...currentPath, item]
      }
      if (item.children) {
        const found = findPath(item.children, targetPath, [...currentPath, item])
        if (found) return found
      }
    }
    return null
  }
  
  const pathItems = findPath(menuConfig, pathname)
  if (pathItems) {
    pathItems.forEach(item => {
      if (item.path && item.path !== '/dashboard') {
        breadcrumbs.push({ label: item.label, path: item.path })
      }
    })
  }
  
  return breadcrumbs
}
