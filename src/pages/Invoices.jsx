import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Grid, Typography, Card, CardContent, CircularProgress, Chip, Button } from '@mui/material'
import { Table, Tag, Steps, Modal, message } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, DollarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'

export default function Invoices() {
  const [loading, setLoading] = useState(true)
  const [invoicesData, setInvoicesData] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getInvoices()
      setInvoicesData(response.data)
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await mockApi.updateInvoiceStatus(id, status)
      message.success(`Invoice ${id} status updated to ${status}`)
      loadInvoices()
    } catch (error) {
      message.error('Failed to update invoice status')
    }
  }

  const handleRowClick = (record) => {
    setSelectedInvoice(record)
    setModalOpen(true)
  }

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'warning',
      'Approved': 'info',
      'Rejected': 'error',
      'Paid': 'success'
    }
    return colors[status] || 'default'
  }

  const getStatusIcon = (status) => {
    const icons = {
      'Pending': <ClockCircleOutlined />,
      'Approved': <CheckCircleOutlined />,
      'Rejected': <CloseCircleOutlined />,
      'Paid': <DollarOutlined />
    }
    return icons[status] || null
  }

  const getApprovalSteps = (invoice) => {
    const steps = [
      {
        title: 'Submitted',
        status: 'finish',
        icon: <ClockCircleOutlined />
      }
    ]

    if (invoice.status === 'Approved' || invoice.status === 'Paid') {
      steps.push({
        title: 'Approved',
        status: 'finish',
        icon: <CheckCircleOutlined />
      })
    } else if (invoice.status === 'Rejected') {
      steps.push({
        title: 'Rejected',
        status: 'error',
        icon: <CloseCircleOutlined />
      })
      return steps
    } else {
      steps.push({
        title: 'Pending Approval',
        status: 'wait',
        icon: <ClockCircleOutlined />
      })
    }

    if (invoice.status === 'Paid') {
      steps.push({
        title: 'Paid',
        status: 'finish',
        icon: <DollarOutlined />
      })
    }

    return steps
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!invoicesData) {
    return <Typography>No data available</Typography>
  }

  const summaryCards = [
    {
      title: 'Total Invoices',
      value: invoicesData.summary.total,
      color: '#1976d2'
    },
    {
      title: 'Pending',
      value: invoicesData.summary.pending,
      color: '#ed6c02'
    },
    {
      title: 'Approved',
      value: invoicesData.summary.approved,
      color: '#2e7d32'
    },
    {
      title: 'Paid',
      value: invoicesData.summary.paid,
      color: '#9c27b0'
    }
  ]

  const columns = [
    {
      title: 'Invoice ID',
      dataIndex: 'id',
      key: 'id',
      width: 150
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      width: 200
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (text) => dayjs(text).format('MMM DD, YYYY')
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (text) => dayjs(text).format('MMM DD, YYYY')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Chip
          label={status}
          color={getStatusColor(status)}
          size="small"
          icon={getStatusIcon(status)}
        />
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category) => <Tag color="blue">{category}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {record.status === 'Pending' && (
            <>
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusUpdate(record.id, 'Approved')
                }}
              >
                Approve
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusUpdate(record.id, 'Rejected')
                }}
              >
                Reject
              </Button>
            </>
          )}
          {record.status === 'Approved' && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={(e) => {
                e.stopPropagation()
                handleStatusUpdate(record.id, 'Paid')
              }}
            >
              Mark Paid
            </Button>
          )}
        </Box>
      )
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('invoices')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Invoice Management System`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Invoice Management
        </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  {card.title}
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: card.color, fontWeight: 'bold' }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Invoice Table */}
      <Card>
        <CardContent>
          <Table
            dataSource={invoicesData.invoices}
            columns={columns}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: 'pointer' }
            })}
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </CardContent>
      </Card>

      {/* Invoice Detail Modal */}
      <Modal
        title={`Invoice Details - ${selectedInvoice?.id}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedInvoice && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedInvoice.vendor}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {selectedInvoice.description}
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Steps
                items={getApprovalSteps(selectedInvoice)}
                current={selectedInvoice.status === 'Pending' ? 1 : selectedInvoice.status === 'Approved' ? 2 : 3}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">
                <strong>Amount:</strong> ${selectedInvoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {dayjs(selectedInvoice.date).format('MMM DD, YYYY')}
              </Typography>
              <Typography variant="body2">
                <strong>Due Date:</strong> {dayjs(selectedInvoice.dueDate).format('MMM DD, YYYY')}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {selectedInvoice.status}
              </Typography>
              <Typography variant="body2">
                <strong>Category:</strong> {selectedInvoice.category}
              </Typography>
              {selectedInvoice.approver && (
                <Typography variant="body2">
                  <strong>Approved By:</strong> {selectedInvoice.approver}
                </Typography>
              )}
              {selectedInvoice.approvedAt && (
                <Typography variant="body2">
                  <strong>Approved At:</strong> {dayjs(selectedInvoice.approvedAt).format('MMM DD, YYYY HH:mm')}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Modal>
      </Box>
    </>
  )
}

