import { useState } from "react"
import { Helmet } from "react-helmet-async"
import { Box, Typography, Card, CardContent } from "@mui/material"
import { Table, Tag, Modal, Descriptions, Button as AntButton } from "antd"
import { EyeOutlined } from "@ant-design/icons"
import { getPageTitle, APP_CONFIG } from "../../../../config/constants"
import { useBypmtaskidQuery } from "../../../../store/api/taskReport.api"
import { useLocation, useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

export default function TaskReportDetails() {

  const location = useLocation()
  const navigate = useNavigate()

  const navstate = location.state || {}
  const pmtaskId = navstate?.pmTaskId
  const checkListId = navstate?.checkListId

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)

  const { data: reportData } =
    useBypmtaskidQuery(
      { pmtaskId },
      { skip: !pmtaskId }
    )

  // Prepare table data
  const reports = reportData?.data?.map((item, index) => ({
    sno: index + 1,
    assetname: item.assetsName ?? "-",
    assetcode: item.assetsCode ?? "-",
    assetstatus: item.statusName ?? "-",
    username: item.performedBy ?? "-",
    raw: item
  })) || []

  // Status color
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
          style={{ marginBottom: 8, width: "100%" }}
        />

        <Box display="flex" gap={1}>
          <AntButton type="primary" size="small" onClick={confirm}>
            Search
          </AntButton>

          <AntButton size="small" onClick={clearFilters}>
            Reset
          </AntButton>
        </Box>
      </div>
    ),
    onFilter: (value, record) =>
      record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase())
  })

  const columns = [

    {
      title: "S.No",
      dataIndex: "sno",
      key: "sno",
      sorter: (a, b) => a.sno - b.sno,
      ...getColumnSearchProps("sno")
    },

    {
      title: "Asset Name",
      dataIndex: "assetname",
      key: "assetname",
      sorter: stringSorter("assetname"),
      ...getColumnSearchProps("assetname")
    },

    {
      title: "Code",
      dataIndex: "assetcode",
      key: "assetcode",
      sorter: stringSorter("assetcode"),
      ...getColumnSearchProps("assetcode")
    },

    {
      title: "Status",
      dataIndex: "assetstatus",
      key: "assetstatus",
      sorter: stringSorter("assetstatus"),
      ...getColumnSearchProps("assetstatus"),
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status || "-"}
        </Tag>
      )
    },

    {
      title: "View",
      key: "view",
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

  const statusList = selectedAsset?.raw?.pmAssetStatusConsolidates || []

  return (
    <>
      <Helmet>
        <title>{getPageTitle("reports/tasks/ScheduledDetaisPages/TaskReportDetails")}</title>
        <meta
          name="description"
          content={`${APP_CONFIG.name} - TaskReportDetails`}
        />
      </Helmet>

      <Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>

          <Typography variant="h4" fontWeight="bold">
            Task Report Details
          </Typography>

          <AntButton
            type="primary"
            icon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
          >
            Back
          </AntButton>

        </Box>

        <Card>
          <CardContent>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
              <AntButton
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => navigate(
                  '/reports/tasks/ScheduledDetails/task-checklist',
                  {
                    state: { pmTaskId: pmtaskId, checkListId: checkListId },
                  }
                )}
                style={{ fontWeight: 500, borderRadius: "40px" }}
              >
                Checklist Details
              </AntButton>
            </div>

            <Table
              dataSource={reports}
              columns={columns}
              rowKey="sno"
              pagination={{ pageSize: 20 }}
              scroll={{ x: "max-content", y: 450 }}
              bordered
            />

          </CardContent>
        </Card>

      </Box>

      <Modal
        title="Asset Details"
        open={isModalOpen}
        centered
        footer={null}
        onCancel={() => setIsModalOpen(false)}
        width={500}
      >

        {selectedAsset && (

          <>
            <Descriptions bordered column={1} style={{ marginBottom: 20 }}>

              <Descriptions.Item label="Asset Name">
                {selectedAsset.assetname}
              </Descriptions.Item>

              <Descriptions.Item label="Asset Code">
                {selectedAsset.assetcode}
              </Descriptions.Item>

              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedAsset.assetstatus)}>
                  {selectedAsset.assetstatus || "-"}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Performed By">
                {selectedAsset.username}
              </Descriptions.Item>

            </Descriptions>

            {statusList.map((item, index) => (

              <Descriptions
                key={index}
                bordered
                column={1}
                size="small"
                style={{ marginBottom: 15 }}
              >

                <Descriptions.Item label="User Name">
                  {item.userName || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="User Role">
                  {item.userRoleName || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(item.statusName)}>
                    {item.statusName || "-"}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Before Image">
                  {item.beforeImageId || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="After Image">
                  {item.afterImageId || "-"}
                </Descriptions.Item>

              </Descriptions>

            ))}

          </>
        )}

      </Modal>
    </>
  )
}