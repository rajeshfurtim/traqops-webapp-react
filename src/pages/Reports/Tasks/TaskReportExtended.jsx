import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent, Typography } from '@mui/material'
import { Form, Select, Space, Button as AntButton, Row, Col, Spin, DatePicker, Table, Empty } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationListQuery } from '../../../store/api/masterSettings.api'
import { useGetSystemCategorysQuery, useGetTaskDetailedReportQuery } from '../../../store/api/taskReport.api'
import { useAuth } from '../../../context/AuthContext'
import dayjs from 'dayjs'
import './style.css'
const { RangePicker } = DatePicker
export default function TaskReportExtended() {
  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId
  const [form] = Form.useForm()
  const [filters, setFilters] = useState({})
  const [systemValue, setSystemValue] = useState()
  const systemList = [
    { id: 'ECS', name: 'ECS' },
    { id: 'TVS', name: 'TVS' }
  ]
  const { data: categoryList, isLoading: categoryLoading } = useGetSystemCategorysQuery({ clientId, system: systemValue }, { skip: !systemValue })
  const { data: locationList } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: reportData, isLoading: reportLoading, isFetching } =
  useGetTaskDetailedReportQuery(
      {
        ...filters,
      },
      {
        skip: !filters.locationId || !filters.system
      }
    )
    const taskreport = reportData?.data || {};
  useEffect(() => {
    form.setFieldsValue({
      date: [dayjs().startOf('month'), dayjs()],
    })
  }, [])
  const handleFilterChange = (values) => {
    console.log('Filter values:', values)
    const newFilters = {}
    if (values.date) {
      newFilters.fromDate = dayjs(values.date[0]).format('YYYY-MM-DD')
      newFilters.toDate = dayjs(values.date[1]).format('YYYY-MM-DD')
    }
    if (values.location) newFilters.locationId = values.location
    if (values.category && values.category !== 'ALL') newFilters.categoryId = values.category
    if (values.system) newFilters.system = values.system
    setFilters(newFilters)
  }
  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }
  const handleSystemChange = (value) => {
    console.log('System value:', value)
    form.setFieldsValue({
      category: 'ALL'
    })
    setSystemValue(value)
  }

  const getDotClassByStatus = (status) => {
    if (status === 'Running') return 'dot-running'
    if (status === 'Not Running') return 'dot-standby'
    if (status === 'Breakdown') return 'dot-breakdown'
    return 'dot-default'
  }

  const getStatusLabelByStatus = (status) => {
    if (status === 'Running') return 'Online'
    if (status === 'Not Running') return 'Standby'
    if (status === 'Breakdown') return 'Breakdown'
    return 'Unknown'
  }

  const cmColumns = [
    { title: 'S.No', dataIndex: 'sno', key: 'sno', width: 90 },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 160,
      render: (val) => val || '-',
    },
    {
      title: 'System',
      dataIndex: 'system',
      key: 'system',
      width: 160,
      render: (val) => val || '-',
    },
    {
      title: 'Asset Category',
      dataIndex: 'category',
      key: 'category',
      width: 180,
      render: (val) => val || '-',
    },
    {
      title: 'Asset',
      dataIndex: 'asset',
      key: 'asset',
      width: 200,
      render: (val) => val || '-',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (val) => val || '-',
    },
  ]

  /* {taskreport?.pm?.map((pm, pmIndex) => {
    const pmAssets = Array.isArray(pm?.assets) ? pm.assets : []
    const pmData = pmAssets.map((asset, index) => ({
      ...asset,
      key: asset?.id ?? index,
    }))

    const pmColumns = [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 180,
        render: (_, record) => (
          <span className="pm-id-cell">
            <span
              className={`status-dot ${getDotClassByStatus(record?.status)}`}
              aria-label={record?.status || 'Unknown'}
            />
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span>{record?.id ?? '-'}</span>
                            <span className="pm-status-text">{getStatusLabelByStatus(record?.status)}</span>
                          </span>
          </span>
        ),
      },
      {
        title: 'WEEKLY',
        children: [
          {
            title: 'Done Date',
            dataIndex: 'weeklyDone',
            key: 'weeklyDone',
            render: (val) => val || '-',
          },
          {
            title: 'Due Date',
            dataIndex: 'weeklyDue',
            key: 'weeklyDue',
            render: (val) => val || '-',
          },
        ],
      },
      {
        title: 'MONTHLY',
        children: [
          {
            title: 'Done Date',
            dataIndex: 'monthlyDone',
            key: 'monthlyDone',
            render: (val) => val || '-',
          },
          {
            title: 'Due Date',
            dataIndex: 'monthlyDue',
            key: 'monthlyDue',
            render: (val) => val || '-',
          },
        ],
      },
      {
        title: 'QUARTERLY',
        children: [
          {
            title: 'Done Date',
            dataIndex: 'quarterlyDone',
            key: 'quarterlyDone',
            render: (val) => val || '-',
          },
          {
            title: 'Due Date',
            dataIndex: 'quarterlyDue',
            key: 'quarterlyDue',
            render: (val) => val || '-',
          },
        ],
      },
      {
        title: 'HALF-YEARLY',
        children: [
          {
            title: 'Done Date',
            dataIndex: 'halfDone',
            key: 'halfDone',
            render: (val) => val || '-',
          },
          {
            title: 'Due Date',
            dataIndex: 'halfDue',
            key: 'halfDue',
            render: (val) => val || '-',
          },
        ],
      },
      {
        title: 'YEARLY',
        children: [
          {
            title: 'Done Date',
            dataIndex: 'yearlyDone',
            key: 'yearlyDone',
            render: (val) => val || '-',
          },
          {
            title: 'Due Date',
            dataIndex: 'yearlyDue',
            key: 'yearlyDue',
            render: (val) => val || '-',
          },
        ],
      },
    ] */
      const pmColumns = [
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          width: 180,
          render: (_, record) => (
            <span className="pm-id-cell">
              <span
                className={`status-dot ${getDotClassByStatus(record?.status)}`}
                aria-label={record?.status || 'Unknown'}
              />
              <span>{record?.id ?? '-'}</span>
            </span>
          ),
        },
        {
          title: 'WEEKLY',
          children: [
            {
              title: 'Done Date',
              dataIndex: 'weeklyDone',
              key: 'weeklyDone',
              render: (val) => val || '-',
            },
            {
              title: 'Due Date',
              dataIndex: 'weeklyDue',
              key: 'weeklyDue',
              render: (val) => val || '-',
            },
          ],
        },
        {
          title: 'MONTHLY',
          children: [
            {
              title: 'Done Date',
              dataIndex: 'monthlyDone',
              key: 'monthlyDone',
              render: (val) => val || '-',
            },
            {
              title: 'Due Date',
              dataIndex: 'monthlyDue',
              key: 'monthlyDue',
              render: (val) => val || '-',
            },
          ],
        },
        {
          title: 'QUARTERLY',
          children: [
            {
              title: 'Done Date',
              dataIndex: 'quarterlyDone',
              key: 'quarterlyDone',
              render: (val) => val || '-',
            },
            {
              title: 'Due Date',
              dataIndex: 'quarterlyDue',
              key: 'quarterlyDue',
              render: (val) => val || '-',
            },
          ],
        },
        {
          title: 'HALF-YEARLY',
          children: [
            {
              title: 'Done Date',
              dataIndex: 'halfDone',
              key: 'halfDone',
              render: (val) => val || '-',
            },
            {
              title: 'Due Date',
              dataIndex: 'halfDue',
              key: 'halfDue',
              render: (val) => val || '-',
            },
          ],
        },
        {
          title: 'YEARLY',
          children: [
            {
              title: 'Done Date',
              dataIndex: 'yearlyDone',
              key: 'yearlyDone',
              render: (val) => val || '-',
            },
            {
              title: 'Due Date',
              dataIndex: 'yearlyDue',
              key: 'yearlyDue',
              render: (val) => val || '-',
            },
          ],
        },
      ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/inventory/spare-usage')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Spare Usage Reports`} />
      </Helmet>
      <Box>
        {/* <Typography variant="h4" gutterBottom fontWeight="bold">
          Spare Usage Reports
        </Typography> */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              onFinish={handleFilterChange}
              layout="vertical"
            >
              <Row gutter={[16, 16]}>
                {/* Date */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Date"
                    name="date"
                    rules={[{ required: true, message: 'Please select date range!' }]}
                  >
                    <RangePicker
                      style={{ width: "100%" }}
                      format={'DD/MM/YYYY'}
                      disabledDate={(current) =>
                        current && current > dayjs().endOf('day')
                      }
                    />
                  </Form.Item>
                </Col>
                {/* Location */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Location"
                    name="location"
                    rules={[{ required: true, message: 'Please select location!' }]}
                  >
                    <Select placeholder="Select Location">
                      {locationList?.data?.content?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="System"
                    name="system"
                    rules={[{ required: true, message: 'Please select system!' }]}
                  >
                    <Select placeholder="Select System"
                    onChange={handleSystemChange}
                    >
                      {systemList?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                {/* Inventory */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ required: true, message: 'Please select Category!' }]}
                  >
                    <Select placeholder="Select Category" loading={categoryLoading}>
                      <Select.Option value="ALL">
                        All
                      </Select.Option>
                      {categoryList?.data?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                {/* Buttons */}
                <Col xs={24} sm={24} md={24} lg={6}>
                  <Form.Item>
                    <Space>
                      <AntButton
                        type="primary"
                        htmlType="submit"
                        loading={reportLoading || isFetching}
                        icon={<SearchOutlined />}
                      >
                        Search
                      </AntButton>
                      <AntButton onClick={handleResetFilters}>
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
            {reportLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <>
                {(!taskreport?.pm?.length && !taskreport?.cm?.length) ? (
                  <Box textAlign="center" p={5}>
                    <Empty description="No Data Available" />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      flexWrap: 'wrap',
                      mb: 2,
                      mt: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      Legend:
                    </Typography>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                      <span className="status-dot dot-running" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Online
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                      <span className="status-dot dot-standby" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Standby
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                      <span className="status-dot dot-breakdown" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Breakdown
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/*== PM SECTION == */}
                {taskreport?.pm?.map((pm, pmIndex) => {
                  const pmAssets = Array.isArray(pm?.assets) ? pm.assets : []
                  const pmData = pmAssets.map((asset, index) => ({
                    ...asset,
                    key: asset?.id ?? index,
                  }))

                  return (
                    <div key={pmIndex} style={{ marginBottom: 30 }}>
                      <Box sx={{ textAlign: 'center', mb: 1 }}>
                        <h4 style={{ margin: 0 }}>PM - {pm?.category}</h4>
                      </Box>
                      <Table
                        size="small"
                        bordered
                        pagination={false}
                        rowKey="key"
                        dataSource={pmData}
                        columns={pmColumns}
                        scroll={{ x: 'max-content' }}
                      />
                    </div>
                  )
                })}

                {/*== CM SECTION == */}
                {taskreport?.cm?.length > 0 && (
                  <div style={{ marginTop: 30 }}>
                    <div style={{ textAlign: 'center', marginBottom: 10 }}>
                      <h4>CM</h4>
                    </div>
                    <Table
                      size="small"
                      bordered
                      pagination={false}
                      rowKey={(row, index) => row?.key ?? index}
                      dataSource={(taskreport?.cm || []).map((cm, index) => ({
                        ...cm,
                        key: cm?.id ?? index,
                        sno: index + 1,
                      }))}
                      columns={cmColumns}
                      scroll={{ x: 'max-content' }}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}