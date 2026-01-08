import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton, Tag } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'

export default function TemperatureRunStatus() {
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
      const response = await mockApi.getTemperatureRunStatus(filters)
      setReports(response.data.reports)
    } catch (error) {
      console.error('Error loading temperature run status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (values) => {
    const newFilters = {}
    if (values.depot) newFilters.depot = values.depot
    if (values.status) newFilters.status = values.status
    setFilters(newFilters)
  }

  const getStatusColor = (status) => {
    const colors = { 'Normal': 'success', 'High': 'error', 'Low': 'warning' }
    return colors[status] || 'default'
  }

  const columns = [
    { title: 'Location', dataIndex: 'location', key: 'location', width: 200 },
    { title: 'Min Temperature (°C)', dataIndex: 'minTemperature', key: 'minTemperature', width: 150, sorter: (a, b) => a.minTemperature - b.minTemperature },
    { title: 'Max Temperature (°C)', dataIndex: 'maxTemperature', key: 'maxTemperature', width: 150, sorter: (a, b) => a.maxTemperature - b.maxTemperature },
    { title: 'Average Temperature (°C)', dataIndex: 'averageTemperature', key: 'averageTemperature', width: 180 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag> },
    { title: 'Depot', dataIndex: 'depot', key: 'depot', width: 120 },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (text) => dayjs(text).format('MMM DD, YYYY') }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/daily/temperature-run-status')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Temperature Run Status`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">Temperature Run Status</Typography>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form form={form} layout="inline" onFinish={handleFilterChange} style={{ marginBottom: 16 }}>
              <Form.Item name="depot" label="Depot">
                <Select placeholder="Select Depot" allowClear style={{ width: 150 }}>
                  <Select.Option value="Depot A">Depot A</Select.Option>
                  <Select.Option value="Depot B">Depot B</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="status" label="Status">
                <Select placeholder="Select Status" allowClear style={{ width: 150 }}>
                  <Select.Option value="Normal">Normal</Select.Option>
                  <Select.Option value="High">High</Select.Option>
                  <Select.Option value="Low">Low</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Space>
                  <AntButton type="primary" htmlType="submit">Filter</AntButton>
                  <AntButton onClick={() => { form.resetFields(); setFilters({}) }}>Reset</AntButton>
                </Space>
              </Form.Item>
            </Form>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <AntButton icon={<FileExcelOutlined />}>Export Excel</AntButton>
              <AntButton icon={<FilePdfOutlined />}>Export PDF</AntButton>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            {loading ? <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box> :
              <Table dataSource={reports} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} size="middle" />}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

