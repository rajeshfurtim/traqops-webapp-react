import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Input, message, Spin,Empty } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'
import { useAuth } from '../../../context/AuthContext'
import { useGetConsolidateManpowerReportQuery } from '../../../store/api/reports.api'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'


const { RangePicker } = DatePicker

export default function ConsolidatedManpowerReport() {
  const [form] = Form.useForm()
  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId
  const [shouldFetch, setShouldFetch] = useState(false)
  const [filters, setFilters] = useState({
    fromDate: null,
    toDate: null,
    userTypeId: null,
  })
  const [searchText, setSearchText] = useState('') // search input state

  const { userTypes, loading: userTypesLoading } = useGetAllUserType()

  // Initial load
  useEffect(() => {
    const today = dayjs()
    form.setFieldsValue({
      dateRange: [today, today],
      type: 261586,
    })
    // setFilters({
    //   fromDate: today.format('YYYY-MM-DD'),
    //   toDate: today.format('YYYY-MM-DD'),
    //   userTypeId: 261586,
    // })
  }, [])

  // Apply filters
  const handleFilterChange = values => {
    const [from, to] = values.dateRange || []
    setFilters({
      fromDate: from?.format('YYYY-MM-DD'),
      toDate: to?.format('YYYY-MM-DD'),
      userTypeId: values.type,
    })
    setShouldFetch(true)
  }

  // API Call
  const { data: response, isLoading: isInitialLoading, isFetching} =
    useGetConsolidateManpowerReportQuery(
      { ...filters, clientId },
      { skip: !clientId || !filters.fromDate || !filters.toDate }
    )

  const queryLoading = isInitialLoading || isFetching

  // Build table rows
 const reports = useMemo(() => {
  if (queryLoading) return []
  if (!response?.data || !Array.isArray(response.data)) return []

  return response.data.map(item => {
    const row = { id: item.locationId, location: item.locationName, totalDuties: 0 }

    Object.entries(item.counts || {}).forEach(([date, count]) => {
      row[date] = count
      row.totalDuties += count
    })

    return row
  })
}, [response, queryLoading])

  // Build date columns
  const dateColumns = useMemo(() => {
    if (!filters.fromDate || !filters.toDate) return []

    const start = dayjs(filters.fromDate)
    const end = dayjs(filters.toDate)
    const cols = []
    let current = start

    while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
      const fullDate = current.format('YYYY-MM-DD')
      cols.push({
        title: current.format('DD'),
        dataIndex: fullDate,
        key: fullDate,
        align: 'center',
        width: 60,
        render: v => v ?? 0,
      })
      current = current.add(1, 'day')
    }
    return cols
  }, [filters])

  // Build total row
  const reportsWithTotal = useMemo(() => {
    if (!reports.length) return []

    const totalRow = { id: 'total', location: 'Total', totalDuties: 0 }
    dateColumns.forEach(col => (totalRow[col.dataIndex] = 0))

    reports.forEach(row => {
      totalRow.totalDuties += row.totalDuties || 0
      dateColumns.forEach(col => {
        totalRow[col.dataIndex] += row[col.dataIndex] || 0
      })
    })

    return [...reports, totalRow]
  }, [reports, dateColumns])

  // Filtered by search
  const filteredReports = useMemo(() => {
    if (!searchText) return reportsWithTotal
    const lowerText = searchText.toLowerCase()
    return reportsWithTotal.filter(
      r => r.location?.toLowerCase().includes(lowerText) || r.id === 'total'
    )
  }, [reportsWithTotal, searchText])

  // Columns
  const columns = [
    { title: 'Location', dataIndex: 'location', width: 250, fixed: 'left' },
    { title: 'Total Duty', dataIndex: 'totalDuties', width: 120, align: 'center', fixed: 'left' },
    ...dateColumns,
  ]

  const [exporting, setExporting] = useState({ excel: false, pdf: false })
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

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/attendance/consolidated-manpower')}</title>
        <meta
          name="description"
          content={`${APP_CONFIG.name} - Consolidated Manpower Report`}
        />
      </Helmet>

      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Consolidated Manpower Report
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form form={form} layout="inline" onFinish={handleFilterChange}>
              <Form.Item name="dateRange" label="Date Range">
                <RangePicker
                  format="DD-MM-YYYY"
                  allowClear={false}
                  disabledDate={d => d && d > dayjs().endOf('day')}
                />
              </Form.Item>

              <Form.Item name="type" label="Type" style={{ width: 250 }}>
                <Select loading={userTypesLoading}>
                  {userTypes?.map(type => (
                    <Select.Option key={type.id} value={type.id}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <AntButton type="primary" htmlType="submit" loading={queryLoading}>
                  Apply Filters
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

        {/* Table */}
        <Card>
          <CardContent>
            {!shouldFetch ? (
              <Empty description="Please apply filters to view the report" />
            ) :
              queryLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <Spin />
                </Box>
              ) : (
              <>
                <Box display="flex" justifyContent="space-between" mb={2} alignItems="center">
                  <Typography fontWeight="bold">
                    Total Duty:{' '}
                    <span style={{ color: '#52c41a' }}>
                      {reportsWithTotal.find(r => r.id === 'total')?.totalDuties || 0}
                    </span>
                  </Typography>
                  
                  {/* Export buttons */}
                    <Space style={{ marginLeft: 'auto' }} size={12}>
                  <Input
                    // placeholder="Search Location"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                    style={{ width: 250 }}
                    className="custom-search-input"
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
                  rowKey="id"
                  dataSource={filteredReports}
                  columns={columns}
                  pagination={{ pageSize: 20 }}
                  scroll={{ x: 'max-content' }}
                  size="small"
                  bordered
                  rowClassName={record => (record.id === 'total' ? 'ant-table-row-total' : '')}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      <style>{`
        .ant-table-row-total {
          font-weight: bold;
          background: #fafafa;
        }
      `}</style>
    </>
  )
}
