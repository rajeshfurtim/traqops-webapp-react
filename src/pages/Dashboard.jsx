import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Grid, Card, CardContent, Typography, CircularProgress } from '@mui/material'
import { Table, Tabs, Form, DatePicker, Select, Button, Row, Col } from 'antd'
import dayjs from 'dayjs'
import { mockApi } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'
import { useGetLocationListQuery, useGetAllShiftQuery } from '../store/api/masterSettings.api'
import { useAuth } from '../context/AuthContext'
import { domainName as fallbackDomainName } from '../config/apiConfig'
import { UserOutlined } from '@ant-design/icons'
import RechartsResponsiveBox from '../components/charts/RechartsResponsiveBox'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'

export default function Dashboard() {
  const [filterForm] = Form.useForm()
  const [locationWiseForm] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [activeTab, setActiveTab] = useState('consolidate')
  const { user } = useAuth()

  const clientId = user?.client?.id || user?.clientId
  const domainNameParam = user?.domain?.name || fallbackDomainName

  const { data: locationListResponse, isLoading: locationsLoading } = useGetLocationListQuery(
    { domainName: domainNameParam, clientId, pageNumber: 1, pageSize: 1000 },
    { skip: !clientId }
  )

  const locationOptions = locationListResponse?.data?.content ?? []

  const { data: shiftListResponse, isLoading: shiftsLoading } = useGetAllShiftQuery(
    { domainName: domainNameParam, clientId, pageNumber: 1, pageSize: 1000 },
    { skip: !clientId }
  )

  const shiftOptions = shiftListResponse?.data?.content ?? []

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await mockApi.getDashboardData()
      setDashboardData(response.data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatHrsMins = (totalMinutes) => {
    const mins = Number(totalMinutes || 0)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h <= 0) return `${m} mins`
    return `${h} hrs ${m} mins`
  }

  const kpiCards = [
    {
      title: 'Total Tickets',
      value: dashboardData?.kpis?.totalTickets?.toLocaleString?.() ?? '0',
      color: '#1976d2'
    },
    {
      title: 'Open Tickets',
      value: dashboardData?.kpis?.openTickets ?? 0,
      color: '#ed6c02'
    },
    {
      title: 'Completed This Month',
      value: dashboardData?.kpis?.completedThisMonth ?? 0,
      color: '#2e7d32'
    },
    {
      title: 'Inventory Value',
      value: `$${dashboardData?.kpis?.inventoryValue?.toLocaleString?.() ?? '0'}`,
      color: '#9c27b0'
    }
  ]

  const activityColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      width: 150
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (text) => dayjs(text).format('MMM DD, YYYY HH:mm')
    }
  ]

  const tabItems = [
    { key: 'consolidate', label: 'Consolidate' },
    { key: 'locationWise', label: 'Location Wise' }
  ]

  // shiftOptions now comes from API (useGetAllShiftQuery)

  const handleSearch = (values) => {
    console.log('Dashboard filters', {
      fromDate: values?.fromDate?.format?.('YYYY-MM-DD'),
      shiftId: values?.shiftId,
      locationIds: values?.locationIds
    })
  }

  const handleLocationWiseSearch = (values) => {
    console.log('Dashboard location-wise filters', {
      fromDate: values?.fromDate?.format?.('YYYY-MM-DD'),
      toDate: values?.toDate?.format?.('YYYY-MM-DD'),
      shiftId: values?.shiftId,
      locationId: values?.locationId
    })
  }

  const ecs = dashboardData?.ecs || {}

  const availability = ecs.availability ?? 0
  const reliability = ecs.reliability ?? 0
  const avgMtbfMins = ecs.avgMtbfMins ?? ecs.avgMtbfMinutes ?? 0
  const avgMttrMins = ecs.avgMttrMins ?? ecs.avgMttrMinutes ?? 0

  const failureRateBySystem =
    ecs.failureRateBySystem ||
    [
      { system: 'Lifts', failureRate: 12 },
      { system: 'Escalators', failureRate: 9 },
      { system: 'AFC', failureRate: 6 },
      { system: 'HVAC', failureRate: 4 },
      { system: 'Fire Alarm', failureRate: 3 }
    ]

  const top10AssetsByFailure =
    ecs.top10AssetsByFailure ||
    [
      { asset: 'Asset 1', failures: 14 },
      { asset: 'Asset 2', failures: 12 },
      { asset: 'Asset 3', failures: 10 },
      { asset: 'Asset 4', failures: 9 },
      { asset: 'Asset 5', failures: 8 },
    ]

  const ecsMetricBoxes = [
    { label: 'Availability', value: `${availability}%` },
    { label: 'Avg MTBF', value: formatHrsMins(avgMtbfMins) },
    { label: 'Avg MTTR', value: `${avgMttrMins} mins` },
    { label: 'Reliability', value: `${reliability}%` }
  ]

  const tvs = dashboardData?.tvs || {}

  const tvsAvailability = tvs.availability ?? 0
  const tvsReliability = tvs.reliability ?? 0
  const tvsAvgMtbfMins = tvs.avgMtbfMins ?? tvs.avgMtbfMinutes ?? 0
  const tvsAvgMttrMins = tvs.avgMttrMins ?? tvs.avgMttrMinutes ?? 0

  const tvsFailureRateBySystem =
    tvs.failureRateBySystem ||
    [
      { system: 'TVS-1', failureRate: 8 },
      { system: 'TVS-2', failureRate: 6 },
      { system: 'TVS-3', failureRate: 5 },
      { system: 'TVS-4', failureRate: 3 },
      { system: 'TVS-5', failureRate: 2 }
    ]

  const tvsTop10AssetsByFailure =
    tvs.top10AssetsByFailure ||
    [
      { asset: 'TVS Asset 1', failures: 10 },
      { asset: 'TVS Asset 2', failures: 9 },
      { asset: 'TVS Asset 3', failures: 7 },
      { asset: 'TVS Asset 4', failures: 6 },
      { asset: 'TVS Asset 5', failures: 5 },
    ]

  const tvsMetricBoxes = [
    { label: 'Availability', value: `${tvsAvailability}%` },
    { label: 'Avg MTBF', value: formatHrsMins(tvsAvgMtbfMins) },
    { label: 'Avg MTTR', value: `${tvsAvgMttrMins} mins` },
    { label: 'Reliability', value: `${tvsReliability}%` }
  ]

  const [scheduleTaskFrequency, setScheduleTaskFrequency] = useState('DAILY')
  const [scheduleTaskDate, setScheduleTaskDate] = useState(dayjs())
  const [scheduleTaskView, setScheduleTaskView] = useState(() => ({
    totals: { total: 120, open: 36, completed: 62, verified: 22 },
    chartData: [
      { label: 'Open', value: 36 },
      { label: 'Completed', value: 62 },
      { label: 'Verified', value: 22 }
    ]
  }))

  const getMockScheduleTaskView = (frequency) => {
    const map = {
      DAILY: { total: 120, open: 36, completed: 62, verified: 22 },
      WEEKLY: { total: 520, open: 140, completed: 290, verified: 90 },
      MONTHLY: { total: 2100, open: 580, completed: 1100, verified: 420 },
      YEARLY: { total: 24500, open: 6300, completed: 14000, verified: 4200 },
      CUSTOM: { total: 800, open: 210, completed: 430, verified: 160 }
    }
    const totals = map[frequency] || map.DAILY
    return {
      totals,
      chartData: [
        { label: 'Open', value: totals.open },
        { label: 'Completed', value: totals.completed },
        { label: 'Verified', value: totals.verified }
      ]
    }
  }

  const scheduleTaskMetricBoxes = [
    { label: 'Total', value: scheduleTaskView.totals.total, color: '#1677ff' },
    { label: 'Open', value: scheduleTaskView.totals.open, color: '#fa8c16' },
    { label: 'Completed', value: scheduleTaskView.totals.completed, color: '#52c41a' },
    { label: 'Verified', value: scheduleTaskView.totals.verified, color: '#13c2c2' }
  ]

  const [scheduleTaskChartFilter, setScheduleTaskChartFilter] = useState(null)

  const scheduleTaskChartData = scheduleTaskChartFilter
    ? scheduleTaskView.chartData.filter((d) => d.label === scheduleTaskChartFilter)
    : scheduleTaskView.chartData

  const handleScheduleTaskBarClick = (payload) => {
    const label = payload?.label
    if (!label) return
    setScheduleTaskChartFilter((prev) => (prev === label ? null : label))
  }

  const handleScheduleTaskLabelClick = (label) => {
    if (!label) return
    setScheduleTaskChartFilter((prev) => (prev === label ? null : label))
  }

  const ScheduleTaskXAxisTick = (props) => {
    const { x, y, payload } = props
    const label = payload?.value
    const isActive = scheduleTaskChartFilter === label

    return (
      <g transform={`translate(${x},${y})`} style={{ cursor: 'pointer' }}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill={isActive ? '#1677ff' : '#666'}
          fontSize={12}
          fontWeight={isActive ? 700 : 400}
          onClick={() => handleScheduleTaskLabelClick(label)}
        >
          {label}
        </text>
      </g>
    )
  }

  const [correctiveTaskDate, setCorrectiveTaskDate] = useState(dayjs())
  const [correctiveTaskView, setCorrectiveTaskView] = useState(() => ({
    totals: { total: 64, open: 18, completed: 34, verified: 12 },
    chartData: [{ label: 'Corrective', open: 18, completed: 34, verified: 12 },{ label: 'Test', open: 18, completed: 34, verified: 12 },{ label: 'Test 2', open: 18, completed: 34, verified: 12 },{ label: 'Test 3', open: 18, completed: 34, verified: 12 }]
    
  }))

  const correctiveTaskMetricBoxes = [
    { label: 'Total', value: correctiveTaskView.totals.total, color: '#1677ff' },
    { label: 'Open', value: correctiveTaskView.totals.open, color: '#fa8c16' },
    { label: 'Completed', value: correctiveTaskView.totals.completed, color: '#52c41a' },
    { label: 'Verified', value: correctiveTaskView.totals.verified, color: '#13c2c2' }
  ]

  const correctiveTaskChartData = correctiveTaskView.chartData

  const handleCorrectiveTaskSubmit = () => {
    // mock: change values slightly each click
    const base = {
      total: 64,
      open: 18,
      completed: 34,
      verified: 12
    }
    const bump = (n) => Math.max(0, n + Math.floor(Math.random() * 7) - 3)
    const totals = {
      total: bump(base.total),
      open: bump(base.open),
      completed: bump(base.completed),
      verified: bump(base.verified)
    }
    setCorrectiveTaskView({
      totals,
      chartData: [{ label: 'Corrective', open: totals.open, completed: totals.completed, verified: totals.verified }]
    })
  }

  const handleScheduleTaskSubmit = () => {
    setScheduleTaskView(getMockScheduleTaskView(scheduleTaskFrequency))
    setScheduleTaskChartFilter(null)
  }

  const handleScheduleTaskExportPdf = () => {
    // Hook export logic here when ready
    // eslint-disable-next-line no-console
    console.log('Schedule Task export PDF', {
      frequency: scheduleTaskFrequency,
      date: scheduleTaskDate?.format?.('YYYY-MM-DD')
    })
  }

  const engineerRoleBoxes = [
    { label: 'ENGINEER (P/A)', value: '0/0', color: '#1677ff' },
    { label: 'Helpdesk (P/A)', value: '0/0', color: '#722ed1' },
    { label: 'TECHNICIAN (P/A)', value: '0/0', color: '#fa8c16' }
  ]

  const top10MostUsedSpares = [
    { sparePart: 'Brake Pad', timesUsed: 58 },
    { sparePart: 'V-Belt', timesUsed: 52 },
    { sparePart: 'Fuse', timesUsed: 47 },
    { sparePart: 'LED Lamp', timesUsed: 44 },
    { sparePart: 'Contactor', timesUsed: 41 },
    { sparePart: 'Relay', timesUsed: 37 },
    { sparePart: 'Limit Switch', timesUsed: 33 },
    { sparePart: 'Bearing', timesUsed: 29 },
    { sparePart: 'Wire', timesUsed: 25 },
    { sparePart: 'Connector', timesUsed: 21 }
  ]

  const spareConsumptionTrendByStation = [
    { month: 'Jan', stationA: 8, stationB: 6, stationC: 10 },
    { month: 'Feb', stationA: 12, stationB: 9, stationC: 14 },
    { month: 'Mar', stationA: 16, stationB: 12, stationC: 18 },
    { month: 'Apr', stationA: 10, stationB: 8, stationC: 12 },
    { month: 'May', stationA: 18, stationB: 14, stationC: 20 },
    { month: 'Jun', stationA: 22, stationB: 16, stationC: 24 },
    { month: 'Jul', stationA: 24, stationB: 18, stationC: 26 },
    { month: 'Aug', stationA: 20, stationB: 15, stationC: 22 },
    { month: 'Sep', stationA: 14, stationB: 11, stationC: 16 },
    { month: 'Oct', stationA: 16, stationB: 13, stationC: 18 },
    { month: 'Nov', stationA: 12, stationB: 9, stationC: 14 },
    { month: 'Dec', stationA: 8, stationB: 6, stationC: 10 }
  ]

  const lowStockSparesAcrossStations = [
    { sparePart: 'Fuse', stationA: 3, stationB: 2, stationC: 1 },
    { sparePart: 'Relay', stationA: 6, stationB: 4, stationC: 3 },
    { sparePart: 'V-Belt', stationA: 2, stationB: 3, stationC: 2 },
    { sparePart: 'Bearing', stationA: 9, stationB: 7, stationC: 5 },
    { sparePart: 'Connector', stationA: 4, stationB: 5, stationC: 3 },
    { sparePart: 'LED Lamp', stationA: 12, stationB: 10, stationC: 8 }
  ]

  const attendanceEngineerData = [
    { label: 'W1', value: 0.8 },
    { label: 'W2', value: 1.2 },
    { label: 'W3', value: 1.6 },
    { label: 'W4', value: 1.4 }
  ]

  const attendanceTechnicianData = [
    { label: 'W1', value: 0.6 },
    { label: 'W2', value: 1.0 },
    { label: 'W3', value: 1.2 },
    { label: 'W4', value: 1.6 }
  ]

  const attendanceHelpdeskData = [
    { label: 'W1', value: 0.4 },
    { label: 'W2', value: 0.8 },
    { label: 'W3', value: 1.0 },
    { label: 'W4', value: 1.2 }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('dashboard')}</title>
        <meta name="description" content={`${APP_CONFIG.name} Dashboard - ${APP_CONFIG.description}`} />
      </Helmet>
      <Box>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : !dashboardData ? (
          <Typography>No data available</Typography>
        ) : (
          <>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Dashboard
        </Typography>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />

        {activeTab === 'consolidate' && (
          <Card style={{ marginBottom: 16 }}>
            <CardContent>
              <Form
                form={filterForm}
                layout="inline"
                onFinish={handleSearch}
                initialValues={{
                  fromDate: dayjs(),
                  shiftId: undefined,
                  locationIds: []
                }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end' }}
              >
                <Form.Item
                  name="fromDate"
                  label="From Date"
                  rules={[{ required: true, message: 'Please select From Date' }]}
                >
                  <DatePicker style={{ width: 180 }} />
                </Form.Item>

                <Form.Item name="shiftId" label="Shift">
                  <Select
                    placeholder="Select Shift"
                    allowClear
                    style={{ width: 200 }}
                    loading={shiftsLoading}
                    options={shiftOptions.map((s) => ({ label: s.name, value: s.id }))}
                  />
                </Form.Item>

                <Form.Item name="locationIds" label="Location">
                  <Select
                    mode="multiple"
                    placeholder="Select Location"
                    allowClear
                    optionFilterProp="label"
                    maxTagCount="responsive"
                    maxTagTextLength={18}
                    loading={locationsLoading}
                    style={{ width: 360 }}
                    options={locationOptions.map((l) => ({
                      label: (l.name || '').trim(),
                      value: l.id
                    }))}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit">
                    Search
                  </Button>
                </Form.Item>
              </Form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'locationWise' && (
          <Card style={{ marginBottom: 16 }}>
            <CardContent>
              <Form
                form={locationWiseForm}
                layout="inline"
                onFinish={handleLocationWiseSearch}
                initialValues={{
                  fromDate: dayjs(),
                  toDate: dayjs(),
                  shiftId: undefined,
                  locationId: undefined
                }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end' }}
              >
                <Form.Item
                  name="fromDate"
                  label="From Date"
                  rules={[{ required: true, message: 'Please select From Date' }]}
                >
                  <DatePicker style={{ width: 180 }} />
                </Form.Item>

                <Form.Item
                  name="toDate"
                  label="To Date"
                  rules={[{ required: true, message: 'Please select To Date' }]}
                >
                  <DatePicker style={{ width: 180 }} />
                </Form.Item>

                <Form.Item name="shiftId" label="Shift">
                  <Select
                    placeholder="Select Shift"
                    allowClear
                    style={{ width: 200 }}
                    loading={shiftsLoading}
                    options={shiftOptions.map((s) => ({ label: s.name, value: s.id }))}
                  />
                </Form.Item>

                <Form.Item name="locationId" label="Location">
                  <Select
                    placeholder="Select Location"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    loading={locationsLoading}
                    style={{ width: 260 }}
                    options={locationOptions.map((l) => ({
                      label: (l.name || '').trim(),
                      value: l.id
                    }))}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit">
                    Search
                  </Button>
                </Form.Item>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* ECS Section */}
        <Card style={{ marginBottom: 16 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              ECS
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {ecsMetricBoxes.map((m) => (
                <Grid item xs={12} sm={6} md={3} key={m.label}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #e5e7eb',
                      boxShadow: 'none',
                      background: '#fafafa'
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
                      >
                        {m.label}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
                        {m.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, border: '1px solid #eef2f7', boxShadow: 'none' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      FAILURE Rate by System
                    </Typography>
                    <RechartsResponsiveBox height={280}>
                        <BarChart data={failureRateBySystem} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="system" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="failureRate" fill="#1677ff" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </RechartsResponsiveBox>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, border: '1px solid #eef2f7', boxShadow: 'none' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Top 10 Asset by Failure
                    </Typography>
                    <RechartsResponsiveBox height={280}>
                        <BarChart
                          layout="vertical"
                          data={top10AssetsByFailure}
                          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis type="category" dataKey="asset" width={120} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="failures" fill="#52c41a" radius={[0, 8, 8, 0]} barSize={14} />
                        </BarChart>
                      </RechartsResponsiveBox>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* TVS Section */}
        <Card style={{ marginBottom: 16 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              TVS
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              {tvsMetricBoxes.map((m) => (
                <Grid item xs={12} sm={6} md={3} key={m.label}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #e5e7eb',
                      boxShadow: 'none',
                      background: '#fafafa'
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
                      >
                        {m.label}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
                        {m.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, border: '1px solid #eef2f7', boxShadow: 'none' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      FAILURE Rate by System
                    </Typography>
                    <RechartsResponsiveBox height={280}>
                        <BarChart data={tvsFailureRateBySystem} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="system" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="failureRate" fill="#722ed1" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </RechartsResponsiveBox>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, border: '1px solid #eef2f7', boxShadow: 'none' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Top 10 Asset by Failure
                    </Typography>
                    <RechartsResponsiveBox height={280}>
                        <BarChart
                          layout="vertical"
                          data={tvsTop10AssetsByFailure}
                          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis type="category" dataKey="asset" width={120} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="failures" fill="#fa8c16" radius={[0, 8, 8, 0]} barSize={14} />
                        </BarChart>
                      </RechartsResponsiveBox>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        {/* ENGINEER Section */}
        <Card style={{ marginBottom: 16 }}>
          <CardContent>
            <Grid container spacing={2}>
              {engineerRoleBoxes.map((m) => (
                <Grid item xs={12} md={4} key={m.label}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      border: `1px solid ${m.color}40`,
                      boxShadow: 'none',
                      background: `linear-gradient(135deg, ${m.color}14 0%, rgba(255,255,255,0.85) 55%, ${m.color}10 100%)`,
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.4 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: `${m.color}22`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <UserOutlined style={{ fontSize: 18, color: m.color }} />
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                          {m.label}
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5, lineHeight: 1.1, color: m.color }}>
                          {m.value}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Schedule Task Section */}
        <Card style={{ marginBottom: 16 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ m: 0 }}>
                Schedule Task
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Form layout="inline" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end' }}>
                  <Form.Item label="Frequency" style={{ marginBottom: 0 }}>
                    <Select
                      value={scheduleTaskFrequency}
                      onChange={setScheduleTaskFrequency}
                      style={{ width: 170 }}
                      options={[
                        { label: 'DAILY', value: 'DAILY' },
                        { label: 'WEEKLY', value: 'WEEKLY' },
                        { label: 'MONTHLY', value: 'MONTHLY' },
                        { label: 'YEARLY', value: 'YEARLY' },
                        { label: 'CUSTOM', value: 'CUSTOM' }
                      ]}
                    />
                  </Form.Item>

                  <Form.Item label="Date" style={{ marginBottom: 0 }}>
                    <DatePicker
                      value={scheduleTaskDate}
                      onChange={(val) => setScheduleTaskDate(val)}
                      style={{ width: 170 }}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" onClick={handleScheduleTaskSubmit}>
                      Submit
                    </Button>
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button onClick={handleScheduleTaskExportPdf}>
                      Export PDF
                    </Button>
                  </Form.Item>
              </Form>
            </Box>

            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              {scheduleTaskMetricBoxes.map((m) => (
                <Grid item xs={12} sm={6} md={3} key={m.label}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${m.color}26`,
                      background: `${m.color}0f`,
                      boxShadow: 'none'
                    }}
                  >
                    <CardContent sx={{ py: 1.2, px: 1.6 }}>
                      <Typography variant="caption" color="text.secondary">
                        {m.label}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: m.color, lineHeight: 1.2 }}>
                        {m.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Card sx={{ borderRadius: 2, border: '1px solid #eef2f7', boxShadow: 'none' }}>
              <CardContent>
                <RechartsResponsiveBox height={320}>
                    <BarChart data={scheduleTaskChartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={ScheduleTaskXAxisTick} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        fill="#1677ff"
                        radius={[6, 6, 0, 0]}
                        style={{ cursor: 'pointer' }}
                        onClick={(data) => handleScheduleTaskBarClick(data?.payload)}
                      />
                    </BarChart>
                  </RechartsResponsiveBox>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Corrective Task - Upto Date */}
        <Card style={{ marginBottom: 16 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                mb: 2,
                flexWrap: 'wrap'
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ m: 0 }}>
                Corrective Task - Upto Date
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Form layout="inline" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end' }}>
                <Form.Item label="Upto Date" style={{ marginBottom: 0 }}>
                  <DatePicker
                    value={correctiveTaskDate}
                    onChange={(val) => setCorrectiveTaskDate(val)}
                    style={{ width: 170 }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" onClick={handleCorrectiveTaskSubmit}>
                    Submit
                  </Button>
                </Form.Item>
              </Form>
            </Box>

            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              {correctiveTaskMetricBoxes.map((m) => (
                <Grid item xs={12} sm={6} md={3} key={m.label}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${m.color}26`,
                      background: `${m.color}0f`,
                      boxShadow: 'none'
                    }}
                  >
                    <CardContent sx={{ py: 1.2, px: 1.6 }}>
                      <Typography variant="caption" color="text.secondary">
                        {m.label}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: m.color, lineHeight: 1.2 }}>
                        {m.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Card sx={{ borderRadius: 2, border: '1px solid #eef2f7', boxShadow: 'none' }}>
              <CardContent>
                <RechartsResponsiveBox height={320}>
                    <BarChart data={correctiveTaskChartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="open" stackId="a" fill="#fa8c16" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="completed" stackId="a" fill="#52c41a" />
                      <Bar dataKey="verified" stackId="a" fill="#13c2c2" />
                    </BarChart>
                  </RechartsResponsiveBox>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Spares Usage & Trend */}
        <Card style={{ marginBottom: 16 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, border: '1px solid #eef2f7', boxShadow: 'none' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Top 10 Most Used Spares
                    </Typography>
                    <RechartsResponsiveBox height={340}>
                        <BarChart
                          layout="vertical"
                          data={top10MostUsedSpares}
                          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            type="number"
                            domain={[0, 60]}
                            ticks={[0, 20, 40, 60]}
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Number of time used', position: 'insideBottom', offset: -6 }}
                          />
                          <YAxis
                            type="category"
                            dataKey="sparePart"
                            width={140}
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Spare part', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip />
                          <Bar dataKey="timesUsed" fill="#1677ff" radius={[0, 8, 8, 0]} barSize={14} />
                        </BarChart>
                      </RechartsResponsiveBox>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, border: '1px solid #eef2f7', boxShadow: 'none' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Spare Consumption Trend by Station
                    </Typography>
                    <RechartsResponsiveBox height={340}>
                        <LineChart data={spareConsumptionTrendByStation} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Month', position: 'insideBottom', offset: -6 }}
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            ticks={[0, 8, 16, 24, 32]}
                            label={{ value: 'Units consumed', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip />
                          <Line type="monotone" dataKey="stationA" name="Station A" stroke="#722ed1" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                          <Line type="monotone" dataKey="stationB" name="Station B" stroke="#1677ff" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                          <Line type="monotone" dataKey="stationC" name="Station C" stroke="#52c41a" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                        </LineChart>
                      </RechartsResponsiveBox>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Low in Stock Spares Across Stations */}
        <Card style={{ marginBottom: 16 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Low in Stock Spares Across Stations
            </Typography>
            <RechartsResponsiveBox height={340}>
                <BarChart data={lowStockSparesAcrossStations} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="sparePart"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Spare part', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    ticks={[0, 3, 6, 9, 12]}
                    label={{ value: 'Quantity(units)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="stationA"
                    name="Station A"
                    fill="#1677ff"
                    radius={[10, 10, 0, 0]}
                    barSize={12}
                    activeBar={{ fill: '#69b1ff', stroke: '#1677ff' }}
                  />
                  <Bar
                    dataKey="stationB"
                    name="Station B"
                    fill="#722ed1"
                    radius={[10, 10, 0, 0]}
                    barSize={12}
                    activeBar={{ fill: '#b37feb', stroke: '#722ed1' }}
                  />
                  <Bar
                    dataKey="stationC"
                    name="Station C"
                    fill="#52c41a"
                    radius={[10, 10, 0, 0]}
                    barSize={12}
                    activeBar={{ fill: '#95de64', stroke: '#52c41a' }}
                  />
                </BarChart>
              </RechartsResponsiveBox>
          </CardContent>
        </Card>

        {/* Attendance charts */}
        <Card style={{ marginBottom: 16 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, border: '1px solid #eef2f7', boxShadow: 'none' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Attendance / ENGINEER
                    </Typography>
                    <RechartsResponsiveBox height={260}>
                        <BarChart data={attendanceEngineerData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            domain={[0, 2]}
                            ticks={[0.0, 0.4, 0.8, 1.2, 1.6, 2.0]}
                          />
                          <Tooltip />
                          <Bar dataKey="value" fill="#1677ff" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </RechartsResponsiveBox>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, border: '1px solid #eef2f7', boxShadow: 'none' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Attendance / TECHNICIAN
                    </Typography>
                    <RechartsResponsiveBox height={260}>
                        <BarChart data={attendanceTechnicianData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            domain={[0, 2]}
                            ticks={[0.0, 0.4, 0.8, 1.2, 1.6, 2.0]}
                          />
                          <Tooltip />
                          <Bar dataKey="value" fill="#52c41a" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </RechartsResponsiveBox>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, border: '1px solid #eef2f7', boxShadow: 'none' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Attendance / Helpdesk
                    </Typography>
                    <RechartsResponsiveBox height={260}>
                        <BarChart data={attendanceHelpdeskData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            domain={[0, 2]}
                            ticks={[0.0, 0.4, 0.8, 1.2, 1.6, 2.0]}
                          />
                          <Tooltip />
                          <Bar dataKey="value" fill="#722ed1" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </RechartsResponsiveBox>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
          </>
        )}
      </Box>
    </>
  )
}

