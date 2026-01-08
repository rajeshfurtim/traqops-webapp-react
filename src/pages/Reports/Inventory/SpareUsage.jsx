import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Input } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'

const { RangePicker } = DatePicker

export default function SpareUsageReports() {
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
      const response = await mockApi.getSpareUsageReports(filters)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Error loading spare usage reports:', error)
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
    if (values.location) newFilters.location = values.location
    if (values.asset) newFilters.asset = values.asset
    if (values.partCode) newFilters.partCode = values.partCode
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  const columns = [
    {
      title: 'Part Code',
      dataIndex: 'partCode',
      key: 'partCode',
      width: 120
    },
    {
      title: 'Part Name',
      dataIndex: 'partName',
      key: 'partName',
      width: 200
    },
    {
      title: 'Asset',
      dataIndex: 'asset',
      key: 'asset',
      width: 150
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 150
    },
    {
      title: 'Quantity Used',
      dataIndex: 'quantityUsed',
      key: 'quantityUsed',
      width: 130,
      align: 'right'
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 80
    },
    {
      title: 'Usage Date',
      dataIndex: 'usageDate',
      key: 'usageDate',
      width: 140,
      render: (text) => dayjs(text).format('MMM DD, YYYY')
    },
    {
      title: 'Used By',
      dataIndex: 'usedBy',
      key: 'usedBy',
      width: 150
    },
    {
      title: 'Work Order',
      dataIndex: 'workOrder',
      key: 'workOrder',
      width: 120
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      width: 200
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/inventory/spare-usage')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Spare Usage Reports`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Spare Usage Reports
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
              <Form.Item name="location" label="Location">
                <Select placeholder="All Locations" style={{ width: 150 }} allowClear>
                  <Select.Option value="Warehouse A">Warehouse A</Select.Option>
                  <Select.Option value="Warehouse B">Warehouse B</Select.Option>
                  <Select.Option value="Depot A">Depot A</Select.Option>
                  <Select.Option value="Depot B">Depot B</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="asset" label="Asset">
                <Input placeholder="Asset ID" style={{ width: 150 }} allowClear />
              </Form.Item>
              <Form.Item name="partCode" label="Part Code">
                <Input placeholder="Part Code" style={{ width: 150 }} allowClear />
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

