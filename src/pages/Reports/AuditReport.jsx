import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton, Tag } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../services/api'
import { getPageTitle, APP_CONFIG } from '../../config/constants'

export default function AuditReport() {
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
      const response = await mockApi.getAuditReport(filters)
      setReports(response.data.reports)
    } catch (error) {
      console.error('Error loading audit report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (values) => {
    const newFilters = {}
    if (values.depot) newFilters.depot = values.depot
    if (values.complianceStatus) newFilters.complianceStatus = values.complianceStatus
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  const getSeverityColor = (severity) => {
    const colors = {
      'Critical': 'red',
      'High': 'orange',
      'Medium': 'gold',
      'Low': 'green'
    }
    return colors[severity] || 'default'
  }

  const columns = [
    {
      title: 'Audit ID',
      dataIndex: 'id',
      key: 'id',
      width: 120
    },
    {
      title: 'Audit Date',
      dataIndex: 'auditDate',
      key: 'auditDate',
      width: 120,
      render: (text) => dayjs(text).format('MMM DD, YYYY')
    },
    {
      title: 'Area',
      dataIndex: 'area',
      key: 'area',
      width: 200
    },
    {
      title: 'Findings',
      dataIndex: 'findings',
      key: 'findings',
      ellipsis: true
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity) => <Tag color={getSeverityColor(severity)}>{severity}</Tag>
    },
    {
      title: 'Compliance Status',
      dataIndex: 'complianceStatus',
      key: 'complianceStatus',
      width: 150,
      render: (status) => (
        <Tag color={status === 'Compliant' ? 'success' : 'error'}>{status}</Tag>
      )
    },
    {
      title: 'Auditor',
      dataIndex: 'auditor',
      key: 'auditor',
      width: 150
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
        <title>{getPageTitle('reports/audit')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Audit Report`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Audit Report
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form form={form} layout="inline" onFinish={handleFilterChange} style={{ marginBottom: 16 }}>
              <Form.Item name="depot" label="Depot">
                <Select placeholder="Select Depot" allowClear style={{ width: 150 }}>
                  <Select.Option value="Depot A">Depot A</Select.Option>
                  <Select.Option value="Depot B">Depot B</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="complianceStatus" label="Compliance Status">
                <Select placeholder="Select Status" allowClear style={{ width: 150 }}>
                  <Select.Option value="Compliant">Compliant</Select.Option>
                  <Select.Option value="Non-Compliant">Non-Compliant</Select.Option>
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

