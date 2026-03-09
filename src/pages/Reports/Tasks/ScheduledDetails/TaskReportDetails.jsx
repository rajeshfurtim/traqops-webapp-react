import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { Table, Form, Empty, Spin, Tag, Modal, Descriptions , Button as AntButton} from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../../../config/constants'
import { useGetallpmtasklistQuery } from '../../../../store/api/taskReport.api'
import { useLocation } from "react-router-dom"

export default function TaskReportDetails() {
  const location = useLocation()
  const navstate = location.state || {}

  const [filters, setFilters] = useState({})
  const [shouldFetch, setShouldFetch] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)

  // Fetching pmTaskId from navigation state
  useEffect(() => {
    if (navstate?.pmTaskId) {
      setFilters({ pmTaskId: navstate.pmTaskId })
      setShouldFetch(true)
    }
  }, [navstate])

  const id = navstate?.pmTaskId
  const { data: reportData, isLoading: queryLoading } = useGetallpmtasklistQuery(
    { id },
    { skip: !id }
  )

  // Prepare table data
  const reports = (reportData?.data || []).map((item, index) => {
    const asset = item.pmAssets?.[0]?.assets || {}
    const status = item.status || {}
    const userRole = item.pmAssets?.[0]?.userRole || {}
    console.log("username" , userRole.name)
    return {
      index,
      sno: index + 1,
      raw: item,
      assetname: asset.name || "-",
      assetcode: asset.itemCode || "-",
      assetstatus: status.name || "-",
      username: userRole.name || "-",
      view: 'Asset Details'
    }
  })

  // Helper for status color
  const getStatusColor = (status) => {
    if (status === "NOTLIVE") return "red"
    if (status === "OPEN") return "orange"
    if (status === "COMPLETED") return "green"
    if (status === "VERIFIED") return "blue"
    return "default"
  }

  const handleView = (record) => {
    setSelectedAsset(record)
    setIsModalOpen(true)
  }

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
    { title: 'Asset Name', dataIndex: 'assetname', key: 'assetname', ...getColumnSearchProps('assetname'), sorter: stringSorter("assetname") },
    { title: 'Code', dataIndex: 'assetcode', key: 'assetcode', ...getColumnSearchProps('assetcode'), sorter: stringSorter("assetcode") },
    {
      title: 'Status',
      dataIndex: 'assetstatus',
      key: 'assetstatus',
      ...getColumnSearchProps('assetstatus'),
      sorter: stringSorter("assetstatus"),
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status || "-"}</Tag>
      )
    },
    {
      title: 'View',
      dataIndex: 'view',
      key: 'view',
      render: (_, record) => (
        <Tag
          color="blue"
          style={{ cursor: "pointer" }}
          onClick={() => handleView(record)}
        >
          <EyeOutlined /> Asset Details
        </Tag>
      )
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/tasks/ScheduledDetaisPages/TaskReportDetails')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - TaskReportDetails`} />
      </Helmet>

      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">Task Report Details</Typography>
        <Card>
          <CardContent>
            {!shouldFetch ? (
              <Empty description="Please apply filters to view the report" />
            ) : queryLoading ? (
              <Box display="flex" justifyContent="center" p={4}><Spin /></Box>
            ) : (
              <Table
                dataSource={reports}
                columns={columns}
                rowKey={(record, index) => index}
                pagination={{ pageSize: 20 }}
                scroll={{ x: 'max-content', y: 450 }}
                bordered
              />
            )}
          </CardContent>
        </Card>
      </Box>

      <Modal
        title="Asset Details"
        open={isModalOpen}
        centered
        footer={null}
        onCancel={() => setIsModalOpen(false)}
      >
        {selectedAsset && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Asset Name">{selectedAsset.assetname}</Descriptions.Item>
            <Descriptions.Item label="Asset Code">{selectedAsset.assetcode}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedAsset.assetstatus)}>
                {selectedAsset.assetstatus || "-"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="User">{selectedAsset.username || "-"}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  )
}