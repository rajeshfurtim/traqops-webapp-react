import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { Table, Form, Select, DatePicker, Button as AntButton, Empty, Spin, Descriptions, Space, Row, Col } from 'antd'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../../config/constants'
import { useGetLocationList } from '../../../../hooks/useGetLocationList'
import { useGetbyfrequencyQuery } from '../../../../store/api/taskReport.api'
import useGetFreqencyList from '../../../../hooks/useGetFrequencyList'
import { useAuth } from '../../../../context/AuthContext'
import { useLocation } from 'react-router-dom'
import { useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack";


const { RangePicker } = DatePicker

export default function TaskReport() {
  const [form] = Form.useForm()
  const { user } = useAuth()
  const { locations, loading: locationsLoading } = useGetLocationList()
  const { freqencyList, isLoading: frequencyLoading } = useGetFreqencyList()

  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(false)
  const [shouldFetch, setShouldFetch] = useState(false)
  const location = useLocation()
  const navstate = location.state || {}
  const navigate = useNavigate()
  const defaultLocationId = 10339
  const clientId = user?.client?.id || user?.clientId

  const STATUS_MAP = {
    open: 640,
    completed: 631,
    verified: 15,
    All: -1
  }

  useEffect(() => {
    if (navstate.fromDate) {
      const statusMap = { Open: 640, Completed: 631, Verified: 15 }
      form.setFieldsValue({
        dateRange: [dayjs(navstate.fromDate), dayjs(navstate.toDate)],
        location: navstate.locationId,
        frequencyId: navstate.frequencyId,
        statusId: STATUS_MAP[navstate.statusType]
      })

      setFilters({
        fromDate: navstate.fromDate,
        toDate: navstate.toDate,
        location: navstate.locationId,
        frequencyId: navstate.frequencyId,
        statusId: statusMap[navstate.statusType],
        pn: 1,
        ps: 1000
      })

      // setShouldFetch(true)
    }
  }, [navstate])

  const { data: reportData, isLoading: isInitialLoading, isFetching } = useGetbyfrequencyQuery(
    { ...filters, clientId },
    { skip: !filters.fromDate || !filters.toDate || !filters.locationId || !shouldFetch }
  )
  const queryLoading = isInitialLoading || isFetching

  const reports = (reportData?.data || []).map((item, index) => {

  const checklistName = item.scheduledCheckListDtos?.[0]?.checkListName || "-"

  return {
    _rowKey: index,
    index,
    sno: index + 1,
    raw: item,
    pmTaskId: item.pmTaskId,
    task: item.taskName || "-",
    location: item.locationName || "-",
    startdate: item.startDate ? dayjs(item.startDate).format("DD-MM-YYYY") : "-",
    enddate: item.endDate ? dayjs(item.endDate).format("DD-MM-YYYY") : "-",
    category: item.categoryName || "-",
    checklist: checklistName,
    status: item.taskStatus,
    notlive: item.notLiveCount || 0,
    open: item.openCount || 0,
    completed: item.completedCount || 0,
    verified: item.verifiedCount || 0
  }

})

  const stringSorter = (key) => (a, b) =>
    (a[key] || "").localeCompare(b[key] || "")

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, width: '100%' }}
        />
        <Box display="flex" gap={8}>
          <AntButton type="primary" size="small" onClick={confirm}>Search</AntButton>
          <AntButton size="small" onClick={clearFilters}>Reset</AntButton>
        </Box>
      </div>
    ),
    onFilter: (value, record) =>
      record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase())
  })

  const columns = [
    { title: 'S.No', dataIndex: 'sno', key: 'sno', ...getColumnSearchProps('sno'), sorter: (a, b) => a.sno - b.sno },
    { title: 'Task', dataIndex: 'task', key: 'task', ...getColumnSearchProps('task'), sorter: stringSorter("task") },
    { title: 'Location', dataIndex: 'location', key: 'location', ...getColumnSearchProps('location'), sorter: stringSorter("location") },
    {
      title: 'Start Date', dataIndex: 'startdate', key: 'date', ...getColumnSearchProps('startdate'), sorter: (a, b) =>
        dayjs(a.startdate, "DD-MM-YYYY").unix() - dayjs(b.startdate, "DD-MM-YYYY").unix(),
    },
    {
      title: 'End Date', dataIndex: 'enddate', key: 'enddate', ...getColumnSearchProps('enddate'), sorter: (a, b) =>
        dayjs(a.enddate, "DD-MM-YYYY").unix() - dayjs(b.enddate, "DD-MM-YYYY").unix(),
    },
    { title: 'System', dataIndex: 'category', key: 'category', ...getColumnSearchProps('category'), sorter: stringSorter("category") },
    {title:'Category', dataIndex: 'checklist',key: 'checklist',sorter: stringSorter("checklist")},
    { title: 'CheckList', dataIndex: 'status', key: 'status', ...getColumnSearchProps('status'), sorter: stringSorter("status") },
    {
      title: 'Asset Status',
      children: [
        { title: 'Not Live', dataIndex: 'notlive', key: 'notlive' },
        { title: 'Open', dataIndex: 'open', key: 'open' },
        { title: 'Completed', dataIndex: 'completed', key: 'completed' },
        { title: 'Verified', dataIndex: 'verified', key: 'verified' }
      ]
    },
  ]

  const expandedRowRender = record => (
    <Descriptions bordered size="small" column={2}>
      <Descriptions.Item label="Fault Category">{record.raw?.faultCategory?.name || "-"}</Descriptions.Item>
      <Descriptions.Item label="Fault Subcategory">{record.raw?.faultSubCategory?.name || "-"}</Descriptions.Item>
    </Descriptions>
  )

  const handleApplyFilters = values => {
    setFilters({
      fromDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      toDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
      locationId: values.location ?? defaultLocationId,
      frequencyId: values.frequencyId ?? -1,
      statusId: values.statusId ?? -1,
      pn: 1,
      ps: 1000
    })
    setShouldFetch(true)
  }
  const handleResetFilters = () => {
    form.resetFields()
    setFilters({
      fromDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
      toDate: dayjs().format('YYYY-MM-DD'),
    })
  }



  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/tasks/ScheduledDetaisPages/TaskReport')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Schedule Maintenance`} />
      </Helmet>

      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight="bold">
            Schedule Maintenance
          </Typography>

          <AntButton
            type="primary"
            icon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
          >
            Back
          </AntButton>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form form={form} layout="vertical" onFinish={handleApplyFilters}>
              <Row gutter={[16, 16]} wrap={false}>
                <Col flex="1">
                  <Form.Item name="dateRange" label="Date Range">
                    <RangePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col flex="1">
                  <Form.Item name="location" label="Location">
                    <Select style={{ width: "100%" }} allowClear loading={locationsLoading}>
                      <Select.Option value={-1}>All Location</Select.Option>
                      {locations?.map((loc) => (
                        <Select.Option key={loc.id} value={loc.id}>
                          {loc.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col flex="1">
                  <Form.Item name="frequencyId" label="Frequency">
                    <Select style={{ width: "100%" }} allowClear loading={frequencyLoading}>
                      <Select.Option value={-1}>All Frequency</Select.Option>
                      {freqencyList?.map((fre) => (
                        <Select.Option key={fre.id} value={fre.id}>
                          {fre.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col flex="1">
                  <Form.Item name="statusId" label="Status">
                    <Select style={{ width: "100%" }} allowClear>
                      <Select.Option value={-1}>All Status</Select.Option>
                      <Select.Option value={640}>Open</Select.Option>
                      <Select.Option value={631}>Completed</Select.Option>
                      <Select.Option value={15}>Verified</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col flex="1" style={{ display: "flex", alignItems: "center" }}>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Space>
                      <AntButton type="primary" htmlType="submit" loading={queryLoading}>
                        Apply Filters
                      </AntButton>
                      <AntButton htmlType="button" onClick={handleResetFilters}>
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
            {!shouldFetch ? (
              <Empty description="Please apply filters to view the report" />
            ) : queryLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <>
                <Table
                  dataSource={reports}
                  columns={columns}
                  rowKey="_rowKey"
                  expandable={{ expandedRowRender }}
                  pagination={{ pageSize: 20 }}
                  scroll={{ x: "max-content", y: 450 }}
                  bordered
                  onRow={(record) => ({
                    onClick: () => {
                      navigate(
                        "/reports/tasks/ScheduledDetails/TaskReportDetails",
                        {
                          state: { pmTaskId: record.pmTaskId },
                        }
                      );
                    },
                  })}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}