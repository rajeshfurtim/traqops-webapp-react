import { useState,useMemo, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Empty, Input, Tag, Descriptions, Spin, Row, Col } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants';
import { useGetTemperatureRunStatusReportQuery } from '../../../store/api/reports.api';
import { useGetLocationList } from '../../../hooks/useGetLocationList';
import { exportToExcel,exportToPDF } from '../../../utils/exportUtils';
const { RangePicker } = DatePicker;
import { SearchOutlined } from '@ant-design/icons'

export default function TemperatureRunStatus() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [filters, setFilters] = useState({})
    const [searchText, setSearchText] = useState('')
  const [form] = Form.useForm()
   const { locations, loading: locationsLoading } = useGetLocationList();
   const { data: response, isLoading: queryLoading,isFetching, error: queryError,}=useGetTemperatureRunStatusReportQuery(
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
      const response = await mockApi.getTemperatureRunStatus(filters)
      setReports(response.data.reports)
    } catch (error) {
      console.error('Error loading temperature run status:', error)
    } finally {
      setLoading(false)
    }
  }

  // const handleFilterChange = (values) => {
  //   const newFilters = {}
  //   if (values.depot) newFilters.depot = values.depot
  //   if (values.status) newFilters.status = values.status
  //   setFilters(newFilters)
  // }

  const getStatusColor = (status) => {
    const colors = { 'Normal': 'success', 'High': 'error', 'Low': 'warning' }
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
          const title=`Temperature Run Status-${formattedStartDate1}-TO-${formattedEndDate2}-${(location1 =='-1'?'ALL':locationName.name)}`
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
        const title=`Temperature Run Status-${formattedStartDate1}-TO-${formattedEndDate2}-${(location1 =='-1'?'ALL':locationName.name)}`
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
             const filteredReports = useMemo(() => {
                  if (!searchText) return reportss;
                
                  return reportss.filter((row) =>
                    Object.values(row)
                      .join(" ")
                      .toLowerCase()
                      .includes(searchText.toLowerCase())
                  );
                }, [reportss, searchText]);
                 const getColumnSearchProps = (dataIndex) => ({
                        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                          <div style={{ padding: 8 }}>
                            <Input
                              placeholder={`Search ${dataIndex}`}
                              value={selectedKeys[0]}
                              onChange={(e) =>
                                setSelectedKeys(e.target.value ? [e.target.value] : [])
                              }
                              onPressEnter={() => confirm()}
                              style={{ marginBottom: 8 }}
                            />
                                          <Space>
                                  <AntButton
                                    type="primary"
                                    size="small"
                                    onClick={() => confirm()}
                                    icon={<SearchOutlined />}
                                  >
                                    Search
                                  </AntButton>
                
                                  <AntButton
                                    size="small"
                                    onClick={() => {
                                      clearFilters();
                                      confirm();
                                    }}
                                  >
                                    Reset
                                  </AntButton>
                                </Space>
                          </div>
                        ),
                        onFilter: (value, record) =>
                          record[dataIndex]
                            ?.toString()
                            .toLowerCase()
                            .includes(value.toLowerCase()),
                      })

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'serialNo',
      key: 'serialNo',
      width: 80,
    },
    {
       title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
     { dataIndex: "scr",key:'scr', title: "SCR" },
      { dataIndex: "upsRoom",key:'upsRoom',  title: "UPS Room" },
      { dataIndex: "ser",key:'serscr', title: "SER" },
      { dataIndex: "cer",key:'cer', title: "CER" },
      { dataIndex: "transformerRoom",key:'transformerRoom', title: "Transformer Room" },
      { dataIndex: "lowVoltageRoom",key:'lowVoltageRoom', title: "Low Voltage Room" },
      { dataIndex: "mediumVoltageRoom",key:'mediumVoltageRoom', title: "Medium Voltage Room" },
      { dataIndex: "platformLhs",key:'platformLhs', title: "Platform (LHS)" },
      { dataIndex: "platformRhs",key:'platformRhs', title: "Platform (RHS)" },
      { dataIndex: "concourseLhs",key:'concourseLhs', title: "Concourse (LHS)" },
      { dataIndex: "concourseRhs",key:'concourseRhs', title: "Concourse (RHS)" }
  ]
                    const columnslist = columns.map(col => ({
  ...col,
  key: col.dataIndex,
  ...getColumnSearchProps(col.dataIndex)
}));
   const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  return (
    <>
     {/* <style>
    {`
      .ant-table-wrapper .ant-table-thead > tr > th,
      .ant-table-wrapper .ant-table-tbody > tr > td {
        border: 1px solid #d9d9d9 !important;
      }


    `}
  </style> */}
      <Helmet>
        <title>{getPageTitle('reports/daily/temperature-run-status')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Temperature Run Status`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">Temperature Run Status</Typography>
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
                           <AntButton type="primary" htmlType="submit">Search</AntButton>
                           <AntButton onClick={handleResetFilters}>Reset</AntButton>
                         </Space>
                       </Form.Item>
                     </Form>
                     <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Input
                                                                                  placeholder="Search"
                                                                                  prefix={<SearchOutlined />}
                                                                                  value={searchText}
                                                                                  onChange={e => setSearchText(e.target.value)}
                                                                                  allowClear
                                                                                  style={{ width: 250 }}
                                                                                />
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
              <Table dataSource={filteredReports} columns={columnslist} rowKey="id" bordered pagination={{ pageSize: 10 }} size="middle" />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

