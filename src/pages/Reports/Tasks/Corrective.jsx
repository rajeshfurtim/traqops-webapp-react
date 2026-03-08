import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, Skeleton, Tooltip, useTheme, alpha } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Spin, Row, Col } from 'antd'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetCmReportSummaryQuery } from '../../../store/api/taskReport.api'
import { useAuth } from '../../../context/AuthContext'
import { FaClipboardList, FaExternalLinkAlt, FaCheckSquare, FaCheckCircle, FaTasks, FaClock } from 'react-icons/fa'
import { Column } from '@ant-design/plots'
import CountUp from "react-countup"

const { RangePicker } = DatePicker

export default function ScheduledMaintenanceReports() {
  const [form] = Form.useForm()
  const { user } = useAuth()

  const { locations = [], loading: locationsLoading } = useGetLocationList()

  const [filters, setFilters] = useState({
    fromDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
    locationId: undefined,
  })

  const clientId = user?.client?.id || user?.clientId

  const { data: reportData, isLoading } =
    useGetCmReportSummaryQuery(
      { ...filters, clientId },
      { skip: !filters.fromDate || !filters.toDate }
    )

  /* ---------------- APPLY FILTERS ---------------- */
  const handleApplyFilters = (values) => {
    let selectedLocationId

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

  /* ---------------- CHART CONFIG ---------------- */
  const totalbyLocations = {}
  chartData.forEach((item) => {
    if (!totalbyLocations[item.location]) {
      totalbyLocations[item.location] = 0
    }
    totalbyLocations[item.location] += item.value
  })

  const chartConfig = {
    data: chartData,
    xField: 'location',
    yField: 'value',
    seriesField: 'type',
    colorField: 'type',
    isStack: true,
    height: 500,
    animation: {
      appear: {
        animation: 'wave-in',
        duration: 800,
      },
    },
    scale: {
      color: {
        domain: ['Open', 'Work Done', 'Completed', 'Verified', 'Overdue'],
        range: ['#ff4d6d', '#5cdbd3', '#595959', '#73d13d', '#ffa940'],
      },
    },
    label: {
      position: 'middle',
      formatter: (datum) => (datum.value > 0 ? datum.value : ''),
      style: { fill: '#fff', fontSize: 12, fontWeight: 600 },
    },
    legend: { position: 'top' },
    columnStyle: { radius: [8, 8, 0, 0] },
    annotations: Object.keys(totalbyLocations).map((loc) => ({
      type: 'text',
      position: [loc, totalbyLocations[loc]],
      content: String(totalbyLocations[loc]),
      style: { textAlign: 'center', fontSize: 14, fontWeight: 700, fill: '#000' },
      offsetY: -12,
    })),
  }

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

  const columns = [
    { title: 'S.No', dataIndex: 'sno', key: 'sno', align: 'center' },
    { title: 'Location', dataIndex: 'location', key: 'location', align: 'center' },
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
                      <AntButton type="primary" htmlType="submit">
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
            {isLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Column {...chartConfig} />
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