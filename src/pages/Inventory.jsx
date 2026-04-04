import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Table,
  Tag,
  Progress,
  Spin,
  Row,
  Col,
  Card,
  Typography,
  Tabs,
  Input,
  Button,
  Space,
  Modal,
  Form,
  Select,
  DatePicker,
  Switch,
  Divider,
  Upload,
  message as antdMessage
} from 'antd'
import {
  FileExcelOutlined,
  FilePdfOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { message } from 'antd'
import dayjs from 'dayjs'
import { mockApi } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'
import { domainName } from '../config/apiConfig'
import {
  useLazyGetIndentFilterQuery,
  useGetInventoryCategoryListQuery,
  useLazyGetInventoryByCategoryQuery,
  useAddOrUpdateStockIndentInwardMutation,
  useDeleteStockIndentMutation
} from '../store/api/inventory.api'
import { useGetLocationByIsStoreQuery } from '../store/api/masterSettings.api'
import * as XLSX from 'xlsx'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

export default function Inventory() {
  const [loading, setLoading] = useState(true)
  const [inventoryData, setInventoryData] = useState(null)
  const [activeTab, setActiveTab] = useState('inventoryInward')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [items, setItems] = useState([])
  const [tableData, setTableData] = useState([])
  const [tablePagination, setTablePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()

  const clientId = localStorage.getItem('clientId') || '1090'

  const [triggerGetIndentFilter, { data: indentFilterData, isLoading: indentFilterLoading }] =
    useLazyGetIndentFilterQuery()

  const [triggerGetInventoryByCategory, { data: inventoryByCategoryData }] =
    useLazyGetInventoryByCategoryQuery()

  const [addOrUpdateStockIndentInward, { isLoading: submitInwardLoading }] =
    useAddOrUpdateStockIndentInwardMutation()

  const [deleteStockIndent] = useDeleteStockIndentMutation()

  const { data: locationByIsStoreData } = useGetLocationByIsStoreQuery(
    { clientId, pageNumber: 1, pageSize: 1000 },
    { skip: !clientId }
  )
  const locationOptions = locationByIsStoreData?.data?.content ?? []

  const { data: inventoryCategoryData } = useGetInventoryCategoryListQuery(
    { clientId, pageNumber: 1, pageSize: 1000 },
    { skip: !clientId }
  )
  const inventoryCategoryOptions = inventoryCategoryData?.data?.content ?? []
  const inventoryOptions = inventoryByCategoryData?.data ?? []

  const getIndentFilterParams = (page, pageSize) => {
    const values = filterForm.getFieldsValue()
    const [from, to] = values.dateRange || [dayjs().startOf('month'), dayjs()]
    const fromDate = from?.format?.('YYYY-MM-DD') || dayjs().startOf('month').format('YYYY-MM-DD')
    const toDate = to?.format?.('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD')
    const type =
      activeTab === 'inventoryInward' || activeTab === 'assetInward' ? 'INWARD' : 'OUTWARD'
    return {
      clientId: String(clientId),
      fromDate,
      toDate,
      pn: page,
      ps: pageSize,
      type
    }
  }

  useEffect(() => {
    loadInventoryData()
  }, [])

  useEffect(() => {
    filterForm.setFieldsValue({
      dateRange: [dayjs().startOf('month'), dayjs()]
    })
  }, [filterForm])

  useEffect(() => {
    if (!indentFilterData) return

    const rawItems =
      indentFilterData?.data?.content ||
      indentFilterData?.data ||
      indentFilterData?.items ||
      []

    const mappedItems = rawItems.map((item) => ({
      id: item.id,
      date: item.date,
      outwardRef: item.type === 'OUTWARD' ? item.outwardNumber : item.indentNumber,
      location: item.location?.name || item.fromLocation?.name || '',
      returnable: item.isReturnableFlag,
      returnableDate: item.returnableDate || null,
      expectedReturnTime: item.expectedReturnTime || null,
      type: item.type,
      toLocation: item.toLocation?.name || '',
      outwardPassDate: item.outwardPassDateTime || item.inwardPassDateTime || '',
      verifiedByName: item.verifiedByName || '',
      verifiedAtDate: item.verifiedAt || '',
      supplier: item.supplier || ''
    }))

    const total =
      indentFilterData?.data?.totalElements ||
      indentFilterData?.total ||
      mappedItems.length

    setTableData(mappedItems)
    setTablePagination((prev) => ({ ...prev, total }))
  }, [indentFilterData])

  useEffect(() => {
    // Load initial table data with default date range
    setTablePagination((prev) => ({ ...prev, current: 1, pageSize: prev.pageSize }))
    triggerGetIndentFilter(getIndentFilterParams(1, tablePagination.pageSize))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadInventoryData = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getInventoryData()
      setInventoryData(response.data)
    } catch (error) {
      console.error('Error loading inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (key) => {
    setActiveTab(key)
  }

  const fetchTableData = (page = 1, pageSize = tablePagination.pageSize) => {
    setTablePagination((prev) => ({ ...prev, current: page, pageSize }))
    triggerGetIndentFilter(getIndentFilterParams(page, pageSize))
  }

  const handleSearch = () => {
    fetchTableData(1, tablePagination.pageSize)
  }

  const handleTableChange = (pagination) => {
    fetchTableData(pagination.current, pagination.pageSize)
  }

  const handleReset = () => {
    filterForm.resetFields()
    filterForm.setFieldsValue({ dateRange: [dayjs().startOf('month'), dayjs()] })
    fetchTableData(1, tablePagination.pageSize)
  }

  const handleOpenModal = () => {
    form.resetFields()
    setItems([])
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSubmitModal = () => {
    form
      .validateFields()
      .then(async (values) => {
        if (activeTab === 'inventoryInward') {
          const locationId = values.location
          const indentNumber = values.inwardRef
          const date = values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
          const fromType = values.fromType === 'supplier' ? 2 : 1

          const statusId = 640

          const inwardPassByName = values.inwardPassedBy
          const inwardPassDateTime = values.inwardPassedDate
            ? values.inwardPassedDate.format('YYYY-MM-DD[T]HH:mm')
            : dayjs().format('YYYY-MM-DD[T]HH:mm')

          const passByRemarks = values.passedByRemark

          const isReturnableFlag = values.isReturnable ? 'Y' : 'N'

          const payload = {
            locationId,
            indentNumber,
            date,
            fromType,
            statusId,
            inwardPassByName,
            inwardPassDateTime,
            passByRemarks,
            supplier: values.supplier || null,
            address: values.address || null,
            reason: values.reason || null,
            domainName,
            clientId,
            type: 'INWARD',
            outwardReferenceNumber: null,
            isReturnableFlag,
            sequelNumber: '1',
            stockIndentItemsDtos: items.map((item) => ({
              inventoryId: item.inventoryId || item.key,
              quantity: item.quantity,
              inventoryCategoryId: item.inventoryCategoryId || values.inventoryCategory,
              units: item.units
            }))
          }

          await addOrUpdateStockIndentInward(payload).unwrap()

          fetchTableData(1, tablePagination.pageSize)
        }

        setIsModalOpen(false)
      })
      .catch(() => {})
  }

  const handleAddItem = async () => {
    try {
      const values = await form.validateFields(['location', 'inventoryCategory'])
      const categoryId = values.inventoryCategory
      const locationId = values.location

      const response = await triggerGetInventoryByCategory({
        categoryId,
        locationId
      }).unwrap()

      const apiItems = response?.data ?? []
      const mappedItems = apiItems.map((inv) => ({
        key: inv.id,
        category: inv.inventoryCategory?.name || '',
        inventory: inv.name,
        quantity: inv.quantity,
        units: inv.units,
        inventoryId: inv.id,
        inventoryCategoryId: inv.inventoryCategory?.id
      }))

      setItems(mappedItems)
    } catch (error) {
      // validation failed or API error
      // eslint-disable-next-line no-console
      console.error('Error loading inventory by category', error)
    }
  }

  const handleCancelItem = () => {
    form.resetFields(['inventoryCategory', 'inventory', 'quantity', 'units'])
  }

  const handleRemoveItem = (key) => {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }

  const handleDeleteStockIndent = async (id) => {
    try {
      const response = await deleteStockIndent(id).unwrap()
      const successMsg = response?.message || 'Stock Indent Deleted Successfully'
      message.success(successMsg)
      fetchTableData(tablePagination.current, tablePagination.pageSize)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting stock indent', error)
      message.error('Failed to delete stock indent')
    }
  }

  const getStockStatus = (item) => {
    if (item.quantity === 0) return { status: 'Out of Stock', color: 'error' }
    if (item.quantity < item.minQuantity) return { status: 'Low Stock', color: 'warning' }
    return { status: 'In Stock', color: 'success' }
  }

  const getStockPercentage = (item) => {
    return Math.round((item.quantity / item.maxQuantity) * 100)
  }

  // Bulk Update Template Generation
  const getTemplateHeaders = (tabKey) => {
    const baseHeaders = []
    const itemHeaders = ['Inventory Category ID', 'Inventory Category Name', 'Inventory ID', 'Inventory Name', 'Quantity', 'Units']

    switch (tabKey) {
      case 'inventoryInward':
        baseHeaders.push(
          'Location ID',
          'Location Name',
          'Inward Ref #',
          'Date (YYYY-MM-DD)',
          'From Type (supplier/location)',
          'Address',
          'Reason',
          'From Location ID',
          'From Location Name',
          'Status',
          'Inward Passed By',
          'Inward Passed Date (YYYY-MM-DD HH:mm)',
          'Is Returnable (Y/N)',
          'PassedBy Remark'
        )
        break
      case 'assetInward':
        baseHeaders.push(
          'Date (YYYY-MM-DD)',
          'Asset Inward Ref #',
          'Location ID',
          'Location Name',
          'Type (supplier/other)',
          'Status',
          'Supplier',
          'Inward Pass By Name',
          'Inward Pass By Date (YYYY-MM-DD HH:mm)',
          'Verified By',
          'Verified By Date (YYYY-MM-DD HH:mm)',
          'Reason',
          'Is Returnable (Y/N)'
        )
        break
      case 'inventoryOutward':
        baseHeaders.push(
          'Location ID',
          'Location Name',
          'Outward Ref #',
          'Date (YYYY-MM-DD)',
          'To Location ID',
          'To Location Name',
          'Returnable (yes/no)',
          'Status',
          'To Type (location/external/scrap)',
          'Outward Passed By',
          'Outward Passed Date (YYYY-MM-DD HH:mm)',
          'Supplier',
          'Address',
          'PassedBy Remark',
          'Reason'
        )
        break
      case 'assetOutward':
        baseHeaders.push(
          'Date (YYYY-MM-DD)',
          'Asset Outward Ref #',
          'Location ID',
          'Location Name',
          'Returnable (yes/no)',
          'Type (supplier/other)',
          'Supplier',
          'To Location ID',
          'To Location Name',
          'Status',
          'Material Outward Reference',
          'Transportation Details',
          'Outward Pass By Name',
          'Outward Pass By Date (YYYY-MM-DD HH:mm)',
          'Verified By',
          'Verified By Date (YYYY-MM-DD HH:mm)',
          'Reason'
        )
        break
      default:
        return []
    }

    return [...baseHeaders, ...itemHeaders]
  }

  const downloadBulkUpdateTemplate = () => {
    const headers = getTemplateHeaders(activeTab)
    // const instructions = [
    //   'INSTRUCTIONS:',
    //   '1. Fill in the data starting from row 3 (after this instruction and headers)',
    //   '2. For ID fields, use the actual IDs from the system. Name fields are for reference only.',
    //   '3. Date fields should be in YYYY-MM-DD format',
    //   '4. DateTime fields should be in YYYY-MM-DD HH:mm format',
    //   '5. Boolean fields use Y/N or yes/no as specified',
    //   '6. Do not modify the header row',
    //   '7. Each row represents one transaction with its items',
    //   '',
    //   'SAMPLE DATA BELOW:'
    // ]
    // const sampleData = getSampleData(activeTab)
    // const worksheetData = [ headers, ...sampleData]
        const worksheetData = [ headers]

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')

    const tabNames = {
      inventoryInward: 'Inventory_Inward',
      inventoryOutward: 'Inventory_Outward',
      assetInward: 'Asset_Inward',
      assetOutward: 'Asset_Outward'
    }

    XLSX.writeFile(workbook, `${tabNames[activeTab]}_Bulk_Update_Template.xlsx`)
    message.success('Template downloaded successfully')
  }

  // const getSampleData = (tabKey) => {
  //   switch (tabKey) {
  //     case 'inventoryInward':
  //       return [[
  //         '1', 'Main Warehouse', 'INV-001', '2024-01-15', 'supplier', '123 Supplier St', 'New stock arrival',
  //         '2', 'Branch Office', 'approved', 'John Doe', '2024-01-15 10:30', 'Y', 'Approved by manager',
  //         '1', 'Electronics', '101', 'Laptop', '5', 'Nos'
  //       ]]
  //     case 'assetInward':
  //       return [[
  //         '2024-01-15', 'AST-001', '1', 'Main Warehouse', 'supplier', 'approved', 'ABC Corp',
  //         'John Doe', '2024-01-15 10:30', 'Jane Smith', '2024-01-15 11:00', 'New asset purchase', 'Y',
  //         '1', 'Electronics', '101', 'Server', '1', 'Nos'
  //       ]]
  //     case 'inventoryOutward':
  //       return [[
  //         '1', 'Main Warehouse', 'OUT-001', '2024-01-15', '2', 'Branch Office', 'yes', 'approved',
  //         'location', 'John Doe', '2024-01-15 10:30', '', '', 'Transfer to branch', '',
  //         '1', 'Electronics', '101', 'Laptop', '2', 'Nos'
  //       ]]
  //     case 'assetOutward':
  //       return [[
  //         '2024-01-15', 'AST-OUT-001', '1', 'Main Warehouse', 'yes', 'supplier', 'XYZ Corp',
  //         '2', 'Branch Office', 'approved', 'REF-123', 'By truck', 'John Doe', '2024-01-15 10:30',
  //         'Jane Smith', '2024-01-15 11:00', 'Asset transfer',
  //         '1', 'Electronics', '101', 'Server', '1', 'Nos'
  //       ]]
  //     default:
  //       return []
  //   }
  // }

  const handleBulkUpload = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length < 2) {
          antdMessage.error('Excel file must contain at least header row and one data row')
          return
        }

        const headers = jsonData[0]
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''))

        if (rows.length === 0) {
          antdMessage.error('No data rows found in the Excel file')
          return
        }

        // Process bulk data
        processBulkData(headers, rows)
      } catch (error) {
        console.error('Error processing Excel file:', error)
        antdMessage.error('Error processing Excel file. Please check the file format.')
      }
    }
    reader.readAsArrayBuffer(file)
    return false // Prevent default upload behavior
  }

  const processBulkData = async (headers, rows) => {
    try {
      const processedData = rows.map(row => {
        const record = {}
        headers.forEach((header, index) => {
          record[header] = row[index] || ''
        })
        return record
      })

      let successCount = 0
      let errorCount = 0

      for (const record of processedData) {
        try {
          await processSingleRecord(record)
          successCount++
        } catch (error) {
          console.error('Error processing record:', record, error)
          errorCount++
        }
      }

      if (successCount > 0) {
        antdMessage.success(`Successfully processed ${successCount} records`)
        // Refresh the table data
        fetchTableData(1, tablePagination.pageSize)
      }

      if (errorCount > 0) {
        antdMessage.warning(`${errorCount} records failed to process`)
      }

    } catch (error) {
      console.error('Error processing bulk data:', error)
      antdMessage.error('Error processing bulk data')
    }
  }

  const processSingleRecord = async (record) => {
    const clientId = localStorage.getItem('clientId') || '1090'

    switch (activeTab) {
      case 'inventoryInward':
        await processInventoryInwardRecord(record, clientId)
        break
      case 'assetInward':
        await processAssetInwardRecord(record, clientId)
        break
      case 'inventoryOutward':
        await processInventoryOutwardRecord(record, clientId)
        break
      case 'assetOutward':
        await processAssetOutwardRecord(record, clientId)
        break
      default:
        throw new Error('Unknown tab type')
    }
  }

  const processInventoryInwardRecord = async (record, clientId) => {
    const locationId = record['Location ID'] || locationOptions.find(loc => loc.name === record['Location Name'])?.id
    if (!locationId) throw new Error('Invalid location')

    const date = record['Date (YYYY-MM-DD)'] ? dayjs(record['Date (YYYY-MM-DD)']).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
    const fromType = record['From Type (supplier/location)']?.toLowerCase() === 'supplier' ? 2 : 1
    const statusId = 640
    const inwardPassByName = record['Inward Passed By']
    const inwardPassDateTime = record['Inward Passed Date (YYYY-MM-DD HH:mm)']
      ? dayjs(record['Inward Passed Date (YYYY-MM-DD HH:mm)']).format('YYYY-MM-DD[T]HH:mm')
      : dayjs().format('YYYY-MM-DD[T]HH:mm')
    const passByRemarks = record['PassedBy Remark']
    const isReturnableFlag = record['Is Returnable (Y/N)']?.toUpperCase() === 'Y' ? 'Y' : 'N'

    const fromLocationId = record['From Location ID'] || locationOptions.find(loc => loc.name === record['From Location Name'])?.id

    const payload = {
      locationId,
      indentNumber: record['Inward Ref #'],
      date,
      fromType,
      statusId,
      inwardPassByName,
      inwardPassDateTime,
      passByRemarks,
      supplier: record['Supplier'] || null,
      address: record['Address'] || null,
      reason: record['Reason'] || null,
      domainName,
      clientId,
      type: 'INWARD',
      outwardReferenceNumber: null,
      isReturnableFlag,
      sequelNumber: '1',
      stockIndentItemsDtos: [{
        inventoryId: record['Inventory ID'] || record['Inventory Name'], // Assuming ID is provided, fallback to name
        quantity: parseFloat(record['Quantity']) || 0,
        inventoryCategoryId: record['Inventory Category ID'] || record['Inventory Category Name'], // Assuming ID is provided, fallback to name
        units: record['Units']
      }]
    }

    await addOrUpdateStockIndentInward(payload).unwrap()
  }

  const processAssetInwardRecord = async (record, clientId) => {
    // TODO: Implement asset inward bulk processing
    console.log('Processing asset inward record:', record)
    antdMessage.info('Asset Inward bulk processing not yet implemented')
    // This would follow similar pattern as inventory inward but with asset-specific fields
  }

  const processInventoryOutwardRecord = async (record, clientId) => {
    // TODO: Implement inventory outward bulk processing
    console.log('Processing inventory outward record:', record)
    antdMessage.info('Inventory Outward bulk processing not yet implemented')
    // This would follow similar pattern as inventory inward but for outward transactions
  }

  const processAssetOutwardRecord = async (record, clientId) => {
    // TODO: Implement asset outward bulk processing
    console.log('Processing asset outward record:', record)
    antdMessage.info('Asset Outward bulk processing not yet implemented')
    // This would follow similar pattern as asset inward but for outward transactions
  }

  const summaryCards = inventoryData
    ? [
        {
          title: 'Total Items',
          value: inventoryData.summary.totalItems.toLocaleString(),
          color: '#1976d2'
        },
        {
          title: 'Total Value',
          value: `$${inventoryData.summary.totalValue.toLocaleString()}`,
          color: '#2e7d32'
        },
        {
          title: 'Low Stock Items',
          value: inventoryData.summary.lowStockItems,
          color: '#ed6c02'
        },
        {
          title: 'Out of Stock',
          value: inventoryData.summary.outOfStockItems,
          color: '#d32f2f'
        }
      ]
    : []

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120
    },
    {
      title: 'Outward ref#',
      dataIndex: 'outwardRef',
      key: 'outwardRef',
      width: 130,
      ellipsis: true
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 150
    },
    {
      title: 'Returnable',
      dataIndex: 'returnable',
      key: 'returnable',
      width: 100,
      render: (val) => (val === 'Y' || val === true ? 'Yes' : val === 'N' || val === false ? 'No' : val)
    },
    {
      title: 'Returnable Date',
      dataIndex: 'returnableDate',
      key: 'returnableDate',
      width: 130
    },
    {
      title: 'Expected Return Time',
      dataIndex: 'expectedReturnTime',
      key: 'expectedReturnTime',
      width: 150
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100
    },
    {
      title: 'To Location',
      dataIndex: 'toLocation',
      key: 'toLocation',
      width: 130
    },
    {
      title: 'Outward Pass Date',
      dataIndex: 'outwardPassDate',
      key: 'outwardPassDate',
      width: 140
    },
    {
      title: 'Verified by name',
      dataIndex: 'verifiedByName',
      key: 'verifiedByName',
      width: 140,
      ellipsis: true
    },
    {
      title: 'Verified At Date',
      dataIndex: 'verifiedAtDate',
      key: 'verifiedAtDate',
      width: 140
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 150,
      ellipsis: true
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteStockIndent(record.id)}
        />
      )
    }
  ]

  const tabItems = [
    { key: 'inventoryInward', label: 'Inventory Inward' },
    { key: 'inventoryOutward', label: 'Inventory Outward' },
    { key: 'assetInward', label: 'Asset Inward' },
    { key: 'assetOutward', label: 'Asset Outward' }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('inventory')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Inventory Management System`} />
      </Helmet>
      <div>
        {/* <Title level={4} style={{ fontWeight: 'bold', marginBottom: 16 }}>
          Inventory Management
        </Title> */}

        {loading || !inventoryData ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              items={tabItems}
              style={{ marginBottom: 16 }}
            />

            <Row justify="space-between" align="middle" style={{ marginBottom: 16, rowGap: 8 }}>
              <Col>
                <Form
                  form={filterForm}
                  layout="inline"
                  onFinish={handleSearch}
                  style={{ flexWrap: 'wrap', gap: 8 }}
                >
                  <Form.Item name="dateRange" label="Date Range">
                    <RangePicker />
                  </Form.Item>
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                        Search
                      </Button>
                      <Button icon={<ReloadOutlined />} onClick={handleReset}>
                        Reset
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Col>

              <Col>
                <Space>
                  <Button icon={<FileExcelOutlined />}>
                    Export Excel
                  </Button>
                  <Button icon={<FilePdfOutlined />}>
                    Export PDF
                  </Button>
                </Space>
              </Col>
            </Row>

            <Row justify="end" style={{ marginBottom: 16 }}>
              <Col>
                <Space>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={downloadBulkUpdateTemplate}
                  >
                    Download Bulk Update Template
                  </Button>
                  <Upload
                    accept=".xlsx,.xls"
                    showUploadList={false}
                    beforeUpload={handleBulkUpload}
                  >
                    <Button icon={<UploadOutlined />}>
                      Upload Bulk Update
                    </Button>
                  </Upload>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
                    Add
                  </Button>
                </Space>
              </Col>
            </Row>

            <div style={{ width: '100%', overflowX: 'auto' }}>
              <Table
                dataSource={tableData}
                columns={columns}
                rowKey="id"
                pagination={{
                  ...tablePagination,
                  responsive: true,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100']
                }}
                size="middle"
                scroll={{ x: 1500 }}
                loading={indentFilterLoading}
                onChange={handleTableChange}
              />
            </div>
          </Card>
        )}

        <Modal
          title={
            activeTab === 'inventoryOutward'
              ? 'Create Inventory Outward'
              : activeTab === 'assetInward'
                ? 'Create Asset Inward'
                : activeTab === 'assetOutward'
                  ? 'Create Asset Outward'
                  : 'Create Inventory Inward'
          }
          open={isModalOpen}
          onCancel={handleCloseModal}
          footer={null}
          width={900}
          destroyOnHidden
          forceRender
        >
          <Form
            form={form}
            layout="vertical"
          >
            {activeTab === 'inventoryInward' && (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Location"
                      name="location"
                      rules={[{ required: true, message: 'Please select location' }]}
                    >
                      <Select
                        placeholder="Select Location"
                        showSearch
                        optionFilterProp="label"
                      >
                        {locationOptions.map((loc) => (
                          <Select.Option key={loc.id} value={loc.id} label={loc.name}>
                            {loc.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Inward Ref #"
                      name="inwardRef"
                      rules={[{ required: true, message: 'Please enter Inward Ref #' }]}
                    >
                      <Input placeholder="Enter Inward Ref #" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Date"
                      name="date"
                      rules={[{ required: true, message: 'Please select date' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="From Type"
                      name="fromType"
                      rules={[{ required: true, message: 'Please select From Type' }]}
                    >
                      <Select placeholder="Select From Type">
                        <Select.Option value="supplier">Supplier</Select.Option>
                        <Select.Option value="location">Location</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item shouldUpdate noStyle>
                  {({ getFieldValue }) =>
                    getFieldValue('fromType') === 'supplier' ? (
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Address"
                            name="address"
                            rules={[{ required: true, message: 'Please enter address' }]}
                          >
                            <Input.TextArea rows={3} placeholder="Enter address" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Reason"
                            name="reason"
                            rules={[{ required: true, message: 'Please enter reason' }]}
                          >
                            <Input.TextArea rows={3} placeholder="Enter reason" />
                          </Form.Item>
                        </Col>
                      </Row>
                    ) : null
                  }
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="From Location"
                      name="fromLocation"
                      rules={[{ required: true, message: 'Please select From Location' }]}
                    >
                      <Select placeholder="Select From Location" showSearch optionFilterProp="label">
                        {locationOptions.map((loc) => (
                          <Select.Option key={loc.id} value={loc.id} label={loc.name}>
                            {loc.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Status"
                      name="status"
                      rules={[{ required: true, message: 'Please select status' }]}
                    >
                      <Select placeholder="Select Status">
                        <Select.Option value="draft">Draft</Select.Option>
                        <Select.Option value="approved">Approved</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Inward Passed By"
                      name="inwardPassedBy"
                      rules={[{ required: true, message: 'Please enter Inward Passed By' }]}
                    >
                      <Input placeholder="Enter Inward Passed By" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Inward Passed Date"
                      name="inwardPassedDate"
                      rules={[{ required: true, message: 'Please select Inward Passed Date' }]}
                    >
                      <DatePicker
                        showTime
                        style={{ width: '100%' }}
                        format="YYYY-MM-DD HH:mm"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Is Returnable"
                      name="isReturnable"
                      valuePropName="checked"
                      rules={[{ required: true, message: 'Please select returnable status' }]}
                    >
                      <Switch checkedChildren="Yes" unCheckedChildren="No" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      label="PassedBy Remark"
                      name="passedByRemark"
                      rules={[{ required: true, message: 'Please enter remark' }]}
                    >
                      <Input.TextArea rows={3} placeholder="Enter remark" />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            {activeTab === 'assetInward' && (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Date"
                      name="assetInwardDate"
                      rules={[{ required: true, message: 'Please select date' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Asset Inward Ref #"
                      name="assetInwardRef"
                      rules={[{ required: true, message: 'Please enter Asset Inward Ref #' }]}
                    >
                      <Input placeholder="Enter Asset Inward Ref #" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Location"
                      name="assetInwardLocation"
                      rules={[{ required: true, message: 'Please select location' }]}
                    >
                      <Select placeholder="Select Location" showSearch optionFilterProp="label">
                        {locationOptions.map((loc) => (
                          <Select.Option key={loc.id} value={loc.id} label={loc.name}>
                            {loc.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Type"
                      name="assetInwardType"
                      rules={[{ required: true, message: 'Please select Type' }]}
                    >
                      <Select placeholder="Select Type">
                        <Select.Option value="supplier">Supplier</Select.Option>
                        <Select.Option value="other">Other</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Status" name="assetInwardStatus">
                      <Select placeholder="Select Status">
                        <Select.Option value="draft">Draft</Select.Option>
                        <Select.Option value="approved">Approved</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Form.Item shouldUpdate noStyle>
                    {({ getFieldValue }) => {
                      const isSupplier = getFieldValue('assetInwardType') === 'supplier'
                      return isSupplier ? (
                        <Col span={12}>
                          <Form.Item
                            label="Supplier"
                            name="assetInwardSupplier"
                            rules={[{ required: true, message: 'Please enter Supplier' }]}
                          >
                            <Input placeholder="Enter Supplier" />
                          </Form.Item>
                        </Col>
                      ) : (
                        <Col span={12}>
                          <Form.Item
                            label="Inward Pass By Name"
                            name="assetInwardPassByName"
                            rules={[{ required: true, message: 'Please enter Inward Pass By Name' }]}
                          >
                            <Input placeholder="Enter Inward Pass By Name" />
                          </Form.Item>
                        </Col>
                      )
                    }}
                  </Form.Item>
                </Row>

                <Form.Item shouldUpdate noStyle>
                  {({ getFieldValue }) => {
                    const isSupplier = getFieldValue('assetInwardType') === 'supplier'
                    if (isSupplier) {
                      return (
                        <>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                label="Inward Pass By Name"
                                name="assetInwardPassByName"
                                rules={[{ required: true, message: 'Please enter Inward Pass By Name' }]}
                              >
                                <Input placeholder="Enter Inward Pass By Name" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label="Inward Pass By Date"
                                name="assetInwardPassByDate"
                                rules={[{ required: true, message: 'Please select Inward Pass By Date' }]}
                              >
                                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item label="Verified By" name="assetInwardVerifiedBy">
                                <Input placeholder="Enter Verified By" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="Verified By Date" name="assetInwardVerifiedByDate">
                                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                label="Reason"
                                name="assetInwardSupplierReason"
                                rules={[{ required: true, message: 'Please enter reason' }]}
                              >
                                <Input.TextArea rows={2} placeholder="Enter reason" />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                label="Is Returnable"
                                name="assetInwardIsReturnable"
                                valuePropName="checked"
                              >
                                <Switch checkedChildren="YES" unCheckedChildren="NO" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </>
                      )
                    }
                    return (
                      <>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              label="Inward Pass By Date"
                              name="assetInwardPassByDate"
                              rules={[{ required: true, message: 'Please select Inward Pass By Date' }]}
                            >
                              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="Verified By" name="assetInwardVerifiedBy">
                              <Input placeholder="Enter Verified By" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="Verified By Date" name="assetInwardVerifiedByDate">
                              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              label="Is Returnable"
                              name="assetInwardIsReturnable"
                              valuePropName="checked"
                            >
                              <Switch checkedChildren="YES" unCheckedChildren="NO" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={24}>
                            <Form.Item label="Reason" name="assetInwardReason">
                              <Input.TextArea rows={2} placeholder="Enter reason" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </>
                    )
                  }}
                </Form.Item>
              </>
            )}

            {activeTab === 'inventoryOutward' && (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Location"
                      name="outLocation"
                      rules={[{ required: true, message: 'Please select location' }]}
                    >
                      <Select placeholder="Select Location" showSearch optionFilterProp="label">
                        {locationOptions.map((loc) => (
                          <Select.Option key={loc.id} value={loc.id} label={loc.name}>
                            {loc.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Outward Ref #"
                      name="outwardRef"
                      rules={[{ required: true, message: 'Please enter Outward Ref #' }]}
                    >
                      <Input placeholder="Enter Outward Ref #" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Date"
                      name="outDate"
                      rules={[{ required: true, message: 'Please select date' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="To Location"
                      name="toLocation"
                      rules={[{ required: true, message: 'Please select To Location' }]}
                    >
                      <Select placeholder="Select To Location" showSearch optionFilterProp="label">
                        {locationOptions.map((loc) => (
                          <Select.Option key={loc.id} value={loc.id} label={loc.name}>
                            {loc.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Returnable"
                      name="outReturnable"
                      rules={[{ required: true, message: 'Please select returnable option' }]}
                    >
                      <Select placeholder="Select Returnable">
                        <Select.Option value="yes">Yes</Select.Option>
                        <Select.Option value="no">No</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Status"
                      name="outwardStatus"
                      rules={[{ required: true, message: 'Please select status' }]}
                    >
                      <Select placeholder="Select Status">
                        <Select.Option value="draft">Draft</Select.Option>
                        <Select.Option value="approved">Approved</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="To Type"
                      name="toType"
                      rules={[{ required: true, message: 'Please select To Type' }]}
                    >
                      <Select placeholder="Select To Type">
                        <Select.Option value="location">Location</Select.Option>
                        <Select.Option value="external">External</Select.Option>
                        <Select.Option value="scrap">Scrap</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Outward Passed By"
                      name="outwardPassedBy"
                      rules={[{ required: true, message: 'Please enter Outward Passed By' }]}
                    >
                      <Input placeholder="Enter Outward Passed By" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Outward Passed Date"
                      name="outwardPassedDate"
                      rules={[{ required: true, message: 'Please select Outward Passed Date' }]}
                    >
                      <DatePicker
                        showTime
                        style={{ width: '100%' }}
                        format="YYYY-MM-DD HH:mm"
                      />
                    </Form.Item>
                  </Col>
                  <Form.Item shouldUpdate noStyle>
                    {({ getFieldValue }) =>
                      getFieldValue('toType') === 'external' ? (
                        <Col span={12}>
                          <Form.Item
                            label="Supplier"
                            name="outSupplier"
                            rules={[{ required: true, message: 'Please enter Supplier' }]}
                          >
                            <Input placeholder="Enter Supplier" />
                          </Form.Item>
                        </Col>
                      ) : null
                    }
                  </Form.Item>
                </Row>

                <Form.Item shouldUpdate noStyle>
                  {({ getFieldValue }) => {
                    const toType = getFieldValue('toType')
                    if (toType === 'external') {
                      return (
                        <>
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                label="Address"
                                name="outAddress"
                                rules={[{ required: true, message: 'Please enter address' }]}
                              >
                                <Input.TextArea rows={3} placeholder="Enter address" />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                label="PassedBy Remark"
                                name="outwardPassedByRemark"
                                rules={[{ required: true, message: 'Please enter remark' }]}
                              >
                                <Input.TextArea rows={3} placeholder="Enter remark" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </>
                      )
                    }
                    if (toType === 'scrap') {
                      return (
                        <Row gutter={16}>
                          <Col span={24}>
                            <Form.Item
                              label="Reason"
                              name="scrapReason"
                              rules={[{ required: true, message: 'Please enter reason' }]}
                            >
                              <Input.TextArea rows={3} placeholder="Enter reason" />
                            </Form.Item>
                          </Col>
                        </Row>
                      )
                    }
                    return null
                  }}
                </Form.Item>

                <Form.Item shouldUpdate noStyle>
                  {({ getFieldValue }) => {
                    if (getFieldValue('toType') !== 'external') {
                      return (
                        <Row gutter={16}>
                          <Col span={24}>
                            <Form.Item
                              label="PassedBy Remark"
                              name="outwardPassedByRemark"
                              rules={[{ required: true, message: 'Please enter remark' }]}
                            >
                              <Input.TextArea rows={3} placeholder="Enter remark" />
                            </Form.Item>
                          </Col>
                        </Row>
                      )
                    }
                    return null
                  }}
                </Form.Item>
              </>
            )}

            {activeTab === 'assetOutward' && (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Date"
                      name="assetOutwardDate"
                      rules={[{ required: true, message: 'Please select date' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Asset Outward Ref #"
                      name="assetOutwardRef"
                      rules={[{ required: true, message: 'Please enter Asset Outward Ref #' }]}
                    >
                      <Input placeholder="Enter Asset Outward Ref #" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Location"
                      name="assetOutwardLocation"
                      rules={[{ required: true, message: 'Please select location' }]}
                    >
                      <Select placeholder="Select Location" showSearch optionFilterProp="label">
                        {locationOptions.map((loc) => (
                          <Select.Option key={loc.id} value={loc.id} label={loc.name}>
                            {loc.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Returnable"
                      name="assetOutwardReturnable"
                      rules={[{ required: true, message: 'Please select returnable option' }]}
                    >
                      <Select placeholder="Select Returnable">
                        <Select.Option value="yes">Yes</Select.Option>
                        <Select.Option value="no">No</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Type"
                      name="assetOutwardType"
                      rules={[{ required: true, message: 'Please select Type' }]}
                    >
                      <Select placeholder="Select Type">
                        <Select.Option value="supplier">Supplier</Select.Option>
                        <Select.Option value="other">Other</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Form.Item shouldUpdate noStyle>
                    {({ getFieldValue }) => {
                      const isSupplier = getFieldValue('assetOutwardType') === 'supplier'
                      return isSupplier ? (
                        <Col span={12}>
                          <Form.Item
                            label="Supplier"
                            name="assetOutwardSupplier"
                            rules={[{ required: true, message: 'Please enter Supplier' }]}
                          >
                            <Input placeholder="Enter Supplier" />
                          </Form.Item>
                        </Col>
                      ) : (
                        <Col span={12}>
                          <Form.Item
                            label="To Location"
                            name="assetOutwardToLocation"
                            rules={[{ required: true, message: 'Please select To Location' }]}
                          >
                            <Select placeholder="Select To Location" showSearch optionFilterProp="label">
                              {locationOptions.map((loc) => (
                                <Select.Option key={loc.id} value={loc.id} label={loc.name}>
                                  {loc.name}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      )
                    }}
                  </Form.Item>
                </Row>

                <Form.Item shouldUpdate noStyle>
                  {({ getFieldValue }) => {
                    const isSupplier = getFieldValue('assetOutwardType') === 'supplier'
                    if (isSupplier) {
                      return (
                        <>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                label="To Location"
                                name="assetOutwardToLocation"
                                rules={[{ required: true, message: 'Please select To Location' }]}
                              >
                                <Select placeholder="Select To Location" showSearch optionFilterProp="label">
                                  {locationOptions.map((loc) => (
                                    <Select.Option key={loc.id} value={loc.id} label={loc.name}>
                                      {loc.name}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="Status" name="assetOutwardStatus">
                                <Select placeholder="Select Status">
                                  <Select.Option value="draft">Draft</Select.Option>
                                  <Select.Option value="approved">Approved</Select.Option>
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                label="Material outward Reference"
                                name="assetOutwardMaterialRef"
                              >
                                <Input placeholder="Enter Material outward Reference" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label="Transportation Details"
                                name="assetOutwardTransportationDetails"
                              >
                                <Input placeholder="Enter Transportation Details" />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                label="Outward Pass By Name"
                                name="assetOutwardPassByName"
                                rules={[{ required: true, message: 'Please enter Outward Pass By Name' }]}
                              >
                                <Input placeholder="Enter Outward Pass By Name" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label="Outward Pass By Date"
                                name="assetOutwardPassByDate"
                                rules={[{ required: true, message: 'Please select Outward Pass By Date' }]}
                              >
                                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item label="Verified By" name="assetOutwardVerifiedBy">
                                <Input placeholder="Enter Verified By" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="Verified By Date" name="assetOutwardVerifiedByDate">
                                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                label="Reason"
                                name="assetOutwardSupplierReason"
                                rules={[{ required: true, message: 'Please enter reason' }]}
                              >
                                <Input.TextArea rows={2} placeholder="Enter reason" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </>
                      )
                    }
                    return (
                      <>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="Status" name="assetOutwardStatus">
                              <Select placeholder="Select Status">
                                <Select.Option value="draft">Draft</Select.Option>
                                <Select.Option value="approved">Approved</Select.Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              label="Material outward Reference"
                              name="assetOutwardMaterialRef"
                            >
                              <Input placeholder="Enter Material outward Reference" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              label="Transportation Details"
                              name="assetOutwardTransportationDetails"
                            >
                              <Input placeholder="Enter Transportation Details" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              label="Outward Pass By Name"
                              name="assetOutwardPassByName"
                              rules={[{ required: true, message: 'Please enter Outward Pass By Name' }]}
                            >
                              <Input placeholder="Enter Outward Pass By Name" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              label="Outward Pass By Date"
                              name="assetOutwardPassByDate"
                              rules={[{ required: true, message: 'Please select Outward Pass By Date' }]}
                            >
                              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="Verified By" name="assetOutwardVerifiedBy">
                              <Input placeholder="Enter Verified By" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="Verified By Date" name="assetOutwardVerifiedByDate">
                              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </>
                    )
                  }}
                </Form.Item>
              </>
            )}

            <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 8 }}>
              <Title level={5}>Add Items</Title>
            </div>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Form.Item
                  label="Inventory Category"
                  name="inventoryCategory"
                  rules={[{ required: true, message: 'Please select Inventory Category' }]}
                >
                  <Select
                    placeholder="Select Inventory Category"
                    showSearch
                    optionFilterProp="label"
                  >
                    {inventoryCategoryOptions.map((cat) => (
                      <Select.Option key={cat.id} value={cat.id} label={cat.name}>
                        {cat.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="Inventory"
                  name="inventory"
                  rules={[{ required: true, message: 'Please select Inventory' }]}
                >
                  <Select
                    placeholder="Select Inventory"
                    showSearch
                    optionFilterProp="label"
                  >
                    {inventoryOptions.map((inv) => (
                      <Select.Option key={inv.id} value={inv.id} label={inv.name}>
                        {inv.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="Quantity"
                  name="quantity"
                  rules={[{ required: true, message: 'Please enter Quantity' }]}
                >
                  <Input type="number" placeholder="Enter Quantity" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="Units"
                  name="units"
                  rules={[{ required: true, message: 'Please select Units' }]}
                >
                  <Select placeholder="Select Units">
                  <Select.Option value="Ltr">Ltr</Select.Option>
                  <Select.Option value="Nos">Nos</Select.Option>
                  <Select.Option value="cm">cm</Select.Option>
                    <Select.Option value="Meter">Meter</Select.Option>
                    <Select.Option value="mm">mm</Select.Option>
                    <Select.Option value="kg">Kg</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row justify="end" style={{ marginBottom: 8 }}>
              <Space>
                <Button onClick={handleCancelItem}>Cancel</Button>
                <Button type="primary" onClick={handleAddItem}>
                  Add
                </Button>
              </Space>
            </Row>

            <Table
              dataSource={items}
              columns={[
                {
                  title: 'Category',
                  dataIndex: 'category',
                  key: 'category'
                },
                {
                  title: 'Inventory',
                  dataIndex: 'inventory',
                  key: 'inventory'
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity'
                },
                {
                  title: 'Units',
                  dataIndex: 'units',
                  key: 'units'
                },
                {
                  title: 'Action',
                  key: 'action',
                  render: (_, record) => (
                    <Button type="link" danger onClick={() => handleRemoveItem(record.key)}>
                      Remove
                    </Button>
                  )
                }
              ]}
              pagination={false}
              rowKey="key"
              style={{ marginBottom: 16 }}
            />

            <Divider />

            <Row justify="center">
              <Space>
                <Button onClick={handleCloseModal}>Cancel</Button>
                <Button type="primary" onClick={handleSubmitModal}>
                  Submit
                </Button>
              </Space>
            </Row>
          </Form>
        </Modal>
      </div>
    </>
  )
}

