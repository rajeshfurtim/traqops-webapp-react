import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useClient } from '../context/ClientContext'
import { isPathAllowedForClient } from '../config/sidebarMenu'
import { CircularProgress, Box, Typography, Card, CardContent } from '@mui/material'
import { Result, Button } from 'antd'

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const { selectedClient, isChanging } = useClient()
  const location = useLocation()

  if (loading || isChanging) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (location.pathname !== '/dashboard' && location.pathname !== '/') {
    if (selectedClient === 'All' || !selectedClient) {
      return children
    }

    if (!isPathAllowedForClient(location.pathname, selectedClient)) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="calc(100vh - 200px)"
          p={3}
        >
          <Card style={{ maxWidth: 500, textAlign: 'center' }}>
            <CardContent>
              <Result
                status="403"
                title="403"
                subTitle="Sorry, you are not authorized to access this page for the selected client."
                extra={
                  <Button type="primary" onClick={() => window.location.href = '/dashboard'}>
                    Go to Dashboard
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </Box>
      )
    }
  }

  return children
}

