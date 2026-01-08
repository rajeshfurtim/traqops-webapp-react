import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton } from 'antd'
import dayjs from 'dayjs'
import { mockApi } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'

const { RangePicker } = DatePicker

export default function CorrectiveMaintenance() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filters, setFilters] = useState({})
  const [form] = Form.useForm()

  useEffect(() => {
    loadTickets()
  }, [filters])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getCorrectiveMaintenanceTickets(filters)
      setTickets(response.data.tickets)
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (values) => {
    const newFilters = {}
    if (values.status) newFilters.status = values.status
    if (values.priority) newFilters.priority = values.priority
    if (values.dateRange && values.dateRange.length === 2) {
      newFilters.dateFrom = values.dateRange[0].format('YYYY-MM-DD')
      newFilters.dateTo = values.dateRange[1].format('YYYY-MM-DD')
    }
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  const handleRowClick = async (record) => {
    try {
      const response = await mockApi.getCorrectiveMaintenanceTicket(record.id)
      setSelectedTicket(response.data)
      setDialogOpen(true)
    } catch (error) {
      console.error('Error loading ticket details:', error)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Completed': 'success',
      'In Progress': 'info',
      'Pending': 'warning',
      'Overdue': 'error'
    }
    return colors[status] || 'default'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': '#17a2b8',
      'Medium': '#ffc107',
      'High': '#fd7e14',
      'Critical': '#dc3545'
    }
    return colors[priority] || '#000'
  }

  const columns = [
    {
      title: 'Ticket ID',
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
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority) => (
        <Chip
          label={priority}
          size="small"
          sx={{ bgcolor: getPriorityColor(priority), color: 'white', fontWeight: 'bold' }}
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
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => dayjs(text).format('MMM DD, YYYY HH:mm')
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('corrective-maintenance')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Corrective Maintenance Management`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Corrective Maintenance
        </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterChange}
            style={{ marginBottom: 16 }}
          >
            <Form.Item name="status" label="Status">
              <Select
                placeholder="Select Status"
                allowClear
                style={{ width: 150 }}
              >
                <Select.Option value="Completed">Completed</Select.Option>
                <Select.Option value="In Progress">In Progress</Select.Option>
                <Select.Option value="Pending">Pending</Select.Option>
                <Select.Option value="Overdue">Overdue</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="priority" label="Priority">
              <Select
                placeholder="Select Priority"
                allowClear
                style={{ width: 150 }}
              >
                <Select.Option value="Low">Low</Select.Option>
                <Select.Option value="Medium">Medium</Select.Option>
                <Select.Option value="High">High</Select.Option>
                <Select.Option value="Critical">Critical</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="dateRange" label="Date Range">
              <RangePicker />
            </Form.Item>
            <Form.Item>
              <Space>
                <AntButton type="primary" htmlType="submit">
                  Filter
                </AntButton>
                <AntButton onClick={handleResetFilters}>
                  Reset
                </AntButton>
              </Space>
            </Form.Item>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Table
              dataSource={tickets}
              columns={columns}
              rowKey="id"
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: 'pointer' }
              })}
              pagination={{ pageSize: 10 }}
              size="middle"
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ticket Details - {selectedTicket?.id}</DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedTicket.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedTicket.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  label={`Priority: ${selectedTicket.priority}`}
                  sx={{ bgcolor: getPriorityColor(selectedTicket.priority), color: 'white' }}
                />
                <Chip label={`Status: ${selectedTicket.status}`} color={getStatusColor(selectedTicket.status)} />
                <Chip label={`Category: ${selectedTicket.category}`} />
              </Box>
              <Typography variant="body2"><strong>Assigned To:</strong> {selectedTicket.assignedTo}</Typography>
              <Typography variant="body2"><strong>Location:</strong> {selectedTicket.location}</Typography>
              <Typography variant="body2">
                <strong>Created At:</strong> {dayjs(selectedTicket.createdAt).format('MMM DD, YYYY HH:mm')}
              </Typography>
              {selectedTicket.completedAt && (
                <Typography variant="body2">
                  <strong>Completed At:</strong> {dayjs(selectedTicket.completedAt).format('MMM DD, YYYY HH:mm')}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      </Box>
    </>
  )
}

