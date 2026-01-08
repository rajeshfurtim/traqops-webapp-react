import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { formatNumber, formatCurrency } from '../../../utils/formatters'

const { RangePicker } = DatePicker

export default function EnergyConsumption() {
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
      const response = await mockApi.getEnergyConsumption(filters)
      setReports(response.data.reports)
    } catch (error) {
      console.error('Error loading energy consumption:', error)
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
    if (values.location) newFilters.location = values.location
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (text) => dayjs(text).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix()
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 200
    },
    {
      title: 'Meter Reading',
      dataIndex: 'meterReading',
      key: 'meterReading',
      width: 150,
      render: (value) => formatNumber(value),
      sorter: (a, b) => (a.meterReading || 0) - (b.meterReading || 0)
    },
    {
      title: 'Units Consumed',
      dataIndex: 'unitsConsumed',
      key: 'unitsConsumed',
      width: 150,
      render: (value) => formatNumber(value),
      sorter: (a, b) => (a.unitsConsumed || 0) - (b.unitsConsumed || 0)
    },
    {
      title: 'Cost ($)',
      dataIndex: 'cost',
      key: 'cost',
      width: 120,
      render: (value) => formatCurrency(value),
      sorter: (a, b) => (a.cost || 0) - (b.cost || 0)
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
        <title>{getPageTitle('reports/daily/energy-consumption')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Energy Consumption Details`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Energy Consumption Details
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form form={form} layout="inline" onFinish={handleFilterChange} style={{ marginBottom: 16 }}>
              <Form.Item name="dateRange" label="Date Range">
                <RangePicker />
              </Form.Item>
              <Form.Item name="depot" label="Depot">
                <Select placeholder="Select Depot" allowClear style={{ width: 150 }}>
                  <Select.Option value="Depot A">Depot A</Select.Option>
                  <Select.Option value="Depot B">Depot B</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="location" label="Location">
                <Select placeholder="Select Location" allowClear style={{ width: 200 }}>
                  <Select.Option value="Building A">Building A</Select.Option>
                  <Select.Option value="Building B">Building B</Select.Option>
                  <Select.Option value="Building C">Building C</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Space>
                  <AntButton type="primary" htmlType="submit">Filter</AntButton>
                  <AntButton onClick={handleResetFilters}>Reset</AntButton>
                </Space>
              </Form.Item>
            </Form>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <AntButton icon={<FileExcelOutlined />} onClick={() => console.log('Export Excel')}>
                Export Excel
              </AntButton>
              <AntButton icon={<FilePdfOutlined />} onClick={() => console.log('Export PDF')}>
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
              <Table dataSource={reports} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} size="middle" />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

