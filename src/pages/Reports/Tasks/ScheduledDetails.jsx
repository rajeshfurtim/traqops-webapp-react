import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Tag } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'

const { RangePicker } = DatePicker

export default function ScheduledMaintenanceDetailsReports() {
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
      const response = await mockApi.getScheduledMaintenanceDetailsReports(filters)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Error loading scheduled maintenance details reports:', error)
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
    if (values.taskId) newFilters.taskId = values.taskId
    if (values.depot) newFilters.depot = values.depot
    setFilters(newFilters)
  }

  const columns = [
    {
      title: 'Task ID',
      dataIndex: 'taskId',
      key: 'taskId',
      width: 120
    },
    {
      title: 'Task Name',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 200
    },
    {
      title: 'Asset',
      dataIndex: 'asset',
      key: 'asset',
      width: 150
    },
    {
      title: 'Checklist Item',
      dataIndex: 'checklistItem',
      key: 'checklistItem',
      width: 200
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <Tag color={status === 'Completed' ? 'green' : 'orange'}>{status}</Tag>
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 250
    },
    {
      title: 'Completed By',
      dataIndex: 'completedBy',
      key: 'completedBy',
      width: 150
    },
    {
      title: 'Completed Date',
      dataIndex: 'completedDate',
      key: 'completedDate',
      width: 140,
      render: (text) => text ? dayjs(text).format('MMM DD, YYYY HH:mm') : '-'
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/tasks/scheduled-details')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Scheduled Maintenance Details Reports`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Scheduled Maintenance Details Reports
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
              <Form.Item name="taskId" label="Task ID">
                <Select placeholder="All Tasks" style={{ width: 150 }} allowClear showSearch>
                  <Select.Option value="TASK001">TASK001</Select.Option>
                  <Select.Option value="TASK002">TASK002</Select.Option>
                  <Select.Option value="TASK003">TASK003</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="depot" label="Depot">
                <Select placeholder="All Depots" style={{ width: 150 }} allowClear>
                  <Select.Option value="Depot A">Depot A</Select.Option>
                  <Select.Option value="Depot B">Depot B</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Space>
                  <AntButton type="primary" htmlType="submit">
                    Apply Filters
                  </AntButton>
                  <AntButton onClick={() => { form.resetFields(); setFilters({}) }}>
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

