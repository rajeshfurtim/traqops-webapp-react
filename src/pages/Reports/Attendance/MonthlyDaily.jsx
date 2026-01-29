import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Row, Col } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useAuth } from '../../../context/AuthContext'
import { useGetMonthlyEmployeeReportQuery } from '../../../store/api/reports.api'

export default function MonthlyDailyAttendanceReport() {

  const [form] = Form.useForm()
  const { user } = useAuth()
  const fromDate = Form.useWatch("fromDate", form);
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
        fromDate: dayjs(),
        toDate: dayjs(),
        location: -1,
        type: -1
      })
    }, [])

  const handleFilterChange = (values) => {
    console.log('Filter values:', values)
    const newFilters = {}
    
    if(values.fromDate) newFilters.fromDate = values.fromDate.format('YYYY-MM-DD')
    if(values.toDate) newFilters.toDate = values.toDate.format('YYYY-MM-DD') 
    if (values.location == -1){
         newFilters.locationId = locationIds
    }else{
         newFilters.locationId = values.location
    } 
    if (values.type) newFilters.userTypeId = values.type
    console.log('Applied Filters:', newFilters)
    setFilters(prev => ({
    ...prev,
    ...newFilters,
  }))
  }

  const { data: response, isLoading: queryLoading, isFetching } = useGetMonthlyEmployeeReportQuery(
        {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      locationId: filters.locationId,
      userTypeId: filters.userTypeId,
      clientId,
    },
        { skip: !clientId || !filters.fromDate || !filters.toDate }
      )

 const getShiftByTime = (inTime) => {
  const hour = Number(inTime.split(':')[0])

  if (hour >= 5 && hour < 8) return 'A'
  if (hour >= 8 && hour < 10) return 'G'
  if (hour >= 13 && hour < 15) return 'B'
  if (hour >= 21 && hour <= 23) return 'C'

  return 'P'
}

const transformReportRow = (item) => {
  const dayMap = {}

  item.monthWiseShift?.forEach(shift => {
    if (!shift?.createdAt || !shift?.inTime) return

    const day = dayjs(shift.createdAt).date()
    const shiftCode = getShiftByTime(shift.inTime)

    if (!shiftCode) return

    if (!dayMap[day]) {
      dayMap[day] = new Set()
    }
    dayMap[day].add(shiftCode)
  })

  // Convert Set → "A/B/C"
  Object.keys(dayMap).forEach(day => {
    dayMap[day] = Array.from(dayMap[day]).join('/')
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

useEffect(() => {
  if (response?.data && Array.isArray(response.data)) {
    const formatted = response.data.map(transformReportRow)
    setReports(formatted)
  } else {
    setReports([])
  }
}, [response])

const getDateColumns = () => {
  if (!filters.fromDate || !filters.toDate) return []

  const start = dayjs(filters.fromDate)
  const end = dayjs(filters.toDate)

  const columns = []
  let current = start

  while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
    const day = current.date()

    columns.push({
      title: day,
      dataIndex: day,
      key: day,
      width: 45,
      align: 'center',
    })

    current = current.add(1, 'day')
  }

  return columns
}

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
  },
  {
    title: 'User Type',
    dataIndex: 'userType',
    key: 'userType',
    width: 120,
  },
  {
    title: 'Location',
    dataIndex: 'location',
    key: 'location',
    width: 120,
  },
  {
    title: 'Total Duties',
    dataIndex: 'totalDuties',
    key: 'totalDuties',
    width: 120,
    align: 'center',
  },
  ...getDateColumns(),
]

const getSummaryData = () => {
  const summary = {
    totalDuties: 0,
    dayCounts: {},
  }

  reports.forEach(row => {
    // Total duties sum
    summary.totalDuties += row.totalDuties || 0

    // Day-wise count
    Object.keys(row).forEach(key => {
      if (!isNaN(key)) {
        if (row[key]) {
          summary.dayCounts[key] = (summary.dayCounts[key] || 0) + 1
        }
      }
    })
  })

  return summary
}

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/attendance/monthly-daily')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Monthly Daily Attendance Report`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Monthly Daily Attendance Report
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
             form={form}
             onFinish={handleFilterChange}
             layout="vertical"
            >
             <Row gutter={[8, 8]}>
              <Col xs={24} sm={12} md={6}>
               <Form.Item name="fromDate" label="From Date">
                <DatePicker format="DD-MM-YYYY"
                 style={{ width: '100%' }}
                 disabledDate={(current) => {
                   // Disable future dates
                   return current && current > dayjs().endOf("day");
             }}
                 />
               </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="toDate" label="To Date">
                  <DatePicker format="DD-MM-YYYY"
                   style={{ width: '100%' }}
                    disabledDate={(current) => {
                      if (!current) return false;

                       // Disable future dates
                      if (current > dayjs().endOf("day")) return true;

                      //Disable dates BEFORE fromDate
                      if (fromDate && current < dayjs(fromDate).startOf("day")) return true;

                      return false;
                   }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="location" label="Location">
                  <Select loading={locationsLoading} style={{ width: '100%' }}>
                    {locationOptions.map(loc => (
                  <Select.Option key={loc.id} value={loc.id}>
                    {loc.name}
                  </Select.Option>
                   ))}
                 </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
               <Form.Item name="type" label="Type">
                <Select loading={userTypesLoading} style={{ width: '100%' }}>
                    {typeOptions.map(type => (
                  <Select.Option key={type.id} value={type.id}>
                    {type.name}
                  </Select.Option>
                 ))}
                </Select>
               </Form.Item>
              </Col>

              <Col xs={24}>
            <Space>
              <AntButton type="primary" htmlType="submit">
                Apply Filters
              </AntButton>
              <AntButton
                   onClick={() => {
                      const currentDate = dayjs()
                   
                      form.setFieldsValue({
                        fromDate: currentDate,
                        toDate: currentDate,
                        location: -1,
                        type: -1,
                        })
                   
                      handleFilterChange({
                        fromDate: currentDate,
                        toDate: currentDate,
                        location: -1,
                        type: -1,
                        })
                      }}
               >
                 Reset
              </AntButton>
            </Space>
           </Col>
         </Row>
        </Form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Space>
                <AntButton icon={<FileExcelOutlined />}>Export Excel</AntButton>
                <AntButton icon={<FilePdfOutlined />}>Export PDF</AntButton>
              </Space>
            </Box>
            {queryLoading || isFetching ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Table
                dataSource={reports}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 20 }}
                size="middle"
                scroll={{ x: 'max-content' }}
                summary={() => {
                  const { totalDuties, dayCounts } = getSummaryData()
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ fontWeight: 'bold', background: '#fafafa' }}>
          
                    {/* Employee ID */}
                    <Table.Summary.Cell index={0} />

                     {/* Employee Name */}
                    <Table.Summary.Cell index={1} />

                    {/* User Type */}
                    <Table.Summary.Cell index={2} />

                    {/* Location */}
                    <Table.Summary.Cell index={3}>
                     Total
                    </Table.Summary.Cell>

                    {/* Total Duties */}
                    <Table.Summary.Cell index={4} align="center">
                    {totalDuties}
                    </Table.Summary.Cell>

                    {/* Dynamic Date Columns */}
                    {getDateColumns().map((col, idx) => (
                     <Table.Summary.Cell
                       key={col.key}
                       index={5 + idx}
                       align="center"
                       >
                      {dayCounts[col.dataIndex] || 0}
                     </Table.Summary.Cell>
                      ))}
                    </Table.Summary.Row>
                  </Table.Summary>
                   )
                 }}
               />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

