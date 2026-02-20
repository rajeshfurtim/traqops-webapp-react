import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Tag } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import useGetFreqencyList from '../../../hooks/useGetFrequencyList'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetFrequencyCountQuery } from '../../../store/api/taskReport.api'
import { useAuth } from '../../../context/AuthContext'
import { FaClipboardList, FaExternalLinkAlt, FaCheckSquare, FaCheckCircle } from 'react-icons/fa'
import { Height } from '@mui/icons-material'
const { RangePicker } = DatePicker

export default function ScheduledMaintenanceReports() {

  const [form] = Form.useForm()
  const { user } = useAuth()
  // Fetch frequency and location options
  const { freqencyList, isLoading: frequencyLoading } = useGetFreqencyList()
  const { locations, loading: locationsLoading } = useGetLocationList()

  const frequencyOptions = [
    { id: -1, name: 'All Frequency' },
    ...(Array.isArray(freqencyList) && freqencyList.length > 0
      ? freqencyList.map((fre) => ({
        id: fre?.id,
        name: fre?.name || 'Unknown',
      }))
      : []),
  ]

  const locationOptions = [
    { id: -1, name: 'All Locations' },
    ...(Array.isArray(locations) && locations.length > 0
      ? locations.map((loc) => ({
        id: loc?.id,
        name: loc?.name || 'Unknown',
      }))
      : []),
  ]

  const [filters, setFilters] = useState({
    fromDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
    locationId: '-1',
    frequencyId: freqencyList.map((fre) => fre.id),
  })
  const clientId = user?.client?.id || user?.clientId
  // API call with filters
  const { data: reportData, isLoading } = useGetFrequencyCountQuery({ ...filters, clientId }, {
    skip: !filters.fromDate || !filters.toDate,
  })

  const reports = reportData?.data || []

  const handleApplyFilters = (values) => {
    setFilters({
      fromDate: values.dateRange ? values.dateRange[0].format('YYYY-MM-DD') : undefined,
      toDate: values.dateRange ? values.dateRange[1].format('YYYY-MM-DD') : undefined,
      locationId: values.location,
      // values.location === -1
      //   ? locations.map((loc) => loc.id) 
      //   : values.location,
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

  const getStatusColor = (status) => {
    const colors = {
      Completed: 'green',
      Pending: 'orange',
      Overdue: 'red',
      'In Progress': 'blue',
    }
    return colors[status] || 'default'
  }

  const totalOpen = reports.reduce((sum, item) => sum + (item.openCount || 0), 0)
  const totalCompleted = reports.reduce((sum, item) => sum + (item.completedCount || 0), 0)
  const totalVerified = reports.reduce((sum, item) => sum + (item.verifiedCount || 0), 0)
  const totalTasks = totalOpen + totalCompleted + totalVerified

  const boxes = [
    {
      label: `TOTAL: ${totalTasks}`,
      bgColor: '#2E8B57',
      icon: <FaClipboardList size={40} color="white" />,
    },
    {
      label: `OPEN : ${totalOpen}`,
      bgColor: '#8A9EFF',
      icon: <FaExternalLinkAlt size={40} color="white" />,
    },
    {
      label: `COMPLETED : ${totalCompleted}`,
      bgColor: '#555555',
      icon: <FaCheckSquare size={40} color="white" />,
    },
    {
      label: `VERIFIED : ${totalVerified}`,
      bgColor: '#66CC33',
      icon: <FaCheckCircle size={40} color="white" />,
    },
  ]

  const columns = [
    { title: 'Task ID', dataIndex: 'taskId', key: 'taskId', width: 120 },
    { title: 'Task Name', dataIndex: 'taskName', key: 'taskName', width: 200 },
    { title: 'Asset', dataIndex: 'asset', key: 'asset', width: 150 },
    {
      title: 'Scheduled Date',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      width: 140,
      render: (text) => dayjs(text).format('MMM DD, YYYY'),
    },
    {
      title: 'Completed Date',
      dataIndex: 'completedDate',
      key: 'completedDate',
      width: 140,
      render: (text) => (text ? dayjs(text).format('MMM DD, YYYY') : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    { title: 'Assigned To', dataIndex: 'assignedTo', key: 'assignedTo', width: 150 },
    { title: 'Depot', dataIndex: 'depot', key: 'depot', width: 120 },
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

        {/* Filter Form */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              layout="inline"
              // onFinish={handleFilterChange}
              onFinish={handleApplyFilters}
              style={{ marginBottom: 16 }}
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
                <Select
                  placeholder="All Location"
                  style={{ width: 230 }}
                  allowClear
                  loading={locationsLoading}
                >
                  {locationOptions.map((item) => (
                    <Select.Option key={item.id} value={item.id}>
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="frequencyId" label="Frequency">
                <Select
                  placeholder="All Frequencies"
                  style={{ width: 180 }}
                  allowClear
                  loading={frequencyLoading}
                >
                  {frequencyOptions.map((item) => (
                    <Select.Option key={item.id} value={item.id}>
                      {item.name}
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

        {/* Report Table */}
        <Card>
          <CardContent>
            {/* <Box sx={{ display: 'flex', gap: 2, p: 1 }}>
              {boxes.map((box, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: box.bgColor,
                    height: box.height || 150, // fallback height
                    width: box.width || 350, // fallback width
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 40,
                    margin: 8,
                    color: 'white',
                  }}
                >
                  {box.icon}
                  <span style={{ marginLeft: 8 }}>{box.label}</span>
                </div>
              ))}
            </Box> */}
            <Box sx={{ display: 'flex', gap: 2, p: 1 }}>
              {boxes.map((box, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: box.bgColor,
                    height: 100, 
                    width: 350,
                    display: 'flex',
                    alignItems: 'center', 
                    justifyContent: 'flex-start', 
                    borderRadius: 30,
                    padding: '0 20px', 
                    color: 'white',
                  }}
                >
                  <div style={{ marginRight: 20, display: 'flex', alignItems: 'center' }}>
                    {box.icon}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: 28, fontWeight: 'bold', lineHeight: 1.2 }}>
                      {box.label.split(':')[1]}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 'bold', opacity: 0.8 }}>
                      {box.label.split(':')[0]} 
                    </span>
                  </div>
                </div>
              ))}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Space>
                <AntButton icon={<FileExcelOutlined />}>Export Excel</AntButton>
                <AntButton icon={<FilePdfOutlined />}>Export PDF</AntButton>
              </Space>
            </Box>

            {isLoading ? (
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