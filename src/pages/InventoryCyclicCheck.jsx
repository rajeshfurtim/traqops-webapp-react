import { useEffect, useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
} from 'antd'
import { DeleteOutlined, SearchOutlined, EditOutlined,FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { useGetLocationList } from '../hooks/useGetLocationList'
import { APP_CONFIG, getPageTitle } from '../config/constants'
import {
  CYCLIC_CHECK_NOTIFICATION_PATH,
  useSidebarNotifications
} from '../context/SidebarNotificationContext'
import { useClient } from '../context/ClientContext'
import {
  useGetCyclicCheckQuery,
  useDeleteCyclicCheckMutation
} from '../store/api/cyclicCheck.api'
import { message, Modal as AntModal } from 'antd'

const { Title } = Typography

export default function InventoryCyclicCheck() {
  const { setBadgeCount } = useSidebarNotifications()
  const { clientId } = useClient()

  const { data: cyclicCheckData, isLoading } =
    useGetCyclicCheckQuery(clientId, { skip: !clientId })

  const { locations } = useGetLocationList()

  const [searchText, setSearchText] = useState('')
  const [form] = Form.useForm()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const [deleteCyclicCheck, { isLoading: isDeleting }] = useDeleteCyclicCheckMutation()

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  })

  //  Search
  const filteredData = useMemo(() => {
    const data = cyclicCheckData?.data || []
    return data.filter((item) => {
      const search = searchText.toLowerCase()

      return (
        item.category?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.remarks?.toLowerCase().includes(search) ||
        item.status?.name?.toLowerCase().includes(search) ||
        item.cyclicLocationMappings?.[0]?.locationName
          ?.toLowerCase()
          .includes(search)
      )
    })
  }, [searchText, cyclicCheckData])

  // Delete
  const handleDelete = (record) => {
    AntModal.confirm({
      title: 'Are you sure you want to delete?',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteCyclicCheck(record.id).unwrap()
          message.success('Deleted successfully')
        } catch {
          message.error('Delete failed')
        }
      },
    })
  }

  // Edit
  const handleEdit = (record) => {
    setSelectedRecord(record)
    form.setFieldsValue({
      station: record.cyclicLocationMappings?.[0]?.locationId || '',
      category: record.category,
      description: record.description,
      remarks: record.remarks,
      status: record.status?.name || '',
      createdAt: record.createdAt ? dayjs(record.createdAt) : null,
    })
    setIsModalVisible(true)
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    setSelectedRecord(null)
    form.resetFields()
  }

  const handleModalSave = async () => {
    try {
      const values = await form.validateFields()
      console.log('Form values:', values)
      setIsModalVisible(false)
      setSelectedRecord(null)
      form.resetFields()
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  // Export Excel
  const exportToExcel = () => {
    const data = filteredData.map((item, index) => ({
      SNo: index + 1,
      Date: dayjs(item.createdAt).format('DD-MM-YYYY HH:mm'),
      Station: item.cyclicLocationMappings?.[0]?.locationName,
      Category: item.category,
      Description: item.description,
      Remarks: item.remarks,
      Status: item.status?.name,
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'CyclicCheck')

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const file = new Blob([excelBuffer])
    saveAs(file, 'CyclicCheck.xlsx')
  }

  // Export PDF
  const exportToPDF = () => {
    const doc = new jsPDF()

    const tableData = filteredData.map((item, index) => [
      index + 1,
      dayjs(item.createdAt).format('DD-MM-YYYY'),
      item.cyclicLocationMappings?.[0]?.locationName,
      item.category,
      item.description,
      item.status?.name,
    ])

    autoTable(doc, {
      head: [['S.No', 'Date', 'Station', 'Category', 'Description', 'Status']],
      body: tableData,
    })

    doc.save('CyclicCheck.pdf')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'NOTVERIFIED': return 'red'
      case 'VERIFIED': return 'green'
      default: return 'blue'
    }
  }

  const columns = [
    {
      title: 'S.No',
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      sorter: (a, b) =>
        dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
      render: (text) =>
        text ? dayjs(text).format('DD-MM-YYYY HH:mm') : '-',
    },
    {
      title: 'Station',
      sorter: (a, b) =>
        (a.cyclicLocationMappings?.[0]?.locationName || '').localeCompare(
          b.cyclicLocationMappings?.[0]?.locationName || ''
        ),
      render: (_, record) =>
        record.cyclicLocationMappings?.[0]?.locationName || '-',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      sorter: (a, b) => a.category.localeCompare(b.category),
    },
    {
      title: 'Work Description',
      dataIndex: 'description',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      render: (text) => text || '-',
    },
    {
      title: 'Status',
      render: (_, record) => (
        <Tag color={getStatusColor(record.status?.name)}>
          {record.status?.name}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          {/* <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button> */}
          <Button
            type="link"
            danger
            loading={isDeleting}
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  useEffect(() => {
    setBadgeCount(
      CYCLIC_CHECK_NOTIFICATION_PATH,
      filteredData.length
    )
  }, [filteredData, setBadgeCount])

  return (
    <>
      <Helmet>
        <title>{getPageTitle('inventory/cyclic-check')}</title>
      </Helmet>

      {/* <Title level={4}>Cyclic Check</Title> */}

      <Card>

        {/* ✅ Top Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Input
            placeholder="Search..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Space>
            <Button onClick={exportToExcel} icon={<FileExcelOutlined />}>Export Excel</Button>
            <Button onClick={exportToPDF} icon={<FilePdfOutlined />}>Export PDF</Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          loading={isLoading}
          pagination={pagination}
          onChange={(pag) => setPagination(pag)}
        />
      </Card>

      <Modal
        title="Edit Cyclic Check"
        open={isModalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalSave}
        maskClosable={false}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="station" label="Station" rules={[{ required: true, message: 'Please select a station' }]}>
            <Select placeholder="Select a station">
              {locations?.map((location) => (
                <Select.Option key={location.id} value={location.id}>
                  {location.locationName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Please select category' }]}>
            <Select placeholder="Select category">
              <Select.Option value="Water Cooled Chiller">Water Cooled Chiller</Select.Option>
              <Select.Option value="Air Conditioning">Air Conditioning</Select.Option>
              <Select.Option value="Electrical">Electrical</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Work Description" rules={[{ required: true, message: 'Please enter description' }]}>
            <Input.TextArea rows={3} placeholder="Enter work description" />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} placeholder="Enter remarks" />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Input placeholder="Status" disabled />
          </Form.Item>
          <Form.Item name="createdAt" label="Date">
            <DatePicker showTime disabled style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}