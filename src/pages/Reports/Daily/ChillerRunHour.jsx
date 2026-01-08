import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'

export default function ChillerRunHour() {
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
      const response = await mockApi.getChillerRunHour(filters)
      setReports(response.data.reports)
    } catch (error) {
      console.error('Error loading chiller run hour:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (values) => {
    const newFilters = {}
    if (values.depot) newFilters.depot = values.depot
    setFilters(newFilters)
  }

  const columns = [
    { title: 'Chiller ID', dataIndex: 'chillerId', key: 'chillerId', width: 150 },
    { title: 'Chiller Name', dataIndex: 'chillerName', key: 'chillerName', width: 200 },
    { title: 'Total Run Hours', dataIndex: 'totalRunHours', key: 'totalRunHours', width: 150, sorter: (a, b) => a.totalRunHours - b.totalRunHours },
    { title: 'Idle Hours', dataIndex: 'idleHours', key: 'idleHours', width: 120, sorter: (a, b) => a.idleHours - b.idleHours },
    { title: 'Location', dataIndex: 'location', key: 'location', width: 150 },
    { title: 'Depot', dataIndex: 'depot', key: 'depot', width: 120 },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (text) => dayjs(text).format('MMM DD, YYYY') }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/daily/chiller-run-hour')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Chiller Run Hour`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">Chiller Run Hour</Typography>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form form={form} layout="inline" onFinish={handleFilterChange} style={{ marginBottom: 16 }}>
              <Form.Item name="depot" label="Depot">
                <Select placeholder="Select Depot" allowClear style={{ width: 150 }}>
                  <Select.Option value="Depot A">Depot A</Select.Option>
                  <Select.Option value="Depot B">Depot B</Select.Option>
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

