import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, Col, Row, Statistic, Table, Tag, Typography } from 'antd'
import { APP_CONFIG, getPageTitle } from '../config/constants'
import {
  CYCLIC_CHECK_NOTIFICATION_PATH,
  useSidebarNotifications
} from '../context/SidebarNotificationContext'

const { Title, Text } = Typography

const mockCyclicCheckData = [
  {
    id: 1,
    itemCode: 'INV-001',
    itemName: 'Bearing 6205 ZZ',
    location: 'Central Store',
    systemQty: 120,
    physicalQty: 118,
    checkedOn: '2026-03-18',
    checkedBy: 'Ravi Kumar',
    status: 'Mismatch'
  },
  {
    id: 2,
    itemCode: 'INV-002',
    itemName: 'Copper Cable 4sqmm',
    location: 'Electrical Store',
    systemQty: 240,
    physicalQty: 240,
    checkedOn: '2026-03-18',
    checkedBy: 'Meena S',
    status: 'Matched'
  },
  {
    id: 3,
    itemCode: 'INV-003',
    itemName: 'MCB 32A',
    location: 'Panel Room Store',
    systemQty: 60,
    physicalQty: 57,
    checkedOn: '2026-03-19',
    checkedBy: 'Arun P',
    status: 'Mismatch'
  },
  {
    id: 4,
    itemCode: 'INV-004',
    itemName: 'PVC Tape',
    location: 'Central Store',
    systemQty: 300,
    physicalQty: 300,
    checkedOn: '2026-03-19',
    checkedBy: 'Nisha R',
    status: 'Matched'
  }
]

const columns = [
  {
    title: 'Item Code',
    dataIndex: 'itemCode',
    key: 'itemCode'
  },
  {
    title: 'Item Name',
    dataIndex: 'itemName',
    key: 'itemName'
  },
  {
    title: 'Location',
    dataIndex: 'location',
    key: 'location'
  },
  {
    title: 'System Qty',
    dataIndex: 'systemQty',
    key: 'systemQty',
    align: 'right'
  },
  {
    title: 'Physical Qty',
    dataIndex: 'physicalQty',
    key: 'physicalQty',
    align: 'right'
  },
  {
    title: 'Difference',
    key: 'difference',
    align: 'right',
    render: (_, record) => record.physicalQty - record.systemQty
  },
  {
    title: 'Checked On',
    dataIndex: 'checkedOn',
    key: 'checkedOn'
  },
  {
    title: 'Checked By',
    dataIndex: 'checkedBy',
    key: 'checkedBy'
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (value) =>
      value === 'Matched' ? <Tag color="success">Matched</Tag> : <Tag color="warning">Mismatch</Tag>
  }
]

export default function InventoryCyclicCheck() {
  const { setBadgeCount } = useSidebarNotifications()
  const totalItems = mockCyclicCheckData.length
  const matchedCount = mockCyclicCheckData.filter((item) => item.status === 'Matched').length
  const mismatchCount = totalItems - matchedCount

  // Update sidebar badge for this path (replace mismatchCount with API pending count)
  useEffect(() => {
    setBadgeCount(CYCLIC_CHECK_NOTIFICATION_PATH, mismatchCount)
  }, [mismatchCount, setBadgeCount])

  return (
    <>
      <Helmet>
        <title>{getPageTitle('inventory/cyclic-check')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Cyclic Check`} />
      </Helmet>

      <div>
        <Title level={4} style={{ marginBottom: 8 }}>
          Cyclic Check
        </Title>
        <Text type="secondary">Mock data preview for inventory cyclic stock verification.</Text>

        <Row gutter={16} style={{ marginTop: 16, marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Total Checked Items" value={totalItems} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Matched Items" value={matchedCount} valueStyle={{ color: '#389e0d' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Mismatched Items" value={mismatchCount} valueStyle={{ color: '#d48806' }} />
            </Card>
          </Col>
        </Row>

        <Card>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={mockCyclicCheckData}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </div>
    </>
  )
}
