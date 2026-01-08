import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'

export default function ConsolidatedScheduledMaintenanceReport() {
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
      const response = await mockApi.getConsolidatedScheduledMaintenanceReport(filters)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Error loading consolidated scheduled maintenance report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (values) => {
    const newFilters = {}
    if (values.month) {
      newFilters.month = values.month.format('YYYY-MM')
    }
    if (values.depot) newFilters.depot = values.depot
    setFilters(newFilters)
  }

  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      width: 120
    },
    {
      title: 'Depot',
      dataIndex: 'depot',
      key: 'depot',
      width: 120
    },
    {
      title: 'Total Tasks',
      dataIndex: 'totalTasks',
      key: 'totalTasks',
      width: 120
    },
    {
      title: 'Completed',
      dataIndex: 'completed',
      key: 'completed',
      width: 120
    },
    {
      title: 'Pending',
      dataIndex: 'pending',
      key: 'pending',
      width: 120
    },
    {
      title: 'Overdue',
      dataIndex: 'overdue',
      key: 'overdue',
      width: 120
    },
    {
      title: 'Completion %',
      dataIndex: 'completionPercent',
      key: 'completionPercent',
      width: 130,
      render: (text) => `${text}%`
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/tasks/scheduled-consolidated')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Consolidated Scheduled Maintenance Report`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Consolidated Scheduled Maintenance Report
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              layout="inline"
              onFinish={handleFilterChange}
              style={{ marginBottom: 16 }}
            >
              <Form.Item name="month" label="Month">
                <DatePicker picker="month" />
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

