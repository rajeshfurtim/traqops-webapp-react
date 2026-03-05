import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress, duration } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Empty, Input, Tag, Descriptions, Spin } from 'antd'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGettaskReportSummarycmQuery } from '../../../store/api/taskReport.api'
import { useAuth } from '../../../context/AuthContext'
import { SearchOutlined } from '@ant-design/icons'

const { RangePicker } = DatePicker

export default function ScheduledMaintenanceDetailsReports() {
  const [form] = Form.useForm()
  const { user } = useAuth()
  const { locations, loading: locationsLoading } = useGetLocationList()
  const [loading, setLoading] = useState(false)
  const [shouldFetch, setShouldFetch] = useState(false)

  const defaultLocationId = 10339
  const clientId = user?.client?.id || user?.clientId

  const [filters, setFilters] = useState({
    fromDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
    locationId: defaultLocationId,
    statusId: -1,
    pn: 1,
    ps: 1000,
  })


  const { data: reportData, isLoading: queryLoading } = useGettaskReportSummarycmQuery(
    { ...filters, clientId },
    { skip: !filters.fromDate || !filters.toDate || !filters.locationId || !shouldFetch }
  )


  const reports = (reportData?.data?.content || []).map((item, index) => {
    const remark = item.breakDownRemarks?.[0] || {};

    return {
      index,
      sno: index + 1,
      raw: item,
      createdname: item.location?.code || "-",
      date: item.createdAt || "-",
      location: item.location?.name || "-",
      faultid: item.cmKey || "-",
      system: item.systemName || "-",
      ptwno: remark.ptwNo || "-",
      Equipment: item.category?.name || "-",
      itemcode: item.assets?.itemCode || "-",
      faultcategory: item.faultCategory?.name || "-",
      faultsubcategory: item.faultSubCategory?.name || "-",
      status: item.status?.name || "-",
      assignedto: item.assignedTo?.firstName || "-",
      workdoneremark: remark.remarks || "-",
      completedby: remark.completedBy?.firstName || "-",
      completeddate: remark.createdAt || "-",
      completedremark: remark.remarks || "-",
      verifyby: remark.verifiedBy || "-",
      verifieddate: "-",
      verifiedremark: "-",
      closingdate: item.updatedAt || "-",
      remarks: remark.remarks || "-",
      duration: item.duration || "0"
    };
  });


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
          <AntButton type="primary" size="small" onClick={() => confirm()} icon={<SearchOutlined />}>
            Search
          </AntButton>
          <AntButton size="small" onClick={() => clearFilters()}>
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
    { title: 'S.No', dataIndex: 'sno', key: 'sno', ...getColumnSearchProps('sno') },
    { title: 'Created Name', dataIndex: 'createdname', key: 'createdname', ...getColumnSearchProps('createdname') },
    { title: 'Date', dataIndex: 'date', key: 'date', ...getColumnSearchProps('date') },
    { title: 'Location', dataIndex: 'location', key: 'location', ...getColumnSearchProps('location') },
    { title: 'Fault ID', dataIndex: 'faultid', key: 'faultid', ...getColumnSearchProps('faultid') },
    { title: 'System.No', dataIndex: 'system', key: 'system', ...getColumnSearchProps('system') },
    { title: 'PTWno', dataIndex: 'ptwno', key: 'ptwno', ...getColumnSearchProps('ptwno') },
    { title: 'Equipment', dataIndex: 'Equipment', key: 'Equipment', ...getColumnSearchProps('Equipment') },
    { title: 'Item Code', dataIndex: 'itemcode', key: 'itemcode', ...getColumnSearchProps('itemcode') },
    { title: 'Fault Category', dataIndex: 'faultcategory', key: 'faultcategory', ...getColumnSearchProps('faultcategory') },
    { title: 'Fault Subcategory', dataIndex: 'faultsubcategory', key: 'faultsubcategory', ...getColumnSearchProps('faultsubcategory') },
    { title: 'Status', dataIndex: 'status', key: 'status', ...getColumnSearchProps('status') },
    { title: 'Assigned To', dataIndex: 'assignedto', key: 'assignedto', ...getColumnSearchProps('assignedto') },
    { title: 'Workdone Remark', dataIndex: 'workdoneremark', key: 'workdoneremark', ...getColumnSearchProps('workdoneremark') },
    { title: 'Completed By', dataIndex: 'completedby', key: 'completedby', ...getColumnSearchProps('completedby') },
    { title: 'Completed Date', dataIndex: 'completeddate', key: 'completeddate', ...getColumnSearchProps('completeddate') },
    { title: 'Completed Remark', dataIndex: 'completedremark', key: 'completedremark', ...getColumnSearchProps('completedremark') },
    { title: 'Verify By', dataIndex: 'verifyby', key: 'verifyby', ...getColumnSearchProps('verifyby') },
    { title: 'Verified Date', dataIndex: 'verifieddate', key: 'verifieddate', ...getColumnSearchProps('verifieddate') },
    { title: 'Verified Remark', dataIndex: 'verifiedremark', key: 'verifiedremark', ...getColumnSearchProps('verifiedremark') },
    { title: 'Closing Date', dataIndex: 'closingdate', key: 'closingdate', ...getColumnSearchProps('closingdate') },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', ...getColumnSearchProps('remarks') },
    { title: 'Duration', dataIndex: 'duration', key: 'duration', ...getColumnSearchProps('duration') },

  ]


  const expandedRowRender = (record) => (
  <Descriptions bordered size="small" column={2}>
    <Descriptions.Item label="Fault Category">
      {record.raw?.faultCategory?.name || "-"}
    </Descriptions.Item>
    <Descriptions.Item label="Fault Subcategory">
      {record.raw?.faultSubCategory?.name || "-"}
    </Descriptions.Item>
  </Descriptions>
)


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
      pn: 1,
      ps: 1000,
    })
  }

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/tasks/correctiveDetails')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Corrective Maintenance Reports Details`} />
      </Helmet>

      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Corrective Maintenance Reports Details
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              layout="inline"
              onFinish={handleApplyFilters}
              initialValues={{
                dateRange: [dayjs().subtract(1, 'day'), dayjs()],
                location: defaultLocationId,
                system: -1,
                statusId: -1,
              }}
            >
              <Form.Item name="dateRange" label="Date Range">
                <RangePicker />
              </Form.Item>

              <Form.Item name="location" label="Location">
                <Select style={{ width: 230 }} allowClear loading={locationsLoading}>
                  {locations?.map((loc) => (
                    <Select.Option key={loc.id} value={loc.id}>
                      {loc.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="system" label="System">
                <Select style={{ width: 180 }} allowClear>
                  <Select.Option value={-1}>All</Select.Option>
                  <Select.Option value={640}>VAC</Select.Option>
                  <Select.Option value={631}>TVS</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="statusId" label="Status">
                <Select style={{ width: 180 }} allowClear>
                  <Select.Option value={-1}>All</Select.Option>
                  <Select.Option value={640}>Open</Select.Option>
                  <Select.Option value={631}>Completed</Select.Option>
                  <Select.Option value={15}>Verified</Select.Option>
                  {/* <Select.Option value={4}>Overdue</Select.Option> */}
                </Select>
              </Form.Item>

              <Form.Item>
                <AntButton type="primary" htmlType="submit" loading={queryLoading}>
                  Apply Filters
                </AntButton>
              </Form.Item>
              <Form.Item>
                <AntButton htmlType="button" onClick={() => {
                  form.resetFields()
                  setShouldFetch(false)
                }}>
                  Reset
                </AntButton>
              </Form.Item>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {!shouldFetch ? (
              <Empty description="Please apply filters to view the report" />
            ) :
              queryLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <Spin />
                </Box>
              ) : (
                <Table
                  dataSource={reports}
                  columns={columns}
                  rowKey={(record, index) => index}
                  expandable={{ expandedRowRender }}
                  pagination={{ pageSize: 20 }}
                  bordered
                  scroll={{ x: 'max-content', y: 450 }}
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