import { useState, useMemo, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, Skeleton, Tooltip, useTheme, alpha, Chip, Grid } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Empty, Input, Tag, Descriptions, Spin, Row, Col, Tabs } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { FaClipboardList, FaExternalLinkAlt, FaCheckSquare, FaCheckCircle, FaTasks, FaClock } from 'react-icons/fa'
import CountUp from "react-countup"

import { getPageTitle, APP_CONFIG } from '../config/constants'
import { useGetEquipmentRunStatusReportQuery } from '../store/api/reports.api';
import { useGetLocationList } from '../hooks/useGetLocationList';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
const { RangePicker } = DatePicker
import { SearchOutlined } from '@ant-design/icons';
import { correctiveApi } from '../store/api/correctivemaintenance.api';
import { color } from 'framer-motion'

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

  const totalOpen = reports.reduce((sum, item) => sum + (item.openCount || 0), 0)

  const totalCompleted = reports.reduce(
    (sum, item) => sum + (item.completedCount || 0),
    0
  )

  const totalWorkDone = reports.reduce(
    (sum, item) => sum + (item.workDoneCount || 0),
    0
  )

  const totalVerified = reports.reduce(
    (sum, item) => sum + (item.verifiedCount || 0),
    0
  )

  const totalOverdue = reports.reduce(
    (sum, item) => sum + (item.overdueCount || 0),
    0
  )

  const totalTasks = totalOpen + totalCompleted + totalWorkDone + totalVerified + totalOverdue

  const boxes = [
    {
      key: 'total',
      label: 'Total Tasks',
      value: totalTasks,
      color: '#1677ff',
      icon: <FaClipboardList size={32} color="#1677ff" />,
    },
    {
      key: 'open',
      label: 'Open',
      value: totalOpen,
      color: '#21d9e2',
      icon: <FaExternalLinkAlt size={32} color="#fa8c16" />,
    },
    {
      key: 'workdone',
      label: 'Work Done',
      value: totalWorkDone,
      color: '#e998d7',
      icon: <FaExternalLinkAlt size={32} color="#fa8c16" />,
    },
    {
      key: 'completed',
      label: 'Completed',
      value: totalCompleted,
      color: '#7cf441',
      icon: <FaCheckSquare size={32} color="#52c41a" />,
    },
    {
      key: 'verified',
      label: 'Verified',
      value: totalVerified,
      color: '#1d711a',
      icon: <FaCheckCircle size={32} color="#13c2c2" />,
    },
    {
      key: 'overdue',
      label: 'OverDue',
      value: totalOverdue,
      color: '#f15030',
      icon: <FaCheckCircle size={32} color="#13c2c2" />,
    },
  ]
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
  const handleclicknavigate = (payload, statusType) => {
    navigate('/reports/tasks/ScheduledDetails/Cmreports', {
      state: {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        locationId: payload?.locationId || filters.locationId,
        locationName: payload?.location || null,
        statusType,
      }
    })
  }

  const columns = [
    {
      title: 'Fault Id',
      dataIndex: 'cmKey',
      key: 'cmKey',
      width: 120
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 180

    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 140
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
      width: 150
    },

    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const styles = {
          OPEN: {
            color: '#1677ff',
            border: '1px solid #1677ff',
            backgroundColor: '#e6f4ff',
          },
          WORKDONE: {
            color: '#722ed1',
            border: '1px solid #722ed1',
            backgroundColor: '#f9f0ff',
          },
          COMPLETED: {
            color: '#52c41a',
            border: '1px solid #52c41a',
            backgroundColor: '#f6ffed',
          },
          VERIFIED: {
            color: '#13c2c2',
            border: '1px solid #13c2c2',
            backgroundColor: '#e6fffb',
          },
          OVERDUE: {
            color: '#ff4d4f',
            border: '1px solid #ff4d4f',
            backgroundColor: '#fff2f0',

          }
        }

        const key = status?.toUpperCase()?.replace(/\s/g, '')

        return (
          <Tag style={styles[key] || {}}>
            {status}
          </Tag>
        )
      }
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
        bordered
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
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {boxes.map((box) => (
                    <Grid item xs={12} sm={6} md={2} key={box.key}>
                      <Card
                        sx={{
                          height: '100%',
                          borderRadius: 3,
                          border: `1px solid ${box.color}`,
                          backgroundColor: `${box.color}0f`,
                          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.18)',
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: '50%',
                              backgroundColor: `${box.color}1a`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {box.icon}
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}
                            >
                              {box.label}
                            </Typography>
                            <Typography
                              variant="h5"
                              fontWeight="bold"
                              sx={{ color: box.color, mt: 0.5 }}
                            >
                              {box.value}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Tabs items={items} onChange={(key) => setActiveTab(key)} />
              </>

            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

function SummaryBox({ label, value, color, icon, trend, trendValue = 0, isLoading = false, tooltip, onClick }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === "dark"
  const isPositive = trendValue >= 0

  return (
    <Tooltip title={tooltip || ""} arrow disableHoverListener={!tooltip}>
      <Box
        onClick={onClick}
        sx={{
          flex: { xs: "100%", sm: 1 },
          minWidth: { xs: "100%", sm: 180 },
          position: "relative",
          borderRadius: 4,
          p: 3,
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.35s cubic-bezier(.21,1.02,.73,1)",
          background: isDark
            ? `linear-gradient(135deg, ${alpha(color, 0.25)}, ${alpha(color, 0.15)})`
            : `linear-gradient(135deg, ${color}, ${alpha(color, 0.9)})`,
          color: "#fff",
          backdropFilter: "blur(10px)",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            padding: "1px",
            borderRadius: "inherit",
            background: `linear-gradient(135deg, ${color}, transparent)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          },
          boxShadow: isDark ? "0 10px 25px rgba(0,0,0,0.5)" : "0 8px 20px rgba(0,0,0,0.08)",
          "&:hover": {
            transform: "translateY(-6px) scale(1.02)",
            boxShadow: isDark ? `0 20px 40px ${alpha(color, 0.4)}` : `0 20px 40px ${alpha(color, 0.25)}`,
          },
          "&:active": { transform: "scale(0.97)" },
        }}
      >
        {isLoading ? (
          <>
            <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: "rgba(255,255,255,0.3)" }} />
            <Skeleton variant="text" width="60%" height={40} sx={{ mt: 1, bgcolor: "rgba(255,255,255,0.3)" }} />
            <Skeleton variant="circular" width={55} height={55} sx={{ position: "absolute", right: 20, top: 30 }} />
          </>
        ) : (
          <>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.85, letterSpacing: 1.2, fontWeight: 500 }}>{label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                <CountUp start={0} end={Number(value)} duration={1.5} separator="," />
              </Typography>
              {trend && <Typography variant="caption" sx={{ mt: 1, display: "block", color: isPositive ? "#C8FACC" : "#FFD6D6" }}>{trend}</Typography>}
            </Box>
            <Box sx={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", right: 20, top: 25 }}>
              {icon}
            </Box>
          </>
        )}
      </Box>
    </Tooltip>
  )
}