import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton, Tag } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../services/api'
import { getPageTitle, APP_CONFIG } from '../../config/constants'

export default function EvaluationPenalty() {
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
      const response = await mockApi.getEvaluationPenalty(filters)
      setReports(response.data.reports)
    } catch (error) {
      console.error('Error loading evaluation penalty:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (values) => {
    const newFilters = {}
    if (values.depot) newFilters.depot = values.depot
    if (values.penaltyType) newFilters.penaltyType = values.penaltyType
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 150
    },
    {
      title: 'Employee',
      dataIndex: 'employee',
      key: 'employee',
      width: 150
    },
    {
      title: 'Evaluation Period',
      dataIndex: 'evaluationPeriod',
      key: 'evaluationPeriod',
      width: 150
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      sorter: (a, b) => a.score - b.score,
      render: (score) => (
        <Tag color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'}>
          {score}
        </Tag>
      )
    },
    {
      title: 'Penalty Type',
      dataIndex: 'penaltyType',
      key: 'penaltyType',
      width: 150,
      render: (type) => (
        <Tag color={type === 'None' ? 'success' : 'error'}>{type}</Tag>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => amount > 0 ? `$${amount.toLocaleString()}` : '-',
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: 'Depot',
      dataIndex: 'depot',
      key: 'depot',
      width: 120
    },
    {
      title: 'Evaluated By',
      dataIndex: 'evaluatedBy',
      key: 'evaluatedBy',
      width: 150
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (text) => dayjs(text).format('MMM DD, YYYY')
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/evaluation-penalty')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Evaluation & Penalty`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Evaluation & Penalty
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
              <Form.Item name="penaltyType" label="Penalty Type">
                <Select placeholder="Select Type" allowClear style={{ width: 150 }}>
                  <Select.Option value="None">None</Select.Option>
                  <Select.Option value="Late Attendance">Late Attendance</Select.Option>
                  <Select.Option value="Absenteeism">Absenteeism</Select.Option>
                  <Select.Option value="Minor Infraction">Minor Infraction</Select.Option>
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

