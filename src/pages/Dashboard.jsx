import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Grid, Card, CardContent, Typography, CircularProgress } from '@mui/material'
import { Table } from 'antd'
import dayjs from 'dayjs'
import { mockApi } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'
import MaintenanceStatusChart from '../components/charts/MaintenanceStatusChart'
import InventoryStockChart from '../components/charts/InventoryStockChart'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await mockApi.getDashboardData()
      setDashboardData(response.data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!dashboardData) {
    return <Typography>No data available</Typography>
  }

  const kpiCards = [
    {
      title: 'Total Tickets',
      value: dashboardData.kpis.totalTickets.toLocaleString(),
      color: '#1976d2'
    },
    {
      title: 'Open Tickets',
      value: dashboardData.kpis.openTickets,
      color: '#ed6c02'
    },
    {
      title: 'Completed This Month',
      value: dashboardData.kpis.completedThisMonth,
      color: '#2e7d32'
    },
    {
      title: 'Inventory Value',
      value: `$${dashboardData.kpis.inventoryValue.toLocaleString()}`,
      color: '#9c27b0'
    }
  ]

  const activityColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      width: 150
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (text) => dayjs(text).format('MMM DD, YYYY HH:mm')
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('dashboard')}</title>
        <meta name="description" content={`${APP_CONFIG.name} Dashboard - ${APP_CONFIG.description}`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Dashboard
        </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpiCards.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  {kpi.title}
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: kpi.color, fontWeight: 'bold' }}>
                  {kpi.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <MaintenanceStatusChart data={dashboardData.maintenanceStatus} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <InventoryStockChart data={dashboardData.inventoryStock} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Recent Activity
          </Typography>
          <Table
            dataSource={dashboardData.recentActivity}
            columns={activityColumns}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="middle"
          />
        </CardContent>
      </Card>
      </Box>
    </>
  )
}

