import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Tag, Input, Row, Col } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { formatCurrency } from '../../../utils/formatters'

const { RangePicker } = DatePicker

export default function PenaltyDetails() {
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
      const response = await mockApi.getPenaltyDetails(filters)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Error loading penalty details:', error)
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
    if (values.penaltyId) newFilters.penaltyId = values.penaltyId
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

  const getSeverityColor = (severity) => {
    const colors = {
      'High': 'red',
      'Medium': 'orange',
      'Low': 'blue'
    }
    return colors[severity] || 'default'
  }

  const columns = [
    {
      title: 'Penalty ID',
      dataIndex: 'penaltyId',
      key: 'penaltyId',
      width: 120
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (text) => dayjs(text).format('MMM DD, YYYY')
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
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (text) => formatCurrency(text)
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity) => <Tag color={getSeverityColor(severity)}>{severity}</Tag>
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 150
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
        <title>{getPageTitle('reports/evaluation/penalty-details')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Penalty Details`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Penalty Details
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              onFinish={handleFilterChange}
              layout="vertical"
            >
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12} md={6} lg={4}>
                  <Form.Item name="dateRange" label="Date Range">
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                  <Form.Item name="location" label="Location">
                    <Select placeholder="All Locations" style={{ width: '100%' }} allowClear>
                      <Select.Option value="Depot A">Depot A</Select.Option>
                      <Select.Option value="Depot B">Depot B</Select.Option>
                      <Select.Option value="Depot C">Depot C</Select.Option>
                      <Select.Option value="Warehouse A">Warehouse A</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                  <Form.Item name="department" label="Department">
                    <Select placeholder="All Departments" style={{ width: '100%' }} allowClear>
                      <Select.Option value="Operations">Operations</Select.Option>
                      <Select.Option value="Maintenance">Maintenance</Select.Option>
                      <Select.Option value="Administration">Administration</Select.Option>
                      <Select.Option value="Security">Security</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                  <Form.Item name="penaltyType" label="Penalty Type">
                    <Select placeholder="All Types" style={{ width: '100%' }} allowClear>
                      <Select.Option value="Performance">Performance</Select.Option>
                      <Select.Option value="Quality">Quality</Select.Option>
                      <Select.Option value="Safety">Safety</Select.Option>
                      <Select.Option value="Compliance">Compliance</Select.Option>
                      <Select.Option value="Timeliness">Timeliness</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                  <Form.Item name="penaltyId" label="Penalty ID">
                    <Input placeholder="Penalty ID" style={{ width: '100%' }} allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                  <Form.Item label=" " style={{ marginTop: { xs: 0, sm: '32px' } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: { xs: 'stretch', sm: 'flex-start' },
                        '& .ant-btn': {
                          width: { xs: '100%', sm: 'auto' },
                          minWidth: { sm: '100px' }
                        }
                      }}
                    >
                      <AntButton type="primary" htmlType="submit">
                        Apply Filters
                      </AntButton>
                      <AntButton onClick={handleResetFilters}>
                        Reset
                      </AntButton>
                    </Box>
                  </Form.Item>
                </Col>
              </Row>
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

