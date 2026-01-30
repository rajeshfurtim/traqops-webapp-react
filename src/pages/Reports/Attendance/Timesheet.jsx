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

export default function TimesheetReport() {

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
 
 const transformReportRow = (item) => {
  const dayMap = {}

  item.monthWiseShift?.forEach(shift => {
    if (!shift?.createdAt || !shift?.inTime || !shift?.outTime) return

    const day = dayjs(shift.createdAt).date()

    if (!dayMap[day]) {
      dayMap[day] = []
    }

    dayMap[day].push(
      `In:${shift.inTime} Out:${shift.outTime}`
    )
  })

  // Convert array → multiline string
  Object.keys(dayMap).forEach(day => {
    dayMap[day] = dayMap[day].join('\n')
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
      width: 120,
      align: 'left',
      render: (text) => (
    <div style={{ whiteSpace: 'pre-line'}}>
      {text}
    </div>
  ),
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

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
                         form={form}
                         onFinish={handleFilterChange}
                         layout="vertical"
                        >
                         <Row gutter={[8, 8]}>
                          <Col xs={24} sm={12} md={6}>
                           <Form.Item name="month" label="Month">
                            <DatePicker picker="month" format="MMMM,YYYY" style={{ width: '100%' }}
                               disabledDate={(current) =>
                                current && current > dayjs().endOf('month')
                              } />
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
            
                          <Col xs={24} sm={12} md={6}>
                        <div style={{ marginTop: 30 }}>
                          <Space>
                          <AntButton type="primary" htmlType="submit">
                            Apply Filters
                          </AntButton>
                          <AntButton
                               onClick={() => {
                                  const currentMonth = dayjs()
                               
                                  form.setFieldsValue({
                                    month: currentMonth,
                                    location: -1,
                                    type: -1,
                                    })
                               
                                  handleFilterChange({
                                    month: currentMonth,
                                    location: -1,
                                    type: -1,
                                    })
                                  }}
                           >
                             Reset
                          </AntButton>
                          </Space>
                        </div>
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
              />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

