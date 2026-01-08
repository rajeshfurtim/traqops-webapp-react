import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress, Chip } from '@mui/material'
import { Table, Tag } from 'antd'
import dayjs from 'dayjs'
import { mockApi } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'

export default function ScheduledMaintenance() {
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState([])

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getScheduledMaintenance()
      setSchedules(response.data.schedules)
    } catch (error) {
      console.error('Error loading schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Scheduled': 'success',
      'Overdue': 'error',
      'In Progress': 'info',
      'Completed': 'default'
    }
    return colors[status] || 'default'
  }

  const getFrequencyColor = (frequency) => {
    const colors = {
      'Monthly': '#1976d2',
      'Quarterly': '#2e7d32',
      'Semi-Annual': '#ed6c02',
      'Annual': '#9c27b0'
    }
    return colors[frequency] || '#000'
  }

  const columns = [
    {
      title: 'Schedule ID',
      dataIndex: 'id',
      key: 'id',
      width: 150
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 120,
      render: (frequency) => (
        <Chip
          label={frequency}
          size="small"
          sx={{ bgcolor: getFrequencyColor(frequency), color: 'white', fontWeight: 'bold' }}
        />
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Chip label={status} color={getStatusColor(status)} size="small" />
      )
    },
    {
      title: 'Next Due',
      dataIndex: 'nextDue',
      key: 'nextDue',
      width: 150,
      render: (text) => dayjs(text).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.nextDue).unix() - dayjs(b.nextDue).unix()
    },
    {
      title: 'Last Completed',
      dataIndex: 'lastCompleted',
      key: 'lastCompleted',
      width: 150,
      render: (text) => dayjs(text).format('MMM DD, YYYY')
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 150
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 200
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => <Tag color="blue">{category}</Tag>
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('scheduled-maintenance')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Scheduled Maintenance Management`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Scheduled Maintenance
        </Typography>

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Table
              dataSource={schedules}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="middle"
            />
          )}
        </CardContent>
      </Card>
      </Box>
    </>
  )
}

