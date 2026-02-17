import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Empty, message, Input } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useGetDailyLocationReportQuery } from '../../../store/api/reports.api'
import { useAuth } from '../../../context/AuthContext'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'
// import './Daily.css'

export default function DailyAttendanceReport() {
  const [loading, setLoading] = useState(false)
  const [shouldFetch, setShouldFetch] = useState(false)
  const [searchTriggered, setSearchTriggered] = useState(false)
  const [exporting, setExporting] = useState({ excel: false, pdf: false })
  const [reports, setReports] = useState([])
  const [filters, setFilters] = useState({
    date: dayjs(), // Default to today
    location: undefined,
    type: 'All'
  })
  const [form] = Form.useForm()
  const { user } = useAuth()

  // Fetch locations from API using custom hook
  const { locations, loading: locationsLoading } = useGetLocationList()
  // Fetch user types from API using custom hook
  const { userTypes, loading: userTypesLoading } = useGetAllUserType()

  // Create location options with name for display, add 'All Locations' option
  const locationOptions = [
    { id: -1, name: 'All Locations' },
    ...(Array.isArray(locations) && locations.length > 0 ? locations.map(loc => ({
      id: loc?.id,
      name: loc?.name || 'Unknown'
    })) : [])
  ]

  // Create user type options with name for display, add 'All' option
  const userTypeOptions = [
    { id: -1, name: 'All' },
    ...(Array.isArray(userTypes) && userTypes.length > 0 ? userTypes.map(ut => ({
      id: ut?.id,
      name: ut?.name || 'Unknown'
    })) : [])
  ]


  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters }
    if (field === 'date') {
      newFilters.date = value
    } else if (field === 'location') {
      newFilters.location = value || undefined
    } else if (field === 'type') {
      newFilters.type = value
    }
    setFilters(newFilters)
  }

  // Get current form values for RTK Query
  const formValues = Form.useWatch([], form)
  const selectedDate = formValues?.date || filters.date || dayjs()
  const selectedLocationName = formValues?.location || filters.location || 'All Locations'
  const selectedUserTypeName = formValues?.type || filters.type || 'All'

  // Get clientId from user context
  const clientId = user?.client?.id || user?.clientId

  // Find locationId(s) from selected location name
  let locationId = null
  if (selectedLocationName === 'All Locations') {

    // Send all location IDs as comma-separated string when "All Locations" is selected
    if (locationOptions.length > 0) {
      locationId = locationOptions
        .filter(loc => loc.id !== -1) // Exclude the "All Locations" option itself
        .map(loc => loc.id)
        .join(',')
    }
  } else if (selectedLocationName) {
    const selectedLocation = locationOptions.find(loc => loc.name === selectedLocationName)
    if (selectedLocation) {
      locationId = selectedLocation.id
    }
  }

  // Find userTypeId from selected user type name
  let userTypeId = -1
  if (selectedUserTypeName && selectedUserTypeName !== 'All') {
    const selectedUserType = userTypeOptions.find(ut => ut.name === selectedUserTypeName)
    if (selectedUserType) {
      userTypeId = selectedUserType.id
    }
  }

  // Format date as YYYY-MM-DD
  const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD')

  // RTK Query hook
  const { data: response, isLoading: queryLoading, error: queryError,  } = useGetDailyLocationReportQuery(
    {
      date: formattedDate,
      locationId: locationId,
      userTypeId: userTypeId,
      clientId: clientId,
    },
    { skip: !clientId || !shouldFetch }
  )

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

  // Process response data
  // useEffect(() => {
  //   if (!queryLoading && response?.success && response.data && Array.isArray(response.data)) {
  //     const mappedReports = response.data.map((item, index) => ({
  //       id: item.id || index,
  //       serialNo: index + 1,
  //       date: item.createAt || formattedDate,
  //       employeeName: item.userName || '-',
  //       employeeId: item.employeeCode || '-',
  //       location: item.locationName || '-',
  //       userType: item.userTypeName || '-',
  //       shift: item.shiftName || '-',
  //       punchIn: item.inTime || '-',
  //       punchOut: item.outTime || '-'
  //     }))

  //     setReports(mappedReports)
  //     setFilters({
  //       date: selectedDate,
  //       location: selectedLocationName,
  //       type: selectedUserTypeName
  //     })
  //   } else if (!queryLoading && response && !response.success) {
  //     message.error(response.message || 'Failed to load daily location report')
  //     setReports([])
  //   }
  // }, [response, queryLoading, formattedDate, selectedDate, selectedLocationName, selectedUserTypeName])


  useEffect(() => {
  if (queryLoading) return

  if (response?.success && Array.isArray(response.data)) {
    const mappedReports = response.data.map((item, index) => ({
      id: item.id ?? `${item.employeeCode}-${index}`, // safer unique key
      serialNo: index + 1,
      date: item.createAt || formattedDate,
      employeeName: item.userName || '-',
      employeeId: item.employeeCode || '-',
      location: item.locationName || '-',
      userType: item.userTypeName || '-',
      shift: item.shiftName || '-',
      punchIn: item.inTime || '-',
      punchOut: item.outTime || '-'
    }))

    setReports(mappedReports)
  } else if (response && !response.success) {
    message.error(response.message || 'Failed to load daily location report')
    setReports([])
  }
}, [response, queryLoading, formattedDate])

  const handleSearch = () => {
    if (!clientId) {
      message.error('Client ID not found. Please login again.')
      return
    }
    setShouldFetch(true)
    // refetch()
    // form.submit()
  }

  const handleResetFilters = () => {
    const currentDate = dayjs()
    setShouldFetch(false)
    setReports([])
    form.setFieldsValue({
      date: currentDate,
      location: 'All Locations',
      type: 'All'
    })

  }

  const handleExportExcel = async () => {
    try {
      setExporting(prev => ({ ...prev, excel: true }))

      await exportToExcel(
        columns,
        filteredReports,
        `daily-attendance-${dayjs(filters.date).format('YYYY-MM-DD')}`
      )

      message.success('Excel exported successfully')
    } catch (err) {
      message.error('Excel export failed')
    } finally {
      setExporting(prev => ({ ...prev, excel: false }))
    }
  }


  const handleExportPDF = async () => {
    try {
      setExporting(prev => ({ ...prev, pdf: true }))

      await exportToPDF(
        columns,            // ✅ same column order
        filteredReports,
        `daily-attendance-${dayjs(filters.date).format('YYYY-MM-DD')}`
      )

      message.success('PDF exported successfully')
    } catch (err) {
      message.error('PDF export failed')
    } finally {
      setExporting(prev => ({ ...prev, pdf: false }))
    }
  }

  //filter
  const [searchText, setSearchText] = useState('')
  const filteredReports = useMemo(() => {
    if (!searchText) return reports
    const lowerSearch = searchText.trim().toLowerCase()
    return reports.filter(r =>
      r.employeeId?.toLowerCase().includes(lowerSearch) ||
      r.employeeName?.toLowerCase().includes(lowerSearch) ||
      r.userType?.toLowerCase().includes(lowerSearch) ||
      r.location?.toLowerCase().includes(lowerSearch) ||
      r.shift?.toLowerCase().includes(lowerSearch)
    )
  }, [reports, searchText])


  const columns = [
    {
      title: 'S.No',
      dataIndex: 'serialNo',
      key: 'serialNo',
      width: 80,
      fixed: 'left',
      align: 'center'
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120
    },
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 180
    },
    {
      title: 'Employee Id',
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 130
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 150
    },
    {
      title: 'UserType',
      dataIndex: 'userType',
      key: 'userType',
      width: 150
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
      key: 'shift',
      width: 120
    },
    {
      title: 'Punch In',
      dataIndex: 'punchIn',
      key: 'punchIn',
      width: 120,
      render: (text) => text && text !== '-' ? text : '-'
    },
    {
      title: 'Punch Out',
      dataIndex: 'punchOut',
      key: 'punchOut',
      width: 120,
      render: (text) => text && text !== '-' ? text : '-'
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/attendance/daily')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Daily Attendance Report`} />
      </Helmet>
      <Box className="daily-attendance-page">
        <Typography variant="h4" gutterBottom fontWeight="bold" className="page-title">
          Daily Attendance Report
        </Typography>

        {/* Filter Section */}
        <Card className="filter-card" sx={{ mb: 3 }}>
          <CardContent className="filter-content">
            <Form
              form={form}
              layout="inline"
              initialValues={{
                date: dayjs(),
                location: 'All Locations',
                type: 'All'
              }}
              // onFinish= {handleFilterChange}
              className="filter-form"
            >
              <Form.Item name="date" label="Date" className="filter-item">
                <DatePicker
                  format="MMM DD, YYYY"
                  style={{ width: 180 }}
                  // onChange={(date) => handleFilterChange('date', date)}
                  allowClear={false}
                />
              </Form.Item>

              <Form.Item name="location" label="Location" className="filter-item">
                <Select
                  placeholder="All Locations"
                  style={{ width: 180 }}
                  loading={locationsLoading}
                  // onChange={(value) => handleFilterChange('location', value)}
                >
                  {locationOptions.map(location => (
                    <Select.Option key={location.id} value={location.name}>
                      {location.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="type" label="Type" className="filter-item">
                <Select
                  style={{ width: 150 }}
                  loading={userTypesLoading}
                  // onChange={(value) => handleFilterChange('type', value)}
                >
                  {userTypeOptions.map(type => (
                    <Select.Option key={type.id || 'all'} value={type.name}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item className="filter-item">
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
            </Form>
          </CardContent>
        </Card>

        {/* Table Section */}
        <Card>
          <CardContent>

            {!shouldFetch ? (
              <Empty description="Click Search to view data" />
            ) :
            queryLoading ? (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" p={4}>
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
                    alignItems: 'center'
                  }}>
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
