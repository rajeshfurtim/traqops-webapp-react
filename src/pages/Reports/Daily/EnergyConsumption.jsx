import { useState,useMemo, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton,message,Spin } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../../../services/api'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { formatNumber, formatCurrency } from '../../../utils/formatters';
import { useGetEnergyConsumptionReportQuery } from '../../../store/api/reports.api';
import { useGetLocationList } from '../../../hooks/useGetLocationList';
import { exportToExcel,exportToPDF } from '../../../utils/exportUtils';

const { RangePicker } = DatePicker

export default function EnergyConsumption() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [filters, setFilters] = useState({})
  const [form] = Form.useForm();
    const [shouldFetch, setShouldFetch] = useState(false);
    
  
  let locationId=null;
    const { locations, loading: locationsLoading } = useGetLocationList()
  const fromdate=dayjs().format('YYYY-MM-DD')

  const { data: response, isLoading: queryLoading,isFetching, error: queryError,}=useGetEnergyConsumptionReportQuery(
    {
      fromdate:filters.startdate,
      todate: filters.enddate,
      locationId: filters.location,
    },
    {
      skip: !filters.startdate || !filters.enddate,refetchOnMountOrArgChange: true
    }
  )
  // const loadings = isLoading || isFetching

  useEffect(()=>{
 form.setFieldsValue({
      location: -1,
    })
  },[])
  // useEffect(() => {
  //   form.setFieldsValue({
  //     dateRange: [dayjs().subtract(6, "day"), dayjs()],
  //     location: -1})
  //     if (queryLoading) return;
  //   //  console.log('Iam seond')
  //   //   console.log(response);
  //     if(response){
  //             var dataarr= [];
  //   var tableDataArr= [];
  //   var found = false;
  //   console.log(response)
  //     var energylist=response.data;
  //     console.log(energylist)
      
  //      energylist.forEach((item) => {
  //     dataarr.push(dayjs(item.date).format('DD-MM-YYYY'));
  //     var locations = item.locations;
  //     locations.forEach((location) => {
  //       found = false;
  //       dataarr.forEach((data) => {
  //         if (data.name == location.locationName) {
  //           found = true;
  //           var y = +location.total;
  //           data["data"].push(y);
  //           var locationDataTable= {};
  //           locationDataTable["name"] = location.locationName;
  //           locationDataTable["chillerValue"] = location.chillerValue;
  //           locationDataTable["date"] = dayjs(location.date).format('DD-MM-YYYY');
  //           locationDataTable["tvsValue"] = location.tvsValue;
  //           locationDataTable["vacValue"] = location.vacValue;
  //           locationDataTable["total"] = location.total;
  //           tableDataArr.push(locationDataTable);

  //         }
  //       });
  //       if (found == false) {
  //         var locationData= {};
  //         var locationDataTable= {};
  //         locationData["name"] = location.locationName;
  //         locationData["data"] = [];
  //         var y = +location.total;
  //         locationData["data"].push(y);
  //         locationDataTable["name"] = location.locationName;
  //         locationDataTable["chillerValue"] = location.chillerValue;
  //         locationDataTable["date"] = dayjs(location.date).format('DD-MM-YYYY');
  //         locationDataTable["tvsValue"] = location.tvsValue;
  //         locationDataTable["vacValue"] = location.vacValue;
  //         locationDataTable["total"] = location.total;

  //         dataarr.push(locationData);
  //         tableDataArr.push(locationDataTable);

  //       }
  //     });
  //   });
  //   setReports(tableDataArr)
  //   // console.log(tableDataArr)
  //     // if (response?.success && Array.isArray(response.data)) {
  //     //   console.log(response)
  //     //     const mappedReports = response.data.map((item, index) => ({
  //     //       id: item.id ?? `${item.employeeCode}-${index}`, // safer unique key
  //     //       serialNo: index + 1,
  //     //       date: item.createAt ,
  //     //       employeeName: item.userName || '-',
  //     //       employeeId: item.employeeCode || '-',
  //     //       location: item.locationName || '-',
  //     //       userType: item.userTypeName || '-',
  //     //       shift: item.shiftName || '-',
  //     //       punchIn: item.inTime || '-',
  //     //       punchOut: item.outTime || '-'
  //     //     }))
      
  //     //     setReports(mappedReports)
  //     //   } else if (response && !response.success) {
  //     //     message.error(response.message || 'Failed to load daily location report')
  //     //     setReports([])
  //     //   }
  //     }
  
  //   // loadReports()
  // },[response, queryLoading,tableDataArr])
  const reportss = useMemo(() => {
  if (queryLoading) return []
  if (!response?.data) return []

  const tableDataArr = []

  const energylist = response.data

  energylist.forEach(item => {
    const locations = item.locations || []

    locations.forEach(location => {
      tableDataArr.push({
        name: location.locationName,
        chillerValue: location.chillerValue,
        date: dayjs(location.date).format('DD-MM-YYYY'),
        tvsValue: location.tvsValue,
        vacValue: location.vacValue,
        total: location.total
      })
    })
  })

  return tableDataArr
}, [response, queryLoading])
     const locationOptions = [
    { id: -1, name: 'All Locations' },
    ...(Array.isArray(locations) && locations.length > 0 ? locations.map(loc => ({
      id: loc?.id,
      name: loc?.name || 'Unknown'
    })) : [])
  ]
   


  // const loadReports = async () => {
  //   try {
  //     setLoading(true)
  //     const response = await mockApi.getEnergyConsumption(filters)
  //     setReports(response.data.reports)
  //   } catch (error) {
  //     console.error('Error loading energy consumption:', error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

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

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }
    const handleSearch = (value) => {
      var data={}
      const values = form.getFieldsValue();
  const startDate = values.dateRange?.[0];
  const endDate = values.dateRange?.[1];
  const formattedStartDate = startDate?.format("YYYY-MM-DD");
  const formattedEndDate = endDate?.format("YYYY-MM-DD");
  const location = values.location;
  console.log(formattedStartDate,formattedEndDate,location)
      setShouldFetch(true)
      // refetch()
      // form.submit()
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
      const title=`Energy Consumption Details-${formattedStartDate1}-TO-${formattedEndDate2}-${(location1 =='-1'?'ALL':locationName.name)}`
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
    const title=`Energy Consumption Details-${formattedStartDate1}-TO-${formattedEndDate2}-${(location1 =='-1'?'ALL':locationName.name)}`
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
      dataIndex: 'date',
      key: 'date',
      width: 120,
       render: (text, record, index) => index + 1,
      // sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix()
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      // render: (text) => dayjs(text).format('MMM DD, YYYY'),
      // sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix()
    },
    {
      title: 'Location',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: 'Chiller',
      dataIndex: 'chillerValue',
      key: 'chillerValue',
      width: 150,
      // render: (value) => formatNumber(value),
      // sorter: (a, b) => (a.meterReading || 0) - (b.meterReading || 0)
    },
    {
      title: 'VAC',
      dataIndex: 'vacValue',
      key: 'vacValue',
      width: 150,
      // render: (value) => formatNumber(value),
      // sorter: (a, b) => (a.unitsConsumed || 0) - (b.unitsConsumed || 0)
    },
    {
      title: 'TVS',
      dataIndex: 'tvsValue',
      key: 'tvsValue',
      width: 120,
      // render: (value) => formatCurrency(value),
      // sorter: (a, b) => (a.cost || 0) - (b.cost || 0)
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 120
    }
  ]
  

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/daily/energy-consumption')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Energy Consumption Details`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Energy Consumption Details
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form initialValues={{
    dateRange: [dayjs(), dayjs().add(7, "day")]
  }} form={form} layout="inline" onFinish={handleFilterChange} style={{ marginBottom: 16 }}>
              <Form.Item name="dateRange" label="Date Range">
                <RangePicker disabledDate={disableFutureDates} />
              </Form.Item>
              {/* <Form.Item name="depot" label="Depot">
                <Select placeholder="Select Depot" allowClear style={{ width: 150 }}>
                  <Select.Option value="Depot A">Depot A</Select.Option>
                  <Select.Option value="Depot B">Depot B</Select.Option>
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
                  <AntButton type="primary" htmlType="submit"
                  >Search</AntButton>
                  <AntButton onClick={handleResetFilters}>Reset</AntButton>
                </Space>
              </Form.Item>
            </Form>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
             
              <AntButton icon={<FilePdfOutlined />} onClick={handleExportPDF}  disabled={reportss.length === 0}>
                Export PDF
              </AntButton>
               <AntButton icon={<FileExcelOutlined />}    onClick={handleExportExcel}
                disabled={reportss.length === 0}>
                Export Excel
              </AntButton>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {queryLoading || isFetching? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <Table dataSource={reportss} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} size="middle" />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

