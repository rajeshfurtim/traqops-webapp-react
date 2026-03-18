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
  const clientId =localStorage.getItem('clientId');
  console.log(clientId)
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filters, setFilters] = useState({})
  const [countlist, setCountlist] = useState({})
  const [form] = Form.useForm();
  const { locations, loading: locationsLoading } = useGetLocationList();
  const { data: response, isLoading: queryLoading, isFetching, error: queryError, } = correctiveApi.useGetcorrectivemaintenanceCountListQuery(
    {
      fromdate: filters.startdate,
      todate: filters.enddate,
      locationId: filters.location,
    },
    {
      skip: !filters.startdate || !filters.enddate, refetchOnMountOrArgChange: false
    }
  )
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


  const { data: cmresponse, isLoading: cmqueryLoading, cmisFetching, error: cmqueryError, } = correctiveApi.useGetcorrectivemaintenanceQuery(
    {
      fromdate: filters.startdate,
      todate: filters.enddate,
      locationId: 14474904,
      clientId: clientId,
      statusId: statusMap[activeTab],
    },
    {
      skip: !filters.startdate || !filters.enddate, refetchOnMountOrArgChange: false
    }
  )





  const loadTickets = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getCorrectiveMaintenanceTickets(filters)
      setTickets(response.data.tickets)
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleFilterChange = (values) => {
    const newFilters = {}
    if (values.dateRange && values.dateRange.length === 2) {
      newFilters.startdate = values.dateRange[0].format('YYYY-MM-DD')
      newFilters.enddate = values.dateRange[1].format('YYYY-MM-DD')
    }
    if (values.location == -1) {
      newFilters.location = locations.map(x => (x.id));
    } else {
      newFilters.location = values.location;
    }
    console.log(newFilters)
    // if (values.location) newFilters.location = values.location
    setFilters(newFilters)
    // setShouldFetch(true)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  const handleRowClick = async (record) => {
    try {
      const response = await mockApi.getCorrectiveMaintenanceTicket(record.id)
      setSelectedTicket(response.data)
      setDialogOpen(true)
    } catch (error) {
      console.error('Error loading ticket details:', error)
    }
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
      key={activeTab}
      dataSource={cmisFetching ? [] : Cmreports}
      columns={columns}
      loading={cmqueryLoading || cmisFetching}
    />
  )
}));
  // const items = [
  //   {
  //     key: '1',
  //     label: 'Open',
  //     children: <Table
  //       key={activeTab}
  //       dataSource={Cmreports} columns={columns}
  //       loading={cmqueryLoading} />

  //   },
  //   {
  //     key: '2',
  //     label: 'WorkDone',
  //     children: <Table
  //       key={activeTab}
  //       dataSource={Cmreports} columns={columns}
  //       loading={cmqueryLoading} />
  //   },
  //   {
  //     key: '3',
  //     label: 'Completed',
  //     children: <Table
  //       key={activeTab}
  //       dataSource={Cmreports} columns={columns}
  //       loading={cmqueryLoading} />
  //   },
  //   {
  //     key: '4',
  //     label: 'Verified',
  //     children: <Table
  //       key={activeTab}
  //       dataSource={Cmreports} columns={columns}
  //       loading={cmqueryLoading && Cmreports.length === 0} />
  //   },
  //   {
  //     key: '5',
  //     label: 'Overdue',
  //     children: <Table
  //       key={activeTab}
  //       dataSource={Cmreports} columns={columns}
  //       loading={cmqueryLoading} />
  //   }

  // ];
  const CustomLegend = () => {
    const items = [
      { name: "Open", color: "#F3657F" },
      { name: "WorkDone", color: "#6EACAA" },
      { name: "Completed", color: "#75A7F4" },
      { name: "Verified", color: "#95DD69" },
      { name: "OnHold", color: "#FE9183" },
      { name: "Redo", color: "#999999" },
      { name: "Overdue", color: "#EEAA5E" }
    ];

    return (
      <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 10 }}>
        {items.map((item) => (
          <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, background: item.color }} />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    );
  };


  return (
    <>

      <Helmet>
        <title>{getPageTitle('corrective-maintenance')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Corrective Maintenance Management`} />
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
                <Select
                  placeholder="Select location"
                  allowClear
                  style={{ width: 150 }}
                  loading={locationsLoading}
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
                  <AntButton type="primary" htmlType="submit">
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
        <Card>
          <CardContent>

            {queryLoading || isFetching ? (<Box display="flex" justifyContent="center" p={4}>
              <Spin />
            </Box>) :
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reports}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="locationcode"
                    angle={20}
                    textAnchor="end"
                    interval={0}
                  />

                  <YAxis />

                  <Tooltip />

                  <Legend content={<CustomLegend />} verticalAlign="top" align="center" />

                  <Bar dataKey="openCount" stackId="a" fill="#F3657F" />

                  <Bar dataKey="workDoneCount" stackId="a" fill="#6EACAA" />

                  <Bar dataKey="completedCount" stackId="a" fill="#75A7F4" />

                  <Bar dataKey="verifiedCount" stackId="a" fill="#95DD69" />

                  <Bar dataKey="onholdCount" stackId="a" fill="#FE9183" />

                  <Bar dataKey="redoCount" stackId="a" fill="#999999" />

                  <Bar dataKey="overdueCount" stackId="a" fill="#EEAA5E" />

                </BarChart>
              </ResponsiveContainer>
            }


          </CardContent>



        </Card>
        <Card style={{ marginTop: '20px' }}>
          <CardContent>
            <Tabs items={items} onChange={(key) => setActiveTab(key)} />
          </CardContent>
        </Card>
        <>


        </>


       

        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Ticket Details - {selectedTicket?.id}</DialogTitle>
          <DialogContent>
            {selectedTicket && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedTicket.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedTicket.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <Chip
                    label={`Priority: ${selectedTicket.priority}`}
                    sx={{ bgcolor: getPriorityColor(selectedTicket.priority), color: 'white' }}
                  />
                  <Chip label={`Status: ${selectedTicket.status}`} color={getStatusColor(selectedTicket.status)} />
                  <Chip label={`Category: ${selectedTicket.category}`} />
                </Box>
                <Typography variant="body2"><strong>Assigned To:</strong> {selectedTicket.assignedTo}</Typography>
                <Typography variant="body2"><strong>Location:</strong> {selectedTicket.location}</Typography>
                <Typography variant="body2">
                  <strong>Created At:</strong> {dayjs(selectedTicket.createdAt).format('MMM DD, YYYY HH:mm')}
                </Typography>
                {selectedTicket.completedAt && (
                  <Typography variant="body2">
                    <strong>Completed At:</strong> {dayjs(selectedTicket.completedAt).format('MMM DD, YYYY HH:mm')}
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  )
}

