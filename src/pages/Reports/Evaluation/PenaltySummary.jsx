import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Tag } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { formatCurrency, formatNumber } from '../../../utils/formatters'

const { RangePicker } = DatePicker

export default function PenaltySummary() {
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
      const response = await mockApi.getPenaltySummary(filters)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Error loading penalty summary:', error)
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
    if (values.department) newFilters.department = values.department
    if (values.penaltyType) newFilters.penaltyType = values.penaltyType
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  const getPenaltyTypeColor = (type) => {
    const colors = {
      'Performance': 'orange',
      'Quality': 'red',
      'Safety': 'purple',
      'Compliance': 'blue',
      'Timeliness': 'cyan'
    }
    return colors[type] || 'default'
  }

  const columns = [
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      width: 120
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 150
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 150
    },
    {
      title: 'Penalty Type',
      dataIndex: 'penaltyType',
      key: 'penaltyType',
      width: 140,
      render: (type) => <Tag color={getPenaltyTypeColor(type)}>{type}</Tag>
    },
    {
      title: 'Total Penalties',
      dataIndex: 'totalPenalties',
      key: 'totalPenalties',
      width: 130,
      align: 'right'
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 140,
      align: 'right',
      render: (text) => formatCurrency(text)
    },
    {
      title: 'Average Penalty',
      dataIndex: 'averagePenalty',
      key: 'averagePenalty',
      width: 140,
      align: 'right',
      render: (text) => formatCurrency(text)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const color = status === 'Resolved' ? 'green' : status === 'Pending' ? 'orange' : 'red'
        return <Tag color={color}>{status}</Tag>
      }
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/evaluation/penalty-summary')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Penalty Summary`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Penalty Summary
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
                  <Select.Option value="Depot A">Depot A</Select.Option>
                  <Select.Option value="Depot B">Depot B</Select.Option>
                  <Select.Option value="Depot C">Depot C</Select.Option>
                  <Select.Option value="Warehouse A">Warehouse A</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="department" label="Department">
                <Select placeholder="All Departments" style={{ width: 150 }} allowClear>
                  <Select.Option value="Operations">Operations</Select.Option>
                  <Select.Option value="Maintenance">Maintenance</Select.Option>
                  <Select.Option value="Administration">Administration</Select.Option>
                  <Select.Option value="Security">Security</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="penaltyType" label="Penalty Type">
                <Select placeholder="All Types" style={{ width: 150 }} allowClear>
                  <Select.Option value="Performance">Performance</Select.Option>
                  <Select.Option value="Quality">Quality</Select.Option>
                  <Select.Option value="Safety">Safety</Select.Option>
                  <Select.Option value="Compliance">Compliance</Select.Option>
                  <Select.Option value="Timeliness">Timeliness</Select.Option>
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

