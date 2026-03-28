import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Empty, message, Input, Skeleton, Col, Row } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useGetDailyLocationReportQuery } from '../../../store/api/reports.api'
import { useAuth } from '../../../context/AuthContext'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'

export default function DailyAttendanceReport() {
  const [loading, setLoading] = useState(false)
  const [shouldFetch, setShouldFetch] = useState(false)
  const [searchNonce, setSearchNonce] = useState(0)
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
    { id: -1, name: 'All' },
    ...(Array.isArray(userTypes) && userTypes.length > 0 ? userTypes.map(ut => ({
      id: ut?.id,
      name: ut?.name || 'Unknown'
    })) : [])
  ]

  const formValues = Form.useWatch([], form)

  const selectedDate = filters.date || dayjs()
  const selectedLocationName = filters.location || 'All Locations'
  const selectedUserTypeName = filters.type || 'All'

  const clientId = user?.client?.id || user?.clientId

  let locationId = null
  if (selectedLocationName === 'All Locations') {

    if (locationOptions.length > 0) {
      locationId = locationOptions
        .filter(loc => loc.id !== -1)
        .map(loc => loc.id)
        .join(',')
    }
  } else if (selectedLocationName) {
    const selectedLocation = locationOptions.find(loc => loc.name === selectedLocationName)
    if (selectedLocation) {
      locationId = selectedLocation.id
    }
  }

  let userTypeId = -1
  if (selectedUserTypeName && selectedUserTypeName !== 'All') {
    const selectedUserType = userTypeOptions.find(ut => ut.name === selectedUserTypeName)
    if (selectedUserType) {
      userTypeId = selectedUserType.id
    }
  }

  const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD')

  const { data: response, isLoading: isInitialLoading, isFetching } = useGetDailyLocationReportQuery(
    {
      date: formattedDate,
      locationId: locationId,
      userTypeId: userTypeId,
      clientId: clientId,
      searchNonce,
    },
    { skip: !clientId || !shouldFetch }
  )
  const queryLoading = isInitialLoading || isFetching


  useEffect(() => {
    if (shouldFetch) {
      console.log('API Request Triggered:', {
        shouldFetch,
        filters,
        clientId,
        queryLoading,
        response
      })
    }
  }, [shouldFetch, filters, clientId, queryLoading, response])

  useEffect(() => {
    if (queryLoading) return

    if (response?.success && Array.isArray(response.data)) {
      const mappedReports = response.data.map((item, index) => ({
        id: item.id ?? `${item.employeeCode}-${index}`, 
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
    setSearchNonce((prev) => prev + 1)
    setFilters({
      date: formValues?.date || filters.date || dayjs(),
      location: formValues?.location || filters.location || 'All Locations',
      type: formValues?.type || filters.type || 'All',
    })
    setShouldFetch(true)
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
        columns,
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
        {/* <Typography variant="h4" gutterBottom fontWeight="bold" className="page-title">
          Daily Attendance Report
        </Typography> */}

        <Card className="filter-card" sx={{ mb: 3 }}>
          <CardContent className="filter-content">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                date: dayjs(),
                location: 'All Locations',
                type: 'All',
              }}
              className="filter-form"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="date" label="Date" className="filter-item">
                    <DatePicker
                      format="MMM DD, YYYY"
                      style={{ width: '100%' }}
                      allowClear={false}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="location" label="Location" className="filter-item">
                    <Select
                      placeholder="All Locations"
                      style={{ width: '100%' }}
                      loading={locationsLoading}
                    >
                      {locationOptions.map((location) => (
                        <Select.Option key={location.id} value={location.name}>
                          {location.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="type" label="Type" className="filter-item">
                    <Select
                      style={{ width: '100%' }}
                      loading={userTypesLoading}
                    >
                      {userTypeOptions.map((type) => (
                        <Select.Option key={type.id || 'all'} value={type.name}>
                          {type.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6} style={{ display: 'flex', alignItems: 'center' }}>
                  <Form.Item style={{ marginBottom: 0 }} className="filter-item">
                    <Space wrap>
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
                </Col>
              </Row>
            </Form>
          </CardContent>
        </Card>

        {/* Table Section */}
        <Card>
          <CardContent>

            {!shouldFetch ? (
              <Empty description="Please apply filters to view the report" />
            ) :
              queryLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <Skeleton active paragraph={{ rows: 8 }} />
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
                      // style={{ backgroundColor: '#52c41a', color: '#fff', borderColor: '#52c41a' }}
                      >Export Excel
                      </AntButton>
                      <AntButton
                        type="default"
                        icon={<FilePdfOutlined />}
                        onClick={handleExportPDF}
                        disabled={reports.length === 0}
                      // style={{ backgroundColor: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' }}
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
