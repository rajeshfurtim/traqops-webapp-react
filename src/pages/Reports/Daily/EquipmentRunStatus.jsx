import { useState,useMemo, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, Space,DatePicker, Button as AntButton, Tag,message,Spin } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetEquipmentRunStatusReportQuery } from '../../../store/api/reports.api';
import { useGetLocationList } from '../../../hooks/useGetLocationList';
import { exportToExcel,exportToPDF } from '../../../utils/exportUtils';
const { RangePicker } = DatePicker

export default function EquipmentRunStatus() {
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
  },[locations])

  const loadReports = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getEquipmentRunStatus(filters)
      setReports(response.data.reports)
    } catch (error) {
      console.error('Error loading equipment run status:', error)
    } finally {
      setLoading(false)
    }
  }

  // const handleFilterChange = (values) => {
  //   const newFilters = {}
  //   if (values.depot) newFilters.depot = values.depot
  //   if (values.runStatus) newFilters.runStatus = values.runStatus
  //   setFilters(newFilters)
  // }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  const getStatusColor = (status) => {
    const colors = {
      'Running': 'success',
      'Idle': 'warning',
      'Maintenance': 'error'
    }
    return colors[status] || 'default'
  }
    const reportss = useMemo(() => {
    if (queryLoading) return []
    if (!response?.data) return []
  
console.log(response.data)
  
    // const energylist = response.data
   return response.data.map((item, index) => ({
    ...item,
   serialNo: index + 1,
    key: index,
    date: dayjs(item.date).format('YYYY-MM-DD')
  }))
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
        const title=`Equipment Run Status-${formattedStartDate1}-TO-${formattedEndDate2}-${(location1 =='-1'?'ALL':locationName.name)}`
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
      const title=`Equipment Run Status-${formattedStartDate1}-TO-${formattedEndDate2}-${(location1 =='-1'?'ALL':locationName.name)}`
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
     
const getStatusCellStyle = (value) => ({
  style: {
    backgroundColor: value === "ON" ? "#7ed37e" : "", // green color
    textAlign: "center",
    fontWeight: 500,
  },
});
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
    ...([ { dataIndex: "chiller1", title: "CHILLER 1",key:"chiller1" },
      { dataIndex: "chiller2", title: "CHILLER 2",key:"chiller2" },
      { dataIndex: "chiller3", title: "CHILLER 3",key:"chiller3" },
      { dataIndex: "chillerwp1", title: "CDWP 1",key:"chillerwp1" },
      { dataIndex: "chillerwp2", title: "CDWP 2",key:"chillerwp2" },
      { dataIndex: "chillerwp3", title: "CDWP 3",key:"chillerwp3" },
      { dataIndex: "condwp1", title: "CHWP 1",key:"condwp1" },
      { dataIndex: "condwp2", title: "CHWP 2",key:"condwp2" },
      { dataIndex: "condwp3", title: "CHWP 3",key:"condwp3" },
      { dataIndex: "ct1", title: "CT 1" ,key:"ct1"},
      { dataIndex: "ct2", title: "CT 2",key:"ct2" },
      { dataIndex: "ct3", title: "CT 3",key:"c23" },
      { dataIndex: "ahuP01", title: "AHU/P01",key:"ahuP01" },
      { dataIndex: "ahuP02", title: "AHU/P02",key:"ahuP02" },
      { dataIndex: "ahuC01", title: "AHU/C01",key:"ahuC01" },
      { dataIndex: "ahuC02", title: "AHU/C02" ,key:"ahuC02"},].map(col => ({
    ...col,
    onCell: (record) => getStatusCellStyle(record[col.dataIndex]),
  })))
    // {
    //   title: 'Run Status',
    //   dataIndex: 'runStatus',
    //   key: 'runStatus',
    //   width: 120,
    //   render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    // },
    // {
    //   title: 'Downtime',
    //   dataIndex: 'downtime',
    //   key: 'downtime',
    //   width: 120
    // },
    // {
    //   title: 'Location',
    //   dataIndex: 'location',
    //   key: 'location',
    //   width: 150
    // },
    // {
    //   title: 'Depot',
    //   dataIndex: 'depot',
    //   key: 'depot',
    //   width: 120
    // },
    // {
    //   title: 'Date',
    //   dataIndex: 'date',
    //   key: 'date',
    //   width: 120,
    //   render: (text) => dayjs(text).format('MMM DD, YYYY')
    // }
  ]

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
        <title>{getPageTitle('reports/daily/equipment-run-status')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Equipment Run Status`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Equipment Run Status
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form  initialValues={{
               dateRange: [dayjs().startOf('month'), dayjs()] }} form={form} layout="inline" onFinish={handleFilterChange} style={{ marginBottom: 16 }}
            
            >
               <Form.Item name="dateRange" label="Date Range">
                              <RangePicker disabledDate={disableFutureDates} />
                            </Form.Item>
              {/* <Form.Item name="depot" label="Depot">
                <Select placeholder="Select Depot" allowClear style={{ width: 150 }}>
                  <Select.Option value="Depot A">Depot A</Select.Option>
                  <Select.Option value="Depot B">Depot B</Select.Option>
                </Select>
              </Form.Item> */}
              {/* <Form.Item name="runStatus" label="Status">
                <Select placeholder="Select Status" allowClear style={{ width: 150 }}>
                  <Select.Option value="Running">Running</Select.Option>
                  <Select.Option value="Idle">Idle</Select.Option>
                  <Select.Option value="Maintenance">Maintenance</Select.Option>
                </Select>
              </Form.Item> */}
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
                  <AntButton onClick={handleResetFilters}>Reset</AntButton>
                </Space>
              </Form.Item>
            </Form>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <AntButton icon={<FileExcelOutlined />} onClick={handleExportExcel}  disabled={reportss.length === 0}>
                Export Excel
              </AntButton >
              <AntButton icon={<FilePdfOutlined />} onClick={handleExportPDF}  disabled={reportss.length === 0}>
                Export PDF
              </AntButton>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {queryLoading || isFetching ? (
              <Box display="flex" justifyContent="center" p={4}>
                 <Spin />
              </Box>
            ) : ( 
              <Table dataSource={reportss} columns={columns} rowKey="id" bordered pagination={{ pageSize: 10 }} size="middle" />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

