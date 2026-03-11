import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, Skeleton, Tooltip, useTheme, alpha } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Empty, Spin, Row, Col, Input } from 'antd'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetCmReportSummaryQuery } from '../../../store/api/taskReport.api'
import { useAuth } from '../../../context/AuthContext'
import { FaClipboardList, FaExternalLinkAlt, FaCheckSquare, FaCheckCircle, FaTasks, FaClock } from 'react-icons/fa'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import CountUp from "react-countup"
import { SearchOutlined } from '@ant-design/icons'

const { RangePicker } = DatePicker

export default function ScheduledMaintenanceReports() {
  const [form] = Form.useForm()
  const { user } = useAuth()

  const { locations = [], loading: locationsLoading } = useGetLocationList()
  const [loading, setLoading] = useState(false)
  const [shouldFetch, setShouldFetch] = useState(false)

  const [filters, setFilters] = useState({
    fromDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
    locationId: undefined,
  })

  const clientId = user?.client?.id || user?.clientId

  const { data: reportData,  isLoading: isInitialLoading, isFetching  } =
    useGetCmReportSummaryQuery(
      { ...filters, clientId },
      { skip: !filters.fromDate || !filters.toDate }
    )
    const queryLoading = isInitialLoading || isFetching

  /* ---------------- APPLY FILTERS ---------------- */
  const handleApplyFilters = (values) => {
    let selectedLocationId
    setShouldFetch(true)
    // If All Locations (-1) OR cleared selection
    if (values.location === -1 || !values.location) {
      selectedLocationId = locations.length
        ? locations.map((loc) => loc.id).join(',')
        : undefined
    } else {
      selectedLocationId = values.location
    }

    setFilters({
      fromDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      toDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
      locationId: selectedLocationId,
    })
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({
      fromDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
      toDate: dayjs().format('YYYY-MM-DD'),
      locationId: undefined,
    })
  }

  /* ---------------- DATA TRANSFORMATION FOR CHART ---------------- */
  const statusMap = {
    openCount: 'Open',
    workDoneCount: 'Work Done',
    completedCount: 'Completed',
    verifiedCount: 'Verified',
    overdueCount: 'Overdue',
  }

  const transformData = (data = [], locations = [], filterLocationId) => {
    // Determine locations to display
    let allLocations = []
    if (filterLocationId) {
      const ids = filterLocationId.toString().split(',').map(Number)
      allLocations = locations.filter(loc => ids.includes(loc.id)).map(loc => loc.name)
    }
    if (!allLocations.length) {
      allLocations = locations.length ? locations.map(loc => loc.name) : data.map(item => item.locationName)
    }

    const transformed = []

    allLocations.forEach((loc) => {
      const locationData = data.find(item => item.locationName === loc)

      Object.entries(statusMap).forEach(([key, type]) => {
        transformed.push({
          location: loc,
          type,
          value: locationData ? locationData[key] || 0 : 0,
        })
      })
    })

    return transformed
  }

  const chartData = transformData(reportData?.data || [], locations || [], filters.locationId)

  /* ---------------- SUMMARY CALCULATIONS ---------------- */
  const reports = (reportData?.data || []).map((item, index) => ({
    sno: index + 1,
    location: item.locationName || 'ALL',
    open: item.openCount || 0,
    completed: item.completedCount || 0,
    verified: item.verifiedCount || 0,
    workDone: item.workDoneCount || 0,
    overdueCount: item.overdueCount || 0,
  }))

  const totalOpen = reports.reduce((sum, item) => sum + item.open, 0)
  const totalCompleted = reports.reduce((sum, item) => sum + item.completed, 0)
  const totalWorkDone = reports.reduce((sum, item) => sum + item.workDone, 0)
  const totalVerified = reports.reduce((sum, item) => sum + item.verified, 0)
  const totalOverdue = reports.reduce((sum, item) => sum + item.overdueCount, 0)
  const totalTasks = totalOpen + totalCompleted + totalVerified + totalWorkDone + totalOverdue

  /* ---------------- SAMPLE & BAR CHART DATA ---------------- */
  // Sample dataset (20+ records) used when API has no data
  const sampleBarData = [
    { location: 'Loc 01', open: 5, workDone: 3, completed: 2, verified: 1, overdueCount: 0 },
    { location: 'Loc 02', open: 2, workDone: 4, completed: 6, verified: 3, overdueCount: 1 },
    { location: 'Loc 03', open: 8, workDone: 2, completed: 1, verified: 0, overdueCount: 4 },
    { location: 'Loc 04', open: 1, workDone: 5, completed: 3, verified: 2, overdueCount: 0 },
    { location: 'Loc 05', open: 4, workDone: 1, completed: 5, verified: 4, overdueCount: 2 },
    { location: 'Loc 06', open: 3, workDone: 3, completed: 3, verified: 3, overdueCount: 3 },
    { location: 'Loc 07', open: 7, workDone: 1, completed: 2, verified: 1, overdueCount: 5 },
    { location: 'Loc 08', open: 6, workDone: 4, completed: 1, verified: 1, overdueCount: 0 },
    { location: 'Loc 09', open: 2, workDone: 2, completed: 2, verified: 2, overdueCount: 2 },
    { location: 'Loc 10', open: 9, workDone: 0, completed: 0, verified: 0, overdueCount: 1 },
    { location: 'Loc 11', open: 1, workDone: 2, completed: 3, verified: 4, overdueCount: 0 },
    { location: 'Loc 12', open: 3, workDone: 5, completed: 2, verified: 1, overdueCount: 1 },
    { location: 'Loc 13', open: 4, workDone: 4, completed: 4, verified: 0, overdueCount: 0 },
    { location: 'Loc 14', open: 5, workDone: 2, completed: 3, verified: 1, overdueCount: 1 },
    { location: 'Loc 15', open: 2, workDone: 1, completed: 4, verified: 3, overdueCount: 0 },
    { location: 'Loc 16', open: 6, workDone: 3, completed: 2, verified: 2, overdueCount: 1 },
    { location: 'Loc 17', open: 3, workDone: 2, completed: 5, verified: 1, overdueCount: 2 },
    { location: 'Loc 18', open: 7, workDone: 1, completed: 1, verified: 3, overdueCount: 0 },
    { location: 'Loc 19', open: 2, workDone: 3, completed: 3, verified: 2, overdueCount: 1 },
    { location: 'Loc 20', open: 4, workDone: 2, completed: 2, verified: 4, overdueCount: 0 },
    { location: 'Loc 21', open: 5, workDone: 1, completed: 3, verified: 2, overdueCount: 2 },
    { location: 'Loc 22', open: 1, workDone: 4, completed: 4, verified: 1, overdueCount: 0 },
  ]

  // Use live API data when available, otherwise fall back to sample data
  const baseBarChartData = (reports.length ? reports : sampleBarData).map((item) => {
    const open = item.open
    const workDone = item.workDone
    const completed = item.completed
    const verified = item.verified
    const overdueCount = item.overdueCount
    const total = open + workDone + completed + verified + overdueCount

    return {
      location: item.location,
      open,
      workDone,
      completed,
      verified,
      overdueCount,
      total,
    }
  })

  // Legend-based status visibility (Open / Completed / Verified / Work Done / Overdue)
  const [activeSeries, setActiveSeries] = useState(['open', 'workDone', 'completed', 'verified', 'overdueCount'])

  const toggleSeries = (key) => {
    setActiveSeries((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const barChartData = baseBarChartData.map((item) => ({
    ...item,
    open: activeSeries.includes('open') ? item.open : 0,
    workDone: activeSeries.includes('workDone') ? item.workDone : 0,
    completed: activeSeries.includes('completed') ? item.completed : 0,
    verified: activeSeries.includes('verified') ? item.verified : 0,
    overdueCount: activeSeries.includes('overdueCount') ? item.overdueCount : 0,
  }))

  // Custom label renderers for chart
  const renderInnerBarLabel = (props) => {
    const { value, x, y, width, height, fill } = props
    if (!value) return null

    const label = String(value)
    const paddingX = 6
    const paddingY = 2
    const textWidth = label.length * 6
    const rectWidth = textWidth + paddingX * 2
    const rectHeight = 16

    const rectX = x + width / 2 - rectWidth / 2
    const rectY = y + height / 2 - rectHeight / 2

    return (
      <g>
        <rect
          x={rectX}
          y={rectY}
          width={rectWidth}
          height={rectHeight}
          rx={8}
          ry={8}
          fill={fill || '#222'}
          stroke="rgba(0,0,0,0.45)"
          strokeWidth={0.5}
          opacity={0.9}
        />
        <text
          x={rectX + rectWidth / 2}
          y={rectY + rectHeight / 2 + 4}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={11}
          fontWeight={600}
        >
          {label}
        </text>
      </g>
    )
  }

  const renderTotalLabel = (props) => {
    const { value, x, y, width } = props
    if (value === undefined || value === null) return null

    const label = String(value)
    const paddingX = 6
    const paddingY = 2
    const textWidth = label.length * 6
    const rectWidth = textWidth + paddingX * 2
    const rectHeight = 18

    const rectX = x + width / 2 - rectWidth / 2
    const rectY = y - rectHeight - 4

    return (
      <g>
        <rect
          x={rectX}
          y={rectY}
          width={rectWidth}
          height={rectHeight}
          rx={8}
          ry={8}
          fill="#111827"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={0.5}
          opacity={0.95}
        />
        <text
          x={rectX + rectWidth / 2}
          y={rectY + rectHeight / 2 + 4}
          textAnchor="middle"
          fill="#f9fafb"
          fontSize={11}
          fontWeight={700}
        >
          {label}
        </text>
      </g>
    )
  }

  // Dynamic chart width for horizontal scroll (show only a few locations at once)
  const barWidthPerLocation = 160
  const minChartWidth = 900
  const computedChartWidth = Math.max(minChartWidth, barChartData.length * barWidthPerLocation)

  /* ---------------- TABLE ---------------- */
  const pillContainerStyle = { display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }
  const pillStyle = {
    display: 'flex',
    borderRadius: 50,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid #d9d9d9',
    transition: 'all 0.2s ease',
    cursor: 'default',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
  }
  const countStyle = { padding: '3px 8px', backgroundColor: '#f5f5f5', color: '#333' }
  const getStatusColor = (type, value) => {
    if (value === 0) return '#bfbfbf'
    const colors = {
      total: '#597ef7',
      open: '#69b1ff',
      verified: '#73d13d',
      workDone: '#5cdbd3',
      overdue: '#ffa940',
      completed: '#595959'
    }
    return colors[type]
  }

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8 }}
        />
        <Space>
          <AntButton type="primary" size="small" onClick={() => confirm()} icon={<SearchOutlined />}>
            Search
          </AntButton>
          <AntButton size="small" onClick={() => {
            clearFilters()
            confirm()
          }
          }>
            Reset
          </AntButton>
        </Space>
      </div>
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ?.toString()
        .toLowerCase()
        .includes(value.toLowerCase()),
  })


  const columns = [
    { title: 'S.No', dataIndex: 'sno', key: 'sno', align: 'center' },
    { title: 'Location', dataIndex: 'location', key: 'location', align: 'center', sorter: (a, b) => a.location.localeCompare(b.location), ...getColumnSearchProps('sno') },
    {
      title: 'Status',
      key: 'status',
      align: 'center',
      render: (_, record) => {
        const renderPill = (label, value, type) => {
          const color = getStatusColor(type, value)
          return (
            <div style={pillStyle} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <span style={{ backgroundColor: color, color: 'white', padding: '3px 8px' }}>{label}</span>
              <span style={countStyle}>{value}</span>
            </div>
          )
        }
        return (
          <div style={pillContainerStyle}>
            {renderPill('Total', record.open + record.completed + record.workDone + record.verified + record.overdueCount, 'total')}
            {renderPill('Open', record.open, 'open')}
            {renderPill('Work Done', record.workDone, 'workDone')}
            {renderPill('Completed', record.completed, 'completed')}
            {renderPill('Verified', record.verified, 'verified')}
            {renderPill('Overdue', record.overdueCount, 'overdue')}
          </div>
        )
      }
    },
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/tasks/corrective')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Corrective Maintenance Reports`} />
      </Helmet>

      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Corrective Maintenance Reports
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
                    <Select style={{ width: '100%' }} allowClear loading={locationsLoading}>
                      <Select.Option value={-1}>All Locations</Select.Option>
                      {locations.map((loc) => (
                        <Select.Option key={loc.id} value={loc.id}>
                          {loc.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6} style={{ display: 'flex', alignItems: 'center' }}>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Space wrap>
                      <AntButton type="primary" htmlType="submit" loading={queryLoading}>
                        Apply Filters
                      </AntButton>
                      <AntButton onClick={handleResetFilters}>
                        Reset
                      </AntButton>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </CardContent>
        </Card>

        {/* SUMMARY BOXES */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <SummaryBox label="TOTAL" value={totalTasks} color="#2E8B57" icon={<FaClipboardList size={32} />} />
          <SummaryBox label="OPEN" value={totalOpen} color="#8A9EFF" icon={<FaExternalLinkAlt size={32} />} />
          <SummaryBox label="WORK DONE" value={totalWorkDone} color="#5cdbd3" icon={<FaTasks size={32} />} />
          <SummaryBox label="COMPLETED" value={totalCompleted} color="#555555" icon={<FaCheckSquare size={32} />} />
          <SummaryBox label="VERIFIED" value={totalVerified} color="#66CC33" icon={<FaCheckCircle size={32} />} />
          <SummaryBox label="OVERDUE" value={totalOverdue} color="#ffa940" icon={<FaClock size={32} />} />
        </Box>

        {/* TABLE + CHART */}
        <Card>
          <CardContent>
            {!shouldFetch ? (
              <Empty description="Please apply filters to view the report" />
            ) :
              queryLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <Spin />
                </Box>
              ) : (
                <>
                  {/* Series filter pills (always visible) */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      mb: 2,
                      alignItems: 'center',
                    }}
                  >
                    {[
                      { key: 'open', label: 'Open', color: '#69b1ff' },
                      { key: 'workDone', label: 'Work Done', color: '#5cdbd3' },
                      { key: 'completed', label: 'Completed', color: '#555555' },
                      { key: 'verified', label: 'Verified', color: '#73d13d' },
                      { key: 'overdueCount', label: 'Overdue', color: '#ffa940' },
                    ].map((item) => {
                      const isActive = activeSeries.includes(item.key)
                      return (
                        <Box
                          key={item.key}
                          onClick={() => toggleSeries(item.key)}
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 999,
                            border: `1px solid ${item.color}`,
                            backgroundColor: isActive ? item.color : 'transparent',
                            color: isActive ? '#fff' : item.color,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              boxShadow: '0 0 0 2px rgba(0,0,0,0.04)',
                            },
                          }}
                        >
                          {item.label}
                        </Box>
                      )
                    })}
                  </Box>

                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Box sx={{ width: '100%', overflowX: 'auto' }}>
                        <Box sx={{ width: computedChartWidth, height: 400 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={barChartData}
                              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis
                                dataKey="location"
                                tick={{ fontSize: 11 }}
                                interval={0}
                                height={70}
                                // angle={-45}
                                textAnchor="end"
                              />
                              <YAxis tick={{ fontSize: 12 }} />
                              <RechartsTooltip />
                              {/* <Legend
                              wrapperStyle={{ paddingBottom: 8 }}
                            /> */}

                              <Bar dataKey="open" stackId="a" fill="#69b1ff" name="Open">
                                <LabelList
                                  dataKey="open"
                                  position="inside"
                                  style={{ fill: '#fff', fontSize: 11, fontWeight: 600 }}
                                  formatter={(v) => (v > 0 ? v : '')}
                                />
                              </Bar>

                              <Bar dataKey="workDone" stackId="a" fill="#5cdbd3" name="Work Done">
                                <LabelList
                                  dataKey="workDone"
                                  position="inside"
                                  style={{ fill: '#fff', fontSize: 11, fontWeight: 600 }}
                                  formatter={(v) => (v > 0 ? v : '')}
                                />
                              </Bar>
                              <Bar dataKey="completed" stackId="a" fill="#555555" name="Completed">
                                <LabelList
                                  dataKey="completed"
                                  position="inside"
                                  style={{ fill: '#fff', fontSize: 11, fontWeight: 600 }}
                                  formatter={(v) => (v > 0 ? v : '')}
                                />
                              </Bar>
                              <Bar dataKey="verified" stackId="a" fill="#73d13d" name="Verified">
                                <LabelList
                                  dataKey="verified"
                                  position="inside"
                                  style={{ fill: '#fff', fontSize: 11, fontWeight: 600 }}
                                  formatter={(v) => (v > 0 ? v : '')}
                                />
                              </Bar>
                              <Bar dataKey="overdueCount" stackId="a" fill="#ffa940" name="Overdue">
                                <LabelList
                                  dataKey="overdueCount"
                                  position="inside"
                                  style={{ fill: '#fff', fontSize: 11, fontWeight: 600 }}
                                  formatter={(v) => (v > 0 ? v : '')}
                                />
                                {/* total count on top of each stacked bar */}
                                <LabelList
                                  dataKey="total"
                                  position="top"
                                  style={{ fill: '#000', fontSize: 12, fontWeight: 700 }}
                                />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                  <Table
                    dataSource={reports}
                    columns={columns}
                    rowKey="sno"
                    pagination={{ pageSize: 20 }}
                    bordered
                  />
                </>
              )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

/* ---------------- SUMMARY BOX COMPONENT ---------------- */
function SummaryBox({ label, value, color, icon, trend, trendValue = 0, isLoading = false, tooltip, onClick }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === "dark"
  const isPositive = trendValue >= 0

  return (
    <Tooltip title={tooltip || ""} arrow disableHoverListener={!tooltip}>
      <Box
        onClick={onClick}
        sx={{
          flex: { xs: "100%", sm: 1 },
          minWidth: { xs: "100%", sm: 180 },
          position: "relative",
          borderRadius: 4,
          p: 3,
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.35s cubic-bezier(.21,1.02,.73,1)",
          background: isDark
            ? `linear-gradient(135deg, ${alpha(color, 0.25)}, ${alpha(color, 0.15)})`
            : `linear-gradient(135deg, ${color}, ${alpha(color, 0.9)})`,
          color: "#fff",
          backdropFilter: "blur(10px)",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            padding: "1px",
            borderRadius: "inherit",
            background: `linear-gradient(135deg, ${color}, transparent)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          },
          boxShadow: isDark ? "0 10px 25px rgba(0,0,0,0.5)" : "0 8px 20px rgba(0,0,0,0.08)",
          "&:hover": {
            transform: "translateY(-6px) scale(1.02)",
            boxShadow: isDark ? `0 20px 40px ${alpha(color, 0.4)}` : `0 20px 40px ${alpha(color, 0.25)}`,
          },
          "&:active": { transform: "scale(0.97)" },
        }}
      >
        {isLoading ? (
          <>
            <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: "rgba(255,255,255,0.3)" }} />
            <Skeleton variant="text" width="60%" height={40} sx={{ mt: 1, bgcolor: "rgba(255,255,255,0.3)" }} />
            <Skeleton variant="circular" width={55} height={55} sx={{ position: "absolute", right: 20, top: 30 }} />
          </>
        ) : (
          <>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.85, letterSpacing: 1.2, fontWeight: 500 }}>{label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                <CountUp start={0} end={Number(value)} duration={1.5} separator="," />
              </Typography>
              {trend && <Typography variant="caption" sx={{ mt: 1, display: "block", color: isPositive ? "#C8FACC" : "#FFD6D6" }}>{trend}</Typography>}
            </Box>
            <Box sx={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", right: 20, top: 25 }}>
              {icon}
            </Box>
          </>
        )}
      </Box>
    </Tooltip>
  )
}