import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Input } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'

const { RangePicker } = DatePicker

export default function QuantityReports() {
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
      const response = await mockApi.getQuantityReports(filters)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Error loading quantity reports:', error)
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
    if (values.category) newFilters.category = values.category
    if (values.asset) newFilters.asset = values.asset
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  const columns = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 120
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      width: 200
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 150
    },
    {
      title: 'Current Quantity',
      dataIndex: 'currentQuantity',
      key: 'currentQuantity',
      width: 140,
      align: 'right'
    },
    {
      title: 'Minimum Quantity',
      dataIndex: 'minimumQuantity',
      key: 'minimumQuantity',
      width: 140,
      align: 'right'
    },
    {
      title: 'Maximum Quantity',
      dataIndex: 'maximumQuantity',
      key: 'maximumQuantity',
      width: 140,
      align: 'right'
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 80
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const color = status === 'In Stock' ? 'green' : status === 'Low Stock' ? 'orange' : 'red'
        return <span style={{ color }}>{status}</span>
      }
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: 140,
      render: (text) => dayjs(text).format('MMM DD, YYYY')
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/inventory/quantity')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Quantity Reports`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Quantity Reports
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
              <Form.Item name="category" label="Category">
                <Select placeholder="All Categories" style={{ width: 150 }} allowClear>
                  <Select.Option value="Spare Parts">Spare Parts</Select.Option>
                  <Select.Option value="Tools">Tools</Select.Option>
                  <Select.Option value="Consumables">Consumables</Select.Option>
                  <Select.Option value="Equipment">Equipment</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="asset" label="Asset">
                <Input placeholder="Asset ID" style={{ width: 150 }} allowClear />
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

