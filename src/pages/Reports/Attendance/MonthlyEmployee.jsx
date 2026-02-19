import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Input, message, Empty, Spin } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useAuth } from '../../../context/AuthContext'
import { useGetMonthlyEmployeeReportQuery } from '../../../store/api/reports.api'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'

export default function MonthlyEmployeeAttendanceReport() {
  const [form] = Form.useForm()
  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId

  const [shouldFetch, setShouldFetch] = useState(false)
  const [reports, setReports] = useState([])
  const [searchText, setSearchText] = useState('')
  const [columns, setColumns] = useState([])

  const [filters, setFilters] = useState({
    fromDate: null,
    toDate: null,
    locationId: [],
    userTypeId: -1,
  })

  const { userTypes, loading: userTypeLoading } = useGetAllUserType()
  const { locations } = useGetLocationList()

  const locationIds = Array.isArray(locations)
    ? locations.map(l => l?.id).filter(Boolean)
    : []

  useEffect(() => {
    form.setFieldsValue({
      month: dayjs(),
      userTypeId: -1,
    })
  }, [])

  const {
    data: response,
    isLoading: queryLoading,
  } = useGetMonthlyEmployeeReportQuery(
    {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      locationId: filters.locationId,
      userTypeId: filters.userTypeId === -1 ? null : filters.userTypeId,
      clientId,
    },
    { skip: !clientId || !shouldFetch }
  )

  // Shift Logic
  const getShiftByTime = (inTime) => {
    const hour = Number(inTime.split(':')[0])
    if (hour >= 5 && hour < 8) return 'A'
    if (hour >= 8 && hour < 10) return 'G'
    if (hour >= 13 && hour < 15) return 'B'
    if (hour >= 21) return 'C'
    return 'P'
  }

  const transformReportRow = (item, index) => {
    const dayMap = {}

    item.monthWiseShift?.forEach(shift => {
      if (!shift?.createdAt || !shift?.inTime) return
      const day = dayjs(shift.createdAt).date()
      const code = getShiftByTime(shift.inTime)

      if (!dayMap[`day${day}`]) dayMap[`day${day}`] = new Set()
      dayMap[`day${day}`].add(code)
    })

    Object.keys(dayMap).forEach(k => {
      dayMap[k] = Array.from(dayMap[k]).join('/')
    })

    return {
      id: `${item.employeeCode}-${index}`,
      employeeNo: item.employeeCode,
      employeeName: item.userName,
      userType: item.userTypeName,
      totalDuty: item.monthWiseShift?.length || 0,
      ...dayMap,
    }
  }

  // Handle Search
  const handleSearch = () => {
    if (!clientId) {
      message.error('Client id not found. Please login again')
      return
    }

    const values = form.getFieldsValue()

    if (!values.month) {
      message.error('Please select month')
      return
    }

    const fromDate = values.month.startOf('month').format('YYYY-MM-DD')
    const toDate = values.month.endOf('month').format('YYYY-MM-DD')

    setFilters({
      fromDate,
      toDate,
      locationId: locationIds,
      userTypeId: values.userTypeId,
    })

    setShouldFetch(true)
  }

  // Filter Search
  const filteredReports = useMemo(() => {
    if (!searchText) return reports
    const lower = searchText.toLowerCase()

    return reports.filter(r =>
      r.employeeNo?.toLowerCase().includes(lower) ||
      r.employeeName?.toLowerCase().includes(lower) ||
      r.userType?.toLowerCase().includes(lower)
    )
  }, [reports, searchText])

  // Set Report Data
  useEffect(() => {
    if (queryLoading) return

    if (response?.success && Array.isArray(response?.data)) {
      setReports(response.data.map((item, idx) => transformReportRow(item, idx)))
    } else {
      setReports([])
    }
  }, [response, queryLoading])

  // Base Columns
  const baseColumns = [
    {
      title: 'Employee No',
      dataIndex: 'employeeNo',
      fixed: 'left',
      width: 140,
      sorter: (a, b) => a.employeeNo.localeCompare(b.employeeNo),
    },
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      fixed: 'left',
      width: 220,
      sorter: (a, b) => a.employeeName.localeCompare(b.employeeName),
    },
    {
      title: 'User Type',
      dataIndex: 'userType',
      width: 180,
    },
    {
      title: 'Total Duty',
      dataIndex: 'totalDuty',
      width: 120,
      align: 'center',
      sorter: (a, b) => a.totalDuty - b.totalDuty,
    },
  ]

  // Dynamic Day Columns
  useEffect(() => {
    if (!filters.fromDate) return

    const days = dayjs(filters.fromDate).daysInMonth()

    const dayColumns = Array.from({ length: days }, (_, i) => ({
      title: i + 1,
      dataIndex: `day${i + 1}`,
      width: 70,
      align: 'center',
    }))

    setColumns([...baseColumns, ...dayColumns])
  }, [filters.fromDate])

  // Export
  const [exporting, setExporting] = useState({ excel: false, pdf: false })

  const handleExportExcel = async () => {
    try {
      setExporting(prev => ({ ...prev, excel: true }))

      await exportToExcel(
        columns,
        filteredReports,
        `monthly-attendance-${filters.fromDate}`
      )

      message.success('Excel exported successfully')
    } catch {
      message.error('Excel export failed')
    } finally {
      setExporting(prev => ({ ...prev, excel: false }))
    }
  }

  const handleExportPDF = async () => {
    try {
      setExporting(prev => ({ ...prev, pdf: true }))

      await exportToPDF(
        columns,
        filteredReports,
        `monthly-attendance-${filters.fromDate}`
      )

      message.success('PDF exported successfully')
    } catch {
      message.error('PDF export failed')
    } finally {
      setExporting(prev => ({ ...prev, pdf: false }))
    }
  }

  const handleResetFilters = () => {
    setShouldFetch(false)
    setReports([])
    setSearchText('')

    form.setFieldsValue({
      month: dayjs(),
      userTypeId: -1,
    })
  }

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/attendance/monthly-employee')}</title>
        <meta
          name="description"
          content={`${APP_CONFIG.name} - Monthly Employee Attendance Report`}
        />
      </Helmet>

      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Monthly Employee Attendance Report
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form form={form} layout="inline">
              <Form.Item name="month" label="Month">
                <DatePicker picker="month" allowClear={false} />
              </Form.Item>

              <Form.Item name="userTypeId" label="User Type">
                <Select style={{ width: 220 }} loading={userTypeLoading}>
                  <Select.Option value={-1}>All User Types</Select.Option>
                  {userTypes?.map(u => (
                    <Select.Option key={u.id} value={u.id}>
                      {u.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <AntButton
                  type="primary"
                  icon={<SearchOutlined />}
                  loading={queryLoading}
                  onClick={handleSearch}
                >
                  Search
                </AntButton>
              </Form.Item>

              <Form.Item>
                <AntButton onClick={handleResetFilters}>
                  Reset
                </AntButton>
              </Form.Item>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {!shouldFetch ? (
              <Empty description ="Click search to view data" />
            ) :
             queryLoading ? (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    mb: 2,
                    pb: 2,
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Typography fontWeight="bold" variant="body2" sx={{ fontSize: '1.2rem' }} >
                    Overall Employee Count:{' '}
                    <span style={{ color: '#1890ff' }}>{reports.length}</span>
                    {' | '}Total Duty:{' '}
                    <span style={{ color: '#52c41a' }}>
                      {reports.reduce((s, r) => s + r.totalDuty, 0)}
                    </span>
                  </Typography>

                  <Space style={{ marginLeft: 'auto' }} size={12}>
                    <Input
                      placeholder="Search"
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={e => setSearchText(e.target.value)}
                      allowClear
                      style={{ width: 250 }}
                    />

                    <AntButton
                      icon={<FileExcelOutlined />}
                      onClick={handleExportExcel}
                      disabled={reports.length === 0}
                      // style={{ backgroundColor: '#52c41a', color: '#fff', borderColor: '#52c41a' }}
                    >
                      Export Excel
                    </AntButton>

                    <AntButton
                      icon={<FilePdfOutlined />}
                      onClick={handleExportPDF}
                      disabled={reports.length === 0}
                      //  style={{ backgroundColor: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' }}
                    >
                      Export PDF
                    </AntButton>
                  </Space>
                </Box>

                <Table
                  dataSource={filteredReports}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 100 }}
                  size="middle"
                  scroll={{ x: 'max-content', y: 450 }}
                  bordered
                  components={{
                  header: {
                    cell: (props) => (
                      <th
                        {...props}
                        style={{
                          ...props.style,
                          fontSize: '16px',
                          fontWeight: 600,
                          padding: '12px 8px'
                        }}
                      />
                    )
                  },
                  body: {
                    cell: (props) => (
                      <td
                        {...props}
                        style={{
                          ...props.style,
                          fontSize: '15px',
                          fontWeight: 400,
                          padding: '12px 8px'
                        }}
                      />
                    )
                  }
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
