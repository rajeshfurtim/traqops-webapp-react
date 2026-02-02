import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Empty, message, Input } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useGetMonthlyEmployeeReportQuery } from '../../../store/api/reports.api'
import { useAuth } from '../../../context/AuthContext'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'

export default function MonthlyAttendanceReport() {
  const [reports, setReports] = useState([])
  const [shouldFetch, setShouldFetch] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [filters, setFilters] = useState({
    fromDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    toDate: dayjs().endOf('month').format('YYYY-MM-DD'),
    locationId: -1,
    userTypeId: -1
  })
  const [form] = Form.useForm()
  const { user } = useAuth()

  const { locations, loading: locationsLoading } = useGetLocationList()
  const { userTypes, loading: userTypesLoading } = useGetAllUserType()

  const locationOptions = [
    { id: -1, name: 'All Locations' },
    ...(Array.isArray(locations) && locations.length > 0 ? locations.map(loc => ({
      id: loc?.id,
      name: loc?.name || 'Unknown'
    })) : [])
  ]

  const userTypeOptions = [
    { id: -1, name: 'All Departments' },
    ...(Array.isArray(userTypes) && userTypes.length > 0 ? userTypes.map(ut => ({
      id: ut?.id,
      name: ut?.name || 'Unknown'
    })) : [])
  ]

  const clientId = user?.client?.id || user?.clientId

  // Set initial locationId with all location IDs when locations are loaded
  useEffect(() => {
    if (Array.isArray(locations) && locations.length > 0) {
      const allLocationIds = locations.map(loc => loc?.id).join(',')
      setFilters(prev => ({
        ...prev,
        locationId: allLocationIds
      }))
    }
  }, [locations])

  // Function to determine shift based on in-time
  const getShiftLetter = (inTime) => {
    if (!inTime) return ''
    
    const [hours, minutes, seconds] = inTime.split(':').map(Number)
    const timeInMinutes = hours * 60 + minutes

    // Shift times (in minutes from midnight)
    const shiftA = { start: 6 * 60, end: 14 * 60 }           // 06:00 - 14:00
    const shiftB = { start: 14 * 60 + 1, end: 21 * 60 + 59 } // 14:01 - 21:59
    const shiftC = { start: 22 * 60, end: 23 * 60 + 59 }    // 22:00 - 23:59 (next day 00:00 - 05:59)
    const general = { start: 9 * 60, end: 18 * 60 }          // 09:00 - 18:00

    if (timeInMinutes >= shiftA.start && timeInMinutes <= shiftA.end) {
      return 'A'
    } else if (timeInMinutes >= shiftB.start && timeInMinutes <= shiftB.end) {
      return 'B'
    } else if (timeInMinutes >= shiftC.start || (timeInMinutes >= 0 && timeInMinutes < 6 * 60)) {
      return 'C'
    } else if (timeInMinutes >= general.start && timeInMinutes <= general.end) {
      return 'G'
    }
    return 'P'
  }

  // RTK Query hook
  const { data: response, isLoading: queryLoading, error: queryError, refetch } = useGetMonthlyEmployeeReportQuery(
    {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      locationId: filters.locationId,
      userTypeId: filters.userTypeId,
      clientId: clientId,
    },
    { skip: !shouldFetch || !clientId }
  )

  // Debug logging
  useEffect(() => {
    if (shouldFetch) {
      console.log('API Request Triggered:', {
        shouldFetch,
        filters,
        clientId,
        queryLoading,
        queryError,
        response
      })
    }
  }, [shouldFetch, filters, clientId, queryLoading, queryError, response])

  // Handle API errors and timeouts
  useEffect(() => {
    if (queryError) {
      console.error('API Error:', queryError)
      const errorMsg = queryError?.data?.message || 
                       queryError?.error || 
                       queryError?.message || 
                       'Failed to fetch report. Please try again.'
      setApiError(errorMsg)
      message.error(errorMsg)
      setReports([])
      setShouldFetch(false)
    } else if (response?.success === false) {
      const errorMsg = response?.message || 'Server returned an error'
      console.error('API Response Error:', errorMsg)
      setApiError(errorMsg)
      message.error(errorMsg)
      setReports([])
      setShouldFetch(false)
    } else {
      setApiError(null)
    }
  }, [queryError, response])

  // Timeout handler removed - let API complete without timeout
  useEffect(() => {
    // Keep loading visible until response arrives
    if (queryLoading) {
      console.log('Loading...')
    }
  }, [queryLoading])

  // Process response data
  useEffect(() => {
    if (!queryLoading && response?.success && response.data && Array.isArray(response.data)) {
      console.log('Processing response data:', response.data.length, 'records')
      const mappedReports = response.data.map((item, index) => {
        // Create a map of day-wise shifts from monthWiseShift array
        const dayShiftMap = {}
        let totalDutyCount = 0
        
        if (Array.isArray(item.monthWiseShift)) {
          item.monthWiseShift.forEach(shift => {
            if (shift.createdAt && shift.inTime) {
              const date = new Date(shift.createdAt)
              const day = date.getDate()
              dayShiftMap[`day${day}`] = getShiftLetter(shift.inTime)
              // Count unique days with inTime
              totalDutyCount++
            }
          })
        }

        return {
          id: item.id || index,
          employeeNo: item.employeeCode || '',
          employeeName: item.userName || '',
          userType: item.userTypeName || '',
          location: item.locationName || '',
          totalDuty: totalDutyCount || 0,
          // Map daily shift data (days 1-31)
          ...Object.fromEntries(
            Array.from({ length: 31 }, (_, i) => [
              `day${i + 1}`,
              dayShiftMap[`day${i + 1}`] || ''
            ])
          )
        }
      })
      console.log('Mapped reports:', mappedReports)
      setReports(mappedReports)
      setApiError(null)
      setShouldFetch(false)
    } else if (!queryLoading && response && !response.success) {
      const errorMsg = response.message || 'Failed to load monthly attendance report'
      console.error('API Response Error:', errorMsg)
      setApiError(errorMsg)
      message.error(errorMsg)
      setReports([])
      setShouldFetch(false)
    }
  }, [response, queryLoading])

  const handleFilterChange = (values) => {
    const newFilters = { ...filters }
    if (values.month) {
      const selectedMonth = dayjs(values.month)
      newFilters.fromDate = selectedMonth.startOf('month').format('YYYY-MM-DD')
      newFilters.toDate = selectedMonth.endOf('month').format('YYYY-MM-DD')
    }
    
    // Handle location selection - send all location IDs if "All Locations" is selected
    if (values.location === 'All Locations') {
      if (Array.isArray(locations) && locations.length > 0) {
        newFilters.locationId = locations.map(loc => loc?.id).join(',')
      }
    } else if (values.location) {
      const selectedLocation = locationOptions.find(loc => loc.name === values.location)
      if (selectedLocation) {
        newFilters.locationId = selectedLocation.id
      }
    }
    
    // Handle department/user type selection
    if (values.department && values.department !== 'All Departments') {
      const selectedUserType = userTypeOptions.find(ut => ut.name === values.department)
      if (selectedUserType) {
        newFilters.userTypeId = selectedUserType.id
      }
    } else {
      newFilters.userTypeId = -1
    }
    console.log('Applied Filters:', newFilters)
    setFilters(newFilters)
    // Trigger API call after filters are updated
    setShouldFetch(true)
  }
  //filter
   const [searchText, setSearchText] = useState('')
    const filteredReports = useMemo(() => {
      if (!searchText) return reports
      const lowerSearch = searchText.trim().toLowerCase()
      return reports.filter(r =>
        r.employeeNo?.toLowerCase().includes(lowerSearch) ||
        r.employeeName?.toLowerCase().includes(lowerSearch) ||
        r.userType?.toLowerCase().includes(lowerSearch) ||
        r.location?.toLowerCase().includes(lowerSearch)
      )
    }, [reports, searchText])
  


  const handleSearch = () => {
    if (!clientId) {
      message.error('Client ID not found. Please login again.')
      return
    }
    // Submit the form to update filters first, then trigger API call
    form.submit()
  }

  const handleResetFilters = () => {
    const currentMonth = dayjs()
    setApiError(null)
    setShouldFetch(false)
    setReports([])
    form.setFieldsValue({
      month: currentMonth,
      location: 'All Locations',
      department: 'All Departments'
    })
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

  const columns = [
    {
      title: 'Employee No',
      dataIndex: 'employeeNo',
      key: 'employeeNo',
      width: 120,
      fixed: 'left',
      sorter: (a, b) => a.employeeNo.localeCompare(b.employeeNo)
    },
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 220,
      fixed: 'left',
      sorter: (a, b) => a.employeeName.localeCompare(b.employeeName)
    },
    {
      title: 'User Type',
      dataIndex: 'userType',
      key: 'userType',
      width: 180,
      sorter: (a, b) => a.userType.localeCompare(b.userType)
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 250,
      sorter: (a, b) => a.location.localeCompare(b.location)
    },
    {
      title: 'Total Duty',
      dataIndex: 'totalDuty',
      key: 'totalDuty',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.totalDuty - b.totalDuty
    },
    // Dynamic date columns (1-31)
    ...Array.from({ length: 31 }, (_, i) => ({
      title: `${i + 1}`,
      dataIndex: `day${i + 1}`,
      key: `day${i + 1}`,
      width: 60,
      align: 'center',
      render: (text) => text || '',
      // sorter: (a, b) => {
      //   const aVal = a[`day${i + 1}`] || ''
      //   const bVal = b[`day${i + 1}`] || ''
      //   return aVal.localeCompare(bVal)
      // }
    }))
  ]
  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/attendance/monthly')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Monthly Attendance Report`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Monthly Attendance Report
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              layout="inline"
              onFinish={handleFilterChange}
              style={{ marginBottom: 16 }}
              initialValues={{
                month: dayjs(),
                location: 'All Locations',
                department: 'All Departments'
              }}
            >
              <Form.Item name="month" label="Month">
                <DatePicker picker="month"
                  style={{ width: 180 }}
                  allowClear={false} />
              </Form.Item>
              <Form.Item name="location" label="Location" className='filter-item'>
                <Select
                  placeholder="All Locations"
                  style={{ width: 180 }}
                  loading={locationsLoading}
                >
                  {locationOptions.map(location => (
                    <Select.Option key={location.id} value={location.name}>
                      {location.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="department" label="Department">
                <Select placeholder="All Departments" style={{ width: 150 }} loading={userTypesLoading}>
                  {userTypeOptions.map(userType => (
                    <Select.Option key={userType.id} value={userType.name}>
                      {userType.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item>
                <Space>
                  <AntButton 
                    type="primary" 
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                    loading={queryLoading}
                  >
                    Search
                  </AntButton>
                  <AntButton onClick={handleResetFilters}>
                    Reset
                  </AntButton>
                </Space>
              </Form.Item>
              {/* <Form.Item>
                <Space>
                  <AntButton
                    type="default"
                    icon={<FileExcelOutlined />}
                    onClick={handleExportExcel}
                    disabled={reports.length === 0}
                    style={{ backgroundColor: '#52c41a', color: '#fff', borderColor: '#52c41a' }}
                  >
                  </AntButton>
                  <AntButton
                    type="default"
                    icon={<FilePdfOutlined />}
                    onClick={handleExportPDF}
                    disabled={reports.length === 0}
                    style={{ backgroundColor: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' }}
                  >
                  </AntButton>
                </Space>
              </Form.Item> */}
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {queryLoading ? (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>Loading report...</Typography>
              </Box>
            ) : apiError ? (
              <Empty
                description={apiError}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : reports.length === 0 ? (
              <Empty
                description="No attendance records found for the selected period"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <>
              <Box
                sx={{
                  mb: 2,
                  pb: 2,
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
              {/* Left content */}
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ fontSize: '1.2rem' }}
              >
                Overall Employee Count:{' '}
                <span style={{ color: '#1890ff' }}>{reports.length}</span>
                {' | '} 
                Total Duty:{' '}
                <span style={{ color: '#52c41a' }}>
                  {reports.reduce((sum, report) => sum + report.totalDuty, 0)}
                </span>
              </Typography>

                {/* Right buttons */}
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

              <Table
                dataSource={filteredReports}
                columns={columns}
                rowKey="id"
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} records`
                }}
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
