import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent } from '@mui/material'
import {
  Table, Form, Select, DatePicker, Space, Button as AntButton,
  Input, Row, Col, Empty, Skeleton, message
} from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle } from '../../../config/constants'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useAuth } from '../../../context/AuthContext'
import { useGetMonthlyEmployeeReportQuery } from '../../../store/api/reports.api'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'

const { RangePicker } = DatePicker

export default function MonthlyDailyAttendanceReport() {
  const [form] = Form.useForm()
  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId

  const [shouldFetch, setShouldFetch] = useState(false)
  const [reports, setReports] = useState([])
  const [searchText, setSearchText] = useState('')

  const [filters, setFilters] = useState({
    fromDate: null,
    toDate: null,
    locationId: [],
    userTypeId: null,
    filterType: 'attendance',
  })

  const { userTypes, loading: userTypesLoading } = useGetAllUserType()
  const { locations, loading: locationsLoading } = useGetLocationList()

  const locationIds = locations?.map(l => l?.id).filter(Boolean) || []

  const typeOptions = [{ id: -1, name: 'All User Types' }, ...(userTypes || [])]
  const locationOptions = [{ id: -1, name: 'All Locations' }, ...(locations || [])]

  useEffect(() => {
    const today = dayjs()
    form.setFieldsValue({
      dateRange: [today, today],
      location: -1,
      type: -1,
      filter: 'attendance',
    })
  }, [locations])

  // 🔍 GLOBAL SEARCH
  const filteredReports = useMemo(() => {
    if (!searchText) return reports

    const lower = searchText.toLowerCase()

    return reports.filter(row =>
      Object.values(row).some(value => {
        if (!value) return false
        if (typeof value === 'object') {
          return JSON.stringify(value).toLowerCase().includes(lower)
        }
        return String(value).toLowerCase().includes(lower)
      })
    )
  }, [reports, searchText])

  // FILTER
  const handleFilterChange = (values) => {
    const newFilters = {}

    if (values.dateRange?.length === 2) {
      newFilters.fromDate = values.dateRange[0].format('YYYY-MM-DD')
      newFilters.toDate = values.dateRange[1].format('YYYY-MM-DD')
    }

    newFilters.locationId = values.location === -1 ? locationIds : values.location
    newFilters.userTypeId = values.type === -1 ? null : values.type
    newFilters.filterType = values.filter || 'attendance'

    setFilters(prev => ({ ...prev, ...newFilters }))
    setShouldFetch(true)
  }

  const { data: response, isLoading, isFetching } =
    useGetMonthlyEmployeeReportQuery(
      { ...filters, clientId },
      { skip: !clientId || !filters.fromDate || !filters.toDate }
    )

  const queryLoading = isLoading || isFetching

  // ATTENDANCE LOGIC
  const getShiftByTime = (inTime) => {
    const hour = Number(inTime.split(':')[0])
    if (hour >= 5 && hour < 8) return 'A'
    if (hour >= 8 && hour < 10) return 'G'
    if (hour >= 13 && hour < 15) return 'B'
    if (hour >= 21) return 'C'
    return 'P'
  }

  const transformAttendanceRow = (item) => {
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

  const transformTimeRow = (item, index) => {
    const dayMap = {}

    item.monthWiseShift?.forEach(shift => {
      if (!shift?.createdAt) return

      const day = String(dayjs(shift.createdAt).date())

      if (!dayMap[day]) dayMap[day] = []

      dayMap[day].push({
        inTime: shift?.inTime || '-',
        outTime: shift?.outTime || '-',
      })
    })

    return {
      id: `${item.employeeCode}-${index}`,
      employeeId: item.employeeCode,
      employeeName: item.userName,
      userType: item.userTypeName,
      location: item.locationName,
      totalDuties: item.monthWiseShift?.length || 0,
      shifts: dayMap,
    }
  }

  useEffect(() => {
    if (queryLoading) return

    if (response?.success && Array.isArray(response?.data)) {
      const formatted =
        filters.filterType === 'time'
          ? response.data.map(transformTimeRow)
          : response.data.map(transformAttendanceRow)

      setReports(formatted)
    } else {
      setReports([])
    }
  }, [response, queryLoading, filters.filterType])

  // DATE COLUMNS
  const getDateColumns = () => {
    if (!filters.fromDate || !filters.toDate) return []

    const start = dayjs(filters.fromDate)
    const end = dayjs(filters.toDate)

    const cols = []
    let current = start

    while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
      const day = current.date()
      const key = String(day)

      if (filters.filterType === 'attendance') {
        cols.push({
          title: day,
          dataIndex: day,
          align: 'center',
          width: 50,
        })
      } else {
        cols.push({
          title: day,
          key,
          children: [
            {
              title: 'IN',
              key: `${key}-in`,
              align: 'center',
              render: (_, record) => {
                const shifts = record.shifts?.[key] || []
                return shifts.map((s, i) => <div key={i}>{s.inTime}</div>)
              },
            },
            {
              title: 'OUT',
              key: `${key}-out`,
              align: 'center',
              render: (_, record) => {
                const shifts = record.shifts?.[key] || []
                return shifts.map((s, i) => <div key={i}>{s.outTime}</div>)
              },
            },
          ],
        })
      }

      current = current.add(1, 'day')
    }

    return cols
  }

  // SUMMARY
  const getSummaryData = () => {
    const summary = { totalDuties: 0, dayCounts: {} }

    filteredReports.forEach(row => {
      summary.totalDuties += row.totalDuties || 0

      Object.keys(row).forEach(key => {
        if (!isNaN(key) && row[key]) {
          if (typeof row[key] === 'string') {
            summary.dayCounts[key] = (summary.dayCounts[key] || 0) + 1
          }
        }

        if (row.shifts) {
          Object.keys(row.shifts).forEach(day => {
            summary.dayCounts[day] =
              (summary.dayCounts[day] || 0) + row.shifts[day].length
          })
        }
      })
    })

    return summary
  }

  const columns = [
    { title: 'S.No', render: (_, __, i) => i + 1, width: 80, fixed: 'left' },
    { title: 'Emp ID', dataIndex: 'employeeId', width: 140, fixed: 'left' },
    { title: 'Employee Name', dataIndex: 'employeeName', width: 240, fixed: 'left' },
    { title: 'User Type', dataIndex: 'userType', width: 140 , fixed: 'left'},
    { title: 'Location', dataIndex: 'location', width: 250 , fixed: 'left' },
    { title: 'Total Duties', dataIndex: 'totalDuties', align: 'center', width: 120 , fixed: 'left'},
    ...getDateColumns(),
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/attendance')}</title>
      </Helmet>

      <Box>
        {/* <Typography variant="h4" gutterBottom fontWeight="bold">
          Monthly Attendance Report
        </Typography> */}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form form={form} layout="vertical" onFinish={handleFilterChange}>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Form.Item name="dateRange" label="Date Range">
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="location" label="Location">
                    <Select loading={locationsLoading}>
                      {locationOptions.map(l =>
                        <Select.Option key={l.id} value={l.id}>{l.name}</Select.Option>
                      )}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item name="type" label="User Type">
                    <Select loading={userTypesLoading}>
                      {typeOptions.map(t =>
                        <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
                      )}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item name="filter" label="Filter">
                    <Select>
                      <Select.Option value="attendance">Attendance</Select.Option>
                      <Select.Option value="time">Time</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={4} style={{ display: 'flex', alignItems: 'center' }}>
                  <Space>
                    <AntButton type="primary" htmlType="submit">Apply</AntButton>
                    <AntButton onClick={() => form.resetFields()}>Reset</AntButton>
                  </Space>
                </Col>
              </Row>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {!shouldFetch ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Click search to view data"
              />
            ) : queryLoading ? (
              <Box sx={{ width: '100%', maxWidth: '100%', p: 2 }}>
                <Skeleton active title={{ width: '32%' }} paragraph={{ rows: 10 }} />
              </Box>
            ) : (
              <>
                {/* TOOLBAR */}
                <Box
                  display="flex"
                  justifyContent="flex-end"
                  flexWrap="wrap"
                  mb={2}
                  gap={2}
                  sx={{ width: '100%', maxWidth: '100%' }}
                >
                  <Input
                    placeholder="Search..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 250, minWidth: 160, maxWidth: '100%' }}
                  />

                  <AntButton icon={<FileExcelOutlined />} onClick={() => exportToExcel(filteredReports)}>
                    Export Excel
                  </AntButton>

                  <AntButton icon={<FilePdfOutlined />} onClick={() => exportToPDF(filteredReports)}>
                    Export PDF
                  </AntButton>
                </Box>

                {filteredReports.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      searchText
                        ? 'No matching records found'
                        : 'No data available'
                    }
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: '100%',
                      overflowX: 'auto',
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    <Table
                      dataSource={filteredReports}
                      columns={columns}
                      rowKey="id"
                      bordered
                      scroll={{ x: 'max-content', y: 450 }}
                      pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100', '200', '1000'],
                        responsive: true,
                      }}
                      summary={() => {
                        const summary = getSummaryData()

                        return (
                          <Table.Summary fixed>
                            <Table.Summary.Row>
                              <Table.Summary.Cell index={0} />
                              <Table.Summary.Cell index={1} />
                              <Table.Summary.Cell index={2} />
                              <Table.Summary.Cell index={3} />
                              <Table.Summary.Cell index={4}> Total</Table.Summary.Cell>

                              {/* Total Duties */}
                              <Table.Summary.Cell index={5} align="center">
                                {summary.totalDuties}
                              </Table.Summary.Cell>

                              {/* Dynamic Days */}
                              {getDateColumns().map((col, i) => {
                                const day = col.dataIndex || col.key
                                return (
                                  <Table.Summary.Cell key={i} align="center">
                                    {summary.dayCounts?.[day] || 0}
                                  </Table.Summary.Cell>
                                )
                              })}
                            </Table.Summary.Row>
                          </Table.Summary>
                        )
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}