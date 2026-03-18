import { useState, useMemo, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Empty, Input, Tag, Descriptions, Spin, Row, Col, Tabs } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { getPageTitle, APP_CONFIG } from '../config/constants'
import { useGetEquipmentRunStatusReportQuery } from '../store/api/reports.api';
import { useGetLocationList } from '../hooks/useGetLocationList';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
const { RangePicker } = DatePicker
import { SearchOutlined } from '@ant-design/icons';
import { correctiveApi } from '../store/api/correctivemaintenance.api';
// const operations = <Button>Extra Action</Button>;
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";
const data = [
  {
    station: "Chennai",
    open: 12,
    workdone: 8,
    completed: 5,
    verified: 4,
    onhold: 2,
    redo: 1,
    overdue: 3
  },
  {
    station: "Egmore",
    open: 10,
    workdone: 6,
    completed: 7,
    verified: 3,
    onhold: 1,
    redo: 2,
    overdue: 4
  },
  {
    station: "Kilpauk",
    open: 9,
    workdone: 7,
    completed: 4,
    verified: 2,
    onhold: 3,
    redo: 1,
    overdue: 2
  },
  {
    station: "Chennai",
    open: 12,
    workdone: 8,
    completed: 5,
    verified: 4,
    onhold: 2,
    redo: 1,
    overdue: 3
  },
  {
    station: "Egmore",
    open: 10,
    workdone: 6,
    completed: 7,
    verified: 3,
    onhold: 1,
    redo: 2,
    overdue: 4
  },
  {
    station: "Kilpauk",
    open: 9,
    workdone: 7,
    completed: 4,
    verified: 2,
    onhold: 3,
    redo: 1,
    overdue: 2
  },
  {
    station: "Chennai",
    open: 12,
    workdone: 8,
    completed: 5,
    verified: 4,
    onhold: 2,
    redo: 1,
    overdue: 3
  },
  {
    station: "Egmore",
    open: 10,
    workdone: 6,
    completed: 7,
    verified: 3,
    onhold: 1,
    redo: 2,
    overdue: 4
  },
  {
    station: "Kilpauk",
    open: 9,
    workdone: 7,
    completed: 4,
    verified: 2,
    onhold: 3,
    redo: 1,
    overdue: 2
  }
];
// const items = Array.from({ length: 3 }).map((_, i) => {
//   const id = String(i + 1);
//   return {
//     label: `Tab ${id}`,
//     key: id,
//     children: `Content of tab ${id}`,
//   };
// });


export default function CorrectiveMaintenance() {
  const clientId = localStorage.getItem('clientId');

  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(true)
  const [shouldFetch, setShouldFetch] = useState(false)
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filters, setFilters] = useState({})
  const [countlist, setCountlist] = useState({})
  const [form] = Form.useForm();

  const { locations, loading: locationsLoading } = useGetLocationList();

  const { data: response, isLoading: isInitialLoading, isFetching, error: queryError } =
    correctiveApi.useGetcorrectivemaintenanceCountListQuery(
      {
        fromdate: filters.startdate,
        todate: filters.enddate,
        locationId: filters.location,
      },
      {
        skip: !filters.startdate || !shouldFetch || !filters.enddate,
        refetchOnMountOrArgChange: false
      }
    )

  const queryLoading = isInitialLoading || isFetching

  const statusMap = {
    '1': 640, // Open
    '2': 804, // WorkDone
    '3': 631, // Completed
    '4': 15, // Verified
    '5': 808  // Overdue
  };

  useEffect(() => {
    console.log(locations)
    form.setFieldsValue({
      location: -1,
    })
    if (locations?.length) {
      setFilters({
        startdate: dayjs().startOf('month').format('YYYY-MM-DD'),
        enddate: dayjs().endOf('month').format('YYYY-MM-DD'),
        location: locations.map(x => x.id).join(',')
      });
    }
  }, [locations])

  const {
    data: cmresponse,
    isLoading: cmqueryLoading,
    isFetching: cmisFetching,
    error: cmqueryError
  } = correctiveApi.useGetcorrectivemaintenanceQuery(
    {
      fromdate: filters.startdate,
      todate: filters.enddate,
      locationId: 14474904,
      clientId: clientId,
      statusId: statusMap[activeTab],
    },
    {
      skip: !filters.startdate || !filters.enddate,
      refetchOnMountOrArgChange: true // ✅ IMPORTANT FIX
    }
  )

  const handleFilterChange = (values) => {
    const newFilters = {}
    setShouldFetch(true)

    if (values.dateRange && values.dateRange.length === 2) {
      newFilters.startdate = values.dateRange[0].format('YYYY-MM-DD')
      newFilters.enddate = values.dateRange[1].format('YYYY-MM-DD')
    }

    if (values.location == -1) {
      newFilters.location = locations.map(x => (x.id));
    } else {
      newFilters.location = values.location;
    }

    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setShouldFetch(false)
    setFilters({})
  }

  const getStatusColor = (status) => {
    const colors = {
      'Completed': 'success',
      'In Progress': 'info',
      'Pending': 'warning',
      'Overdue': 'error'
    }
    return colors[status] || 'default'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': '#17a2b8',
      'Medium': '#ffc107',
      'High': '#fd7e14',
      'Critical': '#dc3545'
    }
    return colors[priority] || '#000'
  }
  const locationOptions = [
    { id: -1, name: 'All Locations' },
    ...(Array.isArray(locations) && locations.length > 0 ? locations.map(loc => ({
      id: loc?.id,
      name: loc?.name || 'Unknown'
    })) : [])
  ]
  const reports = useMemo(() => {
    if (queryLoading) return []
    if (!response?.data) return []

    const countlist = response.data;
    const tableDataArr = countlist.map((item) => {
      const location = locations.find(loc => loc?.name?.trim() == item?.locationName?.trim());
      console.log(location)
      return {
        ...item,
        locationcode: location ? location.code : null
      };
    });

    return tableDataArr;
  }, [response, queryLoading]);
  const Cmreports = useMemo(() => {
    if (cmqueryLoading) return []
    if (!cmresponse?.data?.content) return []
    console.log(cmresponse)
    var tableDataArr = [];
    tableDataArr = cmresponse?.data?.content?.map((result) => {
      return {
        'id': result.id, 'name': result?.name, 'location': result.location.name, 'assets': result.assets?.name, 'cmKey': result?.cmKey,
        'category': result.category != null ? result.category.name : null, 'status': result.status.name, 'technician': result.technician, 'priority': result.priority != null ? result.priority.name : null,
        'faultCategory': result.faultCategory?.name, 'faultSubCategory': result.faultSubCategory?.name, 'time': '23-05-2023 11:31',
        'allData': result, 'startTime': result.issueStartTime, 'endTime': result.issueEndTime, 'assignedTo': result.assignedTo != null ? result.assignedTo.firstName + " " + result.assignedTo.lastName : null, 'assignedId': result.assignedTo?.id

      }
    });
    console.log(tableDataArr)

    return tableDataArr;

  }, [cmresponse, cmqueryLoading]);
  // console.log(Cmreports)


  const columns = [
    {
      title: 'Fault Id',
      dataIndex: 'cmKey',
      key: 'cmKey',
      width: 100
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 100

    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 100
      // width: 120,
      // render: (priority) => (
      //   <Chip
      //     label={priority}
      //     size="small"
      //     sx={{ bgcolor: getPriorityColor(priority), color: 'white', fontWeight: 'bold' }}
      //   />
      // )
    },
    {
      title: 'Date',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 120,
      render: (date) => dayjs(date).format('DD-MM-YYYY HH:mm')
    },

    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 150
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 200
    },

    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Chip label={status} color={getStatusColor(status)} size="small" />
      )
    },
  ]
  const items = [
    { key: '1', label: 'Open' },
    { key: '2', label: 'WorkDone' },
    { key: '3', label: 'Completed' },
    { key: '4', label: 'Verified' },
    { key: '5', label: 'Overdue' }
  ].map(tab => ({
    ...tab,
    children: (
      <Table
        rowKey="id"
        dataSource={Cmreports}
        columns={columns}
        loading={cmisFetching || cmqueryLoading} 
      />
    )
  }))

  return (
    <>
      <Helmet>
        <title>{getPageTitle('corrective-maintenance')}</title>
      </Helmet>

      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Corrective Maintenance
        </Typography>


        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              layout="inline"
              onFinish={handleFilterChange}
              style={{ marginBottom: 16 }}
              initialValues={{
                dateRange: [dayjs().startOf('month'), dayjs().endOf('month')]
              }}
            >
              <Form.Item name="dateRange" label="Date Range">
                <RangePicker />
              </Form.Item>

              <Form.Item name="location" label="Location">
                <Select style={{ width: 150 }} loading={locationsLoading}>
                  {locationOptions.map(location => (
                    <Select.Option key={location.id} value={location.id}>
                      {location.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <AntButton type="primary" htmlType="submit" loading={queryLoading}>
                    Search
                  </AntButton>
                  <AntButton onClick={handleResetFilters}>
                    Reset
                  </AntButton>
                </Space>
              </Form.Item>
            </Form>
          </CardContent>
        </Card>

        <Card style={{ marginTop: '20px' }}>
          <CardContent>
            {!shouldFetch ? (
              <Empty description="Please apply filters to view the report" />
            ) : queryLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <Tabs items={items} onChange={(key) => setActiveTab(key)} />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

