import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress, Grid } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Row, Col, Input } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import useGetFreqencyList from '../../../hooks/useGetFrequencyList'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetFrequencyCountQuery } from '../../../store/api/taskReport.api'
import { useAuth } from '../../../context/AuthContext'
import { FaClipboardList, FaExternalLinkAlt, FaCheckSquare, FaCheckCircle } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { SearchOutlined } from '@ant-design/icons'
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
  const navigate = useNavigate()

  const { freqencyList, isLoading: frequencyLoading } = useGetFreqencyList()
  const { locations, loading: locationsLoading } = useGetLocationList()

  const [filters, setFilters] = useState({
    fromDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
    locationId: '-1',
    frequencyId: '',
  })

  const clientId = user?.client?.id || user?.clientId

  const { data: reportData, isLoading } =
    useGetFrequencyCountQuery({ ...filters, clientId }, {
      skip: !filters.fromDate || !filters.toDate,
    })

  /* ---------------- TABLE DATA ---------------- */
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

  /* ---------------- CHART DATA ---------------- */
  const rechartsStackData = (reportData?.data || [])
    .filter(
      (item) =>
        item.openCount > 0 ||
        item.completedCount > 0 ||
        item.verifiedCount > 0
    )
    .map((item) => ({
      frequency: item.frequencyName,
      frequencyId: item.frequencyId,
      open: item.openCount || 0,
      completed: item.completedCount || 0,
      verified: item.verifiedCount || 0,
    }))

  const [activeStatuses, setActiveStatuses] = useState(['open', 'completed', 'verified'])

  const handleLegendClick = (dataKey) => {
    setActiveStatuses((prev) =>
      prev.includes(dataKey)
        ? prev.filter((key) => key !== dataKey)
        : [...prev, dataKey]
    )
  }

  const filteredRechartsData = rechartsStackData.map((item) => ({
    ...item,
    open: activeStatuses.includes('open') ? item.open : 0,
    completed: activeStatuses.includes('completed') ? item.completed : 0,
    verified: activeStatuses.includes('verified') ? item.verified : 0,
  }))

  /* ---------------- CHART CLICK ---------------- */
  const handleChartBarClick = (payload, statusType) => {
    if (!payload?.frequencyId) return

    navigate('/reports/tasks/ScheduledDetails/TaskReport', {
      state: {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        locationId: filters.locationId,
        frequencyId: payload.frequencyId,
        statusType,
      },
    })
  }

  /* ---------------- CUSTOM TOOLTIP ---------------- */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload

    return (
      <div
        style={{
          background: '#fff',
          border: '1px solid #ddd',
          padding: '10px 14px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: 13
        }}
      >
        <strong>{label}</strong>

        {payload.map((item) => (
          <div
            key={item.dataKey}
            style={{
              color: item.color,
              cursor: 'pointer',
              marginTop: 6,
              fontWeight: 500
            }}
            onClick={() =>
              handleChartBarClick(data, item.dataKey)
            }
          >
            {item.name}: {item.value}
          </div>
        ))}
      </div>
    )
  }

  /* ---------------- FILTER HANDLERS ---------------- */
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

  /* ---------------- STATUS PILL ---------------- */
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
    justifyContent:'center',
    alignItems: 'center',
    gap: '20px',          
    width: '100%',
    flexWrap: 'nowrap'
  }

  const pillStyle = {
    display: 'flex',
    alignItems: 'center',
    borderRadius: '20px',
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid #d9d9d9',
    height: '26px',
    minWidth: '90px'    
  }

  const countStyle = {
    flex: 1,
    backgroundColor: '#f5f5f5',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 8px'
  }

  /* ---------------- BOXES ---------------- */
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

  /* -----------------Search ----------------------*/
  
  const stringSorter = (key) => (a, b) =>
  (a[key] || "").localeCompare(b[key] || "");

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
              }}>
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


  /* ---------------- TABLE COLUMNS ---------------- */
  const columns = [
    { title: 'S.No', dataIndex: 'sno', key: 'sno', width: 80, align: 'center' , ...getColumnSearchProps('sno'),sorter: (a, b) => a.sno - b.sno,  },
    { title: 'Location', dataIndex: 'location', key: 'location', width: 350, align: 'center' },
    { title: 'Frequency', dataIndex: 'frequency', key: 'frequency', width: 350, align: 'center' , ...getColumnSearchProps('frequency'), sorter: stringSorter("frequency") },

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
                navigate('/reports/tasks/ScheduledDetails/TaskReport', {
                  state: {
                    fromDate: filters.fromDate,
                    toDate: filters.toDate,
                    locationId: record.locationId,
                    frequencyId: record.frequencyId,
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

  /* ---------------- RENDER ---------------- */
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

        {/* SUMMARY BOXES */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {boxes.map((box) => (
            <Grid item xs={12} sm={6} md={3} key={box.key}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: `1px solid ${box.color}`,
                  backgroundColor: `${box.color}0f`, 
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

        {/* TABLE + CHART */}
        <Card sx={{ mt: 2 }}>
          <CardContent>
            {isLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* CHART */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ width: '100%', height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={filteredRechartsData}
                          margin={{ top: 30, right: 30, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="frequency" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            wrapperStyle={{ paddingTop: 10 }}
                            formatter={(value, entry) => {
                              const dataKey = entry.dataKey
                              const isActive = activeStatuses.includes(dataKey)
                              return (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleLegendClick(dataKey)
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    opacity: isActive ? 1 : 0.4,
                                  }}
                                >
                                  {value}
                                </span>
                              )
                            }}
                          />

                          <Bar
                            dataKey="open"
                            stackId="a"
                            fill="#ff4d6d"
                            name="Open"
                            style={{ cursor: 'pointer' }}
                            radius={[4, 4, 0, 0]}
                            animationDuration={900}
                            onClick={(data) =>
                              handleChartBarClick(data.payload, 'open')
                            }
                            activeBar={{ fill: '#ff6b81', stroke: '#ff4d6d', strokeWidth: 2 }}
                          />

                          <Bar
                            dataKey="completed"
                            stackId="a"
                            fill="#69b1ff"
                            name="Completed"
                            style={{ cursor: 'pointer' }}
                            animationDuration={900}
                            onClick={(data) =>
                              handleChartBarClick(data.payload, 'completed')
                            }
                            activeBar={{ fill: '#91caff', stroke: '#69b1ff', strokeWidth: 2 }}
                          />

                          <Bar
                            dataKey="verified"
                            stackId="a"
                            fill="#73d13d"
                            name="Verified"
                            style={{ cursor: 'pointer' }}
                            radius={[4, 4, 0, 0]}
                            animationDuration={900}
                            onClick={(data) =>
                              handleChartBarClick(data.payload, 'verified')
                            }
                            activeBar={{ fill: '#95de64', stroke: '#73d13d', strokeWidth: 2 }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>

                {/* TABLE */}
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