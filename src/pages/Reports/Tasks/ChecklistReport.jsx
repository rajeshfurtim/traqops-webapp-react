import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { Col, Row, Statistic, Table, Tag, Form, DatePicker, Button as AntButton, Space, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { APP_CONFIG, getPageTitle } from '../../../config/constants'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const mockChecklistRows = [
  {
    id: 1,
    checklistName: 'Chiller Daily Inspection',
    asset: 'CH-01 East Plant',
    location: 'Mechanical Room A',
    completedItems: 12,
    totalItems: 14,
    lastRun: '2026-03-19',
    performedBy: 'Karthik R',
    status: 'Partial'
  },
  {
    id: 2,
    checklistName: 'Electrical Panel AM Check',
    asset: 'EP-L2-B',
    location: 'Level 2 Electrical',
    completedItems: 20,
    totalItems: 20,
    lastRun: '2026-03-19',
    performedBy: 'Ananya V',
    status: 'Complete'
  },
  {
    id: 3,
    checklistName: 'Fire Safety Weekly',
    asset: 'Site Wide',
    location: 'Main Building',
    completedItems: 8,
    totalItems: 10,
    lastRun: '2026-03-18',
    performedBy: 'Suresh M',
    status: 'Partial'
  },
  {
    id: 4,
    checklistName: 'HVAC Filter Change Log',
    asset: 'AHU-04',
    location: 'Lobby Zone',
    completedItems: 6,
    totalItems: 6,
    lastRun: '2026-03-17',
    performedBy: 'Priya N',
    status: 'Complete'
  }
]

const statusTag = (status) => {
  if (status === 'Complete') return <Tag color="success">Complete</Tag>
  if (status === 'Partial') return <Tag color="warning">Partial</Tag>
  return <Tag>Pending</Tag>
}

const columns = [
  { title: 'Checklist', dataIndex: 'checklistName', key: 'checklistName' },
  { title: 'Asset', dataIndex: 'asset', key: 'asset' },
  { title: 'Location', dataIndex: 'location', key: 'location' },
  {
    title: 'Progress',
    key: 'progress',
    align: 'center',
    render: (_, r) => `${r.completedItems} / ${r.totalItems}`
  },
  { title: 'Last Run', dataIndex: 'lastRun', key: 'lastRun' },
  { title: 'Performed By', dataIndex: 'performedBy', key: 'performedBy' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v) => statusTag(v)
  }
]

export default function ChecklistReport() {

  const dummyData = [
    {id:1, name: 'Test 1'},
    {id:2, name: 'Test 2'},
    {id:3, name: 'Test 3'},
    {id:4, name: 'Test 4'}
  ]

  const [form] = Form.useForm()

  const complete = mockChecklistRows.filter((r) => r.status === 'Complete').length
  const partial = mockChecklistRows.filter((r) => r.status === 'Partial').length

  const handleFilterChange = (values) => {
    console.log('Filter values:', values)
  }

  const handleResetFilters = () => {
    form.resetFields()
  }

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/tasks/checklist-report')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - CheckList Report`} />
      </Helmet>

      <div>
        {/* <Title level={4} style={{ marginBottom: 8 }}>
          CheckList Report
        </Title>
        <Text type="secondary">Mock data preview — replace with API integration when ready.</Text> */}

        {/* <Row gutter={16} style={{ marginTop: 16, marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Checklists (mock)" value={mockChecklistRows.length} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Completed" value={complete} valueStyle={{ color: '#389e0d' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Partial" value={partial} valueStyle={{ color: '#d48806' }} />
            </Card>
          </Col>
        </Row> */}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form form={form} layout="vertical" onFinish={handleFilterChange}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Date"
                    name="date"
                    rules={[{ required: true, message: 'Please select date range!' }]}
                  >
                    <RangePicker style={{ width: '100%' }}
                      format={'DD/MM/YYYY'}
                      disabledDate={(current) =>
                        current && current > dayjs().endOf('day')
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Location"
                    name="location"
                    rules={[{ required: true, message: 'Please select location!' }]}
                  >
                    <Select
                      placeholder="Select Location"
                    >
                      {dummyData?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Frequency"
                    name="frequency"
                    rules={[{ required: true, message: 'Please select frequency!' }]}
                  >
                    <Select
                      placeholder="Select Frequency"
                    >
                      {dummyData?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Checklist"
                    name="checklist"
                    rules={[{ required: true, message: 'Please select checklist!' }]}
                  >
                    <Select
                      placeholder="Select Checklist"
                    >
                      {dummyData?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Asset Category"
                    name="assetCategory"
                    rules={[{ required: true, message: 'Please select asset category!' }]}
                  >
                    <Select
                      placeholder="Select Asset Category"
                    >
                      {dummyData?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Asset"
                    name="asset"
                    rules={[{ required: true, message: 'Please select asset!' }]}
                  >
                    <Select
                      placeholder="Select Asset"
                    >
                      {dummyData?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={24} lg={6}>
                  <Form.Item label=" ">
                    <Space>
                      <AntButton type="primary" htmlType="submit"
                        icon={<SearchOutlined />}
                        // loading={toolsLoading || isFetching}
                      >Search</AntButton>
                      <AntButton onClick={handleResetFilters}>Reset</AntButton>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={mockChecklistRows}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </div>
    </>
  )
}
