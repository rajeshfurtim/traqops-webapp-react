import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, Grid } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Empty, Input, Tag, Descriptions, Spin, Row, Col, Tooltip, message } from 'antd'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetLocationwiseQuery } from '../../../store/api/taskReport.api'
import { useAuth } from '../../../context/AuthContext'
import { SearchOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import { FaClipboardList, FaExternalLinkAlt, FaCheckSquare, FaCheckCircle } from 'react-icons/fa'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'
import useGetFreqencyList from '../../../hooks/useGetFrequencyList'
import { useGetSystemCategorysQuery } from '../../../store/api/taskReport.api'


const { RangePicker } = DatePicker

export default function ScheduledMaintenanceDetailsReports() {
  const [form] = Form.useForm()
  const { user } = useAuth()
  const { locations, loading: locationsLoading } = useGetLocationList()
  const [shouldFetch, setShouldFetch] = useState(false)
  const [current, setCurrent] = useState(1)
  const [pageSize, setPagesize] = useState(25)
  const [selectedSystem, setSelectedSystem] = useState("ECS");
  const defaultLocationId = -1
  const clientId = user?.client?.id || user?.clientId
  const { freqencyList, isLoading: frequencyLoading } = useGetFreqencyList()
  const [filters, setFilters] = useState({
    fromDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
    locationId: defaultLocationId,
    statusId: -1,
    system : 'ECS'
  })


  const { data: reportData, isLoading: isInitialLoading, isFetching } = useGetLocationwiseQuery(
    { ...filters, clientId },
    { skip: !filters.fromDate || !filters.toDate || !filters.locationId || !shouldFetch }
  )
  const queryLoading = isInitialLoading || isFetching

  const { data: categories, isLoading: categoryLoading } = useGetSystemCategorysQuery(
    {
      clientId: clientId,
      system: selectedSystem
    },
    { skip: !selectedSystem }
  );
  useEffect(() => {
    setSelectedSystem("ECS");
  }, []);
  const reports = (reportData?.data || []).map((item, index) => {
    const isOverdue =
      !['VERIFIED', 'COMPLETED'].includes(item.status) &&
      dayjs(item.endDate).isBefore(dayjs(), 'day')

    return {
      index,
      sno: index + 1,
      startDate: item.startDate,
      endDate: item.endDate,
      locationName: item.locationName,
      frequency: item.frequency,
      assetName: item.assetName,
      system: item.systemName,
      categoryName: item.categoryName,
      status: item.status,
      workdoneby: item.workDoneBy || '-',
      workdonedate: item.workDoneDate || '-',
      task: item.task,
      ptwNo: item.ptwNo || '-',
      fromDeviceName: item.fromDeviceName || '-',
      completedBy: item.completedBy || '-',
      completedDate: item.completedDate
        ? dayjs(item.completedDate).format('DD-MM-YYYY HH:mm')
        : '-',
      isOverdue,
      raw: item,
      verifiedBy: item.verifiedBy || '-',
      verifiedDate: item.verifiedDate
        ? dayjs(item.verifiedDate).format('DD-MM-YYYY HH:mm')
        : '-',
      remarks: item.remarks || '-'
    }
  })

  // Search state
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState(null);

  const dataToDisplay = filteredData !== null ? filteredData : reports

  // data box count
  const summaryCounts = (dataToDisplay || []).reduce(
    (acc, item) => {
      const status = item.status?.toUpperCase();

      if (status === 'OPEN') acc.open += 1;
      else if (status === 'COMPLETED') acc.completed += 1;
      else if (status === 'WORK DONE') acc.workdone += 1;
      else if (status === 'VERIFIED') acc.verified += 1;

      acc.total += 1;

      return acc;
    },
    {
      open: 0,
      completed: 0,
      workdone: 0,
      verified: 0,
      total: 0,
    }
  );
  const totalOpen = summaryCounts.open;
  const totalCompleted = summaryCounts.completed;
  const totalVerified = summaryCounts.verified;
  const totalWorkDone = summaryCounts.workdone;
  const totalTasks = summaryCounts.total;

  const getStatusTag = (status, isOverdue) => {
    if (isOverdue) return <Tag style={{ padding: '4px 10px', borderRadius: 25 }} color="red">OVERDUE</Tag>

    switch (status) {
      case 'VERIFIED':
        return <Tag style={{ padding: '4px 10px', borderRadius: 25 }} color="green">VERIFIED</Tag>
      case 'COMPLETED':
        return <Tag style={{ padding: '4px 10px', borderRadius: 25 }} color="blue">COMPLETED</Tag>
      case 'NOTLIVE':
        return <Tag style={{ padding: '4px 10px', borderRadius: 25 }} color="orange">NOT LIVE</Tag>
      default:
        return <Tag style={{ padding: '4px 10px', borderRadius: 25 }}>{status}</Tag>
    }
  }

  /* ---------------- BOXES ---------------- */
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
      color: '#fa8c16',
      icon: <FaExternalLinkAlt size={32} color="#fa8c16" />,
    },
    {
      key: 'workdone',
      label: 'Work Done',
      value: totalWorkDone,
      color: '#722ed1',
      icon: <FaCheckSquare size={32} color="#722ed1" />,
    },
    {
      key: 'completed',
      label: 'Completed',
      value: totalCompleted,
      color: '#52c41a',
      icon: <FaCheckSquare size={32} color="#52c41a" />,
    },
    {
      key: 'verified',
      label: 'Verified',
      value: totalVerified,
      color: '#13c2c2',
      icon: <FaCheckCircle size={32} color="#13c2c2" />,
    },
  ]

  const stringSorter = (key) => (a, b) =>
    (a[key] || "").localeCompare(b[key] || "");

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 80,
      render: (_, __, index) => ((current - 1) * pageSize) + index + 1
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (_, record) => (
        <div
          style={{
            background: '#f5f5f5',
            padding: '8px 12px',
            borderRadius: 16,
            display: 'inline-flex',
            flexDirection: 'column',
            gap: 6,
            minWidth: 150,
          }}
        >
          <div
            style={{
              background: '#52c41a',
              color: '#fff',
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 500,
              width: 'fit-content',
            }}
          >
            Start&nbsp;&nbsp;
            {dayjs(record.startDate).format('DD-MM-YYYY')}
          </div>

          <div
            style={{
              background: '#ff4d4f',
              color: '#fff',
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 500,
              width: 'fit-content',
            }}
          >
            End&nbsp;&nbsp;
            {dayjs(record.endDate).format('DD-MM-YYYY')}
          </div>
        </div>
      ),
    },
    { title: 'Location', dataIndex: 'locationName', key: 'locationName', sorter: stringSorter("locationName") },
    { title: 'Frequency', dataIndex: 'frequency', key: 'frequency', sorter: stringSorter("frequency") },
    { title: 'Asset', dataIndex: 'assetName', key: 'assetName', sorter: stringSorter("assetName") },
    { title: 'System', dataIndex:'system', key:'system', sorter: stringSorter("system")},
    { title: 'Category', dataIndex: 'categoryName', key: 'categoryName', sorter: stringSorter("categoryName") },

    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => getStatusTag(record.status, record.isOverdue),
      sorter: stringSorter("status")
    },
    { title: 'Task', dataIndex: 'task', key: 'task', sorter: stringSorter("task") },
    { title: 'PTW No', dataIndex: 'ptwNo', key: 'ptwNo', sorter: stringSorter("ptwNo") },
    { title: 'Spare', dataIndex: 'fromDeviceName', key: 'fromDeviceName', sorter: stringSorter("fromDeviceName") },
    { title: 'WorkDone By', dataIndex: 'workdoneby', key: 'workdoneby', sorter: stringSorter("workdoneby") },
    { title: 'WorkDone Date', dataIndex: 'workdonedate', key: 'workdonedate', sorter: stringSorter("workdonedate") },
    { title: 'Completed By', dataIndex: 'completedBy', key: 'completedBy', sorter: stringSorter("completedBy") },
    { title: 'Completed Date', dataIndex: 'completedDate', key: 'completedDate', sorter: stringSorter("completedDate") },
    { title: 'Verified By', dataIndex: 'verifiedBy', key: 'verifiedBy', sorter: stringSorter("verifiedBy") },
    { title: 'Verified Date', dataIndex: 'verifiedDate', key: 'verifiedDate', sorter: stringSorter("verifiedDate") },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', sorter: stringSorter("remarks") },
  ]

  const handleApplyFilters = (values) => {
    if (!clientId) {
      alert('Client ID is missing. Please check your user profile.')
      return
    }
    setShouldFetch(true)
    setFilteredData(null)
    setFilters({
      fromDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      toDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
      locationId: values.location ?? defaultLocationId,
      statusId: values.statusId ?? 640,
      system: values.system,
      categoryId: values.categoryId ?? -1,
    })
  }

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);

    const searchValue = value.toLowerCase().trim();

    if (!searchValue) {
      setFilteredData(null);
      return;
    }

    const filtered = reports.filter((item) =>
      `${item?.locationName ?? ''} ${item?.frequency ?? ''} ${item?.assetName ?? ''}
          ${item?.startDate ? dayjs(item?.startDate).format('DD/MM/YYYY') : ''}
          ${item?.endDate ? dayjs(item?.endDate).format('DD/MM/YYYY') : ''}
           ${item?.categoryName ?? ''} ${item?.status ?? ''} ${item?.task ?? ''}
           ${item?.ptwNo ?? ''} ${item?.completedBy ? dayjs(item?.completedBy).format('DD/MM/YYYY') : ''}
            ${item?.completedDate ? dayjs(item?.completedDate).format('DD/MM/YYYY') : ''}
            ${item?.fromDeviceName ?? ''}`
        .toLowerCase()
        .includes(searchValue)
    );

    setFilteredData(filtered);
  };

  const [exporting, setExporting] = useState({ excel: false, pdf: false })

  const handleExportPDF = async () => {
    try {
      setExporting(prev => ({ ...prev, pdf: true }))
      const locationName = locations?.data?.content?.filter(loc => loc.id === filters.locationId)

      await exportToPDF(
        columns,
        dataToDisplay,
        `scheduled-maintenance-report (Date: ${dayjs(filters.fromDate).format('DD/MM/YYYY')} to ${dayjs(filters.toDate).format('DD/MM/YYYY')} - Location: ${locationName[0]?.name ?? 'All'})`
      )

      message.success('PDF exported successfully')
    } catch (err) {
      message.error('PDF export failed')
    } finally {
      setExporting(prev => ({ ...prev, pdf: false }))
    }
  }

  const handleExportExcel = async () => {
    try {
      setExporting(prev => ({ ...prev, excel: true }))
      const locationName = locations?.data?.content?.filter(loc => loc.id === filters.locationId)

      await exportToExcel(
        columns,
        dataToDisplay,
        `scheduled-maintenance-report (Date: ${dayjs(filters.fromDate).format('DD/MM/YYYY')} to ${dayjs(filters.toDate).format('DD/MM/YYYY')} - Location: ${locationName[0]?.name ?? 'All'} - Location: ${locationName[0]?.name ?? 'All'})`
      )

      message.success('Excel exported successfully')
    } catch (err) {
      message.error('Excel export failed')
    } finally {
      setExporting(prev => ({ ...prev, excel: false }))
    }
  }

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/tasks/scheduled')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Scheduled Maintenance Reports Details`} />
      </Helmet>

      <Box>
        {/* <Typography variant="h4" gutterBottom fontWeight="bold">
          Scheduled Maintenance Reports Details
        </Typography> */}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleApplyFilters}
              initialValues={{
                dateRange: [dayjs().subtract(1, 'day'), dayjs()],
                location: defaultLocationId,
                frequencyId: -1,
                statusId: 640,
                system: "ECS",
                categoryId: -1
              }}
            >
              <Row gutter={[16, 16]}>

                <Col span={4}>
                  <Form.Item name="dateRange" label="Date Range" rules={[{ required: true, message: 'Please select date range!' }]}
>
                    <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabledDate={(current) => current && current > dayjs().endOf('day')} />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="location" label="Location" rules={[{ required: true, message: 'Please select location!' }]}>
                    <Select allowClear loading={locationsLoading}>
                      <Select.Option value={-1}>All Location</Select.Option>
                      {locations?.map((loc) => (
                        <Select.Option key={loc.id} value={loc.id}>
                          {loc.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="statusId" label="Status" rules={[{ required: true, message: 'Please select status!' }]}>
                    <Select allowClear>
                      {/* <Select.Option value={-1}>All Status</Select.Option> */}
                      <Select.Option value={640}>Open</Select.Option>
                      <Select.Option value={631}>Completed</Select.Option>
                      <Select.Option value={15}>Verified</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="frequencyId" label="Frequency" rules={[{ required: true, message: 'Please select frequency!' }]}>
                    <Select allowClear loading={frequencyLoading}>
                      <Select.Option value={-1}>All Frequency</Select.Option>
                      {freqencyList?.map((fre) => (
                        <Select.Option key={fre.id} value={fre.id}>
                          {fre.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="system" label="System" rules={[{ required: true, message: 'Please select system!' }]}>
                    <Select
                      onChange={(value) => {
                        setSelectedSystem(value || 'ECS');
                        form.setFieldsValue({ categoryId: -1 });
                      }}
                    >
                      <Select.Option value="ECS">ECS</Select.Option>
                      <Select.Option value="TVS">TVS</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="categoryId" label="Category" rules={[{ required: true, message: 'Please select category!' }]}>
                    <Select loading={categoryLoading} allowClear>
                      <Select.Option value={-1}>All</Select.Option>
                      {(categories?.data || []).map((cat) => (
                        <Select.Option key={cat.id} value={cat.id}>
                          {cat.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                  <AntButton
                    type="primary"
                    htmlType="submit"
                    loading={queryLoading}
                    icon={<SearchOutlined />}
                    block
                  >
                    Search
                  </AntButton>
                </Col>

              </Row>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Space>
                <Input
                  placeholder="Search"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={handleSearch}
                  allowClear
                  style={{ width: 250 }}
                />

                <AntButton
                  icon={<FileExcelOutlined />}
                  onClick={handleExportExcel}
                  disabled={!dataToDisplay || dataToDisplay.length === 0}
                >Export Excel
                </AntButton>

                <AntButton
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                  disabled={!dataToDisplay || dataToDisplay.length === 0}
                >
                  Export PDF
                </AntButton>

              </Space>
            </Box>
            {!shouldFetch ? (
              <Empty description="Please apply filters to view the report" />
            ) :
              queryLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <Spin />
                </Box>
              ) : (
                <>
                  {/* SUMMARY BOXES */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {boxes.map((box) => (
                      <Grid
                        item
                        key={box.key}
                        xs={12}
                        sm={6}
                        sx={{
                          flexBasis: {
                            xs: '100%',
                            sm: '50%',
                            md: '20%',
                          },
                          maxWidth: {
                            xs: '100%',
                            sm: '50%',
                            md: '20%',
                          },
                        }}
                      >
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
                  <Table
                    dataSource={dataToDisplay}
                    columns={columns}
                    loading={queryLoading}
                    rowKey={(record, index) => index}
                    size="middle"
                    scroll={{ x: 'max-content' }}
                    pagination={{
                      position: ['bottomRight'],
                      current: current,
                      pageSize: pageSize,
                      onChange: setCurrent,
                      showSizeChanger: true,
                      onShowSizeChange: (current, size) => {
                        setPagesize(size);
                        setCurrent(current);
                      },
                      pageSizeOptions: ['25', '50', '100','500', '1000'],
                      showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} items`,
                      className: "custom-pagination"
                    }}
                    bordered
                  />
                </>
              )}
          </CardContent>
        </Card>
      </Box>

      {/* <style>
        {`
          .overdue-row {
            background-color: #fff1f0 !important;
            border-left: 4px solid red;
          }
        `}
      </style> */}
    </>
  )
}