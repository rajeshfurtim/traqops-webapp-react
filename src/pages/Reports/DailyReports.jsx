import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Tag } from 'antd'
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../services/api'
import { getPageTitle, APP_CONFIG } from '../../config/constants'

const { RangePicker } = DatePicker

export default function DailyReports() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [filters, setFilters] = useState({})
  const [form] = Form.useForm()

  useEffect(() => {
    loadReports()
  }, [filters])

  const loadReports = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getDailyReports(filters)
      setReports(response.data.reports)
    } catch (error) {
      console.error('Error loading daily reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (values) => {
    const newFilters = {}
    if (values.dateRange && values.dateRange.length === 2) {
      newFilters.dateFrom = values.dateRange[0].format('YYYY-MM-DD')
      newFilters.dateTo = values.dateRange[1].format('YYYY-MM-DD')
    }
    if (values.depot) newFilters.depot = values.depot
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  const handleExport = (format) => {
    console.log(`Exporting to ${format}...`)
  }

  const getStatusColor = (status) => {
    const colors = {
      'Completed': 'success',
      'In Progress': 'processing',
      'Pending': 'warning'
    }
    return colors[status] || 'default'
  }

  const columns = [
    {
      title: 'Report ID',
      dataIndex: 'id',
      key: 'id',
      width: 150
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (text) => dayjs(text).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix()
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
      key: 'shift',
      width: 120
    },
    {
      title: 'Total Tasks',
      dataIndex: 'totalTasks',
      key: 'totalTasks',
      width: 120,
      sorter: (a, b) => a.totalTasks - b.totalTasks
    },
    {
      title: 'Completed',
      dataIndex: 'completedTasks',
      key: 'completedTasks',
      width: 120,
      sorter: (a, b) => a.completedTasks - b.completedTasks
    },
    {
      title: 'Pending',
      dataIndex: 'pendingTasks',
      key: 'pendingTasks',
      width: 120,
      sorter: (a, b) => a.pendingTasks - b.pendingTasks
    },
    {
      title: 'Depot',
      dataIndex: 'depot',
      key: 'depot',
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/daily')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Daily Reports`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Daily Reports
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              layout="inline"
              onFinish={handleFilterChange}
              style={{ marginBottom: 16 }}
            >
              <Form.Item name="dateRange" label="Date Range">
                <RangePicker />
              </Form.Item>
              <Form.Item name="depot" label="Depot">
                <Select placeholder="Select Depot" allowClear style={{ width: 150 }}>
                  <Select.Option value="Depot A">Depot A</Select.Option>
                  <Select.Option value="Depot B">Depot B</Select.Option>
                </Select>
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
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <AntButton icon={<FileExcelOutlined />} onClick={() => handleExport('excel')}>
                Export Excel
              </AntButton>
              <AntButton icon={<FilePdfOutlined />} onClick={() => handleExport('pdf')}>
                Export PDF
              </AntButton>
            </Box>
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
                dataSource={reports}
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

