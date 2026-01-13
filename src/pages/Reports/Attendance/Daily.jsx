import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Empty, message } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import './Daily.css'

export default function DailyAttendanceReport() {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState({ excel: false, pdf: false })
  const [reports, setReports] = useState([])
  const [filters, setFilters] = useState({
    date: dayjs(), // Default to today
    location: undefined,
    type: 'All'
  })
  const [form] = Form.useForm()

  // Fetch locations from API using custom hook
  const { locations, loading: locationsLoading } = useGetLocationList()
  const statusTypes = ['All', 'Present', 'Absent', 'Late']

  // Load initial data on mount
  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getDailyAttendanceReport(filters)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Error loading daily attendance report:', error)
      message.error('Failed to load attendance report')
    } finally {
      setLoading(false)
    }
  }

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
    // Get current form values
    const formValues = form.getFieldsValue()
    const searchFilters = {
      date: formValues.date || dayjs(),
      location: formValues.location || undefined,
      type: formValues.type || 'All'
    }
    setFilters(searchFilters)
    
    // Load reports with new filters
    try {
      setLoading(true)
      const response = await mockApi.getDailyAttendanceReport(searchFilters)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Error loading daily attendance report:', error)
      message.error('Failed to load attendance report')
    } finally {
      setLoading(false)
    }
  }

  const handleResetFilters = async () => {
    const defaultFilters = {
      date: dayjs(),
      location: undefined,
      type: 'All'
    }
    form.setFieldsValue({
      date: defaultFilters.date,
      location: undefined,
      type: 'All'
    })
    setFilters(defaultFilters)
    
    // Load reports with default filters
    try {
      setLoading(true)
      const response = await mockApi.getDailyAttendanceReport(defaultFilters)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Error loading daily attendance report:', error)
      message.error('Failed to load attendance report')
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
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 130,
      fixed: 'left'
    },
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 180
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 120
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
      key: 'shift',
      width: 100
    },
    {
      title: 'In Time',
      dataIndex: 'inTime',
      key: 'inTime',
      width: 100,
      render: (text) => text && text !== '-' ? text : '-'
    },
    {
      title: 'Out Time',
      dataIndex: 'outTime',
      key: 'outTime',
      width: 100,
      render: (text) => text && text !== '-' ? text : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colorMap = {
          'Present': 'green',
          'Absent': 'red',
          'Late': 'orange',
          'On Leave': 'blue'
        }
        return (
          <span style={{ 
            color: colorMap[status] || '#666',
            fontWeight: 500
          }}>
            {status}
          </span>
        )
      }
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
                location: undefined,
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
                  allowClear
                  loading={locationsLoading}
                  onChange={(value) => handleFilterChange('location', value)}
                >
                  {locations.map(location => (
                    <Select.Option key={location} value={location}>
                      {location}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="type" label="Type" className="filter-item">
                <Select
                  style={{ width: 150 }}
                  onChange={(value) => handleFilterChange('type', value)}
                >
                  {statusTypes.map(type => (
                    <Select.Option key={type} value={type}>
                      {type}
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
