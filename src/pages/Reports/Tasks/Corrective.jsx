import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Tag } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'

const { RangePicker } = DatePicker

export default function CorrectiveMaintenanceReports() {
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
      const response = await mockApi.getCorrectiveMaintenanceReports(filters)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Error loading corrective maintenance reports:', error)
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
    if (values.status) newFilters.status = values.status
    if (values.priority) newFilters.priority = values.priority
    if (values.depot) newFilters.depot = values.depot
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  const getStatusColor = (status) => {
    const colors = {
      'Resolved': 'green',
      'Open': 'red',
      'In Progress': 'blue',
      'Pending': 'orange'
    }
    return colors[status] || 'default'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'High': 'red',
      'Medium': 'orange',
      'Low': 'blue'
    }
    return colors[priority] || 'default'
  }

  const columns = [
    {
      title: 'Issue ID',
      dataIndex: 'issueId',
      key: 'issueId',
      width: 120
    },
    {
      title: 'Issue Description',
      dataIndex: 'issueDescription',
      key: 'issueDescription',
      width: 250
    },
    {
      title: 'Asset',
      dataIndex: 'asset',
      key: 'asset',
      width: 150
    },
    {
      title: 'Reported Date',
      dataIndex: 'reportedDate',
      key: 'reportedDate',
      width: 140,
      render: (text) => dayjs(text).format('MMM DD, YYYY')
    },
    {
      title: 'Resolved Date',
      dataIndex: 'resolvedDate',
      key: 'resolvedDate',
      width: 140,
      render: (text) => text ? dayjs(text).format('MMM DD, YYYY') : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => <Tag color={getPriorityColor(priority)}>{priority}</Tag>
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 150
    },
    {
      title: 'Depot',
      dataIndex: 'depot',
      key: 'depot',
      width: 120
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/tasks/corrective')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Corrective Maintenance Reports`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Corrective Maintenance Reports
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
              <Form.Item name="status" label="Status">
                <Select placeholder="All Status" style={{ width: 150 }} allowClear>
                  <Select.Option value="Resolved">Resolved</Select.Option>
                  <Select.Option value="Open">Open</Select.Option>
                  <Select.Option value="In Progress">In Progress</Select.Option>
                  <Select.Option value="Pending">Pending</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="priority" label="Priority">
                <Select placeholder="All Priorities" style={{ width: 120 }} allowClear>
                  <Select.Option value="High">High</Select.Option>
                  <Select.Option value="Medium">Medium</Select.Option>
                  <Select.Option value="Low">Low</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="depot" label="Depot">
                <Select placeholder="All Depots" style={{ width: 150 }} allowClear>
                  <Select.Option value="Depot A">Depot A</Select.Option>
                  <Select.Option value="Depot B">Depot B</Select.Option>
                  <Select.Option value="Depot C">Depot C</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Space>
                  <AntButton type="primary" htmlType="submit">
                    Apply Filters
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Space>
                <AntButton icon={<FileExcelOutlined />}>Export Excel</AntButton>
                <AntButton icon={<FilePdfOutlined />}>Export PDF</AntButton>
              </Space>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Table
                dataSource={reports}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 20 }}
                size="middle"
              />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

