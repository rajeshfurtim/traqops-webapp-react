import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'

export default function ConsolidatedManpowerReport() {
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
      const response = await mockApi.getConsolidatedManpowerReport(filters)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Error loading consolidated manpower report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (values) => {
    const newFilters = {}
    if (values.month) {
      newFilters.month = values.month.format('YYYY-MM')
    }
    if (values.department) newFilters.department = values.department
    setFilters(newFilters)
  }

  const columns = [
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 200
    },
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      width: 120
    },
    {
      title: 'Total Manpower',
      dataIndex: 'totalManpower',
      key: 'totalManpower',
      width: 140
    },
    {
      title: 'Active Employees',
      dataIndex: 'activeEmployees',
      key: 'activeEmployees',
      width: 140
    },
    {
      title: 'On Leave',
      dataIndex: 'onLeave',
      key: 'onLeave',
      width: 120
    },
    {
      title: 'Absent',
      dataIndex: 'absent',
      key: 'absent',
      width: 120
    },
    {
      title: 'Utilization %',
      dataIndex: 'utilizationPercent',
      key: 'utilizationPercent',
      width: 130,
      render: (text) => `${text}%`
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/attendance/consolidated-manpower')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Consolidated Manpower Report`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Consolidated Manpower Report
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
              <Form.Item name="department" label="Department">
                <Select placeholder="All Departments" style={{ width: 150 }} allowClear>
                  <Select.Option value="Operations">Operations</Select.Option>
                  <Select.Option value="Maintenance">Maintenance</Select.Option>
                  <Select.Option value="Administration">Administration</Select.Option>
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

