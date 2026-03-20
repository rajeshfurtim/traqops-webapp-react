import { Helmet } from 'react-helmet-async'
import { Card, Col, Row, Statistic, Table, Tag, Typography } from 'antd'
import { APP_CONFIG, getPageTitle } from '../../../config/constants'

const { Title, Text } = Typography

const mockTaskRows = [
  {
    id: 'TSK-2401',
    title: 'Replace V-belt on Pump P-12',
    type: 'Corrective',
    assignee: 'Ravi K',
    dueDate: '2026-03-22',
    priority: 'High',
    status: 'Open'
  },
  {
    id: 'TSK-2402',
    title: 'Monthly calibration — Flow meter FM-03',
    type: 'Scheduled',
    assignee: 'Meena S',
    dueDate: '2026-03-25',
    priority: 'Medium',
    status: 'In Progress'
  },
  {
    id: 'TSK-2403',
    title: 'Clean condenser coils — Chiller CH-02',
    type: 'Scheduled',
    assignee: 'Arun P',
    dueDate: '2026-03-20',
    priority: 'Low',
    status: 'Completed'
  },
  {
    id: 'TSK-2404',
    title: 'Inspect valve package V-88',
    type: 'Corrective',
    assignee: 'Nisha R',
    dueDate: '2026-03-21',
    priority: 'High',
    status: 'Open'
  }
]

const priorityColor = (p) => {
  if (p === 'High') return 'red'
  if (p === 'Medium') return 'orange'
  return 'default'
}

const statusColor = (s) => {
  if (s === 'Completed') return 'success'
  if (s === 'In Progress') return 'processing'
  return 'warning'
}

const columns = [
  { title: 'Task ID', dataIndex: 'id', key: 'id', width: 120 },
  { title: 'Title', dataIndex: 'title', key: 'title' },
  { title: 'Type', dataIndex: 'type', key: 'type' },
  { title: 'Assignee', dataIndex: 'assignee', key: 'assignee' },
  { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', width: 120 },
  {
    title: 'Priority',
    dataIndex: 'priority',
    key: 'priority',
    render: (v) => <Tag color={priorityColor(v)}>{v}</Tag>
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v) => <Tag color={statusColor(v)}>{v}</Tag>
  }
]

export default function TaskReportMock() {
  const open = mockTaskRows.filter((r) => r.status === 'Open').length
  const done = mockTaskRows.filter((r) => r.status === 'Completed').length

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/tasks/task-report')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Task Report`} />
      </Helmet>

      <div>
        <Title level={4} style={{ marginBottom: 8 }}>
          Task Report
        </Title>
        <Text type="secondary">Mock data preview — replace with API integration when ready.</Text>

        <Row gutter={16} style={{ marginTop: 16, marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Tasks (mock)" value={mockTaskRows.length} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Open" value={open} valueStyle={{ color: '#d48806' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Completed" value={done} valueStyle={{ color: '#389e0d' }} />
            </Card>
          </Col>
        </Row>

        <Card>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={mockTaskRows}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </div>
    </>
  )
}
