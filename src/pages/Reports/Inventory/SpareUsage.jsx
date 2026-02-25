import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton, Input, Row, Col, Tooltip, message, Spin, DatePicker } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationByIsStoreQuery, useGetInventoryListQuery } from '../../../store/api/masterSettings.api'
import { useGetSpareUsageReportQuery } from '../../../store/api/reports.api'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'
import { useAuth } from '../../../context/AuthContext'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export default function SpareUsageReports() {

  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId
  const [form] = Form.useForm()

  const [current, setCurrent] = useState(1)
  const [pageSize, setPagesize] = useState(25)
  const [filters, setFilters] = useState({})

  const { data: inventoryList, isLoading: inventoryCategoryLoading } = useGetInventoryListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: locationList, isLoading: locationLoading } = useGetLocationByIsStoreQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: spareUsageReportData, isLoading: spareUsageReportLoading, isFetching } =
    useGetSpareUsageReportQuery(
      {
        clientId,
        ...filters,
        pn: 1,
        ps: 1000
      },
      {
        skip: !filters.locationId || !filters.inventoryId
      }
    )

  useEffect(() => {
    form.setFieldsValue({
      date: [dayjs().startOf('month'), dayjs()],
      location: -1,
      inventory: 'ALL'
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
    if (values.inventory) newFilters.inventoryId = values.inventory
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 80,
      render: (_, __, index) => ((current - 1) * pageSize) + index + 1
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (_, record) => record?.createdAt ? dayjs(record?.createdAt).format('DD/MM/YYYY') : '',
      sorter: (a, b) => dayjs(a?.createdAt).valueOf() - dayjs(b?.createdAt).valueOf()
    },
    {
      title: 'Location',
      dataIndex: 'locationName',
      key: 'locationName',
      sorter: (a, b) => (a?.locationName ?? '').localeCompare(b?.locationName ?? '')
    },
    {
      title: '#Ref No',
      dataIndex: 'indentNumber',
      key: 'indentNumber',
      sorter: (a, b) => a?.indentNumber - b?.indentNumber
    },
    {
      title: 'Entry Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a, b) => (a?.type ?? '').localeCompare(b?.type ?? '')
    },
    {
      title: 'Movement Type',
      dataIndex: 'taskName',
      key: 'taskName',
      sorter: (a, b) => (a?.taskName ?? '').localeCompare(b?.taskName ?? '')
    },
    {
      title: 'From Location',
      dataIndex: 'fromLocationName',
      key: 'fromLocationName',
      sorter: (a, b) => (a?.fromLocationName ?? '').localeCompare(b?.fromLocationName ?? '')
    },
    {
      title: 'Target Location',
      dataIndex: 'toLocationName',
      key: 'toLocationName',
      sorter: (a, b) => (a?.toLocationName ?? '').localeCompare(b?.toLocationName ?? '')
    },
    {
      title: 'Inventory Name',
      dataIndex: 'inventoryName',
      key: 'inventoryName',
      sorter: (a, b) => (a?.inventoryName ?? '').localeCompare(b?.inventoryName ?? '')
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a?.quantity - b?.quantity
    },
  ]

  // Search state
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState(null);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);

    const searchValue = value.toLowerCase().trim();

    if (!searchValue) {
      setFilteredData(null);
      return;
    }

    const filtered = spareUsageReportData?.data?.content?.filter((item) =>
      `${item?.createdAt ? dayjs(item?.createdAt).format('DD/MM/YYYY') : ''}
     ${item?.locationName ?? ''} ${item?.indentNumber ?? ''} ${item?.fromLocationName ?? ''}
        ${item?.type ?? ''} ${item?.taskName ?? ''} ${item?.toLocationName ?? ''}
        ${item?.inventoryName ?? ''} ${item?.quantity ?? ''}`
        .toLowerCase()
        .includes(searchValue)
    );

    setFilteredData(filtered);
  };

  const [exporting, setExporting] = useState({ excel: false, pdf: false })

  const handleExportPDF = async () => {
    try {
      setExporting(prev => ({ ...prev, pdf: true }))
      const locationName = locationList.data?.content?.filter(loc => loc.id === filters.locationId)
      const categoryName = inventoryList.data?.content?.filter(loc => loc.id === filters.inventoryId)
      console.log(locationName, categoryName)

      await exportToPDF(
        columns,
        spareUsageReportData?.data?.content,
        `spare-usage-report (Date: ${dayjs(filters.fromDate).format('DD/MM/YYYY')} to ${dayjs(filters.toDate).format('DD/MM/YYYY')} - Location: ${locationName[0]?.name ?? 'All'} - Inventory: ${categoryName[0]?.name ?? 'All'})`
      )

      message.success('PDF exported successfully')
    } catch (err) {
      message.error('PDF export failed')
    } finally {
      setExporting(prev => ({ ...prev, pdf: false }))
    }
  }

  const handleExportExcel = async () => {
    try {
      setExporting(prev => ({ ...prev, excel: true }))
      const locationName = locationList.data?.content?.filter(loc => loc.id === filters.locationId)
      const categoryName = inventoryList.data?.content?.filter(loc => loc.id === filters.inventoryId)

      await exportToExcel(
        columns,
        spareUsageReportData?.data?.content,
        `spare-usage-report (Date: ${dayjs(filters.fromDate).format('DD/MM/YYYY')} to ${dayjs(filters.toDate).format('DD/MM/YYYY')} - Location: ${locationName[0]?.name ?? 'All'} - Inventory: ${categoryName[0]?.name ?? 'All'})`
      )

      message.success('Excel exported successfully')
    } catch (err) {
      message.error('Excel export failed')
    } finally {
      setExporting(prev => ({ ...prev, excel: false }))
    }
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
                      <Select.Option value={-1}>
                        All Location
                      </Select.Option>
                      {locationList?.data?.content?.map(l => (
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
                    label="Inventory"
                    name="inventory"
                    rules={[{ required: true, message: 'Please select Inventory!' }]}
                  >
                    <Select placeholder="Select Inventory">
                      <Select.Option value="ALL">
                        All Inventory
                      </Select.Option>
                      {inventoryList?.data?.content?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                {/* Buttons */}
                <Col xs={24} sm={24} md={24} lg={6}>
                  <Form.Item label=" ">
                    <Space>
                      <AntButton
                        type="primary"
                        htmlType="submit"
                        loading={spareUsageReportLoading || isFetching}
                      >
                        Filter
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Space>
                <Input
                  placeholder="Search"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={handleSearch}
                  allowClear
                  style={{ width: 250 }}
                />
                <Tooltip title="Export Excel">
                  <AntButton
                    type="primary"
                    icon={<FileExcelOutlined />}
                    onClick={handleExportExcel}
                    disabled={spareUsageReportData?.data?.content?.length === 0}
                    style={{ backgroundColor: '#5bd71c', color: '#fff' }}
                  >
                  </AntButton>
                </Tooltip>
                <Tooltip title="Export PDF">
                  <AntButton
                    type="primary"
                    icon={<FilePdfOutlined />}
                    onClick={handleExportPDF}
                    disabled={spareUsageReportData?.data?.content?.length === 0}
                    style={{ backgroundColor: 'rgb(240, 42, 45)', color: '#fff' }}
                  >
                  </AntButton>
                </Tooltip>
              </Space>
            </Box>
            {spareUsageReportLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <Table
                dataSource={filteredData ?? spareUsageReportData?.data?.content}
                columns={columns}
                loading={spareUsageReportLoading || isFetching}
                rowKey={(record, index) => record.id + "_" + index}
                size="middle"
                scroll={{ x: 'max-content' }}
                pagination={{
                  position: ['bottomRight'],
                  current: current,
                  pageSize: pageSize,
                  onChange: setCurrent,
                  showSizeChanger: true,
                  onShowSizeChange: (current, size) => {
                    setPagesize(size);
                    setCurrent(current);
                  },
                  pageSizeOptions: ['25', '50', '100'],
                  showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} items`,
                  className: "custom-pagination"
                }}
              />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}