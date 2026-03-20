import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Empty, Input, Tag, Descriptions, Spin, Row, Col, Tooltip, message } from 'antd'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetLocationwiseQuery } from '../../../store/api/taskReport.api'
import { useAuth } from '../../../context/AuthContext'
import { SearchOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'

const { RangePicker } = DatePicker

export default function ScheduledMaintenanceDetailsReports() {
  const [form] = Form.useForm()
  const { user } = useAuth()
  const { locations, loading: locationsLoading } = useGetLocationList()
  const [shouldFetch, setShouldFetch] = useState(false)
  const [current, setCurrent] = useState(1)
  const [pageSize, setPagesize] = useState(25)

  const defaultLocationId = -1
  const clientId = user?.client?.id || user?.clientId

  const [filters, setFilters] = useState({
    fromDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
    locationId: defaultLocationId,
    statusId: -1,
  })


  const { data: reportData, isLoading: isInitialLoading, isFetching } = useGetLocationwiseQuery(
    { ...filters, clientId },
    { skip: !filters.fromDate || !filters.toDate || !filters.locationId || !shouldFetch }
  )
  const queryLoading = isInitialLoading || isFetching

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
      categoryName: item.categoryName,
      status: item.status,
      task: item.task,
      ptwNo: item.ptwNo || '-',
      fromDeviceName: item.fromDeviceName || '-',
      completedBy: item.completedBy || '-',
      completedDate: item.completedDate
        ? dayjs(item.completedDate).format('DD-MM-YYYY HH:mm')
        : '-',
      isOverdue,
      raw: item,
    }
  })

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
    { title: 'Completed By', dataIndex: 'completedBy', key: 'completedBy', sorter: stringSorter("completedBy") },
    { title: 'Completed Date', dataIndex: 'completedDate', key: 'completedDate', sorter: stringSorter("completedDate") }
  ]

  const handleApplyFilters = (values) => {
    if (!clientId) {
      alert('Client ID is missing. Please check your user profile.')
      return
    }
    setShouldFetch(true)
    setFilters({
      fromDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      toDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
      locationId: values.location ?? defaultLocationId,
      statusId: values.statusId ?? -1,
    })
  }

  // Search state
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState(null);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);

    const searchValue = value.toLowerCase().trim();

    if (!searchValue) {
      setFilteredData(null);
      return;
    }

    const filtered = reportData?.data?.filter((item) =>
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
        reportData?.data,
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
        reportData?.data,
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
                statusId: -1,
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="dateRange" label="Date Range">
                    <RangePicker style={{ width: '100%' }}
                      format={'DD/MM/YYYY'}
                      disabledDate={(current) =>
                        current && current > dayjs().endOf('day')
                      }
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="location" label="Location">
                    <Select style={{ width: '100%' }} allowClear loading={locationsLoading}>
                      <Select.Option value={-1}>All Location</Select.Option>
                      {locations?.map((loc) => (
                        <Select.Option key={loc.id} value={loc.id}>
                          {loc.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="statusId" label="Status">
                    <Select style={{ width: '100%' }} allowClear>
                      <Select.Option value={-1}>All Status</Select.Option>
                      <Select.Option value={640}>Open</Select.Option>
                      <Select.Option value={631}>Completed</Select.Option>
                      <Select.Option value={15}>Verified</Select.Option>
                      {/* <Select.Option value={4}>Overdue</Select.Option> */}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6} style={{ display: 'flex', alignItems: 'center' }}>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Space wrap>
                      <AntButton type="primary" htmlType="submit" loading={queryLoading} icon={<SearchOutlined />}>
                        Search
                      </AntButton>
                      <AntButton
                        htmlType="button"
                        onClick={() => {
                          form.resetFields();
                          setShouldFetch(false);
                        }}
                      >
                        Reset
                      </AntButton>
                    </Space>
                  </Form.Item>
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
                    disabled={!reportData?.data || reportData?.data?.length === 0}
                  >Export Excel
                  </AntButton>
                
                  <AntButton
                    icon={<FilePdfOutlined />}
                    onClick={handleExportPDF}
                    disabled={!reportData?.data || reportData?.data?.length === 0}
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
                <Table
                  dataSource={filteredData ?? reports}
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
                    pageSizeOptions: ['25', '50', '100'],
                    showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} items`,
                    className: "custom-pagination"
                  }}
                  bordered
                />
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