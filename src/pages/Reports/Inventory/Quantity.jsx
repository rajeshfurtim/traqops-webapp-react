import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton, Input, Row, Col, message, Spin } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationByIsStoreQuery, useGetAllInventoryCategoryQuery } from '../../../store/api/masterSettings.api'
import { useGetBMRCLQuantityReportQuery } from '../../../store/api/reports.api'
import { useGetAllCategoryListQuery } from '../../../store/api/maintenance.api'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'
import { useAuth } from '../../../context/AuthContext'
// import { loadConfigFromFile } from 'vite'

export default function QuantityReports() {

  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId
  const [form] = Form.useForm()

  const [current, setCurrent] = useState(1)
  const [pageSize, setPagesize] = useState(25)
  const [filters, setFilters] = useState({})

  const { data: inventoryCategoryList, isLoading: inventoryCategoryLoading } = useGetAllInventoryCategoryQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: locationList, isLoading: locationLoading } = useGetLocationByIsStoreQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: assetCategoryList, isLoading: assetCategoryLoading } = useGetAllCategoryListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: quantityReportData, isLoading: quantityReportLoading, isFetching } =
    useGetBMRCLQuantityReportQuery(
      {
        ...filters
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
    if (values.assetCategory && values.assetCategory != -1) newFilters.categoryId = values.assetCategory
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

 useEffect(() => {
  if (locationList?.data?.content?.length) {
    form.setFieldsValue({
      location: locationList.data.content[0].id,
      inventoryCategory: -1,
      assetCategory: -1
    });
  }
}, [locationList]);

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
      dataIndex: 'locationName',
      key: 'locationName',
      sorter: (a, b) => (a?.locationName ?? '').localeCompare(b?.locationName ?? '')
    },
    {
      title: 'Inventory Category',
      dataIndex: 'inventoryCategoryName',
      key: 'inventoryCategoryName',
      sorter: (a, b) => (a?.inventoryCategoryName ?? '').localeCompare(b?.inventoryCategoryName ?? '')
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      sorter: (a, b) => (a?.categoryName ?? '').localeCompare(b?.categoryName ?? '')
    },
    {
      title: 'Inventory',
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
    {
      title: 'Safety Stock',
      dataIndex: 'safetyStock',
      key: 'safetyStock',
      sorter: (a, b) => a?.safetyStock - b?.safetyStock
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

    const filtered = quantityReportData?.data?.filter((item) =>
      `${item?.locationName ?? ''} ${item?.inventoryCategoryName ?? ''} ${item?.categoryName ?? ''}
        ${item?.quantity ?? ''} ${item?.units ?? ''} ${item?.safetyStock ?? ''} ${item?.inventoryName}`
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
      const assetName = assetCategoryList.data?.content?.filter(loc => loc.id === filters.categoryId)
      console.log(locationName, categoryName, assetName)

      await exportToPDF(
        columns,
        quantityReportData?.data,
        `quantity-report (Location: ${locationName[0]?.name ?? 'All'} / Type: ${categoryName[0]?.name ?? 'All'} / Asset Category: ${assetName[0]?.name ?? 'All'})`
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
      const assetName = assetCategoryList.data?.content?.filter(loc => loc.id === filters.categoryId)

      await exportToExcel(
        columns,
        quantityReportData?.data,
        `quantity-report (Location: ${locationName[0]?.name ?? 'All'} / Type: ${categoryName[0]?.name ?? 'All'} / Asset Category: ${assetName[0]?.name ?? 'All'})`
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
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Asset Category"
                    name="assetCategory"
                    rules={[{ required: true, message: 'Please select asset category!' }]}
                  >
                    <Select
                      placeholder="Select Asset Category"
                    >
                      <Select.Option key={-1} value={-1}> All Asset Category</Select.Option>
                      {assetCategoryList?.data?.content?.map(l => (
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
                  disabled={!quantityReportData || quantityReportData?.data?.length === 0}
                >
                  Export Excel
                </AntButton>

                <AntButton
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                  disabled={!quantityReportData || quantityReportData?.data?.length === 0}
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
                dataSource={filteredData ?? quantityReportData?.data}
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