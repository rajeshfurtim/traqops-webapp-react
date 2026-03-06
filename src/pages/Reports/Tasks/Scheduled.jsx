import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import useGetFreqencyList from '../../../hooks/useGetFrequencyList'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetFrequencyCountQuery } from '../../../store/api/taskReport.api'
import { useAuth } from '../../../context/AuthContext'
import { FaClipboardList, FaExternalLinkAlt, FaCheckSquare, FaCheckCircle } from 'react-icons/fa'
import { Column } from '@ant-design/plots'
import { useNavigate } from 'react-router-dom'
// npm install @ant-design/plots

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
    locationId: item.locationName || 'ALL', 
    frequency: item.frequencyName,
    frequencyId: item.frequencyId,
    open: item.openCount || 0,
    completed: item.completedCount || 0,
    verified: item.verifiedCount || 0,
    total:
      (item.openCount || 0) +
      (item.completedCount || 0) +
      (item.verifiedCount || 0),
  }))
  /* ---------------- CHART DATA ---------------- */

  const chartData = (reportData?.data || [])
    .filter(
      (item) =>
        item.openCount > 0 ||
        item.completedCount > 0 ||
        item.verifiedCount > 0
    )
    .flatMap((item) => [
      {
        frequency: item.frequencyName,
        type: 'Open',
        value: item.openCount || 0,
      },
      {
        frequency: item.frequencyName,
        type: 'Completed',
        value: item.completedCount || 0,
      },
      {
        frequency: item.frequencyName,
        type: 'Verified',
        value: item.verifiedCount || 0,
      },
    ])

  const totalByFrequency = {}

  chartData.forEach((item) => {
    if (!totalByFrequency[item.frequency]) {
      totalByFrequency[item.frequency] = 0
    }
    totalByFrequency[item.frequency] += item.value
  })

  const chartConfig = {
    data: chartData,
    xField: 'frequency',
    yField: 'value',
    seriesField: 'type',
    colorField: 'type',
    isStack: true,
    height: 400,

    onEvent: (chart, event) => {
      if (event.type === 'element:click') {

        const data = event.data?.data
        console.log("Clicked Data:", data)

        if (!data) return

        navigate('/Reports/Tasks/ScheduledDetailsPages/taskReport', {
          state: {
            fromDate: filters.fromDate,
            toDate: filters.toDate,
            locationId: filters.locationId,
            frequencyId: data.frequency,
            statusType: data.type
          }
        })
      }
    },
    animation: {
      appear: {
        animation: 'wave-in',
        duration: 800,
      },
    },

    axis: {
      x: {
        title: 'Frequency',
      },
      y: {
        title: 'Count',
      },
    },

    scale: {
      color: {
        domain: ['Open', 'Completed', 'Verified'],
        range: ['#ff4d6d', '#69b1ff', '#73d13d'],
      },
    },

    label: {
      position: 'middle',
      formatter: (datum) => (datum.value > 0 ? datum.value : ''),
      style: {
        fill: '#fff',
        fontSize: 12,
        fontWeight: 600,
      },
    },

    legend: {
      position: 'top',
    },

    columnStyle: {
      radius: [8, 8, 0, 0],
    },

    annotations: Object.keys(totalByFrequency).map((freq) => ({
      type: 'text',
      position: [freq, totalByFrequency[freq]],
      content: String(totalByFrequency[freq]),
      style: {
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 700,
        fill: '#000',
      },
      offsetY: -12,
    })),
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
    { label: `TOTAL: ${totalTasks}`, bgColor: '#2E8B57', icon: <FaClipboardList size={40} color="white" /> },
    { label: `OPEN : ${totalOpen}`, bgColor: '#8A9EFF', icon: <FaExternalLinkAlt size={40} color="white" /> },
    { label: `COMPLETED : ${totalCompleted}`, bgColor: '#555555', icon: <FaCheckSquare size={40} color="white" /> },
    { label: `VERIFIED : ${totalVerified}`, bgColor: '#66CC33', icon: <FaCheckCircle size={40} color="white" /> },
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
    gap: 8,
    alignItems: 'center'
  }

  const pillStyle = {
    display: 'flex',
    borderRadius: 50,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid #d9d9d9',
    transition: 'all 0.2s ease',
    cursor: 'default',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    width: '120px'
  }

  const countStyle = {
    padding: '3px 8px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    width: '40px'
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
                navigate('/Reports/Tasks/ScheduledDetailsPages/taskReport', {
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
              layout="inline"
              onFinish={handleApplyFilters}
              initialValues={{
                dateRange: [dayjs().subtract(1, 'day'), dayjs()],
                location: -1,
                frequencyId: -1,
              }}
            >
              <Form.Item name="dateRange" label="Date Range">
                <RangePicker />
              </Form.Item>

              <Form.Item name="location" label="Location">
                <Select style={{ width: 230 }} allowClear loading={locationsLoading}>
                  <Select.Option value={-1}>All Locations</Select.Option>
                  {locations?.map(loc => (
                    <Select.Option key={loc.id} value={loc.id}>
                      {loc.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="frequencyId" label="Frequency">
                <Select style={{ width: 180 }} allowClear loading={frequencyLoading}>
                  <Select.Option value={-1}>All Frequency</Select.Option>
                  {freqencyList?.map(fre => (
                    <Select.Option key={fre.id} value={fre.id}>
                      {fre.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <AntButton type="primary" htmlType="submit">
                    Apply Filters
                  </AntButton>
                  <AntButton onClick={handleResetFilters}>Reset</AntButton>
                </Space>
              </Form.Item>
            </Form>
          </CardContent>
        </Card>

        {/* SUMMARY BOXES */}
        {/* <Box sx={{ display: 'flex', gap: 2, p: 1 }}>
          {boxes.map((box, index) => (
            <div key={index} style={{
              backgroundColor: box.bgColor,
              height: 100,
              width: 350,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 30,
              padding: '0 20px',
              color: 'white',
            }}>
              <div style={{ marginRight: 20 }}>{box.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 'bold' }}>
                  {box.label.split(':')[1]}
                </div>
                <div style={{ fontSize: 14 }}>
                  {box.label.split(':')[0]}
                </div>
              </div>
            </div>
          ))}
        </Box> */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          {boxes.map((box, index) => (
            <Box
              key={index}
              sx={{
                backgroundColor: box.bgColor,
                flex: '1 1 200px',
                minWidth: 250,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 40,
                padding: '16px 24px',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                },
              }}
            >
              <Box sx={{ mr: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {box.icon}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h5" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                  {box.label.split(':')[1].trim()}
                </Typography>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                  {box.label.split(':')[0].trim()}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

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
                    <Column {...chartConfig} />
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