import { useState, useMemo,useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select,DatePicker, Space, Button as AntButton,message,Spin } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants';
import { useGetEquipmentRunStatusReportQuery } from '../../../store/api/reports.api';
import { useGetLocationList } from '../../../hooks/useGetLocationList';
import { exportToExcel,exportToPDF } from '../../../utils/exportUtils';
const { RangePicker } = DatePicker

export default function ChillerRunHour() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [filters, setFilters] = useState({})
  const [form] = Form.useForm();
   const { locations, loading: locationsLoading } = useGetLocationList()
   const { data: response, isLoading: queryLoading,isFetching, error: queryError,}=useGetEquipmentRunStatusReportQuery(
      {
        fromdate:filters.startdate,
        todate: filters.enddate,
        locationId: filters.location,
      },
      {
        skip: !filters.startdate || !filters.enddate,refetchOnMountOrArgChange: false
      }
    )
   

  useEffect(()=>{
 form.setFieldsValue({
      location: locations[0]?.id,
    })
  },[locations]);
  const locationName = form.getFieldsValue();

  const loadReports = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getChillerRunHour(filters)
      setReports(response.data.reports)
    } catch (error) {
      console.error('Error loading chiller run hour:', error)
    } finally {
      setLoading(false)
    }
  }

  // const handleFilterChange = (values) => {
  //   const newFilters = {}
  //   if (values.depot) newFilters.depot = values.depot
  //   setFilters(newFilters)
  // }
      const reportss = useMemo(() => {
      if (queryLoading) return []
      if (!response?.data) return []
    
  console.log(response.data)
    
      // const energylist = response.data
     return response.data.map((item, index) =>{ 
      var Total=0;
      if(locationName.location =='11475'){
         Total=item.runningHour1+item.runningHour2+item.runningHour3+item.runningHour4+item.runningHour5+item.runningHour6
      } else{
          Total=item.runningHour1+item.runningHour2+item.runningHour3
      }
      return{
      ...item,
     serialNo: index + 1,
     runningHour1:item.runningHour1,
     runningHour2:item.runningHour2,
     runningHour3:item.runningHour3,
     runningHour4:item.runningHour4,
     runningHour5:item.runningHour5,
     runningHour6:item.runningHour6,
     perDayRun:Total,
      key: index,
      date: dayjs(item.date).format('YYYY-MM-DD')
    }})
    }, [response, queryLoading])
    // console.log(reportss)
         const locationOptions = [
        // { id: -1, name: 'All Locations' },
        ...(Array.isArray(locations) && locations.length > 0 ? locations.map(loc => ({
          id: loc?.id,
          name: loc?.name || 'Unknown'
        })) : [])
      ]
        const handleFilterChange = (values) => {
      const newFilters = {}
      if (values.dateRange && values.dateRange.length === 2) {
        newFilters.startdate = values.dateRange[0].format('YYYY-MM-DD')
        newFilters.enddate = values.dateRange[1].format('YYYY-MM-DD')
      }
      if (values.location) newFilters.location = values.location;
      console.log(newFilters)
      // if (values.location) newFilters.location = values.location
      setFilters(newFilters)
      // setShouldFetch(true)
    }
  
  
        const disableFutureDates = (current) => {
      return current && current > dayjs().endOf('day')
    }
      const [exporting, setExporting] = useState({ excel: false, pdf: false })
        const handleExportPDF = async () => {
             const values = form.getFieldsValue();
      const startDate = values.dateRange?.[0];
      const endDate = values.dateRange?.[1];
      const formattedStartDate1 = startDate?.format("YYYY-MM-DD");
      const formattedEndDate2 = endDate?.format("YYYY-MM-DD");
      const location1 = values.location;
      const locationName=locationOptions.find((x)=>x.id==location1)
          const title=`EChiller Run Hour-${formattedStartDate1}-TO-${formattedEndDate2}-${(location1 =='-1'?'ALL':locationName.name)}`
        try {
          setExporting(prev => ({ ...prev, pdf: true }))
      
          await exportToPDF(
            columns,            
            reportss,
            title
          )
      
          message.success('PDF exported successfully')
        } catch (err) {
          message.error('PDF export failed')
        } finally {
          setExporting(prev => ({ ...prev, pdf: false }))
        }
      }
        const handleExportExcel = async () => {
             const values = form.getFieldsValue();
      const startDate = values.dateRange?.[0];
      const endDate = values.dateRange?.[1];
      const formattedStartDate1 = startDate?.format("YYYY-MM-DD");
      const formattedEndDate2 = endDate?.format("YYYY-MM-DD");
      const location1 = values.location;
      const locationName=locationOptions.find((x)=>x.id==location1)
        const title=`Chiller Run Hour-${formattedStartDate1}-TO-${formattedEndDate2}-${(location1 =='-1'?'ALL':locationName.name)}`
          try {
            setExporting(prev => ({ ...prev, excel: true }))
        
            await exportToExcel(
              columns,            
              reportss,    
             title
            )
        
            message.success('Excel exported successfully')
          } catch (err) {
            message.error('Excel export failed')
          } finally {
            setExporting(prev => ({ ...prev, excel: false }))
          }
        }

  const columns = [
     {
      title: 'S.No',
      dataIndex: 'serialNo',
      key: 'serialNo',
      width: 150,
    },
    {
       title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    ...(locationName.location =='11475'?[
       { dataIndex: "runningHour1", title: "CHILLER 1 RH" },
      { dataIndex: "runningHour2", title: "CHILLER 2 RH" },
      { dataIndex: "runningHour3", title: "CHILLER 3 RH" },
      { dataIndex: "runningHour4", title: "CHILLER 4 RH" },
      { dataIndex: "runningHour5", title: "CHILLER 5 RH" },
      { dataIndex: "runningHour6", title: "CHILLER 6 RH" },
      { dataIndex: "perDayRun", title: "PER DAY CHILLER RUN HOUR" },
    ]:[
       { dataIndex: "runningHour1", title: "CHILLER 1 RH" },
      { dataIndex: "runningHour2", title: "CHILLER 2 RH" },
      { dataIndex: "runningHour3", title: "CHILLER 3 RH" },
      { dataIndex: "perDayRun", title: "PER DAY CHILLER RUN HOUR" },
    ])
     
   
  ]

  // const columns = [
    
  //   { title: 'Chiller ID', dataIndex: 'chillerId', key: 'chillerId', width: 150 },
  //   { title: 'Chiller Name', dataIndex: 'chillerName', key: 'chillerName', width: 200 },
  //   { title: 'Total Run Hours', dataIndex: 'totalRunHours', key: 'totalRunHours', width: 150, sorter: (a, b) => a.totalRunHours - b.totalRunHours },
  //   { title: 'Idle Hours', dataIndex: 'idleHours', key: 'idleHours', width: 120, sorter: (a, b) => a.idleHours - b.idleHours },
  //   { title: 'Location', dataIndex: 'location', key: 'location', width: 150 },
  //   { title: 'Depot', dataIndex: 'depot', key: 'depot', width: 120 },
  //   { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (text) => dayjs(text).format('MMM DD, YYYY') }
  // ]

  return (
    <>
     <style>
    {`
      .ant-table-wrapper .ant-table-thead > tr > th,
      .ant-table-wrapper .ant-table-tbody > tr > td {
        border: 1px solid #d9d9d9 !important;
      }


    `}
  </style>
      <Helmet>
        <title>{getPageTitle('reports/daily/chiller-run-hour')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Chiller Run Hour`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">Chiller Run Hour</Typography>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form  form={form} layout="inline" onFinish={handleFilterChange} style={{ marginBottom: 16 }}
             initialValues={{ dateRange: [dayjs().startOf('month'), dayjs()] }}>
              {/* <Form.Item name="depot" label="Depot">
                <Select placeholder="Select Depot" allowClear style={{ width: 150 }}>
                  <Select.Option value="Depot A">Depot A</Select.Option>
                  <Select.Option value="Depot B">Depot B</Select.Option>
                </Select>
              </Form.Item> */}
               <Form.Item name="dateRange" label="Date Range">
                                            <RangePicker disabledDate={disableFutureDates} />
                                          </Form.Item>
                                             <Form.Item name="location" label="Location">
                                                 <Select
                                                placeholder="All Locations"
                                                style={{ width: 180 }}
                                                loading={locationsLoading}
                                                // onChange={(value) => handleFilterChange('location', value)}
                                              >
                                                {locationOptions.map(location => (
                                                  <Select.Option key={location.id} value={location.id}>
                                                    {location.name}
                                                  </Select.Option>
                                                ))}
                                              </Select>
                                            </Form.Item>
              <Form.Item>
              
                                            
                <Space>
                  <AntButton type="primary" htmlType="submit">Filter</AntButton>
                  <AntButton onClick={() => { form.resetFields(); setFilters({}) }}>Reset</AntButton>
                </Space>
              </Form.Item>
            </Form>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <AntButton icon={<FileExcelOutlined />} onClick={handleExportExcel}  disabled={reportss.length === 0}>Export Excel</AntButton>
              <AntButton icon={<FilePdfOutlined />} onClick={handleExportPDF}  disabled={reportss.length === 0}>Export PDF</AntButton>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            {queryLoading || isFetching  ? <Box display="flex" justifyContent="center" p={4}> <Spin /></Box> :
              <Table dataSource={reportss} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} size="middle" />}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

