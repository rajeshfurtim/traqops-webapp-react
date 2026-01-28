import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useAuth } from '../../../context/AuthContext'
import { useGetMonthlyEmployeeReportQuery } from '../../../store/api/reports.api'

export default function MonthlyEmployeeAttendanceReport() {

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

  const locationIds = Array.isArray(locations)
  ? locations.map(loc => loc?.id).filter(Boolean)
  : []

  useEffect(() => {
    form.setFieldsValue({
      month: dayjs(),
      type: -1
    })
  }, [])

  const handleFilterChange = (values) => {
    setReports([])
    console.log('locationIds:', locationIds)
    console.log('Filter values:', values)
    const newFilters = {}
    if (values.month) {
      newFilters.fromDate = values.month.startOf('month').format('YYYY-MM-DD')
    newFilters.toDate = values.month.endOf('month').format('YYYY-MM-DD')
    }
    
    if (values.type) newFilters.userTypeId = values.type
    if (locationIds.length > 0) newFilters.locationId = locationIds
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

  return ''
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
  if (!filters.fromDate) return []

  const daysInMonth = dayjs(filters.fromDate).daysInMonth()

  return Array.from({ length: daysInMonth }, (_, i) => ({
    title: i + 1,
    dataIndex: i + 1,
    key: i + 1,
    width: 45,
    align: 'center',
  }))
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
    title: 'Total Duties',
    dataIndex: 'totalDuties',
    key: 'totalDuties',
    width: 120,
  },
  ...getDateColumns(),
]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/attendance/monthly-employee')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Monthly Employee Attendance Report`} />
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
              style={{ marginBottom: 16 }}
            >
              <Form.Item name="month" label="Month">
                <DatePicker picker="month" format="MMMM,YYYY"
                 disabledDate={(current) =>
                 current && current > dayjs().endOf('month')
                 } />
              </Form.Item>
              {/* <Form.Item name="employeeId" label="Employee ID">
                <Input placeholder="Enter Employee ID" style={{ width: 150 }} />
              </Form.Item> */}
              <Form.Item name="type" label="Type" className="filter-item">
                <Select
                  style={{ width: 150 }}
                  loading={userTypesLoading}
                  // onChange={(value) => handleFilterChange('type', value)}
                >
                  {typeOptions.map(type => (
                    <Select.Option key={type.id || 'all'} value={type.id}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item>
                <Space>
                  <AntButton type="primary" htmlType="submit">
                    Apply Filters
                  </AntButton>
                  <AntButton
                    onClick={() => {
                      const currentMonth = dayjs()

                         form.setFieldsValue({
                         month: currentMonth,
                         type: -1,
                    })

                    handleFilterChange({
                      month: currentMonth,
                      type: -1,
                    })
                  }}
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

