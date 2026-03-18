import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton, Input, Row, Col, message, Spin } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationByIsStoreQuery, useGetAllInventoryCategoryQuery } from '../../../store/api/masterSettings.api'
import { useGetQuantityReportQuery } from '../../../store/api/reports.api'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'
import { useAuth } from '../../../context/AuthContext'

export default function QuantityReports() {

  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId
  const [form] = Form.useForm()

  const [current, setCurrent] = useState(1)
  const [pageSize, setPagesize] = useState(25)
  const [filters, setFilters] = useState({})

  const { data: inventoryCategoryList, isLoading: inventoryCategoryLoading } = useGetAllInventoryCategoryQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: locationList, isLoading: locationLoading } = useGetLocationByIsStoreQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: quantityReportData, isLoading: quantityReportLoading, isFetching } =
    useGetQuantityReportQuery(
      {
        ...filters,
        pn: 1,
        ps: 1000
      },
      {
        skip: !filters.locationId || !filters.InventoryCategoryId
      }
    )

  const handleFilterChange = (values) => {
    console.log('Filter values:', values)
    const newFilters = {}
    if (values.location) newFilters.locationId = values.location
    if (values.inventoryCategory) newFilters.InventoryCategoryId = values.inventoryCategory
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
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (_, record) => record?.location?.name,
      sorter: (a, b) => (a.location?.name ?? '').localeCompare(b.location?.name ?? '')
    },
    {
      title: 'Inventory Category',
      dataIndex: 'inventoryCategory',
      key: 'inventoryCategory',
      render: (_, record) => record?.inventoryCategory?.name,
      sorter: (a, b) => (a.inventoryCategory?.name ?? '').localeCompare(b.inventoryCategory?.name ?? '')
    },
    {
      title: 'Inventory',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a?.name ?? '').localeCompare(b?.name ?? '')
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a?.quantity - b?.quantity
    },
    {
      title: 'Units',
      dataIndex: 'units',
      key: 'units',
      sorter: (a, b) => (a?.units ?? '').localeCompare(b?.units ?? '')
    }
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

    const filtered = quantityReportData?.data?.content?.filter((item) =>
      `${item?.location?.name ?? ''} ${item?.inventoryCategory?.name ?? ''} ${item?.name ?? ''}
        ${item?.quantity ?? ''} ${item?.units ?? ''}`
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
      const categoryName = inventoryCategoryList.data?.content?.filter(loc => loc.id === filters.InventoryCategoryId)
      console.log(locationName, categoryName)

      await exportToPDF(
        columns,
        quantityReportData?.data?.content,
        `quantity-report (Location: ${locationName[0]?.name ?? 'All'} / Type: ${categoryName[0]?.name ?? 'All'})`
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
      const categoryName = inventoryCategoryList.data?.content?.filter(loc => loc.id === filters.InventoryCategoryId)

      await exportToExcel(
        columns,
        quantityReportData?.data?.content,
        `quantity-report (Location: ${locationName[0]?.name ?? 'All'} / Type: ${categoryName[0]?.name ?? 'All'})`
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
        <title>{getPageTitle('reports/inventory/quantity')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Quantity Reports`} />
      </Helmet>
      <Box>
        {/* <Typography variant="h4" gutterBottom fontWeight="bold">
          Quantity Reports
        </Typography> */}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFilterChange}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Location"
                    name="location"
                    rules={[{ required: true, message: 'Please select location!' }]}
                  >
                    <Select
                      placeholder="Select Location"
                    >
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
                    label="Type"
                    name="inventoryCategory"
                    rules={[{ required: true, message: 'Please select type!' }]}
                  >
                    <Select
                      placeholder="Select Type"
                    >
                      <Select.Option key={-1} value={-1}> All Type</Select.Option>
                      {inventoryCategoryList?.data?.content?.map(l => (
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
                        loading={quantityReportLoading || isFetching}
                        icon={<SearchOutlined />}
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

                <AntButton
                  icon={<FileExcelOutlined />}
                  onClick={handleExportExcel}
                  disabled={!quantityReportData || quantityReportData?.data?.content?.length === 0}
                >
                  Export Excel
                </AntButton>

                <AntButton
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                  disabled={!quantityReportData || quantityReportData?.data?.content?.length === 0}
                >
                  Export PDF
                </AntButton>

              </Space>
            </Box>
            {quantityReportLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <Table
                dataSource={filteredData ?? quantityReportData?.data?.content}
                columns={columns}
                loading={quantityReportLoading || isFetching}
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