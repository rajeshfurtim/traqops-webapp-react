import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Input, message } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useAuth } from '../../../context/AuthContext'
import { useGetMonthlyEmployeeReportQuery } from '../../../store/api/reports.api'
// import { exportToExcel, exportToPDF } from 'your-export-utils' // adjust accordingly

export default function MonthlyEmployeeAttendanceReport() {
  const [form] = Form.useForm()
  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId

  const [reports, setReports] = useState([])
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

  const handleFilterChange = (values) => {
    const newFilters = {}

    if (values.month) {
      newFilters.fromDate = values.month.startOf('month').format('YYYY-MM-DD')
      newFilters.toDate = values.month.endOf('month').format('YYYY-MM-DD')
    }

    newFilters.userTypeId = values.userTypeId
    newFilters.locationId = locationIds

    setReports([])
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const {
    data: response,
    isLoading,
    isFetching,
  } = useGetMonthlyEmployeeReportQuery(
    {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      locationId: filters.locationId,
      userTypeId: filters.userTypeId === -1 ? null : filters.userTypeId,
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
      id: `${item.employeeCode}-${index}`, // guaranteed unique key
      employeeNo: item.employeeCode,
      employeeName: item.userName,
      userType: item.userTypeName,
      totalDuty: item.monthWiseShift?.length || 0,
      ...dayMap,
    }
  }

  // Search state
  const [searchText, setSearchText] = useState('')
  const filteredReports = useMemo(() => {
    if (!searchText) return reports
    const lowerSearch = searchText.trim().toLowerCase()
    return reports.filter(r =>
      r.employeeNo?.toLowerCase().includes(lowerSearch) ||
      r.employeeName?.toLowerCase().includes(lowerSearch) ||
      r.userType?.toLowerCase().includes(lowerSearch)
    )
  }, [reports, searchText])

  useEffect(() => {
    if (Array.isArray(response?.data)) {
      setReports(response.data.map((item, idx) => transformReportRow(item, idx)))
    } else {
      setReports([])
    }
  }, [response])

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

  const [columns, setColumns] = useState([])

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

  const loading = isLoading || isFetching

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
            <Form
              form={form}
              layout="inline"
              onFinish={handleFilterChange}
            >
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
                <AntButton type="primary" htmlType="submit">
                  Apply
                </AntButton>
              </Form.Item>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
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
                  <Typography fontWeight="bold">
                    Overall Employee Count:{' '}
                    <span style={{ color: '#1890ff' }}>{reports.length}</span>
                    {' | '}Total Duty:{' '}
                    <span style={{ color: '#52c41a' }}>
                      {reports.reduce((s, r) => s + r.totalDuty, 0)}
                    </span>
                  </Typography>

                  <Space style={{ marginLeft: 'auto' }}>
                    <Input
                      placeholder="Search"
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={e => setSearchText(e.target.value)}
                      allowClear
                      style={{ width: 250 }}
                    />
                    <AntButton
                      type="default"
                      icon={<FileExcelOutlined />}
                      onClick={handleExportExcel}
                      disabled={reports.length === 0}
                      style={{ backgroundColor: '#52c41a', color: '#fff', borderColor: '#52c41a' }}
                    >
                      Export Excel
                    </AntButton>
                    <AntButton
                      type="default"
                      icon={<FilePdfOutlined />}
                      onClick={handleExportPDF}
                      disabled={reports.length === 0}
                      style={{ backgroundColor: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' }}
                    >
                      Export PDF
                    </AntButton>
                  </Space>
                </Box>

                <Table
                  dataSource={filteredReports}
                  columns={columns}
                  rowKey="id" // fixed duplicate key issue
                  pagination={{ pageSize: 100 }}
                  scroll={{ x: 'max-content' }}
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
