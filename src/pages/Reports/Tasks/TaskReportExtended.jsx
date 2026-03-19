import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Form, Select, Space, Button as AntButton, Row, Col, Spin, DatePicker } from 'antd'
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
                        All Category
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
                {(!taskreport?.pm?.length && !taskreport?.cm?.length) && (
                    <Box textAlign="center" p={5}>
                      <h5>No Data Available</h5>
                    </Box>
                  )}

    {/*== PM SECTION == */}
    {taskreport?.pm?.map((pm, pmIndex) => (
      <div key={pmIndex} style={{ marginBottom: 30 }}>
        <table className="report-table" style={{ width: "100%", borderCollapse: "collapse" }}>

          <thead>
            <tr>
              <th colSpan={11} style={{ textAlign: "center" }}>
                <h4>PM - {pm.category}</h4>
              </th>
            </tr>

            <tr>
              <th rowSpan={2}>ID</th>
              <th colSpan={2}>WEEKLY</th>
              <th colSpan={2}>MONTHLY</th>
              <th colSpan={2}>QUARTERLY</th>
              <th colSpan={2}>HALF-YEARLY</th>
              <th colSpan={2}>YEARLY</th>
            </tr>

            <tr>
              <th>Done Date</th>
              <th>Due Date</th>

              <th>Done Date</th>
              <th>Due Date</th>

              <th>Done Date</th>
              <th>Due Date</th>

              <th>Done Date</th>
              <th>Due Date</th>

              <th>Done Date</th>
              <th>Due Date</th>
            </tr>
          </thead>

          <tbody>
            {pm.assets?.map((asset, index) => {

              const statusClass =
                asset.status === 'Running'
                  ? 'available'
                  : asset.status === 'Not Running'
                  ? 'standBY'
                  : asset.status === 'Breakdown'
                  ? 'Breakdown'
                  : '';

              return (
                <tr key={index}>
                  <td className={statusClass}>
                    {asset.id}
                  </td>

                  <td>{asset.weeklyDone || '-'}</td>
                  <td>{asset.weeklyDue || '-'}</td>

                  <td>{asset.monthlyDone || '-'}</td>
                  <td>{asset.monthlyDue || '-'}</td>

                  <td>{asset.quarterlyDone || '-'}</td>
                  <td>{asset.quarterlyDue || '-'}</td>

                  <td>{asset.halfDone || '-'}</td>
                  <td>{asset.halfDue || '-'}</td>

                  <td>{asset.yearlyDone || '-'}</td>
                  <td>{asset.yearlyDue || '-'}</td>
                </tr>
              )
            })}
          </tbody>

        </table>
      </div>
    ))}

    {/*== CM SECTION == */}
    {taskreport?.cm?.length > 0 && (
      <div style={{ marginTop: 30 }}>

        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <h4>CM</h4>
        </div>

        <table className="report-table" style={{ width: "100%", borderCollapse: "collapse" }}>

          <thead>
            <tr>
              <th>S.No</th>
              <th>Date</th>
              <th>System</th>
              <th>Asset Category</th>
              <th>Asset</th>
              <th>Remarks</th>
            </tr>
          </thead>

          <tbody>
            {taskreport.cm.map((cm, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{cm.date}</td>
                <td>{cm.system}</td>
                <td>{cm.category}</td>
                <td>{cm.asset}</td>
                <td>{cm.remarks}</td>
              </tr>
            ))}
          </tbody>

        </table>

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