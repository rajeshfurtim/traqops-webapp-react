import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton,Empty, Input, Tag, Descriptions, Spin } from 'antd'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetLocationwiseQuery } from '../../../store/api/taskReport.api'
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
  })


  const { data: reportData, isLoading: queryLoading } = useGetLocationwiseQuery(
    { ...filters, clientId },
    { skip: !filters.fromDate || !filters.toDate || !filters.locationId || !shouldFetch}
  )


  const reports = (reportData?.data || []).map((item, index) => {
    const isOverdue =
      !['VERIFIED', 'COMPLETED'].includes(item.status) &&
      dayjs(item.endDate).isBefore(dayjs(), 'day')

    return {
      index,
      sno: index + 1,
      startDate: item.startDate,
      endDate: item.endDate,
      location: item.locationName,
      frequency: item.frequency,
      asset: item.assetName,
      category: item.categoryName,
      status: item.status,
      ptwNo: item.ptwNo || '-',
      completedBy: item.completedBy || '-',
      completedDate: item.completedDate
        ? dayjs(item.completedDate).format('DD-MM-YYYY HH:mm')
        : '-',
      verifiedBy: item.verifiedByName || item.verifiedBy || '-',
      verifiedDate: item.verifiedDate
        ? dayjs(item.verifiedDate).format('DD-MM-YYYY HH:mm')
        : '-',
      remarks:
        item.remarks && item.remarks.trim() !== 'null null'
          ? item.remarks
          : '-',
      isOverdue,
      raw: item,
    }
  })


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
          <AntButton type="primary" size="small" onClick={() => confirm()} icon= {<SearchOutlined />}>
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


  const getStatusTag = (status, isOverdue) => {
    if (isOverdue) return <Tag color="red">OVERDUE</Tag>

    switch (status) {
      case 'VERIFIED':
        return <Tag color="green">VERIFIED</Tag>
      case 'COMPLETED':
        return <Tag color="blue">COMPLETED</Tag>
      case 'NOTLIVE':
        return <Tag color="orange">NOT LIVE</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }


  const columns = [
    { title: 'S.No', dataIndex: 'sno', key: 'sno', ...getColumnSearchProps('sno') },

    {
      title: 'Date',
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
    { title: 'Location', dataIndex: 'location', key: 'location', ...getColumnSearchProps('location') },
    { title: 'Frequency', dataIndex: 'frequency', key: 'frequency', ...getColumnSearchProps('frequency') },
    { title: 'Asset', dataIndex: 'asset', key: 'asset', ...getColumnSearchProps('asset') },
    { title: 'Category', dataIndex: 'category', key: 'category', ...getColumnSearchProps('category') },

    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => getStatusTag(record.status, record.isOverdue),
      ...getColumnSearchProps('status'),
    },

    { title: 'PTW No.', dataIndex: 'ptwNo', key: 'ptwNo', ...getColumnSearchProps('ptwNo') },
    { title: 'Completed By', dataIndex: 'completedBy', key: 'completedBy', ...getColumnSearchProps('completedBy') },
    { title: 'Completed By', dataIndex: 'verifiedBy', key: 'verifiedBy1', ...getColumnSearchProps('verifiedBy') },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks1', ...getColumnSearchProps('remarks') },
    { title: 'Completed Date', dataIndex: 'completedDate', key: 'completedDate', ...getColumnSearchProps('completedDate') },
    { title: 'Verified By', dataIndex: 'verifiedBy', key: 'verifiedBy2', ...getColumnSearchProps('verifiedBy') },
    { title: 'Verified Date', dataIndex: 'verifiedDate', key: 'verifiedDate', ...getColumnSearchProps('verifiedDate') },
    { title: 'Remark', dataIndex: 'remarks', key: 'remarks2', ...getColumnSearchProps('remarks') },
  ]


  const expandedRowRender = (record) => (
    <Descriptions bordered size="small" column={2}>
      <Descriptions.Item label="Task">{record.raw.task}</Descriptions.Item>
      <Descriptions.Item label="Performed By">{record.raw.performedBy}</Descriptions.Item>
      <Descriptions.Item label="Asset Code">{record.raw.assetcode}</Descriptions.Item>
      <Descriptions.Item label="Location ID">{record.raw.locationId}</Descriptions.Item>
      <Descriptions.Item label="PM ID">{record.raw.pmId}</Descriptions.Item>
      <Descriptions.Item label="Category">{record.raw.categoryName}</Descriptions.Item>
    </Descriptions>
  )


  const handleApplyFilters = (values) => {
    if(!clientId) {
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

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/tasks/scheduled')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Scheduled Maintenance Reports Details`} />
      </Helmet>

      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Scheduled Maintenance Reports Details
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
                <AntButton htmlType="button" onClick={() => { form.resetFields()
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
            ):
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
                rowClassName={(record) =>
                  record.isOverdue ? 'overdue-row' : ''
                }
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