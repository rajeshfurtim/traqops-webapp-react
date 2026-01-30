import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import {Table,Form,Select,DatePicker,Space,Button as AntButton,Row,Col,} from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useAuth } from '../../../context/AuthContext'
import { useGetMonthlyEmployeeReportQuery } from '../../../store/api/reports.api'

const { RangePicker } = DatePicker

export default function MonthlyDailyAttendanceReport() {
  const [form] = Form.useForm()
  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId

  const [reports, setReports] = useState([])
  const [filters, setFilters] = useState({
    fromDate: null,
    toDate: null,
    locationId: [],
    userTypeId: null,
  })

  const { userTypes, loading: userTypesLoading } = useGetAllUserType()
  const { locations, loading: locationsLoading } = useGetLocationList()

  const locationIds = Array.isArray(locations)
    ? locations.map(l => l?.id).filter(Boolean)
    : []

  const typeOptions = [
    { id: -1, name: 'All User Types' },
    ...(userTypes || []),
  ]

  const locationOptions = [
    { id: -1, name: 'All Locations' },
    ...(locations || []),
  ]

  useEffect(() => {
    const today = dayjs()

    form.setFieldsValue({
      dateRange: [today, today],
      location: -1,
      type: -1,
    })

    setFilters({
      fromDate: today.format('YYYY-MM-DD'),
      toDate: today.format('YYYY-MM-DD'),
      locationId: locationIds,
      userTypeId: null,
    })
  }, [locations])

  const handleFilterChange = (values) => {
    const newFilters = {}

    if (values.dateRange?.length === 2) {
      const [from, to] = values.dateRange
      newFilters.fromDate = from.format('YYYY-MM-DD')
      newFilters.toDate = to.format('YYYY-MM-DD')
    }

    newFilters.locationId =
      values.location === -1 ? locationIds : values.location

    newFilters.userTypeId =
      values.type === -1 ? null : values.type

    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const {
    data: response,
    isLoading,
    isFetching,
  } = useGetMonthlyEmployeeReportQuery(
    {
      ...filters,
      clientId,
    },
    { skip: !clientId || !filters.fromDate || !filters.toDate }
  )

  const getShiftByTime = (inTime) => {
    const hour = Number(inTime.split(':')[0])
    if (hour >= 5 && hour < 8) return 'A'
    if (hour >= 8 && hour < 10) return 'G'
    if (hour >= 13 && hour < 15) return 'B'
    if (hour >= 21) return 'C'
    return 'P'
  }

  const transformReportRow = (item) => {
    const dayMap = {}

    item.monthWiseShift?.forEach(shift => {
      if (!shift?.createdAt || !shift?.inTime) return
      const day = dayjs(shift.createdAt).date()
      const code = getShiftByTime(shift.inTime)

      if (!dayMap[day]) dayMap[day] = new Set()
      dayMap[day].add(code)
    })

    Object.keys(dayMap).forEach(d => {
      dayMap[d] = [...dayMap[d]].join('/')
    })

    return {
      id: item.employeeCode,
      employeeId: item.employeeCode,
      employeeName: item.userName,
      userType: item.userTypeName,
      location: item.locationName,
      totalDuties: item.monthWiseShift?.length || 0,
      ...dayMap,
    }
  }

  useEffect(() => {
    if (Array.isArray(response?.data)) {
      setReports(response.data.map(transformReportRow))
    } else {
      setReports([])
    }
  }, [response])

  const getDateColumns = () => {
    if (!filters.fromDate || !filters.toDate) return []

    const start = dayjs(filters.fromDate)
    const end = dayjs(filters.toDate)
    const cols = []

    let current = start

    while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
      const d = current.date()
      cols.push({
        title: d,
        dataIndex: d,
        width: 45,
        align: 'center',
      })
      current = current.add(1, 'day')
    }

    return cols
  }

  const columns = [
    { title: 'Emp ID', dataIndex: 'employeeId', fixed: 'left', width: 120 },
    { title: 'Employee Name', dataIndex: 'employeeName', fixed: 'left', width: 200 },
    { title: 'User Type', dataIndex: 'userType', width: 120 },
    { title: 'Location', dataIndex: 'location', width: 120 },
    { title: 'Total Duties', dataIndex: 'totalDuties', width: 120, align: 'center' },
    ...getDateColumns(),
  ]

  const getSummaryData = () => {
    const summary = { totalDuties: 0, dayCounts: {} }

    reports.forEach(row => {
      summary.totalDuties += row.totalDuties || 0
      Object.keys(row).forEach(k => {
        if (!isNaN(k) && row[k]) {
          summary.dayCounts[k] = (summary.dayCounts[k] || 0) + 1
        }
      })
    })

    return summary
  }
  const handleExportExcel = async () => {
        try {
          await exportToExcel(reports, `monthly-attendance-${dayjs(filters.fromDate).format('YYYY-MM')}`)
          message.success('Excel file exported successfully')
        } catch (error) {
          message.error('Failed to export Excel file')
        }
      }
    
    const handleExportPDF = async () => {
        try {
          await exportToPDF(reports, `monthly-attendance-${dayjs(filters.fromDate).format('YYYY-MM')}`)
          message.success('PDF file exported successfully')
        } catch (error) {
          message.error('Failed to export PDF file')
        }
      }

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/attendance/monthly-daily')}</title>
        <meta
          name="description"
          content={`${APP_CONFIG.name} - Monthly Daily Attendance Report`}
        />
      </Helmet>

      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Monthly Daily Attendance Report
        </Typography>

        {/* FILTERS */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form form={form} layout="inline" onFinish={handleFilterChange}>
                  <Form.Item
                    name="dateRange"
                    label="Date Range"
                    // rules={[{ required: true }]}
                  >
                    <RangePicker
                      format="DD-MM-YYYY"
                      disabledDate={(c) => c && c > dayjs().endOf('day')}
                      allowClear={false}
                    />
                  </Form.Item>
                  <Form.Item name="location" label="Location">
                    <Select loading={locationsLoading}>
                      {locationOptions.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="type" label="User Type">
                    <Select loading={userTypesLoading}>
                      {typeOptions.map(t => (
                        <Select.Option key={t.id} value={t.id}>
                          {t.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <AntButton type="primary" htmlType="submit">
                      Apply Filters
                    </AntButton>
                  </Form.Item>
                  <Form.Item>
                    <AntButton
                      onClick={() => {
                        const today = dayjs()
                        form.setFieldsValue({
                          dateRange: [today, today],
                          location: -1,
                          type: -1,
                        })
                        handleFilterChange({
                          dateRange: [today, today],
                          location: -1,
                          type: -1,
                        })
                      }}
                    >
                      Reset
                    </AntButton>
                  </Form.Item>
            </Form>
          </CardContent>
        </Card>

      <Card>
  <CardContent>
    {(isLoading || isFetching) ? (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    ) : (
      <>
        {/* SUMMARY HEADER */}
        <Box
          sx={{
            mb: 2,
            pb: 1.5,
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography fontWeight="bold">
            Overall Employee Count:{' '}
            <span style={{ color: '#1890ff' }}>
              {reports.length}
            </span>
            {'  |  '}
            Total Duty:{' '}
            <span style={{ color: '#52c41a' }}>
              {reports.reduce((sum, r) => sum + (r.totalDuties || 0), 0)}
            </span>
          </Typography>

          <Space style={{ marginLeft: 'auto' }}>
            <AntButton
                    type="default"
                    icon={<FileExcelOutlined />}
                    onClick={handleExportExcel}
                    disabled={reports.length === 0}
                    style={{ backgroundColor: '#52c41a', color: '#fff', borderColor: '#52c41a' }}
                  >Export Excel
                  </AntButton>
                  <AntButton
                    type="default"
                    icon={<FilePdfOutlined />}
                    onClick={handleExportPDF}
                    disabled={reports.length === 0}
                    style={{ backgroundColor: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' }}
                  >Export PDF
                  </AntButton>
          </Space>
        </Box>

        {/* TABLE */}
        <Table
          dataSource={reports}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          scroll={{ x: 'max-content' }}
          size="small"
          bordered
          summary={() => {
            const { totalDuties, dayCounts } = getSummaryData()
            return (
              <Table.Summary fixed>
                <Table.Summary.Row
                  style={{ fontWeight: 'bold', background: '#fafafa' }}
                >
                  <Table.Summary.Cell colSpan={4}>
                    Total
                  </Table.Summary.Cell>

                  <Table.Summary.Cell align="center">
                    {totalDuties}
                  </Table.Summary.Cell>

                  {getDateColumns().map(col => (
                    <Table.Summary.Cell
                      key={col.dataIndex}
                      align="center"
                    >
                      {dayCounts[col.dataIndex] || 0}
                    </Table.Summary.Cell>
                  ))}
                </Table.Summary.Row>
              </Table.Summary>
            )
          }}
        />
      </>
    )}
  </CardContent>
</Card>

      </Box>
    </>
  )
}
