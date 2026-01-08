import { useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getPageTitle, APP_CONFIG } from '../config/constants'

export default function PageTitle() {
  const location = useLocation()
  // Handle nested routes (e.g., /reports/daily -> reports/daily)
  const path = location.pathname.replace(/^\//, '').replace(/\/$/, '') || 'dashboard'
  const title = getPageTitle(path)

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={APP_CONFIG.description} />
    </Helmet>
  )
}

