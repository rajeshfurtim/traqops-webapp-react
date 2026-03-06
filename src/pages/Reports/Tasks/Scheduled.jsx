import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress, Grid } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Row, Col } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import useGetFreqencyList from '../../../hooks/useGetFrequencyList'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetFrequencyCountQuery } from '../../../store/api/taskReport.api'
import { useAuth } from '../../../context/AuthContext'
import { FaClipboardList, FaExternalLinkAlt, FaCheckSquare, FaCheckCircle } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const { RangePicker } = DatePicker

export default function ScheduledMaintenanceReports() {

  const [form] = Form.useForm()
  const { user } = useAuth()

  const { freqencyList, isLoading: frequencyLoading } = useGetFreqencyList()
  const { locations, loading: locationsLoading } = useGetLocationList()

  const [filters, setFilters] = useState({
    fromDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
    locationId: '-1',
    frequencyId: '',
  })
  const navigate = useNavigate()

  const clientId = user?.client?.id || user?.clientId

  const { data: reportData, isLoading } =
    useGetFrequencyCountQuery({ ...filters, clientId }, {
      skip: !filters.fromDate || !filters.toDate,
    })

  const reports = (reportData?.data || []).map((item, index) => ({
    id: item.frequencyId,
    sno: index + 1,
    location: item.locationName || 'ALL',
    locationId: item.locationId ?? -1, 
    frequency: item.frequencyName,
    frequencyId: item.frequencyId ?? -1,
    open: item.openCount || 0,
    completed: item.completedCount || 0,
    verified: item.verifiedCount || 0,
    total:
      (item.openCount || 0) +
      (item.completedCount || 0) +
      (item.verifiedCount || 0),
  }))
  /* ---------------- CHART DATA (Recharts stacked) ---------------- */

  const rechartsStackData = (reportData?.data || [])
    .filter(
      (item) =>
        item.openCount > 0 ||
        item.completedCount > 0 ||
        item.verifiedCount > 0
    )
    .map((item) => ({
      frequency: item.frequencyName,
      open: item.openCount || 0,
      completed: item.completedCount || 0,
      verified: item.verifiedCount || 0,
    }))

  const handleChartBarClick = (payload, statusType) => {
    if (!payload?.frequency) return
    navigate('/reports/tasks/ScheduledDetailsPages/TaskReport', {
      state: {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        locationId: filters.locationId,
        frequencyId: payload.frequency,
        statusType,
      },
    })
  }
  const handleApplyFilters = (values) => {
    setFilters({
      fromDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      toDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
      locationId: values.location,
      frequencyId:
        values.frequencyId === -1
          ? freqencyList.map((fre) => fre.id)
          : values.frequencyId,
    })
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({
      fromDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
      toDate: dayjs().format('YYYY-MM-DD'),
      locationId: undefined,
      frequencyId: undefined,
    })
  }

  const totalOpen = reports.reduce((sum, item) => sum + item.open, 0)
  const totalCompleted = reports.reduce((sum, item) => sum + item.completed, 0)
  const totalVerified = reports.reduce((sum, item) => sum + item.verified, 0)
  const totalTasks = totalOpen + totalCompleted + totalVerified

  const boxes = [
    {
      key: 'total',
      label: 'Total Tasks',
      value: totalTasks,
      color: '#1677ff',
      icon: <FaClipboardList size={32} color="#1677ff" />,
    },
    {
      key: 'open',
      label: 'Open',
      value: totalOpen,
      color: '#fa8c16',
      icon: <FaExternalLinkAlt size={32} color="#fa8c16" />,
    },
    {
      key: 'completed',
      label: 'Completed',
      value: totalCompleted,
      color: '#52c41a',
      icon: <FaCheckSquare size={32} color="#52c41a" />,
    },
    {
      key: 'verified',
      label: 'Verified',
      value: totalVerified,
      color: '#13c2c2',
      icon: <FaCheckCircle size={32} color="#13c2c2" />,
    },
  ]

  /* ---------------- STATUS PILL STYLES ---------------- */

  const getStatusColor = (type, value) => {
    if (value === 0) return '#bfbfbf'
    const colors = {
      open: '#ff4d6d',
      completed: '#69b1ff',
      verified: '#73d13d'
    }
    return colors[type]
  }

  const pillContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  }

  const pillStyle = {
    display: 'flex',
    alignItems: 'stretch',
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid #d9d9d9',
    transition: 'all 0.2s ease',
    cursor: 'default',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    minWidth: 96,
    maxWidth: '100%',
    flex: '1 1 90px',
  }

  const countStyle = {
    padding: '3px 8px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    minWidth: 32,
    textAlign: 'center',
    flexShrink: 0,
  }

  /* ---------------- TABLE COLUMNS ---------------- */

  const columns = [
    { title: 'S.No', dataIndex: 'sno', key: 'sno', width: 60, align: 'center' },
    { title: 'Location', dataIndex: 'location', key: 'location', width: 200, align: 'center' },
    { title: 'Frequency', dataIndex: 'frequency', key: 'frequency', width: 150, align: 'center' },

    {
      title: 'Status',
      key: 'status',
      align: 'center',
      render: (_, record) => {

        const renderPill = (label, value, type) => {
          const color = getStatusColor(type, value)

          return (
            <div
              style={{ ...pillStyle, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              onClick={() => {
                navigate('/reports/tasks/ScheduledDetailsPages/TaskReport', {
                  state: {
                    fromDate: filters.fromDate,
                    toDate: filters.toDate,
                    locationId: record.locationId,  // now defined
                    frequencyId: record.frequencyId, // now defined
                    statusType: type,
                  }
                })
              }}
            >

              <span style={{
                backgroundColor: color,
                color: 'white',
                padding: '3px 8px'
              }}>
                {label}
              </span>
              <span style={countStyle}>{value}</span>
            </div>
          )
        }

        return (
          <div style={pillContainerStyle}>
            {renderPill('Open', record.open, 'open')}
            {renderPill('Completed', record.completed, 'completed')}
            {renderPill('Verified', record.verified, 'verified')}
          </div>
        )
      }
    },

  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/tasks/scheduled')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Scheduled Maintenance Reports`} />
      </Helmet>

      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Scheduled Maintenance Reports
        </Typography>

        {/* FILTER FORM */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleApplyFilters}
              initialValues={{
                dateRange: [dayjs().subtract(1, 'day'), dayjs()],
                location: -1,
                frequencyId: -1,
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="dateRange" label="Date Range">
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="location" label="Location">
                    <Select
                      style={{ width: '100%' }}
                      allowClear
                      loading={locationsLoading}
                    >
                      <Select.Option value={-1}>All Locations</Select.Option>
                      {locations?.map((loc) => (
                        <Select.Option key={loc.id} value={loc.id}>
                          {loc.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="frequencyId" label="Frequency">
                    <Select
                      style={{ width: '100%' }}
                      allowClear
                      loading={frequencyLoading}
                    >
                      <Select.Option value={-1}>All Frequency</Select.Option>
                      {freqencyList?.map((fre) => (
                        <Select.Option key={fre.id} value={fre.id}>
                          {fre.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col
                  xs={24}
                  sm={12}
                  md={8}
                  lg={6}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Space wrap>
                      <AntButton type="primary" htmlType="submit">
                        Apply Filters
                      </AntButton>
                      <AntButton onClick={handleResetFilters}>Reset</AntButton>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </CardContent>
        </Card>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {boxes.map((box) => (
            <Grid item xs={12} sm={6} md={3} key={box.key}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: `1px solid ${box.color}`,
                  backgroundColor: `${box.color}0f`, // light tint based on border color
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.18)',
                  },
                }}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      backgroundColor: `${box.color}1a`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {box.icon}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}
                    >
                      {box.label}
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      sx={{ color: box.color, mt: 0.5 }}
                    >
                      {box.value}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* TABLE */}
        <Card sx={{ mt: 2 }}>
          <CardContent>
            {isLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box
                      sx={{
                        width: '100%',
                        height: 400,
                        outline: 'none',
                        '&:focus': { outline: 'none' },
                        '& *': { outline: 'none' },
                        '& *:focus': { outline: 'none' },
                        '& .recharts-layer': { outline: 'none' },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={rechartsStackData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="frequency" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="open"
                            stackId="a"
                            fill="#ff4d6d"
                            stroke="none"
                            name="Open"
                            cursor="pointer"
                            onClick={(data) => handleChartBarClick(data, 'Open')}
                            radius={[0, 0, 0, 0]}
                            activeBar={{ stroke: 'none' }}
                          />
                          <Bar
                            dataKey="completed"
                            stackId="a"
                            fill="#69b1ff"
                            stroke="none"
                            name="Completed"
                            cursor="pointer"
                            onClick={(data) => handleChartBarClick(data, 'Completed')}
                            radius={[0, 0, 0, 0]}
                            activeBar={{ stroke: 'none' }}
                          />
                          <Bar
                            dataKey="verified"
                            stackId="a"
                            fill="#73d13d"
                            stroke="none"
                            name="Verified"
                            cursor="pointer"
                            onClick={(data) => handleChartBarClick(data, 'Verified')}
                            radius={[4, 4, 0, 0]}
                            activeBar={{ stroke: 'none' }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
                <Table
                  dataSource={reports}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 20 }}
                  bordered
                  size="middle"
                />
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}