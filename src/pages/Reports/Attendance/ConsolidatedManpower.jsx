import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Row, Col } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'
import { useAuth } from '../../../context/AuthContext'
import { useGetConsolidateManpowerReportQuery } from '../../../store/api/reports.api'

export default function ConsolidatedManpowerReport() {

  const [form] = Form.useForm()
  const { user } = useAuth()
  const fromDate = Form.useWatch("fromDate", form);
  const clientId = user?.client?.id || user?.clientId

  const [reports, setReports] = useState([])
  const [filters, setFilters] = useState({
    fromDate: null,
    toDate: null,
    userTypeId: null,
  })

  const { userTypes, loading: userTypesLoading } = useGetAllUserType()

  const typeOptions = [
    // { id: -1, name: 'All User Types' }, 
    ...(Array.isArray(userTypes) && userTypes.length > 0 ? userTypes.map(user => ({ 
      id: user?.id, 
      name: user?.name || 'Unknown' 
    })) : [])
  ]

  useEffect(() => {
        form.setFieldsValue({
          fromDate: dayjs().startOf('month'),
          toDate: dayjs().endOf('month'),
          type: 261586,
        })
      }, [])

  const handleFilterChange = (values) => {
    console.log('Filter values:', values)
    const newFilters = {}
    
    if(values.fromDate) newFilters.fromDate = values.fromDate.format('YYYY-MM-DD')
    if(values.toDate) newFilters.toDate = values.toDate.format('YYYY-MM-DD') 
    if (values.type) newFilters.userTypeId = values.type
    console.log('Applied Filters:', newFilters)
    setFilters(prev => ({
    ...prev,
    ...newFilters,
  }))
  }

  const { data: response, isLoading: queryLoading, isFetching } = useGetConsolidateManpowerReportQuery(
          {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        userTypeId: filters.userTypeId,
        clientId,
      },
          { skip: !clientId || !filters.fromDate || !filters.toDate }
        )

  useEffect(() => {
    console.log('API Response:', response)
  if (!response?.data || !Array.isArray(response?.data)) {
    setReports([])
    return
  }

  const allDatesSet = new Set()

  // Collect all unique dates
  response?.data?.forEach(item => {
    Object.keys(item.counts || {}).forEach(date => {
      allDatesSet.add(date)
    })
  })

  const allDates = Array.from(allDatesSet).sort()

  // Build table rows
  const rows = response?.data?.map(item => {
    let total = 0
    const row = {
      id: item.locationId,
      location: item.locationName,
      userTypeName: item.userTypeName,
    }

    allDates.forEach(date => {
      const value = item.counts?.[date] || 0
      row[date] = value
      total += value
    })

    row.total = total
    return row
  })

  // Grand total row
  const totalRow = {
    id: 'total',
    location: '',
    userTypeName: 'Total',
    total: 0,
  }

  allDates.forEach(date => {
    totalRow[date] = rows.reduce((sum, r) => sum + (r[date] || 0), 0)
    totalRow.total += totalRow[date]
  })

  setReports([...rows, totalRow])
}, [response])      

  const dateColumns = reports.length
  ? Object.keys(reports[0])
      .filter(key => key.match(/^\d{4}-\d{2}-\d{2}$/))
      .map(date => ({
        title: dayjs(date).format('D'),
        dataIndex: date,
        key: date,
        align: 'center',
        width: 80,
      }))
  : []

const columns = [
  {
    title: 'Location',
    dataIndex: 'location',
    key: 'location',
    fixed: 'left',
    width: 220,
  },
  {
    title: 'User Type',
    dataIndex: 'userTypeName',
    key: 'userTypeName',
    fixed: 'left',
    width: 180,
  },
  {
    title: 'Total',
    dataIndex: 'total',
    key: 'total',
    align: 'center',
    fixed: 'left',
    width: 100,
  },
  ...dateColumns,
]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/attendance/consolidated-manpower')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Consolidated Manpower Report`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Consolidated Manpower Report
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
                   return current && current > dayjs().endOf("month");
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
                      if (current > dayjs().endOf("month")) return true;

                      //Disable dates BEFORE fromDate
                      if (fromDate && current < dayjs(fromDate).startOf("day")) return true;

                      return false;
                   }}
                  />
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
                      const fromMonth = dayjs().startOf("month")
                      const toMonth = dayjs().endOf("month")
                   
                      form.setFieldsValue({
                        fromDate: fromMonth,
                        toDate: toMonth,
                        type: 261586,
                        })
                   
                      handleFilterChange({
                        fromDate: fromMonth,
                        toDate: toMonth,
                        type: 261586,
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

