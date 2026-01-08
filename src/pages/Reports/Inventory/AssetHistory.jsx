import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Input, Tag } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { formatCurrency } from '../../../utils/formatters'

const { RangePicker } = DatePicker

export default function AssetHistoryReports() {
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
      const response = await mockApi.getAssetHistoryReports(filters)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Error loading asset history reports:', error)
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
    if (values.eventType) newFilters.eventType = values.eventType
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  const getEventTypeColor = (type) => {
    const colors = {
      'Maintenance': 'blue',
      'Repair': 'orange',
      'Installation': 'green',
      'Relocation': 'purple',
      'Inspection': 'cyan',
      'Decommission': 'red'
    }
    return colors[type] || 'default'
  }

  const columns = [
    {
      title: 'Asset ID',
      dataIndex: 'assetId',
      key: 'assetId',
      width: 120
    },
    {
      title: 'Asset Name',
      dataIndex: 'assetName',
      key: 'assetName',
      width: 200
    },
    {
      title: 'Event Type',
      dataIndex: 'eventType',
      key: 'eventType',
      width: 140,
      render: (type) => <Tag color={getEventTypeColor(type)}>{type}</Tag>
    },
    {
      title: 'Event Date',
      dataIndex: 'eventDate',
      key: 'eventDate',
      width: 140,
      render: (text) => dayjs(text).format('MMM DD, YYYY')
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 150
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300
    },
    {
      title: 'Performed By',
      dataIndex: 'performedBy',
      key: 'performedBy',
      width: 150
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      width: 120,
      align: 'right',
      render: (text) => formatCurrency(text)
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/inventory/asset-history')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Asset History Reports`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Asset History Reports
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
              <Form.Item name="eventType" label="Event Type">
                <Select placeholder="All Events" style={{ width: 150 }} allowClear>
                  <Select.Option value="Maintenance">Maintenance</Select.Option>
                  <Select.Option value="Repair">Repair</Select.Option>
                  <Select.Option value="Installation">Installation</Select.Option>
                  <Select.Option value="Relocation">Relocation</Select.Option>
                  <Select.Option value="Inspection">Inspection</Select.Option>
                  <Select.Option value="Decommission">Decommission</Select.Option>
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

