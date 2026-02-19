import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton,Empty, Row, Col, Input,Spin } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useAuth } from '../../../context/AuthContext'
import { useGetMonthlyEmployeeReportQuery } from '../../../store/api/reports.api'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'

export default function TimesheetReport() {
  const [shouldFetch, setShouldFetch] = useState(false)
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

  const typeOptions = [
    { id: -1, name: 'All User Types' },
    ...(Array.isArray(userTypes) && userTypes.length > 0 ? userTypes.map(user => ({
      id: user?.id,
      name: user?.name || 'Unknown'
    })) : [])
  ]

  const locationOptions = [
    { id: -1, name: 'All Locations' },
    ...(Array.isArray(locations) && locations.length > 0 ? locations.map(loc => ({
      id: loc?.id,
      name: loc?.name || 'Unknown'
    })) : [])
  ]

  const locationIds = Array.isArray(locations)
    ? locations.map(loc => loc?.id).filter(Boolean)
    : []

  useEffect(() => {
    form.setFieldsValue({
      month: dayjs(),
      location: -1,
      type: -1
    })
  }, [])

  const handleFilterChange = (values) => {
    setReports([])
    console.log('Filter values:', values)
    const newFilters = {}
    if (values.month) {
      newFilters.fromDate = values.month.startOf('month').format('YYYY-MM-DD')
      newFilters.toDate = values.month.endOf('month').format('YYYY-MM-DD')
    }
    if (values.location == -1) {
      newFilters.locationId = locationIds
    } else {
      newFilters.locationId = values.location
    }
    if (values.type) newFilters.userTypeId = values.type
    console.log('Applied Filters:', newFilters)
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }))
    setShouldFetch(true)
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
      r.location?.toLowerCase().includes(lowerSearch)
    )
  }, [reports, searchText])


  const { data: response, isLoading: queryLoading } = useGetMonthlyEmployeeReportQuery(
    {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      locationId: filters.locationId,
      userTypeId: filters.userTypeId,
      clientId,
    },
    { skip: !clientId || !filters.fromDate || !filters.toDate }
  )

  //  const transformReportRow = (item) => {
  //   const dayMap = {}

  //   item.monthWiseShift?.forEach(shift => {
  //     if (!shift?.createdAt || !shift?.inTime || !shift?.outTime) return

  //     const day = dayjs(shift.createdAt).date()

  //     if (!dayMap[day]) {
  //       dayMap[day] = []
  //     }

  //     dayMap[day].push(
  //       `In:${shift.inTime} Out:${shift.outTime}`
  //     )
  //   })

  //   // Convert array → multiline string
  //   Object.keys(dayMap).forEach(day => {
  //     dayMap[day] = dayMap[day].join('\n')
  //   })

  //   return {
  //     id: item.employeeCode,
  //     employeeId: item.employeeCode,
  //     employeeName: item.userName,
  //     userType: item.userTypeName,
  //     location: item.locationName,
  //     totalDuties: item.monthWiseShift?.length || 0,
  //     ...dayMap,
  //   }
  // }       

  // const transformReportRow = (item) => {
  //   const dayMap = {}

  //   item.monthWiseShift?.forEach(shift => {
  //     if (!shift?.createdAt || !shift?.inTime || !shift?.outTime) return

  //     const day = String(dayjs(shift.createdAt).date())

  //     if (!dayMap[day]) {
  //       dayMap[day] = []
  //     }

  //     dayMap[day].push({
  //       inTime: shift.inTime,
  //       outTime: shift.outTime,
  //     })
  //   })

  //   return {
  //     key: `${item.employeeCode}-${filters.fromDate}-${index}`, // ✅ UNIQUE
  //     id: item.employeeCode,
  //     employeeId: item.employeeCode,
  //     employeeName: item.userName,
  //     userType: item.userTypeName,
  //     location: item.locationName,
  //     totalDuties: item.monthWiseShift?.length || 0,
  //     shifts: dayMap,
  //   }
  // }

  const transformReportRow = (item, index) => {
    const dayMap = {}

    item.monthWiseShift?.forEach(shift => {
      if (!shift?.createdAt || !shift?.inTime || !shift?.outTime) return

      const day = String(dayjs(shift.createdAt).date())

      if (!dayMap[day]) dayMap[day] = []

      dayMap[day].push({
        inTime: shift.inTime,
        outTime: shift.outTime,
      })
    })

    return {
      key: `${item.employeeCode}-${filters.fromDate}-${index}`, // ✅ UNIQUE
      employeeId: item.employeeCode,
      employeeName: item.userName,
      userType: item.userTypeName,
      location: item.locationName,
      totalDuties: item.monthWiseShift?.length || 0,
      shifts: dayMap,
    }
  }


  useEffect(() => {
    if(queryLoading) return
    if (response?.success && Array.isArray(response.data)) {
      const formatted = response.data.map(transformReportRow)
      setReports(formatted)
    } else {
      setReports([])
    }
  }, [response,queryLoading])

  // const getDateColumns = () => {
  //   if (!filters.fromDate || !filters.toDate) return []

  //   const start = dayjs(filters.fromDate)
  //   const end = dayjs(filters.toDate)

  //   const columns = []
  //   let current = start

  //   while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
  //     const day = current.date()

  //     columns.push({
  //       title: day,
  //       dataIndex: day,
  //       key: day,
  //       width: 120,
  //       align: 'center',
  //       children: [
  //           {
  //             title: 'IN',
  //             width: 100,
  //           },{
  //             title: 'OUT',
  //             width: 100,
  //       }],
  //       render: (text) => (
  //     <div style={{ whiteSpace: 'pre-line'}}>
  //       {text}
  //     </div>
  //   ),
  //     })

  //     current = current.add(1, 'day')
  //   }

  //   return columns
  // }

  const getDateColumns = () => {
    if (!filters.fromDate || !filters.toDate) return []

    const start = dayjs(filters.fromDate)
    const end = dayjs(filters.toDate)

    const columns = []
    let current = start

    while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
      const day = current.date()
      const dayKey = String(day)

      columns.push({
        title: day,
        key: dayKey,
        children: [
          {
            title: 'IN',
            key: `${dayKey}-in`,
            width: 100,
            align: 'center',
            fontWeight: 'bold',
            render: (_, record) => {
              const dayShifts = record.shifts?.[dayKey] || []
              if (dayShifts.length === 0) return null

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {dayShifts.map((shift, idx) => (
                    <div
                      key={`in-${dayKey}-${idx}`}
                      style={{
                        padding: '2px 6px',
                        textAlign: 'center',
                        fontSize: 16,
                        minWidth: 50,
                        userSelect: 'none',
                      }}
                      title={`In Time: ${shift.inTime}`}
                    >
                      {shift.inTime}
                    </div>
                  ))}

                </div>
              )
            },
          },
          {
            title: 'OUT',
            key: `${dayKey}-out`,
            width: 100,
            align: 'center',
            fontWeight: 'bold',
            render: (_, record) => {
              const dayShifts = record.shifts?.[dayKey] || []
              if (dayShifts.length === 0) return null

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {dayShifts.map((shift, idx) => (
                    <div
                      key={`out-${dayKey}-${idx}`}
                      style={{
                        padding: '2px 6px',
                        textAlign: 'center',
                        fontSize: 16,
                        minWidth: 50,
                        userSelect: 'none',
                      }}
                      title={`Out Time: ${shift.outTime}`}
                    >
                      {shift.outTime}
                    </div>
                  ))}

                </div>
              )
            },
          },
        ],
      })

      current = current.add(1, 'day')
    }

    return columns
  }




  // const getDateColumns = () => {
  //   if (!filters.fromDate || !filters.toDate) return []

  //   const start = dayjs(filters.fromDate)
  //   const end = dayjs(filters.toDate)

  //   const columns = []
  //   let current = start

  //   while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
  //     const day = current.date()

  //     columns.push({
  //       title: day,
  //       dataIndex: day,
  //       key: day,
  //       width: 240,
  //       align: 'center',
  //       render: (text) => {
  //         if (!text) return null

  //         // Split multiline string into individual shifts
  //         const shifts = text.split('\n')

  //         return (
  //           <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
  //             {shifts.map((shiftStr, idx) => {
  //               const [inPart, outPart] = shiftStr.split(' Out:')
  //               return (
  //                 <div key={idx} style={{
  //                   display: 'flex',
  //                   borderRadius: 25,
  //                   overflow: 'hidden',
  //                   boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  //                   width: '220px',
  //                   fontSize: 16,
  //                 }}>
  //                   <div style={{
  //                     flex: 1,
  //                     backgroundColor: '#4CAF50',
  //                     color: '#fff',
  //                     textAlign: 'center',
  //                     padding: '2px 4px',
  //                     borderTopLeftRadius: 25,
  //                     borderBottomLeftRadius: 25,
  //                   }}>
  //                     {inPart.toUpperCase()}
  //                   </div>
  //                   <div style={{
  //                     flex: 1,
  //                     backgroundColor: '#FF5722',
  //                     color: '#fff',
  //                     textAlign: 'center',
  //                     padding: '2px 4px',
  //                     borderTopRightRadius: 25,
  //                     borderBottomRightRadius: 25,
  //                   }}>
  //                     OUT:{outPart}
  //                   </div>
  //                 </div>
  //               )
  //             })}
  //           </div>
  //         )
  //       }
  //     })

  //     current = current.add(1, 'day')
  //   }

  //   return columns
  // }


  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
      fixed: 'left',
      width: 120,
    },
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      fixed: 'left',
      width: 200,
      sorter: (a, b) => a.employeeName.localeCompare(b.employeeName),
    },
    {
      title: 'User Type',
      dataIndex: 'userType',
      key: 'userType',
      width: 120,
      sorter: (a, b) => a.userType.localeCompare(b.userType),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      sorter: (a, b) => a.location.localeCompare(b.location),
    },
    {
      title: 'Total Duties',
      dataIndex: 'totalDuties',
      key: 'totalDuties',
      width: 120,
      align: 'center',
      sorter: (a, b) => (a.totalDuties || 0) - (b.totalDuties || 0),
    },
    ...getDateColumns(),
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

  const handleResetFilters = () => {
    const currentmonth = dayjs()
    setShouldFetch(false)
    setReports([])
    form.setFieldsValue({
      month: currentmonth,
      location: -1,
      type: -1
    })

  }

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/attendance/timesheet')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Monthly Attendance Timesheet Report`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Monthly Attendance Timesheet Report
        </Typography>

        <Card className='filter-card' sx={{ mb: 3 }}>
          <CardContent className='filter-content'>
            <Form
              form={form}
              onFinish={handleFilterChange}
              layout="inline"
            >
              <Form.Item name="month" label="Month">
                <DatePicker picker="month" format="MMMM,YYYY" style={{ width: 180 }}
                  disabledDate={(current) =>
                    current && current > dayjs().endOf('month')
                  }
                />
              </Form.Item>

              <Form.Item name="location" label="Location">
                <Select loading={locationsLoading} style={{ width: 180 }}>
                  {locationOptions.map(loc => (
                    <Select.Option key={loc.id} value={loc.id}>
                      {loc.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="type" label="Type">
                <Select loading={userTypesLoading} style={{ width: 180 }}>
                  {typeOptions.map(type => (
                    <Select.Option key={type.id} value={type.id}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item className='filter-item'>
                <Space>
                  <AntButton type="primary" 
                  htmlType="submit"  
                  icon={<SearchOutlined />}
                  loading={queryLoading}>
                    Search
                  </AntButton>
                  <AntButton
                    onClick={handleResetFilters}
                  >
                    Reset
                  </AntButton>
                </Space>
              </Form.Item>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>

            {!shouldFetch ? (
              <Empty description="Click Search to view data" />
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

