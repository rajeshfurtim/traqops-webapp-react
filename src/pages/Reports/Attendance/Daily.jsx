import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Empty, message } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { apiService } from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'
import './Daily.css'

export default function DailyAttendanceReport() {
  const [loading, setLoading] = useState(false)
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
  const locationOptions = [{ id: -1, name: 'All Locations' }, ...locations.map(loc => ({ id: loc.id, name: loc.name }))]
  // Create user type options with name for display, add 'All' option
  const userTypeOptions = [{ id: -1, name: 'All' }, ...userTypes.map(ut => ({ id: ut.id, name: ut.name }))]


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

  const handleSearch = async () => {
    try {
      setLoading(true)
      
      // Get current form values
      const formValues = form.getFieldsValue()
      const selectedDate = formValues.date || dayjs()
      const selectedLocationName = formValues.location
      const selectedUserTypeName = formValues.type || 'All'
      
      // Get clientId from user context
      const clientId = user?.client?.id || user?.clientId
      
      if (!clientId) {
        message.error('Client ID not found. Please login again.')
        setLoading(false)
        return
      }
      
      // Find locationId from selected location name
      // If "All Locations" is selected or nothing selected, pass -1
      let locationId = -1 // Default to -1 for "All Locations"
      if (selectedLocationName && selectedLocationName !== 'All Locations') {
        const selectedLocation = locationOptions.find(loc => loc.name === selectedLocationName)
        if (selectedLocation) {
          locationId = selectedLocation.id
        }
      }
      
      // Find userTypeId from selected user type name
      // If "All" is selected, pass -1, otherwise find the ID
      let userTypeId = -1 // Default to -1 for "All"
      if (selectedUserTypeName && selectedUserTypeName !== 'All') {
        const selectedUserType = userTypeOptions.find(ut => ut.name === selectedUserTypeName)
        if (selectedUserType) {
          userTypeId = selectedUserType.id
        }
      }
      
      // Format date as YYYY-MM-DD
      const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD')
      
      // Call the API
      const response = await apiService.getDailyLocationReport({
        date: formattedDate,
        locationId: locationId,
        userTypeId: userTypeId,
        clientId: clientId
      })
      
      if (response.success && response.data) {
        // Map API response to table format
        const mappedReports = response.data.map((item, index) => ({
          id: item.id || index,
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
        setFilters({
          date: selectedDate,
          location: selectedLocationName,
          type: selectedUserTypeName
        })
      } else {
        message.error(response.message || 'Failed to load daily location report')
        setReports([])
      }
    } catch (error) {
      console.error('Error loading daily location report:', error)
      message.error(error.message || 'Failed to load daily location report')
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const handleResetFilters = async () => {
    try {
      setLoading(true)
      
      // Reset form values
      const currentDate = dayjs()
      form.setFieldsValue({
        date: currentDate,
        location: 'All Locations',
        type: 'All'
      })
      
      // Get clientId from user context
      const clientId = user?.client?.id || user?.clientId
      
      if (!clientId) {
        message.error('Client ID not found. Please login again.')
        setLoading(false)
        return
      }
      
      // Format date as YYYY-MM-DD
      const formattedDate = currentDate.format('YYYY-MM-DD')
      
      // Call the API with reset parameters: locationId = -1, userTypeId = -1
      const response = await apiService.getDailyLocationReport({
        date: formattedDate,
        locationId: -1,
        userTypeId: -1,
        clientId: clientId
      })
      
      if (response.success && response.data) {
        // Map API response to table format
        const mappedReports = response.data.map((item, index) => ({
          id: item.id || index,
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
        setFilters({
          date: currentDate,
          location: undefined,
          type: 'All'
        })
      } else {
        message.error(response.message || 'Failed to load daily location report')
        setReports([])
      }
    } catch (error) {
      console.error('Error loading daily location report:', error)
      message.error(error.message || 'Failed to load daily location report')
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      setExporting(prev => ({ ...prev, excel: true }))
      await exportToExcel(reports, `daily-attendance-${dayjs(filters.date).format('YYYY-MM-DD')}`)
      message.success('Excel file exported successfully')
    } catch (error) {
      console.error('Error exporting Excel:', error)
      message.error('Failed to export Excel file')
    } finally {
      setExporting(prev => ({ ...prev, excel: false }))
    }
  }

  const handleExportPDF = async () => {
    try {
      setExporting(prev => ({ ...prev, pdf: true }))
      await exportToPDF(reports, `daily-attendance-${dayjs(filters.date).format('YYYY-MM-DD')}`)
      message.success('PDF file exported successfully')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      message.error('Failed to export PDF file')
    } finally {
      setExporting(prev => ({ ...prev, pdf: false }))
    }
  }

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
              className="filter-form"
            >
              <Form.Item name="date" label="Date" className="filter-item">
                <DatePicker
                  format="MMM DD, YYYY"
                  style={{ width: 180 }}
                  onChange={(date) => handleFilterChange('date', date)}
                  allowClear={false}
                />
              </Form.Item>

              <Form.Item name="location" label="Location" className="filter-item">
                <Select
                  placeholder="All Locations"
                  style={{ width: 180 }}
                  loading={locationsLoading}
                  onChange={(value) => handleFilterChange('location', value)}
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
                  onChange={(value) => handleFilterChange('type', value)}
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
                    loading={loading}
                  >
                    Search
                  </AntButton>
                  <AntButton onClick={handleResetFilters}>
                    Reset
                  </AntButton>
                </Space>
              </Form.Item>

              {/* Export Buttons */}
              <Form.Item className="export-buttons">
                <Space>
                  <AntButton
                    type="default"
                    icon={<FileExcelOutlined />}
                    onClick={handleExportExcel}
                    loading={exporting.excel}
                    disabled={reports.length === 0}
                  >
                    Excel
                  </AntButton>
                  <AntButton
                    type="default"
                    icon={<FilePdfOutlined />}
                    onClick={handleExportPDF}
                    loading={exporting.pdf}
                    disabled={reports.length === 0}
                  >
                    PDF
                  </AntButton>
                </Space>
              </Form.Item>
            </Form>
          </CardContent>
        </Card>

        {/* Table Section */}
        <Card>
          <CardContent>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : reports.length === 0 ? (
              <Empty
                description="No attendance records found for the selected filters"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table
                dataSource={reports}
                columns={columns}
                rowKey="id"
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} records`
                }}
                size="middle"
                scroll={{ x: 800 }}
                className="attendance-table"
              />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}
