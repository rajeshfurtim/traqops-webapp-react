import { Navigate } from 'react-router-dom'

export default function ReportsIndex() {
  // Redirect to first report (Daily Reports)
  return <Navigate to="/reports/daily" replace />
}

